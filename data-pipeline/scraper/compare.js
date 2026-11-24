// Comparaison entre les modèles collectés et le catalogue actuel (frontend/src/data/cars.js).
// Sert à mesurer la fiabilité des données existantes avant toute mise à jour.

const EUR_TO_MAD = 10.8; // taux utilisé par le catalogue actuel (frontend/src/utils/format.js)

const key = (make, model) =>
  `${make} ${model}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/mercedes-benz/g, 'mercedes')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/** Pour chaque modèle du catalogue : présent chez la source ? écart de prix ? catégorie identique ? */
export function compareWithCatalog(models, catalog) {
  const byKey = new Map(models.map((m) => [key(m.marque, m.modele), m]));
  // Catalogue : une entrée par modèle (année la plus récente)
  const latest = new Map();
  for (const car of catalog) {
    const k = key(car.make, car.model);
    if (!latest.has(k) || car.year > latest.get(k).year) latest.set(k, car);
  }

  const rows = [...latest.entries()].map(([k, car]) => {
    const src = byKey.get(k);
    const ourDh = Math.round(car.price_eur * EUR_TO_MAD);
    if (!src)
      return { modele: `${car.make} ${car.model}`, trouve: false, prix_catalogue_dh: ourDh };
    const ref = src.prix_min_dh;
    return {
      modele: `${car.make} ${car.model}`,
      trouve: true,
      prix_catalogue_dh: ourDh,
      prix_source_min_dh: ref,
      prix_source_max_dh: src.prix_max_dh,
      ecart_pct: ref ? Math.round(((ourDh - ref) / ref) * 1000) / 10 : null,
      dans_la_fourchette:
        ref !== null && ourDh >= ref * 0.95 && ourDh <= (src.prix_max_dh ?? ref) * 1.05,
      categorie_catalogue: car.category,
      categorie_regle: src.categorie,
      puissance_catalogue: car.power_hp,
      puissance_source: [src.puissance_min_ch, src.puissance_max_ch],
    };
  });

  const found = rows.filter((r) => r.trouve);
  const known = new Set(latest.keys());
  return {
    rows,
    stats: {
      modeles_catalogue: rows.length,
      trouves_chez_la_source: found.length,
      prix_dans_la_fourchette: found.filter((r) => r.dans_la_fourchette).length,
      ecart_median_pct: median(found.map((r) => r.ecart_pct).filter((x) => x !== null)),
      categories_identiques: found.filter((r) => r.categorie_catalogue === r.categorie_regle)
        .length,
      modeles_source_absents_du_catalogue: models.filter((m) => !known.has(key(m.marque, m.modele)))
        .length,
    },
  };
}

function median(xs) {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round(((s[mid - 1] + s[mid]) / 2) * 10) / 10;
}

/** Rapport Markdown lisible. */
export function renderReport(
  { stats, rows },
  { versions, models, fill, startedAt, finishedAt, partial },
) {
  const pct = (a, b) => (b ? `${Math.round((a / b) * 100)} %` : '—');
  const lines = [
    `# Rapport de collecte moteur.ma`,
    ``,
    `- Collecte : ${startedAt} → ${finishedAt}${partial ? ' (**partielle**, échantillon)' : ''}`,
    `- Fiches versions lues : ${versions.length} ; modèles agrégés : ${models.length}`,
    ``,
    `## Comparaison avec le catalogue actuel`,
    ``,
    `| Mesure | Valeur |`,
    `| --- | --- |`,
    `| Modèles du catalogue | ${stats.modeles_catalogue} |`,
    `| …trouvés dans la collecte | ${stats.trouves_chez_la_source} (${pct(stats.trouves_chez_la_source, stats.modeles_catalogue)}) |`,
    `| …dont prix dans la fourchette source (±5 %) | ${stats.prix_dans_la_fourchette} (${pct(stats.prix_dans_la_fourchette, stats.trouves_chez_la_source)}) |`,
    `| Écart de prix médian (catalogue vs version d'entrée) | ${stats.ecart_median_pct ?? '—'} % |`,
    `| Catégorie identique (règle vs catalogue) | ${stats.categories_identiques} (${pct(stats.categories_identiques, stats.trouves_chez_la_source)}) |`,
    `| Modèles collectés absents du catalogue | ${stats.modeles_source_absents_du_catalogue} |`,
    ``,
    `## Taux de remplissage des champs (versions)`,
    ``,
    `| Champ | Rempli |`,
    `| --- | --- |`,
    ...Object.entries(fill).map(([k, v]) => `| \`${k}\` | ${v} % |`),
    ``,
    `## Plus grands écarts de prix`,
    ``,
    `| Modèle | Catalogue (DH) | Source min–max (DH) | Écart |`,
    `| --- | --- | --- | --- |`,
    ...rows
      .filter((r) => r.trouve && r.ecart_pct !== null)
      .sort((a, b) => Math.abs(b.ecart_pct) - Math.abs(a.ecart_pct))
      .slice(0, 20)
      .map(
        (r) =>
          `| ${r.modele} | ${r.prix_catalogue_dh.toLocaleString('fr-FR')} | ${r.prix_source_min_dh?.toLocaleString('fr-FR')} – ${r.prix_source_max_dh?.toLocaleString('fr-FR')} | ${r.ecart_pct > 0 ? '+' : ''}${r.ecart_pct} % |`,
      ),
  ];
  return lines.join('\n') + '\n';
}
