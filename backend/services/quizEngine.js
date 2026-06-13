'use strict';

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const byPrice = (...tiers) => car => {
  const p = car.price_eur || 30000;
  for (const [max, score] of tiers) if (p <= max) return score;
  return tiers[tiers.length - 1][1];
};

const byCat = (map, def = 0.15) => car => map[car.category] ?? def;

const byBrands = (brands, hit = 1.0, miss = 0.06) => car =>
  brands.some(b => (car.make || '').toLowerCase().includes(b)) ? hit : miss;

const byHP = (...tiers) => car => {
  const hp = car.power_hp || 100;
  for (const [max, score] of tiers) if (hp <= max) return score;
  return tiers[tiers.length - 1][1];
};

const byCO2 = (...tiers) => car => {
  const co2 = car.co2_g_km ?? 150;
  for (const [max, score] of tiers) if (co2 <= max) return score;
  return tiers[tiers.length - 1][1];
};

// combined helpers
const luxuryOrPerf = (luxScore, perfScore, rest = 0.08) => car =>
  car.category === 'luxury' ? luxScore : car.category === 'performance' ? perfScore : rest;

// ─── QUESTION BANK (50 questions — batch 1/4) ────────────────────────────────

const QUESTIONS = [

  // ════════════════════════════════════════════════════════════════════════════
  // BLOC 1 — SOCIAL MAROCAIN (15 questions)
  // ════════════════════════════════════════════════════════════════════════════

  {
    id: 'social_gendre',
    question: 'Tu vas chez les parents de ta fiancée pour la première fois. Quelle voiture tu gares devant leur porte ?',
    answers: [
      {
        text: '"Une Dacia propre — la personnalité avant tout"',
        sub: 'Humble, solide, aucun fla-fla',
        likelihood: byPrice([20000, 1.0], [30000, 0.6], [60000, 0.15], [Infinity, 0.03])
      },
      {
        text: '"Un SUV récent — moderne, familial, rassurant"',
        sub: 'Kia, Duster, Tucson — le bon gendre',
        likelihood: car => {
          const p = car.price_eur || 30000;
          if (car.category === 'practical' && p >= 18000 && p < 65000) return 1.0;
          if (car.category === 'luxury' && p < 80000) return 0.45;
          return 0.2;
        }
      },
      {
        text: '"Une berline allemande — discrète mais qui parle"',
        sub: 'BMW, Mercedes, Audi — le prestige mérité',
        likelihood: byCat({ luxury: 1.0, performance: 0.55, practical: 0.12 })
      },
      {
        text: '"Je débarque en sport — ils savent direct qui je suis"',
        sub: 'Le son du moteur arrive avant moi',
        likelihood: byCat({ performance: 1.0, luxury: 0.45, practical: 0.08, eco: 0.03 })
      }
    ]
  },

  {
    id: 'social_papa',
    question: 'Ton père vient de changer de voiture. Ta future voiture par rapport à la sienne ?',
    answers: [
      {
        text: '"La mienne coûte moins — je débute encore"',
        sub: 'Moins de 25 000 € — sage et stratégique',
        likelihood: byPrice([22000, 1.0], [30000, 0.55], [50000, 0.07], [Infinity, 0.01])
      },
      {
        text: '"On est au même niveau — on respecte le père"',
        sub: '25 000 — 55 000 € — l\'équilibre plaisir/raison',
        likelihood: byPrice([15000, 0.3], [22000, 0.5], [55000, 1.0], [75000, 0.25], [Infinity, 0.02])
      },
      {
        text: '"Un cran au-dessus — discrètement, sans le froisser"',
        sub: '55 000 — 100 000 € — je m\'assume',
        likelihood: byPrice([40000, 0.05], [55000, 0.2], [100000, 1.0], [140000, 0.2], [Infinity, 0.01])
      },
      {
        text: '"J\'ai largement dépassé papa — avec le sourire"',
        sub: 'Plus de 100 000 € — le prix n\'est plus un critère',
        likelihood: byPrice([70000, 0.12], [100000, 0.4], [Infinity, 1.0])
      }
    ]
  },

  {
    id: 'social_vendredi_casa',
    question: 'Vendredi soir, la bande sort à Casablanca. Ton rôle ce soir-là ?',
    answers: [
      {
        text: '"Je suis le taxi officiel — tout le monde monte chez moi"',
        sub: 'Pratique, fiable, toujours là pour les amis',
        likelihood: byCat({ practical: 1.0, eco: 0.7, luxury: 0.3, performance: 0.06 })
      },
      {
        text: '"On part ensemble — autoroute, musique, liberté"',
        sub: 'Confort de route, longs trajets, ambiance',
        likelihood: car =>
          car.category === 'luxury' ? 1.0
          : car.category === 'practical' && car.price_eur >= 30000 ? 0.8
          : 0.35
      },
      {
        text: '"Je les rejoins plus tard — j\'aime conduire seul la nuit"',
        sub: 'Route sinueuse, sensations, adrénaline',
        likelihood: byCat({ performance: 1.0, luxury: 0.4, eco: 0.2, practical: 0.12 })
      },
      {
        text: '"Je connais les spots — ils me suivent"',
        sub: 'SUV polyvalent, leader du groupe',
        likelihood: byCat({ practical: 0.95, luxury: 0.55, eco: 0.65, performance: 0.25 })
      }
    ]
  },

  {
    id: 'social_mariage_cousin',
    question: 'Mariage du cousin, toute la famille est là. Tu arrives comment ?',
    answers: [
      {
        text: '"En silence électrique — moderne, surprenant"',
        sub: 'Zéro bruit, zéro émission — l\'élégance 2.0',
        likelihood: byCO2([0, 1.0], [90, 0.6], [130, 0.15], [Infinity, 0.03])
      },
      {
        text: '"Propre, bien garé, vitres teintées — classe sobre"',
        sub: 'Moteur discret, hybride ou bien taillé',
        likelihood: byCO2([0, 0.35], [120, 1.0], [160, 0.45], [Infinity, 0.08])
      },
      {
        text: '"Je descends lentement — les gens remarquent"',
        sub: 'Moteur essence sonore, présence affirmée',
        likelihood: byCO2([120, 0.25], [220, 1.0], [Infinity, 0.6])
      },
      {
        text: '"J\'arrive le dernier exprès — le son annonce mon entrée"',
        sub: 'V8 ou sport, tout le monde se retourne',
        likelihood: car => {
          const co2 = car.co2_g_km ?? 150;
          const hp = car.power_hp || 100;
          if (co2 >= 230) return 1.0;
          if (co2 >= 170 && hp >= 300) return 0.65;
          return 0.08;
        }
      }
    ]
  },

  {
    id: 'social_whatsapp_famille',
    question: 'Ton oncle poste dans le groupe WhatsApp famille : "Qui a une voiture ce weekend ?" Tu réponds...',
    answers: [
      {
        text: '"Moi ! J\'ai la place pour tout le monde"',
        sub: 'Le pilier de la famille — spacieux et fiable',
        likelihood: byCat({ practical: 1.0, luxury: 0.55, eco: 0.5, performance: 0.05 })
      },
      {
        text: '"Oui mais que 4 personnes — j\'ai une petite"',
        sub: 'Mon espace avant tout',
        likelihood: byCat({ performance: 1.0, eco: 0.8, luxury: 0.55, practical: 0.2 })
      },
      {
        text: '"Avec ma femme seulement — les autres arrangez-vous"',
        sub: 'À deux, c\'est parfait',
        likelihood: byCat({ luxury: 1.0, performance: 0.75, eco: 0.4, practical: 0.3 })
      },
      {
        text: '"Je lis mais je réponds pas — je viens seul de toute façon"',
        sub: 'La voiture comme espace personnel sacré',
        likelihood: byCat({ performance: 0.9, luxury: 0.7, eco: 0.5, practical: 0.25 })
      }
    ]
  },

  {
    id: 'social_voisin',
    question: 'Ton voisin vient de garer une nouvelle BMW devant l\'immeuble. Ta réaction ?',
    answers: [
      {
        text: '"Bonne voiture pour lui — moi je cherche pas ça"',
        sub: 'Indifférent au statut, pragmatique',
        likelihood: byPrice([25000, 1.0], [45000, 0.6], [Infinity, 0.1])
      },
      {
        text: '"Sympa — la mienne lui répond bien aussi"',
        sub: 'Confiant, équilibré, mi-gamme premium',
        likelihood: byPrice([20000, 0.2], [50000, 0.7], [80000, 1.0], [Infinity, 0.45])
      },
      {
        text: '"Je commence à chercher ma prochaine voiture ce soir"',
        sub: 'Motivé par la comparaison sociale',
        likelihood: byCat({ luxury: 1.0, performance: 0.7, practical: 0.35, eco: 0.1 })
      },
      {
        text: '"Je savais — je commande la même mais en mieux"',
        sub: 'Compétitif, haut de gamme uniquement',
        likelihood: byPrice([80000, 0.3], [Infinity, 1.0])
      }
    ]
  },

  {
    id: 'social_premier_rdv',
    question: 'Premier rendez-vous romantique. Tu récupères quelqu\'un pour la première fois avec ta voiture...',
    answers: [
      {
        text: 'Elle/il monte, dit "sympa ta voiture" — parfait',
        sub: 'Propre, présentable, pas d\'esbroufe',
        likelihood: byPrice([15000, 0.9], [30000, 1.0], [55000, 0.6], [Infinity, 0.2])
      },
      {
        text: 'Elle/il prend une photo depuis le siège — contente/t',
        sub: 'Esthétique, moderne, instagrammable',
        likelihood: byCat({ luxury: 1.0, performance: 0.8, practical: 0.4, eco: 0.3 })
      },
      {
        text: '"C\'est quoi comme voiture ?" — il/elle est impressionné(e)',
        sub: 'Marque premium qui fait son effet',
        likelihood: byBrands(['bmw', 'mercedes', 'audi', 'porsche', 'ferrari', 'lamborghini'])
      },
      {
        text: '"Tu peux mettre la musique ?" — et le son est parfait',
        sub: 'Système audio premium, technologie embarquée',
        likelihood: byCat({ luxury: 1.0, practical: 0.65, performance: 0.55, eco: 0.3 })
      }
    ]
  },

  {
    id: 'social_patron',
    question: 'Ton patron gare sa Mercedes Classe E devant le bureau. Toi tu arrives avec...',
    answers: [
      {
        text: 'Ma voiture propre et bien entretenue — j\'assume',
        sub: 'Pas de complexe, pragmatique',
        likelihood: byPrice([30000, 1.0], [55000, 0.5], [Infinity, 0.1])
      },
      {
        text: 'Une Golf/Série 3 — j\'ai mon standing aussi',
        sub: 'La réponse mid-premium discrète',
        likelihood: byPrice([25000, 0.1], [45000, 0.5], [65000, 1.0], [Infinity, 0.35])
      },
      {
        text: 'Quelque chose qui me dépasse — il lève un sourcil',
        sub: 'Ostentation assumée, signal de réussite',
        likelihood: byPrice([80000, 0.4], [Infinity, 1.0])
      },
      {
        text: 'Un SUV imposant — pas besoin de berline pour imprimer',
        sub: 'SUV premium, territoire différent',
        likelihood: car =>
          car.category === 'practical' && car.price_eur >= 60000 ? 1.0
          : car.category === 'luxury' ? 0.7
          : 0.15
      }
    ]
  },

  {
    id: 'social_promotion',
    question: 'Tu viens d\'avoir une promotion importante. Tu te fais plaisir comment côté voiture ?',
    answers: [
      {
        text: 'Je garde la même encore 2-3 ans — prudent',
        sub: 'La promo sert à investir, pas à dépenser',
        likelihood: byPrice([25000, 1.0], [40000, 0.5], [Infinity, 0.05])
      },
      {
        text: 'J\'upgrade — une version au-dessus de ce que j\'ai',
        sub: 'Progression naturelle, méritée',
        likelihood: byPrice([20000, 0.2], [55000, 1.0], [80000, 0.6], [Infinity, 0.2])
      },
      {
        text: 'Le modèle que je regardais depuis des mois — maintenant',
        sub: 'Le rêve qui devient réalité',
        likelihood: byCat({ luxury: 1.0, performance: 0.85, practical: 0.35, eco: 0.15 })
      },
      {
        text: 'Je commande direct ce que je veux — prix non négociable',
        sub: 'Luxe ou performance, sans compromis',
        likelihood: byPrice([90000, 0.5], [Infinity, 1.0])
      }
    ]
  },

  {
    id: 'social_ramadan',
    question: 'Ramadan — tu fais le tour des familles pendant une semaine. Ta voiture doit...',
    answers: [
      {
        text: 'Avoir de la place — on est souvent 5 ou 6',
        sub: 'Espace, confort, modularité',
        likelihood: byCat({ practical: 1.0, luxury: 0.6, eco: 0.45, performance: 0.05 })
      },
      {
        text: 'Être économique — on roule beaucoup ce mois-là',
        sub: 'Faible consommation, entretien simple',
        likelihood: byCO2([110, 1.0], [140, 0.7], [170, 0.35], [Infinity, 0.08])
      },
      {
        text: 'Être présentable — les familles te jugent dessus',
        sub: 'Image, propreté, standing apparent',
        likelihood: byPrice([30000, 0.3], [55000, 0.7], [80000, 1.0], [Infinity, 0.9])
      },
      {
        text: 'Juste marcher — le minimum syndical',
        sub: 'Fiabilité absolue, peu importe le reste',
        likelihood: byBrands(['toyota', 'honda', 'hyundai', 'kia', 'dacia'])
      }
    ]
  },

  {
    id: 'social_instagram',
    question: 'Tu postes une photo de ta voiture sur Instagram. Elle reçoit...',
    answers: [
      {
        text: '"Belle voiture 🔥" — les amis kiffent la vibe',
        sub: 'Style, esthétique, présence visuelle forte',
        likelihood: byCat({ performance: 1.0, luxury: 0.9, practical: 0.3, eco: 0.15 })
      },
      {
        text: '"Pratique et sympa !" — commentaires positifs mais sobres',
        sub: 'La voiture bien choisie, pas un objet de désir',
        likelihood: byCat({ practical: 1.0, eco: 0.9, luxury: 0.3, performance: 0.1 })
      },
      {
        text: '"La marque !" — les gens reconnaissent avant la voiture',
        sub: 'Badge premium iconique',
        likelihood: byBrands(['bmw', 'mercedes', 'audi', 'ferrari', 'lamborghini', 'porsche'])
      },
      {
        text: 'Je ne poste pas de photo de voiture — ce n\'est pas mon truc',
        sub: 'Discret, le statut ne m\'intéresse pas',
        likelihood: byPrice([30000, 1.0], [50000, 0.6], [Infinity, 0.15])
      }
    ]
  },

  {
    id: 'social_pret_voiture',
    question: 'Ton petit frère te demande de lui prêter ta voiture pour le weekend. Tu...',
    answers: [
      {
        text: 'Oui sans problème — c\'est fait pour rouler',
        sub: 'Pas d\'attachement, voiture utilitaire',
        likelihood: byPrice([25000, 1.0], [40000, 0.6], [Infinity, 0.1])
      },
      {
        text: 'Oui mais je lui explique comment elle fonctionne avant',
        sub: 'Attaché mais généreux — voiture mi-gamme',
        likelihood: byPrice([20000, 0.3], [50000, 0.8], [70000, 1.0], [Infinity, 0.4])
      },
      {
        text: 'Je réfléchis — cette voiture c\'est spécial pour moi',
        sub: 'Voiture passion, très attaché',
        likelihood: byCat({ performance: 1.0, luxury: 0.75, eco: 0.3, practical: 0.4 })
      },
      {
        text: 'Non. Catégoriquement non.',
        sub: 'Voiture sacrée, aucune exception',
        likelihood: byPrice([80000, 0.5], [Infinity, 1.0])
      }
    ]
  },

  {
    id: 'social_station',
    question: 'À la station-service, tu vois quelqu\'un garer une Lamborghini à côté de toi. Tu...',
    answers: [
      {
        text: 'Je la regarde, j\'admire — mais c\'est pas pour moi',
        sub: 'Réaliste, pragmatique sur le budget',
        likelihood: byPrice([30000, 1.0], [55000, 0.6], [Infinity, 0.1])
      },
      {
        text: 'Je fais semblant de rien — mais j\'aimerais bien',
        sub: 'Ambition cachée, rêveur discret',
        likelihood: byPrice([20000, 0.3], [60000, 0.8], [100000, 1.0], [Infinity, 0.6])
      },
      {
        text: 'Je note le modèle — pour m\'en inspirer plus tard',
        sub: 'Aspirationnel, montant en gamme',
        likelihood: byCat({ performance: 0.8, luxury: 1.0, practical: 0.35, eco: 0.15 })
      },
      {
        text: 'On discute — j\'ai aussi quelque chose à dire côté voiture',
        sub: 'Passionné, haut de gamme, dans la communauté',
        likelihood: byPrice([80000, 0.4], [Infinity, 1.0])
      }
    ]
  },

  {
    id: 'social_embouteillage',
    question: 'Bouchons sur le boulevard Zerktouni à Casa, 45 minutes d\'attente. Tu...',
    answers: [
      {
        text: 'Je mets la musique, je siffle — la clim fait le reste',
        sub: 'Confort maximal, insonorisation parfaite',
        likelihood: byCat({ luxury: 1.0, practical: 0.65, performance: 0.3, eco: 0.4 })
      },
      {
        text: 'Je ronge mon frein — ma voiture mérite mieux que ça',
        sub: 'Voiture sport mal utilisée en ville',
        likelihood: byCat({ performance: 1.0, luxury: 0.5, practical: 0.2, eco: 0.1 })
      },
      {
        text: 'Je prends mon téléphone — dans ma petite je suis zen',
        sub: 'Petite citadine, aucune attente',
        likelihood: byPrice([18000, 1.0], [30000, 0.7], [Infinity, 0.1])
      },
      {
        text: 'Je cherche une ruelle — je connais le quartier',
        sub: 'Petite ou mi-gamme, manœuvrable',
        likelihood: byPrice([15000, 0.9], [35000, 1.0], [60000, 0.4], [Infinity, 0.1])
      }
    ]
  },

  {
    id: 'social_concessionnaire',
    question: 'Tu entres chez un concessionnaire sans rendez-vous. Le vendeur t\'accueille comment ?',
    answers: [
      {
        text: 'Il me montre direct les entrées de gamme',
        sub: 'Budget perçu comme modeste — je cherche du pratique',
        likelihood: byPrice([20000, 1.0], [35000, 0.7], [Infinity, 0.1])
      },
      {
        text: 'Il me montre les best-sellers — Golf, Série 3, C-Class',
        sub: 'Profil mid à upper-mid — standard premium',
        likelihood: byPrice([20000, 0.1], [55000, 1.0], [80000, 0.6], [Infinity, 0.15])
      },
      {
        text: 'Il me guide vers les modèles haut de gamme directement',
        sub: 'Mon allure, ma montre ou mon arrivée — ça se voit',
        likelihood: byPrice([70000, 0.4], [Infinity, 1.0])
      },
      {
        text: 'Il me laisse regarder — je connais déjà ce que je veux',
        sub: 'Passionné averti, déjà documenté',
        likelihood: byCat({ performance: 1.0, luxury: 0.8, practical: 0.4, eco: 0.35 })
      }
    ]
  },

  // ════════════════════════════════════════════════════════════════════════════
  // BLOC 2 — BUDGET (8 questions)
  // ════════════════════════════════════════════════════════════════════════════

  {
    id: 'budget_mensualite',
    question: 'Si tu finances ta voiture, quelle mensualité tu peux assumer sans stress ?',
    answers: [
      {
        text: 'Moins de 300 € / mois',
        sub: 'Budget serré mais bien géré',
        likelihood: byPrice([20000, 1.0], [30000, 0.7], [45000, 0.2], [Infinity, 0.02])
      },
      {
        text: '300 à 600 € / mois',
        sub: 'L\'essentiel du marché — bon équilibre',
        likelihood: byPrice([18000, 0.2], [50000, 1.0], [70000, 0.4], [Infinity, 0.05])
      },
      {
        text: '600 à 1 200 € / mois',
        sub: 'Je me fais plaisir — premium assumé',
        likelihood: byPrice([50000, 0.05], [100000, 1.0], [Infinity, 0.5])
      },
      {
        text: 'Je paie cash — la mensualité ne me concerne pas',
        sub: 'Achat comptant, budget confortable',
        likelihood: byPrice([40000, 0.2], [100000, 0.7], [Infinity, 1.0])
      }
    ]
  },

  {
    id: 'budget_carburant',
    question: 'Combien tu es prêt à dépenser en carburant par mois ?',
    answers: [
      {
        text: 'Moins de 500 DH — je surveille ça de près',
        sub: 'Faible consommation prioritaire',
        likelihood: byCO2([110, 1.0], [140, 0.65], [170, 0.2], [Infinity, 0.05])
      },
      {
        text: '500 à 1 500 DH — c\'est dans mon budget',
        sub: 'Consommation standard acceptable',
        likelihood: byCO2([100, 0.3], [160, 1.0], [200, 0.5], [Infinity, 0.15])
      },
      {
        text: '1 500 à 3 000 DH — je roule beaucoup',
        sub: 'Kilométrage élevé, puissance importante',
        likelihood: byCO2([140, 0.1], [200, 0.7], [250, 1.0], [Infinity, 0.8])
      },
      {
        text: 'Je ne regarde pas le compteur — la performance avant tout',
        sub: 'Budget illimité côté carburant',
        likelihood: byPrice([80000, 0.4], [Infinity, 1.0])
      }
    ]
  },

  {
    id: 'budget_entretien',
    question: 'L\'entretien annuel de ta voiture, tu le vois à combien ?',
    answers: [
      {
        text: 'Moins de 3 000 DH — révision basique chez le mécano du quartier',
        sub: 'Modèle simple, pièces accessibles au Maroc',
        likelihood: byBrands(['dacia', 'renault', 'hyundai', 'kia', 'fiat', 'toyota'])
      },
      {
        text: '3 000 à 8 000 DH — concessionnaire ou garagiste spécialisé',
        sub: 'Entretien structuré, budget raisonnable',
        likelihood: byPrice([15000, 0.5], [45000, 1.0], [70000, 0.6], [Infinity, 0.2])
      },
      {
        text: '8 000 à 20 000 DH — le prix d\'une belle voiture',
        sub: 'Entretien premium, concessionnaire officiel',
        likelihood: byPrice([50000, 0.2], [90000, 0.8], [Infinity, 1.0])
      },
      {
        text: 'Je ne sais pas encore — je découvre',
        sub: 'Première voiture ou changement de gamme',
        likelihood: byCat({ eco: 0.7, practical: 0.8, luxury: 0.4, performance: 0.3 })
      }
    ]
  },

  {
    id: 'budget_revente',
    question: 'La valeur de revente de ta voiture dans 5 ans, c\'est...',
    answers: [
      {
        text: 'Pas ma priorité — je la garde longtemps',
        sub: 'Acheteur long terme, valeur résiduelle ignorée',
        likelihood: byBrands(['dacia', 'fiat', 'renault', 'citroen', 'peugeot'])
      },
      {
        text: 'Important — je choisis des modèles qui tiennent leur valeur',
        sub: 'Toyota, Kia, Hyundai — fiabilité et valeur résiduelle',
        likelihood: byBrands(['toyota', 'honda', 'kia', 'hyundai', 'bmw', 'mercedes'])
      },
      {
        text: 'Capital — je raisonne en coût total de possession',
        sub: 'Investisseur rationnel, calcul sur 5 ans',
        likelihood: byCat({ luxury: 1.0, performance: 0.7, practical: 0.6, eco: 0.3 })
      },
      {
        text: 'Je revends souvent — je veux récupérer le max',
        sub: 'Cycle court, rotation fréquente',
        likelihood: byBrands(['bmw', 'mercedes', 'audi', 'toyota', 'porsche'])
      }
    ]
  },

  {
    id: 'budget_occasion_neuf',
    question: 'Occasion ou neuf — quelle est ta philosophie ?',
    answers: [
      {
        text: 'Neuf uniquement — je veux ma voiture vierge',
        sub: 'Garantie constructeur, aucune surprise',
        likelihood: byCat({ eco: 0.8, practical: 0.9, luxury: 0.7, performance: 0.6 })
      },
      {
        text: 'Occasion récente (moins de 3 ans) — les économies sont réelles',
        sub: 'Rapport qualité/prix optimisé',
        likelihood: byPrice([30000, 0.4], [60000, 1.0], [90000, 0.8], [Infinity, 0.5])
      },
      {
        text: 'N\'importe quelle occasion fiable — le prix avant tout',
        sub: 'Budget contraint, pragmatisme absolu',
        likelihood: byPrice([15000, 1.0], [25000, 0.8], [40000, 0.3], [Infinity, 0.05])
      },
      {
        text: 'Neuf avec personnalisation — je la configure moi-même',
        sub: 'Passionné qui veut exactement ce qu\'il veut',
        likelihood: byCat({ performance: 1.0, luxury: 0.9, practical: 0.4, eco: 0.3 })
      }
    ]
  },

  {
    id: 'budget_priorite_sacrifice',
    question: 'Si tu dois sacrifier quelque chose pour rester dans ton budget, tu sacrifies quoi ?',
    answers: [
      {
        text: 'La marque — un équivalent moins connu mais identique',
        sub: 'Fonctionnel > prestige',
        likelihood: byBrands(['hyundai', 'kia', 'dacia', 'seat', 'skoda'])
      },
      {
        text: 'La motorisation — moins de puissance mais le modèle voulu',
        sub: 'Le style et la marque avant la perf',
        likelihood: byCat({ luxury: 0.8, practical: 0.7, performance: 0.2, eco: 0.6 })
      },
      {
        text: 'L\'équipement — version de base mais le modèle exact',
        sub: 'Le modèle est intouchable, les options peuvent attendre',
        likelihood: byCat({ performance: 1.0, luxury: 0.8, practical: 0.5, eco: 0.4 })
      },
      {
        text: 'Rien — j\'attends d\'avoir le budget pour ce que je veux vraiment',
        sub: 'Patient, refuse de compromettre sa vision',
        likelihood: byPrice([70000, 0.4], [Infinity, 1.0])
      }
    ]
  },

  {
    id: 'budget_reve_raison',
    question: 'Au fond — voiture de raison ou voiture de rêve ?',
    answers: [
      {
        text: 'Raison absolue — c\'est un outil de transport',
        sub: 'Zéro romantisme, 100% utilitaire',
        likelihood: byPrice([20000, 1.0], [30000, 0.8], [50000, 0.3], [Infinity, 0.05])
      },
      {
        text: 'Raison avec une touche de plaisir — le juste milieu',
        sub: 'Le bon sens mais pas au détriment du plaisir',
        likelihood: byPrice([15000, 0.3], [50000, 1.0], [75000, 0.6], [Infinity, 0.15])
      },
      {
        text: 'Rêve — mais raisonnable dans mon budget actuel',
        sub: 'Le meilleur accessible, avec ambition',
        likelihood: byCat({ luxury: 0.9, performance: 0.8, practical: 0.5, eco: 0.3 })
      },
      {
        text: 'Rêve absolu — la raison peut attendre',
        sub: 'Passion totale, logique suspendue',
        likelihood: byCat({ performance: 1.0, luxury: 0.85, practical: 0.1, eco: 0.05 })
      }
    ]
  },

  {
    id: 'budget_upgrade_5ans',
    question: 'Dans 5 ans, tu te vois dans quelle voiture ?',
    answers: [
      {
        text: 'La même — ou un modèle équivalent bien entretenu',
        sub: 'Stable, peu de rotation',
        likelihood: byPrice([20000, 1.0], [40000, 0.6], [Infinity, 0.1])
      },
      {
        text: 'Un cran au-dessus — naturellement',
        sub: 'Progression linéaire et logique',
        likelihood: byPrice([20000, 0.3], [55000, 1.0], [80000, 0.7], [Infinity, 0.3])
      },
      {
        text: 'Ce que je n\'ai pas pu me payer aujourd\'hui',
        sub: 'Objectif clair, vision long terme',
        likelihood: byCat({ luxury: 1.0, performance: 0.9, practical: 0.3, eco: 0.2 })
      },
      {
        text: 'Je ne sais pas — la vie decide',
        sub: 'Flexible, pas d\'attachement fort à la voiture',
        likelihood: byCat({ practical: 0.9, eco: 0.9, luxury: 0.3, performance: 0.2 })
      }
    ]
  },

  // ════════════════════════════════════════════════════════════════════════════
  // BLOC 3 — USAGE (8 questions)
  // ════════════════════════════════════════════════════════════════════════════

  {
    id: 'usage_trajet_quotidien',
    question: 'Ton trajet maison-boulot quotidien, c\'est...',
    answers: [
      {
        text: 'Moins de 10 km en ville — circulation dense',
        sub: 'Citadine, petite, facile à garer',
        likelihood: byPrice([20000, 1.0], [30000, 0.8], [50000, 0.3], [Infinity, 0.08])
      },
      {
        text: '10 à 30 km — un peu autoroute, un peu ville',
        sub: 'Polyvalente, confortable, fiable',
        likelihood: byCat({ practical: 1.0, eco: 0.7, luxury: 0.55, performance: 0.4 })
      },
      {
        text: 'Plus de 30 km — surtout autoroute',
        sub: 'Confort, motorisation efficace, longs trajets',
        likelihood: byCat({ luxury: 1.0, practical: 0.8, performance: 0.6, eco: 0.5 })
      },
      {
        text: 'Je travaille de chez moi — peu de trajets quotidiens',
        sub: 'Voiture de plaisir ou weekends',
        likelihood: byCat({ performance: 1.0, luxury: 0.8, eco: 0.5, practical: 0.4 })
      }
    ]
  },

  {
    id: 'usage_routes_maroc',
    question: 'Les routes que tu empruntes le plus au Maroc...',
    answers: [
      {
        text: 'Rues de ville — ruelles, dos d\'âne, trottoirs cassés',
        sub: 'Suspension endurcissante, petite caisse',
        likelihood: byPrice([20000, 1.0], [35000, 0.7], [Infinity, 0.2])
      },
      {
        text: 'Autoroutes Casa-Marrakech / Casa-Tanger',
        sub: 'Vitesse de croisière, confort autoroute',
        likelihood: byCat({ luxury: 1.0, practical: 0.75, performance: 0.6, eco: 0.5 })
      },
      {
        text: 'Routes nationales — montagne, villages, longues lignes droites',
        sub: 'Robustesse, garde au sol correcte',
        likelihood: car =>
          car.category === 'practical' && (car.price_eur||0) >= 18000 ? 1.0
          : car.category === 'eco' ? 0.5
          : 0.35
      },
      {
        text: 'Pistes, palmeries, routes non asphaltées — l\'aventure',
        sub: 'SUV robuste, 4x4 recommandé',
        likelihood: car =>
          (car.make||'').toLowerCase().includes('toyota') && (car.model||'').toLowerCase().includes('land') ? 1.0
          : car.category === 'practical' && (car.price_eur||0) >= 19000 ? 0.8
          : 0.15
      }
    ]
  },

  {
    id: 'usage_km_annuels',
    question: 'Combien de kilomètres tu fais par an en moyenne ?',
    answers: [
      {
        text: 'Moins de 15 000 km — je roule peu',
        sub: 'Voiture de weekend ou courtes distances',
        likelihood: byCat({ performance: 0.9, luxury: 0.7, eco: 0.7, practical: 0.5 })
      },
      {
        text: '15 000 à 30 000 km — usage standard',
        sub: 'La moyenne nationale — voiture polyvalente',
        likelihood: byCat({ practical: 1.0, eco: 0.8, luxury: 0.6, performance: 0.4 })
      },
      {
        text: '30 000 à 60 000 km — je roule beaucoup',
        sub: 'Fiabilité et consommation critiques',
        likelihood: byBrands(['toyota', 'kia', 'hyundai', 'dacia', 'volkswagen'])
      },
      {
        text: 'Plus de 60 000 km — professionnel ou grands voyageurs',
        sub: 'Diesel ou hybride, entretien rigoureux',
        likelihood: byCO2([0, 0.8], [120, 1.0], [160, 0.7], [Infinity, 0.2])
      }
    ]
  },

  {
    id: 'usage_weekend_escapade',
    question: 'Le weekend, ta voiture sert à...',
    answers: [
      {
        text: 'Rester en ville — sorties, restaurants, visites',
        sub: 'Citadine suffisante, pas besoin de plus',
        likelihood: byPrice([20000, 1.0], [35000, 0.7], [60000, 0.3], [Infinity, 0.1])
      },
      {
        text: 'Escapades à Essaouira, Ifrane, Ouarzazate',
        sub: 'Polyvalent, confort route, coffre utile',
        likelihood: byCat({ practical: 1.0, luxury: 0.75, eco: 0.55, performance: 0.4 })
      },
      {
        text: 'Sessions conduite sportive — cols de montagne',
        sub: 'Plaisir de conduite pur, châssis vif',
        likelihood: byCat({ performance: 1.0, luxury: 0.4, practical: 0.15, eco: 0.1 })
      },
      {
        text: 'Tout — je suis imprévisible',
        sub: 'Polyvalence absolue — SUV idéal',
        likelihood: byCat({ practical: 0.95, luxury: 0.55, eco: 0.6, performance: 0.3 })
      }
    ]
  },

  {
    id: 'usage_parking',
    question: 'Comment tu gares ta voiture au quotidien ?',
    answers: [
      {
        text: 'Dans la rue — je manœuvre dans des espaces réduits',
        sub: 'Petite, maniable, facile à garer',
        likelihood: byPrice([18000, 1.0], [28000, 0.8], [50000, 0.2], [Infinity, 0.05])
      },
      {
        text: 'Parking payant ou résidence — sans stress',
        sub: 'Taille standard, peu d\'inquiétude',
        likelihood: byPrice([15000, 0.5], [55000, 1.0], [80000, 0.7], [Infinity, 0.3])
      },
      {
        text: 'Garage privatif — elle est toujours à l\'abri',
        sub: 'Voiture précieuse, protection garantie',
        likelihood: byPrice([60000, 0.4], [Infinity, 1.0])
      },
      {
        text: 'Je ne réfléchis pas à ça — elle se gare où il y a de la place',
        sub: 'Décontracté, voiture sans valeur émotionnelle forte',
        likelihood: byPrice([20000, 1.0], [35000, 0.7], [Infinity, 0.15])
      }
    ]
  },

  {
    id: 'usage_seul_groupe',
    question: 'La plupart du temps, tu roules...',
    answers: [
      {
        text: 'Seul — ma voiture est mon espace',
        sub: 'Extension de soi, plaisir solo',
        likelihood: byCat({ performance: 1.0, luxury: 0.8, eco: 0.7, practical: 0.4 })
      },
      {
        text: 'Avec ma femme/mon partenaire — à deux c\'est parfait',
        sub: 'Confort couple, espace défini',
        likelihood: byCat({ luxury: 1.0, performance: 0.7, eco: 0.6, practical: 0.5 })
      },
      {
        text: 'Avec les enfants — famille nucléaire',
        sub: 'Sécurité, espace, confort arrière',
        likelihood: byCat({ practical: 1.0, luxury: 0.65, eco: 0.5, performance: 0.05 })
      },
      {
        text: 'Ça change tout le temps — famille, amis, collègues',
        sub: 'Polyvalence maximale',
        likelihood: byCat({ practical: 1.0, eco: 0.75, luxury: 0.55, performance: 0.2 })
      }
    ]
  },

  {
    id: 'usage_coffre',
    question: 'Le coffre de ta voiture, tu en as vraiment besoin ?',
    answers: [
      {
        text: 'Non — un sac à dos suffit la plupart du temps',
        sub: 'Célibataire ou léger par nature',
        likelihood: byCat({ performance: 1.0, eco: 0.8, luxury: 0.4, practical: 0.2 })
      },
      {
        text: 'Oui — les courses, les valises, le matériel de sport',
        sub: 'Minimum 400L, pratique avant tout',
        likelihood: byCat({ practical: 1.0, luxury: 0.6, eco: 0.55, performance: 0.1 })
      },
      {
        text: 'Beaucoup — je transporte régulièrement des choses volumineuses',
        sub: 'Grand coffre, rabattement des sièges',
        likelihood: byCat({ practical: 1.0, luxury: 0.4, eco: 0.3, performance: 0.05 })
      },
      {
        text: 'Moyen — ni trop ni peu',
        sub: 'Standard suffisant',
        likelihood: byCat({ eco: 0.8, practical: 0.85, luxury: 0.6, performance: 0.3 })
      }
    ]
  },

  {
    id: 'usage_conduite_plaisir',
    question: 'La conduite pour toi c\'est...',
    answers: [
      {
        text: 'Une contrainte — A à B le plus vite possible',
        sub: 'Automatique, confort, zéro effort',
        likelihood: byCat({ practical: 0.8, eco: 0.9, luxury: 0.6, performance: 0.1 })
      },
      {
        text: 'Une nécessité agréable — je kiffe si la voiture suit',
        sub: 'Plaisir ponctuel, modèle dynamique',
        likelihood: byCat({ practical: 0.7, luxury: 0.8, eco: 0.5, performance: 0.7 })
      },
      {
        text: 'Une passion — je conduis pour conduire',
        sub: 'Châssis, sensations, réactivité',
        likelihood: byCat({ performance: 1.0, luxury: 0.5, practical: 0.2, eco: 0.1 })
      },
      {
        text: 'Un moment zen — calme, musique, isolation du monde',
        sub: 'Insonorisation, confort, luxe',
        likelihood: byCat({ luxury: 1.0, practical: 0.55, eco: 0.4, performance: 0.25 })
      }
    ]
  },

  // ════════════════════════════════════════════════════════════════════════════
  // BLOC 4 — MOTORISATION (7 questions)
  // ════════════════════════════════════════════════════════════════════════════

  {
    id: 'moto_carburant_type',
    question: 'Quel type de motorisation tu imagines pour ta prochaine voiture ?',
    answers: [
      {
        text: 'Essence — simple, performant, partout au Maroc',
        sub: 'Infrastructure parfaite, polyvalent',
        likelihood: byCO2([130, 0.2], [220, 1.0], [Infinity, 0.7])
      },
      {
        text: 'Hybride — le meilleur des deux mondes',
        sub: 'Efficience en ville, liberté en route',
        likelihood: byCO2([0, 0.4], [120, 1.0], [160, 0.4], [Infinity, 0.07])
      },
      {
        text: 'Électrique — je suis convaincu, j\'ai une borne',
        sub: 'Futur maintenant, zéro émission',
        likelihood: byCO2([0, 1.0], [80, 0.3], [Infinity, 0.02])
      },
      {
        text: 'Diesel — je roule beaucoup, le coût prime',
        sub: 'Longues distances, économique',
        likelihood: car => {
          const co2 = car.co2_g_km ?? 150;
          const hp = car.power_hp || 100;
          if (co2 >= 130 && co2 < 200 && hp >= 100 && hp < 280) return 1.0;
          if (co2 >= 100 && co2 < 150) return 0.6;
          return 0.1;
        }
      }
    ]
  },

  {
    id: 'moto_puissance',
    question: 'Niveau puissance, tu as besoin de combien de chevaux pour être à l\'aise ?',
    answers: [
      {
        text: 'Moins de 100 ch — suffisant pour la ville',
        sub: 'Citadine légère, économique',
        likelihood: byHP([90, 1.0], [120, 0.6], [180, 0.15], [Infinity, 0.02])
      },
      {
        text: '100 à 160 ch — polyvalent et réactif',
        sub: 'Le bon équilibre pour tout faire',
        likelihood: byHP([90, 0.3], [160, 1.0], [220, 0.4], [Infinity, 0.1])
      },
      {
        text: '160 à 280 ch — nerveuse, qui répond vraiment',
        sub: 'Sportivité quotidienne, plaisir de conduite',
        likelihood: byHP([130, 0.1], [280, 1.0], [380, 0.5], [Infinity, 0.3])
      },
      {
        text: 'Plus de 300 ch — au-dessous je ne ressens pas grand chose',
        sub: 'Sensations fortes, hautes performances',
        likelihood: byHP([200, 0.05], [300, 0.3], [Infinity, 1.0])
      }
    ]
  },

  {
    id: 'moto_boite',
    question: 'Boîte automatique ou manuelle — ton avis ?',
    answers: [
      {
        text: 'Automatique — surtout dans les bouchons de Casa',
        sub: 'Confort, modernité, facilité',
        likelihood: byCat({ luxury: 1.0, practical: 0.8, eco: 0.7, performance: 0.5 })
      },
      {
        text: 'Manuelle — je veux contrôler ma voiture moi-même',
        sub: 'Engagement de conduite, connexion physique',
        likelihood: byCat({ performance: 1.0, eco: 0.6, practical: 0.4, luxury: 0.15 })
      },
      {
        text: 'Automatique DSG / PDK — le meilleur des deux',
        sub: 'Rapidité et contrôle — la technologie au service du plaisir',
        likelihood: byCat({ performance: 0.9, luxury: 0.8, practical: 0.4, eco: 0.3 })
      },
      {
        text: 'Je n\'ai pas de préférence forte',
        sub: 'Pragmatique — ce qui correspond au modèle',
        likelihood: byCat({ eco: 0.9, practical: 0.9, luxury: 0.5, performance: 0.3 })
      }
    ]
  },

  {
    id: 'moto_son_moteur',
    question: 'Tu démarres ta voiture le matin. Tes voisins entendent...',
    answers: [
      {
        text: 'Absolument rien — silence électrique total',
        sub: 'Électrique ou hybride recharge',
        likelihood: byCO2([0, 1.0], [80, 0.4], [Infinity, 0.02])
      },
      {
        text: 'Un ronron discret et moderne',
        sub: 'Hybride ou essence moderne raffiné',
        likelihood: byCO2([0, 0.3], [130, 1.0], [170, 0.5], [Infinity, 0.08])
      },
      {
        text: 'Un moteur vivant avec du caractère',
        sub: 'Essence atmosphérique ou turbo — sonorité franche',
        likelihood: byCO2([110, 0.2], [200, 1.0], [240, 0.7], [Infinity, 0.4])
      },
      {
        text: 'Tout le quartier sait que c\'est moi',
        sub: 'V8, sport exhaust, présence sonore assumée',
        likelihood: car => {
          const co2 = car.co2_g_km ?? 150;
          const hp = car.power_hp || 100;
          if (co2 >= 230) return 1.0;
          if (hp >= 300 && co2 >= 170) return 0.7;
          return 0.06;
        }
      }
    ]
  },

  {
    id: 'moto_acceleration',
    question: 'L\'accélération pour toi c\'est...',
    answers: [
      {
        text: 'Pas importante — j\'accélère doucement de toute façon',
        sub: 'Conducteur paisible, économie de carburant',
        likelihood: byHP([90, 1.0], [130, 0.7], [200, 0.2], [Infinity, 0.03])
      },
      {
        text: 'Correcte — suffisante pour les insertions autoroute',
        sub: 'Fonctionnel, sans excès',
        likelihood: byHP([80, 0.3], [160, 1.0], [230, 0.5], [Infinity, 0.1])
      },
      {
        text: 'Vivace — je veux que ça réponde au doigt et à l\'œil',
        sub: 'Nerveux, réactif — 0-100 en moins de 7s',
        likelihood: byHP([130, 0.1], [250, 0.7], [350, 1.0], [Infinity, 0.8])
      },
      {
        text: 'Le critère principal — tout le reste s\'adapte',
        sub: 'Performance pure — 0-100 sub-5s minimum',
        likelihood: byHP([200, 0.1], [300, 0.4], [Infinity, 1.0])
      }
    ]
  },

  {
    id: 'moto_conso_acceptable',
    question: 'Une consommation de 10L/100km pour toi c\'est...',
    answers: [
      {
        text: 'Inacceptable — je vise moins de 6L/100km',
        sub: 'Éco-conduite, budget carburant serré',
        likelihood: byCO2([0, 1.0], [110, 0.9], [145, 0.4], [Infinity, 0.03])
      },
      {
        text: 'Beaucoup — je veux rester autour de 7-8L',
        sub: 'Raisonnable, milieu de gamme',
        likelihood: byCO2([100, 0.4], [160, 1.0], [200, 0.4], [Infinity, 0.1])
      },
      {
        text: 'Acceptable si la voiture le mérite',
        sub: 'Compromis performance/consommation',
        likelihood: byCO2([140, 0.2], [210, 0.7], [Infinity, 1.0])
      },
      {
        text: 'Je n\'y pense même pas — la performance d\'abord',
        sub: 'Budget illimité côté carburant',
        likelihood: byCat({ performance: 1.0, luxury: 0.7, practical: 0.2, eco: 0.05 })
      }
    ]
  },

  {
    id: 'moto_4x4_traction',
    question: 'Tu as besoin d\'un 4x4 ou d\'une transmission intégrale ?',
    answers: [
      {
        text: 'Non — traction avant standard, ça suffit',
        sub: 'Usage urbain, route asphaltée uniquement',
        likelihood: byCat({ eco: 1.0, practical: 0.6, luxury: 0.4, performance: 0.3 })
      },
      {
        text: 'Parfois — les pluies à Casa ou les pistes de Marrakech',
        sub: '4x4 à la demande ou AWD léger',
        likelihood: car =>
          car.category === 'practical' && (car.price_eur||0) >= 22000 ? 1.0
          : car.category === 'luxury' ? 0.6
          : 0.3
      },
      {
        text: 'Toujours — je roule souvent sur des terrains difficiles',
        sub: 'Vrai 4x4, garde au sol haute',
        likelihood: car =>
          (car.make||'').toLowerCase().includes('toyota') && (car.model||'').includes('Land') ? 1.0
          : car.category === 'practical' && (car.power_hp||0) >= 130 ? 0.8
          : 0.15
      },
      {
        text: 'Propulsion — c\'est la seule vraie configuration de conduite',
        sub: 'Sportif puriste — roues arrière uniquement',
        likelihood: car => {
          const m = (car.make||'').toLowerCase();
          if (m.includes('bmw') && car.category === 'performance') return 1.0;
          if (car.category === 'performance') return 0.7;
          return 0.1;
        }
      }
    ]
  },

  // ════════════════════════════════════════════════════════════════════════════
  // BLOC 5 — CONFORT / TECH / STYLE / FAMILLE / MARQUE (12 questions)
  // ════════════════════════════════════════════════════════════════════════════

  {
    id: 'confort_suspension',
    question: 'Sur une route cabossée — tu veux ressentir quoi ?',
    answers: [
      {
        text: 'Rien du tout — je flotte sur un nuage',
        sub: 'Suspension ultra-confortable, filtrage parfait',
        likelihood: byCat({ luxury: 1.0, practical: 0.65, performance: 0.18, eco: 0.4 })
      },
      {
        text: 'Un peu — ça me dit que la route existe',
        sub: 'Compromis GT — confort avec retour d\'infos',
        likelihood: byCat({ luxury: 0.7, practical: 0.8, eco: 0.7, performance: 0.4 })
      },
      {
        text: 'Tout — je veux sentir chaque virage, chaque bosse',
        sub: 'Suspensions fermes, connexion route directe',
        likelihood: byCat({ performance: 1.0, luxury: 0.25, practical: 0.2, eco: 0.1 })
      }
    ]
  },

  {
    id: 'confort_insonorisation',
    question: 'À 120 km/h sur l\'autoroute, tu veux entendre quoi dans l\'habitacle ?',
    answers: [
      {
        text: 'Le silence — juste la musique que j\'ai choisie',
        sub: 'Insonorisation premium, isolation parfaite',
        likelihood: byCat({ luxury: 1.0, practical: 0.5, performance: 0.25, eco: 0.3 })
      },
      {
        text: 'Un peu de vie — le moteur discret, l\'air',
        sub: 'Insonorisation correcte, voiture normale',
        likelihood: byCat({ practical: 1.0, eco: 0.8, luxury: 0.4, performance: 0.5 })
      },
      {
        text: 'Le moteur — j\'aime cette bande-son',
        sub: 'Échappement audible, sportif',
        likelihood: byCat({ performance: 1.0, luxury: 0.2, eco: 0.1, practical: 0.15 })
      }
    ]
  },

  {
    id: 'tech_tableau_bord',
    question: 'Dans ta voiture idéale, le tableau de bord ressemble à...',
    answers: [
      {
        text: 'Une salle de contrôle — tout est connecté, tactile, intelligent',
        sub: 'Grand écran, IA, mises à jour OTA',
        likelihood: car => {
          if ((car.make||'').toLowerCase().includes('tesla')) return 1.0;
          if (car.category === 'luxury') return 0.85;
          if (car.co2_g_km === 0) return 0.75;
          return 0.4;
        }
      },
      {
        text: 'Moderne mais sobre — l\'utile sans le superflu',
        sub: 'Écran 10", CarPlay, clim auto',
        likelihood: byCat({ practical: 1.0, luxury: 0.7, eco: 0.7, performance: 0.5 })
      },
      {
        text: 'Des cadrans, un volant — conduire c\'est tout',
        sub: 'Simplicité, zéro distraction',
        likelihood: byCat({ performance: 0.8, eco: 0.7, practical: 0.5, luxury: 0.15 })
      }
    ]
  },

  {
    id: 'tech_aides_conduite',
    question: 'Les assistances à la conduite (freinage auto, maintien de voie, radar...) tu...',
    answers: [
      {
        text: 'Je veux tout — plus de sécurité c\'est mieux',
        sub: 'Pack sécurité complet, assistance maximale',
        likelihood: byCat({ luxury: 1.0, practical: 0.85, eco: 0.7, performance: 0.3 })
      },
      {
        text: 'Les essentiels — caméra recul et radar de stationnement',
        sub: 'Pratique sans être envahissant',
        likelihood: byCat({ practical: 0.9, eco: 0.8, luxury: 0.5, performance: 0.4 })
      },
      {
        text: 'Le moins possible — ça m\'agace, je veux conduire moi',
        sub: 'Puriste, autonomie de conduite totale',
        likelihood: byCat({ performance: 1.0, eco: 0.5, practical: 0.35, luxury: 0.2 })
      }
    ]
  },

  {
    id: 'style_carrosserie',
    question: 'Quelle silhouette te correspond le mieux ?',
    answers: [
      {
        text: 'Berline classique — ligne épurée, coffre séparé',
        sub: 'Élégance formelle, volumétrie claire',
        likelihood: byCat({ luxury: 1.0, eco: 0.6, practical: 0.5, performance: 0.4 })
      },
      {
        text: 'SUV / crossover — haut perché, dominant',
        sub: 'Visibilité, espace, présence visuelle forte',
        likelihood: byCat({ practical: 1.0, luxury: 0.65, eco: 0.45, performance: 0.2 })
      },
      {
        text: 'Compacte / hatchback — vif, maniable, moderne',
        sub: 'Dynamique, polyvalente, citadine et route',
        likelihood: byCat({ eco: 1.0, performance: 0.7, practical: 0.6, luxury: 0.2 })
      },
      {
        text: 'Coupé / sportback — la ligne qui tue',
        sub: 'Style avant tout, sacrifier un peu de pratique',
        likelihood: byCat({ performance: 1.0, luxury: 0.75, eco: 0.3, practical: 0.15 })
      }
    ]
  },

  {
    id: 'style_interieur',
    question: 'L\'intérieur de ta voiture idéale...',
    answers: [
      {
        text: 'Cuir, bois, métal — raffinement total',
        sub: 'Matériaux premium, finition luxueuse',
        likelihood: byCat({ luxury: 1.0, performance: 0.6, practical: 0.2, eco: 0.1 })
      },
      {
        text: 'Propre, moderne, bien assemblé — qualité sans ostentation',
        sub: 'Plastiques de qualité, ambiance sérieuse',
        likelihood: byCat({ practical: 1.0, eco: 0.8, luxury: 0.4, performance: 0.5 })
      },
      {
        text: 'Sportif — sièges baquets, volant plat, rouge sur fond noir',
        sub: 'Ambiance circuit, cockpit pilot-oriented',
        likelihood: byCat({ performance: 1.0, luxury: 0.35, practical: 0.1, eco: 0.1 })
      },
      {
        text: 'Minimaliste — le moins possible, espace et clarté',
        sub: 'Design épuré, zéro surcharge visuelle',
        likelihood: car =>
          (car.make||'').toLowerCase().includes('tesla') ? 1.0
          : car.co2_g_km === 0 ? 0.75
          : 0.35
      }
    ]
  },

  {
    id: 'famille_nombre_places',
    question: 'Combien de personnes montent régulièrement dans ta voiture ?',
    answers: [
      {
        text: '1 à 2 — moi et occasionnellement quelqu\'un',
        sub: 'Petit format, focus sur le conducteur',
        likelihood: byCat({ performance: 1.0, eco: 0.85, luxury: 0.7, practical: 0.3 })
      },
      {
        text: '3 à 4 — famille nucléaire ou groupes d\'amis',
        sub: 'Standard 5 places confortables',
        likelihood: byCat({ practical: 0.9, luxury: 0.8, eco: 0.75, performance: 0.4 })
      },
      {
        text: '5 à 6 — grande famille marocaine classique',
        sub: 'Espace arrière critique, coffre large',
        likelihood: byCat({ practical: 1.0, luxury: 0.5, eco: 0.4, performance: 0.05 })
      },
      {
        text: 'Ça varie — parfois seul, parfois à 6',
        sub: 'Polyvalence totale, 7 places optionnel',
        likelihood: byCat({ practical: 1.0, luxury: 0.55, eco: 0.6, performance: 0.15 })
      }
    ]
  },

  {
    id: 'famille_securite',
    question: 'La sécurité passive (étoiles NCAP, airbags, structure) pour toi...',
    answers: [
      {
        text: '5 étoiles NCAP — c\'est non-négociable',
        sub: 'Sécurité maximale, famille à protéger',
        likelihood: byCat({ practical: 1.0, luxury: 0.85, eco: 0.75, performance: 0.3 })
      },
      {
        text: 'Important mais pas obsessionnel — tout moderne est sûr',
        sub: 'Standard acceptable, confiance dans la modernité',
        likelihood: () => 0.70
      },
      {
        text: 'Je l\'ai regardé mais c\'est pas mon critère principal',
        sub: 'D\'autres paramètres priment',
        likelihood: byCat({ performance: 1.0, luxury: 0.5, eco: 0.5, practical: 0.35 })
      }
    ]
  },

  {
    id: 'marque_culture_auto',
    question: 'Si tu devais choisir une culture automobile, laquelle te ressemble ?',
    answers: [
      {
        text: 'Allemande — ingénierie, fiabilité, rigueur',
        sub: 'BMW, Mercedes, Audi, VW, Porsche',
        likelihood: byBrands(['bmw', 'mercedes', 'audi', 'porsche', 'volkswagen'])
      },
      {
        text: 'Japonaise ou coréenne — pragmatisme légendaire',
        sub: 'Toyota, Hyundai, Kia, Honda',
        likelihood: byBrands(['toyota', 'honda', 'hyundai', 'kia'])
      },
      {
        text: 'Française — style, caractère, l\'automobile avec de l\'âme',
        sub: 'Peugeot, Renault, Citroën, Dacia',
        likelihood: byBrands(['peugeot', 'renault', 'citroen', 'dacia'])
      },
      {
        text: 'Aucune — je veux juste la meilleure, peu importe l\'origine',
        sub: 'Sans biais, objectif total',
        likelihood: () => 0.75
      }
    ]
  },

  {
    id: 'marque_fidelite',
    question: 'Tu es fidèle à une marque automobile ?',
    answers: [
      {
        text: 'Oui — j\'ai toujours la même et j\'en suis fier',
        sub: 'Identité de marque forte, communauté',
        likelihood: car => {
          const m = (car.make||'').toLowerCase();
          if (['bmw','mercedes','toyota','porsche'].some(b => m.includes(b))) return 1.0;
          return 0.4;
        }
      },
      {
        text: 'Plutôt oui — sauf si mieux ailleurs',
        sub: 'Préférence avec ouverture d\'esprit',
        likelihood: () => 0.70
      },
      {
        text: 'Non — je compare à chaque fois from scratch',
        sub: 'Rationnel, pas d\'attaches sentimentales à une marque',
        likelihood: byCat({ practical: 0.9, eco: 0.8, luxury: 0.5, performance: 0.5 })
      },
      {
        text: 'Je change souvent exprès — j\'aime découvrir',
        sub: 'Curieux, aventurier des marques',
        likelihood: byCat({ eco: 0.7, practical: 0.65, performance: 0.6, luxury: 0.55 })
      }
    ]
  },

  {
    id: 'perso_statut_voiture',
    question: 'La voiture comme signal de réussite sociale — tu y crois ?',
    answers: [
      {
        text: 'Non — les gens sérieux s\'en fichent',
        sub: 'Pragmatique, indifférent au regard extérieur',
        likelihood: byPrice([25000, 1.0], [40000, 0.7], [Infinity, 0.1])
      },
      {
        text: 'Un peu — ça dit quelque chose, que tu le veuilles ou non',
        sub: 'Lucide sur la société sans en être esclave',
        likelihood: byPrice([20000, 0.3], [60000, 1.0], [100000, 0.7], [Infinity, 0.3])
      },
      {
        text: 'Oui — c\'est même un critère pour moi',
        sub: 'La voiture comme projection de succès',
        likelihood: byCat({ luxury: 1.0, performance: 0.75, practical: 0.2, eco: 0.1 })
      },
      {
        text: 'Je m\'en sers consciemment — c\'est un outil de communication',
        sub: 'Stratège, la voiture choisie pour son message',
        likelihood: byPrice([60000, 0.4], [Infinity, 1.0])
      }
    ]
  },

  {
    id: 'perso_pragmatique_passionné',
    question: 'Face à une voiture — tu es plutôt...',
    answers: [
      {
        text: 'Tête — je compare les chiffres, les tests, les avis',
        sub: 'Rationnel, analytique, aucune place pour l\'émotion',
        likelihood: byCat({ eco: 0.9, practical: 1.0, luxury: 0.4, performance: 0.3 })
      },
      {
        text: 'Cœur — si elle me fait quelque chose, c\'est elle',
        sub: 'Coup de foudre, passion, instinct',
        likelihood: byCat({ performance: 1.0, luxury: 0.8, eco: 0.4, practical: 0.3 })
      },
      {
        text: 'Les deux — je valide le coup de cœur avec les chiffres',
        sub: 'Équilibre entre émotion et raison',
        likelihood: byCat({ luxury: 1.0, performance: 0.7, practical: 0.65, eco: 0.55 })
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

// Min 15 questions, max 30, stops when confident enough
function isDone(session, cars) {
  const asked = session.askedIds.size;
  if (asked < 15) return false;
  if (asked >= 30) return true;

  const probs = cars.map(c => session.carProbs[c.id] || 0).sort((a, b) => b - a);
  const top = probs[0] || 0;
  const second = probs[1] || 0;

  if (top > 0.60) return true;
  if (second > 0 && top / second > 8) return true;
  return false;
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

function getMatchReason(car) {
  const pools = {
    eco: [
      'Vos réponses révèlent un profil responsable et malin — ce modèle est parfaitement aligné.',
      'Économie, fiabilité, praticité — cette voiture est faite pour votre quotidien.'
    ],
    luxury: [
      'Vous recherchez confort et prestige — cette voiture transpire le raffinement à chaque détail.',
      'Votre profil révèle un goût pour l\'excellence — un choix élégant, assumé, sans compromis.'
    ],
    practical: [
      'Vous avez besoin d\'un allié du quotidien — polyvalent, fiable, pensé pour votre vie réelle.',
      'Praticité et sécurité guident votre choix — ce modèle les incarne avec conviction.'
    ],
    performance: [
      'Vous cherchez des sensations authentiques — ce modèle vous offrira des émotions à chaque sortie.',
      'Votre profil conducteur est affirmé — cette automobile a été conçue pour vous.'
    ]
  };
  const pool = pools[car.category] || ['Un choix d\'exception, parfaitement adapté à votre profil.'];
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
