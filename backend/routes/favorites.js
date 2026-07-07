const express = require('express');
const router = express.Router();
const { all, run, get } = require('../database');

// POST /api/favorites — add a car to favorites
router.post('/', async (req, res, next) => {
  try {
    const { user_id, car_id } = req.body;
    if (!user_id || !car_id) {
      return res.status(400).json({ error: 'user_id et car_id requis' });
    }

    const car = await get('SELECT id FROM cars WHERE id = ?', [car_id]);
    if (!car) return res.status(404).json({ error: 'Voiture introuvable' });

    await run(
      'INSERT OR IGNORE INTO favorites (user_id, car_id) VALUES (?, ?)',
      [user_id, car_id]
    );

    res.json({ success: true, message: 'Ajouté aux favoris' });
  } catch (err) {
    next(err);
  }
});

// GET /api/favorites/:userId — get user favorites
router.get('/:userId', async (req, res, next) => {
  try {
    const favorites = await all(
      `SELECT c.*, f.id as favorite_id, f.created_at as favorited_at
       FROM favorites f
       JOIN cars c ON f.car_id = c.id
       WHERE f.user_id = ?
       ORDER BY f.created_at DESC`,
      [req.params.userId]
    );
    res.json({ favorites });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/favorites/:id — remove from favorites
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await run('DELETE FROM favorites WHERE id = ?', [req.params.id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Favori introuvable' });
    }
    res.json({ success: true, message: 'Favori supprimé' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
