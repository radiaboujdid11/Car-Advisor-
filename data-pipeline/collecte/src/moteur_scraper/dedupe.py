"""Garanties d'unicité : aucune fiche ni version comptée deux fois.

Trois niveaux :
1. avant le téléchargement : une seule URL par identifiant de fiche (source_id) ;
2. après la lecture : une seule version par source_id, puis par
   (marque, modèle, version, année) — la plus récente est gardée ;
3. avant l'écriture : contrôle final, qui lève une erreur si une clé n'est pas unique.
"""

from __future__ import annotations

import pandas as pd

from .crawl import SitemapEntry
from .normalize import norm
from .parse import source_id_from_url

VERSION_KEY = ["_marque", "_modele", "_version", "annee"]


class DuplicateKeyError(ValueError):
    """Une clé censée être unique apparaît plusieurs fois : on refuse d'écrire."""


def dedupe_entries(entries: list[SitemapEntry]) -> tuple[list[SitemapEntry], int]:
    """Une entrée par fiche (source_id, ou URL à défaut), la plus récemment modifiée.

    L'ordre d'origine est conservé (position de la première apparition).
    Renvoie (entrées uniques, nombre d'entrées écartées).
    """
    best: dict[object, tuple[int, SitemapEntry]] = {}
    for position, entry in enumerate(entries):
        key = source_id_from_url(entry.loc) or entry.loc
        if key not in best:
            best[key] = (position, entry)
        elif (entry.lastmod or "") > (best[key][1].lastmod or ""):
            best[key] = (best[key][0], entry)
    unique = [entry for _, entry in sorted(best.values(), key=lambda pair: pair[0])]
    return unique, len(entries) - len(unique)


def dedupe_versions(versions: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Supprime les versions en double ; garde la plus récente (lastmod, puis date de collecte).

    Renvoie (versions uniques, versions écartées avec la colonne `raison`).
    """
    if versions.empty:
        return versions.copy(), versions.assign(raison=pd.Series(dtype=str))

    df = versions.copy()
    df["_marque"] = df["marque"].map(norm)
    df["_modele"] = df["modele"].map(norm)
    df["_version"] = df["version"].map(norm)
    # La plus récente d'abord : drop_duplicates(keep="first") la garde.
    df = df.sort_values(
        ["lastmod_sitemap", "date_collecte"], ascending=False, na_position="last", kind="stable"
    )

    by_id = df["source_id"].notna() & df.duplicated(subset=["source_id"], keep="first")
    removed_id = df[by_id].assign(raison="même identifiant de fiche (source_id)")
    df = df[~by_id]

    by_content = df.duplicated(subset=VERSION_KEY, keep="first")
    removed_content = df[by_content].assign(raison="même marque, modèle, version et année")
    df = df[~by_content]

    helpers = ["_marque", "_modele", "_version"]
    kept = df.drop(columns=helpers).sort_index()
    removed = pd.concat([removed_id, removed_content]).drop(columns=helpers)
    return kept, removed


def assert_unique(df: pd.DataFrame, columns: list[str], what: str) -> None:
    """Contrôle final avant écriture : lève DuplicateKeyError si `columns` n'est pas unique."""
    if df.empty:
        return
    keys = df[columns].dropna()
    duplicated = keys[keys.duplicated(keep=False)]
    if not duplicated.empty:
        sample = duplicated.drop_duplicates().head(5).to_dict("records")
        raise DuplicateKeyError(
            f"{what} : {len(duplicated)} lignes partagent une clé {columns} (ex. {sample}) ; "
            "écriture annulée"
        )
