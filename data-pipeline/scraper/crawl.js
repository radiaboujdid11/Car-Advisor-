// Accès réseau poli : robots.txt respecté, une requête toutes les 10 s, cache disque,
// arrêt immédiat si le site refuse (403/429). Aucune image téléchargée.

import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

export const USER_AGENT =
  'AutoAssistDataBot/1.0 (projet etudiant ; collecte lente, 1 requete/10 s)';
export const DEFAULT_DELAY_MS = 10_000;

export class CrawlStopped extends Error {}

/** Règles « User-agent: * » d'un robots.txt : chemins interdits. */
export function parseRobots(text) {
  const disallow = [];
  let applies = false;
  for (const raw of text.split('\n')) {
    const line = raw.replace(/#.*/, '').trim();
    const m = line.match(/^([a-z-]+)\s*:\s*(.*)$/i);
    if (!m) continue;
    const [, field, value] = m;
    if (/^user-agent$/i.test(field)) applies = value.trim() === '*';
    else if (applies && /^disallow$/i.test(field) && value.trim()) disallow.push(value.trim());
  }
  return { disallow };
}

export function isAllowed(url, robots) {
  const path = new URL(url).pathname;
  return !robots.disallow.some((prefix) => path.startsWith(prefix));
}

/** Entrées <url> d'un sitemap (ou <sitemap> d'un index) : { loc, lastmod }. */
export function parseSitemap(xml) {
  return [...xml.matchAll(/<(?:url|sitemap)>([\s\S]*?)<\/(?:url|sitemap)>/g)].map(([, body]) => ({
    loc: decode(body.match(/<loc>([\s\S]*?)<\/loc>/)?.[1]?.trim() ?? ''),
    lastmod: body.match(/<lastmod>([\s\S]*?)<\/lastmod>/)?.[1]?.trim() ?? null,
  }));
}
const decode = (s) => s.replace(/&amp;/g, '&');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Client HTTP poli. `fetchImpl` est injectable pour les tests.
 * Le cache évite de re-télécharger une page déjà lue (même URL + même lastmod).
 */
export function createCrawler({
  cacheDir,
  delayMs = DEFAULT_DELAY_MS,
  fetchImpl = fetch,
  log = () => {},
} = {}) {
  let last = 0;
  let robots = null;
  if (cacheDir) mkdirSync(cacheDir, { recursive: true });

  const cachePath = (url, version) =>
    cacheDir &&
    join(
      cacheDir,
      createHash('sha1')
        .update(`${url}|${version ?? ''}`)
        .digest('hex') + '.html',
    );

  async function get(url, { version } = {}) {
    if (robots && !isAllowed(url, robots))
      throw new CrawlStopped(`interdit par robots.txt : ${url}`);
    const cached = cachePath(url, version);
    if (cached && existsSync(cached))
      return { body: readFileSync(cached, 'utf8'), fromCache: true };

    const wait = last + delayMs - Date.now();
    if (wait > 0) await sleep(wait);
    last = Date.now();

    for (let attempt = 1; ; attempt++) {
      const res = await fetchImpl(url, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xml' },
      });
      if (res.status === 403 || res.status === 429) {
        throw new CrawlStopped(
          `le site refuse l'accès (HTTP ${res.status}) : arrêt de la collecte`,
        );
      }
      if (res.status >= 500 && attempt < 3) {
        log(`HTTP ${res.status}, nouvel essai dans ${delayMs * attempt} ms`);
        await sleep(delayMs * attempt);
        continue;
      }
      if (!res.ok) return { body: null, status: res.status, fromCache: false };
      const body = await res.text();
      if (cached) writeFileSync(cached, body);
      return { body, fromCache: false };
    }
  }

  async function loadRobots(origin) {
    const { body } = await get(new URL('/robots.txt', origin).href);
    robots = parseRobots(body ?? '');
    return robots;
  }

  return { get, loadRobots };
}
