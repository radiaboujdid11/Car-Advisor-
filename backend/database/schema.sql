CREATE TABLE IF NOT EXISTS cars (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  price_eur REAL,
  power_hp INTEGER,
  consumption_l100k REAL,
  co2_g_km INTEGER,
  category TEXT,
  photo_url TEXT,
  carquery_id TEXT UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quiz_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  eco_score INTEGER DEFAULT 0,
  luxury_score INTEGER DEFAULT 0,
  practical_score INTEGER DEFAULT 0,
  performance_score INTEGER DEFAULT 0,
  safety_score INTEGER DEFAULT 0,
  fun_score INTEGER DEFAULT 0,
  result_car_1 INTEGER,
  result_car_2 INTEGER,
  result_car_3 INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS favorites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  car_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, car_id)
);
