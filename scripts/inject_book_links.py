#!/usr/bin/env python3
"""
Lernolotl – Book Link Injector
================================
Liest scripts/book-config.json und:

1. Fügt auf jeder passenden lernolotls-welt-*.html Seite eine "Jetzt als Buch"-Box
   ein (zwischen <!-- LERNOLOTL-BOOK-START --> / -END --> Markern, direkt vor dem
   bestehenden "Weitere Welten"-Block bzw. vor dem Footer).
2. Tauscht auf lernolotls-welt.html die Maskottchen-Icons in den Story-Cards gegen
   die echten Buchcover aus.
3. Fügt auf lernolotls-welt.html ein kompaktes "Bücherregal" mit allen Büchern
   (inkl. Schulstarter-Heft, das keine eigene Seite hat) ein.

Idempotent: mehrfaches Ausführen überschreibt nur den Inhalt zwischen den Markern
bzw. lässt bereits getauschte Bilder unangetastet. Sicher als GitHub Action nutzbar.
"""

import json
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = Path(__file__).resolve().parent / "book-config.json"

BOOK_START = "<!-- LERNOLOTL-BOOK-START -->"
BOOK_END = "<!-- LERNOLOTL-BOOK-END -->"
SHELF_START = "<!-- LERNOLOTL-BOOKSHELF-START -->"
SHELF_END = "<!-- LERNOLOTL-BOOKSHELF-END -->"

RELATED_START = "<!-- LERNOLOTL-RELATED-START -->"


def render_book_box(book: dict) -> str:
    return f"""{BOOK_START}
<style>
.ll-book-box{{max-width:900px;margin:0 auto 28px;padding:0;background:#fff;border-radius:24px;
box-shadow:0 12px 40px rgba(0,0,0,0.08);overflow:hidden;display:flex;align-items:center;
font-family:'Nunito','Segoe UI',Verdana,sans-serif;}}
.ll-book-cover{{flex-shrink:0;width:150px;background:#111;display:flex;align-items:center;
justify-content:center;padding:20px;}}
.ll-book-cover img{{width:100%;border-radius:6px;box-shadow:0 6px 18px rgba(0,0,0,0.35);display:block;}}
.ll-book-info{{padding:26px 30px;}}
.ll-book-label{{display:inline-block;background:#232f3e;color:#fff;font-size:.72em;font-weight:800;
text-transform:uppercase;letter-spacing:.05em;padding:5px 12px;border-radius:14px;margin-bottom:10px;}}
.ll-book-title{{font-family:'Fredoka One',cursive;font-size:1.3em;color:#232f3e;margin-bottom:6px;
line-height:1.25;}}
.ll-book-desc{{color:#555;font-size:.92em;line-height:1.5;margin-bottom:14px;max-width:520px;}}
.ll-book-btn{{display:inline-flex;align-items:center;gap:6px;background:#ff9900;color:#111;
font-weight:800;font-size:.92em;padding:10px 20px;border-radius:24px;text-decoration:none;
transition:transform .2s;}}
.ll-book-btn:hover{{transform:translateY(-2px);}}
@media (max-width:600px){{.ll-book-box{{flex-direction:column;}}.ll-book-cover{{width:100%;padding:24px;}}}}
</style>
<section class="ll-book-box">
  <div class="ll-book-cover"><img src="{book['cover']}" alt="Buchcover: {book['title']}" loading="lazy"></div>
  <div class="ll-book-info">
    <div class="ll-book-label">📖 Jetzt als Buch</div>
    <h3 class="ll-book-title">{book['title']}</h3>
    <p class="ll-book-desc">{book['blurb']}</p>
    <a href="{book['amazon']}" class="ll-book-btn" target="_blank" rel="noopener sponsored">Bei Amazon ansehen →</a>
  </div>
</section>
{BOOK_END}"""


def upsert_between_markers(html: str, start: str, end: str, block: str, anchor: str | None) -> str:
    pattern = re.compile(re.escape(start) + r".*?" + re.escape(end), re.DOTALL)
    if pattern.search(html):
        return pattern.sub(block, html)
    if anchor and anchor in html:
        return html.replace(anchor, block + "\n\n" + anchor, 1)
    if "<footer>" in html:
        return html.replace("<footer>", block + "\n\n<footer>", 1)
    return html + "\n" + block


def inject_book_box(book: dict) -> bool:
    page_path = REPO_ROOT / book["page"]
    if not page_path.exists():
        print(f"  [SKIP] {book['page']} nicht gefunden")
        return False
    html = page_path.read_text(encoding="utf-8")
    new_html = upsert_between_markers(html, BOOK_START, BOOK_END, render_book_box(book), RELATED_START)
    if new_html != html:
        page_path.write_text(new_html, encoding="utf-8")
        print(f"  [OK] Buch-Box aktualisiert: {book['page']}")
        return True
    print(f"  [--] Keine Änderung: {book['page']}")
    return False


def inject_story_pages(book: dict) -> int:
    """Fügt die Buch-Box auf JEDER einzelnen Geschichtenseite der passenden Welt ein
    (z.B. sport-geschichte-1-schwimmen.html, sport-geschichte-2-verlieren.html, ...)."""
    prefix = book.get("story_prefix")
    if not prefix:
        return 0
    lernolotl_dir = REPO_ROOT / "lernolotl"
    pages = sorted(lernolotl_dir.glob(f"{prefix}*.html"))
    if not pages:
        print(f"  [WARN] Keine Geschichtenseiten für Prefix '{prefix}' gefunden")
        return 0
    changed = 0
    block = render_book_box(book)
    for page_path in pages:
        html = page_path.read_text(encoding="utf-8")
        new_html = upsert_between_markers(html, BOOK_START, BOOK_END, block, RELATED_START)
        if new_html != html:
            page_path.write_text(new_html, encoding="utf-8")
            changed += 1
    print(f"  [OK] {changed}/{len(pages)} Geschichtenseiten aktualisiert (Prefix: {prefix})")
    return changed


def render_bookshelf(books: list[dict]) -> str:
    items = []
    for b in books:
        items.append(f"""    <a href="{b['amazon']}" class="ll-shelf-item" target="_blank" rel="noopener sponsored">
      <img src="{b['cover']}" alt="Cover: {b['title']}" loading="lazy">
      <span class="ll-shelf-title">{b['title']}</span>
      <span class="ll-shelf-cta">Bei Amazon →</span>
    </a>""")
    items_html = "\n".join(items)
    return f"""{SHELF_START}
<style>
.ll-shelf-section{{background:#fff;border-radius:32px;padding:40px;box-shadow:0 12px 40px rgba(61,95,117,0.15);
margin-bottom:28px;font-family:'Nunito',sans-serif;}}
.ll-shelf-grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:16px;margin-top:24px;}}
.ll-shelf-item{{display:flex;flex-direction:column;align-items:center;text-align:center;
background:#e8f4f8;border:1.5px solid #a8c5d9;border-radius:18px;padding:16px 12px;
text-decoration:none;color:inherit;transition:all .25s;}}
.ll-shelf-item:hover{{background:#fff;border-color:#5a7d95;transform:translateY(-4px);
box-shadow:0 10px 26px rgba(90,125,149,0.2);}}
.ll-shelf-item img{{width:72px;border-radius:6px;box-shadow:0 6px 16px rgba(0,0,0,0.2);margin-bottom:10px;}}
.ll-shelf-title{{font-family:'Fredoka One',cursive;color:#3d5f75;font-size:.88em;line-height:1.25;margin-bottom:6px;}}
.ll-shelf-cta{{font-size:.75em;font-weight:800;color:#c45d00;}}
</style>
<section class="ll-shelf-section fade-in">
  <span class="section-label">📚 Zum Vorlesen &amp; Behalten</span>
  <h2 class="section-title">Alle Bücher auf einen Blick</h2>
  <p class="section-intro">Die Geschichten gibt's auch gedruckt – zum Mitnehmen, Verschenken und Vorlesen ganz ohne Bildschirm.</p>
  <div class="ll-shelf-grid">
{items_html}
  </div>
</section>
{SHELF_END}"""


def update_welt_page(books: list[dict]) -> bool:
    welt_path = REPO_ROOT / "lernolotl" / "lernolotls-welt.html"
    if not welt_path.exists():
        print("  [SKIP] lernolotls-welt.html nicht gefunden")
        return False
    html = welt_path.read_text(encoding="utf-8")
    original = html

    # 1) Avatare in den Story-Cards durch echte Buchcover ersetzen
    for b in books:
        old = b.get("welt_avatar_old")
        if not old:
            continue
        if old in html:
            html = html.replace(old, b["cover"])
            print(f"  [OK] Avatar getauscht: {old} → {b['cover']}")
        elif b["cover"] not in html:
            print(f"  [WARN] Avatar '{old}' nicht gefunden (evtl. schon getauscht)")

    # Kreis-Avatare -> abgerundete Rechtecke (Buchcover statt Portraitfoto)
    html = html.replace(
        ".story-avatar {\n            width: 64px; height: 64px;\n            border-radius: 50%;",
        ".story-avatar {\n            width: 64px; height: 64px;\n            border-radius: 12px;",
    )

    # 2) Bücherregal-Sektion einfügen (vor der quicklink-row)
    shelf_block = render_bookshelf(books)
    anchor = '<div class="quicklink-row">'
    html = upsert_between_markers(html, SHELF_START, SHELF_END, shelf_block, anchor)

    if html != original:
        welt_path.write_text(html, encoding="utf-8")
        print("  [OK] lernolotls-welt.html aktualisiert")
        return True
    print("  [--] Keine Änderung: lernolotls-welt.html")
    return False


def main() -> int:
    config = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    books = config["books"]

    print("== Buch-Boxen auf Themenseiten (Welt-Hub je Kategorie) ==")
    any_change = False
    for b in books:
        if b.get("page"):
            any_change |= inject_book_box(b)

    print("\n== Buch-Boxen auf einzelnen Geschichtenseiten ==")
    for b in books:
        any_change |= inject_story_pages(b) > 0

    print("\n== Lernolotls Welt (Cover-Tausch + Bücherregal) ==")
    any_change |= update_welt_page(books)

    print("\nFertig." if any_change else "\nKeine Änderungen nötig (bereits aktuell).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
