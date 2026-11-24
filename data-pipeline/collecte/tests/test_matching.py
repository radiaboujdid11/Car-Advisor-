"""Table de correspondance catalogue <-> pages modèles, et liens vers les versions."""

from __future__ import annotations

import pandas as pd

from moteur_scraper.compare import compare_with_catalog
from moteur_scraper.crawl import SitemapEntry
from moteur_scraper.matching import (
    build_table,
    model_pages,
    read_table,
    slugify,
    suggest,
    usable,
    write_table,
)
from moteur_scraper.normalize import aggregate_by_model
from moteur_scraper.parse import version_links

BASE = "https://x.test/fr/neuf/voiture"
PAGES = model_pages(
    [
        SitemapEntry(f"{BASE}/peugeot/", None),  # page marque : ignorée
        SitemapEntry(f"{BASE}/peugeot/5008/", None),
        SitemapEntry(f"{BASE}/bmw/serie-3/", None),
        SitemapEntry(f"{BASE}/mercedes-benz/classe-c/", None),
        SitemapEntry(f"{BASE}/ford/mustang/", None),
        SitemapEntry("https://x.test/fr/neuf/moto/aprilia/tuareg-660/", None),  # moto : ignorée
    ]
)


def car(make, model, year=2025, id_=1, price_eur=40000):
    return {
        "id": id_,
        "make": make,
        "model": model,
        "year": year,
        "price_eur": price_eur,
        "category": "practical",
        "power_hp": 150,
    }


def test_slugify_suit_la_regle_des_adresses():
    assert slugify("Série 3") == "serie-3"
    assert slugify("Mercedes-Benz") == "mercedes-benz"
    assert slugify("  ID.4 ") == "id-4"


def test_pages_modeles_sans_pages_marques_ni_motos():
    assert sorted(PAGES["model"]) == ["5008", "classe-c", "mustang", "serie-3"]


def test_suggestions_exacte_ressemblante_introuvable():
    assert suggest("Peugeot", "5008", PAGES)["statut"] == "auto"
    assert suggest("BMW", "Série 3", PAGES)["statut"] == "auto"
    assert suggest("Mercedes", "Classe C", PAGES)["statut"] == "auto"  # alias de marque
    fuzzy = suggest("Ford", "Mustang Mach-E", PAGES)
    assert fuzzy["statut"] == "a_verifier" and fuzzy["url_moteur"].endswith("/ford/mustang/")
    assert suggest("Lamborghini", "Urus", PAGES)["statut"] == "introuvable"


def test_decisions_manuelles_conservees(tmp_path):
    catalog = [car("Ford", "Mustang Mach-E"), car("Peugeot", "5008", id_=2)]
    table = build_table(catalog, PAGES)
    assert table.set_index("modele").loc["Mustang Mach-E", "statut"] == "a_verifier"

    # La personne rejette la proposition, puis la table est régénérée.
    table.loc[table["modele"] == "Mustang Mach-E", ["statut", "commentaire"]] = [
        "rejete",
        "Mach-E électrique ≠ Mustang thermique",
    ]
    path = tmp_path / "correspondances.csv"
    write_table(table, path)
    again = build_table(catalog, PAGES, read_table(path))
    row = again.set_index("modele").loc["Mustang Mach-E"]
    assert row["statut"] == "rejete"
    assert row["commentaire"] == "Mach-E électrique ≠ Mustang thermique"
    assert usable(again)["modele"].tolist() == ["5008"]


def test_comparaison_via_la_table_et_page_partagee():
    catalog = [
        car("Hyundai", "Tucson HEV", id_=1, price_eur=33000),
        car("Hyundai", "Tucson PHEV", id_=2, price_eur=40000),
    ]
    url = f"{BASE}/hyundai/tucson/"
    mapping = pd.DataFrame(
        [
            {"marque": "Hyundai", "modele": "Tucson HEV", "url_moteur": url, "statut": "valide"},
            {"marque": "Hyundai", "modele": "Tucson PHEV", "url_moteur": url, "statut": "valide"},
        ]
    )
    versions = pd.DataFrame(
        [
            {
                "source_id": 9,
                "source_url": f"{url}hyundai-tucson-hev-9.html",
                "url_modele": url,
                "marque": "Hyundai",
                "modele": "Tucson",
                "version": "HEV",
                "annee": 2026,
                "energie": "hybride",
                "carrosserie": "SUV",
                "places": 5,
                "prix_showroom_dh": 356400,
                "puissance_ch": 230,
                "consommation_l100km": None,
                "date_collecte": "2026-11-24",
            }
        ]
    )
    rows, stats = compare_with_catalog(aggregate_by_model(versions), catalog, mapping)
    assert stats["trouves"] == 2
    assert rows["page_partagee"].all()  # deux modèles du catalogue -> une seule page
    hev = rows.set_index("modele").loc["Hyundai Tucson HEV"]
    assert hev["prix_source_min_dh"] == 356400
    assert hev["url_source"] == url


def test_comparaison_ignore_les_correspondances_non_validees():
    catalog = [car("Ford", "Mustang Mach-E")]
    mapping = pd.DataFrame(
        [
            {
                "marque": "Ford",
                "modele": "Mustang Mach-E",
                "url_moteur": f"{BASE}/ford/mustang/",
                "statut": "a_verifier",
            }
        ]
    )
    rows, stats = compare_with_catalog(pd.DataFrame(), catalog, mapping)
    assert stats["trouves"] == 0
    assert rows.iloc[0]["statut_correspondance"] == "a_verifier"


def test_liens_vers_les_versions_d_une_page_modele():
    url = f"{BASE}/peugeot/5008/"
    html = f"""
      <a href="{url}peugeot-5008-allure-3974.html">Allure</a>
      <a href="{url}peugeot-5008-allure-3974.html#prix">doublon</a>
      <a href="{url}peugeot-5008-gt-4809.html?ref=x">GT</a>
      <a href="{BASE}/peugeot/3008/peugeot-3008-gt-1.html">autre modèle</a>
      <a href="{url}photos/">photos</a>"""
    assert version_links(html, url) == [
        f"{url}peugeot-5008-allure-3974.html",
        f"{url}peugeot-5008-gt-4809.html",
    ]
