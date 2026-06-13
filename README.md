# 🚗 AutoAssist — Car Advisor

> **L'Akinator des voitures.** Réponds à des questions sociales, l'algorithme devine la voiture de ta vie.

---

## C'est quoi ?

AutoAssist pose des questions comme un ami qui te connaît bien — pas des specs techniques ennuyeuses, mais des scénarios de la vraie vie :

- *"Tu vas chez les parents de ta fiancée pour la première fois. Tu gares quoi devant leur porte ?"*
- *"Ton père vient de changer de voiture. La tienne par rapport à la sienne ?"*
- *"Vendredi soir, la bande sort à Casablanca. Ton rôle ce soir-là ?"*

Après 7 questions max, l'algorithme te sort ton top 3 de voitures avec un score de correspondance.

---

## Stack

| Côté | Techno |
|------|--------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| Base de données | SQLite |
| Algorithme | Inférence bayésienne (sélection par entropie maximale) |
| Design | Dark theme `#0A0B0F`, gold `#E8B84B`, Syne + DM Sans |

---

## L'algorithme

Le moteur fonctionne comme Akinator :

1. **Prior uniforme** — toutes les voitures ont la même probabilité au départ
2. **Sélection par gain d'information** — à chaque tour, la question qui réduit le plus l'incertitude est choisie
3. **Mise à jour bayésienne** — chaque réponse met à jour les probabilités de toutes les voitures
4. **Arrêt intelligent** — quand une voiture dépasse 40% de probabilité ou après 7 questions

```
P(voiture | réponse) ∝ P(réponse | voiture) × P(voiture)
```

---

## Dataset

**155 voitures** issues de deux sources :

- **120 voitures internationales** — via CarQuery API (BMW, Mercedes, Audi, Toyota, Tesla...)
- **35 voitures du marché marocain** — dataset local (Dacia Sandero/Logan/Duster, Renault Clio/Symbol, Hyundai i10/Tucson, Kia Picanto/Sportage, Peugeot 208/2008, Citroën C3, Toyota Land Cruiser, BMW Série 3/5, Mercedes Classe C/E/GLE...)

---

## Lancer le projet

**Prérequis :** Node.js 18+

```bash
# Backend
cd backend
cp .env.example .env
npm install
npm run dev
# → http://localhost:3001

# Frontend (autre terminal)
cd frontend
cp .env.example .env
npm install
npm run dev
# → http://localhost:3000
```

---

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page avec canvas 3D et aperçu du quiz |
| `/quiz` | Quiz interactif Akinator-style |
| `/results` | Top 3 avec scores de correspondance |
| `/catalog` | Catalogue filtrable des 155 voitures |
| `/search` | Recherche par marque, budget, catégorie |
| `/compare` | Comparateur côte à côte |

---

## Structure

```
car-advisor/
├── backend/
│   ├── routes/          # cars, quiz, favorites
│   ├── services/
│   │   ├── quizEngine.js      # moteur bayésien + questions
│   │   ├── moroccanSeed.js    # dataset marocain
│   │   └── carqueryService.js # sync CarQuery API
│   ├── database.js
│   └── server.js
└── frontend/
    └── src/
        ├── components/  # Header, HeroCanvas, Cursor
        ├── pages/       # Landing, Quiz, Results, Catalog...
        └── hooks/
```

---

## Variables d'environnement

**backend/.env**
```
PORT=3001
DATABASE_PATH=./database/cars.db
FRONTEND_URL=http://localhost:3000
```

**frontend/.env**
```
VITE_API_URL=http://localhost:3001
```
