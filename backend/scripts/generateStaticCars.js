'use strict';

const path = require('path');
const fs   = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const sqlite3 = require('sqlite3').verbose();

const DB_PATH  = process.env.DATABASE_PATH || path.join(__dirname, '../database/cars.db');
const OUT_PATH = path.join(__dirname, '../../frontend/src/data/cars.js');

const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY, err => {
  if (err) { console.error('DB error:', err.message); process.exit(1); }
});

db.all('SELECT * FROM cars ORDER BY make ASC, model ASC', [], (err, rows) => {
  if (err) { console.error(err); process.exit(1); }

  const makes = [...new Set(rows.map(r => r.make))].sort();

  const js = `// AUTO-GENERATED — run: node backend/scripts/generateStaticCars.js
// ${rows.length} voitures — ${new Date().toISOString().slice(0,10)}

export const CARS = ${JSON.stringify(rows, null, 2)};

export const ALL_MAKES = ${JSON.stringify(makes, null, 2)};
`;

  fs.writeFileSync(OUT_PATH, js, 'utf8');
  console.log(`✅ ${rows.length} voitures → ${OUT_PATH}`);
  db.close();
});
