"""Garanties d'unicité : doublons fabriqués exprès, ils doivent être écartés ou bloqués."""

from __future__ import annotations

import pandas as pd
import pytest

from moteur_scraper.crawl import SitemapEntry
from moteur_scraper.dedupe import DuplicateKeyError, assert_unique, dedupe_entries, dedupe_versions
from moteur_scraper.normalize import aggregate_by_model


def url(slug: str, source_id: int) -> str:
    return f"https://x.test/fr/neuf/voiture/marque/modele/{slug}-{source_id}.html"


# ─── 1. Avant le téléchargement ───────────────────────────────────────────────


def test_meme_url_listee_deux_fois_dans_le_plan_du_site():
    entries = [
        SitemapEntry(url("a", 1), "2026-11-01"),
        SitemapEntry(url("b", 2), "2026-11-01"),
        SitemapEntry(url("a", 1), "2026-11-01"),  # doublon exact
    ]
    unique, removed = dedupe_entries(entries)
    assert [e.loc for e in unique] == [url("a", 1), url("b", 2)]
    assert removed == 1


def test_meme_fiche_sous_deux_url_garde_la_plus_recente():
    # La page a été renommée : même identifiant 4809, nouveau slug, lastmod plus récent.
    entries = [
        SitemapEntry(url("ancien-nom", 4809), "2026-10-01"),
        SitemapEntry(url("autre", 7), None),
        SitemapEntry(url("nouveau-nom", 4809), "2026-11-20"),
    ]
    unique, removed = dedupe_entries(entries)
    assert removed == 1
    assert [e.loc for e in unique] == [url("nouveau-nom", 4809), url("autre", 7)]  # ordre conservé


def test_plan_du_site_sans_doublon():
    entries = [SitemapEntry(url("a", 1), None), SitemapEntry(url("b", 2), None)]
    unique, removed = dedupe_entries(entries)
    assert (len(unique), removed) == (2, 0)


# ─── 2. Après la lecture ──────────────────────────────────────────────────────


def version(**over):
    base = dict(
        source_id=1,
        source_url=url("a", 1),
        marque="Peugeot",
        modele="5008",
        version="1,6L GT ESSENCE",
        annee=2026,
        prix_showroom_dh=480000,
        lastmod_sitemap="2026-11-01",
        date_collecte="2026-11-24",
    )
    return {**base, **over}


def test_meme_source_id_garde_la_plus_recente():
    df = pd.DataFrame(
        [
            version(source_id=4809, prix_showroom_dh=470000, lastmod_sitemap="2026-10-01"),
            version(source_id=4809, prix_showroom_dh=480000, lastmod_sitemap="2026-11-20"),
        ]
    )
    kept, removed = dedupe_versions(df)
    assert len(kept) == 1
    assert kept.iloc[0]["prix_showroom_dh"] == 480000  # la plus récente
    assert removed.iloc[0]["raison"] == "même identifiant de fiche (source_id)"


def test_meme_voiture_sous_deux_identifiants():
    # Saisie deux fois chez la source : identifiants différents, même voiture (casse et accents près).
    df = pd.DataFrame(
        [
            version(source_id=10, version="1,6L GT ESSENCE", lastmod_sitemap="2026-11-20"),
            version(
                source_id=11,
                version="1,6l gt essence",
                marque="PEUGEOT",
                lastmod_sitemap="2026-09-01",
            ),
        ]
    )
    kept, removed = dedupe_versions(df)
    assert kept["source_id"].tolist() == [10]
    assert removed.iloc[0]["raison"] == "même marque, modèle, version et année"


def test_versions_differentes_conservees():
    df = pd.DataFrame(
        [
            version(source_id=1, version="Allure"),
            version(source_id=2, version="GT"),
            version(source_id=3, version="Allure", annee=2025),  # autre année : pas un doublon
        ]
    )
    kept, removed = dedupe_versions(df)
    assert len(kept) == 3 and removed.empty


def test_dedupe_puis_agregation_un_seul_modele():
    df = pd.DataFrame(
        [version(source_id=1), version(source_id=1), version(source_id=2, version="Allure")]
    )
    kept, _ = dedupe_versions(df)
    models = aggregate_by_model(
        kept.assign(
            energie="essence",
            carrosserie="SUV",
            places=5,
            puissance_ch=180,
            consommation_l100km=None,
        )
    )
    assert len(models) == 1
    assert models.iloc[0]["nb_versions"] == 2


def test_dedupe_dataframe_vide():
    kept, removed = dedupe_versions(pd.DataFrame())
    assert kept.empty and removed.empty


# ─── 3. Contrôle final ────────────────────────────────────────────────────────


def test_controle_final_bloque_un_doublon():
    df = pd.DataFrame([{"source_id": 1}, {"source_id": 2}, {"source_id": 1}])
    with pytest.raises(DuplicateKeyError, match="écriture annulée"):
        assert_unique(df, ["source_id"], "versions")


def test_controle_final_laisse_passer_des_donnees_uniques():
    assert_unique(pd.DataFrame([{"source_id": 1}, {"source_id": 2}]), ["source_id"], "versions")
    assert_unique(pd.DataFrame(), ["source_id"], "versions")
