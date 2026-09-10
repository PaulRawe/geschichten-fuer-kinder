#!/usr/bin/env python3
"""
Lernolotl – SEO-Aufräumen
=========================
Behebt die Qualitätsprobleme, die Google von der Indexierung abhalten:

  1. AdSense-Platzhalter entfernen   ("Werbung – Google AdSense Anzeigenblock …")
  2. Branding vereinheitlichen       ("Zauberhafte Kindergeschichten" → "Der Lernolotl")
  3. Tote paypal-spende.js-Einbindung entfernen (Datei existiert nicht mehr → 404)
  4. Doppelte Inhalte entschärfen
       - as1e6/as1e7 enthalten Tom-Episoden → noindex, solange sie Duplikate sind
       - lernolotl/ueber-uns.html ist eine Kopie von ueber-uns.html → löschen
  5. Bilder nach WebP konvertieren und Verweise in den HTML-Seiten umstellen
       (Originale bleiben liegen – nichts geht kaputt, auch keine externen Links)
  6. loading="lazy" für alle Bilder außer dem ersten pro Seite

Idempotent und selbstheilend: kann beliebig oft laufen.
  - Ersetzt du ein PNG durch eine neue Version, wird das WebP neu erzeugt.
  - Schreibst du echte Alex-Episoden 6/7, wird das noindex automatisch entfernt.
  - Stellst du paypal-spende.js wieder her, bleibt die Einbindung unangetastet.
Nicht angefasst: Favicons, og:image, Bilder aus book-config.json und alles
zwischen den LERNOLOTL-BOOK-Markern (sonst Konflikt mit inject_book_links.py).

Aufruf:  python3 scripts/seo_cleanup.py            (schreibt Änderungen)
         python3 scripts/seo_cleanup.py --dry-run  (nur Bericht)
"""

import io
import json
import os
import re
import subprocess
import sys
from collections import Counter, defaultdict
from datetime import date
from pathlib import Path
from urllib.parse import unquote

try:
    from PIL import Image, ImageOps
except ImportError:
    sys.exit("Pillow fehlt:  pip install pillow")

REPO = Path(__file__).resolve().parents[1]
DRY = "--dry-run" in sys.argv
YEAR = date.today().year

SKIP_DIRS = {".git", ".github", "node_modules", "scripts", "workflows"}

# ── Einstellungen WebP ─────────────────────────────────────────────────────
WEBP_MIN_BYTES = 50_000     # kleinere Bilder lohnen sich nicht
WEBP_MAX_EDGE = 1600        # längste Kante in Pixeln (2× für ~800px Anzeige)
WEBP_QUALITY = 80           # Fotos/Illustrationen
WEBP_QUALITY_ALPHA = 85     # Figuren mit transparentem Hintergrund
WEBP_MIN_SAVING = 0.30      # nur umstellen, wenn mind. 30 % kleiner

# ── Duplikate: Seite → Original, von dem sie (noch) eine Kopie ist ──────────
NOINDEX_IF_DUPLICATE = {
    "as1e6.html": "ts1e6.html",
    "as1e7.html": "ts1e7.html",
}
DELETE_IF_DUPLICATE = {
    "lernolotl/ueber-uns.html": "ueber-uns.html",
}
DUPLICATE_THRESHOLD = 0.30  # Anteil gemeinsamer 6-Wort-Folgen

NOINDEX_MARK = "<!-- SEO-CLEANUP: Duplikat -->"
BOOK_BLOCK_RE = re.compile(
    r"<!-- LERNOLOTL-BOOK(?:SHELF)?-START -->.*?<!-- LERNOLOTL-BOOK(?:SHELF)?-END -->", re.S)

stats = Counter()
details = defaultdict(list)


# ═══════════════════════════════════════════════════════════════════════════
# Hilfsfunktionen
# ═══════════════════════════════════════════════════════════════════════════
def html_files():
    for root, dirs, files in os.walk(REPO):
        dirs[:] = sorted(d for d in dirs if d not in SKIP_DIRS)
        for fn in sorted(files):
            if fn.endswith(".html"):
                yield Path(root, fn)


def rel(p: Path) -> str:
    return p.relative_to(REPO).as_posix()


def visible_text(html: str) -> str:
    t = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", html, flags=re.S | re.I)
    t = re.sub(r"<!--.*?-->", " ", t, flags=re.S)
    t = re.sub(r"<[^>]+>", " ", t)
    return re.sub(r"\s+", " ", t).lower()


def similarity(a: str, b: str) -> float:
    def shingles(s):
        w = visible_text(s).split()
        return {" ".join(w[i:i + 6]) for i in range(len(w) - 5)}
    A, B = shingles(a), shingles(b)
    return len(A & B) / len(A | B) if A and B else 0.0


def git_commit_times():
    """{pfad: unix-zeit des letzten Commits}, um geänderte Originalbilder zu erkennen."""
    try:
        out = subprocess.run(
            ["git", "-c", "core.quotepath=off", "log", "--format=@@%ct", "--name-only"],
            cwd=REPO, capture_output=True, text=True, check=True, encoding="utf-8").stdout
    except (subprocess.CalledProcessError, FileNotFoundError):
        return {}
    times, ts = {}, 0
    for line in out.splitlines():
        if line.startswith("@@"):
            ts = int(line[2:])
        elif line.strip():
            times.setdefault(line.strip(), ts)
    return times


def protected_images():
    """Bilder aus book-config.json – die verwaltet inject_book_links.py."""
    cfg = REPO / "scripts" / "book-config.json"
    names = set()
    if cfg.exists():
        try:
            data = json.loads(cfg.read_text(encoding="utf-8"))
            for book in data.get("books", []):
                for v in book.values():
                    if isinstance(v, str) and re.search(r"\.(png|jpe?g)$", v, re.I):
                        names.add(Path(unquote(v)).name.lower())
        except (json.JSONDecodeError, AttributeError):
            pass
    return names


# ═══════════════════════════════════════════════════════════════════════════
# 1–3: Textbereinigung
# ═══════════════════════════════════════════════════════════════════════════
AD_RE = re.compile(
    r'[ \t]*(?:<!--[^>]*?(?:Werbung|AdSense|Anzeige)[^>]*?-->\s*)?'
    r'<div class="ad-container">\s*<div class="ad-label">[^<]*</div>\s*'
    r'<div class="ad-placeholder">[^<]*</div>\s*</div>[ \t]*\n?')

# Bekannte kaputte Verweise: falsch → richtig (nur wenn falsch fehlt und richtig existiert)
LINK_FIXES = {
    "willi2e1.html": "willis2e1.html",
    "tom-und-seine-abenteuer.html": "abenteuer-tom.html",
    "char-familie-oma-hilde.png": "char-freunde-oma-hilde.png",
}

PAYPAL_RE = re.compile(r'[ \t]*<script src="(?:\.\./)?paypal-spende\.js"></script>[ \t]*\n?')

BRAND_RULES = [
    (re.compile(r'(<p class="footer-brand">)\s*Zauberhafte Kindergeschichten\s*(</p>)'),
     r"\1Der Lernolotl\2", "Footer-Marke"),
    (re.compile(r'(<p class="footer-tagline">)\s*Ihre Quelle für liebevoll ausgewählte Kindergeschichten\s*(</p>)'),
     r"\1Pädagogisch aufgewertete Vorlesegeschichten\2", "Footer-Slogan"),
    (re.compile(r"©\s*20\d\d\s+Zauberhafte Kindergeschichten\s*-\s*Alle Rechte vorbehalten"),
     f"© {YEAR} Der Lernolotl – Alle Rechte vorbehalten", "Copyright"),
    (re.compile(r"(<title>[^<]*?)\s+-\s+Zauberhafte Kindergeschichten(</title>)"),
     r"\1 | Der Lernolotl\2", "Seitentitel"),
    (re.compile(r'(content="[^"]*?)\s*-\s*Zauberhafte Kindergeschichten'),
     r"\1 – Der Lernolotl", "Meta-Description"),
]


def clean_text(html: str, path: str) -> str:
    html, n = AD_RE.subn("", html)
    if n:
        stats["Werbe-Platzhalter entfernt"] += n
        stats["Seiten mit Werbe-Platzhaltern"] += 1

    if not (REPO / "paypal-spende.js").exists():
        html, n = PAYPAL_RE.subn("", html)
        if n:
            stats["paypal-spende.js-Einbindungen entfernt"] += n

    for wrong, right in LINK_FIXES.items():
        if (REPO / wrong).exists() or not (REPO / right).exists():
            continue
        html, n = re.subn(r'((?:href|src)="(?:\.\./)?)' + re.escape(wrong) + '"', r"\g<1>" + right + '"', html)
        if n:
            stats["Kaputte Links repariert"] += n
            details["Kaputte Links repariert"].append(f"{path}: {wrong} → {right}")

    for rx, repl, label in BRAND_RULES:
        html, n = rx.subn(repl, html)
        if n:
            stats[f"Branding: {label}"] += n

    if "Zauberhafte Kindergeschichten" in html:
        details["„Zauberhafte Kindergeschichten“ noch vorhanden (bitte manuell prüfen)"].append(path)
    return html


# ═══════════════════════════════════════════════════════════════════════════
# 4: Duplikate
# ═══════════════════════════════════════════════════════════════════════════
ROBOTS_RE = re.compile(r'[ \t]*<meta\s+name="robots"[^>]*>\s*' + re.escape(NOINDEX_MARK) + r'[ \t]*\n?')


def handle_noindex(html: str, path: str) -> str:
    original = NOINDEX_IF_DUPLICATE.get(path)
    if not original or not (REPO / original).exists():
        return html
    sim = similarity(html, (REPO / original).read_text(encoding="utf-8", errors="ignore"))
    marked = NOINDEX_MARK in html
    if sim >= DUPLICATE_THRESHOLD and not marked:
        if re.search(r'<meta\s+name="robots"', html, re.I):
            details["Hat schon ein robots-Meta – nicht verändert"].append(path)
            return html
        tag = f'    <meta name="robots" content="noindex, follow"> {NOINDEX_MARK}\n'
        html, n = re.subn(r"(<meta charset[^>]*>[ \t]*\n)", r"\1" + tag.replace("\\", "\\\\"), html, count=1)
        if n:
            stats["Duplikate auf noindex gesetzt"] += 1
            details["noindex (Duplikat)"].append(f"{path} ≈ {original} ({sim:.0%} gleich)")
    elif sim < DUPLICATE_THRESHOLD and marked:
        html = ROBOTS_RE.sub("", html)
        stats["noindex entfernt (kein Duplikat mehr)"] += 1
        details["noindex entfernt"].append(path)
    return html


def handle_deletions():
    for path, original in DELETE_IF_DUPLICATE.items():
        p, o = REPO / path, REPO / original
        if not (p.exists() and o.exists()):
            continue
        sim = similarity(p.read_text(encoding="utf-8", errors="ignore"),
                         o.read_text(encoding="utf-8", errors="ignore"))
        if sim >= 0.9:
            stats["Doppelte Seiten " + ("zum Löschen vorgesehen" if DRY else "gelöscht")] += 1
            details["Duplikat – " + ("würde gelöscht" if DRY else "gelöscht")].append(f"{path} = {original} ({sim:.0%} gleich)")
            if not DRY:
                subprocess.run(["git", "rm", "-q", "--", path], cwd=REPO, check=False)
                if p.exists():
                    p.unlink()


# ═══════════════════════════════════════════════════════════════════════════
# 5–6: Bilder
# ═══════════════════════════════════════════════════════════════════════════
IMG_ATTR_RE = re.compile(r'(\s(?:src|data-src)=")([^"]+?\.(?:png|jpe?g))(")', re.I)
SRCSET_RE = re.compile(r'(\ssrcset=")([^"]+)(")', re.I)
CSS_URL_RE = re.compile(r"(url\(\s*['\"]?)([^'\")]+?\.(?:png|jpe?g))(['\"]?\s*\))", re.I)
IMG_TAG_RE = re.compile(r"<img\b[^>]*>", re.I)

_webp_cache = {}   # Bildpfad → webp-Pfad oder None
commit_times = {}
protected = set()


def resolve(page: Path, ref: str):
    ref = unquote(ref.split("?")[0].split("#")[0])
    if re.match(r"https?://", ref):
        m = re.match(r"https?://(?:www\.)?lernolotl\.de/(.*)", ref)
        if not m:
            return None
        target = REPO / m.group(1)
    elif ref.startswith("//") or ref.startswith("data:"):
        return None
    elif ref.startswith("/"):
        target = REPO / ref.lstrip("/")
    else:
        target = page.parent / ref
    try:
        target = target.resolve()
        target.relative_to(REPO)
    except (ValueError, OSError):
        return None
    return target if target.is_file() else None


def to_webp(src: Path):
    """Erzeugt/aktualisiert src.webp. Gibt den webp-Pfad zurück oder None."""
    if src in _webp_cache:
        return _webp_cache[src]
    result = None
    name = src.name.lower()
    size = src.stat().st_size
    if (size >= WEBP_MIN_BYTES and not name.startswith(("favicon", "apple-touch-icon"))
            and name not in protected):
        dst = src.with_suffix(".webp")
        r_src, r_dst = rel(src), rel(dst)
        up_to_date = dst.exists() and commit_times.get(r_dst, 1 << 62) >= commit_times.get(r_src, 0)
        if up_to_date:
            result = dst
            stats["WebP bereits aktuell"] += 1
        else:
            try:
                im = Image.open(src)
                im = ImageOps.exif_transpose(im)
                has_alpha = im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info)
                im = im.convert("RGBA" if has_alpha else "RGB")
                if max(im.size) > WEBP_MAX_EDGE:
                    im.thumbnail((WEBP_MAX_EDGE, WEBP_MAX_EDGE), Image.LANCZOS)
                buf = io.BytesIO()
                im.save(buf, "WEBP", quality=WEBP_QUALITY_ALPHA if has_alpha else WEBP_QUALITY, method=6)
                data = buf.getvalue()
                if len(data) <= size * (1 - WEBP_MIN_SAVING):
                    if not DRY:
                        dst.write_bytes(data)
                    result = dst
                    stats["WebP erzeugt"] += 1
                    stats["_bytes_before"] += size
                    stats["_bytes_after"] += len(data)
                else:
                    stats["WebP verworfen (kaum kleiner)"] += 1
            except Exception as e:  # defektes Bild o.ä. → Original behalten
                details["Bild konnte nicht konvertiert werden"].append(f"{r_src}: {e}")
    _webp_cache[src] = result
    return result


def swap_ref(page: Path, ref: str) -> str:
    target = resolve(page, ref)
    if not target:
        return ref
    webp = to_webp(target)
    if not webp:
        return ref
    return re.sub(r"\.(png|jpe?g)$", ".webp", ref, flags=re.I)


def process_images(html: str, page: Path) -> str:
    # Buch-Blöcke vorübergehend ausblenden (verwaltet inject_book_links.py)
    saved = []
    def stash(m):
        saved.append(m.group(0))
        return f"\x00BOOK{len(saved) - 1}\x00"
    html = BOOK_BLOCK_RE.sub(stash, html)

    before = html
    html = IMG_ATTR_RE.sub(lambda m: m.group(1) + swap_ref(page, m.group(2)) + m.group(3), html)
    html = SRCSET_RE.sub(lambda m: m.group(1) + ", ".join(
        " ".join([swap_ref(page, part.split()[0])] + part.split()[1:])
        for part in m.group(2).split(",") if part.strip()) + m.group(3), html)
    html = CSS_URL_RE.sub(lambda m: m.group(1) + swap_ref(page, m.group(2)) + m.group(3), html)
    if html != before:
        stats["Seiten mit umgestellten Bildverweisen"] += 1

    # Lazy Loading: alle <img> außer dem ersten (das ist meist das Titelbild)
    first = [True]
    def lazy(m):
        tag = m.group(0)
        if first[0]:
            first[0] = False
            return tag
        if re.search(r"\sloading=", tag, re.I):
            return tag
        stats["loading=lazy ergänzt"] += 1
        return re.sub(r"^<img\b", '<img loading="lazy" decoding="async"', tag, flags=re.I)
    body_start = re.search(r"<body[^>]*>", html, re.I)
    if body_start:
        i = body_start.end()
        html = html[:i] + IMG_TAG_RE.sub(lazy, html[i:])

    for n, block in enumerate(saved):
        html = html.replace(f"\x00BOOK{n}\x00", block)
    return html


# ═══════════════════════════════════════════════════════════════════════════
def main():
    global commit_times, protected
    commit_times = git_commit_times()
    protected = protected_images()

    handle_deletions()

    changed = 0
    for page in html_files():
        path = rel(page)
        if not page.exists():
            continue
        html = page.read_text(encoding="utf-8", errors="ignore")
        new = clean_text(html, path)
        new = handle_noindex(new, path)
        new = process_images(new, page)
        if new != html:
            changed += 1
            if not DRY:
                page.write_text(new, encoding="utf-8")

    # ── Bericht ────────────────────────────────────────────────────────────
    b, a = stats.pop("_bytes_before", 0), stats.pop("_bytes_after", 0)
    lines = [f"## 🧹 SEO-Aufräumen – {'DRY RUN (nichts geschrieben)' if DRY else 'ausgeführt'}", "",
             f"**Geänderte HTML-Seiten:** {changed}", ""]
    for k, v in sorted(stats.items()):
        lines.append(f"- {k}: **{v}**")
    if b:
        lines.append(f"- Bildgröße der umgestellten Bilder: **{b / 1e6:.1f} MB → {a / 1e6:.1f} MB** "
                     f"({1 - a / b:.0%} kleiner)")
    for k, items in details.items():
        lines += ["", f"### {k}"] + [f"- {i}" for i in items[:40]]
    report = "\n".join(lines)
    print(report)
    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary:
        with open(summary, "a", encoding="utf-8") as f:
            f.write(report + "\n")


if __name__ == "__main__":
    main()
