// Étapes de transformation du jeu de données (fonctions pures, sans entrée/sortie).

export const CATEGORIES = ['eco', 'practical', 'performance', 'luxury'];

// Variantes d'écriture d'une même marque -> nom canonique.
const MAKE_ALIASES = { Mercedes: 'Mercedes-Benz' };

const europeId = (make, model, year) =>
  `${make}-${model}-${year}`.toLowerCase().replace(/[\s']/g, '-');

/** Déplie le catalogue Europe : un modèle -> une voiture par année. */
export function expandEuropeModels(models, years) {
  return models.flatMap((car) =>
    years.map((year) => ({
      make: car.make,
      model: car.model,
      year,
      price_eur: car[`price_${year}`],
      power_hp: car.power_hp,
      consumption_l100k: car.consumption_l100k,
      co2_g_km: car.co2_g_km,
      category: car.category,
      photo_url: null,
      carquery_id: europeId(car.make, car.model, year),
      description: car.description.replace(/—/, `${year} —`),
    })),
  );
}

/**
 * Prix vérifiés (contrôle qualité, voir data-pipeline/collecte/) : remplace le prix et
 * ajoute la date, la source et le lien de la vérification. Clé : carquery_id.
 * Renvoie aussi les clés inconnues (vérification qui ne correspond plus à aucune voiture).
 */
export function applyVerifications(cars, verifications, eurToMad) {
  const used = new Set();
  const out = cars.map((car) => {
    const v = verifications[car.carquery_id];
    if (!v) {
      return {
        ...car,
        price_verified_at: null,
        price_launch_at: car.price_launch_at ?? null,
        price_source: car.price_source ?? null,
        price_source_url: car.price_source_url ?? null,
      };
    }
    used.add(car.carquery_id);
    // Un prix vérifié remplace un éventuel prix de lancement annoncé par la presse.
    return {
      ...car,
      price_eur: Math.round(v.prix_dh / eurToMad),
      price_verified_at: v.verifie_le,
      price_launch_at: null,
      price_source: v.source,
      price_source_url: v.url ?? null,
    };
  });
  const unknown = Object.keys(verifications).filter((key) => !used.has(key));
  return { cars: out, unknown };
}

// Règles des ajouts sourcés par la presse (voir docs/journal-donnees.md).
const PRESS_MIN_DATE = '2024-01-01';
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const slug = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

/**
 * Modèles ajoutés à partir d'un article de presse daté (sources/ajouts-presse.json).
 * Le prix est un prix de lancement annoncé : la fiche affiche sa date et le journal.
 * Retourne les voitures et la liste des erreurs (une entrée invalide n'est pas ajoutée).
 */
export function fromPressAdditions(entries, eurToMad) {
  const cars = [];
  const errors = [];
  for (const e of entries) {
    const label = `ajouts-presse.json : ${e.marque ?? '?'} ${e.modele ?? '?'}`;
    const src = e.source ?? {};
    const problems = [];
    if (!e.marque || !e.modele) problems.push('marque ou modèle manquant');
    if (!Number.isInteger(e.annee)) problems.push('année invalide');
    if (!(Number.isInteger(e.prix_dh) && e.prix_dh > 0)) problems.push('prix_dh invalide');
    if (!(e.puissance_ch > 0)) problems.push('puissance_ch invalide');
    if (!CATEGORIES.includes(e.categorie)) problems.push(`catégorie inconnue « ${e.categorie} »`);
    if (!e.description) problems.push('description manquante');
    for (const key of ['consommation_l100k', 'co2_g_km'])
      if (e[key] !== null && !(typeof e[key] === 'number' && e[key] >= 0))
        problems.push(`${key} doit être un nombre ou null`);
    if (!src.journal) problems.push('journal manquant');
    if (!/^https:\/\//.test(src.url ?? ''))
      problems.push('lien de l’article manquant ou non https');
    if (!ISO_DATE.test(src.publie_le ?? '')) problems.push('date de publication invalide');
    else if (src.publie_le < PRESS_MIN_DATE)
      problems.push(`article antérieur au ${PRESS_MIN_DATE}`);
    if (problems.length) {
      errors.push(...problems.map((p) => `${label} : ${p}`));
      continue;
    }
    cars.push({
      make: e.marque,
      model: e.modele,
      year: e.annee,
      price_eur: Math.round(e.prix_dh / eurToMad),
      power_hp: e.puissance_ch,
      consumption_l100k: e.consommation_l100k,
      co2_g_km: e.co2_g_km,
      category: e.categorie,
      photo_url: null,
      carquery_id: `ma_presse_${slug(e.marque)}_${slug(e.modele)}_${e.annee}`,
      description: e.description,
      price_launch_at: src.publie_le,
      price_source: src.journal,
      price_source_url: src.url,
    });
  }
  return { cars, errors };
}

/** Applique les corrections de prix (toujours) et de photo (seulement si absente). */
export function applyCorrections(cars, priceCorrections, photoCorrections) {
  const prices = new Map(priceCorrections.map((c) => [c.carquery_id, c.price_eur]));
  const photos = new Map(photoCorrections.map((c) => [c.carquery_id, c.photo_url]));
  return cars.map((car) => ({
    ...car,
    price_eur: prices.get(car.carquery_id) ?? car.price_eur,
    photo_url: car.photo_url || photos.get(car.carquery_id) || null,
  }));
}

export function normalizeMakes(cars) {
  return cars.map((car) => ({ ...car, make: MAKE_ALIASES[car.make] ?? car.make }));
}

const isMoroccan = (car) => car.carquery_id.startsWith('ma_');
const dedupeKey = (car) => `${car.make}|${car.model}|${car.year}`.toLowerCase();

/**
 * Supprime les doublons (même marque, modèle et année).
 * En cas de conflit, la fiche du catalogue marocain est conservée : c'est le marché ciblé.
 * Retourne aussi la liste des fiches écartées pour le rapport.
 */
export function dedupe(cars) {
  const kept = new Map();
  const dropped = [];
  for (const car of cars) {
    const key = dedupeKey(car);
    const current = kept.get(key);
    if (!current) {
      kept.set(key, car);
    } else if (isMoroccan(car) && !isMoroccan(current)) {
      kept.set(key, car);
      dropped.push(current);
    } else {
      dropped.push(car);
    }
  }
  const keptSet = new Set(kept.values());
  return { cars: cars.filter((car) => keptSet.has(car)), dropped };
}

/**
 * Conserve les identifiants déjà publiés (URL /cars/:id stables) ;
 * les nouvelles voitures reçoivent un identifiant à la suite.
 */
export function assignIds(cars, previous, today) {
  const byKey = new Map(previous.map((p) => [p.carquery_id, p]));
  let nextId = Math.max(0, ...previous.map((p) => p.id)) + 1;
  return cars.map((car) => {
    const prev = byKey.get(car.carquery_id);
    return {
      id: prev ? prev.id : nextId++,
      ...car,
      created_at: prev ? prev.created_at : today,
    };
  });
}

/** Tri par marque puis modèle (ordre binaire), puis identifiant. */
export function sortCars(cars) {
  const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
  return [...cars].sort((a, b) => cmp(a.make, b.make) || cmp(a.model, b.model) || a.id - b.id);
}

/** Vérifie la cohérence de chaque fiche ; retourne la liste des erreurs. */
export function validate(cars) {
  const errors = [];
  const ids = new Set();
  for (const car of cars) {
    const label = `${car.make} ${car.model} ${car.year}`;
    if (ids.has(car.id)) errors.push(`${label} : identifiant ${car.id} en double`);
    ids.add(car.id);
    if (!car.make || !car.model) errors.push(`${label} : marque ou modèle manquant`);
    if (!Number.isInteger(car.year)) errors.push(`${label} : année invalide`);
    if (!(car.price_eur > 0)) errors.push(`${label} : prix invalide`);
    if (!(car.power_hp > 0)) errors.push(`${label} : puissance invalide`);
    if (!CATEGORIES.includes(car.category))
      errors.push(`${label} : catégorie inconnue « ${car.category} »`);
  }
  return errors;
}
