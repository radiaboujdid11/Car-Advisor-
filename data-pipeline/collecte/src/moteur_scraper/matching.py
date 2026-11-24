"""Table de correspondance : modèle du catalogue <-> page modèle sur moteur.ma.

Le script PROPOSE les rapprochements ; la personne qui maintient le catalogue VALIDE les cas
ambigus en éditant correspondances.csv (colonne `statut`). Ses décisions sont conservées
d'un lancement à l'autre.

Statuts :
  auto         noms identiques une fois simplifiés -> utilisé pour la collecte
  a_verifier   nom ressemblant (proposition)        -> ignoré tant qu'il n'est pas validé
  valide       confirmé à la main                    -> utilisé pour la collecte
  rejete       proposition refusée à la main         -> ignoré
  introuvable  aucune page modèle ressemblante       -> ignoré (non vérifiable)
"""

from __future__ import annotations

import re
from difflib import SequenceMatcher
from pathlib import Path

import pandas as pd

from .crawl import SitemapEntry
from .normalize import norm

COLUMNS = ["marque", "modele", "url_moteur", "statut", "score", "commentaire"]
USABLE = {"auto", "valide"}
MANUAL = {"valide", "rejete"}
MODEL_URL = re.compile(r"/fr/neuf/voiture/([^/]+)/([^/]+)/?$")
FUZZY_MIN = 0.6

# Noms de marque différents entre le catalogue et le site.
BRAND_ALIASES = {"mercedes": "mercedes-benz"}


def slugify(text: object) -> str:
    """« Série 3 » -> « serie-3 » (règle des adresses du site)."""
    return re.sub(r"[^a-z0-9]+", "-", norm(text)).strip("-")


def model_pages(entries: list[SitemapEntry]) -> pd.DataFrame:
    """Pages modèles (voitures neuves) du plan du site : marque, modèle, URL."""
    rows = []
    for entry in entries:
        match = MODEL_URL.search(entry.loc)
        if match:
            rows.append({"brand": match.group(1), "model": match.group(2), "url": entry.loc})
    return pd.DataFrame(rows, columns=["brand", "model", "url"]).drop_duplicates("url")


def catalog_models(catalog: list[dict]) -> pd.DataFrame:
    """Une ligne par (marque, modèle) du catalogue."""
    df = pd.DataFrame(catalog)[["make", "model"]].drop_duplicates()
    return df.rename(columns={"make": "marque", "model": "modele"}).reset_index(drop=True)


def _brand_slug(make: str) -> str:
    slug = slugify(make)
    return BRAND_ALIASES.get(slug, slug)


def suggest(marque: str, modele: str, pages: pd.DataFrame) -> dict:
    """Meilleure page modèle pour un modèle du catalogue."""
    brand = _brand_slug(marque)
    model = slugify(modele)
    same_brand = pages[pages["brand"] == brand]
    exact = same_brand[same_brand["model"] == model]
    if len(exact):
        return {"url_moteur": exact.iloc[0]["url"], "statut": "auto", "score": 1.0}
    best_url, best_score = None, 0.0
    for row in same_brand.itertuples():
        score = SequenceMatcher(None, model, row.model).ratio()
        # « mustang-mach-e » contient « mach-e » : bonus d'inclusion.
        if model and (model in row.model or row.model in model):
            score = max(score, 0.8)
        if score > best_score:
            best_url, best_score = row.url, score
    if best_url and best_score >= FUZZY_MIN:
        return {"url_moteur": best_url, "statut": "a_verifier", "score": round(best_score, 2)}
    return {"url_moteur": None, "statut": "introuvable", "score": round(best_score, 2)}


def build_table(
    catalog: list[dict], pages: pd.DataFrame, existing: pd.DataFrame | None = None
) -> pd.DataFrame:
    """Nouvelle table de correspondance ; les décisions manuelles existantes sont conservées."""
    kept = {}
    if existing is not None and not existing.empty:
        for row in existing.to_dict("records"):
            if row.get("statut") in MANUAL:
                kept[(row["marque"], row["modele"])] = row
    rows = []
    for item in catalog_models(catalog).to_dict("records"):
        key = (item["marque"], item["modele"])
        if key in kept:
            rows.append({col: kept[key].get(col) for col in COLUMNS})
        else:
            rows.append(
                {**item, **suggest(item["marque"], item["modele"], pages), "commentaire": ""}
            )
    table = pd.DataFrame(rows, columns=COLUMNS)
    return table.sort_values(["marque", "modele"], key=lambda s: s.map(norm)).reset_index(drop=True)


def read_table(path: Path) -> pd.DataFrame | None:
    if not path.exists():
        return None
    return pd.read_csv(path, dtype={"commentaire": str}, keep_default_na=False).replace({"": None})


def write_table(table: pd.DataFrame, path: Path) -> None:
    table.to_csv(path, index=False, lineterminator="\n")


def usable(table: pd.DataFrame) -> pd.DataFrame:
    """Lignes utilisables pour la collecte (statut auto ou valide, URL présente)."""
    return table[table["statut"].isin(USABLE) & table["url_moteur"].notna()]


def summary(table: pd.DataFrame) -> dict[str, int]:
    return table["statut"].value_counts().to_dict()
