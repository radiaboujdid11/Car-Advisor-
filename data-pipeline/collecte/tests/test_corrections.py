"""Corrections semi-automatiques : proposition, conservation des décisions, application."""

from __future__ import annotations

import pandas as pd
import pytest

from moteur_scraper.corrections import (
    CorrectionError,
    apply_corrections,
    propose_corrections,
    read_proposals,
    read_verifications,
    write_csv,
    write_verifications,
)


def comparison_row(**over):
    base = {
        "id": 1,
        "carquery_id": "ma_peugeot_5008_2025",
        "modele": "Peugeot 5008",
        "annee_catalogue": 2025,
        "trouve": True,
        "prix_catalogue_dh": 624996,
        "prix_source_min_dh": 480000.0,
        "prix_source_max_dh": 520000.0,
        "ecart_pct": 30.2,
        "dans_la_fourchette": False,
        "version_entree": "1.2 Hybrid 145 AT Allure",
        "page_partagee": False,
        "url_source": "https://x.test/peugeot/5008/",
        "date_collecte": "2026-11-24",
    }
    return {**base, **over}


ROWS = pd.DataFrame(
    [
        comparison_row(),
        comparison_row(carquery_id="ok", modele="Dans la fourchette", dans_la_fourchette=True),
        comparison_row(carquery_id="absent", modele="Introuvable", trouve=False),
        comparison_row(
            carquery_id="ibiza",
            modele="Seat Ibiza",
            ecart_pct=-30.9,
            prix_catalogue_dh=151200,
            prix_source_min_dh=218900.0,
        ),
    ]
)


def test_propose_seulement_les_prix_hors_fourchette():
    proposals = propose_corrections(ROWS)
    assert proposals["carquery_id"].tolist() == [
        "ibiza",
        "ma_peugeot_5008_2025",
    ]  # |écart| décroissant
    first = proposals.set_index("carquery_id").loc["ma_peugeot_5008_2025"]
    assert first["prix_propose_dh"] == 480000  # version d'entrée
    assert first["accepter"] == ""


def test_decisions_conservees_si_le_prix_propose_ne_change_pas(tmp_path):
    path = tmp_path / "corrections.csv"
    proposals = propose_corrections(ROWS)
    proposals.loc[proposals["carquery_id"] == "ibiza", ["accepter", "source_retenue"]] = [
        "oui",
        "moteur.ma",
    ]
    write_csv(proposals, path)
    again = propose_corrections(ROWS, read_proposals(path))
    assert again.set_index("carquery_id").loc["ibiza", "accepter"] == "oui"

    # Le prix de la source a changé : la décision est remise à zéro (à revoir).
    changed = ROWS.copy()
    changed.loc[changed["carquery_id"] == "ibiza", "prix_source_min_dh"] = 225000.0
    reset = propose_corrections(changed, read_proposals(path))
    assert reset.set_index("carquery_id").loc["ibiza", "accepter"] == ""


def test_fichier_lisible_par_excel(tmp_path):
    path = tmp_path / "corrections.csv"
    write_csv(propose_corrections(ROWS), path)
    raw = path.read_bytes()
    assert raw.startswith(b"\xef\xbb\xbf")  # BOM UTF-8
    assert b";" in raw.splitlines()[0] and b"\r\n" not in raw


def decided(**over):
    proposals = propose_corrections(ROWS)
    for col, value in over.items():
        proposals[col] = value
    return proposals


def test_application_des_lignes_acceptees_avec_source_et_date(tmp_path):
    proposals = decided(accepter="", source_retenue="")
    proposals.loc[0, ["accepter", "source_retenue", "url_preuve"]] = [
        "oui",
        "marque",
        "https://www.seat.ma/ibiza",
    ]
    result = apply_corrections(proposals, {"ancien": {"prix_dh": 1}}, "2026-11-25")
    assert set(result) == {"ancien", "ibiza"}  # les vérifications existantes sont gardées
    assert result["ibiza"] == {
        "prix_dh": 218900,
        "source": "marque",
        "url": "https://www.seat.ma/ibiza",
        "verifie_le": "2026-11-25",
        "modele": "Seat Ibiza",
    }

    path = tmp_path / "verifications.json"
    write_verifications(result, path)
    assert read_verifications(path) == result


def test_source_moteur_ma_garde_l_url_de_la_page_source():
    result = apply_corrections(
        decided(accepter="OUI", source_retenue="moteur.ma"), {}, "2026-11-25"
    )
    assert result["ma_peugeot_5008_2025"]["url"] == "https://x.test/peugeot/5008/"
    assert len(result) == 2


@pytest.mark.parametrize(
    ("source", "preuve", "message"),
    [
        ("", "", "source_retenue"),
        ("marque", "", "url_preuve"),
        ("concession", "", "source_retenue"),
    ],
)
def test_ligne_acceptee_incomplete_rien_n_est_applique(source, preuve, message):
    proposals = decided(accepter="oui", source_retenue=source, url_preuve=preuve)
    with pytest.raises(CorrectionError, match=message):
        apply_corrections(proposals, {}, "2026-11-25")


def test_aucune_ligne_acceptee():
    assert apply_corrections(decided(accepter="non"), {}, "2026-11-25") == {}
