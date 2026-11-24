"""Lecture d'une fiche « version » de voiture neuve (HTML rendu côté serveur).

Fonctions pures : aucune requête réseau. Les valeurs restent des textes ; la conversion en
nombres et la normalisation se font dans normalize.py.
"""

from __future__ import annotations

import re

from bs4 import BeautifulSoup, Tag

_EMPTY = {"", "-", "—"}


def _text(node: Tag | None) -> str:
    return re.sub(r"\s+", " ", node.get_text(" ", strip=True)).strip() if node else ""


def _clean_label(label: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"\s*:\s*$", "", label)).strip()


def _soup(html: str) -> BeautifulSoup:
    soup = BeautifulSoup(html, "html.parser")
    # Bulles d'aide (« i ») et scripts : pas du contenu.
    for node in soup.select("script, style, .propulsion-info"):
        node.decompose()
    return soup


def extract_pairs(html: str) -> dict[str, str]:
    """Toutes les paires libellé -> valeur des tableaux, sous deux formes :

    <td><span class="font-weight-bold">Marque :</span> Peugeot</td>
    <td>Puissance réelle (ch)</td><td>180 ch</td>

    En cas de doublon, la première occurrence est gardée.
    """
    pairs: dict[str, str] = {}

    def add(label: str, value: str) -> None:
        key = _clean_label(label)
        if key and key not in pairs:
            pairs[key] = value.strip()

    for row in _soup(html).find_all("tr"):
        cells = row.find_all("td")
        inline = []
        for cell in cells:
            span = cell.find("span", class_="font-weight-bold")
            if span and _text(span).endswith(":"):
                inline.append((cell, span))
        if inline:
            for cell, span in inline:
                label = _text(span)
                span.extract()
                add(label, _text(cell))
        elif len(cells) == 2:
            add(_text(cells[0]), _text(cells[1]))
    return pairs


def version_links(html: str, model_url: str) -> list[str]:
    """Liens vers les fiches versions d'une page modèle (…/marque/modele/…-1234.html)."""
    prefix = model_url.rstrip("/") + "/"
    links = []
    for a in BeautifulSoup(html, "html.parser").find_all("a", href=True):
        href = a["href"].split("#")[0].split("?")[0]
        if href.startswith(prefix) and re.search(r"-\d+\.html$", href) and href not in links:
            links.append(href)
    return links


def source_id_from_url(url: str) -> int | None:
    """Identifiant numérique de la fiche : …-4809.html -> 4809."""
    match = re.search(r"-(\d+)\.html(?:$|[?#])", url)
    return int(match.group(1)) if match else None


def parse_fiche(html: str, url: str) -> dict[str, object]:
    """Fiche brute : champs utiles, encore sous forme de texte (None si absent)."""
    pairs = extract_pairs(html)

    def get(*labels: str) -> str | None:
        for label in labels:
            value = pairs.get(label)
            if value is not None and value not in _EMPTY:
                return value
        return None

    return {
        "source_url": url,
        "source_id": source_id_from_url(url),
        "marque": get("Marque"),
        "modele": get("Modèle"),
        "version": get("Version"),
        "annee": get("Année"),
        "transmission": get("Transmission"),
        "carrosserie": get("Type"),
        "motorisation": get("Motorisation"),
        "propulsion": get("Propulsion"),
        "portes": get("Nombre de portes"),
        "places": get("Nombre de places"),
        "prix_showroom": get("Prix en showroom"),
        "prix_cle_en_main": get("Prix clé en main"),
        "puissance": get("Puissance réelle (ch)"),
        "consommation_mixte": get("Consommation mixte"),
        # Absent des fiches observées : gardé au cas où le site l'ajoute.
        "co2": get("Émissions de CO2", "Émissions de CO₂", "Émissions CO2"),
        "autonomie_electrique": get("Autonomie Électrique", "Autonomie combinée"),
        "batterie": get("Capacité de la batterie"),
        "volume_coffre": get("Volume de coffre"),
        "longueur": get("Longueur"),
    }
