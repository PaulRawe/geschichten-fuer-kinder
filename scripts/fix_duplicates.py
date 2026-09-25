#!/usr/bin/env python3
"""
Duplikate bereinigen (Weiterleitung statt Doppelseite)
======================================================
Ersetzt doppelte Seiten durch eine kleine Weiterleitungsseite auf die richtige
Version und setzt Hilfsseiten (z. B. Pinterest-Bestätigung) auf noindex.
Einstellungen stehen in scripts/duplikate.json.

Die Weiterleitungsseite enthält:
  - <meta name="robots" content="noindex, follow">  → fällt aus der Sitemap
  - <meta http-equiv="refresh" content="0; url=…">   → Google wertet das wie eine
                                                       dauerhafte Weiterleitung
  - <link href="…" rel="canonical">                  → Reihenfolge der Attribute
    absichtlich so, damit add-canonicals.yml den Tag nicht überschreibt

Schutz, damit nie die aktuelle Version verloren geht
----------------------------------------------------
Eine Doppelseite wird NUR ersetzt, wenn alle Bedingungen erfüllt sind:
  1. Die Zielseite existiert und ist selbst keine Weiterleitungsseite.
  2. Die Zielseite wurde von dir (nicht von einem Bot) mindestens so kürzlich
     geändert wie die Doppelseite. Lädst du eine neuere Fassung versehentlich an
     die falsche Stelle hoch, bleibt sie unangetastet und steht im Bericht.
  3. Beide Seiten sind sich inhaltlich ähnlich genug ("min_aehnlichkeit").
Ist die Doppelseite schon eine Weiterleitung, passiert nichts.
Lädst du die Doppelseite später erneut hoch, wird sie beim nächsten Lauf wieder
geprüft und – falls alles passt – erneut ersetzt.

Aufruf:  python3 scripts/fix_duplicates.py            (schreibt Änderungen)
         python3 scripts/fix_duplicates.py --dry-run  (nur Bericht)
"""

import html as htmllib
import json
import os
import re
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
DRY = "--dry-run" in sys.argv
CONFIG = json.loads((REPO / "scripts" / "duplikate.json").read_text(encoding="utf-8"))

BASE = CONFIG["base_url"].rstrip("/")
BOTS = {b.lower() for b in CONFIG.get("bot_autoren", [])}
MARK = "<!-- DUPLIKAT-WEITERLEITUNG -->"
NOINDEX_MARK = "<!-- DUPLIKAT-NOINDEX -->"

report = {"ersetzt": [], "noindex": [], "uebersprungen": [], "ok": [], "links": []}


def url_of(rel: str) -> str:
    if rel == "index.html":
        return BASE + "/"
    if rel.endswith("/index.html"):
        return f"{BASE}/{rel[:-len('index.html')]}"
    return f"{BASE}/{rel}"


def last_human_change(rel: str):
    """Unix-Zeit + Autor der letzten Änderung durch einen Menschen (Bots zählen nicht)."""
    out = subprocess.run(
        ["git", "-c", "core.quotepath=off", "log", "--format=%ct\t%an", "--", rel],
        cwd=REPO, capture_output=True, text=True, encoding="utf-8").stdout
    fallback = None
    for line in out.splitlines():
        ts, author = line.split("\t", 1)
        fallback = fallback or (int(ts), author)
        if author.strip().lower() not in BOTS:
            return int(ts), author
    return fallback or (0, "?")


def visible_words(html: str):
    t = re.sub(r"(?is)<(script|style)[^>]*>.*?</\1>", " ", html)
    t = re.sub(r"(?s)<!--.*?-->", " ", t)
    t = htmllib.unescape(re.sub(r"<[^>]+>", " ", t))
    return re.sub(r"\s+", " ", t).lower().split()


def similarity(a: str, b: str) -> float:
    def shingles(s):
        w = visible_words(s)
        return {" ".join(w[i:i + 6]) for i in range(len(w) - 5)}
    A, B = shingles(a), shingles(b)
    return len(A & B) / len(A | B) if A and B else 0.0


def title_of(html: str) -> str:
    m = re.search(r"(?is)<title[^>]*>(.*?)</title>", html)
    return htmllib.unescape(re.sub(r"\s+", " ", m.group(1)).strip()) if m else ""


def stub(target_url: str, title: str) -> str:
    t = htmllib.escape(title or "Neue Adresse", quote=False)
    u = htmllib.escape(target_url, quote=True)
    return f"""<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
{MARK}
<meta name="robots" content="noindex, follow">
<title>{t}</title>
<link href="{u}" rel="canonical">
<meta http-equiv="refresh" content="0; url={u}">
<meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family:sans-serif;padding:2em">
<p>Diese Seite ist umgezogen: <a href="{u}">{t}</a></p>
</body>
</html>
"""


def handle_pair(p: dict):
    dup, ziel = p["duplikat"], p["ziel"]
    minsim = float(p.get("min_aehnlichkeit", 0.8))
    dpath, zpath = REPO / dup, REPO / ziel
    if not dpath.exists():
        report["ok"].append(f"`{dup}` existiert nicht (mehr) – nichts zu tun")
        return
    dhtml = dpath.read_text(encoding="utf-8", errors="ignore")
    if MARK in dhtml:
        if not zpath.exists():
            report["uebersprungen"].append(f"`{dup}` leitet auf `{ziel}` weiter, aber das Ziel fehlt! Bitte prüfen.")
        else:
            report["ok"].append(f"`{dup}` → `{ziel}` ist bereits eine Weiterleitung")
        return
    if not zpath.exists():
        report["uebersprungen"].append(f"`{dup}`: Ziel `{ziel}` fehlt – nicht angefasst")
        return
    zhtml = zpath.read_text(encoding="utf-8", errors="ignore")
    if MARK in zhtml:
        report["uebersprungen"].append(f"`{dup}`: Ziel `{ziel}` ist selbst eine Weiterleitung – nicht angefasst")
        return

    d_ts, d_by = last_human_change(dup)
    z_ts, z_by = last_human_change(ziel)
    if d_ts > z_ts:
        report["uebersprungen"].append(
            f"`{dup}` wurde NACH `{ziel}` geändert ({d_by}) – das ist womöglich die aktuellere "
            f"Fassung. Nicht angefasst. Bitte die neue Version nach `{ziel}` hochladen.")
        return
    sim = similarity(dhtml, zhtml)
    if sim < minsim:
        report["uebersprungen"].append(
            f"`{dup}` ist `{ziel}` nur zu {sim:.0%} ähnlich (Schwelle {minsim:.0%}) – nicht angefasst")
        return

    report["ersetzt"].append(f"`{dup}` → `{ziel}` ({sim:.0%} ähnlich, Ziel ist aktueller oder gleich alt)")
    if not DRY:
        dpath.write_text(stub(url_of(ziel), title_of(zhtml)), encoding="utf-8")


def handle_noindex(rel: str):
    path = REPO / rel
    if not path.exists():
        return
    html = path.read_text(encoding="utf-8", errors="ignore")
    if re.search(r'<meta[^>]+name=["\']robots["\'][^>]*noindex', html, re.I):
        report["ok"].append(f"`{rel}` ist bereits noindex")
        return
    tag = f'<meta name="robots" content="noindex"> {NOINDEX_MARK}'
    new, n = re.subn(r"(?i)(<head[^>]*>)", lambda m: m.group(1) + "\n" + tag, html, count=1)
    if not n:
        report["uebersprungen"].append(f"`{rel}`: kein <head> gefunden – nicht angefasst")
        return
    report["noindex"].append(f"`{rel}`")
    if not DRY:
        path.write_text(new, encoding="utf-8")


def remaining_links():
    """Meldet Seiten, die noch auf eine (künftige) Weiterleitungsseite verlinken."""
    host = re.escape(re.sub(r"^https?://(www\.)?", "", BASE))
    dups = {p["duplikat"]: p["ziel"] for p in CONFIG.get("paare", [])}
    for root, dirs, files in os.walk(REPO):
        dirs[:] = [d for d in dirs if d not in {".git", ".github", "node_modules"}]
        for fn in files:
            if not fn.endswith(".html"):
                continue
            f = Path(root, fn)
            rel = f.relative_to(REPO).as_posix()
            if rel in dups:
                continue
            for h in set(re.findall(r'href=["\']([^"\'#?]+)', f.read_text(encoding="utf-8", errors="ignore"))):
                m = re.match(r"https?://(?:www\.)?" + host + r"/?(.*)", h)
                if m:
                    tgt = m.group(1)
                elif h.startswith("/"):
                    tgt = h[1:]
                elif re.match(r"^[a-z]+:", h):
                    continue
                else:
                    tgt = os.path.normpath(os.path.join(os.path.dirname(rel), h))
                if tgt.endswith("/") or tgt in ("", "."):
                    tgt = os.path.join(tgt, "index.html")
                tgt = os.path.normpath(tgt).replace("\\", "/")
                if tgt in dups:
                    report["links"].append(f"`{rel}` verlinkt noch `{h}` → besser direkt auf `{dups[tgt]}`")


def main():
    for p in CONFIG.get("paare", []):
        handle_pair(p)
    for rel in CONFIG.get("noindex", []):
        handle_noindex(rel)
    remaining_links()

    titles = {
        "ersetzt": "Durch Weiterleitung ersetzt" + (" (Dry Run – nicht geschrieben)" if DRY else ""),
        "noindex": "Auf noindex gesetzt" + (" (Dry Run)" if DRY else ""),
        "uebersprungen": "⚠️ Nicht angefasst – bitte prüfen",
        "links": "Hinweis: interne Links auf Weiterleitungsseiten",
        "ok": "Bereits in Ordnung",
    }
    lines = [f"## 🔁 Duplikate bereinigen – {'DRY RUN' if DRY else 'ausgeführt'}"]
    for key, head in titles.items():
        if report[key]:
            lines += ["", f"### {head}"] + [f"- {x}" for x in report[key]]
    out = "\n".join(lines)
    print(out)
    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary:
        with open(summary, "a", encoding="utf-8") as fh:
            fh.write(out + "\n")


if __name__ == "__main__":
    main()
