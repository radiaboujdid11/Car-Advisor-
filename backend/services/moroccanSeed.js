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

  // ── ECO / BUDGET (new additions from 2024 dataset) ────────────────────
  {
    make: 'Renault', model: 'Kwid', year: 2023,
    price_eur: 12963, power_hp: 72, consumption_l100k: 5.2,
    co2_g_km: 122, category: 'eco',
    description: 'La voiture la plus accessible du Maroc — fiable, légère, économique.',
    carquery_id: 'ma_renault_kwid_2023'
  },
  {
    make: 'Citroën', model: 'C1', year: 2024,
    price_eur: 15741, power_hp: 82, consumption_l100k: 5.0,
    co2_g_km: 118, category: 'eco',
    description: 'Citadine ultra-compacte pour les médinas — petite, maniable, économique.',
    carquery_id: 'ma_citroen_c1_2024'
  },
  {
    make: 'Ford', model: 'EcoSport', year: 2024,
    price_eur: 29167, power_hp: 125, consumption_l100k: 6.5,
    co2_g_km: 153, category: 'eco',
    description: 'SUV urbain compact à bon prix — idéal famille jeune au Maroc.',
    carquery_id: 'ma_ford_ecosport_2024'
  },
  {
    make: 'Toyota', model: 'C-HR', year: 2023,
    price_eur: 36574, power_hp: 122, consumption_l100k: 6.0,
    co2_g_km: 140, category: 'eco',
    description: 'SUV hybride au design avant-gardiste — moderne et économique.',
    carquery_id: 'ma_toyota_chr_2023'
  },

  // ── PRACTICAL / MID-RANGE (new additions) ─────────────────────────────
  {
    make: 'Peugeot', model: '3008', year: 2024,
    price_eur: 35648, power_hp: 130, consumption_l100k: 6.2,
    co2_g_km: 145, category: 'practical',
    description: 'SUV français au design distinct — l\'un des préférés des familles aisées.',
    carquery_id: 'ma_peugeot_3008_2024'
  },
  {
    make: 'Hyundai', model: 'Creta', year: 2024,
    price_eur: 31481, power_hp: 123, consumption_l100k: 6.5,
    co2_g_km: 152, category: 'practical',
    description: 'SUV compact coréen spacieux — le rapport qualité/prix parfait.',
    carquery_id: 'ma_hyundai_creta_2024'
  },
  {
    make: 'Nissan', model: 'Qashqai', year: 2023,
    price_eur: 36111, power_hp: 140, consumption_l100k: 6.8,
    co2_g_km: 160, category: 'practical',
    description: 'SUV familial fiable — l\'inventeur du segment crossover.',
    carquery_id: 'ma_nissan_qashqai_2023'
  },
  {
    make: 'Toyota', model: 'RAV4', year: 2023,
    price_eur: 48148, power_hp: 171, consumption_l100k: 7.2,
    co2_g_km: 170, category: 'practical',
    description: 'SUV hybride référence mondiale — robuste, économique, polyvalent.',
    carquery_id: 'ma_toyota_rav4_2023'
  },
  {
    make: 'Renault', model: 'Espace', year: 2024,
    price_eur: 53704, power_hp: 165, consumption_l100k: 7.5,
    co2_g_km: 176, category: 'practical',
    description: 'Grand SUV 7 places — parfait pour la grande famille marocaine.',
    carquery_id: 'ma_renault_espace_2024'
  },
  {
    make: 'Peugeot', model: '5008', year: 2023,
    price_eur: 57870, power_hp: 180, consumption_l100k: 7.3,
    co2_g_km: 172, category: 'practical',
    description: 'SUV 7 places premium — le choix de la famille qui veut tout.',
    carquery_id: 'ma_peugeot_5008_2023'
  },
  {
    make: 'Ford', model: 'Galaxy', year: 2024,
    price_eur: 54630, power_hp: 160, consumption_l100k: 7.6,
    co2_g_km: 178, category: 'practical',
    description: 'Monospace familial spacieux — idéal pour les voyages inter-villes.',
    carquery_id: 'ma_ford_galaxy_2024'
  },
  {
    make: 'Nissan', model: 'X-Trail', year: 2023,
    price_eur: 56481, power_hp: 158, consumption_l100k: 7.4,
    co2_g_km: 174, category: 'practical',
    description: 'SUV familial fiable et spacieux — excellent pour les longs trajets.',
    carquery_id: 'ma_nissan_xtrail_2023'
  },

  // ── PERFORMANCE (new additions) ─────────────────────────────────────────
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

  {
    make: 'Renault', model: 'Mégane RS', year: 2024,
    price_eur: 64352, power_hp: 280, consumption_l100k: 8.5,
    co2_g_km: 200, category: 'performance',
    description: 'La compacte sportive française ultime — 280ch, comportement affûté.',
    carquery_id: 'ma_renault_megane_rs_2024'
  },
  {
    make: 'Peugeot', model: '308 GTi', year: 2023,
    price_eur: 65741, power_hp: 270, consumption_l100k: 8.2,
    co2_g_km: 193, category: 'performance',
    description: 'Hot hatch français — 270ch, châssis Peugeot Sport, sensations pures.',
    carquery_id: 'ma_peugeot_308gti_2023'
  },
  {
    make: 'Toyota', model: 'GR86', year: 2024,
    price_eur: 72222, power_hp: 235, consumption_l100k: 8.0,
    co2_g_km: 188, category: 'performance',
    description: 'Sportive japonaise propulsion légère — plaisir de conduite pur.',
    carquery_id: 'ma_toyota_gr86_2024'
  },
  {
    make: 'Nissan', model: '370Z', year: 2023,
    price_eur: 78704, power_hp: 370, consumption_l100k: 10.0,
    co2_g_km: 235, category: 'performance',
    description: 'Roadster sportif japonais — propulsion, V6, sensations authentiques.',
    carquery_id: 'ma_nissan_370z_2023'
  },
  {
    make: 'Ford', model: 'Mustang', year: 2024,
    price_eur: 111111, power_hp: 450, consumption_l100k: 11.0,
    co2_g_km: 260, category: 'performance',
    description: 'L\'icône américaine — V8, sound légendaire, rêve absolu.',
    carquery_id: 'ma_ford_mustang_2024'
  },

  // ── LUXURY (new additions) ──────────────────────────────────────────────
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
  },
  {
    make: 'Audi', model: 'A4', year: 2024,
    price_eur: 81019, power_hp: 245, consumption_l100k: 7.5,
    co2_g_km: 176, category: 'luxury',
    description: 'Berline premium Audi — cockpit virtuel, raffinement allemand discret.',
    carquery_id: 'ma_audi_a4_2024'
  },
  {
    make: 'Mercedes', model: 'GLC', year: 2024,
    price_eur: 111111, power_hp: 258, consumption_l100k: 7.8,
    co2_g_km: 183, category: 'luxury',
    description: 'SUV premium compact Mercedes — le symbole du succès à Casa et Rabat.',
    carquery_id: 'ma_mercedes_glc_2024'
  },
  {
    make: 'Land Rover', model: 'Range Rover Sport', year: 2023,
    price_eur: 194444, power_hp: 355, consumption_l100k: 9.5,
    co2_g_km: 225, category: 'luxury',
    description: 'Le SUV de luxe ultime — Marrakech, Tanger, Casa — il commande le respect.',
    carquery_id: 'ma_landrover_rrover_sport_2023'
  },

  // ── HYUNDAI MAROC 2025 (prix officiels MAD → EUR /10.8) ───────────────
  {
    make: 'Hyundai', model: 'Grand i10 Sedan', year: 2025,
    price_eur: 15083, power_hp: 83, consumption_l100k: 5.5,
    co2_g_km: 126, category: 'eco',
    description: 'Berline compacte coréenne accessible — 83ch, économique, idéale pour les trajets urbains au Maroc.',
    carquery_id: 'ma_hyundai_grand_i10_sedan_2025'
  },
  {
    make: 'Hyundai', model: 'Kona', year: 2025,
    price_eur: 31287, power_hp: 141, consumption_l100k: 5.0,
    co2_g_km: 115, category: 'practical',
    description: 'SUV compact hybride coréen — 141ch, technologie avancée, confort moderne pour la famille marocaine.',
    carquery_id: 'ma_hyundai_kona_2025'
  },

  {
    make: 'Hyundai', model: 'Accent', year: 2025,
    price_eur: 19528, power_hp: 115, consumption_l100k: 6.0,
    co2_g_km: 138, category: 'eco',
    description: 'Berline compacte coréenne fiable — 115ch, économique, très prisée dans les villes marocaines.',
    carquery_id: 'ma_hyundai_accent_2025'
  },
  {
    make: 'Hyundai', model: 'Elantra', year: 2025,
    price_eur: 30361, power_hp: 141, consumption_l100k: 4.8,
    co2_g_km: 110, category: 'practical',
    description: 'Berline hybride élégante — 141ch, design affûté, technologie hybride économique. Succès croissant au Maroc.',
    carquery_id: 'ma_hyundai_elantra_2025'
  },
  {
    make: 'Hyundai', model: 'Sonata', year: 2025,
    price_eur: 35176, power_hp: 195, consumption_l100k: 5.4,
    co2_g_km: 123, category: 'luxury',
    description: 'Berline executive hybride — 195ch, habitacle premium, technologie de pointe. Le haut de gamme Hyundai au Maroc.',
    carquery_id: 'ma_hyundai_sonata_2025'
  },

  {
    make: 'Hyundai', model: 'Tucson HEV', year: 2025,
    price_eur: 33324, power_hp: 230, consumption_l100k: 5.3,
    co2_g_km: 120, category: 'practical',
    description: 'SUV hybride full — 230ch, confort supérieur, économique sur autoroute. Le Tucson le plus vendu au Maroc.',
    carquery_id: 'ma_hyundai_tucson_hev_2025'
  },
  {
    make: 'Hyundai', model: 'Tucson PHEV', year: 2025,
    price_eur: 37028, power_hp: 253, consumption_l100k: 1.6,
    co2_g_km: 37, category: 'practical',
    description: 'SUV hybride rechargeable — 253ch, 50km en électrique pur, le choix premium pour les navetteurs marocains.',
    carquery_id: 'ma_hyundai_tucson_phev_2025'
  },
  {
    make: 'Hyundai', model: 'Santa Fe HEV', year: 2025,
    price_eur: 47769, power_hp: 215, consumption_l100k: 5.8,
    co2_g_km: 133, category: 'practical',
    description: 'Grand SUV hybride familial — 215ch, 7 places optionnel, confort premium pour les longs trajets Maroc.',
    carquery_id: 'ma_hyundai_santafe_hev_2025'
  },
  {
    make: 'Hyundai', model: 'IONIQ 5', year: 2025,
    price_eur: 55463, power_hp: 217, consumption_l100k: 16.8,
    co2_g_km: 0, category: 'eco',
    description: 'SUV électrique iconique — jusqu\'à 306ch, 507km d\'autonomie, design rétro-futuriste. La star électrique de Hyundai au Maroc.',
    carquery_id: 'ma_hyundai_ioniq5_2025'
  },
  {
    make: 'Hyundai', model: 'IONIQ 6', year: 2025,
    price_eur: 58324, power_hp: 229, consumption_l100k: 14.3,
    co2_g_km: 0, category: 'eco',
    description: 'Berline électrique aérodynamique — jusqu\'à 325ch, 614km d\'autonomie, Cx record 0.21. L\'élite électrique Hyundai.',
    carquery_id: 'ma_hyundai_ioniq6_2025'
  },

  // ── LAND ROVER MAROC 2025 (prix officiels MAD → EUR /10.8) ───────────
  {
    make: 'Land Rover', model: 'Defender', year: 2025,
    price_eur: 74889, power_hp: 300, consumption_l100k: 9.5,
    co2_g_km: 218, category: 'luxury',
    description: 'Le tout-terrain légendaire — robustesse iconique, capacités off-road extrêmes, présence imposante. L\'aventure au summum du luxe.',
    carquery_id: 'ma_landrover_defender_2025'
  },
  {
    make: 'Land Rover', model: 'Discovery', year: 2025,
    price_eur: 71722, power_hp: 249, consumption_l100k: 8.8,
    co2_g_km: 202, category: 'luxury',
    description: 'Grand SUV 7 places aventurier — confort familial premium, capacités tout-terrain remarquables. Parfait Casa-Agadir avec famille.',
    carquery_id: 'ma_landrover_discovery_2025'
  },
  {
    make: 'Land Rover', model: 'Range Rover Evoque', year: 2025,
    price_eur: 43861, power_hp: 200, consumption_l100k: 8.0,
    co2_g_km: 183, category: 'luxury',
    description: 'SUV compact premium — le Range Rover le plus accessible, design urbain sculptural, luxe British compact.',
    carquery_id: 'ma_landrover_rr_evoque_2025'
  },
  {
    make: 'Land Rover', model: 'Range Rover Velar', year: 2025,
    price_eur: 57204, power_hp: 250, consumption_l100k: 8.2,
    co2_g_km: 188, category: 'luxury',
    description: 'SUV coupé élégant — silhouette fastback distinctive, cockpit Touch Pro Duo, luxe discret et contemporain.',
    carquery_id: 'ma_landrover_rr_velar_2025'
  },
  {
    make: 'Land Rover', model: 'Range Rover Sport', year: 2025,
    price_eur: 107083, power_hp: 395, consumption_l100k: 9.8,
    co2_g_km: 225, category: 'luxury',
    description: 'Le SUV de luxe sportif ultime — dynamisme et prestige absolus. Incontournable à Marrakech et Casablanca.',
    carquery_id: 'ma_landrover_rr_sport_2025'
  },
  {
    make: 'Land Rover', model: 'Range Rover Vogue', year: 2025,
    price_eur: 152870, power_hp: 530, consumption_l100k: 10.5,
    co2_g_km: 240, category: 'luxury',
    description: 'Le summum du luxe britannique — l\'original Range Rover, berline du désert, symbole absolu de réussite au Maroc.',
    carquery_id: 'ma_landrover_rr_vogue_2025'
  },

  // ── BMW MAROC 2025 ────────────────────────────────────────────────────
  { make:'BMW', model:'Série 1', year:2025, price_eur:31852, power_hp:136, consumption_l100k:5.5, co2_g_km:125, category:'eco', description:'Compacte premium BMW — entrée dans l\'univers BMW, dynamisme et technologie au quotidien.', carquery_id:'ma_bmw_serie1_2025', photo_url:'https://www.moteur.ma/storage/media/images/models/nouvelle-serie%201-651.png' },
  { make:'BMW', model:'Série 2', year:2025, price_eur:37954, power_hp:156, consumption_l100k:6.0, co2_g_km:138, category:'eco', description:'Coupé/Gran Coupé compact BMW — sport et élégance à prix accessible.', carquery_id:'ma_bmw_serie2_2025', photo_url:'https://www.moteur.ma/storage/media/images/models/nouvelle-serie%202-467.png' },
  { make:'BMW', model:'Série 4', year:2025, price_eur:55000, power_hp:184, consumption_l100k:6.8, co2_g_km:155, category:'luxury', description:'Coupé 4 portes BMW — la grande gueule de la gamme, sportivité assumée et présence imposante.', carquery_id:'ma_bmw_serie4_2025', photo_url:'https://www.moteur.ma/storage/media/images/models/nouvelle-serie%204-719.png' },
  { make:'BMW', model:'Série 7', year:2025, price_eur:130463, power_hp:340, consumption_l100k:7.5, co2_g_km:172, category:'luxury', description:'Limousine flagship BMW — technologie i-Vision, écran arrière, le summum du luxe allemand au Maroc.', carquery_id:'ma_bmw_serie7_2025', photo_url:'https://www.moteur.ma/storage/media/images/models/nouvelle-serie%207-321.png' },
  { make:'BMW', model:'i5', year:2025, price_eur:90093, power_hp:340, consumption_l100k:19.0, co2_g_km:0, category:'luxury', description:'Berline électrique executive BMW — 340ch, 582km d\'autonomie, le futur de la Série 5.', carquery_id:'ma_bmw_i5_2025', photo_url:'https://www.moteur.ma/storage/media/images/models/nouvelle-i5-656.png' },
  { make:'BMW', model:'iX', year:2025, price_eur:110000, power_hp:385, consumption_l100k:21.0, co2_g_km:0, category:'luxury', description:'SUV électrique flagship BMW — 385ch, 630km, design statement. L\'avenir du SAV BMW.', carquery_id:'ma_bmw_ix_2025', photo_url:'https://www.moteur.ma/storage/media/images/models/nouvelle-ix-947.png' },
  { make:'BMW', model:'X1', year:2025, price_eur:46759, power_hp:136, consumption_l100k:6.2, co2_g_km:141, category:'practical', description:'SAV compact BMW — le plus accessible des X, polyvalent et premium pour le quotidien urbain.', carquery_id:'ma_bmw_x1_2025', photo_url:'https://www.moteur.ma/storage/media/images/models/nouvelle-x1-483.png' },
  { make:'BMW', model:'X2', year:2025, price_eur:46019, power_hp:170, consumption_l100k:6.5, co2_g_km:148, category:'practical', description:'SAV coupé sportif BMW — toit fuyant, silhouette dynamique, le X compact avec du caractère.', carquery_id:'ma_bmw_x2_2025', photo_url:'https://www.moteur.ma/storage/media/images/models/nouvelle-x2-928.png' },
  { make:'BMW', model:'X3', year:2025, price_eur:55093, power_hp:184, consumption_l100k:7.0, co2_g_km:160, category:'practical', description:'SAV familial BMW référence — le best-seller BMW au Maroc, équilibre parfait entre luxe et praticité.', carquery_id:'ma_bmw_x3_2025', photo_url:'https://www.moteur.ma/storage/media/images/models/nouvelle-x3-378.png' },
  { make:'BMW', model:'X4', year:2025, price_eur:62037, power_hp:184, consumption_l100k:7.2, co2_g_km:165, category:'luxury', description:'SAV coupé BMW — la sportivité du X3 sous une ligne de toit sculptée. Style avant tout.', carquery_id:'ma_bmw_x4_2025', photo_url:'https://www.moteur.ma/storage/media/images/models/nouvelle-x4-105.png' },
  { make:'BMW', model:'X6', year:2025, price_eur:93519, power_hp:340, consumption_l100k:9.5, co2_g_km:218, category:'luxury', description:'SAV coupé grand format — la provocation sur roues. Présence totale sur le boulevard Casa.', carquery_id:'ma_bmw_x6_2025', photo_url:'https://www.moteur.ma/storage/media/images/models/nouvelle-x6-404.png' },
  { make:'BMW', model:'X7', year:2025, price_eur:127870, power_hp:340, consumption_l100k:10.0, co2_g_km:228, category:'luxury', description:'Grand SAV 7 places BMW — le plus grand, le plus luxueux. La réponse BMW au GLE de Mercedes.', carquery_id:'ma_bmw_x7_2025', photo_url:'https://www.moteur.ma/storage/media/images/models/nouvelle-x7-174.png' },
  { make:'BMW', model:'XM', year:2025, price_eur:169352, power_hp:653, consumption_l100k:3.7, co2_g_km:83, category:'performance', description:'Le SUV M le plus puissant — 653ch hybride, 0-100 en 4.3s. L\'absolu de la performance BMW.', carquery_id:'ma_bmw_xm_2025', photo_url:'https://www.moteur.ma/storage/media/images/models/nouvelle-xm-576.png' },
  { make:'BMW', model:'Z4', year:2025, price_eur:70463, power_hp:258, consumption_l100k:7.1, co2_g_km:162, category:'performance', description:'Roadster BMW — capote souple, propulsion, 258ch. Le plaisir de conduire à l\'état pur sous le soleil marocain.', carquery_id:'ma_bmw_z4_2025', photo_url:'https://www.moteur.ma/storage/media/images/models/nouvelle-z4-108.png' },

  // ── BYD MAROC 2025 (tout électrique) ─────────────────────────────────
  { make:'BYD', model:'ATTO 2',     year:2025, price_eur:24065, power_hp:95,  consumption_l100k:13.5, co2_g_km:0, category:'eco',       description:'Citadine électrique BYD abordable — 405km d\'autonomie, technologie Blade Battery, la mobilité électrique accessible.',             carquery_id:'ma_byd_atto2_2025',     photo_url:'https://www.moteur.ma/storage/media/images/models/nouvelle-atto-2-965.png' },
  { make:'BYD', model:'ATTO 3',     year:2025, price_eur:36944, power_hp:204, consumption_l100k:15.0, co2_g_km:0, category:'eco',       description:'SUV électrique compact — 420km, intérieur rotatif futuriste, le best-seller BYD au Maroc.',                                          carquery_id:'ma_byd_atto3_2025',     photo_url:'https://www.moteur.ma/storage/media/images/models/nouvelle-atto3-566.png' },
  { make:'BYD', model:'ATTO 3 EVO', year:2025, price_eur:32954, power_hp:204, consumption_l100k:14.5, co2_g_km:0, category:'eco',       description:'Version évoluée de l\'Atto 3 — autonomie améliorée, équipements enrichis, rapport qualité/prix imbattable.',                         carquery_id:'ma_byd_atto3evo_2025',  photo_url:'https://www.moteur.ma/storage/media/images/models/nouvelle-atto-3-evo-330.png' },
  { make:'BYD', model:'HAN',        year:2025, price_eur:61102, power_hp:517, consumption_l100k:20.0, co2_g_km:0, category:'luxury',    description:'Berline électrique haute performance — 517ch, 0-100 en 3.9s, le flagship BYD rivalise avec Tesla Model S.',                          carquery_id:'ma_byd_han_2025',       photo_url:'https://www.moteur.ma/storage/media/images/models/nouvelle-han-495.png' },
  { make:'BYD', model:'Seal',       year:2025, price_eur:33324, power_hp:313, consumption_l100k:15.9, co2_g_km:0, category:'practical', description:'Berline sport électrique — 313ch, 570km, propulsion ou intégrale. La rivale de Tesla Model 3 au Maroc.',                          carquery_id:'ma_byd_seal_2025',      photo_url:'https://www.moteur.ma/storage/media/images/models/nouvelle-seal-480.png' },
  { make:'BYD', model:'SEAL 5',     year:2025, price_eur:24065, power_hp:136, consumption_l100k:13.8, co2_g_km:0, category:'eco',       description:'SUV électrique compact économique — 430km, l\'entrée de gamme SUV électrique BYD.',                                               carquery_id:'ma_byd_seal5_2025',     photo_url:'https://www.moteur.ma/storage/media/images/models/nouvelle-seal-5-707.png' },
  { make:'BYD', model:'Seal U',     year:2025, price_eur:33324, power_hp:204, consumption_l100k:15.5, co2_g_km:0, category:'practical', description:'SUV électrique familial — 420km, espace généreux, le SUV électrique polyvalent de BYD.',                                          carquery_id:'ma_byd_sealu_2025',     photo_url:'https://www.moteur.ma/storage/media/images/models/nouvelle-seal u-692.png' },
  { make:'BYD', model:'Sealion 5',  year:2025, price_eur:27769, power_hp:160, consumption_l100k:14.2, co2_g_km:0, category:'eco',       description:'SUV électrique moderne — design affûté, 450km, technologie avancée à prix compétitif.',                                          carquery_id:'ma_byd_sealion5_2025',  photo_url:'https://www.moteur.ma/storage/media/images/models/nouvelle-sealion-5-352.png' },
  { make:'BYD', model:'Sealion 7',  year:2025, price_eur:45361, power_hp:390, consumption_l100k:18.0, co2_g_km:0, category:'practical', description:'Grand SUV électrique — 390ch intégrale, 502km, 7 places optionnel. L\'électrique de la grande famille.',                         carquery_id:'ma_byd_sealion7_2025',  photo_url:'https://www.moteur.ma/storage/media/images/models/nouvelle-sealion-7-995.png' },
  { make:'BYD', model:'T3',         year:2025, price_eur:36944, power_hp:70,  consumption_l100k:13.0, co2_g_km:0, category:'practical', description:'Utilitaire électrique compact — grand volume de chargement, zéro émission, idéal pour les artisans et commerçants marocains.',   carquery_id:'ma_byd_t3_2025',        photo_url:'https://www.moteur.ma/storage/media/images/models/nouvelle-t3-706.PNG' },
  { make:'BYD', model:'Tang',       year:2025, price_eur:64722, power_hp:517, consumption_l100k:22.0, co2_g_km:0, category:'luxury',    description:'Grand SUV 7 places électrique — 517ch, 0-100 en 4.6s, luxe technologique chinois au sommet.',                                     carquery_id:'ma_byd_tang_2025',      photo_url:'https://www.moteur.ma/storage/media/images/models/nouvelle-tang-411.png' },

  // ── ALFA ROMEO MAROC 2025 ──────────────────────────────────────────────
  {
    make: 'Alfa Romeo', model: 'Giulia', year: 2025,
    price_eur: 55093, power_hp: 280, consumption_l100k: 7.0,
    co2_g_km: 158, category: 'performance',
    description: 'Berline sportive italienne — châssis propulsion, 280ch, design passionnel. La Ferrari des berlines accessibles.',
    carquery_id: 'ma_alfaromeo_giulia_2025'
  },
  {
    make: 'Alfa Romeo', model: 'Junior', year: 2025,
    price_eur: 28286, power_hp: 136, consumption_l100k: 5.8,
    co2_g_km: 132, category: 'eco',
    description: 'SUV compact électrique/hybride — design Alfa moderne, le plus accessible de la gamme au Maroc.',
    carquery_id: 'ma_alfaromeo_junior_2025'
  },
  {
    make: 'Alfa Romeo', model: 'Stelvio', year: 2025,
    price_eur: 45278, power_hp: 280, consumption_l100k: 7.5,
    co2_g_km: 170, category: 'luxury',
    description: 'SUV sportif premium italien — le seul SUV qui conduit comme une vraie sportive. Style romain, performance germanique.',
    carquery_id: 'ma_alfaromeo_stelvio_2025'
  },
  {
    make: 'Alfa Romeo', model: 'Tonale', year: 2025,
    price_eur: 35833, power_hp: 160, consumption_l100k: 5.5,
    co2_g_km: 126, category: 'practical',
    description: 'SUV hybride compact — le pont entre l\'émotion italienne et la praticité moderne. Style affirmé, technologie embarquée.',
    carquery_id: 'ma_alfaromeo_tonale_2025'
  },

  // ── AUDI MAROC 2025 ────────────────────────────────────────────────────
  {
    make: 'Audi', model: 'A1', year: 2025,
    price_eur: 31019, power_hp: 95, consumption_l100k: 5.2,
    co2_g_km: 119, category: 'eco',
    description: 'Citadine premium allemande — la plus petite Audi, premium dès l\'entrée. Idéale pour Casablanca.',
    carquery_id: 'ma_audi_a1_2025',
    photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-a1-994.png'
  },
  {
    make: 'Audi', model: 'A5', year: 2025,
    price_eur: 54537, power_hp: 204, consumption_l100k: 6.8,
    co2_g_km: 155, category: 'luxury',
    description: 'Berline/Sportback premium — 204ch, design sculpté, cockpit virtuel. L\'Audi du cadre ambitieux.',
    carquery_id: 'ma_audi_a5_2025',
    photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-a5-870.jpg'
  },
  {
    make: 'Audi', model: 'A6', year: 2025,
    price_eur: 61019, power_hp: 204, consumption_l100k: 7.2,
    co2_g_km: 164, category: 'luxury',
    description: 'Berline executive Audi — technologie mild-hybrid, habitacle ultra-premium, le choix des dirigeants marocains.',
    carquery_id: 'ma_audi_a6_2025',
    photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-a6-906.png'
  },
  {
    make: 'Audi', model: 'A7', year: 2025,
    price_eur: 76852, power_hp: 340, consumption_l100k: 7.8,
    co2_g_km: 178, category: 'luxury',
    description: 'Sportback grand tourisme — 340ch, silhouette coupé 5 portes, le summum de l\'élégance sportive Audi.',
    carquery_id: 'ma_audi_a7_2025',
    photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-a7-596.png'
  },
  {
    make: 'Audi', model: 'A8', year: 2025,
    price_eur: 135093, power_hp: 340, consumption_l100k: 8.0,
    co2_g_km: 183, category: 'luxury',
    description: 'La limousine Audi ultime — prestige absolu, massage, suspension pneumatique. La rivale de la Classe S au Maroc.',
    carquery_id: 'ma_audi_a8_2025',
    photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-a8-570.png'
  },
  {
    make: 'Audi', model: 'Q2', year: 2025,
    price_eur: 34815, power_hp: 116, consumption_l100k: 5.5,
    co2_g_km: 126, category: 'eco',
    description: 'SUV compact premium urbain — le plus petit SUV Audi, style assertif, parfait pour les ruelles de Marrakech.',
    carquery_id: 'ma_audi_q2_2025',
    photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-q2-435.png'
  },
  {
    make: 'Audi', model: 'Q3', year: 2025,
    price_eur: 46204, power_hp: 150, consumption_l100k: 6.5,
    co2_g_km: 148, category: 'practical',
    description: 'SUV familial premium — espace, technologie, prestige accessible. L\'entrée dans les SUV Audi au Maroc.',
    carquery_id: 'ma_audi_q3_2025',
    photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-q3-612.png'
  },
  {
    make: 'Audi', model: 'Q3 Sportback', year: 2025,
    price_eur: 48889, power_hp: 150, consumption_l100k: 6.7,
    co2_g_km: 153, category: 'practical',
    description: 'SUV coupé premium — la ligne sportive du Q3, toit fuyant élégant. Style avant la raison.',
    carquery_id: 'ma_audi_q3_sportback_2025',
    photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-q3-sportback-294.png'
  },
  {
    make: 'Audi', model: 'Q5', year: 2025,
    price_eur: 62407, power_hp: 204, consumption_l100k: 6.8,
    co2_g_km: 155, category: 'practical',
    description: 'SUV familial premium référence — le best-seller Audi au Maroc. Équilibre parfait technologie/confort/prestige.',
    carquery_id: 'ma_audi_q5_2025',
    photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-q5-923.png'
  },
  {
    make: 'Audi', model: 'Q5 Sportback', year: 2025,
    price_eur: 67963, power_hp: 204, consumption_l100k: 7.0,
    co2_g_km: 160, category: 'luxury',
    description: 'SUV coupé premium — le Q5 avec une ligne de toit fuyante spectaculaire. Style et prestige maximaux.',
    carquery_id: 'ma_audi_q5_sportback_2025',
    photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-q5-sportback-419.png'
  },
  {
    make: 'Audi', model: 'Q6', year: 2025,
    price_eur: 73704, power_hp: 299, consumption_l100k: 17.5,
    co2_g_km: 0, category: 'luxury',
    description: 'SUV électrique premium Audi — 299ch, 625km d\'autonomie, technologie e-tron. Le futur du luxe allemand.',
    carquery_id: 'ma_audi_q6_2025',
    photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-q6-508.png'
  },
  {
    make: 'Audi', model: 'Q7', year: 2025,
    price_eur: 73333, power_hp: 245, consumption_l100k: 8.5,
    co2_g_km: 195, category: 'luxury',
    description: 'Grand SUV 7 places luxueux — l\'Audi familiale ultime, présence imposante, confort de limousine.',
    carquery_id: 'ma_audi_q7_2025',
    photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-q7-884.png'
  },
  {
    make: 'Audi', model: 'Q8', year: 2025,
    price_eur: 88704, power_hp: 286, consumption_l100k: 8.8,
    co2_g_km: 201, category: 'luxury',
    description: 'Le SUV coupé flagship Audi — design spectaculaire, prestige absolu. Le sommet de la gamme SUV Audi au Maroc.',
    carquery_id: 'ma_audi_q8_2025',
    photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-q8-167.png'
  },
  {
    make: 'Audi', model: 'RS 3', year: 2025,
    price_eur: 87963, power_hp: 400, consumption_l100k: 8.0,
    co2_g_km: 182, category: 'performance',
    description: 'Compacte sportive ultime — 400ch, 5 cylindres iconique, 0-100 en 3.8s. La bombe compacte Audi.',
    carquery_id: 'ma_audi_rs3_2025',
    photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-rs-3-938.png'
  },
  {
    make: 'Audi', model: 'RS Q8', year: 2025,
    price_eur: 208241, power_hp: 600, consumption_l100k: 10.5,
    co2_g_km: 240, category: 'performance',
    description: 'Le SUV le plus rapide du monde — 600ch, 0-100 en 3.6s, Nürburgring record. L\'absolu pour les passionnés.',
    carquery_id: 'ma_audi_rsq8_2025',
    photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-rs-q8-428.png'
  },

  // ── BENTLEY MAROC 2025 ────────────────────────────────────────────────
  {
    make: 'Bentley', model: 'Bentayga', year: 2025,
    price_eur: 236111, power_hp: 550, consumption_l100k: 12.0,
    co2_g_km: 275, category: 'luxury',
    description: 'Le SUV le plus luxueux du monde — 550ch, habitacle artisanal, le sommet du raffinement britannique au Maroc.',
    carquery_id: 'ma_bentley_bentayga_2025',
    photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-bentayga-650.png'
  },
  {
    make: 'Bentley', model: 'Continental GT', year: 2025,
    price_eur: 351852, power_hp: 650, consumption_l100k: 13.0,
    co2_g_km: 298, category: 'luxury',
    description: 'Grand Tourisme britannique ultime — W12 650ch, cuir Mulliner, le coupé de prestige absolu.',
    carquery_id: 'ma_bentley_continental_2025',
    photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-continental-623.png'
  },
  {
    make: 'Bentley', model: 'Flying Spur', year: 2025,
    price_eur: 254630, power_hp: 635, consumption_l100k: 12.5,
    co2_g_km: 285, category: 'luxury',
    description: 'Berline de prestige — 4 portes, 635ch, l\'expérience Rolls-Royce à la sportivité Bentley. L\'ultime limousine.',
    carquery_id: 'ma_bentley_flyingspur_2025',
    photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-flying spur-110.png'
  },
  {
    make: 'Bentley', model: 'Mulsanne', year: 2024,
    price_eur: 280000, power_hp: 530, consumption_l100k: 14.5,
    co2_g_km: 330, category: 'luxury',
    description: 'La limousine flagship Bentley — artisanat pur, 530ch, intérieur bois et cuir fait main. Le nec plus ultra.',
    carquery_id: 'ma_bentley_mulsanne_2024',
    photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-mulsanne-356.png'
  },

  // ── DACIA MAROC 2025 (prix officiels MAD → EUR /10.8) ─────────────────
  {
    make: 'Dacia', model: 'Spring', year: 2025,
    price_eur: 19907, power_hp: 65, consumption_l100k: 14.5,
    co2_g_km: 0, category: 'eco',
    description: 'Citadine électrique la plus accessible du Maroc. 230 km d\'autonomie, zéro émission — la mobilité verte à portée de tous.',
    carquery_id: 'ma_dacia_spring_2025'
  },
  {
    make: 'Dacia', model: 'Sandero Stepway', year: 2025,
    price_eur: 14629, power_hp: 91, consumption_l100k: 5.7,
    co2_g_km: 130, category: 'eco',
    description: 'Version crossover surélevée de la Sandero — garde au sol plus haute, style baroudeur, polyvalence urbaine et piste.',
    carquery_id: 'ma_dacia_sandero_stepway_2025'
  },
  {
    make: 'Dacia', model: 'Jogger', year: 2025,
    price_eur: 18139, power_hp: 110, consumption_l100k: 5.1,
    co2_g_km: 116, category: 'practical',
    description: 'Familiale 7 places Dacia hybride — spacieuse, économique, le choix de la grande famille marocaine à prix raisonnable.',
    carquery_id: 'ma_dacia_jogger_2025'
  },

  // ── FIAT MAROC 2025 ────────────────────────────────────────────────────
  {
    make: 'Fiat', model: 'Doblo', year: 2025,
    price_eur: 22977, power_hp: 130, consumption_l100k: 6.5,
    co2_g_km: 148, category: 'practical',
    description: 'Utilitaire familial polyvalent — 5 ou 7 places, volume de chargement généreux. Le fourgon pratique à l\'italienne pour les familles marocaines.',
    carquery_id: 'ma_fiat_doblo_2025',
    photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-doblo-532.png'
  },
  {
    make: 'Fiat', model: '500', year: 2025,
    price_eur: 16620, power_hp: 70, consumption_l100k: 5.0,
    co2_g_km: 114, category: 'eco',
    description: 'Icône du style italien — citadine ronde et charmante, symbole de la dolce vita. Parfaite pour les ruelles de Casablanca ou Rabat.',
    carquery_id: 'ma_fiat_500_2025',
    photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-500-261.png'
  },
  {
    make: 'Fiat', model: '500 C', year: 2025,
    price_eur: 20560, power_hp: 70, consumption_l100k: 5.0,
    co2_g_km: 114, category: 'eco',
    description: 'La 500 en version cabriolet — toit ouvrant panoramique pour profiter du soleil marocain. Style et liberté réunis.',
    carquery_id: 'ma_fiat_500c_2025',
    photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-500c-194.png'
  },
  {
    make: 'Fiat', model: '500 X', year: 2025,
    price_eur: 21296, power_hp: 130, consumption_l100k: 6.0,
    co2_g_km: 138, category: 'eco',
    description: 'Crossover compact au style 500 — l\'élégance italienne et la praticité d\'un SUV urbain. Le meilleur des deux mondes.',
    carquery_id: 'ma_fiat_500x_2025',
    photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-500x-920.png'
  },
  {
    make: 'Fiat', model: '600', year: 2025,
    price_eur: 26657, power_hp: 100, consumption_l100k: 5.8,
    co2_g_km: 132, category: 'eco',
    description: 'Nouveau SUV compact Fiat — design moderne et accessible. L\'entrée dans l\'ère SUV à l\'italienne pour le marché marocain.',
    carquery_id: 'ma_fiat_600_2025',
    photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-600-864.png'
  },
  {
    make: 'Fiat', model: '600 E', year: 2025,
    price_eur: 45268, power_hp: 154, consumption_l100k: 15.5,
    co2_g_km: 0, category: 'eco',
    description: 'SUV compact 100% électrique — 154ch, 400km d\'autonomie, zéro émission. Le futur de la mobilité urbaine à l\'italienne.',
    carquery_id: 'ma_fiat_600e_2025',
    photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-600e-794.png'
  },
  {
    make: 'Fiat', model: 'Tipo', year: 2025,
    price_eur: 18704, power_hp: 100, consumption_l100k: 5.5,
    co2_g_km: 126, category: 'eco',
    description: 'Berline compacte pratique et spacieuse — rapport qualité/prix imbattable. La familiale italienne abordable pour le quotidien marocain.',
    carquery_id: 'ma_fiat_tipo_2025',
    photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-tipo-823.png'
  },
  {
    make: 'Fiat', model: 'Topolino', year: 2025,
    price_eur: 10731, power_hp: 11, consumption_l100k: 6.0,
    co2_g_km: 0, category: 'eco',
    description: 'Micro-voiture électrique — 75km d\'autonomie, ultra-compact. Idéal pour les déplacements urbains courts, zéro émission, facile à garer.',
    carquery_id: 'ma_fiat_topolino_2025',
    photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-topolino-565.png'
  },

  // ── HONDA MAROC 2025 ───────────────────────────────────────────────────
  {
    make: 'Honda', model: 'Accord', year: 2025,
    price_eur: 53704, power_hp: 204, consumption_l100k: 6.0,
    co2_g_km: 138, category: 'practical',
    description: 'Berline premium hybride — élégance japonaise, finitions soignées, confort longue distance. La référence Honda pour les cadres marocains.',
    carquery_id: 'ma_honda_accord_2025',
    photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-accord-849.png'
  },
  {
    make: 'Honda', model: 'CR-V', year: 2025,
    price_eur: 51574, power_hp: 184, consumption_l100k: 6.8,
    co2_g_km: 155, category: 'practical',
    description: 'SUV familial hybride iconique — espace généreux, fiabilité Honda légendaire, confort 5 places. Le SUV japonais de référence au Maroc.',
    carquery_id: 'ma_honda_crv_2025',
    photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-cr-v-788.jpg'
  },
  {
    make: 'Honda', model: 'HR-V', year: 2025,
    price_eur: 35185, power_hp: 131, consumption_l100k: 5.5,
    co2_g_km: 126, category: 'eco',
    description: 'SUV compact hybride urbain — design coupé élégant, technologie e:HEV, économique en ville. Le SUV japonais accessible.',
    carquery_id: 'ma_honda_hrv_2025',
    photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-hr-v-577.png'
  },
  {
    make: 'Honda', model: 'Jazz', year: 2025,
    price_eur: 23889, power_hp: 109, consumption_l100k: 4.5,
    co2_g_km: 103, category: 'eco',
    description: 'Citadine hybride ultra-polyvalente — Magic Seats révolutionnaires, espace intérieur surprenant, très économique. La japonaise intelligente.',
    carquery_id: 'ma_honda_jazz_2025',
    photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-jazz-246.png'
  },

  // ── PORSCHE MAROC 2025 ─────────────────────────────────────────────────
  {
    make: 'Porsche', model: '718 Boxster', year: 2025,
    price_eur: 89815, power_hp: 300, consumption_l100k: 8.5,
    co2_g_km: 194, category: 'performance',
    description: 'Roadster sport iconique — moteur central 4 cylindres turbo, sensations pures, toit ouvert. La quintessence du plaisir de conduite sportif.',
    carquery_id: 'ma_porsche_718boxster_2025',
    photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-718%20boxster-523.png'
  },
  {
    make: 'Porsche', model: '718 Cayman', year: 2025,
    price_eur: 87037, power_hp: 300, consumption_l100k: 8.5,
    co2_g_km: 194, category: 'performance',
    description: 'Coupé sport mid-engine — agilité chirurgicale, moteur 4 cylindres turbo central, le coupé sportif le plus équilibré du monde.',
    carquery_id: 'ma_porsche_718cayman_2025',
    photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-718%20cayman-607.png'
  },
  {
    make: 'Porsche', model: '911', year: 2025,
    price_eur: 175000, power_hp: 450, consumption_l100k: 9.0,
    co2_g_km: 206, category: 'performance',
    description: 'La légende allemande absolue — flat-six arrière, 450ch, 0-100 en 3.5s. Le 911 est la voiture de sport ultime, inégalée depuis 60 ans.',
    carquery_id: 'ma_porsche_911_2025',
    photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-911-178.png'
  },
  {
    make: 'Porsche', model: 'Boxster', year: 2025,
    price_eur: 62963, power_hp: 300, consumption_l100k: 8.0,
    co2_g_km: 183, category: 'performance',
    description: 'Roadster nouvelle génération Porsche — toit souple électrique, motorisation moderne, plaisir de conduite à l\'air libre inégalé.',
    carquery_id: 'ma_porsche_boxster_2025',
    photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-boxster-268.png'
  },
  {
    make: 'Porsche', model: 'Cayenne', year: 2025,
    price_eur: 125000, power_hp: 340, consumption_l100k: 9.5,
    co2_g_km: 217, category: 'luxury',
    description: 'SUV premium ultra-performant — le SUV qui conduit comme une sportive. Puissance, luxe et polyvalence pour les routes marocaines exigeantes.',
    carquery_id: 'ma_porsche_cayenne_2025',
    photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-cayenne-282.png'
  },
  {
    make: 'Porsche', model: 'Cayman', year: 2025,
    price_eur: 60185, power_hp: 300, consumption_l100k: 8.0,
    co2_g_km: 183, category: 'performance',
    description: 'Coupé sport nouvelle génération — équilibre parfait, réponses précises, pur plaisir de conduite. Le coupé Porsche d\'entrée de gamme, sans compromis.',
    carquery_id: 'ma_porsche_cayman_2025',
    photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-cayman-623.png'
  },
  {
    make: 'Porsche', model: 'Macan', year: 2025,
    price_eur: 70370, power_hp: 408, consumption_l100k: 19.5,
    co2_g_km: 0, category: 'luxury',
    description: 'SUV compact électrique Porsche — 408ch, 0-100 en 5.2s, 613km d\'autonomie. Le premier SUV électrique Porsche, sportif et luxueux.',
    carquery_id: 'ma_porsche_macan_2025',
    photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-macan-175.png'
  },
  {
    make: 'Porsche', model: 'Panamera', year: 2025,
    price_eur: 166667, power_hp: 480, consumption_l100k: 8.8,
    co2_g_km: 200, category: 'luxury',
    description: 'Gran Turismo 4 portes Porsche — berline de sport ultime, 480ch, luxe raffiné, performances de supercar. La berlinesportive absolue.',
    carquery_id: 'ma_porsche_panamera_2025',
    photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-panamera-626.png'
  },
  {
    make: 'Porsche', model: 'Taycan', year: 2025,
    price_eur: 125000, power_hp: 408, consumption_l100k: 22.0,
    co2_g_km: 0, category: 'performance',
    description: 'Sportive électrique révolutionnaire — 408ch, 0-100 en 5.4s, 484km. La Porsche qui prouve que l\'électrique peut être excitant.',
    carquery_id: 'ma_porsche_taycan_2025',
    photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-taycan-187.png'
  },

  // ── MERCEDES-BENZ MAROC 2025 ───────────────────────────────────────────
  {
    make: 'Mercedes-Benz', model: 'Classe A', year: 2025,
    price_eur: 40185, power_hp: 163, consumption_l100k: 6.5,
    co2_g_km: 149, category: 'eco',
    description: 'Compacte premium d\'entrée Mercedes — technologie MBUX, style dynamique, intérieur sophistiqué. L\'accès au monde Mercedes à prix accessible.',
    carquery_id: 'ma_mb_classea_2025',
    photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-classe%20a-753.png'
  },
  {
    make: 'Mercedes-Benz', model: 'Classe C', year: 2025,
    price_eur: 55000, power_hp: 204, consumption_l100k: 6.8,
    co2_g_km: 155, category: 'luxury',
    description: 'Berline premium sportive — design W206 raffiné, technologie de pointe, confort premium. La Mercedes la plus vendue au Maroc.',
    carquery_id: 'ma_mb_classec_2025',
    photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-classe%20c-421.png'
  },
  {
    make: 'Mercedes-Benz', model: 'Classe CLA', year: 2025,
    price_eur: 48981, power_hp: 163, consumption_l100k: 6.7,
    co2_g_km: 153, category: 'luxury',
    description: 'Berline coupé 4 portes premium — ligne fastback élégante, profil sport, prestige Mercedes à prix compact. Le style sans concession.',
    carquery_id: 'ma_mb_classcla_2025',
    photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-classe%20cla-587.png'
  },
  {
    make: 'Mercedes-Benz', model: 'Classe E', year: 2025,
    price_eur: 61944, power_hp: 258, consumption_l100k: 7.5,
    co2_g_km: 172, category: 'luxury',
    description: 'Berline executive Mercedes — intérieur ultra-technologique, confort longue distance exceptionnel. La référence des berlines premium au Maroc.',
    carquery_id: 'ma_mb_classe_e_2025',
    photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-classe%20e-790.png'
  },
  {
    make: 'Mercedes-Benz', model: 'Classe G', year: 2025,
    price_eur: 161111, power_hp: 340, consumption_l100k: 12.0,
    co2_g_km: 274, category: 'luxury',
    description: 'Icône 4x4 légendaire — carrosserie carrée intemporelle depuis 1979, capacités off-road extrêmes, luxe absolu. Le SUV le plus désirable du monde.',
    carquery_id: 'ma_mb_classe_g_2025',
    photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-classe%20g-137.png'
  },
  {
    make: 'Mercedes-Benz', model: 'Classe GLC', year: 2025,
    price_eur: 56944, power_hp: 204, consumption_l100k: 7.0,
    co2_g_km: 160, category: 'luxury',
    description: 'SUV compact premium best-seller — espace, technologie MBUX, qualité Mercedes. Le SUV familial haut de gamme le plus populaire au Maroc.',
    carquery_id: 'ma_mb_glc_2025',
    photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-classe%20glc-429.png'
  },
  {
    make: 'Mercedes-Benz', model: 'Classe GLE', year: 2025,
    price_eur: 87870, power_hp: 367, consumption_l100k: 8.0,
    co2_g_km: 183, category: 'luxury',
    description: 'Grand SUV premium — 7 places en option, suspension pneumatique, performances hybrides. L\'alternative luxueuse au ML pour les grandes familles.',
    carquery_id: 'ma_mb_gle_2025',
    photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-classe%20gle-993.png'
  },
  {
    make: 'Mercedes-Benz', model: 'Classe GLS', year: 2025,
    price_eur: 134259, power_hp: 367, consumption_l100k: 8.5,
    co2_g_km: 195, category: 'luxury',
    description: 'Le SUV de luxe 7 places ultime — limousine des SUV, trois rangées de sièges en cuir, technologie de pointe. Le summum des SUV premium.',
    carquery_id: 'ma_mb_gls_2025',
    photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-classe%20gls-476.png'
  },
  {
    make: 'Mercedes-Benz', model: 'Classe S', year: 2025,
    price_eur: 150926, power_hp: 435, consumption_l100k: 9.0,
    co2_g_km: 206, category: 'luxury',
    description: 'La limousine de prestige absolue — V8 biturbo, sièges massants, conduite semi-autonome. La Classe S définit le luxe automobile mondial depuis des décennies.',
    carquery_id: 'ma_mb_class_s_2025',
    photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-classe%20s-459.png'
  },
  {
    make: 'Mercedes-Benz', model: 'CLE', year: 2025,
    price_eur: 75463, power_hp: 204, consumption_l100k: 7.0,
    co2_g_km: 161, category: 'luxury',
    description: 'Coupé 2 portes Mercedes nouvelle génération — remplace CLC et C Coupé, design spectaculaire, équipements premium. L\'élégance allemande dans toute sa splendeur.',
    carquery_id: 'ma_mb_cle_2025',
    photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-cle-786.png'
  },
  {
    make: 'Mercedes-Benz', model: 'EQA', year: 2025,
    price_eur: 60093, power_hp: 190, consumption_l100k: 15.7,
    co2_g_km: 0, category: 'eco',
    description: 'SUV compact électrique Mercedes — 426km d\'autonomie, 190ch, charge rapide. L\'entrée dans l\'univers EQ électrique, pratique et connecté.',
    carquery_id: 'ma_mb_eqa_2025',
    photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-eqa-669.png'
  },
  {
    make: 'Mercedes-Benz', model: 'EQB', year: 2025,
    price_eur: 62870, power_hp: 190, consumption_l100k: 17.0,
    co2_g_km: 0, category: 'eco',
    description: 'SUV électrique 7 places Mercedes — l\'EQB propose une 3e rangée pour les familles. 419km d\'autonomie, zéro émission, pratique et spacieux.',
    carquery_id: 'ma_mb_eqb_2025',
    photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-eqb-442.jpeg'
  },
  {
    make: 'Mercedes-Benz', model: 'EQE', year: 2025,
    price_eur: 84815, power_hp: 292, consumption_l100k: 18.0,
    co2_g_km: 0, category: 'luxury',
    description: 'Berline électrique premium — l\'EQE allie luxe Classe E et motorisation électrique, 654km d\'autonomie. La berline électrique pour les professionnels exigeants.',
    carquery_id: 'ma_mb_eqe_2025',
    photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-eqe-935.png'
  },
  {
    make: 'Mercedes-Benz', model: 'EQS', year: 2025,
    price_eur: 156481, power_hp: 333, consumption_l100k: 19.5,
    co2_g_km: 0, category: 'luxury',
    description: 'Limousine électrique ultime — le summum de la technologie Mercedes. Hyperscreen 1.41m, 780km d\'autonomie, silence absolu. L\'avenir du luxe automobile.',
    carquery_id: 'ma_mb_eqs_2025',
    photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-eqs-692.png'
  },

  // ── MASERATI MAROC 2025 ────────────────────────────────────────────────
  {
    make: 'Maserati', model: 'Ghibli', year: 2025,
    price_eur: 71204, power_hp: 330, consumption_l100k: 8.0,
    co2_g_km: 183, category: 'luxury',
    description: 'Berline sport italienne d\'exception — V6 330ch, sonorité Maserati incomparable, caractère trident unique. La berline qui allie prestige et sensations.',
    carquery_id: 'ma_maserati_ghibli_2025',
    photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-ghibli-397.png'
  },
  {
    make: 'Maserati', model: 'Granturismo', year: 2025,
    price_eur: 120370, power_hp: 490, consumption_l100k: 10.5,
    co2_g_km: 240, category: 'performance',
    description: 'Grand Tourisme iconique Maserati — V6 biturbo 490ch, lignes sculpturales intemporelles. Le coupé 2+2 le plus beau du monde, renaissance de la légende.',
    carquery_id: 'ma_maserati_granturismo_2025',
    photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-granturismo-474.png'
  },
  {
    make: 'Maserati', model: 'Grecale', year: 2025,
    price_eur: 78704, power_hp: 300, consumption_l100k: 8.0,
    co2_g_km: 183, category: 'luxury',
    description: 'SUV compact Maserati — l\'entrée dans l\'univers Trident en format SUV. Elégance italienne, performances généreuses, technologie de pointe.',
    carquery_id: 'ma_maserati_grecale_2025',
    photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-grecale-223.png'
  },
  {
    make: 'Maserati', model: 'Levante', year: 2025,
    price_eur: 87500, power_hp: 430, consumption_l100k: 8.5,
    co2_g_km: 195, category: 'luxury',
    description: 'Grand SUV Maserati — le premier SUV de la marque au Trident, V8 430ch, luxe flamboyant. L\'alliance parfaite entre SUV et supercar italienne.',
    carquery_id: 'ma_maserati_levante_2025',
    photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-levante%20-299.png'
  },
  {
    make: 'Maserati', model: 'MC 20', year: 2025,
    price_eur: 361111, power_hp: 630, consumption_l100k: 9.0,
    co2_g_km: 205, category: 'performance',
    description: 'Supercar V6 biturbo mid-engine — 630ch, 0-100 en 2.9s, 325 km/h. La renaissance sportive Maserati, une hypercar italienne pure pour les passionnés.',
    carquery_id: 'ma_maserati_mc20_2025',
    photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-mc20-508.png'
  },

  // ── TOYOTA MAROC 2025 ──────────────────────────────────────────────────
  {
    make: 'Toyota', model: 'bZ4X', year: 2025,
    price_eur: 63889, power_hp: 218, consumption_l100k: 18.5,
    co2_g_km: 0, category: 'eco',
    description: 'SUV 100% électrique Toyota — 218ch, 516km d\'autonomie, charge rapide. La transition vers l\'électrique selon Toyota : fiabilité légendaire, zéro émission.',
    carquery_id: 'ma_toyota_bz4x_2025',
    photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-bz4x-182.png'
  },
  {
    make: 'Toyota', model: 'RAV-4', year: 2025,
    price_eur: 36009, power_hp: 222, consumption_l100k: 5.8,
    co2_g_km: 132, category: 'practical',
    description: 'SUV hybride iconique — le plus vendu mondialement. Fiabilité Toyota absolue, technologie hybride mature, espace familial. Le SUV de référence au Maroc.',
    carquery_id: 'ma_toyota_rav4_2025',
    photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-rav-4-408.png'
  },
  {
    make: 'Toyota', model: 'C-HR', year: 2025,
    price_eur: 31843, power_hp: 197, consumption_l100k: 5.5,
    co2_g_km: 125, category: 'eco',
    description: 'Crossover hybride au design avant-gardiste — silhouette coupé, technologie hybride Toyota, faible consommation. Le crossover qui ose se démarquer.',
    carquery_id: 'ma_toyota_chr_2025',
    photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-c-hr-397.png'
  },
  {
    make: 'Toyota', model: 'Corolla', year: 2025,
    price_eur: 29630, power_hp: 140, consumption_l100k: 4.7,
    co2_g_km: 107, category: 'eco',
    description: 'Berline hybride la plus vendue de l\'histoire — fiabilité légendaire, faible consommation, confort quotidien. La Toyota Corolla, intemporelle au Maroc.',
    carquery_id: 'ma_toyota_corolla_2025',
    photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-corolla-994.png'
  },
  {
    make: 'Toyota', model: 'Corolla X SUV', year: 2025,
    price_eur: 33194, power_hp: 197, consumption_l100k: 6.0,
    co2_g_km: 137, category: 'practical',
    description: 'SUV compact hybride Corolla — l\'ADN Corolla dans un gabarit SUV. Transmission AWD-i, technologie hybride, polyvalence urbaine et piste.',
    carquery_id: 'ma_toyota_corolla_xsuv_2025',
    photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-Corolla%20X%20SUV-103.png'
  },
  {
    make: 'Toyota', model: 'Fortuner', year: 2025,
    price_eur: 48148, power_hp: 204, consumption_l100k: 8.0,
    co2_g_km: 183, category: 'practical',
    description: 'SUV 7 places tout-terrain robuste — châssis sur longerons, capacité off-road sérieuse, espace familial. Le Toyota de l\'aventure au Maroc.',
    carquery_id: 'ma_toyota_fortuner_2025',
    photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-fortuner-472.png'
  },
  {
    make: 'Toyota', model: 'Hilux', year: 2025,
    price_eur: 30093, power_hp: 150, consumption_l100k: 7.5,
    co2_g_km: 172, category: 'practical',
    description: 'Pick-up légendaire Toyota — robustesse indestructible, double cabine, capacité de charge élevée. Le compagnon de travail et d\'aventure incontournable au Maroc.',
    carquery_id: 'ma_toyota_hilux_2025',
    photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-hilux-551.png'
  },
  {
    make: 'Toyota', model: 'Land Cruiser', year: 2025,
    price_eur: 73148, power_hp: 309, consumption_l100k: 9.5,
    co2_g_km: 217, category: 'luxury',
    description: 'Grand SUV 4x4 légendaire — 7 places, capacités hors route incomparables, fiabilité extrême. Le Land Cruiser, le roi des pistes marocaines depuis 70 ans.',
    carquery_id: 'ma_toyota_landcruiser_2025',
    photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-land%20cruiser-324.png'
  },
  {
    make: 'Toyota', model: 'Yaris', year: 2025,
    price_eur: 23796, power_hp: 116, consumption_l100k: 3.8,
    co2_g_km: 87, category: 'eco',
    description: 'Citadine hybride ultra-économique — 3.8L/100km, faibles émissions, technologie hybride accessible. La Toyota abordable pour la ville marocaine au quotidien.',
    carquery_id: 'ma_toyota_yaris_2025',
    photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-yaris-762.png'
  },

  // ── ÉLECTRIQUE / ECO+ ──────────────────────────────────────────────────
  {
    make: 'BYD', model: 'Seagull', year: 2024,
    price_eur: 16667, power_hp: 75, consumption_l100k: 9.9,
    co2_g_km: 0, category: 'eco',
    description: 'Citadine électrique chinoise accessible — 305km d\'autonomie, prix imbattable.',
    carquery_id: 'ma_byd_seagull_2024'
  },
  {
    make: 'BYD', model: 'Yuan Plus', year: 2024,
    price_eur: 29630, power_hp: 204, consumption_l100k: 11.2,
    co2_g_km: 0, category: 'eco',
    description: 'SUV électrique compact BYD — 401km, technologie Blade Battery.',
    carquery_id: 'ma_byd_yuan_plus_2024'
  },
  {
    make: 'Tesla', model: 'Model 3', year: 2024,
    price_eur: 60185, power_hp: 283, consumption_l100k: 10.8,
    co2_g_km: 0, category: 'eco',
    description: 'La référence mondiale électrique — 558km, Autopilot, performance épurée.',
    carquery_id: 'ma_tesla_model3_2024'
  },
  {
    make: 'Tesla', model: 'Model Y', year: 2023,
    price_eur: 82407, power_hp: 300, consumption_l100k: 11.5,
    co2_g_km: 0, category: 'eco',
    description: 'SUV électrique le plus vendu au monde — espace, technologie, autonomie.',
    carquery_id: 'ma_tesla_modely_2023'
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
        `INSERT INTO cars (make, model, year, price_eur, power_hp, consumption_l100k, co2_g_km, category, description, carquery_id, photo_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [car.make, car.model, car.year, car.price_eur, car.power_hp,
         car.consumption_l100k, car.co2_g_km, car.category, car.description, car.carquery_id, car.photo_url || null]
      );
      added++;
    } catch (err) {
      console.warn(`⚠️  Skip ${car.make} ${car.model}: ${err.message}`);
    }
  }

  // Correction des prix selon tarifs officiels Maroc 2025 (MAD/10.8)
  const priceUpdates = [
    { carquery_id: 'ma_dacia_sandero_2023',  price_eur: 12222 },  // 132 000 MAD
    { carquery_id: 'ma_dacia_logan_2023',    price_eur: 12870 },  // 139 000 MAD
    { carquery_id: 'ma_dacia_duster_2023',   price_eur: 21481 },  // 232 000 MAD
    { carquery_id: 'ma_hyundai_i10_2023',    price_eur: 15083 },  // 162 900 MAD
    { carquery_id: 'ma_hyundai_i20_2023',    price_eur: 18046 },  // 194 900 MAD
    { carquery_id: 'ma_hyundai_creta_2024',  price_eur: 24528 },  // 264 900 MAD
    { carquery_id: 'ma_hyundai_tucson_2023',        price_eur: 33324  },  // 359 900 MAD
    { carquery_id: 'ma_landrover_rrover_sport_2023', price_eur: 107083 },  // 1 156 500 MAD
    { carquery_id: 'ma_landrover_rr_2023',           price_eur: 152870 },  // 1 650 900 MAD (Range Rover)
    { carquery_id: 'ma_byd_seagull_2024',  price_eur: 18509  },  // 199 900 MAD
    { carquery_id: 'ma_bmw_serie3_2023',  price_eur: 54537  },  // 589 000 MAD
    { carquery_id: 'ma_bmw_serie5_2023',  price_eur: 54167  },  // 585 000 MAD
    { carquery_id: 'ma_bmw_x5_2023',      price_eur: 77963  },  // 842 000 MAD
    { carquery_id: 'ma_audi_a3_2023',     price_eur: 35833  },  // 387 000 MAD
    { carquery_id: 'ma_audi_a4_2024',               price_eur: 81019  },  // keep existing
  ];
  for (const { carquery_id, price_eur } of priceUpdates) {
    await run('UPDATE cars SET price_eur = ? WHERE carquery_id = ?', [price_eur, carquery_id]);
  }

  // Inject photo_url for cars already inserted without photo
  const photoUpdates = [
    { carquery_id: 'ma_bmw_serie3_2023', photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-serie%203-385.png' },
    { carquery_id: 'ma_bmw_serie5_2023', photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-serie%205-632.png' },
    { carquery_id: 'ma_bmw_x5_2023',    photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-x5-414.png' },
    { carquery_id: 'ma_byd_seagull_2024', photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-seagull-876.png' },
    { carquery_id: 'ma_alfaromeo_giulia_2025',  photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-giulia-484.png' },
    { carquery_id: 'ma_alfaromeo_junior_2025',  photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-junior-515.png' },
    { carquery_id: 'ma_alfaromeo_stelvio_2025', photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-stelvio-276.png' },
    { carquery_id: 'ma_alfaromeo_tonale_2025',  photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-tonale-190.png' },
    { carquery_id: 'ma_audi_a3_2023',           photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-a3-602.png' },
    { carquery_id: 'ma_audi_a4_2024',    photo_url: 'https://www.moteur.ma/storage/media/images/models/nouvelle-a5-870.jpg' },
  ];
  for (const { carquery_id, photo_url } of photoUpdates) {
    await run('UPDATE cars SET photo_url = ? WHERE carquery_id = ? AND (photo_url IS NULL OR photo_url = "")', [photo_url, carquery_id]);
  }

  if (added > 0) console.log(`🇲🇦  Maroc: +${added} voitures ajoutées`);
  else console.log(`🇲🇦  Maroc: ${skipped} voitures déjà en base`);
  return added;
}

module.exports = { seedMoroccanCars };
