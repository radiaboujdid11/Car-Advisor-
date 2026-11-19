// Outils de l'assistant : lecture seule sur le catalogue (frontend/src/data/cars.js).
// Chaque fonction valide elle-même son entrée (elle vient du modèle, donc non fiable)
// et renvoie un objet sérialisable en JSON. Aucune n'a d'effet de bord.

import { CARS, ALL_MAKES } from '../../frontend/src/data/cars.js';
import { CATEGORY_LABELS, EUR_TO_MAD, toMAD } from '../../frontend/src/utils/format.js';

const CATEGORIES = Object.keys(CATEGORY_LABELS);
const BY_ID = new Map(CARS.map((car) => [car.id, car]));
const SORTS = ['prix_croissant', 'prix_decroissant', 'puissance_decroissante'];

export class ToolInputError extends Error {}

const normalize = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

function isElectric(car) {
  return car.consumption_l100k === 0 || car.co2_g_km === 0;
}

/** Fiche compacte pour les listes (peu de tokens). */
function summary(car) {
  return {
    id: car.id,
    marque: car.make,
    modele: car.model,
    annee: car.year,
    categorie: CATEGORY_LABELS[car.category] || car.category,
    prix_dh: toMAD(car.price_eur),
    puissance_ch: car.power_hp,
    energie: isElectric(car) ? 'électrique' : 'thermique ou hybride',
    lien: `/cars/${car.id}`,
  };
}

/** Fiche complète. */
function details(car) {
  return {
    ...summary(car),
    consommation_l_100km: isElectric(car) ? 0 : car.consumption_l100k,
    co2_g_km: car.co2_g_km,
    description: car.description,
  };
}

// ─── Petits validateurs (pas de dépendance) ──────────────────────────────────

function optionalString(input, key, max = 60) {
  const v = input[key];
  if (v === undefined || v === null || v === '') return undefined;
  if (typeof v !== 'string' || v.length > max) {
    throw new ToolInputError(`« ${key} » doit être un texte de ${max} caractères au plus`);
  }
  return v.trim();
}

function optionalNumber(input, key, { min = 0, max = Infinity, integer = false } = {}) {
  const v = input[key];
  if (v === undefined || v === null) return undefined;
  if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max) {
    throw new ToolInputError(`« ${key} » doit être un nombre entre ${min} et ${max}`);
  }
  if (integer && !Number.isInteger(v)) throw new ToolInputError(`« ${key} » doit être un entier`);
  return v;
}

function optionalEnum(input, key, values) {
  const v = input[key];
  if (v === undefined || v === null) return undefined;
  if (!values.includes(v)) {
    throw new ToolInputError(`« ${key} » doit valoir : ${values.join(', ')}`);
  }
  return v;
}

function requireObject(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new ToolInputError("l'entrée doit être un objet JSON");
  }
  return input;
}

function carById(id) {
  if (!Number.isInteger(id)) throw new ToolInputError('« id » doit être un entier');
  const car = BY_ID.get(id);
  if (!car) throw new ToolInputError(`aucune voiture avec l'identifiant ${id}`);
  return car;
}

// ─── Outils ──────────────────────────────────────────────────────────────────

export function rechercherVoitures(rawInput) {
  const input = requireObject(rawInput);
  const texte = optionalString(input, 'texte');
  const marque = optionalString(input, 'marque', 40);
  const categorie = optionalEnum(input, 'categorie', CATEGORIES);
  const budgetMin = optionalNumber(input, 'budget_min_dh', { max: 50_000_000 });
  const budgetMax = optionalNumber(input, 'budget_max_dh', { max: 50_000_000 });
  const puissanceMin = optionalNumber(input, 'puissance_min_ch', { max: 2000 });
  const electrique = input.electrique;
  if (electrique !== undefined && electrique !== null && typeof electrique !== 'boolean') {
    throw new ToolInputError('« electrique » doit être true ou false');
  }
  const tri = optionalEnum(input, 'tri', SORTS) ?? 'prix_croissant';
  const limite = optionalNumber(input, 'limite', { min: 1, max: 10, integer: true }) ?? 6;

  const q = texte ? normalize(texte) : null;
  const m = marque ? normalize(marque) : null;
  let results = CARS.filter((car) => {
    if (q && !normalize(`${car.make} ${car.model}`).includes(q)) return false;
    if (m && !normalize(car.make).includes(m)) return false;
    if (categorie && car.category !== categorie) return false;
    const priceMad = car.price_eur * EUR_TO_MAD;
    if (budgetMin !== undefined && priceMad < budgetMin) return false;
    if (budgetMax !== undefined && priceMad > budgetMax) return false;
    if (puissanceMin !== undefined && car.power_hp < puissanceMin) return false;
    if (typeof electrique === 'boolean' && isElectric(car) !== electrique) return false;
    return true;
  });

  const cmp = {
    prix_croissant: (a, b) => a.price_eur - b.price_eur,
    prix_decroissant: (a, b) => b.price_eur - a.price_eur,
    puissance_decroissante: (a, b) => b.power_hp - a.power_hp,
  }[tri];
  results = [...results].sort(cmp);

  return {
    total_correspondances: results.length,
    affichees: Math.min(limite, results.length),
    voitures: results.slice(0, limite).map(summary),
    ...(results.length === 0 && m && !ALL_MAKES.some((x) => normalize(x).includes(m))
      ? { marques_disponibles: ALL_MAKES }
      : {}),
  };
}

export function ficheVoiture(rawInput) {
  const input = requireObject(rawInput);
  return details(carById(input.id));
}

export function comparerVoitures(rawInput) {
  const input = requireObject(rawInput);
  const ids = input.ids;
  if (!Array.isArray(ids) || ids.length < 2 || ids.length > 4) {
    throw new ToolInputError('« ids » doit être une liste de 2 à 4 identifiants');
  }
  if (new Set(ids).size !== ids.length) throw new ToolInputError('« ids » contient un doublon');
  return { voitures: ids.map((id) => details(carById(id))) };
}

/**
 * Résultats du dernier quiz du visiteur. Le navigateur n'envoie que des identifiants
 * et des scores ; les fiches sont relues côté serveur (on ne fait pas confiance au client).
 */
export function resultatsQuiz(_rawInput, quizResults) {
  if (!Array.isArray(quizResults) || quizResults.length === 0) {
    return {
      quiz_fait: false,
      message: "Le visiteur n'a pas encore fait le quiz sur cet appareil.",
    };
  }
  const recommandations = quizResults
    .slice(0, 3)
    .filter((r) => r && BY_ID.has(r.id))
    .map((r, i) => ({
      rang: i + 1,
      score_compatibilite: Number.isFinite(r.matchScore) ? Math.round(r.matchScore) : null,
      ...details(BY_ID.get(r.id)),
    }));
  return { quiz_fait: recommandations.length > 0, recommandations };
}

// ─── Définitions envoyées à l'API ────────────────────────────────────────────
// Ordre et contenu fixes : le préfixe (outils + prompt système) reste identique
// d'une requête à l'autre, ce qui permet le cache de prompt.

export const TOOL_DEFINITIONS = [
  {
    name: 'rechercher_voitures',
    description:
      'Cherche dans le catalogue AutoAssist (277 voitures vendues au Maroc). À appeler dès que le visiteur cherche une voiture selon un budget, une catégorie, une marque, une motorisation ou une puissance, ou demande « quelles voitures… ». Renvoie le nombre total de correspondances et au plus `limite` fiches résumées. Les prix sont en dirhams (DH).',
    eager_input_streaming: true,
    input_schema: {
      type: 'object',
      properties: {
        texte: {
          type: 'string',
          description: 'Mot-clé dans la marque ou le modèle, ex. « Duster »',
        },
        marque: { type: 'string', description: 'Marque, ex. « Dacia », « Toyota »' },
        categorie: {
          type: 'string',
          enum: CATEGORIES,
          description:
            'eco = écologique/économique, practical = pratique/familiale, performance = sportive, luxury = luxe',
        },
        budget_min_dh: { type: 'number', description: 'Prix minimum en dirhams' },
        budget_max_dh: { type: 'number', description: 'Prix maximum en dirhams' },
        puissance_min_ch: { type: 'number', description: 'Puissance minimale en chevaux' },
        electrique: {
          type: 'boolean',
          description: 'true : électriques uniquement ; false : exclure les électriques',
        },
        tri: {
          type: 'string',
          enum: SORTS,
          description: 'Ordre des résultats (défaut : prix_croissant)',
        },
        limite: {
          type: 'integer',
          description: 'Nombre de fiches à renvoyer, de 1 à 10 (défaut 6)',
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'fiche_voiture',
    description:
      "Renvoie la fiche complète d'une voiture (prix, puissance, consommation, CO₂, description). À appeler quand le visiteur pose une question précise sur un modèle déjà identifié par son `id`.",
    eager_input_streaming: true,
    input_schema: {
      type: 'object',
      properties: { id: { type: 'integer', description: 'Identifiant de la voiture (champ id)' } },
      required: ['id'],
      additionalProperties: false,
    },
  },
  {
    name: 'comparer_voitures',
    description:
      'Renvoie les fiches complètes de 2 à 4 voitures pour les comparer. À appeler quand le visiteur demande de comparer des modèles ; trouve d’abord leurs identifiants avec rechercher_voitures si besoin.',
    eager_input_streaming: true,
    input_schema: {
      type: 'object',
      properties: {
        ids: { type: 'array', items: { type: 'integer' }, description: '2 à 4 identifiants' },
      },
      required: ['ids'],
      additionalProperties: false,
    },
  },
  {
    name: 'resultats_quiz',
    description:
      'Renvoie les 3 voitures recommandées au visiteur par le quiz (avec leur score de compatibilité), s’il l’a fait. À appeler quand le visiteur parle de « mes résultats », de sa recommandation ou demande pourquoi une voiture lui a été proposée.',
    eager_input_streaming: true,
    input_schema: { type: 'object', properties: {}, additionalProperties: false },
  },
];

/** Exécute un outil ; renvoie { content, isError }. */
export function runTool(name, input, context = {}) {
  try {
    const fn = {
      rechercher_voitures: rechercherVoitures,
      fiche_voiture: ficheVoiture,
      comparer_voitures: comparerVoitures,
      resultats_quiz: (i) => resultatsQuiz(i, context.quizResults),
    }[name];
    if (!fn) return { content: `outil inconnu : ${name}`, isError: true };
    return { content: JSON.stringify(fn(input)), isError: false };
  } catch (err) {
    if (err instanceof ToolInputError) {
      return {
        content: JSON.stringify({ erreur: err.message, entree_recue: input }),
        isError: true,
      };
    }
    throw err;
  }
}
