'use strict';

// ─── QUESTION BANK ────────────────────────────────────────────────────────────
// Tone: social scenarios + game-like comparisons. Personality-driven, not spec-driven.
// Each answer carries a likelihood function (car) => 0..1 for Bayesian inference.

const QUESTIONS = [
  // ── Q1: LE GENDRE — social status, first impression ─────────────────────
  {
    id: 'image',
    question: 'Tu vas chez les parents de ta fiancée pour la première fois. Quelle voiture tu gares devant leur porte ?',
    answers: [
      {
        text: '"Une Dacia propre et bien entretenue — c\'est la personnalité qui compte"',
        sub: 'Humble, solide, aucun fla-fla',
        likelihood: car => {
          const p = car.price_eur || 30000;
          if (p < 20000 && ['eco', 'practical'].includes(car.category)) return 1.00;
          if (p > 80000) return 0.04;
          if (p < 30000) return 0.60;
          return 0.30;
        }
      },
      {
        text: '"Un SUV récent — moderne, familial, rassurant"',
        sub: 'Kia, Duster, Tucson — le bon gendre par excellence',
        likelihood: car => {
          const cat = car.category;
          const p = car.price_eur || 30000;
          if (cat === 'practical' && p >= 18000 && p < 65000) return 1.00;
          if (cat === 'eco' && p < 20000) return 0.30;
          if (cat === 'luxury' && p < 80000) return 0.45;
          return 0.25;
        }
      },
      {
        text: '"Une berline allemande — discrète mais qui parle d\'elle-même"',
        sub: 'BMW, Mercedes, Audi — le prestige qu\'on mérite',
        likelihood: car => {
          const cat = car.category;
          if (cat === 'luxury') return 1.00;
          if (cat === 'performance' && car.price_eur > 60000) return 0.65;
          if (cat === 'practical' && car.price_eur >= 40000) return 0.35;
          return 0.10;
        }
      },
      {
        text: '"Je débarque en sport — ils savent direct qui je suis"',
        sub: 'Le son du moteur arrive avant moi',
        likelihood: car => {
          const cat = car.category;
          if (cat === 'performance') return 1.00;
          if (car.price_eur > 120000) return 0.85;
          if (cat === 'luxury') return 0.42;
          return 0.08;
        }
      }
    ]
  },

  // ── Q2: PAPA VS TOI — budget framed as social comparison ─────────────────
  {
    id: 'budget',
    question: 'Ton père vient de changer de voiture. Ta future bagnole par rapport à la sienne...',
    answers: [
      {
        text: '"La mienne coûte moins — je débute encore, c\'est normal"',
        sub: 'Moins de 25 000 € — sage et stratégique',
        likelihood: car => {
          const p = car.price_eur || 30000;
          if (p < 22000) return 1.00;
          if (p < 30000) return 0.55;
          if (p < 50000) return 0.07;
          return 0.01;
        }
      },
      {
        text: '"On est au même niveau — on respecte le père"',
        sub: '25 000 — 55 000 € — l\'équilibre plaisir/raison',
        likelihood: car => {
          const p = car.price_eur || 30000;
          if (p >= 22000 && p < 55000) return 1.00;
          if (p >= 15000 && p < 22000) return 0.30;
          if (p >= 55000 && p < 75000) return 0.25;
          return 0.02;
        }
      },
      {
        text: '"Un cran au-dessus — discrètement, sans le froisser"',
        sub: '55 000 — 100 000 € — je m\'assume',
        likelihood: car => {
          const p = car.price_eur || 30000;
          if (p >= 55000 && p < 100000) return 1.00;
          if (p >= 40000 && p < 55000) return 0.20;
          if (p >= 100000 && p < 140000) return 0.20;
          return 0.01;
        }
      },
      {
        text: '"J\'ai largement dépassé papa — avec le sourire"',
        sub: 'Plus de 100 000 € — le prix n\'est plus un critère',
        likelihood: car => {
          const p = car.price_eur || 30000;
          if (p >= 100000) return 1.00;
          if (p >= 70000) return 0.12;
          return 0.005;
        }
      }
    ]
  },

  // ── Q3: SOIRÉE CASABLANCA — usage as social identity ─────────────────────
  {
    id: 'usage',
    question: 'Vendredi soir, la bande sort à Casablanca. Ton rôle ce soir-là ?',
    answers: [
      {
        text: '"Je suis le taxi officiel — tout le monde monte chez moi"',
        sub: 'Pratique, fiable, toujours là pour les amis',
        likelihood: car => {
          const cat = car.category;
          const p = car.price_eur || 30000;
          if (cat === 'practical' && p < 45000) return 1.00;
          if (cat === 'eco' && p < 25000) return 0.85;
          if (cat === 'performance') return 0.06;
          if (p > 80000) return 0.12;
          return 0.50;
        }
      },
      {
        text: '"On part tous ensemble — autoroute, musique, liberté"',
        sub: 'Confort de route, longs trajets, ambiance',
        likelihood: car => {
          const cat = car.category;
          if (cat === 'luxury') return 1.00;
          if (cat === 'practical' && car.price_eur >= 30000) return 0.80;
          if (car.co2_g_km === 0 && car.price_eur > 40000) return 0.70;
          return 0.35;
        }
      },
      {
        text: '"Je les rejoins plus tard — j\'aime conduire seul la nuit"',
        sub: 'La route sinueuse, les sensations, l\'adrénaline',
        likelihood: car => {
          const cat = car.category;
          if (cat === 'performance') return 1.00;
          if ((car.power_hp || 0) >= 250) return 0.70;
          if (cat === 'luxury') return 0.38;
          return 0.12;
        }
      },
      {
        text: '"Je connais les spots — je montre le chemin, ils me suivent"',
        sub: 'SUV, polyvalent, leader du groupe',
        likelihood: car => {
          const cat = car.category;
          if (cat === 'practical') return 0.95;
          if (cat === 'eco') return 0.65;
          if (cat === 'luxury') return 0.55;
          return 0.25;
        }
      }
    ]
  },

  // ── Q4: MARIAGE DU COUSIN — family event, social theatre ─────────────────
  {
    id: 'motorisation',
    question: 'Mariage du cousin, toute la famille est là. Tu arrives comment ?',
    answers: [
      {
        text: '"En silence électrique — moderne, discret, surprenant"',
        sub: 'Zéro bruit, zéro émission — l\'élégance 2.0',
        likelihood: car => {
          const co2 = car.co2_g_km ?? 150;
          if (co2 === 0) return 1.00;
          if (co2 < 100) return 0.22;
          return 0.03;
        }
      },
      {
        text: '"Propre, bien garé, vitres teintées — classe sobre"',
        sub: 'Moteur hybride, tout en finesse',
        likelihood: car => {
          const co2 = car.co2_g_km ?? 150;
          if (co2 === 0) return 0.38;
          if (co2 < 120) return 1.00;
          if (co2 < 160) return 0.40;
          return 0.07;
        }
      },
      {
        text: '"Je descends lentement — les gens remarquent, je fais semblant de rien"',
        sub: 'Moteur essence bien taillé, sonorité affirmée',
        likelihood: car => {
          const co2 = car.co2_g_km ?? 150;
          if (co2 === 0) return 0.05;
          if (co2 >= 130 && co2 < 220) return 1.00;
          if (co2 < 130) return 0.40;
          return 0.50;
        }
      },
      {
        text: '"J\'arrive le dernier exprès — le son du moteur annonce mon entrée"',
        sub: 'V8, puissance brute, tout le monde se retourne',
        likelihood: car => {
          const co2 = car.co2_g_km ?? 150;
          const hp = car.power_hp || 100;
          if (co2 >= 230) return 1.00;
          if (co2 >= 170 && hp >= 300) return 0.60;
          if (co2 === 0) return 0.02;
          return 0.08;
        }
      }
    ]
  },

  // ── Q5: LE GROUPE WHATSAPP FAMILLE — passengers as social obligation ──────
  {
    id: 'passengers',
    question: 'Ton oncle poste dans le groupe WhatsApp famille : "Qui a une voiture ce weekend ?" Tu réponds...',
    answers: [
      {
        text: '"Moi ! J\'ai la place pour tout le monde"',
        sub: 'Le pilier de la famille — spacieux, fiable, toujours là',
        likelihood: car => {
          const cat = car.category;
          if (cat === 'practical') return 1.00;
          if (cat === 'luxury' && car.price_eur >= 50000) return 0.55;
          if (cat === 'performance') return 0.05;
          return 0.45;
        }
      },
      {
        text: '"Oui mais que 4 personnes — j\'ai une petite"',
        sub: 'Mon espace avant tout — compact mais présent',
        likelihood: car => {
          const cat = car.category;
          if (cat === 'performance') return 1.00;
          if (cat === 'eco' && car.price_eur < 45000) return 0.80;
          if (cat === 'luxury') return 0.65;
          return 0.40;
        }
      },
      {
        text: '"Avec ma femme seulement — les autres arrangez-vous"',
        sub: 'À deux, c\'est parfait — confort et style',
        likelihood: car => {
          const cat = car.category;
          if (cat === 'luxury') return 1.00;
          if (cat === 'performance') return 0.75;
          if (cat === 'eco') return 0.55;
          return 0.55;
        }
      },
      {
        text: '"Je lis mais je réponds pas — on sait tous que je viens seul"',
        sub: 'La voiture comme espace personnel sacré',
        likelihood: car => {
          const cat = car.category;
          if (cat === 'practical') return 0.90;
          if (cat === 'eco') return 0.75;
          if (cat === 'luxury') return 0.58;
          return 0.35;
        }
      }
    ]
  },
  {
    id: 'comfort_sport',
    question: 'Pile ou face — en toute honnêteté :',
    answers: [
      {
        text: 'Je veux flotter — suspension douce, silence',
        sub: 'Confort maximal, habitacle cocooning',
        likelihood: car => {
          const cat = car.category;
          if (cat === 'luxury') return 1.00;
          if (cat === 'practical' && car.price_eur >= 28000) return 0.70;
          if (cat === 'performance') return 0.18;
          return 0.45;
        }
      },
      {
        text: 'Je veux sentir la route — châssis vif, précis',
        sub: 'Sportivité affirmée, adhérence',
        likelihood: car => {
          const cat = car.category;
          if (cat === 'performance') return 1.00;
          if ((car.power_hp || 0) >= 200) return 0.65;
          if (cat === 'luxury') return 0.38;
          return 0.20;
        }
      },
      {
        text: 'Grand tourisme — confort le jour, vif si je veux',
        sub: 'Le meilleur des deux selon l\'humeur',
        likelihood: car => {
          const cat = car.category;
          if (cat === 'luxury' && (car.power_hp || 0) >= 180) return 1.00;
          if (['eco', 'practical'].includes(cat)) return 0.80;
          if (cat === 'performance' && car.price_eur > 70000) return 0.55;
          return 0.60;
        }
      }
    ]
  },
  {
    id: 'power',
    question: 'Sur l\'autoroute, votre comportement naturel c\'est...',
    answers: [
      {
        text: 'Je double tout. Je ne peux pas m\'en empêcher.',
        sub: '300 ch minimum — les sensations d\'abord',
        likelihood: car => {
          const hp = car.power_hp || 100;
          if (hp >= 400) return 1.00;
          if (hp >= 250) return 0.70;
          if (hp >= 180) return 0.20;
          return 0.04;
        }
      },
      {
        text: 'Je roule bien, j\'aime sentir que ça répond',
        sub: '130 à 250 ch — nerveux sans excès',
        likelihood: car => {
          const hp = car.power_hp || 100;
          if (hp >= 130 && hp < 280) return 1.00;
          if (hp >= 100 && hp < 130) return 0.55;
          if (hp >= 280) return 0.28;
          return 0.18;
        }
      },
      {
        text: 'Je roule tranquille — l\'essentiel c\'est d\'arriver',
        sub: 'Économique, sobre, sans stress',
        likelihood: car => {
          const hp = car.power_hp || 100;
          if (hp < 110) return 1.00;
          if (hp < 150) return 0.60;
          if (hp >= 350) return 0.03;
          return 0.25;
        }
      }
    ]
  },
  {
    id: 'brand',
    question: 'Si vous deviez choisir une culture automobile, laquelle vous ressemble ?',
    answers: [
      {
        text: 'Allemande — rigueur, ingénierie, fiabilité',
        sub: 'BMW, Mercedes, Audi, Porsche, VW',
        likelihood: car => {
          const m = (car.make || '').toLowerCase();
          return ['bmw', 'mercedes', 'audi', 'porsche', 'volkswagen'].some(g => m.includes(g)) ? 1.00 : 0.06;
        }
      },
      {
        text: 'Japonaise ou coréenne — pragmatisme légendaire',
        sub: 'Toyota, Honda, Hyundai, Kia',
        likelihood: car => {
          const m = (car.make || '').toLowerCase();
          return ['toyota', 'honda', 'hyundai', 'kia'].some(a => m.includes(a)) ? 1.00 : 0.06;
        }
      },
      {
        text: 'Italienne ou française — âme, style, caractère',
        sub: 'Ferrari, Lamborghini, Peugeot, Renault',
        likelihood: car => {
          const m = (car.make || '').toLowerCase();
          return ['ferrari', 'lamborghini', 'peugeot', 'renault'].some(l => m.includes(l)) ? 1.00 : 0.06;
        }
      },
      {
        text: 'Aucune — je veux juste la meilleure',
        sub: 'Sans biais, objectif, pragmatique',
        likelihood: () => 0.85
      }
    ]
  },
  {
    id: 'tech',
    question: 'Dans votre voiture idéale, le tableau de bord ressemble à...',
    answers: [
      {
        text: 'Une salle de contrôle — tout est connecté, intelligent',
        sub: 'IA, OTA, grand écran, avancé au maximum',
        likelihood: car => {
          const m = (car.make || '').toLowerCase();
          if (m.includes('tesla')) return 1.00;
          if (car.category === 'luxury') return 0.80;
          if (car.category === 'eco') return 0.70;
          return 0.40;
        }
      },
      {
        text: 'Moderne mais sobre — l\'utile sans le superflu',
        sub: 'Navigation, aide parking, sécurité active',
        likelihood: car => {
          if (car.category === 'practical') return 1.00;
          if (car.category === 'luxury') return 0.80;
          return 0.65;
        }
      },
      {
        text: 'Des compteurs, un volant — conduire, c\'est tout',
        sub: 'Simplicité, fiabilité, zéro distraction',
        likelihood: car => {
          const m = (car.make || '').toLowerCase();
          if (m.includes('tesla')) return 0.05;
          if (car.category === 'performance' && car.price_eur < 120000) return 0.70;
          if (car.price_eur < 30000) return 0.65;
          return 0.40;
        }
      }
    ]
  },
  {
    id: 'safety',
    question: 'Quelqu\'un monte dans votre voiture avec des enfants. Votre réflexe c\'est...',
    answers: [
      {
        text: '"5 étoiles NCAP, tout les assistants" — je l\'ai vérifié',
        sub: 'Sécurité prioritaire, maximum d\'assistances',
        likelihood: car => {
          const cat = car.category;
          if (cat === 'practical') return 1.00;
          if (cat === 'luxury') return 0.80;
          if (cat === 'eco') return 0.75;
          return 0.30;
        }
      },
      {
        text: '"C\'est une voiture moderne, ça va" — cool et confiant',
        sub: 'Standard moderne, rien d\'excessif',
        likelihood: () => 0.70
      },
      {
        text: '"Bouclez-vous bien — on y va !" — sensations d\'abord',
        sub: 'Feeling de conduite pur, moins d\'assistances',
        likelihood: car => {
          const cat = car.category;
          if (cat === 'performance') return 1.00;
          if ((car.power_hp || 0) >= 250) return 0.70;
          return 0.35;
        }
      }
    ]
  }
];

// ─── SESSION MANAGEMENT ───────────────────────────────────────────────────────

const sessions = new Map();
const SESSION_TTL = 30 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [id, data] of sessions) {
    if (now - data.session.createdAt > SESSION_TTL) sessions.delete(id);
  }
}, 5 * 60 * 1000);

// ─── BAYESIAN ENGINE ──────────────────────────────────────────────────────────

function createSession(cars) {
  const uniform = 1 / cars.length;
  const carProbs = {};
  for (const car of cars) carProbs[car.id] = uniform;
  return { carProbs, askedIds: new Set(), answers: [], createdAt: Date.now() };
}

function entropy(probMap) {
  return Object.values(probMap).reduce((h, p) => p > 1e-12 ? h - p * Math.log2(p) : h, 0);
}

function informationGain(question, carProbs, cars) {
  const currentH = entropy(carProbs);
  let expectedH = 0;

  for (const answer of question.answers) {
    let weight = 0;
    const post = {};
    for (const car of cars) {
      const lk = Math.max(answer.likelihood(car), 1e-9);
      post[car.id] = (carProbs[car.id] || 0) * lk;
      weight += post[car.id];
    }
    if (weight < 1e-12) continue;

    const postH = Object.values(post).reduce((h, v) => {
      const p = v / weight;
      return p > 1e-12 ? h - p * Math.log2(p) : h;
    }, 0);
    expectedH += weight * postH;
  }

  return currentH - expectedH;
}

function getBestQuestion(session, cars) {
  const available = QUESTIONS.filter(q => !session.askedIds.has(q.id));
  if (!available.length) return null;

  let best = null, bestGain = -Infinity;
  for (const q of available) {
    const gain = informationGain(q, session.carProbs, cars);
    if (gain > bestGain) { bestGain = gain; best = q; }
  }
  return best;
}

function applyAnswer(session, question, answerIndex, cars) {
  const answer = question.answers[answerIndex];
  if (!answer) return;

  let total = 0;
  for (const car of cars) {
    const lk = Math.max(answer.likelihood(car), 1e-9);
    session.carProbs[car.id] = (session.carProbs[car.id] || 0) * lk;
    total += session.carProbs[car.id];
  }

  if (total < 1e-12) {
    const uniform = 1 / cars.length;
    for (const car of cars) session.carProbs[car.id] = uniform;
  } else {
    for (const car of cars) session.carProbs[car.id] /= total;
  }

  session.askedIds.add(question.id);
  session.answers.push({ questionId: question.id, answerIndex });
}

function getTopCars(session, cars, n = 3) {
  return cars
    .map(car => ({ ...car, _prob: session.carProbs[car.id] || 0 }))
    .sort((a, b) => b._prob - a._prob)
    .slice(0, n);
}

function displayConfidence(session, cars) {
  const uniform = 1 / cars.length;
  const topProb = Math.max(...cars.map(c => session.carProbs[c.id] || 0));
  return Math.round(Math.min((topProb - uniform) / (1 - uniform), 1) * 100);
}

function isDone(session, cars) {
  const probs = cars.map(c => session.carProbs[c.id] || 0).sort((a, b) => b - a);
  const top = probs[0] || 0;
  const second = probs[1] || 0;
  return top > 0.40 || (second > 0 && top / second > 5) || session.askedIds.size >= 7;
}

function formatQuestion(q, number) {
  if (!q) return null;
  return {
    id: q.id,
    question: q.question,
    number,
    answers: q.answers.map((a, i) => ({ index: i, text: a.text, sub: a.sub || '' }))
  };
}

function getMatchReason(car, session) {
  const pools = {
    eco: [
      "Vos réponses révèlent un profil responsable et avant-gardiste — ce modèle est parfaitement aligné.",
      "La durabilité guide vos choix — cette automobile minimise son empreinte à chaque kilomètre."
    ],
    luxury: [
      "Vous recherchez confort et prestige — cette voiture transpire le raffinement à chaque détail.",
      "Votre profil révèle un goût pour l'excellence — un choix élégant, assumé, sans compromis."
    ],
    practical: [
      "Vous avez besoin d'un allié du quotidien — polyvalent, fiable, pensé pour votre vie réelle.",
      "Praticité et sécurité guident votre choix — ce modèle les incarne avec conviction."
    ],
    performance: [
      "Vous cherchez des sensations authentiques — ce modèle vous offrira des émotions à chaque sortie.",
      "Votre profil conducteur est affirmé — cette automobile a été conçue pour vous."
    ]
  };

  const pool = pools[car.category] || ["Un choix d'exception, parfaitement adapté à votre profil."];
  return pool[Math.floor(Math.random() * pool.length)];
}

module.exports = {
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
};
