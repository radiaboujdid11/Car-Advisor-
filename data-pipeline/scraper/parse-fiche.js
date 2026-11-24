// Analyse d'une fiche « version » de voiture neuve (HTML rendu côté serveur) -> objet brut.
// Fonction pure : aucune requête réseau. Les valeurs restent des textes ; la conversion
// en nombres et la normalisation se font dans normalize.js.

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

export function decodeEntities(s) {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? m);
}

/** Texte visible d'un fragment HTML (balises retirées, espaces normalisés). */
export function textOf(html) {
  return decodeEntities(
    html
      // bulles d'aide (« i ») et scripts : pas du contenu
      .replace(/<span[^>]*class="[^"]*propulsion-info[^"]*"[^>]*>[\s\S]*?<\/span>/gi, '')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/\s+/g, ' ')
    .trim();
}

const clean = (label) =>
  label
    .replace(/\s*:\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Extrait toutes les paires libellé -> valeur des tableaux de la page, sous deux formes :
 *   <td><span class="font-weight-bold">Marque :</span> Peugeot</td>
 *   <td>…Puissance réelle (ch)…</td><td>180 ch</td>
 * En cas de doublon, la première occurrence est gardée.
 */
export function extractPairs(html) {
  const pairs = {};
  const add = (label, value) => {
    const key = clean(label);
    if (key && !(key in pairs)) pairs[key] = value.trim();
  };
  for (const [, row] of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) => m[1]);
    const inline = cells.filter((c) => /font-weight-bold[^>]*>[^<]*:\s*</i.test(c));
    if (inline.length) {
      // forme « Libellé : valeur » dans une même cellule (éventuellement 2 par ligne)
      for (const cell of inline) {
        const m = cell.match(/font-weight-bold[^>]*>([^<]*:)\s*<\/span>([\s\S]*)$/i);
        if (m) add(m[1], textOf(m[2]));
      }
    } else if (cells.length === 2) {
      add(textOf(cells[0]), textOf(cells[1]));
    }
  }
  return pairs;
}

/** Identifiant numérique de la fiche à la fin de l'URL : …-4809.html -> 4809. */
export function sourceIdFromUrl(url) {
  const m = url.match(/-(\d+)\.html(?:$|[?#])/);
  return m ? Number(m[1]) : null;
}

/** Fiche brute : champs utiles, encore sous forme de texte. */
export function parseFiche(html, url) {
  const p = extractPairs(html);
  const get = (...labels) => {
    for (const l of labels) if (p[l] !== undefined && p[l] !== '-' && p[l] !== '') return p[l];
    return null;
  };
  return {
    source_url: url,
    source_id: sourceIdFromUrl(url),
    marque: get('Marque'),
    modele: get('Modèle'),
    version: get('Version'),
    annee: get('Année'),
    transmission: get('Transmission'),
    carrosserie: get('Type'),
    motorisation: get('Motorisation'),
    propulsion: get('Propulsion'),
    portes: get('Nombre de portes'),
    places: get('Nombre de places'),
    prix_showroom: get('Prix en showroom'),
    prix_cle_en_main: get('Prix clé en main'),
    puissance: get('Puissance réelle (ch)'),
    puissance_fiscale: get('Puissance fiscale (CV)'),
    consommation_mixte: get('Consommation mixte'),
    co2: get('Émissions de CO2', 'Émissions CO2', 'Émissions de CO₂', 'Émissions'),
    autonomie_electrique: get('Autonomie Électrique', 'Autonomie combinée'),
    batterie: get('Capacité de la batterie'),
  };
}
