// Tests du collecteur. La fiche ci-dessous est FICTIVE : elle reproduit seulement la
// structure HTML des pages (aucun contenu copié du site).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { extractPairs, parseFiche, sourceIdFromUrl, textOf } from './parse-fiche.js';
import {
  aggregateByModel,
  categorie,
  energie,
  fillRates,
  normalizeVersion,
  toNumber,
} from './normalize.js';
import { CrawlStopped, createCrawler, isAllowed, parseRobots, parseSitemap } from './crawl.js';
import { compareWithCatalog } from './compare.js';

const FICHE = `
<table><tbody>
  <tr><td><span class="font-weight-bold"> Prix en showroom </span></td><td dir="ltr"> 250 000 Dhs </td></tr>
  <tr><td><span class="font-weight-bold"> Prix clé en main </span></td><td class="text-primary"> 258 400 Dhs </td></tr>
</tbody></table>
<table><tbody>
  <tr><td><span class="font-weight-bold">Marque :</span> Exemplia</td><td><span class="font-weight-bold">Année :</span> 2026</td></tr>
  <tr><td><span class="font-weight-bold">Modèle :</span> Familia</td><td><span class="font-weight-bold">Transmission :</span> Manuelle</td></tr>
  <tr><td><span class="font-weight-bold">Version :</span> 1.5 Confort</td><td><span class="font-weight-bold">Type :</span> SUV et 4x4</td></tr>
  <tr><td><span class="font-weight-bold">Motorisation :</span> Hybride</td><td><span class="font-weight-bold">Nombre de portes :</span> 5</td></tr>
  <tr><td><span class="font-weight-bold"> Propulsion : </span><span class="propulsion-value"> HEV <span class="propulsion-info" data-tooltip="aide">i</span></span></td>
      <script>window.x = 1;</script><td><span class="font-weight-bold">Nombre de places :</span> 7</td></tr>
</tbody></table>
<table><tbody>
  <tr><td class="font-weight-bold"> Puissance réelle (ch) </td><td><span>140 ch</span></td></tr>
  <tr><td class="font-weight-bold"> Consommation mixte </td><td> 4,9 L/100km </td></tr>
  <tr><td class="font-weight-bold"> Capacité de la batterie </td><td> - </td></tr>
</tbody></table>`;
const URL_FICHE =
  'https://exemple.test/fr/neuf/voiture/exemplia/familia/exemplia-familia-15-confort-1234.html';

test('parseFiche lit les deux formes de tableaux et ignore les bulles d’aide', () => {
  const f = parseFiche(FICHE, URL_FICHE);
  assert.equal(f.source_id, 1234);
  assert.equal(f.marque, 'Exemplia');
  assert.equal(f.modele, 'Familia');
  assert.equal(f.version, '1.5 Confort');
  assert.equal(f.carrosserie, 'SUV et 4x4');
  assert.equal(f.propulsion, 'HEV');
  assert.equal(f.places, '7');
  assert.equal(f.prix_showroom, '250 000 Dhs');
  assert.equal(f.puissance, '140 ch');
  assert.equal(f.batterie, null); // « - » -> absent
});

test('textOf décode les entités et retire balises et scripts', () => {
  assert.equal(textOf('<b>Citro&euml;n</b> &amp; <i>C&#233;</i>'), 'Citro&euml;n & Cé');
  assert.equal(textOf('a<script>x()</script>b'), 'a b');
  assert.equal(Object.keys(extractPairs('<tr><td>seule cellule</td></tr>')).length, 0);
  assert.equal(sourceIdFromUrl('https://x/y-42.html?a=1'), 42);
});

test('normalisation : nombres, énergie, dates', () => {
  assert.equal(toNumber('480 000 Dhs'), 480000);
  assert.equal(toNumber('4,9 L/100km'), 4.9);
  assert.equal(toNumber('-'), null);
  assert.equal(toNumber(null), null);
  assert.equal(energie('Électrique', 'BEV'), 'electrique');
  assert.equal(energie('Hybride rechargeable', ''), 'hybride_rechargeable');
  assert.equal(energie('Essence', 'MHEV'), 'hybride');
  assert.equal(energie('Diesel', 'ICE'), 'diesel');
  assert.equal(energie(null, null), null);

  const v = normalizeVersion(parseFiche(FICHE, URL_FICHE), {
    collectedAt: '2026-11-24',
    lastmod: '2026-11-20',
  });
  assert.equal(v.prix_showroom_dh, 250000);
  assert.equal(v.puissance_ch, 140);
  assert.equal(v.consommation_l100km, 4.9);
  assert.equal(v.energie, 'hybride');
  assert.equal(v.annee, 2026);
  assert.equal(v.date_collecte, '2026-11-24');
});

const version = (over) => ({
  marque: 'Exemplia',
  modele: 'Familia',
  version: 'v',
  annee: 2026,
  energie: 'essence',
  carrosserie: 'SUV et 4x4',
  places: 5,
  prix_showroom_dh: 300000,
  puissance_ch: 130,
  consommation_l100km: null,
  co2_g_km: null,
  source_url: 'u',
  date_collecte: '2026-11-24',
  ...over,
});

test('agrégation par modèle : année la plus récente, fourchettes, version d’entrée', () => {
  const models = aggregateByModel([
    version({ version: 'Confort', prix_showroom_dh: 300000, puissance_ch: 130 }),
    version({ version: 'Base', prix_showroom_dh: 250000, puissance_ch: 110, energie: 'hybride' }),
    version({ version: 'Ancienne', annee: 2025, prix_showroom_dh: 100000 }),
    version({ marque: null }), // ignorée
  ]);
  assert.equal(models.length, 1);
  const m = models[0];
  assert.equal(m.annee, 2026);
  assert.equal(m.nb_versions, 2);
  assert.equal(m.version_entree, 'Base');
  assert.deepEqual([m.prix_min_dh, m.prix_max_dh], [250000, 300000]);
  assert.deepEqual([m.puissance_min_ch, m.puissance_max_ch], [110, 130]);
  assert.deepEqual(m.energies, ['essence', 'hybride']);
  assert.equal(m.categorie, 'eco'); // une version hybride
});

test('règle de catégorie', () => {
  const base = {
    energies: ['essence'],
    carrosserie: 'SUV et 4x4',
    prix_min_dh: 300000,
    puissance_max_ch: 150,
  };
  assert.equal(categorie(base), 'practical');
  assert.equal(categorie({ ...base, puissance_max_ch: 400 }), 'performance');
  assert.equal(categorie({ ...base, carrosserie: 'Coupé' }), 'performance');
  assert.equal(categorie({ ...base, prix_min_dh: 900000 }), 'luxury');
  assert.equal(categorie({ ...base, prix_min_dh: 150000 }), 'eco');
  assert.equal(categorie({ ...base, energies: ['electrique'] }), 'eco');
});

test('taux de remplissage', () => {
  assert.deepEqual(
    fillRates([
      { a: 1, b: null },
      { a: 2, b: 3 },
    ]),
    { a: 100, b: 50 },
  );
});

test('robots.txt : seules les règles « User-agent: * » s’appliquent', () => {
  const robots = parseRobots(
    'User-agent: *\nDisallow: /storage/\nDisallow: /vendor/\n\nUser-agent: AhrefsBot\nDisallow: /\n',
  );
  assert.deepEqual(robots.disallow, ['/storage/', '/vendor/']);
  assert.equal(isAllowed('https://x.test/fr/neuf/voiture/a-1.html', robots), true);
  assert.equal(isAllowed('https://x.test/storage/media/img.png', robots), false);
});

test('sitemap : index et liste d’URL avec lastmod', () => {
  const xml = `<urlset><url><loc>https://x.test/a-1.html</loc><lastmod>2026-11-20</lastmod></url>
    <url><loc>https://x.test/b-2.html?x=1&amp;y=2</loc></url></urlset>`;
  assert.deepEqual(parseSitemap(xml), [
    { loc: 'https://x.test/a-1.html', lastmod: '2026-11-20' },
    { loc: 'https://x.test/b-2.html?x=1&y=2', lastmod: null },
  ]);
});

function fakeFetch(responses) {
  const calls = [];
  return {
    calls,
    fetch: async (url, init) => {
      calls.push({ url, at: Date.now(), ua: init.headers['User-Agent'] });
      const r = responses[url] ?? { status: 404, body: '' };
      return { status: r.status, ok: r.status >= 200 && r.status < 300, text: async () => r.body };
    },
  };
}

test('collecteur : délai entre requêtes, cache, robots.txt, arrêt sur 429', async () => {
  const f = fakeFetch({
    'https://x.test/robots.txt': { status: 200, body: 'User-agent: *\nDisallow: /storage/' },
    'https://x.test/a.html': { status: 200, body: 'A' },
    'https://x.test/b.html': { status: 200, body: 'B' },
    'https://x.test/bloque.html': { status: 429, body: '' },
  });
  const crawler = createCrawler({
    cacheDir: mkdtempSync(join(tmpdir(), 'crawl-')),
    delayMs: 120,
    fetchImpl: f.fetch,
  });
  await crawler.loadRobots('https://x.test');
  assert.equal((await crawler.get('https://x.test/a.html', { version: '1' })).body, 'A');
  assert.equal((await crawler.get('https://x.test/b.html', { version: '1' })).body, 'B');
  const again = await crawler.get('https://x.test/a.html', { version: '1' });
  assert.equal(again.fromCache, true);
  assert.equal(f.calls.length, 3); // robots + a + b ; le 2e « a » vient du cache
  assert.ok(f.calls[2].at - f.calls[1].at >= 110, 'délai respecté entre deux requêtes');
  assert.match(f.calls[0].ua, /AutoAssistDataBot/);

  await assert.rejects(crawler.get('https://x.test/storage/x.png'), CrawlStopped);
  await assert.rejects(crawler.get('https://x.test/bloque.html'), CrawlStopped);
});

test('comparaison avec le catalogue : présence, écart de prix, catégorie', () => {
  const models = aggregateByModel([
    version({ marque: 'Exemplia', modele: 'Familia', prix_showroom_dh: 216000 }),
  ]);
  const catalog = [
    {
      make: 'Exemplia',
      model: 'Familia',
      year: 2025,
      price_eur: 20000,
      category: 'practical',
      power_hp: 130,
    },
    {
      make: 'Autre',
      model: 'Absente',
      year: 2025,
      price_eur: 10000,
      category: 'eco',
      power_hp: 70,
    },
  ];
  const { stats, rows } = compareWithCatalog(models, catalog);
  assert.equal(stats.modeles_catalogue, 2);
  assert.equal(stats.trouves_chez_la_source, 1);
  const r = rows.find((x) => x.trouve);
  assert.equal(r.prix_catalogue_dh, 216000);
  assert.equal(r.ecart_pct, 0);
  assert.equal(r.dans_la_fourchette, true);
  assert.equal(r.categorie_regle, 'practical');
});
