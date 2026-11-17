import { describe, expect, it } from 'vitest';
import { CARS } from '../data/cars';
import {
  MAX_QUESTIONS,
  MIN_QUESTIONS,
  QUESTIONS,
  STOP_PROBABILITY,
  STOP_RATIO,
  applyAnswer,
  createSession,
  displayConfidence,
  entropy,
  getBestQuestion,
  getRecommendations,
  isDone,
} from './quiz';

const sumOf = (session) => Object.values(session.carProbs).reduce((s, p) => s + p, 0);
const probsOf = (session) => Object.values(session.carProbs);

/** Générateur pseudo-aléatoire déterministe, pour des tests reproductibles. */
function seededRandom(seed) {
  let s = seed;
  return () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
}

/** Joue un quiz complet comme le moteur le prévoit, jusqu'à isDone(). */
function playQuiz(pickAnswer) {
  const session = createSession(CARS);
  while (!isDone(session, CARS)) {
    const question = getBestQuestion(session, CARS);
    if (!question) break;
    applyAnswer(session, question, pickAnswer(question), CARS);
  }
  return session;
}

/** Session artificielle : `asked` questions déjà posées et probabilités imposées. */
function sessionWith(asked, topProbs) {
  const session = createSession(CARS);
  const rest = (1 - topProbs.reduce((s, p) => s + p, 0)) / (CARS.length - topProbs.length);
  CARS.forEach((car, i) => {
    session.carProbs[car.id] = i < topProbs.length ? topProbs[i] : rest;
  });
  for (let i = 0; i < asked; i++) session.askedIds.add(`q${i}`);
  return session;
}

describe('données et banque de questions', () => {
  it('chaque vraisemblance est un nombre fini entre 0 et 1', () => {
    const invalid = [];
    for (const question of QUESTIONS) {
      question.answers.forEach((answer, index) => {
        for (const car of CARS) {
          const lk = answer.likelihood(car);
          if (!(Number.isFinite(lk) && lk >= 0 && lk <= 1)) {
            invalid.push(`${question.id}[${index}] / voiture ${car.id} : ${lk}`);
          }
        }
      });
    }
    expect(invalid).toEqual([]);
  });

  it('les identifiants de questions sont uniques', () => {
    const ids = QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('probabilités', () => {
  it("l'a priori est uniforme et son entropie vaut log2(N)", () => {
    const session = createSession(CARS);
    for (const p of probsOf(session)) expect(p).toBeCloseTo(1 / CARS.length, 15);
    expect(entropy(probsOf(session))).toBeCloseTo(Math.log2(CARS.length), 10);
  });

  it('les probabilités somment à 1 après chaque réponse', () => {
    const random = seededRandom(1);
    const session = createSession(CARS);
    expect(sumOf(session)).toBeCloseTo(1, 12);
    for (let i = 0; i < MAX_QUESTIONS; i++) {
      const question = getBestQuestion(session, CARS);
      applyAnswer(session, question, Math.floor(random() * question.answers.length), CARS);
      expect(sumOf(session)).toBeCloseTo(1, 12);
    }
  });

  it('une réponse cohérente augmente la probabilité de la voiture attendue', () => {
    for (const question of QUESTIONS) {
      question.answers.forEach((answer, index) => {
        // La voiture que cette réponse favorise le plus…
        const expected = CARS.reduce((best, car) =>
          answer.likelihood(car) > answer.likelihood(best) ? car : best,
        );
        const session = createSession(CARS);
        const before = session.carProbs[expected.id];
        applyAnswer(session, question, index, CARS);
        // …ne peut pas perdre de probabilité (elle gagne dès que la réponse discrimine).
        expect(session.carProbs[expected.id]).toBeGreaterThanOrEqual(before - 1e-15);
      });
    }

    // Exemple concret : « une berline allemande » favorise le luxe au détriment de l'éco.
    const question = QUESTIONS.find((q) => q.id === 'social_gendre');
    const luxury = CARS.find((c) => c.category === 'luxury');
    const eco = CARS.find((c) => c.category === 'eco');
    const session = createSession(CARS);
    const prior = session.carProbs[luxury.id];
    applyAnswer(session, question, 2, CARS);
    expect(session.carProbs[luxury.id]).toBeGreaterThan(prior);
    expect(session.carProbs[eco.id]).toBeLessThan(prior);
  });

  it('les recommandations respectent les exclusions et le plafond de 99 %', () => {
    const session = playQuiz(() => 0);
    const [first] = getRecommendations(session, CARS);
    const top3 = getRecommendations(session, CARS, new Set([first.id]));
    expect(top3).toHaveLength(3);
    expect(top3.map((c) => c.id)).not.toContain(first.id);
    for (const car of top3) expect(car.matchScore).toBeLessThanOrEqual(99);
  });
});

describe("critère d'arrêt", () => {
  it(`ne s'arrête jamais avant ${MIN_QUESTIONS} questions, même avec une voiture certaine`, () => {
    expect(isDone(sessionWith(MIN_QUESTIONS - 1, [0.99]), CARS)).toBe(false);
  });

  it(`s'arrête quand la voiture de tête dépasse ${STOP_PROBABILITY * 100} %`, () => {
    expect(isDone(sessionWith(MIN_QUESTIONS, [STOP_PROBABILITY + 0.01, 0.3]), CARS)).toBe(true);
    expect(isDone(sessionWith(MIN_QUESTIONS, [STOP_PROBABILITY - 0.01, 0.3]), CARS)).toBe(false);
  });

  it(`s'arrête quand la tête est ${STOP_RATIO} fois plus probable que la deuxième`, () => {
    const second = 0.05;
    expect(isDone(sessionWith(MIN_QUESTIONS, [second * STOP_RATIO + 0.01, second]), CARS)).toBe(
      true,
    );
    expect(isDone(sessionWith(MIN_QUESTIONS, [second * STOP_RATIO - 0.01, second]), CARS)).toBe(
      false,
    );
  });

  it(`s'arrête à ${MAX_QUESTIONS} questions même sans voiture dominante`, () => {
    const flat = sessionWith(MAX_QUESTIONS - 1, []);
    expect(isDone(flat, CARS)).toBe(false);
    flat.askedIds.add('derniere');
    expect(isDone(flat, CARS)).toBe(true);
  });

  it(`un quiz complet ne pose jamais plus de ${MAX_QUESTIONS} questions, sans doublon`, () => {
    for (let seed = 1; seed <= 20; seed++) {
      const random = seededRandom(seed);
      const session = playQuiz((q) => Math.floor(random() * q.answers.length));
      expect(session.answers.length).toBeGreaterThanOrEqual(MIN_QUESTIONS);
      expect(session.answers.length).toBeLessThanOrEqual(MAX_QUESTIONS);
      expect(new Set(session.answers.map((a) => a.questionId)).size).toBe(session.answers.length);
    }
  });
});

describe('« je ne sais pas » et robustesse numérique', () => {
  const dontKnow = QUESTIONS.flatMap((question) =>
    question.answers
      .map((answer, index) => ({ question, answer, index }))
      .filter(({ answer }) => /je ne sais pas|peu importe/i.test(answer.text)),
  );

  it('la banque contient des réponses « je ne sais pas » / « peu importe »', () => {
    expect(dontKnow.length).toBeGreaterThan(0);
  });

  it('ces réponses gardent une distribution valide (somme 1, aucune voiture éliminée)', () => {
    const session = createSession(CARS);
    for (const { question, index } of dontKnow) {
      applyAnswer(session, question, index, CARS);
      expect(sumOf(session)).toBeCloseTo(1, 12);
      for (const p of probsOf(session)) {
        expect(Number.isFinite(p)).toBe(true);
        expect(p).toBeGreaterThan(0);
      }
    }
    expect(displayConfidence(session, CARS)).toBeGreaterThanOrEqual(0);
    expect(getBestQuestion(session, CARS)).not.toBeNull();
  });

  it('une réponse de vraisemblance nulle pour toutes les voitures ne casse pas le calcul', () => {
    const impossible = {
      id: 'test_zero',
      answers: [{ text: 'Je ne sais pas', likelihood: () => 0 }],
    };
    const session = createSession(CARS);
    applyAnswer(session, impossible, 0, CARS);
    expect(sumOf(session)).toBeCloseTo(1, 12);
    for (const p of probsOf(session)) expect(p).toBeCloseTo(1 / CARS.length, 12);
  });

  it('un index de réponse inexistant est ignoré', () => {
    const session = createSession(CARS);
    const before = { ...session.carProbs };
    applyAnswer(session, QUESTIONS[0], 99, CARS);
    expect(session.carProbs).toEqual(before);
    expect(session.askedIds.size).toBe(0);
  });
});
