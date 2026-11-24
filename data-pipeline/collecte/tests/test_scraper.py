"""Tests du collecteur. Aucun accès réseau : sessions HTTP simulées, fiche HTML fictive."""

from __future__ import annotations

from pathlib import Path

import pandas as pd
import pytest

from moteur_scraper.compare import compare_with_catalog, load_catalog, render_report
from moteur_scraper.crawl import USER_AGENT, CrawlStopped, PoliteClient, parse_robots, parse_sitemap
from moteur_scraper.normalize import (
    CategoryRules,
    aggregate_by_model,
    categorie,
    energie,
    fill_rates,
    normalize_version,
    to_number,
)
from moteur_scraper.parse import extract_pairs, parse_fiche, source_id_from_url

FIXTURE = (Path(__file__).parent / "fixtures" / "fiche_fictive.html").read_text(encoding="utf-8")
URL = "https://exemple.test/fr/neuf/voiture/exemplia/familia/exemplia-familia-15-confort-1234.html"
REPO = Path(__file__).resolve().parents[3]


# ─── Lecture des fiches ───────────────────────────────────────────────────────


def test_parse_fiche_lit_les_deux_formes_de_tableaux():
    fiche = parse_fiche(FIXTURE, URL)
    assert fiche["source_id"] == 1234
    assert (fiche["marque"], fiche["modele"], fiche["version"]) == (
        "Exemplia",
        "Familia",
        "1.5 Confort",
    )
    assert fiche["carrosserie"] == "SUV et 4x4"
    assert fiche["propulsion"] == "HEV"  # bulle d'aide « i » retirée
    assert fiche["places"] == "7"
    assert fiche["prix_showroom"] == "250 000 Dhs"
    assert fiche["puissance"] == "140 ch"
    assert fiche["batterie"] is None  # « - » -> absent
    assert fiche["co2"] is None


def test_extract_pairs_ignore_les_lignes_sans_paire_et_garde_le_premier_doublon():
    html = "<table><tr><td>seule</td></tr><tr><td>A</td><td>1</td></tr><tr><td>A</td><td>2</td></tr></table>"
    assert extract_pairs(html) == {"A": "1"}
    assert source_id_from_url("https://x/y-42.html?a=1") == 42
    assert source_id_from_url("https://x/sans-id") is None


# ─── Normalisation ────────────────────────────────────────────────────────────


@pytest.mark.parametrize(
    ("text", "expected"),
    [("480 000 Dhs", 480000), ("4,9 L/100km", 4.9), ("180 ch", 180), ("-", None), (None, None)],
)
def test_to_number(text, expected):
    assert to_number(text) == expected


@pytest.mark.parametrize(
    ("motorisation", "propulsion", "expected"),
    [
        ("Électrique", "BEV", "electrique"),
        ("Hybride rechargeable", "", "hybride_rechargeable"),
        ("Essence", "MHEV", "hybride"),
        ("Diesel", "ICE", "diesel"),
        ("Essence", "ICE", "essence"),
        (None, None, None),
    ],
)
def test_energie(motorisation, propulsion, expected):
    assert energie(motorisation, propulsion) == expected


def test_normalize_version():
    v = normalize_version(parse_fiche(FIXTURE, URL), "2026-11-24", "2026-11-20")
    assert v["prix_showroom_dh"] == 250000
    assert v["prix_cle_en_main_dh"] == 258400
    assert v["puissance_ch"] == 140
    assert v["consommation_l100km"] == 4.9
    assert v["volume_coffre_l"] == 520
    assert v["energie"] == "hybride"
    assert v["annee"] == 2026
    assert (v["date_collecte"], v["lastmod_sitemap"]) == ("2026-11-24", "2026-11-20")


# ─── Agrégation et catégorie ──────────────────────────────────────────────────


def version(**over):
    base = dict(
        source_id=1,
        source_url="u",
        marque="Exemplia",
        modele="Familia",
        version="v",
        annee=2026,
        energie="essence",
        transmission="Manuelle",
        carrosserie="SUV et 4x4",
        portes=5,
        places=5,
        prix_showroom_dh=300000,
        prix_cle_en_main_dh=None,
        puissance_ch=130,
        consommation_l100km=None,
        co2_g_km=None,
        autonomie_km=None,
        batterie_kwh=None,
        volume_coffre_l=None,
        date_collecte="2026-11-24",
        lastmod_sitemap=None,
    )
    return {**base, **over}


def test_aggregation_par_modele():
    df = pd.DataFrame(
        [
            version(version="Confort", prix_showroom_dh=300000, puissance_ch=130),
            version(version="Base", prix_showroom_dh=250000, puissance_ch=110, energie="hybride"),
            version(version="Ancienne", annee=2025, prix_showroom_dh=100000),
            version(marque=None),  # ignorée
        ]
    )
    models = aggregate_by_model(df)
    assert len(models) == 1
    m = models.iloc[0]
    assert m["annee"] == 2026
    assert m["nb_versions"] == 2
    assert m["version_entree"] == "Base"
    assert (m["prix_min_dh"], m["prix_max_dh"]) == (250000, 300000)
    assert (m["puissance_min_ch"], m["puissance_max_ch"]) == (110, 130)
    assert m["energies"] == ["essence", "hybride"]
    assert m["categorie"] == "eco"  # une version hybride


def test_aggregation_vide():
    assert aggregate_by_model(pd.DataFrame()).empty


def test_regle_de_categorie():
    base = dict(
        energies=["essence"], carrosserie="SUV et 4x4", prix_min_dh=300000, puissance_max_ch=150
    )
    assert categorie(base) == "practical"
    assert categorie({**base, "puissance_max_ch": 400}) == "performance"
    assert categorie({**base, "carrosserie": "Coupé"}) == "performance"
    assert categorie({**base, "prix_min_dh": 900000}) == "luxury"
    assert categorie({**base, "prix_min_dh": 150000}) == "eco"
    assert categorie({**base, "energies": ["electrique"]}) == "eco"
    assert (
        categorie({**base, "prix_min_dh": 700000}, CategoryRules(luxury_min_price_dh=800000))
        == "practical"
    )


def test_taux_de_remplissage():
    assert fill_rates(pd.DataFrame([{"a": 1, "b": None}, {"a": 2, "b": 3}])) == {"a": 100, "b": 50}


# ─── Réseau : robots.txt, sitemap, client poli ───────────────────────────────


def test_robots_txt():
    robots = parse_robots(
        "User-agent: *\nDisallow: /storage/\n\nUser-agent: AhrefsBot\nDisallow: /\n"
    )
    assert robots.can_fetch(USER_AGENT, "https://x.test/fr/neuf/voiture/a-1.html")
    assert not robots.can_fetch(USER_AGENT, "https://x.test/storage/media/img.png")


def test_sitemap_avec_espace_de_noms():
    xml = """<?xml version="1.0"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <url><loc>https://x.test/a-1.html</loc><lastmod>2026-11-20</lastmod></url>
      <url><loc>https://x.test/b-2.html?x=1&amp;y=2</loc></url>
    </urlset>"""
    entries = parse_sitemap(xml)
    assert [(e.loc, e.lastmod) for e in entries] == [
        ("https://x.test/a-1.html", "2026-11-20"),
        ("https://x.test/b-2.html?x=1&y=2", None),
    ]


class FakeResponse:
    def __init__(self, status, body=""):
        self.status_code, self.text, self.encoding = status, body, "utf-8"

    @property
    def ok(self):
        return 200 <= self.status_code < 300


class FakeSession:
    def __init__(self, routes):
        self.routes, self.headers, self.calls = routes, {}, []

    def get(self, url, timeout):
        self.calls.append(url)
        status, body = self.routes.get(url, (404, ""))
        return FakeResponse(status, body)


class FakeClock:
    def __init__(self):
        self.now, self.sleeps = 0.0, []

    def time(self):
        return self.now

    def sleep(self, seconds):
        self.sleeps.append(round(seconds, 3))
        self.now += seconds


def make_client(tmp_path, routes):
    session, clock = FakeSession(routes), FakeClock()
    client = PoliteClient(
        cache_dir=tmp_path, delay_s=10, session=session, sleep=clock.sleep, clock=clock.time
    )
    return client, session, clock


def test_client_delai_cache_robots(tmp_path):
    client, session, clock = make_client(
        tmp_path,
        {
            "https://x.test/robots.txt": (200, "User-agent: *\nDisallow: /storage/"),
            "https://x.test/a.html": (200, "A"),
            "https://x.test/b.html": (200, "B"),
        },
    )
    client.load_robots("https://x.test")
    assert client.get("https://x.test/a.html", "1").body == "A"
    assert client.get("https://x.test/b.html", "1").body == "B"
    again = client.get("https://x.test/a.html", "1")
    assert again.from_cache and again.body == "A"
    assert session.calls == [
        "https://x.test/robots.txt",
        "https://x.test/a.html",
        "https://x.test/b.html",
    ]
    assert clock.sleeps == [10, 10]  # 10 s entre chaque requête réseau
    assert session.headers["User-Agent"] == USER_AGENT
    with pytest.raises(CrawlStopped):
        client.get("https://x.test/storage/photo.png")


def test_client_s_arrete_si_le_site_refuse(tmp_path):
    client, _, _ = make_client(tmp_path, {"https://x.test/bloque.html": (429, "")})
    with pytest.raises(CrawlStopped):
        client.get("https://x.test/bloque.html")


def test_client_reessaie_les_erreurs_serveur(tmp_path):
    client, session, _ = make_client(tmp_path, {"https://x.test/panne.html": (503, "")})
    result = client.get("https://x.test/panne.html")
    assert result.body is None and result.status == 503
    assert len(session.calls) == 3


# ─── Comparaison et rapport ───────────────────────────────────────────────────


def test_comparaison_avec_le_catalogue():
    models = aggregate_by_model(pd.DataFrame([version(prix_showroom_dh=216000)]))
    catalog = [
        {
            "make": "Exemplia",
            "model": "Familia",
            "year": 2025,
            "price_eur": 20000,
            "category": "practical",
            "power_hp": 130,
        },
        {
            "make": "Autre",
            "model": "Absente",
            "year": 2025,
            "price_eur": 10000,
            "category": "eco",
            "power_hp": 70,
        },
    ]
    rows, stats = compare_with_catalog(models, catalog)
    assert stats["modeles_catalogue"] == 2
    assert stats["trouves"] == 1
    assert stats["prix_dans_la_fourchette"] == 1
    assert stats["ecart_median_pct"] == 0
    found = rows[rows["trouve"]].iloc[0]
    assert found["prix_catalogue_dh"] == 216000
    assert found["categorie_regle"] == "practical"

    report = render_report(
        rows,
        stats,
        versions=pd.DataFrame([version()]),
        models=models,
        fill={"marque": 100},
        started_at="a",
        finished_at="b",
        partial=True,
    )
    assert "Rapport de collecte" in report and "**partielle**" in report


def test_lecture_du_vrai_catalogue():
    cars = load_catalog(REPO / "frontend" / "src" / "data" / "cars.js")
    assert len(cars) > 200
    assert {"make", "model", "year", "price_eur", "category"} <= cars[0].keys()
