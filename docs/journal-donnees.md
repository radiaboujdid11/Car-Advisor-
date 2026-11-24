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
données peu fiables, contraire à l'objectif. **Aucun modèle n'a été ajouté** ; décision en
attente (voir les options dans la conversation de projet et la section suivante quand elle sera
tranchée).
