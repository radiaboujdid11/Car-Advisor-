const express = require('express');
const router = express.Router();
const { all, get } = require('../database');

// GET /api/cars — list with optional filters
router.get('/', async (req, res, next) => {
  try {
    const { make, category, min_budget, max_budget, min_year, max_year, page = 1, limit = 50 } = req.query;

    let sql = 'SELECT * FROM cars WHERE 1=1';
    const params = [];

    if (make) {
      sql += ' AND LOWER(make) = LOWER(?)';
      params.push(make);
    }
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    if (min_budget) {
      sql += ' AND price_eur >= ?';
      params.push(Number(min_budget));
    }
    if (max_budget) {
      sql += ' AND price_eur <= ?';
      params.push(Number(max_budget));
    }
    if (min_year) {
      sql += ' AND year >= ?';
      params.push(Number(min_year));
    }
    if (max_year) {
      sql += ' AND year <= ?';
      params.push(Number(max_year));
    }

    sql += ' ORDER BY make ASC, model ASC';
    sql += ` LIMIT ${Number(limit)} OFFSET ${(Number(page) - 1) * Number(limit)}`;

    const cars = await all(sql, params);
    res.json({ cars, page: Number(page), limit: Number(limit), count: cars.length });
  } catch (err) {
    next(err);
  }
});

// GET /api/cars/search — alias with search bar support
router.get('/search', async (req, res, next) => {
  try {
    const { q, make, category, budget, min_budget, max_budget } = req.query;

    let sql = 'SELECT * FROM cars WHERE 1=1';
    const params = [];

    if (q) {
      sql += ' AND (LOWER(make) LIKE ? OR LOWER(model) LIKE ?)';
      params.push(`%${q.toLowerCase()}%`, `%${q.toLowerCase()}%`);
    }
    if (make) {
      sql += ' AND LOWER(make) = LOWER(?)';
      params.push(make);
    }
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    if (budget) {
      sql += ' AND price_eur <= ?';
      params.push(Number(budget));
    }
    if (min_budget) {
      sql += ' AND price_eur >= ?';
      params.push(Number(min_budget));
    }
    if (max_budget) {
      sql += ' AND price_eur <= ?';
      params.push(Number(max_budget));
    }

    sql += ' ORDER BY make ASC, model ASC LIMIT 100';

    const cars = await all(sql, params);
    res.json({ cars, count: cars.length });
  } catch (err) {
    next(err);
  }
});

// GET /api/cars/:id/similar — must be before /:id to avoid conflict
router.get('/:id/similar', async (req, res, next) => {
  try {
    const car = await get('SELECT * FROM cars WHERE id = ?', [req.params.id]);
    if (!car) return res.status(404).json({ error: 'Voiture introuvable' });

    const similar = await all(
      'SELECT * FROM cars WHERE category = ? AND id != ? ORDER BY ABS(price_eur - ?) ASC LIMIT 6',
      [car.category, car.id, car.price_eur]
    );

    res.json({ cars: similar });
  } catch (err) {
    next(err);
  }
});

// GET /api/cars/:id — single car
router.get('/:id', async (req, res, next) => {
  try {
    const car = await get('SELECT * FROM cars WHERE id = ?', [req.params.id]);
    if (!car) return res.status(404).json({ error: 'Voiture introuvable' });
    res.json(car);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
