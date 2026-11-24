# Journal des données

Décisions, sources et constats sur le catalogue de voitures, dans l'ordre chronologique.
Objectif : que chaque donnée publiée sur le site soit **juste, datée et traçable**.

## 2026-11-24 — Choix de la stratégie de fiabilité

Trois options étudiées pour fiabiliser les prix :

| Option | Description                                                                             | Décision                                       |
| ------ | --------------------------------------------------------------------------------------- | ---------------------------------------------- |
| A      | Mise à jour à la main en consultant un site                                             | Écartée : longue, sans contrôle ni traçabilité |
| **B**  | **Collecte comme contrôle qualité** : la machine repère les écarts, une personne valide | **Retenue**                                    |
| C      | Collecte intégrée au pipeline, publication automatique                                  | Reportée : exige l'accord écrit de moteur.ma   |

Paramètres retenus pour B : corrections **semi-automatiques** (validation ligne par ligne), prix
de la **version d'entrée**, contrôle **mensuel**. Voir la section « Contrôle qualité des prix »
du README pour la procédure.

### Contraintes de la source moteur.ma

- `robots.txt` : exploration autorisée, sauf `/storage/` (images) ; délai de 10 s demandé à
  plusieurs robots.
- Conditions d'utilisation : « Les contenus, […] images, bases de données […] sont protégés […].
  Toute reproduction ou utilisation non autorisée est interdite. »
- Conséquence : les données collectées restent **en local** ; seuls des prix ponctuels, validés à
  la main, sont publiés, de préférence vérifiés sur le site de la marque.
- Le site **ne fournit pas le CO₂** (0 % de remplissage sur l'échantillon).

## 2026-11-24 — Table de correspondance (197 modèles du catalogue)

- 150 correspondances automatiques (noms identiques une fois simplifiés).
- 26 cas ambigus tranchés : 11 validés, 15 rejetés. Chaque ligne de
  `data-pipeline/collecte/correspondances.csv` porte sa justification.
- 21 modèles introuvables sur le site (dont toute la gamme Lamborghini, absente du site).
- Règle : une variante (hybride, sportive) sans page dédiée est **rejetée** tant qu'un filtre par
  énergie ou par version n'existe pas, car le « prix d'entrée » de la page commune serait celui
  d'une autre version.

## 2026-11-24 — Modèles absents du catalogue (option A + B)

Le plan du site de moteur.ma liste **557 pages modèles** ; le catalogue en couvre 161, il en
manque **396** (72 marques). Une partie correspond à des modèles qui ne sont plus vendus.

**Décision :** ne pas importer ces modèles depuis moteur.ma sans accord (conditions
d'utilisation) ; envoyer une demande d'autorisation (voir `demande-autorisation-moteur-ma.md`)
et, en attendant, n'ajouter que des modèles dont les données proviennent d'une source citable.

### Sélection proposée (25 voitures particulières)

Critères : marques en tête des ventes en 2026 (Dacia, Renault, Fiat, Hyundai, Toyota) et marques
chinoises en forte croissance (BYD, MG, Chery), modèles dont la page a été mise à jour en
novembre 2026 sur moteur.ma (indice de commercialisation actuelle), hors utilitaires.

Renault Express, Kardian, Austral, Arkana · Dacia Bigster · Fiat Grizzly · Hyundai Bayon ·
Toyota Yaris Cross · Kia Seltos, Sonet, Sorento · MG ZS, MG3, HS · Chery Tiggo 4 Pro, Tiggo 7 Pro,
Tiggo 8 Pro · GWM Haval Jolion, Haval H6 · Suzuki Swift · Skoda Octavia · Volkswagen T-Roc ·
Opel Corsa · Citroën C3 Aircross · Peugeot 408.

Sources sur les ventes (aucune ne donne le classement complet des modèles en 2026) :
[Telquel, 1er trimestre 2026](https://telquel.ma/sponsors/ventes-auto-premier-trimestre-record-les-chinoises-franchissent-les10_1986238),
[Le Matin, octobre 2026](https://lematin.ma/automobile/le-marche-automobile-marocain-affiche-une-croissance-de-3-en-octobre-2026/374072),
[Hespress, bilan 2025](https://fr.hespress.com/458413-marche-automobile-une-annee-2025-record-portee-par-la-reprise-de-la-demande.html),
[Medias24, juin 2026](https://medias24.com/2026/06/03/marques-chinoises-vehicules-electrifies-le-marche-automobile-franchit-le-cap-des-100-000-ventes-en-cinq-mois-1690887/).

### Constat sur les sources de prix (recherche du 2026-11-24, 4 marques testées)

| Modèle                    | Ce qui a été trouvé                                                                                                                                       | Problème                        |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Renault Kardian           | 179 000 – 205 000 DH ([Telquel, déc. 2024](https://telquel.ma/2024/12/06/renault-kardian-un-suv-compact-made-in-morocco-a-prix-choc_1908029))             | prix de lancement, daté de 2024 |
| Renault Austral, Arkana   | aucun prix attribuable                                                                                                                                    | —                               |
| Chery Tiggo 7 Pro         | 309 000 DH ([Telquel, sept. 2025](https://telquel.ma/2025/09/08/chery-lelectrique-et-lhybride-a-portee-de-budget_1949258)) ; 299 000 DH sur un site tiers | sources divergentes             |
| Chery Tiggo 8 Pro         | 369 000 DH (Telquel) ; 359 000 DH sur un site tiers                                                                                                       | sources divergentes             |
| MG HS Hybrid+             | à partir de 269 000 DH (communiqué MG Motor du 20/11/2025, cité par la presse)                                                                            | daté de 2025                    |
| MG ZS EV                  | de 231 750 à 510 000 DH selon les sources                                                                                                                 | écart inexpliqué                |
| MG3                       | aucun prix neuf trouvé                                                                                                                                    | —                               |
| Kia Seltos                | 296 900 DH (site tiers) ; 354 000 DH en promotion (autre site tiers)                                                                                      | sources divergentes             |
| Kia Sorento               | 515 000 DH « selon Kia Maroc » (site tiers) ; 279 900 – 309 900 DH (autre site tiers)                                                                     | écart très important            |
| Kia (brochure officielle) | [brochure tarifs 2021](<https://kia.com/content/dam/kwcms/ma/fr/pdf/2021/nov/_21-0029-Brochure_tarifs_KIA(11_Oct).pdf>)                                   | obsolète                        |

**Conclusion :** les sites officiels des marques au Maroc ne publient généralement pas de prix
accessibles ; les sources tierces se contredisent. Saisir ces modèles maintenant produirait des
données peu fiables, contraire à l'objectif. **Aucun modèle n'a été ajouté** à ce stade ; voir
la décision ci-dessous.

## 2026-11-24 — Ajouts sourcés par la presse : 9 modèles retenus sur 25

**Décision :** utiliser la presse, **seulement quand le prix est sourcé et daté**. La fiche
affiche « Prix de lancement annoncé le … · source : [journal] » avec le lien de l'article. Les
modèles sans source fiable ne sont pas ajoutés.

### Règles appliquées

1. Prix retenu seulement s'il figure explicitement dans un **article de presse** avec sa date de
   publication et l'annonceur (marque ou importateur). Les comparateurs de prix (moteur.ma,
   wandaloo) ne comptent pas comme presse.
2. Chaque article a été **lu en entier** (pas seulement le résumé d'un moteur de recherche). Un
   site qui refuse la lecture automatique (erreur 403 : Telquel, Medias24) ne compte pas tant
   qu'une autre source lisible ne confirme pas.
3. La **puissance** doit venir d'un article ; sans prix ou sans puissance, pas d'ajout.
4. Consommation et CO₂ : repris de l'article s'ils y figurent, sinon **laissés vides** (affichés
   « — » sur le site, ignorés par le comparateur).
5. Articles **antérieurs au 1er janvier 2024 écartés** (contrôle automatique au build).
6. Deux articles qui **se contredisent** sur le prix d'entrée : modèle écarté.
7. Descriptions **rédigées pour le projet**, jamais copiées.
8. Catégorie du quiz : citadine → `eco` ; SUV ou modèle familial → `practical`.

Mise en œuvre : `data-pipeline/sources/ajouts-presse.json` → `fromPressAdditions` (validation
des règles 1, 3, 4 et 5) → `cars.js` (champ `price_launch_at`). Si le contrôle qualité vérifie
plus tard un prix, ce prix vérifié remplace le prix de lancement.

### Modèles ajoutés

| Modèle              | Prix d'entrée | Version                       | Article                                                                                                                                | Confirmé par                                                                                                                 |
| ------------------- | ------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Renault Austral     | 342 000 DH    | E-Tech full hybrid 200 Techno | [Le Matin, 14/10/2025](https://lematin.ma/automobile/renault-austral-e-tech-200-ch-le-suv-hybride-de-renault-arrive-au-maroc/307577)   | —                                                                                                                            |
| Dacia Bigster       | 264 500 DH    | 1.5 dCi 115, BVM              | [Le Matin, 13/05/2025](https://lematin.ma/automobile/dacia-commercialise-son-c-suv-bigster-au-maroc/279323)                            | [Hespress, 15/05/2025](https://fr.hespress.com/424254-dacia-maroc-lance-la-commercialisation-du-bigster-dacia-en-grand.html) |
| MG HS Hybrid+       | 269 000 DH    | Hybrid+ 224 ch                | [Le Matin, 25/11/2025](https://lematin.ma/automobile/mg-motor-lance-le-nouveau-hs-hybrid-au-maroc/315501)                              | —                                                                                                                            |
| MG ZS Hybrid+       | 259 000 DH    | Hybrid+ 197 ch                | [Le Matin, 22/07/2025](https://lematin.ma/automobile/mg-zs-full-hybrid-le-suv-compact-hybride-qui-muscle-le-jeu-au-maroc/292628)       | —                                                                                                                            |
| MG MG3 Hybrid+      | 189 000 DH    | Drive, 195 ch                 | [Le Matin, 18/02/2025](https://lematin.ma/automobile/la-nouvelle-mg3-hybrid-officiellement-lancee-au-maroc/264841)                     | —                                                                                                                            |
| Peugeot 408         | 317 000 DH    | 1.2 Hybrid 145 Allure         | [Le Matin, 22/05/2025](https://lematin.ma/automobile/peugeot-408-une-nouvelle-silhouette-pour-bousculer-le-segment-c-au-maroc/281220)  | —                                                                                                                            |
| Suzuki Swift        | 189 000 DH    | 1.2 hybride léger 82 ch CVT   | [Le Matin, 26/02/2025](https://lematin.ma/automobile/la-nouvelle-suzuki-swift-hybride-disponible-en-precommande-au-maroc/266050)       | [Challenge, 22/02/2025](https://www.challenge.ma/suzuki-swift-hybride-cfao-lance-les-pre-commandes-au-maroc-297153/)         |
| Renault Kardian     | 179 000 DH    | 1.5 dCi 102, BVM5             | [Le Matin, 19/11/2024](https://lematin.ma/automobile/renault-kardian-le-suv-compact-made-in-morocco-pret-a-conquerir-le-marche/251980) | [Challenge, 13/11/2024](https://www.challenge.ma/renault-kardian-tarifs-motorisations-versions-voici-les-infos-cles-291209/) |
| Citroën C3 Aircross | 234 900 DH    | Hybrid 145 e-DCT              | [Le Matin, 28/10/2025](https://lematin.ma/automobile/citroen-c3-aircross-un-nouveau-souffle-pour-le-suv-familial/310374)               | —                                                                                                                            |

Remarques : le prix de la Swift est un prix de précommande TTC ; l'article sur la 408 cite
145 ch en chapeau et « Hybrid 136 » dans le texte (145 ch retenu, cohérent avec la boîte
e-DCS6) ; le Bigster a ensuite bénéficié d'une baisse de prix selon la presse (non vérifiée ici,
le prix affiché reste celui du lancement, daté).

### Modèles écartés

| Modèle                                 | Raison                                                                                                                                                                                    |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Renault Express                        | lancement de 2021 (règle 5)                                                                                                                                                               |
| Renault Arkana                         | lancement de juin 2023 (règle 5) ; restylage 2024 sans prix publié                                                                                                                        |
| Hyundai Bayon                          | article de juin 2023 (règle 5)                                                                                                                                                            |
| Chery Tiggo 4 Pro                      | lancement de 2022 (règle 5)                                                                                                                                                               |
| Chery Tiggo 7 Pro / Tiggo 8 Pro (PHEV) | prix confirmés (309 000 et 369 000 DH, Le Matin et Challenge, sept. 2025) mais puissance absente des articles lisibles ; l'article Telquel qui la donne refuse la lecture (règles 2 et 3) |
| Volkswagen T-Roc                       | Hespress (20/05/2026) : 359 000 DH ; Le Matin (12/06/2026) : 389 000 DH ; contradiction (règle 6)                                                                                         |
| GWM Haval Jolion                       | seulement « moins de 300 000 DH » (Le Matin, juillet 2024) : pas de prix précis                                                                                                           |
| GWM Haval H6                           | seul le prix de la version haut de gamme est cité                                                                                                                                         |
| Fiat Grizzly                           | prix trouvés uniquement sur des comparateurs (règle 1)                                                                                                                                    |
| Skoda Octavia                          | prix trouvé uniquement sur un comparateur (règle 1)                                                                                                                                       |
| Toyota Yaris Cross                     | restylage 2026 annoncé sans prix                                                                                                                                                          |
| Kia Seltos, Sonet, Sorento             | aucun article de presse depuis 2024 avec un prix (Sonet : article de 2022)                                                                                                                |
| Opel Corsa                             | seul article trouvé (Telquel, janv. 2024) illisible (403) ; l'autre article mêle prix public et promotion                                                                                 |
| MG ZS EV (ancien)                      | remplacé dans la sélection par le ZS Hybrid+, seul à avoir un article daté                                                                                                                |

Repéré mais hors sélection initiale : Chery Tiggo 4 Cross HEV (229 000 DH, 211 ch, Le Matin
22/09/2025). Il pourra être ajouté si la sélection est élargie.

## 2026-11-24 — Première collecte complète et 21 prix vérifiés

Collecte ciblée terminée : **672 versions** (154 modèles) lues en 445 requêtes, 6 versions en
double écartées. Un délai dépassé de moteur.ma avait arrêté une première tentative à la fiche
232 ; le collecteur réessaie désormais 3 fois puis ignore la page.

| Mesure                               | Valeur           |
| ------------------------------------ | ---------------- |
| Modèles du catalogue retrouvés       | 158 / 206 (77 %) |
| …dont prix dans la fourchette (±5 %) | 121 (77 %)       |
| Écart de prix médian                 | 0 %              |
| Corrections proposées                | 35               |
| Corrections acceptées / refusées     | 21 / 14          |

Règle de décision (pré-remplie par Claude, validée par l'auteure) : accepter quand la page est à
jour et porte sur le même modèle, la même génération et la même énergie ; refuser quand la page est
périmée (modèle plus vendu : EcoSport, C1, Mustang, Passat, Punto), partagée entre deux fiches
(GLC), incohérente (RS Q8) ou quand la version la moins chère n'est pas une entrée de gamme
comparable (Mégane E-Tech, Junior électrique, Macan électrique, 5008 GT seule, Série 4 cabriolet,
Classe S hybride rechargeable). La justification de chaque ligne est dans la colonne
`commentaire` du fichier local `corrections_proposees.csv`.

Les 21 prix acceptés sont publiés avec la mention « Prix vérifié le 24 novembre 2026 · source :
moteur.ma » et un lien vers la page du modèle (`sources/verifications.json`). Points ouverts : la
puissance du Nissan X-Trail (ancienne génération au catalogue) et les modèles refusés comme « plus
vendus », à retirer ou à marquer dans le catalogue.
