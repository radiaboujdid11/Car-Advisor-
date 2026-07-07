require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initTables, getCarCount } = require('./database');
const { syncCarsFromCarQuery } = require('./services/carqueryService');
const { seedMoroccanCars } = require('./services/moroccanSeed');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── MIDDLEWARE ───
const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL, 'http://localhost:3000']
  : ['http://localhost:3000'];

app.use(cors({
  origin: (origin, cb) => (!origin || allowedOrigins.includes(origin) ? cb(null, true) : cb(new Error('CORS'))),
  credentials: false
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger (dev only)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// ─── ROUTES ───
app.use('/api/cars',       require('./routes/cars'));
app.use('/api/quiz',       require('./routes/quiz'));
app.use('/api/favorites',  require('./routes/favorites'));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route introuvable' });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('❌ Erreur serveur:', err.message);
  res.status(500).json({ error: 'Erreur serveur interne', details: err.message });
});

// ─── STARTUP ───
async function start() {
  try {
    console.log('🚀 Démarrage Car Advisor Backend...');

    // Init DB tables
    await initTables();
    console.log('✅ Tables DB initialisées');

    // Seed cars if DB is empty
    const count = await getCarCount();
    if (count === 0) {
      console.log('📡 Base vide — synchronisation CarQuery API...');
      const added = await syncCarsFromCarQuery();
      console.log(`✅ ${added} voitures chargées`);
    } else {
      console.log(`📦 ${count} voitures en base`);
    }

    // Always inject Moroccan market cars (skips duplicates)
    await seedMoroccanCars();

    app.listen(PORT, () => {
      console.log(`\n🚗 Car Advisor API prêt sur http://localhost:${PORT}`);
      console.log(`   GET  /api/cars        — Toutes les voitures`);
      console.log(`   GET  /api/cars/search — Recherche filtrée`);
      console.log(`   GET  /api/quiz/questions — 10 questions`);
      console.log(`   POST /api/quiz/submit — Soumettre quiz`);
      console.log(`   POST /api/favorites   — Gérer favoris\n`);
    });
  } catch (err) {
    console.error('❌ Erreur démarrage:', err);
    process.exit(1);
  }
}

start();
