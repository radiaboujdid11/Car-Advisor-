"""Normalisation des fiches, agrégation par modèle (pandas) et règle de catégorie."""

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass

import pandas as pd


def to_number(text: object) -> float | None:
    """« 480 000 Dhs » -> 480000 ; « 6,5 L/100km » -> 6.5 ; « - » ou vide -> None."""
    if text is None:
        return None
    compact = re.sub(r"[\s  ]", "", str(text))
    match = re.search(r"-?\d+(?:[.,]\d+)?", compact)
    if not match:
        return None
    value = float(match.group(0).replace(",", "."))
    return int(value) if value.is_integer() else value


def norm(text: object) -> str:
    """Minuscules, sans accents ni espaces superflus."""
    decomposed = unicodedata.normalize("NFD", str(text or "").lower())
    return re.sub(
        r"\s+", " ", "".join(c for c in decomposed if not unicodedata.combining(c))
    ).strip()


def energie(motorisation: object, propulsion: object) -> str | None:
    """Énergie normalisée à partir de « Motorisation » et « Propulsion »."""
    m, p = norm(motorisation), norm(propulsion)
    if p == "bev" or "electrique" in m:
        return "electrique"
    if p == "phev" or re.search(r"rechargeable|plug", m):
        return "hybride_rechargeable"
    if re.search(r"hev", p) or "hybride" in m:
        return "hybride"
    if "diesel" in m:
        return "diesel"
    if "essence" in m:
        return "essence"
    return f"autre:{m}" if m else None


def model_url(source_url: object) -> str | None:
    """Page modèle d'une fiche : …/marque/modele/fiche-1234.html -> …/marque/modele/."""
    if not source_url or "/" not in str(source_url):
        return None
    return str(source_url).rsplit("/", 1)[0] + "/"


def normalize_version(
    raw: dict, collected_at: str | None = None, lastmod: str | None = None
) -> dict:
    """Fiche brute -> version normalisée (nombres, énergie, métadonnées de collecte)."""
    return {
        "source_id": raw.get("source_id"),
        "source_url": raw.get("source_url"),
        "url_modele": model_url(raw.get("source_url")),
        "marque": (raw.get("marque") or "").strip() or None,
        "modele": (raw.get("modele") or "").strip() or None,
        "version": (raw.get("version") or "").strip() or None,
        "annee": to_number(raw.get("annee")),
        "energie": energie(raw.get("motorisation"), raw.get("propulsion")),
        "transmission": raw.get("transmission"),
        "carrosserie": raw.get("carrosserie"),
        "portes": to_number(raw.get("portes")),
        "places": to_number(raw.get("places")),
        "prix_showroom_dh": to_number(raw.get("prix_showroom")),
        "prix_cle_en_main_dh": to_number(raw.get("prix_cle_en_main")),
        "puissance_ch": to_number(raw.get("puissance")),
        "consommation_l100km": to_number(raw.get("consommation_mixte")),
        "co2_g_km": to_number(raw.get("co2")),
        "autonomie_km": to_number(raw.get("autonomie_electrique")),
        "batterie_kwh": to_number(raw.get("batterie")),
        "volume_coffre_l": to_number(raw.get("volume_coffre")),
        "date_collecte": collected_at,
        "lastmod_sitemap": lastmod,
    }


# ─── Catégorie : règle explicite, seuils modifiables ──────────────────────────
# moteur.ma ne fournit pas les catégories du quiz : on les déduit. Les seuils sont des
# hypothèses de départ ; le rapport mesure leur accord avec le catalogue actuel.


@dataclass(frozen=True)
class CategoryRules:
    performance_min_ch: int = 300
    sport_bodies: str = r"coupe|cabriolet|roadster|sport"
    luxury_min_price_dh: int = 600_000
    eco_max_price_dh: int = 200_000


DEFAULT_RULES = CategoryRules()


def categorie(model: dict, rules: CategoryRules = DEFAULT_RULES) -> str:
    body = norm(model.get("carrosserie"))
    if (model.get("puissance_max_ch") or 0) >= rules.performance_min_ch or re.search(
        rules.sport_bodies, body
    ):
        return "performance"
    prix_min = model.get("prix_min_dh")
    if prix_min is not None and prix_min >= rules.luxury_min_price_dh:
        return "luxury"
    energies = model.get("energies") or []
    electrified = any(e == "electrique" or e.startswith("hybride") for e in energies)
    if electrified or (prix_min is not None and prix_min < rules.eco_max_price_dh):
        return "eco"
    return "practical"


# ─── Agrégation par modèle ────────────────────────────────────────────────────

MODEL_COLUMNS = [
    "marque",
    "modele",
    "annee",
    "nb_versions",
    "version_entree",
    "prix_min_dh",
    "prix_max_dh",
    "puissance_min_ch",
    "puissance_max_ch",
    "consommation_min_l100km",
    "places_max",
    "energies",
    "carrosserie",
    "categorie",
    "url_modele",
    "source_urls",
    "date_collecte",
]


def _none(value: object) -> object:
    return None if pd.isna(value) else value


def aggregate_by_model(
    versions: pd.DataFrame, rules: CategoryRules = DEFAULT_RULES
) -> pd.DataFrame:
    """Une ligne par (marque, modèle), calculée sur l'année la plus récente disponible."""
    if versions.empty:
        return pd.DataFrame(columns=MODEL_COLUMNS)
    df = versions.dropna(subset=["marque", "modele"]).copy()
    df["_key"] = df["marque"].map(norm) + "|" + df["modele"].map(norm)

    rows = []
    for _, group in df.groupby("_key", sort=False):
        latest = group["annee"].max()
        vs = group if pd.isna(latest) else group[group["annee"] == latest]
        priced = vs.dropna(subset=["prix_showroom_dh"]).sort_values("prix_showroom_dh")
        entry = priced.iloc[0] if len(priced) else vs.iloc[0]
        model = {
            "marque": entry["marque"],
            "modele": entry["modele"],
            "annee": _none(latest),
            "nb_versions": len(vs),
            "version_entree": entry["version"],
            "prix_min_dh": _none(vs["prix_showroom_dh"].min()),
            "prix_max_dh": _none(vs["prix_showroom_dh"].max()),
            "puissance_min_ch": _none(vs["puissance_ch"].min()),
            "puissance_max_ch": _none(vs["puissance_ch"].max()),
            "consommation_min_l100km": _none(vs["consommation_l100km"].min()),
            "places_max": _none(vs["places"].max()),
            "energies": sorted(vs["energie"].dropna().unique().tolist()),
            "carrosserie": entry["carrosserie"],
            "url_modele": entry.get("url_modele"),
            "source_urls": vs["source_url"].tolist(),
            "date_collecte": _none(vs["date_collecte"].max()),
        }
        model["categorie"] = categorie(model, rules)
        rows.append(model)
    return (
        pd.DataFrame(rows, columns=MODEL_COLUMNS)
        .sort_values(["marque", "modele"], key=lambda s: s.map(norm))
        .reset_index(drop=True)
    )


def fill_rates(df: pd.DataFrame) -> dict[str, int]:
    """Pourcentage de valeurs renseignées par colonne (qualité des données)."""
    if df.empty:
        return {}
    return {col: round(df[col].notna().mean() * 100) for col in df.columns}
