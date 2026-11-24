// Normalisation des fiches brutes, agrégation par modèle et règle de catégorie.
// Fonctions pures, testées dans normalize.test.js.

/** « 480 000 Dhs » -> 480000 ; « 6,5 L/100km » -> 6.5 ; « - » ou vide -> null. */
export function toNumber(text) {
  if (text === null || text === undefined) return null;
  const m = String(text)
    .replace(/[\s  ]/g, '')
    .match(/-?\d+(?:[.,]\d+)?/);
  return m ? Number(m[0].replace(',', '.')) : null;
}

const norm = (s) =>
  String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/** Énergie normalisée à partir de « Motorisation » et « Propulsion ». */
export function energie(motorisation, propulsion) {
  const m = norm(motorisation);
  const p = norm(propulsion);
  if (p === 'bev' || /electrique/.test(m)) return 'electrique';
  if (p === 'phev' || /rechargeable|plug/.test(m)) return 'hybride_rechargeable';
  if (/hev|mhev/.test(p) || /hybride/.test(m)) return 'hybride';
  if (/diesel/.test(m)) return 'diesel';
  if (/essence/.test(m)) return 'essence';
  return m ? `autre:${m}` : null;
}

/** Fiche brute -> version normalisée (nombres, énergie). */
export function normalizeVersion(raw, { collectedAt, lastmod } = {}) {
  return {
    source_id: raw.source_id,
    source_url: raw.source_url,
    marque: raw.marque?.trim() || null,
    modele: raw.modele?.trim() || null,
    version: raw.version?.trim() || null,
    annee: toNumber(raw.annee),
    energie: energie(raw.motorisation, raw.propulsion),
    transmission: raw.transmission || null,
    carrosserie: raw.carrosserie || null,
    portes: toNumber(raw.portes),
    places: toNumber(raw.places),
    prix_showroom_dh: toNumber(raw.prix_showroom),
    prix_cle_en_main_dh: toNumber(raw.prix_cle_en_main),
    puissance_ch: toNumber(raw.puissance),
    consommation_l100km: toNumber(raw.consommation_mixte),
    co2_g_km: toNumber(raw.co2),
    autonomie_km: toNumber(raw.autonomie_electrique),
    batterie_kwh: toNumber(raw.batterie),
    date_collecte: collectedAt ?? null,
    lastmod_sitemap: lastmod ?? null,
  };
}

// ─── Catégorie (règle explicite, seuils modifiables) ─────────────────────────
// moteur.ma ne fournit pas les catégories du quiz : on les déduit. Les seuils sont des
// hypothèses de départ ; le rapport mesure leur accord avec le catalogue actuel.

export const CATEGORY_RULES = {
  performanceMinCh: 300,
  sportBodies: /coupe|cabriolet|roadster|sport/,
  luxuryMinPriceDh: 600000,
  ecoMaxPriceDh: 200000,
};

export function categorie(model, rules = CATEGORY_RULES) {
  const body = norm(model.carrosserie);
  if ((model.puissance_max_ch ?? 0) >= rules.performanceMinCh || rules.sportBodies.test(body)) {
    return 'performance';
  }
  if ((model.prix_min_dh ?? 0) >= rules.luxuryMinPriceDh) return 'luxury';
  const electrified = model.energies.some((e) => e === 'electrique' || e.startsWith('hybride'));
  if (electrified || (model.prix_min_dh !== null && model.prix_min_dh < rules.ecoMaxPriceDh)) {
    return 'eco';
  }
  return 'practical';
}

// ─── Agrégation par modèle ───────────────────────────────────────────────────

const minOf = (xs) => (xs.length ? Math.min(...xs) : null);
const maxOf = (xs) => (xs.length ? Math.max(...xs) : null);
const nums = (versions, key) => versions.map((v) => v[key]).filter((x) => Number.isFinite(x));

/** Versions -> une ligne par (marque, modèle), sur l'année la plus récente disponible. */
export function aggregateByModel(versions) {
  const groups = new Map();
  for (const v of versions) {
    if (!v.marque || !v.modele) continue;
    const key = `${norm(v.marque)}|${norm(v.modele)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(v);
  }
  const models = [];
  for (const all of groups.values()) {
    const latest = maxOf(nums(all, 'annee'));
    const vs = latest === null ? all : all.filter((v) => v.annee === latest);
    const priced = vs.filter((v) => Number.isFinite(v.prix_showroom_dh));
    const entry = priced.sort((a, b) => a.prix_showroom_dh - b.prix_showroom_dh)[0] ?? vs[0];
    const model = {
      marque: entry.marque,
      modele: entry.modele,
      annee: latest,
      nb_versions: vs.length,
      version_entree: entry.version,
      prix_min_dh: minOf(nums(vs, 'prix_showroom_dh')),
      prix_max_dh: maxOf(nums(vs, 'prix_showroom_dh')),
      puissance_min_ch: minOf(nums(vs, 'puissance_ch')),
      puissance_max_ch: maxOf(nums(vs, 'puissance_ch')),
      consommation_min_l100km: minOf(nums(vs, 'consommation_l100km')),
      co2_min_g_km: minOf(nums(vs, 'co2_g_km')),
      places_max: maxOf(nums(vs, 'places')),
      energies: [...new Set(vs.map((v) => v.energie).filter(Boolean))].sort(),
      carrosserie: entry.carrosserie,
      source_urls: vs.map((v) => v.source_url),
      date_collecte: maxOf(vs.map((v) => v.date_collecte).filter(Boolean)) ?? null,
    };
    model.categorie = categorie(model);
    models.push(model);
  }
  return models.sort((a, b) => `${a.marque} ${a.modele}`.localeCompare(`${b.marque} ${b.modele}`));
}

/** Taux de remplissage de chaque champ (qualité des données). */
export function fillRates(rows) {
  if (!rows.length) return {};
  const keys = Object.keys(rows[0]);
  return Object.fromEntries(
    keys.map((k) => [
      k,
      Math.round(
        (rows.filter((r) => r[k] !== null && r[k] !== undefined).length / rows.length) * 100,
      ),
    ]),
  );
}
