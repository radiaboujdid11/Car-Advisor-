"""Accès réseau poli.

- robots.txt respecté (urllib.robotparser) : aucune image, /storage/ exclu ;
- une requête toutes les 10 secondes ;
- cache disque (une page n'est relue que si sa date lastmod change) ;
- arrêt immédiat si le site refuse (HTTP 403 ou 429).
"""

from __future__ import annotations

import hashlib
import time
import xml.etree.ElementTree as ET
from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urljoin
from urllib.robotparser import RobotFileParser

import requests

USER_AGENT = "AutoAssistDataBot/1.0 (projet etudiant ; collecte lente, 1 requete/10 s)"
DEFAULT_DELAY_S = 10.0


class CrawlStopped(Exception):
    """Le site refuse l'accès, ou robots.txt interdit l'URL : la collecte s'arrête."""


@dataclass
class FetchResult:
    body: str | None
    status: int | None
    from_cache: bool


@dataclass
class SitemapEntry:
    loc: str
    lastmod: str | None


def parse_robots(text: str) -> RobotFileParser:
    parser = RobotFileParser()
    parser.parse(text.splitlines())
    return parser


def parse_sitemap(xml: str) -> list[SitemapEntry]:
    """Entrées <url> d'un sitemap ou <sitemap> d'un index, avec leur lastmod."""
    root = ET.fromstring(xml)
    entries = []
    # iterfind (XPath) accepte le joker d'espace de noms {*} ; iter() ne l'accepte pas.
    for node in [*root.iterfind(".//{*}url"), *root.iterfind(".//{*}sitemap")]:
        loc = node.findtext("{*}loc")
        if loc:
            lastmod = node.findtext("{*}lastmod")
            entries.append(SitemapEntry(loc.strip(), lastmod.strip() if lastmod else None))
    return entries


class PoliteClient:
    """Client HTTP poli. `session`, `sleep` et `clock` sont injectables pour les tests."""

    def __init__(
        self,
        cache_dir: Path | None = None,
        delay_s: float = DEFAULT_DELAY_S,
        session: requests.Session | None = None,
        sleep: Callable[[float], None] = time.sleep,
        clock: Callable[[], float] = time.monotonic,
        log: Callable[[str], None] = lambda _m: None,
    ) -> None:
        self.cache_dir = cache_dir
        self.delay_s = delay_s
        self.session = session or requests.Session()
        self.session.headers.update(
            {"User-Agent": USER_AGENT, "Accept": "text/html,application/xml"}
        )
        self._sleep = sleep
        self._clock = clock
        self._log = log
        self._last: float | None = None
        self.robots: RobotFileParser | None = None
        self.requests_made = 0
        if cache_dir:
            cache_dir.mkdir(parents=True, exist_ok=True)

    def _cache_path(self, url: str, version: str | None) -> Path | None:
        if not self.cache_dir:
            return None
        digest = hashlib.sha1(f"{url}|{version or ''}".encode()).hexdigest()
        return self.cache_dir / f"{digest}.html"

    def _wait_turn(self) -> None:
        if self._last is not None:
            remaining = self._last + self.delay_s - self._clock()
            if remaining > 0:
                self._sleep(remaining)
        self._last = self._clock()

    def get(self, url: str, version: str | None = None) -> FetchResult:
        if self.robots is not None and not self.robots.can_fetch(USER_AGENT, url):
            raise CrawlStopped(f"interdit par robots.txt : {url}")

        cached = self._cache_path(url, version)
        if cached and cached.exists():
            return FetchResult(cached.read_text(encoding="utf-8"), 200, True)

        for attempt in range(1, 4):
            self._wait_turn()
            response = self.session.get(url, timeout=30)
            self.requests_made += 1
            if response.status_code in (403, 429):
                raise CrawlStopped(
                    f"le site refuse l'accès (HTTP {response.status_code}) : arrêt de la collecte"
                )
            if response.status_code >= 500 and attempt < 3:
                self._log(f"HTTP {response.status_code}, nouvel essai")
                continue
            if not response.ok:
                return FetchResult(None, response.status_code, False)
            response.encoding = response.encoding or "utf-8"
            body = response.text
            if cached:
                cached.write_text(body, encoding="utf-8")
            return FetchResult(body, response.status_code, False)
        return FetchResult(None, None, False)

    def load_robots(self, origin: str) -> RobotFileParser:
        result = self.get(urljoin(origin, "/robots.txt"))
        self.robots = parse_robots(result.body or "")
        return self.robots
