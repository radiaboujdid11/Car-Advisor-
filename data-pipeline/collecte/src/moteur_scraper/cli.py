"""Collecte des fiches « voitures neuves » de moteur.ma -> fichiers LOCAUX + rapport.

    python -m moteur_scraper                échantillon de 20 fiches (≈ 4 min)
    python -m moteur_scraper --limit 100    100 fiches
    python -m moteur_scraper --all          tout le plan du site (≈ 12 h à 1 requête / 10 s)

IMPORTANT : les conditions d'utilisation de moteur.ma protègent leur base de données.
Les résultats restent dans data-pipeline/scraped/ (ignoré par git) et servent à VÉRIFIER
le catalogue ; ne pas les publier sur le site sans l'accord écrit de moteur.ma.
"""

from __future__ import annotations

import argparse
import re
from datetime import UTC, datetime
from pathlib import Path

import pandas as pd

from .compare import compare_with_catalog, load_catalog, render_report
from .crawl import DEFAULT_DELAY_S, CrawlStopped, PoliteClient, parse_sitemap
from .dedupe import assert_unique, dedupe_entries, dedupe_versions
from .normalize import aggregate_by_model, fill_rates, normalize_version
from .parse import parse_fiche

ORIGIN = "https://www.moteur.ma"
SITEMAP_INDEX = f"{ORIGIN}/sitemaps/sitemap.xml"
DETAIL_SITEMAP = re.compile(r"/sitemaps/neuf/detail-\d+\.xml")
FICHE_URL = re.compile(r"/fr/neuf/voiture/.+-\d+\.html$")

DATA_PIPELINE = Path(__file__).resolve().parents[3]  # .../data-pipeline
REPO = DATA_PIPELINE.parent
OUT_DIR = DATA_PIPELINE / "scraped"
CACHE_DIR = DATA_PIPELINE / ".cache" / "moteur-ma"
CATALOG = REPO / "frontend" / "src" / "data" / "cars.js"


def log(message: str) -> None:
    print(f"[{datetime.now():%H:%M:%S}] {message}", flush=True)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    group = parser.add_mutually_exclusive_group()
    group.add_argument(
        "--limit", type=int, default=20, help="nombre de fiches à lire (défaut : 20)"
    )
    group.add_argument("--all", action="store_true", help="lire toutes les fiches du plan du site")
    parser.add_argument(
        "--delay", type=float, default=DEFAULT_DELAY_S, help="secondes entre deux requêtes (≥ 10)"
    )
    args = parser.parse_args(argv)
    if args.limit < 1:
        parser.error("--limit doit être un entier positif")
    if args.delay < DEFAULT_DELAY_S:
        parser.error(f"--delay ne peut pas être inférieur à {DEFAULT_DELAY_S:g} s (règles du site)")
    return args


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    limit = None if args.all else args.limit
    started_at = datetime.now(UTC).isoformat(timespec="seconds")
    today = started_at[:10]
    client = PoliteClient(cache_dir=CACHE_DIR, delay_s=args.delay, log=log)

    client.load_robots(ORIGIN)
    log("robots.txt chargé")

    # 1. Plan du site -> fiches « détail » des voitures neuves (une par version)
    index = parse_sitemap(client.get(SITEMAP_INDEX, version=today).body or "<x/>")
    pages = []
    for sitemap in (s for s in index if DETAIL_SITEMAP.search(s.loc)):
        if limit is not None and len(pages) >= limit:
            break
        body = client.get(sitemap.loc, version=sitemap.lastmod or today).body or "<x/>"
        pages += [e for e in parse_sitemap(body) if FICHE_URL.search(e.loc)]
        log(f"{sitemap.loc} : {len(pages)} fiches listées")
    # Une seule URL par fiche, même si le plan du site la liste plusieurs fois.
    pages, duplicate_urls = dedupe_entries(pages)
    if duplicate_urls:
        log(f"{duplicate_urls} URL en double écartées du plan du site")
    todo = pages[:limit] if limit is not None else pages
    log(f"{len(todo)} fiches à lire (1 requête toutes les {args.delay:g} s, cache disque)")

    # 2. Fiches -> versions normalisées
    versions, partial = [], limit is not None
    try:
        for n, page in enumerate(todo, start=1):
            result = client.get(page.loc, version=page.lastmod)
            if not result.body:
                log(f"ignorée (HTTP {result.status}) : {page.loc}")
                continue
            version = normalize_version(parse_fiche(result.body, page.loc), today, page.lastmod)
            versions.append(version)
            if not result.from_cache or n % 50 == 0:
                log(f"{n}/{len(todo)} {version['marque']} {version['modele']}")
    except CrawlStopped as stop:
        partial = True
        log(f"ARRÊT : {stop}")

    # 3. Unicité, agrégation, qualité, comparaison, rapport
    versions_df, removed_versions = dedupe_versions(pd.DataFrame(versions))
    if len(removed_versions):
        log(f"{len(removed_versions)} versions en double écartées")
    models = aggregate_by_model(versions_df)
    # Contrôle final : on n'écrit rien si une clé n'est pas unique.
    assert_unique(versions_df, ["source_id"], "versions")
    assert_unique(models, ["marque", "modele"], "modèles")
    rows, stats = compare_with_catalog(models, load_catalog(CATALOG))
    finished_at = datetime.now(UTC).isoformat(timespec="seconds")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    versions_df.to_parquet(OUT_DIR / "versions.parquet", index=False)
    versions_df.to_csv(OUT_DIR / "versions.csv", index=False)
    models.to_csv(OUT_DIR / "modeles.csv", index=False)
    rows.to_csv(OUT_DIR / "comparaison.csv", index=False)
    removed_versions.to_csv(OUT_DIR / "doublons_ecartes.csv", index=False)
    report = render_report(
        rows,
        stats,
        versions=versions_df,
        models=models,
        duplicates={"urls": duplicate_urls, "versions": len(removed_versions)},
        fill=fill_rates(versions_df),
        started_at=started_at,
        finished_at=finished_at,
        partial=partial,
    )
    (OUT_DIR / "rapport.md").write_text(report, encoding="utf-8")
    log(
        f"terminé : {len(versions_df)} versions, {len(models)} modèles, "
        f"{client.requests_made} requêtes réseau -> {OUT_DIR / 'rapport.md'}"
    )
    return 0
