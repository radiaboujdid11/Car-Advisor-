const { run, get, all } = require('../database');

// ─── DATASET ──────────────────────────────────────────────────────────────────
// Real specs per model: power_hp, consumption (L/100 — 0 = electric), co2 (g/km — 0 = electric),
// price_2023 (€), price_2024 (€), category, description

const CARS_DATA = [
  // ── TOYOTA ──────────────────────────────────────────────────────────────────
  { make: 'Toyota',  model: 'Yaris',    category: 'eco',         power_hp: 116,  consumption_l100k: 3.8,  co2_g_km: 87,  price_2023: 19500,  price_2024: 20100,  description: 'Toyota Yaris — La citadine hybride de référence, économique et agile en ville.' },
  { make: 'Toyota',  model: 'Corolla',  category: 'eco',         power_hp: 140,  consumption_l100k: 4.5,  co2_g_km: 102, price_2023: 25800,  price_2024: 26500,  description: 'Toyota Corolla — Berline hybride fiable, idéale pour les longs trajets.' },
  { make: 'Toyota',  model: 'RAV4',     category: 'practical',   power_hp: 222,  consumption_l100k: 5.0,  co2_g_km: 132, price_2023: 38500,  price_2024: 39500,  description: 'Toyota RAV4 — SUV hybride familial, alliant espace et efficience énergétique.' },
  { make: 'Toyota',  model: 'GR86',     category: 'performance', power_hp: 234,  consumption_l100k: 9.2,  co2_g_km: 208, price_2023: 33500,  price_2024: 34200,  description: 'Toyota GR86 — Coupé sportif pur, conçu pour le plaisir de conduite.' },

  // ── HONDA ───────────────────────────────────────────────────────────────────
  { make: 'Honda',   model: 'Jazz',     category: 'eco',         power_hp: 109,  consumption_l100k: 4.5,  co2_g_km: 102, price_2023: 24200,  price_2024: 24900,  description: 'Honda Jazz — Citadine hybride spacieuse et économique au quotidien.' },
  { make: 'Honda',   model: 'Civic',    category: 'practical',   power_hp: 129,  consumption_l100k: 5.8,  co2_g_km: 132, price_2023: 27500,  price_2024: 28200,  description: 'Honda Civic — Compacte sobre et bien équipée, un classique revisité.' },
  { make: 'Honda',   model: 'CR-V',     category: 'practical',   power_hp: 184,  consumption_l100k: 5.7,  co2_g_km: 130, price_2023: 42000,  price_2024: 43000,  description: 'Honda CR-V — SUV hybride polyvalent, idéal pour la famille.' },
  { make: 'Honda',   model: 'HR-V',     category: 'eco',         power_hp: 131,  consumption_l100k: 5.2,  co2_g_km: 119, price_2023: 30000,  price_2024: 30800,  description: 'Honda HR-V — Crossover hybride élégant, silencieux et économe.' },

  // ── BMW ─────────────────────────────────────────────────────────────────────
  { make: 'BMW',     model: 'Série 3',  category: 'luxury',      power_hp: 156,  consumption_l100k: 6.5,  co2_g_km: 149, price_2023: 48500,  price_2024: 50000,  description: 'BMW Série 3 — La référence des berlines sportives premium, entre dynamisme et raffinement.' },
  { make: 'BMW',     model: 'Série 5',  category: 'luxury',      power_hp: 252,  consumption_l100k: 6.8,  co2_g_km: 154, price_2023: 62000,  price_2024: 64000,  description: 'BMW Série 5 — Berline executive alliant confort supérieur et performances affirmées.' },
  { make: 'BMW',     model: 'X5',       category: 'luxury',      power_hp: 340,  consumption_l100k: 8.2,  co2_g_km: 188, price_2023: 82000,  price_2024: 85000,  description: 'BMW X5 — SUV premium imposant, synonyme de prestige et de puissance.' },
  { make: 'BMW',     model: 'M3',       category: 'performance', power_hp: 510,  consumption_l100k: 10.5, co2_g_km: 238, price_2023: 92000,  price_2024: 95000,  description: 'BMW M3 — La berline sportive ultime, 510 ch pour une expérience circuit légendaire.' },

  // ── MERCEDES-BENZ ───────────────────────────────────────────────────────────
  { make: 'Mercedes-Benz', model: 'Classe A', category: 'luxury',      power_hp: 136,  consumption_l100k: 6.2,  co2_g_km: 141, price_2023: 36500,  price_2024: 37500,  description: 'Mercedes Classe A — Compacte premium au design moderne et à la technologie avancée.' },
  { make: 'Mercedes-Benz', model: 'Classe C', category: 'luxury',      power_hp: 204,  consumption_l100k: 6.5,  co2_g_km: 148, price_2023: 51000,  price_2024: 53000,  description: 'Mercedes Classe C — Berline intermédiaire alliant élégance et technologies de pointe.' },
  { make: 'Mercedes-Benz', model: 'GLE',      category: 'luxury',      power_hp: 367,  consumption_l100k: 8.5,  co2_g_km: 193, price_2023: 82000,  price_2024: 85000,  description: 'Mercedes GLE — SUV luxueux par excellence, spacieux, puissant et raffiné.' },
  { make: 'Mercedes-Benz', model: 'AMG GT',   category: 'performance', power_hp: 476,  consumption_l100k: 11.5, co2_g_km: 261, price_2023: 155000, price_2024: 160000, description: 'Mercedes-AMG GT — Coupé GT ultra-sportif, incarnation de la performance à l\'état pur.' },

  // ── AUDI ────────────────────────────────────────────────────────────────────
  { make: 'Audi',    model: 'A3',       category: 'luxury',      power_hp: 150,  consumption_l100k: 5.9,  co2_g_km: 134, price_2023: 35000,  price_2024: 36000,  description: 'Audi A3 — Compacte premium sobre et technologique, idéale au quotidien.' },
  { make: 'Audi',    model: 'A6',       category: 'luxury',      power_hp: 245,  consumption_l100k: 6.8,  co2_g_km: 155, price_2023: 58000,  price_2024: 60000,  description: 'Audi A6 — Berline executive racée, alliant performances et grand confort.' },
  { make: 'Audi',    model: 'Q5',       category: 'luxury',      power_hp: 204,  consumption_l100k: 7.0,  co2_g_km: 159, price_2023: 60000,  price_2024: 62000,  description: 'Audi Q5 — SUV premium polyvalent, entre sportivité et élégance germanique.' },
  { make: 'Audi',    model: 'RS6',      category: 'performance', power_hp: 600,  consumption_l100k: 11.7, co2_g_km: 265, price_2023: 138000, price_2024: 142000, description: 'Audi RS6 — Break ultra-performant, 600 ch discrets pour une polyvalence extrême.' },

  // ── VOLKSWAGEN ──────────────────────────────────────────────────────────────
  { make: 'Volkswagen', model: 'Golf',    category: 'practical',   power_hp: 150,  consumption_l100k: 5.8,  co2_g_km: 131, price_2023: 30000,  price_2024: 31000,  description: 'Volkswagen Golf — La référence absolue des compactes, équilibrée et fiable.' },
  { make: 'Volkswagen', model: 'Tiguan',  category: 'practical',   power_hp: 150,  consumption_l100k: 6.5,  co2_g_km: 148, price_2023: 36000,  price_2024: 37000,  description: 'Volkswagen Tiguan — SUV familial solide et polyvalent, best-seller européen.' },
  { make: 'Volkswagen', model: 'Passat',  category: 'practical',   power_hp: 150,  consumption_l100k: 6.3,  co2_g_km: 143, price_2023: 40000,  price_2024: 41000,  description: 'Volkswagen Passat — Break confortable et spacieux, parfait pour les familles.' },
  { make: 'Volkswagen', model: 'ID.4',    category: 'eco',         power_hp: 204,  consumption_l100k: 0,    co2_g_km: 0,   price_2023: 47000,  price_2024: 46000,  description: 'Volkswagen ID.4 — SUV 100 % électrique accessible, l\'avenir sans compromis.' },

  // ── TESLA ───────────────────────────────────────────────────────────────────
  { make: 'Tesla',   model: 'Model 3',   category: 'eco',         power_hp: 283,  consumption_l100k: 0,    co2_g_km: 0,   price_2023: 43000,  price_2024: 41000,  description: 'Tesla Model 3 — Berline électrique technologique et performante, la plus vendue au monde.' },
  { make: 'Tesla',   model: 'Model Y',   category: 'eco',         power_hp: 299,  consumption_l100k: 0,    co2_g_km: 0,   price_2023: 49000,  price_2024: 47000,  description: 'Tesla Model Y — SUV électrique familial, le véhicule le plus vendu en Europe.' },
  { make: 'Tesla',   model: 'Model S',   category: 'luxury',      power_hp: 670,  consumption_l100k: 0,    co2_g_km: 0,   price_2023: 98000,  price_2024: 96000,  description: 'Tesla Model S — Berline électrique de luxe, 670 ch pour une autonomie record.' },
  { make: 'Tesla',   model: 'Model X',   category: 'luxury',      power_hp: 670,  consumption_l100k: 0,    co2_g_km: 0,   price_2023: 108000, price_2024: 105000, description: 'Tesla Model X — SUV électrique de luxe aux portes papillon iconiques.' },

  // ── FORD ────────────────────────────────────────────────────────────────────
  { make: 'Ford',    model: 'Puma',          category: 'practical', power_hp: 125,  consumption_l100k: 5.2,  co2_g_km: 118, price_2023: 24000,  price_2024: 24800,  description: 'Ford Puma — Crossover compact agile et économique, design sportif assumé.' },
  { make: 'Ford',    model: 'Focus',         category: 'practical', power_hp: 125,  consumption_l100k: 5.8,  co2_g_km: 132, price_2023: 23500,  price_2024: 24200,  description: 'Ford Focus — Compacte plaisante à conduire, solide et bien équipée.' },
  { make: 'Ford',    model: 'Kuga PHEV',     category: 'eco',       power_hp: 225,  consumption_l100k: 2.3,  co2_g_km: 52,  price_2023: 42000,  price_2024: 43000,  description: 'Ford Kuga PHEV — SUV hybride rechargeable, économique en usage mixte.' },
  { make: 'Ford',    model: 'Mustang Mach-E',category: 'eco',       power_hp: 269,  consumption_l100k: 0,    co2_g_km: 0,   price_2023: 52000,  price_2024: 50000,  description: 'Ford Mustang Mach-E — SUV électrique au caractère affirmé, héritier du mythe.' },

  // ── HYUNDAI ─────────────────────────────────────────────────────────────────
  { make: 'Hyundai', model: 'i30',      category: 'practical',   power_hp: 110,  consumption_l100k: 5.7,  co2_g_km: 130, price_2023: 23000,  price_2024: 23700,  description: 'Hyundai i30 — Compacte fiable et bien équipée, excellent rapport qualité-prix.' },
  { make: 'Hyundai', model: 'Tucson',   category: 'practical',   power_hp: 230,  consumption_l100k: 5.9,  co2_g_km: 134, price_2023: 35000,  price_2024: 36000,  description: 'Hyundai Tucson — SUV hybride familial au design audacieux et technologique.' },
  { make: 'Hyundai', model: 'IONIQ 5',  category: 'eco',         power_hp: 305,  consumption_l100k: 0,    co2_g_km: 0,   price_2023: 48000,  price_2024: 47000,  description: 'Hyundai IONIQ 5 — SUV électrique au style rétro-futuriste, recharge ultra-rapide.' },
  { make: 'Hyundai', model: 'IONIQ 6',  category: 'eco',         power_hp: 325,  consumption_l100k: 0,    co2_g_km: 0,   price_2023: 44000,  price_2024: 43000,  description: 'Hyundai IONIQ 6 — Berline électrique aérodynamique, autonomie exceptionnelle.' },

  // ── KIA ─────────────────────────────────────────────────────────────────────
  { make: 'Kia',     model: 'Ceed',     category: 'practical',   power_hp: 120,  consumption_l100k: 5.5,  co2_g_km: 125, price_2023: 23500,  price_2024: 24200,  description: 'Kia Ceed — Compacte équilibrée et fiable, avec une garantie 7 ans rassurante.' },
  { make: 'Kia',     model: 'Sportage', category: 'practical',   power_hp: 230,  consumption_l100k: 5.9,  co2_g_km: 135, price_2023: 33000,  price_2024: 34000,  description: 'Kia Sportage — SUV hybride au design affirmé, technologie et confort réunis.' },
  { make: 'Kia',     model: 'EV6',      category: 'eco',         power_hp: 325,  consumption_l100k: 0,    co2_g_km: 0,   price_2023: 48000,  price_2024: 47000,  description: 'Kia EV6 — Crossover électrique GT, recharge 800V et performances sportives.' },
  { make: 'Kia',     model: 'Niro',     category: 'eco',         power_hp: 141,  consumption_l100k: 4.8,  co2_g_km: 110, price_2023: 28500,  price_2024: 29200,  description: 'Kia Niro — Crossover hybride polyvalent, éco-responsable au quotidien.' },

  // ── RENAULT ─────────────────────────────────────────────────────────────────
  { make: 'Renault', model: 'Clio',        category: 'eco',       power_hp: 91,   consumption_l100k: 5.2,  co2_g_km: 115, price_2023: 18500,  price_2024: 19000,  description: 'Renault Clio — La citadine hybride française par excellence, légère et économique.' },
  { make: 'Renault', model: 'Mégane E-Tech',category: 'eco',      power_hp: 160,  consumption_l100k: 4.9,  co2_g_km: 112, price_2023: 29000,  price_2024: 29800,  description: 'Renault Mégane E-Tech — Compacte hybride technologique, le meilleur de Renault.' },
  { make: 'Renault', model: 'Captur',      category: 'eco',       power_hp: 145,  consumption_l100k: 5.5,  co2_g_km: 124, price_2023: 22500,  price_2024: 23200,  description: 'Renault Captur — Crossover hybride rechargeable, pratique et économique.' },
  { make: 'Renault', model: 'Zoé',         category: 'eco',       power_hp: 136,  consumption_l100k: 0,    co2_g_km: 0,   price_2023: 34500,  price_2024: 33000,  description: 'Renault Zoé — Pionnière de l\'électrique accessible en Europe, idéale en ville.' },

  // ── PEUGEOT ─────────────────────────────────────────────────────────────────
  { make: 'Peugeot', model: '208',     category: 'practical',   power_hp: 100,  consumption_l100k: 5.2,  co2_g_km: 119, price_2023: 19500,  price_2024: 20200,  description: 'Peugeot 208 — Citadine stylée et accessible, primée voiture de l\'année 2020.' },
  { make: 'Peugeot', model: '308',     category: 'practical',   power_hp: 130,  consumption_l100k: 5.5,  co2_g_km: 125, price_2023: 28500,  price_2024: 29300,  description: 'Peugeot 308 — Compacte au i-Cockpit raffiné, confortable et bien équipée.' },
  { make: 'Peugeot', model: '3008',    category: 'practical',   power_hp: 300,  consumption_l100k: 2.1,  co2_g_km: 48,  price_2023: 47000,  price_2024: 48500,  description: 'Peugeot 3008 — SUV hybride rechargeable plébiscité, design et technologie au sommet.' },
  { make: 'Peugeot', model: '508 PSE', category: 'luxury',      power_hp: 360,  consumption_l100k: 1.8,  co2_g_km: 41,  price_2023: 55000,  price_2024: 57000,  description: 'Peugeot 508 PSE — La fastback française la plus sportive, 360 ch hybride.' },

  // ── PORSCHE ─────────────────────────────────────────────────────────────────
  { make: 'Porsche', model: '911',     category: 'performance', power_hp: 385,  consumption_l100k: 9.8,  co2_g_km: 222, price_2023: 132000, price_2024: 136000, description: 'Porsche 911 — L\'icône absolue du sport automobile, intemporelle et légendaire.' },
  { make: 'Porsche', model: 'Taycan',  category: 'performance', power_hp: 408,  consumption_l100k: 0,    co2_g_km: 0,   price_2023: 100000, price_2024: 103000, description: 'Porsche Taycan — La berline électrique la plus sportive au monde, pur ADN Porsche.' },
  { make: 'Porsche', model: 'Cayenne', category: 'luxury',      power_hp: 340,  consumption_l100k: 9.2,  co2_g_km: 208, price_2023: 95000,  price_2024: 98000,  description: 'Porsche Cayenne — Le SUV qui prouve qu\'on peut tout avoir : luxe, sport et espace.' },
  { make: 'Porsche', model: 'Macan',   category: 'luxury',      power_hp: 265,  consumption_l100k: 8.2,  co2_g_km: 186, price_2023: 68000,  price_2024: 70000,  description: 'Porsche Macan — Le SUV compact le plus sportif de sa catégorie, sans concession.' },

  // ── FERRARI ─────────────────────────────────────────────────────────────────
  { make: 'Ferrari', model: 'Roma',          category: 'performance', power_hp: 620,  consumption_l100k: 11.1, co2_g_km: 253, price_2023: 225000, price_2024: 232000, description: 'Ferrari Roma — Le grand tourisme de Maranello, élégance absolue à 620 chevaux.' },
  { make: 'Ferrari', model: 'F8 Tributo',    category: 'performance', power_hp: 720,  consumption_l100k: 11.4, co2_g_km: 260, price_2023: 265000, price_2024: 272000, description: 'Ferrari F8 Tributo — La synthèse parfaite de la performance Ferrari, 720 ch biturbo.' },
  { make: 'Ferrari', model: '296 GTB',       category: 'performance', power_hp: 830,  consumption_l100k: 9.9,  co2_g_km: 225, price_2023: 280000, price_2024: 290000, description: 'Ferrari 296 GTB — Hybride de 830 ch, l\'avenir de Ferrari dans le respect de la tradition.' },
  { make: 'Ferrari', model: 'SF90 Stradale', category: 'performance', power_hp: 1000, consumption_l100k: 9.5,  co2_g_km: 218, price_2023: 520000, price_2024: 540000, description: 'Ferrari SF90 Stradale — 1000 ch hybride, le Ferrari le plus puissant jamais produit.' },

  // ── LAMBORGHINI ─────────────────────────────────────────────────────────────
  { make: 'Lamborghini', model: 'Huracán',  category: 'performance', power_hp: 640,  consumption_l100k: 13.7, co2_g_km: 325, price_2023: 220000, price_2024: 226000, description: 'Lamborghini Huracán — Le taureau de Sant\'Agata, 640 ch d\'une pureté absolue.' },
  { make: 'Lamborghini', model: 'Urus',     category: 'performance', power_hp: 666,  consumption_l100k: 12.7, co2_g_km: 290, price_2023: 240000, price_2024: 248000, description: 'Lamborghini Urus — Le SUV le plus rapide du monde, 666 ch de fureur italienne.' },
  { make: 'Lamborghini', model: 'Revuelto', category: 'performance', power_hp: 1001, consumption_l100k: 10.4, co2_g_km: 237, price_2023: 520000, price_2024: 540000, description: 'Lamborghini Revuelto — 1001 ch hybride, le successeur légendaire de l\'Aventador.' },
  { make: 'Lamborghini', model: 'Sterrato', category: 'performance', power_hp: 640,  consumption_l100k: 13.9, co2_g_km: 329, price_2023: 260000, price_2024: 268000, description: 'Lamborghini Sterrato — L\'Huracán tout-terrain, l\'absurde magnifique à l\'état pur.' },
];

// ─── SEED ─────────────────────────────────────────────────────────────────────

async function seedDatabase() {
  const { db } = require('../database');

  await new Promise((resolve, reject) => {
    db.run('DELETE FROM cars', (err) => err ? reject(err) : resolve());
  });

  let count = 0;
  for (const car of CARS_DATA) {
    for (const year of [2023, 2024]) {
      const price = year === 2023 ? car.price_2023 : car.price_2024;
      const id = `${car.make}-${car.model}-${year}`.toLowerCase().replace(/[\s']/g, '-');
      try {
        await run(
          `INSERT OR IGNORE INTO cars (make, model, year, price_eur, power_hp, consumption_l100k, co2_g_km, category, carquery_id, description)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [car.make, car.model, year, price, car.power_hp, car.consumption_l100k, car.co2_g_km, car.category, id,
           `${car.description.replace(/—/, `${year} —`)}`]
        );
        count++;
      } catch { /* ignore duplicates */ }
    }
  }

  console.log(`✅ Dataset: ${count} voitures insérées (${CARS_DATA.length} modèles × 2 années)`);
  return count;
}

// kept for compatibility — now just calls seedDatabase
async function syncCarsFromCarQuery() {
  return seedDatabase();
}

module.exports = { syncCarsFromCarQuery, seedDatabase };
