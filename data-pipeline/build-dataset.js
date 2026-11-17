// Construit frontend/src/data/cars.js à partir des catalogues sources.
//
//   node build-dataset.js            -> régénère le fichier
//   node build-dataset.js --dry-run  -> affiche le rapport sans rien écrire
//
// Étapes : chargement -> corrections -> normalisation des marques -> dédoublonnage
//          -> identifiants stables -> tri -> validation -> écriture.

import { writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { EUROPE_MODELS, EUROPE_YEARS } from './sources/europe.js';
import { MOROCCAN_CARS, PRICE_CORRECTIONS, PHOTO_CORRECTIONS } from './sources/maroc.js';
import {
  applyCorrections,
  assignIds,
  dedupe,
  expandEuropeModels,
  normalizeMakes,
  sortCars,
  validate,
} from './transform.js';

const OUTPUT = fileURLToPath(new URL('../frontend/src/data/cars.js', import.meta.url));
const FIELDS = [
  'id',
  'make',
  'model',
  'year',
  'price_eur',
  'power_hp',
  'consumption_l100k',
  'co2_g_km',
  'category',
  'photo_url',
  'carquery_id',
  'description',
  'created_at',
];

const dryRun = process.argv.includes('--dry-run');

async function loadPrevious() {
  if (!existsSync(OUTPUT)) return [];
  const { CARS } = await import(pathToFileURL(OUTPUT).href);
  return CARS;
}

function pickFields(car) {
  return Object.fromEntries(FIELDS.map((f) => [f, car[f] ?? null]));
}

const raw = [
  ...expandEuropeModels(EUROPE_MODELS, EUROPE_YEARS),
  ...MOROCCAN_CARS.map((car) => ({ photo_url: null, ...car })),
];
const corrected = normalizeMakes(applyCorrections(raw, PRICE_CORRECTIONS, PHOTO_CORRECTIONS));
const { cars: unique, dropped } = dedupe(corrected);

const previous = await loadPrevious();
const today = new Date().toISOString().slice(0, 19).replace('T', ' ');
const cars = sortCars(assignIds(unique, previous, today)).map(pickFields);

const errors = validate(cars);
const makes = [...new Set(cars.map((c) => c.make))].sort();
const byCategory = Object.groupBy
  ? Object.fromEntries(
      Object.entries(Object.groupBy(cars, (c) => c.category)).map(([k, v]) => [k, v.length]),
    )
  : {};

console.log(
  `Lignes sources        : ${raw.length} (Europe ${raw.length - MOROCCAN_CARS.length}, Maroc ${MOROCCAN_CARS.length})`,
);
console.log(`Doublons écartés      : ${dropped.length}`);
for (const d of dropped) console.log(`  - ${d.make} ${d.model} ${d.year} (${d.carquery_id})`);
console.log(`Voitures finales      : ${cars.length} — ${makes.length} marques`);
console.log(`Par catégorie         : ${JSON.stringify(byCategory)}`);

if (errors.length) {
  console.error(`\n${errors.length} erreur(s) de validation :`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

if (dryRun) {
  console.log('\n--dry-run : aucun fichier écrit.');
} else {
  const js = `// FICHIER GÉNÉRÉ — ne pas modifier à la main.
// Source : data-pipeline/sources/ — régénérer avec : cd data-pipeline && npm run build
// ${cars.length} voitures

export const CARS = ${JSON.stringify(cars, null, 2)};

export const ALL_MAKES = ${JSON.stringify(makes, null, 2)};
`;
  writeFileSync(OUTPUT, js, 'utf8');
  console.log(`\nÉcrit : ${OUTPUT}`);
}
