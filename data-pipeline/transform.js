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
