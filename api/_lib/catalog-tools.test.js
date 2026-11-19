import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CARS } from '../../frontend/src/data/cars.js';
import {
  TOOL_DEFINITIONS,
  comparerVoitures,
  ficheVoiture,
  rechercherVoitures,
  resultatsQuiz,
  runTool,
} from './catalog-tools.js';

test('rechercher_voitures filtre par budget et catégorie, trié par prix', () => {
  const r = rechercherVoitures({ categorie: 'practical', budget_max_dh: 300000, limite: 10 });
  assert.ok(r.total_correspondances > 0);
  for (const v of r.voitures) {
    assert.equal(v.categorie, 'Pratique');
    assert.ok(v.prix_dh <= 300000, `${v.marque} ${v.modele} à ${v.prix_dh} DH`);
    assert.match(v.lien, /^\/cars\/\d+$/);
  }
  const prix = r.voitures.map((v) => v.prix_dh);
  assert.deepEqual(
    prix,
    [...prix].sort((a, b) => a - b),
  );
});

test('rechercher_voitures : marque sans accent ni casse, électriques', () => {
  const dacia = rechercherVoitures({ marque: 'DACIA', limite: 10 });
  assert.ok(dacia.total_correspondances > 0);
  assert.ok(dacia.voitures.every((v) => v.marque === 'Dacia'));

  const elec = rechercherVoitures({ electrique: true, limite: 10 });
  assert.ok(elec.voitures.every((v) => v.energie === 'électrique'));
  assert.equal(
    elec.total_correspondances,
    CARS.filter((c) => c.consumption_l100k === 0 || c.co2_g_km === 0).length,
  );
});

test('rechercher_voitures : marque inconnue -> liste des marques disponibles', () => {
  const r = rechercherVoitures({ marque: 'Trabant' });
  assert.equal(r.total_correspondances, 0);
  assert.ok(r.marques_disponibles.includes('Dacia'));
});

test('fiche_voiture et comparer_voitures renvoient les vraies données', () => {
  const car = CARS[0];
  const fiche = ficheVoiture({ id: car.id });
  assert.equal(fiche.modele, car.model);
  assert.equal(fiche.description, car.description);

  const cmp = comparerVoitures({ ids: [CARS[0].id, CARS[1].id] });
  assert.equal(cmp.voitures.length, 2);
});

test('les entrées invalides du modèle deviennent des erreurs d’outil (pas d’exception)', () => {
  for (const [name, input] of [
    ['fiche_voiture', { id: 999999 }],
    ['fiche_voiture', { id: '12' }],
    ['comparer_voitures', { ids: [1] }],
    ['rechercher_voitures', { categorie: 'camion' }],
    ['rechercher_voitures', { budget_max_dh: -5 }],
    ['rechercher_voitures', 'pas un objet'],
    ['outil_inexistant', {}],
  ]) {
    const r = runTool(name, input);
    assert.equal(r.isError, true, `${name} ${JSON.stringify(input)}`);
  }
});

test('resultats_quiz relit les fiches côté serveur et ignore les ids inconnus', () => {
  assert.equal(resultatsQuiz({}, []).quiz_fait, false);
  const r = resultatsQuiz({}, [
    { id: CARS[0].id, matchScore: 99, price_eur: 1 }, // prix falsifié ignoré
    { id: 999999, matchScore: 80 },
  ]);
  assert.equal(r.recommandations.length, 1);
  assert.equal(r.recommandations[0].score_compatibilite, 99);
  assert.notEqual(r.recommandations[0].prix_dh, 11); // prix réel, pas celui envoyé
});

test('définitions d’outils : noms uniques, schémas fermés, streaming des entrées', () => {
  const names = TOOL_DEFINITIONS.map((t) => t.name);
  assert.equal(new Set(names).size, names.length);
  for (const t of TOOL_DEFINITIONS) {
    assert.equal(t.input_schema.type, 'object');
    assert.equal(t.input_schema.additionalProperties, false);
    assert.equal(t.eager_input_streaming, true);
    assert.ok(t.description.length > 40);
  }
});
