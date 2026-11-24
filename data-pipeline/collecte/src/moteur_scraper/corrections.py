"""Corrections de prix : proposition (étape 4) puis application des lignes validées (étape 5).

Circuit semi-automatique :
1. `propose_corrections` : pour chaque modèle dont le prix sort de la fourchette de la source
   (±5 %), propose le prix de la version d'entrée ; le fichier corrections_proposees.csv est
   ensuite rempli À LA MAIN (colonnes accepter, source_retenue, url_preuve, commentaire).
2. `apply_corrections` : seules les lignes « accepter = oui » sont appliquées, avec leur source
   et leur date, dans data-pipeline/sources/verifications.json (lu par build-dataset.js).
"""

from __future__ import annotations

import json
from pathlib import Path

import pandas as pd

PROPOSAL_COLUMNS = [
    "carquery_id", "modele", "annee_catalogue", "prix_actuel_dh", "prix_propose_dh",
    "ecart_pct", "version_entree", "prix_max_source_dh", "page_partagee", "url_source",
    "date_collecte", "accepter", "source_retenue", "url_preuve", "commentaire",
]  # fmt: skip
DECISION_COLUMNS = ["accepter", "source_retenue", "url_preuve", "commentaire"]
YES = {"oui", "o", "yes", "y", "x"}
SOURCES = {"marque", "moteur.ma"}


class CorrectionError(ValueError):
    """Ligne acceptée mais incomplète : rien n'est appliqué tant qu'elle n'est pas corrigée."""


def propose_corrections(rows: pd.DataFrame, existing: pd.DataFrame | None = None) -> pd.DataFrame:
    """Lignes à vérifier : modèle retrouvé, prix hors de la fourchette source (±5 %).

    Les décisions déjà saisies sont conservées si le prix proposé n'a pas changé.
    """
    if rows.empty or "dans_la_fourchette" not in rows:
        return pd.DataFrame(columns=PROPOSAL_COLUMNS)
    todo = rows[rows["trouve"] & (rows["dans_la_fourchette"] == False)]  # noqa: E712
    todo = todo[todo["prix_source_min_dh"].notna()]
    proposals = pd.DataFrame(
        {
            "carquery_id": todo["carquery_id"],
            "modele": todo["modele"],
            "annee_catalogue": todo["annee_catalogue"],
            "prix_actuel_dh": todo["prix_catalogue_dh"],
            "prix_propose_dh": todo["prix_source_min_dh"].astype(int),
            "ecart_pct": todo["ecart_pct"],
            "version_entree": todo["version_entree"],
            "prix_max_source_dh": todo["prix_source_max_dh"],
            "page_partagee": todo["page_partagee"],
            "url_source": todo["url_source"],
            "date_collecte": todo["date_collecte"],
        }
    )
    for col in DECISION_COLUMNS:
        proposals[col] = ""
    if existing is not None and not existing.empty:
        previous = {
            (r["carquery_id"], int(r["prix_propose_dh"])): r for r in existing.to_dict("records")
        }
        for i, r in proposals.iterrows():
            old = previous.get((r["carquery_id"], int(r["prix_propose_dh"])))
            if old:
                for col in DECISION_COLUMNS:
                    proposals.at[i, col] = old.get(col) or ""
    order = proposals["ecart_pct"].abs().sort_values(ascending=False).index
    return proposals.loc[order, PROPOSAL_COLUMNS].reset_index(drop=True)


def read_csv(path: Path) -> pd.DataFrame | None:
    if not path.exists():
        return None
    return pd.read_csv(path, dtype=str, keep_default_na=False)


def write_csv(df: pd.DataFrame, path: Path) -> None:
    # Séparateur « ; » et BOM UTF-8 : le fichier s'ouvre correctement dans Excel en français.
    df.to_csv(path, index=False, sep=";", encoding="utf-8-sig", lineterminator="\n")


def read_proposals(path: Path) -> pd.DataFrame | None:
    if not path.exists():
        return None
    return pd.read_csv(path, sep=";", dtype=str, keep_default_na=False, encoding="utf-8-sig")


def accepted(proposals: pd.DataFrame) -> pd.DataFrame:
    return proposals[proposals["accepter"].str.strip().str.lower().isin(YES)]


def validate(rows: pd.DataFrame) -> list[str]:
    """Erreurs des lignes acceptées (source manquante, preuve manquante, prix invalide)."""
    errors = []
    for r in rows.to_dict("records"):
        label = f"{r['modele']} ({r['carquery_id']})"
        source = (r.get("source_retenue") or "").strip().lower()
        if source not in SOURCES:
            errors.append(f"{label} : source_retenue doit valoir « marque » ou « moteur.ma »")
        if source == "marque" and not (r.get("url_preuve") or "").startswith("http"):
            errors.append(f"{label} : url_preuve (page du site de la marque) obligatoire")
        try:
            if float(r["prix_propose_dh"]) <= 0:
                raise ValueError
        except (TypeError, ValueError):
            errors.append(f"{label} : prix_propose_dh invalide")
    return errors


def apply_corrections(proposals: pd.DataFrame, verifications: dict, today: str) -> dict:
    """Ajoute les lignes acceptées à `verifications` (clé : carquery_id). Lève CorrectionError."""
    rows = accepted(proposals)
    errors = validate(rows)
    if errors:
        raise CorrectionError("corrections non appliquées :\n- " + "\n- ".join(errors))
    updated = dict(verifications)
    for r in rows.to_dict("records"):
        source = r["source_retenue"].strip().lower()
        updated[r["carquery_id"]] = {
            "prix_dh": int(float(r["prix_propose_dh"])),
            "source": source,
            "url": (r.get("url_preuve") or "").strip() if source == "marque" else r["url_source"],
            "verifie_le": today,
            "modele": r["modele"],
            **({"commentaire": r["commentaire"].strip()} if r.get("commentaire") else {}),
        }
    return dict(sorted(updated.items()))


def read_verifications(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}


def write_verifications(verifications: dict, path: Path) -> None:
    path.write_text(
        json.dumps(verifications, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
