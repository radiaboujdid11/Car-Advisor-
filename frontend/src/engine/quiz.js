// Moteur d'inférence bayésienne du quiz.
//
// - A priori uniforme : P(voiture) = 1 / N
// - Après chaque réponse r : P(v | r) = P(v) · L(r | v) / Σ_k P(v_k) · L(r | v_k)
// - Question suivante : celle qui maximise le gain d'information (entropie de Shannon)
// - Arrêt : au moins MIN_QUESTIONS, puis seuil de probabilité ou de ratio, ou MAX_QUESTIONS
//
// Ce module ne dépend pas de React : il est utilisé par la page Quiz et par les tests.

import { QUESTIONS } from './questions.js';

export { QUESTIONS };

export const MIN_QUESTIONS = 15;
export const MAX_QUESTIONS = 30;
/** Arrêt si la voiture de tête dépasse cette probabilité… */
export const STOP_PROBABILITY = 0.6;
/** …ou si elle est ce nombre de fois plus probable que la deuxième. */
export const STOP_RATIO = 8;
/** Plancher de vraisemblance : une réponse n'élimine jamais totalement une voiture. */
export const LIKELIHOOD_FLOOR = 1e-9;
const EPSILON = 1e-12;

// ─── CACHE DES VRAISEMBLANCES ─────────────────────────────────────────────────
// Les fonctions likelihood(car) sont pures : on les évalue une seule fois par
// (liste de voitures, question) au lieu de ~80 000 appels à chaque question.
// Les sommes sont faites dans le même ordre qu'avant l'optimisation
// (identifiants croissants), pour obtenir exactement les mêmes résultats.

const contexts = new WeakMap();

function getContext(cars) {
  let ctx = contexts.get(cars);
  if (!ctx) {
    const order = cars.map((_, i) => i).sort((a, b) => cars[a].id - cars[b].id);
    const position = new Int32Array(cars.length);
    order.forEach((carIndex, k) => {
      position[carIndex] = k;
    });
    ctx = { order, position, likelihoods: new Map() };
    contexts.set(cars, ctx);
  }
  return ctx;
}

/** Vraisemblances (avec plancher) de chaque réponse, rangées par identifiant croissant. */
function answerLikelihoods(question, cars) {
  const ctx = getContext(cars);
  let table = ctx.likelihoods.get(question);
  if (!table) {
    table = question.answers.map((answer) =>
      Float64Array.from(ctx.order, (i) => Math.max(answer.likelihood(cars[i]), LIKELIHOOD_FLOOR)),
    );
    ctx.likelihoods.set(question, table);
  }
  return table;
}

function probabilitiesById(carProbs, cars) {
  const { order } = getContext(cars);
  return Float64Array.from(order, (i) => carProbs[cars[i].id] || 0);
}

// ─── ENTROPIE ET GAIN D'INFORMATION ──────────────────────────────────────────

/** Entropie de Shannon (en bits) d'une distribution. */
export function entropy(probabilities) {
  let h = 0;
  for (const p of probabilities) if (p > EPSILON) h -= p * Math.log2(p);
  return h;
}

/**
 * Gain(Q) = H(P) − Σ_r P(r) · H(P | r)
 * où P(r) = Σ_v P(v) · L(r | v) est la probabilité de la réponse r.
 */
function informationGain(question, probs, currentH, cars) {
  const { position } = getContext(cars);
  const n = probs.length;
  const post = new Float64Array(n);
  let expectedH = 0;

  for (const lk of answerLikelihoods(question, cars)) {
    for (let k = 0; k < n; k++) post[k] = probs[k] * lk[k];
    let weight = 0;
    for (let i = 0; i < n; i++) weight += post[position[i]];
    if (weight < EPSILON) continue;

    let postH = 0;
    for (let k = 0; k < n; k++) {
      const p = post[k] / weight;
      if (p > EPSILON) postH -= p * Math.log2(p);
    }
    expectedH += weight * postH;
  }

  return currentH - expectedH;
}

// ─── API DU MOTEUR ────────────────────────────────────────────────────────────

export function createSession(cars) {
  const uniform = 1 / cars.length;
  const carProbs = {};
  for (const car of cars) carProbs[car.id] = uniform;
  return { carProbs, askedIds: new Set(), answers: [], createdAt: Date.now() };
}

/** Question non encore posée qui maximise le gain d'information (null s'il n'en reste plus). */
export function getBestQuestion(session, cars, questions = QUESTIONS) {
  const available = questions.filter((q) => !session.askedIds.has(q.id));
  if (!available.length) return null;

  const probs = probabilitiesById(session.carProbs, cars);
  const currentH = entropy(probs);

  let best = null;
  let bestGain = -Infinity;
  for (const q of available) {
    const gain = informationGain(q, probs, currentH, cars);
    if (gain > bestGain) {
      bestGain = gain;
      best = q;
    }
  }
  return best;
}

/** Mise à jour bayésienne de session.carProbs après la réponse answerIndex (modifie la session). */
export function applyAnswer(session, question, answerIndex, cars) {
  if (!question.answers[answerIndex]) return;
  const lk = answerLikelihoods(question, cars)[answerIndex];
  const { position } = getContext(cars);

  let total = 0;
  cars.forEach((car, i) => {
    session.carProbs[car.id] = (session.carProbs[car.id] || 0) * lk[position[i]];
    total += session.carProbs[car.id];
  });

  if (total < EPSILON) {
    // Sécurité numérique : retour à l'a priori uniforme.
    const uniform = 1 / cars.length;
    for (const car of cars) session.carProbs[car.id] = uniform;
  } else {
    for (const car of cars) session.carProbs[car.id] /= total;
  }

  session.askedIds.add(question.id);
  session.answers.push({ questionId: question.id, answerIndex });
}

export function getTopCars(session, cars, n = 3) {
  return cars
    .map((car) => ({ ...car, _prob: session.carProbs[car.id] || 0 }))
    .sort((a, b) => b._prob - a._prob)
    .slice(0, n);
}

/** Confiance affichée : progression de la voiture de tête entre l'a priori (0 %) et la certitude (100 %). */
export function displayConfidence(session, cars) {
  const uniform = 1 / cars.length;
  const topProb = Math.max(...cars.map((c) => session.carProbs[c.id] || 0));
  return Math.round(Math.min((topProb - uniform) / (1 - uniform), 1) * 100);
}

export function isDone(session, cars) {
  const asked = session.askedIds.size;
  if (asked < MIN_QUESTIONS) return false;
  if (asked >= MAX_QUESTIONS) return true;

  const probs = cars.map((c) => session.carProbs[c.id] || 0).sort((a, b) => b - a);
  const top = probs[0] || 0;
  const second = probs[1] || 0;

  if (top > STOP_PROBABILITY) return true;
  if (second > 0 && top / second > STOP_RATIO) return true;
  return false;
}

/** Score de compatibilité affiché (en %) à partir de la probabilité a posteriori. */
export const matchScore = (probability) => Math.min(Math.round(52 + probability * 140), 99);

/** Les `count` meilleures voitures, hors exclusions, avec score et phrase d'explication. */
export function getRecommendations(session, cars, excludedIds = new Set(), count = 3) {
  return getTopCars(session, cars, count + excludedIds.size + 2)
    .filter((car) => !excludedIds.has(car.id))
    .slice(0, count)
    .map((car) => ({
      ...car,
      matchScore: matchScore(car._prob),
      matchReason: getMatchReason(car),
    }));
}

export function formatQuestion(q, number) {
  if (!q) return null;
  return {
    id: q.id,
    question: q.question,
    number,
    answers: q.answers.map((a, i) => ({ index: i, text: a.text, sub: a.sub || '' })),
  };
}

const MATCH_REASONS = {
  eco: [
    'Vos réponses révèlent un profil responsable et malin — ce modèle est parfaitement aligné.',
    'Économie, fiabilité, praticité — cette voiture est faite pour votre quotidien.',
  ],
  luxury: [
    'Vous recherchez confort et prestige — cette voiture transpire le raffinement à chaque détail.',
    "Votre profil révèle un goût pour l'excellence — un choix élégant, assumé, sans compromis.",
  ],
  practical: [
    "Vous avez besoin d'un allié du quotidien — polyvalent, fiable, pensé pour votre vie réelle.",
    'Praticité et sécurité guident votre choix — ce modèle les incarne avec conviction.',
  ],
  performance: [
    'Vous cherchez des sensations authentiques — ce modèle vous offrira des émotions à chaque sortie.',
    'Votre profil conducteur est affirmé — cette automobile a été conçue pour vous.',
  ],
};

export function getMatchReason(car) {
  const pool = MATCH_REASONS[car.category] || [
    "Un choix d'exception, parfaitement adapté à votre profil.",
  ];
  return pool[Math.floor(Math.random() * pool.length)];
}
