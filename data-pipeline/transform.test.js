import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyVerifications,
  applyCorrections,
  assignIds,
  dedupe,
  expandEuropeModels,
  fromPressAdditions,
  normalizeMakes,
  validate,
} from './transform.js';

const base = {
  power_hp: 100,
  consumption_l100k: 5,
  co2_g_km: 120,
  category: 'eco',
  photo_url: null,
};

test('expandEuropeModels crée une voiture par année avec le bon prix', () => {
  const cars = expandEuropeModels(
    [
      {
        ...base,
        make: 'Kia',
        model: 'Ceed',
        price_2023: 100,
        price_2024: 110,
        description: 'Kia Ceed — x',
      },
    ],
    [2023, 2024],
  );
  assert.equal(cars.length, 2);
  assert.deepEqual(
    cars.map((c) => [c.year, c.price_eur, c.carquery_id]),
    [
      [2023, 100, 'kia-ceed-2023'],
      [2024, 110, 'kia-ceed-2024'],
    ],
  );
  assert.equal(cars[0].description, 'Kia Ceed 2023 — x');
});

test("applyCorrections remplace le prix et n'écrase pas une photo existante", () => {
  const cars = [
    { ...base, carquery_id: 'a', price_eur: 1, photo_url: 'garde.png' },
    { ...base, carquery_id: 'b', price_eur: 2 },
  ];
  const out = applyCorrections(
    cars,
    [{ carquery_id: 'a', price_eur: 10 }],
    [
      { carquery_id: 'a', photo_url: 'nouvelle.png' },
      { carquery_id: 'b', photo_url: 'b.png' },
    ],
  );
  assert.equal(out[0].price_eur, 10);
  assert.equal(out[0].photo_url, 'garde.png');
  assert.equal(out[1].photo_url, 'b.png');
});

test('dedupe garde la fiche marocaine en cas de doublon', () => {
  const eu = {
    ...base,
    make: 'Renault',
    model: 'Clio',
    year: 2023,
    carquery_id: 'renault-clio-2023',
  };
  const ma = {
    ...base,
    make: 'Renault',
    model: 'Clio',
    year: 2023,
    carquery_id: 'ma_renault_clio_2023',
  };
  const other = {
    ...base,
    make: 'Renault',
    model: 'Clio',
    year: 2024,
    carquery_id: 'renault-clio-2024',
  };
  const { cars, dropped } = dedupe([eu, other, ma]);
  assert.deepEqual(
    cars.map((c) => c.carquery_id),
    ['renault-clio-2024', 'ma_renault_clio_2023'],
  );
  assert.deepEqual(
    dropped.map((c) => c.carquery_id),
    ['renault-clio-2023'],
  );
});

test('normalizeMakes unifie les variantes de marque', () => {
  assert.equal(normalizeMakes([{ make: 'Mercedes' }])[0].make, 'Mercedes-Benz');
});

test('assignIds conserve les identifiants publiés et numérote les nouveaux', () => {
  const previous = [{ id: 7, carquery_id: 'a', created_at: 'hier' }];
  const out = assignIds([{ carquery_id: 'a' }, { carquery_id: 'b' }], previous, "aujourd'hui");
  assert.deepEqual(
    out.map((c) => [c.id, c.created_at]),
    [
      [7, 'hier'],
      [8, "aujourd'hui"],
    ],
  );
});

test('validate signale les fiches incohérentes', () => {
  const ok = { ...base, id: 1, make: 'Kia', model: 'Ceed', year: 2024, price_eur: 100 };
  assert.deepEqual(validate([ok]), []);
  const errors = validate([ok, { ...ok, price_eur: 0, category: 'spaceship' }]);
  assert.equal(errors.length, 3); // id en double, prix, catégorie
});

test('applyVerifications remplace le prix vérifié et ajoute date, source et lien', () => {
  const cars = [
    { carquery_id: 'ma_a', price_eur: 1000 },
    { carquery_id: 'ma_b', price_eur: 2000 },
  ];
  const { cars: out, unknown } = applyVerifications(
    cars,
    {
      ma_a: {
        prix_dh: 216000,
        source: 'marque',
        url: 'https://marque.test/a',
        verifie_le: '2026-11-25',
      },
      ma_disparue: { prix_dh: 1, source: 'moteur.ma', verifie_le: '2026-11-25' },
    },
    10.8,
  );
  assert.deepEqual(out[0], {
    carquery_id: 'ma_a',
    price_eur: 20000,
    price_verified_at: '2026-11-25',
    price_launch_at: null,
    price_source: 'marque',
    price_source_url: 'https://marque.test/a',
  });
  assert.equal(out[1].price_eur, 2000);
  assert.equal(out[1].price_verified_at, null);
  assert.deepEqual(unknown, ['ma_disparue']);
});

const pressEntry = {
  marque: 'Citroën',
  modele: 'C3 Aircross',
  annee: 2025,
  prix_dh: 216000,
  puissance_ch: 145,
  consommation_l100k: null,
  co2_g_km: 124,
  categorie: 'practical',
  description: 'SUV compact.',
  source: { journal: 'Le Matin', url: 'https://lematin.ma/a', publie_le: '2025-10-28' },
};

test('fromPressAdditions crée une voiture avec la date et la source du prix de lancement', () => {
  const { cars, errors } = fromPressAdditions([pressEntry], 10.8);
  assert.deepEqual(errors, []);
  assert.equal(cars.length, 1);
  const car = cars[0];
  assert.equal(car.carquery_id, 'ma_presse_citroen_c3_aircross_2025');
  assert.equal(car.price_eur, 20000);
  assert.equal(car.consumption_l100k, null);
  assert.equal(car.price_launch_at, '2025-10-28');
  assert.equal(car.price_source, 'Le Matin');
  assert.equal(car.price_source_url, 'https://lematin.ma/a');
});

test('fromPressAdditions refuse un article ancien, sans lien https ou sans puissance', () => {
  const { cars, errors } = fromPressAdditions(
    [
      { ...pressEntry, source: { ...pressEntry.source, publie_le: '2023-06-21' } },
      { ...pressEntry, source: { ...pressEntry.source, url: 'http://x' } },
      { ...pressEntry, puissance_ch: null },
    ],
    10.8,
  );
  assert.equal(cars.length, 0);
  assert.equal(errors.length, 3);
  assert.match(errors[0], /antérieur/);
  assert.match(errors[1], /https/);
  assert.match(errors[2], /puissance/);
});

test('un prix vérifié remplace le prix de lancement annoncé par la presse', () => {
  const { cars } = fromPressAdditions([pressEntry], 10.8);
  const id = cars[0].carquery_id;
  const kept = applyVerifications(cars, {}, 10.8).cars[0];
  assert.equal(kept.price_launch_at, '2025-10-28');
  assert.equal(kept.price_source, 'Le Matin');
  const verified = applyVerifications(
    cars,
    { [id]: { prix_dh: 226800, source: 'marque', url: 'https://m', verifie_le: '2026-11-24' } },
    10.8,
  ).cars[0];
  assert.equal(verified.price_launch_at, null);
  assert.equal(verified.price_verified_at, '2026-11-24');
  assert.equal(verified.price_eur, 21000);
});
