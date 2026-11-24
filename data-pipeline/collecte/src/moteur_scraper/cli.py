"""Contrôle qualité du catalogue à partir des fiches « voitures neuves » de moteur.ma.

    python -m moteur_scraper correspondances      met à jour correspondances.csv (2 requêtes)
    python -m moteur_scraper collecte             collecte ciblée : uniquement les modèles du
                                                  catalogue (statut auto ou valide)
    python -m moteur_scraper echantillon --limit 20   essai sur les fiches les plus récentes

Toujours : robots.txt respecté, 1 requête toutes les 10 s, cache disque, arrêt si le site refuse.

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

from . import matching
from .compare import compare_with_catalog, load_catalog, render_report
from .crawl import DEFAULT_DELAY_S, CrawlStopped, PoliteClient, SitemapEntry, parse_sitemap
from .dedupe import assert_unique, dedupe_entries, dedupe_versions
from .normalize import aggregate_by_model, fill_rates, normalize_version
from .parse import parse_fiche, source_id_from_url, version_links

ORIGIN = "https://www.moteur.ma"
SITEMAP_INDEX = f"{ORIGIN}/sitemaps/sitemap.xml"
BRANDS_MODELS_SITEMAP = f"{ORIGIN}/sitemaps/neuf/brands-models.xml"
DETAIL_SITEMAP = re.compile(r"/sitemaps/neuf/detail-\d+\.xml")
FICHE_URL = re.compile(r"/fr/neuf/voiture/.+-\d+\.html$")

PACKAGE_ROOT = Path(__file__).resolve().parents[2]  # .../data-pipeline/collecte
DATA_PIPELINE = PACKAGE_ROOT.parent
REPO = DATA_PIPELINE.parent
TABLE = PACKAGE_ROOT / "correspondances.csv"
OUT_DIR = DATA_PIPELINE / "scraped"
CACHE_DIR = DATA_PIPELINE / ".cache" / "moteur-ma"
CATALOG = REPO / "frontend" / "src" / "data" / "cars.js"


def log(message: str) -> None:
    print(f"[{datetime.now():%H:%M:%S}] {message}", flush=True)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        prog="python -m moteur_scraper",
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--delay", type=float, default=DEFAULT_DELAY_S, help="secondes entre deux requêtes (≥ 10)"
    )
    sub = parser.add_subparsers(dest="command")
    sub.add_parser("correspondances", help="met à jour la table de correspondance")
    sub.add_parser("collecte", help="collecte ciblée sur les modèles du catalogue (défaut)")
    sample = sub.add_parser("echantillon", help="essai sur les fiches les plus récentes")
    sample.add_argument("--limit", type=int, default=20, help="nombre de fiches (défaut : 20)")
    args = parser.parse_args(argv)
    args.command = args.command or "collecte"
    if args.delay < DEFAULT_DELAY_S:
        parser.error(f"--delay ne peut pas être inférieur à {DEFAULT_DELAY_S:g} s (règles du site)")
    if args.command == "echantillon" and args.limit < 1:
        parser.error("--limit doit être un entier positif")
    return args


def new_client(delay: float) -> PoliteClient:
    client = PoliteClient(cache_dir=CACHE_DIR, delay_s=delay, log=log)
    client.load_robots(ORIGIN)
    log("robots.txt chargé")
    return client


def detail_entries(client: PoliteClient, today: str, limit: int | None = None) -> list:
    """Fiches listées dans les plans « détail » (avec leur lastmod)."""
    index = parse_sitemap(client.get(SITEMAP_INDEX, version=today).body or "<x/>")
    pages = []
    for sitemap in (s for s in index if DETAIL_SITEMAP.search(s.loc)):
        if limit is not None and len(pages) >= limit:
            break
        body = client.get(sitemap.loc, version=sitemap.lastmod or today).body or "<x/>"
        pages += [e for e in parse_sitemap(body) if FICHE_URL.search(e.loc)]
    log(f"plan du site : {len(pages)} fiches listées")
    return pages


# ─── Sous-commandes ───────────────────────────────────────────────────────────


def cmd_correspondances(args: argparse.Namespace) -> int:
    today = datetime.now(UTC).date().isoformat()
    client = new_client(args.delay)
    body = client.get(BRANDS_MODELS_SITEMAP, version=today).body or "<x/>"
    pages = matching.model_pages(parse_sitemap(body))
    table = matching.build_table(load_catalog(CATALOG), pages, matching.read_table(TABLE))
    matching.write_table(table, TABLE)
    log(f"{len(pages)} pages modèles sur le site ; table : {matching.summary(table)}")
    log(f"à relire : lignes « a_verifier » de {TABLE} (mettre « valide » ou « rejete »)")
    return 0


def cmd_collecte(args: argparse.Namespace) -> int:
    table = matching.read_table(TABLE)
    if table is None:
        log("table de correspondance absente : lancez d'abord « correspondances »")
        return 1
    targets = matching.usable(table)["url_moteur"].drop_duplicates().tolist()
    started_at = datetime.now(UTC).isoformat(timespec="seconds")
    today, month = started_at[:10], started_at[:7]
    client = new_client(args.delay)

    # lastmod de chaque fiche (pour ne relire que les fiches modifiées)
    lastmods = {source_id_from_url(e.loc): e.lastmod for e in detail_entries(client, today)}

    versions, partial, dup = [], False, 0
    try:
        fiches = []
        for n, model_url in enumerate(targets, start=1):
            # Page modèle relue une fois par mois au plus (liste des versions).
            page = client.get(model_url, version=month)
            links = version_links(page.body or "", model_url)
            fiches += [SitemapEntry(u, lastmods.get(source_id_from_url(u))) for u in links]
            if not page.from_cache:
                log(f"modèle {n}/{len(targets)} : {model_url} ({len(links)} versions)")
        fiches, dup = dedupe_entries(fiches)
        log(f"{len(fiches)} fiches versions à lire ({dup} doublons écartés)")
        versions = read_fiches(client, fiches, today, fallback_version=month)
    except CrawlStopped as stop:
        partial = True
        log(f"ARRÊT : {stop}")
    return finish(client, versions, started_at, partial, dup, mapping=table)


def cmd_echantillon(args: argparse.Namespace) -> int:
    started_at = datetime.now(UTC).isoformat(timespec="seconds")
    today = started_at[:10]
    client = new_client(args.delay)
    pages, dup = dedupe_entries(detail_entries(client, today, limit=args.limit))
    versions, partial = [], True
    try:
        versions = read_fiches(client, pages[: args.limit], today)
    except CrawlStopped as stop:
        log(f"ARRÊT : {stop}")
    return finish(client, versions, started_at, partial, dup, mapping=None)


# ─── Étapes communes ──────────────────────────────────────────────────────────


def read_fiches(client: PoliteClient, fiches: list, today: str, fallback_version=None) -> list:
    versions = []
    for n, fiche in enumerate(fiches, start=1):
        result = client.get(fiche.loc, version=fiche.lastmod or fallback_version)
        if not result.body:
            log(f"ignorée (HTTP {result.status}) : {fiche.loc}")
            continue
        version = normalize_version(parse_fiche(result.body, fiche.loc), today, fiche.lastmod)
        versions.append(version)
        if not result.from_cache or n % 50 == 0:
            log(f"fiche {n}/{len(fiches)} {version['marque']} {version['modele']}")
    return versions


def finish(client, versions, started_at, partial, duplicate_urls, mapping) -> int:
    versions_df, removed_versions = dedupe_versions(pd.DataFrame(versions))
    if len(removed_versions):
        log(f"{len(removed_versions)} versions en double écartées")
    models = aggregate_by_model(versions_df)
    # Contrôle final : on n'écrit rien si une clé n'est pas unique.
    assert_unique(versions_df, ["source_id"], "versions")
    assert_unique(models, ["marque", "modele"], "modèles")
    rows, stats = compare_with_catalog(models, load_catalog(CATALOG), mapping)
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


COMMANDS = {
    "correspondances": cmd_correspondances,
    "collecte": cmd_collecte,
    "echantillon": cmd_echantillon,
}


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    return COMMANDS[args.command](args)
