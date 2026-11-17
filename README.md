# AutoAssist — conseiller automobile bayésien pour le marché marocain

[![CI](https://github.com/radiaboujdid11/Car-Advisor-/actions/workflows/ci.yml/badge.svg)](https://github.com/radiaboujdid11/Car-Advisor-/actions/workflows/ci.yml)

**Démo en ligne : [car-advisor-omega.vercel.app](https://car-advisor-omega.vercel.app)**

AutoAssist recommande une voiture adaptée au marché marocain à partir d'un quiz adaptatif, parmi
**277 voitures** (197 modèles, déclinés par année). Les questions ne sont pas tirées au hasard :
un moteur d'inférence bayésienne choisit à chaque étape la question qui apporte le plus
d'information, puis met à jour la probabilité de chaque voiture après la réponse.

L'application est **100 % statique** : tout le calcul se fait dans le navigateur. Le jeu de
données est produit en amont par un petit pipeline Node.js (`data-pipeline/`).

<!--
Captures d'écran : décommenter ce bloc une fois les fichiers ajoutés dans docs/screenshots/.

![Accueil](docs/screenshots/accueil.png)

| Quiz                               | Résultats                                    |
| ---------------------------------- | -------------------------------------------- |
| ![Quiz](docs/screenshots/quiz.png) | ![Résultats](docs/screenshots/resultats.png) |
-->

---

## Sommaire

- [Stack technique](#stack-technique)
- [Structure du dépôt](#structure-du-dépôt)
- [Installation locale](#installation-locale)
- [Comment ça marche](#comment-ça-marche)
- [Données](#données)
- [Qualité et tests](#qualité-et-tests)
- [Licence](#licence)

## Stack technique

| Couche      | Outils                                                        |
| ----------- | ------------------------------------------------------------- |
| Interface   | React 18, React Router 6, Tailwind CSS (base) + styles inline |
| Build       | Vite 5 (pages chargées à la demande)                          |
| Moteur      | JavaScript pur, sans dépendance (`frontend/src/engine/`)      |
| Données     | Pipeline Node.js sans dépendance → module JS statique         |
| Qualité     | ESLint 9, Prettier, Vitest, `node:test`, GitHub Actions       |
| Hébergement | Vercel (site statique)                                        |

## Structure du dépôt

```
.
├── frontend/                  Application React (Vite)
│   ├── public/                Images et vidéo servies telles quelles
│   └── src/
│       ├── engine/
│       │   ├── quiz.js        Moteur bayésien (a priori, mise à jour, gain d'information, arrêt)
│       │   ├── questions.js   Banque de 71 questions et fonctions de vraisemblance
│       │   └── quiz.test.js   Tests unitaires du moteur (Vitest)
│       ├── data/cars.js       Jeu de données GÉNÉRÉ par data-pipeline/ (ne pas éditer)
│       ├── pages/             Accueil, Quiz, Résultats, Catalogue, Fiche, Comparateur
│       ├── components/        En-tête, curseur personnalisé
│       └── utils/format.js    Libellés de catégories, conversion € → DH
├── data-pipeline/             Construction du jeu de données
│   ├── sources/               Catalogues d'origine (Europe, Maroc) et corrections
│   ├── transform.js           Corrections, normalisation, dédoublonnage, validation
│   ├── build-dataset.js       Écrit frontend/src/data/cars.js
│   └── transform.test.js      Tests du pipeline (node:test)
├── docs/screenshots/          Captures d'écran utilisées dans ce README
├── .github/workflows/ci.yml   Lint, tests et build à chaque push
└── vercel.json                Configuration de déploiement
```

## Installation locale

Prérequis : **Node.js 18 ou plus récent** et npm.

```bash
git clone https://github.com/radiaboujdid11/Car-Advisor-.git
cd Car-Advisor-/frontend
npm install
npm run dev          # http://localhost:3000
```

Autres commandes (dans `frontend/`) :

| Commande           | Rôle                                                                          |
| ------------------ | ----------------------------------------------------------------------------- |
| `npm run build`    | Build de production dans `frontend/dist/`                                     |
| `npm run preview`  | Sert le build sur http://localhost:4173                                       |
| `npm test`         | Tests unitaires du moteur (Vitest)                                            |
| `npm run test:e2e` | Tests d'affichage Playwright (téléphone et ordinateur, après `npm run build`) |
| `npm run lint`     | Analyse ESLint                                                                |
| `npm run format`   | Formate tout le dépôt avec Prettier                                           |

## Comment ça marche

### 1. A priori uniforme

Au départ, aucune voiture n'est favorisée. Avec N = 277 voitures :

```
P(v) = 1 / N ≈ 0,36 %      pour chaque voiture v
```

### 2. Vraisemblance d'une réponse

Chaque réponse `r` de la banque de questions porte une fonction `L(r | v)` qui renvoie un score
entre 0 et 1 : « à quel point cette réponse est-elle typique d'un acheteur de la voiture v ? ».
Ces scores sont des **heuristiques définies à la main** à partir des caractéristiques de la voiture
(prix, catégorie, marque, puissance, émissions de CO₂). Ils ne sont pas appris sur des données
d'achat réelles.

Un plancher de 10⁻⁹ est appliqué : une seule réponse ne peut jamais éliminer définitivement une
voiture.

### 3. Mise à jour bayésienne

Après la réponse `r`, la probabilité de chaque voiture est recalculée avec le théorème de Bayes :

```
                 P(v) · L(r | v)
P(v | r) = ─────────────────────────
            Σₖ P(vₖ) · L(r | vₖ)
```

Le dénominateur normalise les probabilités pour qu'elles somment à 1. La probabilité a posteriori
devient l'a priori de la question suivante.

### 4. Choix de la question suivante : gain d'information

Parmi les questions pas encore posées, le moteur choisit celle qui réduit le plus l'incertitude,
mesurée par l'entropie de Shannon :

```
H(P)    = − Σᵥ P(v) · log₂ P(v)
Gain(Q) = H(P) − Σᵣ P(r) · H(P | r)        avec   P(r) = Σᵥ P(v) · L(r | v)
```

`P(r)` est la probabilité que l'utilisateur donne la réponse `r`, selon les croyances actuelles.
La question retenue est celle dont la réponse, quelle qu'elle soit, laisse en moyenne la
distribution la plus « concentrée ».

### Exemple chiffré

Prenons trois voitures du jeu de données, avec un a priori uniforme de 1/3, et la question
`social_gendre` : _« Tu vas chez les parents de ta fiancée pour la première fois. Quelle voiture
tu gares devant leur porte ? »_. L'utilisateur répond _« Une berline allemande — discrète mais qui
parle »_. Cette réponse a pour vraisemblance 1,0 pour le luxe, 0,12 pour une voiture pratique et
0,15 (valeur par défaut) pour une voiture économique.

| Voiture (catégorie)        | P(v) | L(r \| v) | P(v) · L(r \| v) | P(v \| r)  |
| -------------------------- | ---- | --------- | ---------------- | ---------- |
| BMW Série 3 (luxe)         | 1/3  | 1,00      | 0,3333           | **78,7 %** |
| Dacia Duster (pratique)    | 1/3  | 0,12      | 0,0400           | 9,4 %      |
| Dacia Sandero (économique) | 1/3  | 0,15      | 0,0500           | 11,8 %     |
| **Somme**                  | 1    |           | **0,4233**       | 100 %      |

L'entropie passe de log₂ 3 ≈ 1,585 bit à 0,957 bit : une seule réponse a nettement réduit
l'incertitude. Ces valeurs sont calculées avec les vraies fonctions du moteur.

### 5. Arrêt du quiz

Côté moteur (`isDone`), le quiz est terminé lorsque :

- au moins **15 questions** ont été posées, **et**
- la voiture de tête dépasse **60 %** de probabilité, **ou** elle est **8 fois** plus probable
  que la deuxième, **ou** **30 questions** ont été posées.

Déroulé dans l'interface :

1. après **15 réponses**, une proposition intermédiaire (top 3) est affichée ; l'utilisateur
   peut exclure une voiture qui ne lui convient pas ;
2. il accepte le résultat, ou choisit d'**affiner avec 10 questions supplémentaires au plus** :
   l'affinage s'arrête plus tôt si le critère du moteur ci-dessus est atteint.

Le quiz compte donc entre **15 et 25 questions**.

### 6. Score de compatibilité

Le pourcentage affiché sur les résultats est une transformation de la probabilité a posteriori,
plafonnée à 99 % :

```
score = min( round(52 + 140 × P(v | réponses)), 99 )
```

C'est une valeur d'affichage, pas une probabilité.

### Performance

Les vraisemblances de chaque question sont calculées une seule fois puis mises en cache. Le choix
d'une question (71 questions × environ 4 réponses × 277 voitures) prend en moyenne **1,5 ms**,
contre 7,5 ms avant l'optimisation, avec des résultats identiques (mesures sous Node.js sur
300 parcours de 30 questions).

## Données

### Contenu

`frontend/src/data/cars.js` contient **277 voitures (197 modèles) de 25 marques**, réparties en 4 catégories
(économique 82, luxe 80, pratique 68, performance 47). Chaque fiche comporte : marque, modèle,
année (2020 à 2025), prix, puissance, consommation, émissions de CO₂, catégorie, description et,
pour 103 d'entre elles, une photo.

Les prix sont stockés en euros et affichés en dirhams avec un taux fixe de **10,8 MAD pour 1 €**
(`frontend/src/utils/format.js`).

### Sources

Le jeu de données est assemblé à partir de deux catalogues saisis manuellement dans
`data-pipeline/sources/` :

| Fichier             | Contenu                                                                                                                                                                                       |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sources/maroc.js`  | 175 voitures du marché marocain (identifiants `ma_…`). Prix convertis depuis les dirhams (MAD / 10,8), dont une série corrigée d'après les tarifs officiels Maroc 2025 (`PRICE_CORRECTIONS`). |
| `sources/europe.js` | 60 modèles avec un prix 2023 et un prix 2024 en euros, soit 120 voitures.                                                                                                                     |

Les photos sont des liens vers les images de modèles publiées sur
[moteur.ma](https://www.moteur.ma).

> **Limite connue :** les prix et les fiches techniques ont été relevés manuellement ; la source
> exacte de chaque valeur n'est pas tracée dans le dépôt. Le jeu de données sert à illustrer le
> moteur de recommandation et ne remplace pas un tarif officiel de concessionnaire.

### Date de collecte

Les fiches ont été saisies entre le **21 mai et le 3 juillet 2026** (champ `created_at` de chaque
voiture). Les prix reflètent les tarifs connus à cette période et peuvent avoir changé depuis.

### Traitements appliqués par le pipeline

1. **Chargement** des deux catalogues (295 lignes) ;
2. **corrections** : prix mis à jour, photos ajoutées quand elles manquent ;
3. **normalisation** des marques (« Mercedes » → « Mercedes-Benz ») ;
4. **dédoublonnage** sur (marque, modèle, année) : 18 doublons supprimés, la fiche du catalogue
   marocain est conservée ;
5. **identifiants stables** : une voiture garde son identifiant, donc son URL `/cars/:id`,
   d'une génération à l'autre ;
6. **validation** (identifiant unique, prix et puissance positifs, catégorie connue) : le build
   échoue en cas d'erreur.

### Mettre à jour la liste de voitures

```bash
cd data-pipeline
# 1. Modifier sources/maroc.js (ou sources/europe.js) :
#    ajouter une voiture, corriger un prix dans PRICE_CORRECTIONS, une photo dans PHOTO_CORRECTIONS
npm run check   # 2. Rapport (doublons, effectifs par catégorie, erreurs) sans rien écrire
npm run build   # 3. Régénère frontend/src/data/cars.js
npm test        # 4. Tests du pipeline
cd ../frontend && npm test   # 5. Vérifie que le moteur fonctionne avec les nouvelles données
```

Une nouvelle voiture doit avoir un `carquery_id` unique (préfixe `ma_` pour le marché marocain),
une `category` parmi `eco`, `practical`, `performance`, `luxury`, et un prix en euros.

## Qualité et tests

- **15 tests Vitest** sur le moteur (`frontend/src/engine/quiz.test.js`) : vraisemblances
  comprises entre 0 et 1, probabilités qui somment à 1, réponse cohérente qui augmente la
  probabilité attendue, seuils d'arrêt (15 questions, 60 %, ratio 8, limite de 30), absence de
  question répétée, robustesse des réponses « je ne sais pas » / « peu importe ».
- **6 tests `node:test`** sur les transformations du pipeline de données.
- **GitHub Actions** : à chaque push, lint ESLint, vérification Prettier, tests, build du
  frontend et validation du jeu de données.

> Les réponses « Je ne sais pas » ou « Peu importe » ne sont pas neutres : ce sont des réponses
> comme les autres, avec leurs propres vraisemblances (par exemple, ne pas connaître son budget
> d'entretien oriente légèrement vers les voitures économiques et pratiques).

## Licence

Distribué sous licence [MIT](LICENSE).
