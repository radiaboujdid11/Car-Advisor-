const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { all } = require('../database');
const {
  QUESTIONS,
  sessions,
  createSession,
  getBestQuestion,
  applyAnswer,
  getTopCars,
  displayConfidence,
  isDone,
  formatQuestion,
  getMatchReason
} = require('../services/quizEngine');

// ─── SMART ADAPTIVE QUIZ ─────────────────────────────────────────────────────

// POST /api/quiz/start — create session, return first question
router.post('/start', async (req, res, next) => {
  try {
    const cars = await all('SELECT * FROM cars');
    if (!cars.length) return res.status(503).json({ error: 'Base de voitures vide.' });

    const sessionId = crypto.randomBytes(8).toString('hex');
    const session = createSession(cars);
    sessions.set(sessionId, { session, cars });

    const q = getBestQuestion(session, cars);

    res.json({
      sessionId,
      question: formatQuestion(q, 1),
      confidence: 0,
      totalCars: cars.length
    });
  } catch (err) { next(err); }
});

// POST /api/quiz/answer — apply answer, return next question or final results
router.post('/answer', async (req, res, next) => {
  try {
    const { sessionId, questionId, answerIndex } = req.body;

    const entry = sessions.get(sessionId);
    if (!entry) {
      return res.status(410).json({ error: 'Session expirée — recommence le quiz.' });
    }

    const { session, cars } = entry;
    const question = QUESTIONS.find(q => q.id === questionId);
    if (!question) return res.status(400).json({ error: 'Question inconnue.' });

    applyAnswer(session, question, Number(answerIndex), cars);

    const conf = displayConfidence(session, cars);
    const done = isDone(session, cars);
    const topCars = getTopCars(session, cars, 3);

    if (done) {
      const top3 = topCars.map(car => ({
        ...car,
        _prob: undefined,
        // Map raw probability to 52-99 range (mirrors old quiz UX)
        matchScore: Math.min(Math.round(52 + car._prob * 140), 99),
        matchReason: getMatchReason(car, session)
      }));
      sessions.delete(sessionId);
      return res.json({ done: true, top3, confidence: conf, questionsAsked: session.askedIds.size });
    }

    const nextQ = getBestQuestion(session, cars);
    const number = session.askedIds.size + 1;
    const leading = topCars[0];

    res.json({
      done: false,
      question: formatQuestion(nextQ, number),
      confidence: conf,
      leadingCar: leading ? { make: leading.make, model: leading.model } : null
    });
  } catch (err) { next(err); }
});

// ─── LEGACY ENDPOINTS (kept for compatibility) ────────────────────────────────

// GET /api/quiz/questions
router.get('/questions', (req, res) => {
  const questions = QUESTIONS.map(q => ({
    id: q.id,
    question: q.question,
    answers: q.answers.map(a => ({ text: a.text, sub: a.sub || '' }))
  }));
  res.json({ questions });
});

module.exports = router;
