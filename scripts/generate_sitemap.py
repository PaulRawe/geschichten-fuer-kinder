#!/usr/bin/env python3
"""
Lernolotl – Sitemap-Generator
=============================
Erzeugt sitemap.xml aus allen HTML-Seiten des Repos.

Unterschied zur alten Version:
- <lastmod> ist das Datum der letzten ECHTEN inhaltlichen Änderung der Datei
  (letzter Commit von dir, nicht von einem GitHub-Actions-Bot). Automatische
  Massen-Commits (Canonicals, Favicons, Querverlinkung, Aufräumen) zählen nicht,
  sonst hätten wieder alle Seiten dasselbe Datum.
- Seiten mit <meta name="robots" content="noindex..."> werden automatisch
  ausgelassen (Google mag keine noindex-Seiten in der Sitemap).
- <changefreq> und <priority> entfallen: Google ignoriert beide Angaben.

Voraussetzung: vollständige Git-Historie (actions/checkout mit fetch-depth: 0).
"""

import os
import re
import subprocess
import sys
from datetime import date
from pathlib import Path
from urllib.parse import quote

REPO = Path(__file__).resolve().parents[1]
BASE_URL = "https://www.lernolotl.de"

EXCLUDE_NAMES = ("googlebe", "datenschutz", "impressum", "cookie-richtlinie",
                 "kontakt", "pinterest-caf74")
EXCLUDE_DIRS = {".git", ".github", "node_modules", "bilder", "ratgeberbilder", "scripts", "workflows"}
BOT_AUTHORS = {"github actions", "github-actions", "github-actions[bot]"}

NOINDEX_RE = re.compile(r'<meta\s+name=["\']robots["\']\s+content=["\'][^"\']*noindex', re.I)


def git_dates():
    """Liefert {pfad: (letztes_datum_mensch, letztes_datum_egal_wer)}."""
    try:
        out = subprocess.run(
            ["git", "-c", "core.quotepath=off", "log", "--format=@@%an|%cs", "--name-only"],
            cwd=REPO, capture_output=True, text=True, check=True, encoding="utf-8",
        ).stdout
    except (subprocess.CalledProcessError, FileNotFoundError):
        return {}
    human, anyone = {}, {}
    author, day = "", ""
    for line in out.splitlines():
        if line.startswith("@@"):
            author, day = line[2:].rsplit("|", 1)
            continue
        path = line.strip()
        if not path:
            continue
        anyone.setdefault(path, day)          # git log ist neueste zuerst
        if author.strip().lower() not in BOT_AUTHORS:
            human.setdefault(path, day)
    return {p: (human.get(p), anyone[p]) for p in anyone}


def collect_pages():
    pages = []
    for root, dirs, files in os.walk(REPO):
        dirs[:] = sorted(d for d in dirs if d not in EXCLUDE_DIRS)
        for fn in sorted(files):
            if not fn.endswith(".html"):
                continue
            rel = Path(root, fn).relative_to(REPO).as_posix()
            if any(ex in rel for ex in EXCLUDE_NAMES):
                continue
            try:
                head = Path(root, fn).read_text(encoding="utf-8", errors="ignore")[:20000]
            except OSError:
                continue
            if NOINDEX_RE.search(head):
                continue
            pages.append(rel)
    return pages


def page_url(rel):
    if rel == "index.html":
        return BASE_URL + "/"
    if rel.endswith("/index.html"):
        return f"{BASE_URL}/{quote(rel[:-len('index.html')], safe='/:.-_~')}"
    return f"{BASE_URL}/{quote(rel, safe='/:.-_~')}"


def main():
    dates = git_dates()
    today = date.today().isoformat()
    pages = collect_pages()

    lines = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    fallback = 0
    for rel in pages:
        human, anyone = dates.get(rel, (None, None))
        lastmod = human or anyone
        if not lastmod:
            lastmod, fallback = today, fallback + 1
        lines += ["  <url>",
                  f"    <loc>{page_url(rel)}</loc>",
                  f"    <lastmod>{lastmod}</lastmod>",
                  "  </url>"]
    lines.append("</urlset>")
    (REPO / "sitemap.xml").write_text("\n".join(lines) + "\n", encoding="utf-8")

    distinct = len({l for l in lines if "<lastmod>" in l})
    print(f"✅ sitemap.xml: {len(pages)} URLs, {distinct} verschiedene lastmod-Daten"
          + (f", {fallback} ohne Git-Historie (heutiges Datum)" if fallback else ""))
    if not dates:
        print("⚠️  Keine Git-Historie gefunden – fetch-depth: 0 im Checkout gesetzt?", file=sys.stderr)


if __name__ == "__main__":
    main()
