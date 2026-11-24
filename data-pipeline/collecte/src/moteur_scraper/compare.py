"""Comparaison avec le catalogue actuel (frontend/src/data/cars.js) et rapport Markdown."""

from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

import pandas as pd

from .normalize import norm

EUR_TO_MAD = 10.8  # taux utilisé par le catalogue actuel (frontend/src/utils/format.js)


def load_catalog(path: Path) -> list[dict]:
    """Lit le tableau CARS du module JavaScript généré.

    cars.js est un module JS (pas du JSON) : on laisse Node l'importer et le renvoyer en JSON,
    plutôt que d'analyser du JavaScript en Python. Node est déjà requis par le projet.
    """
    script = "import(process.argv[1]).then((m) => process.stdout.write(JSON.stringify(m.CARS)))"
    try:
        result = subprocess.run(
            ["node", "--input-type=module", "-e", script, path.resolve().as_uri()],
            capture_output=True,
            text=True,
            encoding="utf-8",
            check=True,
            timeout=60,
        )
    except FileNotFoundError as err:
        raise RuntimeError("Node.js est requis pour lire frontend/src/data/cars.js") from err
    return json.loads(result.stdout)


def model_key(make: object, model: object) -> str:
    key = norm(f"{make} {model}").replace("mercedes-benz", "mercedes")
    return re.sub(r"[^a-z0-9]+", " ", key).strip()


def compare_with_catalog(
    models: pd.DataFrame, catalog: list[dict], mapping: pd.DataFrame | None = None
) -> tuple[pd.DataFrame, dict]:
    """Pour chaque modèle du catalogue : présent dans la collecte ? écart de prix ? catégorie ?

    Avec `mapping` (table de correspondance), le rapprochement se fait par l'URL de la page
    modèle validée ; sans, par ressemblance des noms.
    """
    records = models.to_dict("records")
    by_key = {model_key(m["marque"], m["modele"]): m for m in records}
    by_url = {m.get("url_modele"): m for m in records if m.get("url_modele")}

    latest: dict[tuple[str, str], dict] = {}
    for car in catalog:
        key = (car["make"], car["model"])
        if key not in latest or car["year"] > latest[key]["year"]:
            latest[key] = car

    links: dict[tuple[str, str], dict] = {}
    shared: set[str] = set()
    if mapping is not None and not mapping.empty:
        links = {(r["marque"], r["modele"]): r for r in mapping.to_dict("records")}
        counts = mapping[mapping["statut"].isin({"auto", "valide"})]["url_moteur"].value_counts()
        shared = set(counts[counts > 1].index)

    rows = []
    for (make, model), car in latest.items():
        ours = round(car["price_eur"] * EUR_TO_MAD)
        if mapping is not None:
            link = links.get((make, model), {})
            status = link.get("statut") or "absent_de_la_table"
            url = link.get("url_moteur") if status in {"auto", "valide"} else None
            src = by_url.get(url) if url else None
        else:
            status, url, src = None, None, by_key.get(model_key(make, model))
        row = {
            "id": car["id"],
            "carquery_id": car.get("carquery_id"),
            "modele": f"{make} {model}",
            "annee_catalogue": car["year"],
            "statut_correspondance": status,
            "page_partagee": url in shared,
            "trouve": src is not None,
            "prix_catalogue_dh": ours,
            "categorie_catalogue": car["category"],
        }
        if src is not None:
            low, high = src["prix_min_dh"], src["prix_max_dh"]
            row.update(
                prix_source_min_dh=low,
                prix_source_max_dh=high,
                ecart_pct=round((ours - low) / low * 100, 1) if low else None,
                dans_la_fourchette=bool(low) and low * 0.95 <= ours <= (high or low) * 1.05,
                categorie_regle=src["categorie"],
                puissance_catalogue=car["power_hp"],
                puissance_source_max=src["puissance_max_ch"],
                version_entree=src["version_entree"],
                url_source=src.get("url_modele"),
                date_collecte=src.get("date_collecte"),
            )
        rows.append(row)

    df = pd.DataFrame(rows)
    found = df[df["trouve"]] if not df.empty else df
    known = {model_key(make, model) for make, model in latest}
    stats = {
        "modeles_catalogue": len(df),
        "trouves": len(found),
        "prix_dans_la_fourchette": int(
            found.get("dans_la_fourchette", pd.Series()).fillna(False).sum()
        ),
        "ecart_median_pct": _none(round(found["ecart_pct"].median(), 1))
        if "ecart_pct" in found and found["ecart_pct"].notna().any()
        else None,
        "categories_identiques": int(
            (found.get("categorie_regle") == found.get("categorie_catalogue")).sum()
        )
        if len(found)
        else 0,
        "modeles_collectes_absents_du_catalogue": 0
        if mapping is not None
        else sum(model_key(m["marque"], m["modele"]) not in known for m in records),
    }
    return df, stats


def _none(value: object) -> object:
    return None if pd.isna(value) else value


def _pct(a: int, b: int) -> str:
    return f"{round(a / b * 100)} %" if b else "—"


def _dh(value: object) -> str:
    return "—" if value is None or pd.isna(value) else f"{int(value):,}".replace(",", " ")


def render_report(
    rows: pd.DataFrame,
    stats: dict,
    *,
    versions: pd.DataFrame,
    models: pd.DataFrame,
    fill: dict[str, int],
    started_at: str,
    finished_at: str,
    partial: bool,
    duplicates: dict[str, int] | None = None,
) -> str:
    duplicates = duplicates or {}
    lines = [
        "# Rapport de collecte moteur.ma",
        "",
        f"- Collecte : {started_at} → {finished_at}"
        + (" (**partielle**, échantillon)" if partial else ""),
        f"- Fiches versions lues : {len(versions)} ; modèles agrégés : {len(models)}",
        f"- Doublons écartés : {duplicates.get('urls', 0)} URL du plan du site, "
        f"{duplicates.get('versions', 0)} versions (détail : doublons_ecartes.csv)",
        "",
        "## Comparaison avec le catalogue actuel",
        "",
        "| Mesure | Valeur |",
        "| --- | --- |",
        f"| Modèles du catalogue | {stats['modeles_catalogue']} |",
        f"| …trouvés dans la collecte | {stats['trouves']} ({_pct(stats['trouves'], stats['modeles_catalogue'])}) |",
        f"| …dont prix dans la fourchette source (±5 %) | {stats['prix_dans_la_fourchette']} "
        f"({_pct(stats['prix_dans_la_fourchette'], stats['trouves'])}) |",
        f"| Écart de prix médian (catalogue vs version d'entrée) | {stats['ecart_median_pct'] if stats['ecart_median_pct'] is not None else '—'} % |",
        f"| Catégorie identique (règle vs catalogue) | {stats['categories_identiques']} "
        f"({_pct(stats['categories_identiques'], stats['trouves'])}) |",
        f"| Modèles collectés absents du catalogue | {stats['modeles_collectes_absents_du_catalogue']} |",
        "",
        "## Taux de remplissage des champs (versions)",
        "",
        "| Champ | Rempli |",
        "| --- | --- |",
        *[f"| `{k}` | {v} % |" for k, v in fill.items()],
        "",
        "## Plus grands écarts de prix",
        "",
        "| Modèle | Catalogue (DH) | Source min–max (DH) | Écart |",
        "| --- | --- | --- | --- |",
    ]
    if "ecart_pct" in rows:
        top = rows[rows["trouve"] & rows["ecart_pct"].notna()]
        top = top.reindex(top["ecart_pct"].abs().sort_values(ascending=False).index).head(20)
        for r in top.to_dict("records"):
            sign = "+" if r["ecart_pct"] > 0 else ""
            lines.append(
                f"| {r['modele']} | {_dh(r['prix_catalogue_dh'])} | "
                f"{_dh(r['prix_source_min_dh'])} – {_dh(r['prix_source_max_dh'])} | {sign}{r['ecart_pct']} % |"
            )
    return "\n".join(lines) + "\n"
