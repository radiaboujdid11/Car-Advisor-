// Collecte des fiches « voitures neuves » de moteur.ma -> fichiers LOCAUX + rapport.
//
//   node scraper/scrape.js                 échantillon de 20 fiches (≈ 4 min)
//   node scraper/scrape.js --limit 100     100 fiches
//   node scraper/scrape.js --all           tout le plan du site (≈ 12 h à 1 requête / 10 s)
//
// IMPORTANT : les conditions d'utilisation de moteur.ma protègent leur base de données.
// Les résultats restent dans data-pipeline/scraped/ (ignoré par git) et servent à VÉRIFIER
// le catalogue ; ne pas les publier sur le site sans l'accord écrit de moteur.ma.

import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { CARS } from '../../frontend/src/data/cars.js';
import { CrawlStopped, createCrawler, parseSitemap } from './crawl.js';
import { parseFiche } from './parse-fiche.js';
import { aggregateByModel, fillRates, normalizeVersion } from './normalize.js';
import { compareWithCatalog, renderReport } from './compare.js';

const ORIGIN = 'https://www.moteur.ma';
const SITEMAP_INDEX = `${ORIGIN}/sitemaps/sitemap.xml`;
const OUT_DIR = fileURLToPath(new URL('../scraped/', import.meta.url));
const CACHE_DIR = fileURLToPath(new URL('../.cache/moteur-ma/', import.meta.url));

function parseArgs(argv) {
  const all = argv.includes('--all');
  const i = argv.indexOf('--limit');
  const limit = all ? Infinity : i >= 0 ? Number(argv[i + 1]) : 20;
  if (!all && (!Number.isInteger(limit) || limit < 1))
    throw new Error('--limit doit être un entier positif');
  return { limit };
}

export async function main(argv = process.argv.slice(2)) {
  const { limit } = parseArgs(argv);
  const startedAt = new Date().toISOString();
  const today = startedAt.slice(0, 10);
  const log = (m) => console.log(`[${new Date().toISOString().slice(11, 19)}] ${m}`);
  const crawler = createCrawler({ cacheDir: CACHE_DIR, log });

  await crawler.loadRobots(ORIGIN);
  log('robots.txt chargé');

  // 1. Plan du site -> fiches « détail » des voitures neuves (une par version)
  const index = parseSitemap((await crawler.get(SITEMAP_INDEX, { version: today })).body ?? '');
  const detailMaps = index.filter((s) => /\/sitemaps\/neuf\/detail-\d+\.xml/.test(s.loc));
  const pages = [];
  for (const map of detailMaps) {
    if (pages.length >= limit) break;
    const { body } = await crawler.get(map.loc, { version: map.lastmod ?? today });
    pages.push(
      ...parseSitemap(body ?? '').filter((u) => /\/fr\/neuf\/voiture\/.+-\d+\.html$/.test(u.loc)),
    );
    log(`${map.loc} : ${pages.length} fiches listées`);
  }
  const todo = pages.slice(0, limit);
  log(`${todo.length} fiches à lire (1 requête toutes les 10 s, cache disque)`);

  // 2. Fiches -> versions normalisées
  const versions = [];
  let partial = Number.isFinite(limit);
  try {
    for (const [n, page] of todo.entries()) {
      const { body, status, fromCache } = await crawler.get(page.loc, { version: page.lastmod });
      if (!body) {
        log(`ignorée (HTTP ${status}) : ${page.loc}`);
        continue;
      }
      versions.push(
        normalizeVersion(parseFiche(body, page.loc), { collectedAt: today, lastmod: page.lastmod }),
      );
      if (!fromCache || (n + 1) % 50 === 0)
        log(`${n + 1}/${todo.length} ${versions.at(-1).marque} ${versions.at(-1).modele}`);
    }
  } catch (err) {
    if (!(err instanceof CrawlStopped)) throw err;
    partial = true;
    log(`ARRÊT : ${err.message}`);
  }

  // 3. Agrégation, qualité, comparaison, rapport
  const models = aggregateByModel(versions);
  const fill = fillRates(versions);
  const comparison = compareWithCatalog(models, CARS);
  const finishedAt = new Date().toISOString();

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(`${OUT_DIR}/versions.json`, JSON.stringify(versions, null, 2));
  writeFileSync(`${OUT_DIR}/modeles.json`, JSON.stringify(models, null, 2));
  writeFileSync(`${OUT_DIR}/comparaison.json`, JSON.stringify(comparison, null, 2));
  writeFileSync(
    `${OUT_DIR}/rapport.md`,
    renderReport(comparison, { versions, models, fill, startedAt, finishedAt, partial }),
  );
  log(`terminé : ${versions.length} versions, ${models.length} modèles -> ${OUT_DIR}rapport.md`);
  return { versions, models, comparison };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
