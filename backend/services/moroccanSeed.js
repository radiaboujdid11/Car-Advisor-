'use strict';

const { run, get } = require('../database');

// Cars popular on the Moroccan market — prices in EUR (approx MAD/10.8)
const MOROCCAN_CARS = [
  // ── ECO / BUDGET ───────────────────────────────────────────────────────
  {
    make: 'Dacia', model: 'Sandero', year: 2023,
    price_eur: 8500, power_hp: 65, consumption_l100k: 5.8,
    co2_g_km: 133, category: 'eco',
    description: 'La voiture la plus vendue au Maroc. Fiable, économique, accessible. La Dacia Sandero c\'est la voiture du peuple marocain.',
    carquery_id: 'ma_dacia_sandero_2023'
  },
  {
    make: 'Dacia', model: 'Logan', year: 2023,
    price_eur: 9500, power_hp: 75, consumption_l100k: 5.6,
    co2_g_km: 128, category: 'eco',
    description: 'Berline spacieuse et économique, référence absolue au Maroc depuis 2004.',
    carquery_id: 'ma_dacia_logan_2023'
  },
  {
    make: 'Renault', model: 'Clio', year: 2023,
    price_eur: 13000, power_hp: 100, consumption_l100k: 5.4,
    co2_g_km: 122, category: 'eco',
    description: 'Citadine polyvalente, très populaire en milieu urbain marocain.',
    carquery_id: 'ma_renault_clio_2023'
  },
  {
    make: 'Renault', model: 'Symbol', year: 2022,
    price_eur: 10500, power_hp: 75, consumption_l100k: 5.9,
    co2_g_km: 134, category: 'eco',
    description: 'Berline compacte économique, très répandue dans les villes marocaines.',
    carquery_id: 'ma_renault_symbol_2022'
  },
  {
    make: 'Hyundai', model: 'i10', year: 2023,
    price_eur: 11000, power_hp: 67, consumption_l100k: 5.1,
    co2_g_km: 117, category: 'eco',
    description: 'Citadine coréenne, économique et fiable pour les ruelles de Fès ou les embouteillages de Casa.',
    carquery_id: 'ma_hyundai_i10_2023'
  },
  {
    make: 'Hyundai', model: 'i20', year: 2023,
    price_eur: 17000, power_hp: 100, consumption_l100k: 5.4,
    co2_g_km: 123, category: 'eco',
    description: 'Compacte moderne avec technologie embarquée avancée. La référence jeune au Maroc.',
    carquery_id: 'ma_hyundai_i20_2023'
  },
  {
    make: 'Kia', model: 'Picanto', year: 2023,
    price_eur: 11500, power_hp: 67, consumption_l100k: 5.0,
    co2_g_km: 113, category: 'eco',
    description: 'Citadine compacte coréenne, idéale pour les embouteillages de Casablanca.',
    carquery_id: 'ma_kia_picanto_2023'
  },
  {
    make: 'Peugeot', model: '208', year: 2023,
    price_eur: 14500, power_hp: 100, consumption_l100k: 5.3,
    co2_g_km: 120, category: 'eco',
    description: 'Citadine française au design soigné, succès confirmé dans tout le Maroc.',
    carquery_id: 'ma_peugeot_208_2023'
  },
  {
    make: 'Citroën', model: 'C3', year: 2023,
    price_eur: 13500, power_hp: 83, consumption_l100k: 5.4,
    co2_g_km: 123, category: 'eco',
    description: 'Citadine confortable — sa suspension unique absorbe les dos-d\'âne marocains.',
    carquery_id: 'ma_citroen_c3_2023'
  },
  {
    make: 'Fiat', model: 'Punto', year: 2020,
    price_eur: 8000, power_hp: 69, consumption_l100k: 6.0,
    co2_g_km: 139, category: 'eco',
    description: 'Citadine italienne économique, très courante dans les médinas et les quartiers.',
    carquery_id: 'ma_fiat_punto_2020'
  },
  {
    make: 'Seat', model: 'Ibiza', year: 2023,
    price_eur: 14000, power_hp: 90, consumption_l100k: 5.3,
    co2_g_km: 120, category: 'eco',
    description: 'Citadine espagnole au style jeune, populaire chez les étudiants et jeunes actifs.',
    carquery_id: 'ma_seat_ibiza_2023'
  },
  {
    make: 'Volkswagen', model: 'Polo', year: 2023,
    price_eur: 19000, power_hp: 95, consumption_l100k: 5.6,
    co2_g_km: 128, category: 'eco',
    description: 'Citadine allemande fiable — le signe que tu commences à t\'en sortir.',
    carquery_id: 'ma_volkswagen_polo_2023'
  },
  {
    make: 'Toyota', model: 'Yaris', year: 2023,
    price_eur: 18000, power_hp: 92, consumption_l100k: 4.6,
    co2_g_km: 104, category: 'eco',
    description: 'Citadine hybride japonaise, économique et indestructible.',
    carquery_id: 'ma_toyota_yaris_2023'
  },

  // ── PRACTICAL / MID-RANGE ──────────────────────────────────────────────
  {
    make: 'Dacia', model: 'Duster', year: 2023,
    price_eur: 19000, power_hp: 130, consumption_l100k: 6.5,
    co2_g_km: 148, category: 'practical',
    description: 'Le SUV abordable par excellence. Parfait pour les routes de montagne et les pistes du Maroc.',
    carquery_id: 'ma_dacia_duster_2023'
  },
  {
    make: 'Renault', model: 'Mégane', year: 2023,
    price_eur: 22000, power_hp: 115, consumption_l100k: 5.8,
    co2_g_km: 132, category: 'practical',
    description: 'Berline familiale élégante, le bon équilibre entre confort et agrément de conduite.',
    carquery_id: 'ma_renault_megane_2023'
  },
  {
    make: 'Peugeot', model: '2008', year: 2023,
    price_eur: 24000, power_hp: 130, consumption_l100k: 6.1,
    co2_g_km: 139, category: 'practical',
    description: "SUV compact au style distinctif — l'un des favoris des familles marocaines.",
    carquery_id: 'ma_peugeot_2008_2023'
  },
  {
    make: 'Peugeot', model: '308', year: 2023,
    price_eur: 26000, power_hp: 130, consumption_l100k: 5.9,
    co2_g_km: 134, category: 'practical',
    description: 'Berline compacte à l\'intérieur luxueux — la 308 fait son effet à l\'arrivée.',
    carquery_id: 'ma_peugeot_308_2023'
  },
  {
    make: 'Citroën', model: 'C4', year: 2023,
    price_eur: 25000, power_hp: 130, consumption_l100k: 5.8,
    co2_g_km: 132, category: 'practical',
    description: 'Fastback confortable — coussin de suspension unique, parfait Casablanca-Marrakech.',
    carquery_id: 'ma_citroen_c4_2023'
  },
  {
    make: 'Toyota', model: 'Corolla', year: 2023,
    price_eur: 24000, power_hp: 122, consumption_l100k: 5.5,
    co2_g_km: 125, category: 'practical',
    description: 'Berline hybride mondiale, plébiscitée pour sa fiabilité légendaire au Maroc.',
    carquery_id: 'ma_toyota_corolla_2023'
  },
  {
    make: 'Toyota', model: 'Land Cruiser', year: 2023,
    price_eur: 78000, power_hp: 309, consumption_l100k: 12.0,
    co2_g_km: 280, category: 'practical',
    description: 'Le 4x4 légendaire — incontournable pour les pistes du désert et les montagnes du Haut Atlas.',
    carquery_id: 'ma_toyota_landcruiser_2023'
  },
  {
    make: 'Hyundai', model: 'Tucson', year: 2023,
    price_eur: 32000, power_hp: 150, consumption_l100k: 7.2,
    co2_g_km: 164, category: 'practical',
    description: 'SUV familial élégant — un choix prisé de la classe moyenne marocaine montante.',
    carquery_id: 'ma_hyundai_tucson_2023'
  },
  {
    make: 'Kia', model: 'Sportage', year: 2023,
    price_eur: 29000, power_hp: 150, consumption_l100k: 7.0,
    co2_g_km: 159, category: 'practical',
    description: 'SUV coréen au style affirmé — très apprécié au Maroc pour son rapport qualité/prix.',
    carquery_id: 'ma_kia_sportage_2023'
  },
  {
    make: 'Volkswagen', model: 'Golf', year: 2023,
    price_eur: 28000, power_hp: 130, consumption_l100k: 5.8,
    co2_g_km: 132, category: 'practical',
    description: 'La référence des berlines compactes — avoir une Golf au Maroc, ça dit quelque chose.',
    carquery_id: 'ma_volkswagen_golf_2023'
  },
  {
    make: 'Seat', model: 'Leon', year: 2023,
    price_eur: 26000, power_hp: 130, consumption_l100k: 5.7,
    co2_g_km: 130, category: 'practical',
    description: 'Compacte sportive au design affûté, le bon rapport prix/fun.',
    carquery_id: 'ma_seat_leon_2023'
  },
  {
    make: 'Nissan', model: 'Juke', year: 2023,
    price_eur: 24000, power_hp: 114, consumption_l100k: 5.9,
    co2_g_km: 134, category: 'practical',
    description: 'SUV compact au style unique — un choix qui ne passe pas inaperçu.',
    carquery_id: 'ma_nissan_juke_2023'
  },
  {
    make: 'Ford', model: 'Focus', year: 2022,
    price_eur: 23000, power_hp: 125, consumption_l100k: 6.0,
    co2_g_km: 138, category: 'practical',
    description: 'Compacte au châssis dynamique et au bon espace familial.',
    carquery_id: 'ma_ford_focus_2022'
  },

  // ── PERFORMANCE ─────────────────────────────────────────────────────────
  {
    make: 'Volkswagen', model: 'Golf GTI', year: 2023,
    price_eur: 42000, power_hp: 245, consumption_l100k: 7.8,
    co2_g_km: 177, category: 'performance',
    description: 'L\'icône sportive compacte — plaisir de conduite pur, la GTI reste un rêve accessible au Maroc.',
    carquery_id: 'ma_volkswagen_golf_gti_2023'
  },
  {
    make: 'BMW', model: 'M140i', year: 2023,
    price_eur: 58000, power_hp: 340, consumption_l100k: 8.2,
    co2_g_km: 187, category: 'performance',
    description: 'La compacte BMW la plus sportive — propulsion, 340ch, sensations brutes.',
    carquery_id: 'ma_bmw_m140i_2023'
  },

  // ── LUXURY ──────────────────────────────────────────────────────────────
  {
    make: 'Audi', model: 'A3 Sportback', year: 2023,
    price_eur: 44000, power_hp: 150, consumption_l100k: 6.2,
    co2_g_km: 142, category: 'luxury',
    description: 'Premium compact allemand au cockpit virtuel — le premier niveau du luxe accessible.',
    carquery_id: 'ma_audi_a3_2023'
  },
  {
    make: 'BMW', model: 'Série 3', year: 2023,
    price_eur: 52000, power_hp: 156, consumption_l100k: 6.4,
    co2_g_km: 145, category: 'luxury',
    description: 'La BMW Série 3 — le rêve de beaucoup de Marocains. Symbole de réussite.',
    carquery_id: 'ma_bmw_serie3_2023'
  },
  {
    make: 'BMW', model: 'Série 5', year: 2023,
    price_eur: 82000, power_hp: 184, consumption_l100k: 6.9,
    co2_g_km: 157, category: 'luxury',
    description: 'La berline executive — tu es arrivé. Les cadres et chefs d\'entreprise la plébiscitent au Maroc.',
    carquery_id: 'ma_bmw_serie5_2023'
  },
  {
    make: 'BMW', model: 'X5', year: 2023,
    price_eur: 98000, power_hp: 340, consumption_l100k: 9.8,
    co2_g_km: 225, category: 'luxury',
    description: 'SUV premium imposant — très prisé parmi les familles aisées de Casablanca et Rabat.',
    carquery_id: 'ma_bmw_x5_2023'
  },
  {
    make: 'Mercedes', model: 'Classe C', year: 2023,
    price_eur: 54000, power_hp: 170, consumption_l100k: 6.6,
    co2_g_km: 150, category: 'luxury',
    description: 'La berline premium qui définit le standing à Casablanca. La Classe C, ça se remarque.',
    carquery_id: 'ma_mercedes_classec_2023'
  },
  {
    make: 'Mercedes', model: 'Classe E', year: 2023,
    price_eur: 88000, power_hp: 197, consumption_l100k: 7.1,
    co2_g_km: 161, category: 'luxury',
    description: "L'excellence executive de Mercedes — pour ceux qui ont tout accompli. Le choix des grands patrons.",
    carquery_id: 'ma_mercedes_classe_e_2023'
  },
  {
    make: 'Mercedes', model: 'GLE', year: 2023,
    price_eur: 105000, power_hp: 258, consumption_l100k: 9.2,
    co2_g_km: 211, category: 'luxury',
    description: 'Le SUV de luxe iconique — présence totale, confort de limousine. Incontournable à Marrakech.',
    carquery_id: 'ma_mercedes_gle_2023'
  }
];

async function seedMoroccanCars() {
  let added = 0;
  let skipped = 0;

  for (const car of MOROCCAN_CARS) {
    try {
      const existing = await get('SELECT id FROM cars WHERE carquery_id = ?', [car.carquery_id]);
      if (existing) { skipped++; continue; }

      await run(
        `INSERT INTO cars (make, model, year, price_eur, power_hp, consumption_l100k, co2_g_km, category, description, carquery_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [car.make, car.model, car.year, car.price_eur, car.power_hp,
         car.consumption_l100k, car.co2_g_km, car.category, car.description, car.carquery_id]
      );
      added++;
    } catch (err) {
      console.warn(`⚠️  Skip ${car.make} ${car.model}: ${err.message}`);
    }
  }

  if (added > 0) console.log(`🇲🇦  Maroc: +${added} voitures ajoutées`);
  else console.log(`🇲🇦  Maroc: ${skipped} voitures déjà en base`);
  return added;
}

module.exports = { seedMoroccanCars };
