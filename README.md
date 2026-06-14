# AutoAssist — Conseiller automobile IA pour le marché marocain

**🔗 [car-advisor-omega.vercel.app](https://car-advisor-omega.vercel.app)**

Trouve ta prochaine voiture en répondant à 15–30 questions. Pas de hasard — un vrai moteur d'inférence bayésienne recalcule les probabilités après chaque réponse.

---

## Ce n'est pas du hasard — c'est des probabilités

Le système affiche **les probabilités bayésiennes en temps réel** pendant le quiz :

```
● Probabilités bayésiennes — mise à jour en direct

▲ Toyota Corolla     ████████████████  18.4%
  Dacia Sandero      ████████           8.1%
  Renault Clio       ██████             5.6%
  Hyundai i20        █████              4.2%
  Peugeot 208        ████               3.8%

P(voiture | réponses) ∝ P(voiture) × ∏ P(réponse | voiture) · Théorème de Bayes
```

Les barres s'animent après chaque réponse — preuve que c'est de la vraie math, pas de l'aléatoire.

---

## Comment fonctionne l'algorithme

### 1. Initialisation — prior uniforme
Toutes les voitures partent avec la même probabilité :
```
P(voiture) = 1 / 59  ≈  1.69%
```

### 2. Sélection de question par gain d'information maximum
Le système ne choisit pas les questions au hasard. Il calcule le **gain d'information** de chaque question et pose celle qui réduit le plus l'incertitude :
```
Gain(Q) = H(P) − Σ P(réponse_i) × H(P | réponse_i)
```
où `H` est l'entropie de Shannon. La question la plus discriminante est toujours choisie.

### 3. Mise à jour bayésienne après chaque réponse
```
P(voiture | réponse) =  P(voiture) × L(réponse | voiture)
                        ────────────────────────────────────
                          Σ P(voiture_k) × L(réponse | voiture_k)
```
`L(réponse | voiture)` est la vraisemblance : chaque réponse attribue un score différent selon le **prix**, la **catégorie**, la **marque**, la **puissance** ou les **émissions CO₂** de chaque voiture.

### 4. Critère d'arrêt intelligent
Le quiz s'arrête dès que :
- ✅ Minimum **15 questions** posées, **ET**
- La voiture de tête dépasse **60% de probabilité**, OU
- Le rapport probabilité top-1 / top-2 dépasse **8×**, OU
- Maximum **30 questions** atteint

### 5. Score de compatibilité
```
matchScore = min( round(52 + probabilité × 140) , 99 )
```

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Routing | React Router v6 |
| Moteur quiz | Bayesian engine — ES module pur |
| Données | 59 voitures marché marocain — array statique |
| Déploiement | Vercel free tier — 100% client-side static |

**Aucun backend. Aucune base de données. Aucun serveur.** Tout tourne dans le navigateur.

---

## Dataset — 59 voitures du marché marocain

| Catégorie | Modèles |
|-----------|---------|
| **Éco / Budget** (17) | Dacia Sandero, Logan, Kwid · Renault Clio, Symbol · Hyundai i10, i20 · Kia Picanto · Peugeot 208 · Citroën C3, C1 · Toyota Yaris, C-HR · VW Polo · BYD Seagull, Yuan Plus · Tesla Model 3, Model Y |
| **Pratique / Famille** (21) | Dacia Duster · Renault Mégane, Espace · Peugeot 2008, 308, 3008, 5008 · Citroën C4 · Toyota Corolla, RAV4, Land Cruiser · Hyundai Tucson, Creta · Kia Sportage · VW Golf · Seat Leon · Nissan Juke, Qashqai, X-Trail · Ford Focus, Galaxy |
| **Performance** (7) | VW Golf GTI · BMW M140i · Renault Mégane RS · Peugeot 308 GTi · Toyota GR86 · Nissan 370Z · Ford Mustang |
| **Luxe** (10) | Audi A3, A4 · BMW Série 3, Série 5, X5 · Mercedes Classe C, Classe E, GLE, GLC · Land Rover Range Rover Sport |

Prix : **8 500 €** (Dacia Sandero) → **194 444 €** (Range Rover Sport)

---

## Quiz — 71 questions adaptatives

| Bloc | Thème | Nb |
|------|-------|----|
| 1 | **Social marocain** — gendre, mariage, voisin, WhatsApp famille, ramadan, Instagram, station-service... | 15 |
| 2 | **Budget** — mensualité, carburant, entretien, valeur de revente, occasion/neuf... | 8 |
| 3 | **Usage** — trajet quotidien, routes du Maroc, km annuels, weekend, parking... | 8 |
| 4 | **Motorisation** — essence/hybride/électrique, puissance, boîte, accélération... | 7 |
| 5 | **Confort / Style / Famille** — suspension, insonorisation, tableau de bord, carrosserie, sécurité, marque... | 12 |
| 6 | **Fiabilité & Tech** — démarrage, freinage, direction, clim, sièges, GPS, caméra recul... | 21 |

Le système ne pose **jamais** les 71 questions — il sélectionne dynamiquement les plus informatives à chaque étape.

---

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page avec canvas 3D animé |
| `/quiz` | Quiz adaptatif avec panel de probabilités en direct |
| `/results` | Top 3 avec score de compatibilité et raison |
| `/cars` | Catalogue filtrable (marque, catégorie, budget) |
| `/cars/:id` | Fiche détaillée + voitures similaires |
| `/compare` | Comparateur côte à côte |

---

## Lancer en local

```bash
cd frontend
npm install
npm run dev      # → http://localhost:3000
```

```bash
npm run build    # build de production
npm run preview  # → http://localhost:4173
```

---

## Palette de couleurs

| Couleur | Hex | Usage |
|---------|-----|-------|
| Midnight Black | `#0D0D0D` | Fond |
| Champagne Gold | `#C9A84C` | Accent / highlights |
| Ivory Cream | `#F5F0E8` | Texte |

---

## Déploiement

Hébergé sur **Vercel**. Chaque `git push` sur `master` redéploie automatiquement en ~1 minute.

**Live :** [car-advisor-omega.vercel.app](https://car-advisor-omega.vercel.app)
