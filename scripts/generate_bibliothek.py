#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Baut die statischen Themenseiten der Bibliothek neu.

Warum es dieses Skript gibt
---------------------------
Die Seiten unter  bibliothek/<thema>/index.html  waren von Hand geschrieben.
Sie zeigten pro Thema hoechstens zwoelf Geschichten und waren ein eingefrorener
Stand: Jede neue Geschichte in produkte.json tauchte dort nie auf. Dadurch
standen zum Beispiel von fuenf Wut-Geschichten nur eine auf der Gefuehle-Seite.

Dieses Skript erzeugt die Seiten stattdessen aus den Daten:

  bibliothek/produkte.json      Geschichten und Produkte (die einzige Quelle)
  bibliothek/themen-texte.json  Titel, Beschreibung, Einleitung je Thema

Kostenlose Geschichten werden VOLLSTAENDIG ausgegeben - das ist der eigentliche
Sinn der Seite. Buecher und Materialien bleiben gedeckelt (sonst stuenden auf
der Gefuehle-Seite 122 Kaufkarten), mit Link in die durchsuchbare Bibliothek.

Aufruf
------
    python3 scripts/generate_bibliothek.py            # schreibt die Seiten
    python3 scripts/generate_bibliothek.py --pruefen  # meldet nur Abweichungen

Vertraeglichkeit mit den anderen Skripten
-----------------------------------------
Die Produktbilder werden in denselben Markern  <!-- pbild --> ... <!-- /pbild -->
ausgegeben, die  scripts/etsy_bilder.py  setzt, und nur dann, wenn die Bilddatei
wirklich im Repo liegt. Ein Lauf von etsy_bilder.py nach diesem Skript aendert
darum nichts mehr.
"""

import argparse
import json
import os
import re
import sys

JSON_PFAD  = "bibliothek/produkte.json"
TEXTE_PFAD = "bibliothek/themen-texte.json"
THEMEN_DIR = "bibliothek"
BASIS_URL  = "https://www.lernolotl.de"

BREITE = HOEHE = 400
MARK_A, MARK_E = "<!-- pbild -->", "<!-- /pbild -->"

# Kostenlose Geschichten: alle. Kaufbares: gedeckelt, mit Link auf die Suche.
MAX_BUCH = 12
MAX_PDF  = 12


# --------------------------------------------------------------------------- Hilfen
def esc(text):
    """HTML-Escape fuer Inhalte, die aus der JSON kommen."""
    return (str(text or "")
            .replace("&", "&amp;").replace("<", "&lt;")
            .replace(">", "&gt;").replace('"', "&quot;"))


def sortierschluessel(titel):
    """Alphabetisch, aber Zahlen numerisch: Episode 2 steht vor Episode 10."""
    teile = re.split(r"(\d+)", titel.lower())
    return [int(t) if t.isdigit() else t for t in teile]


def bild_tag(bildpfad, unterschrift=""):
    """Bild nur ausgeben, wenn die Datei wirklich existiert - sonst tote Pfade.

    Die Bildunterschrift steht INNERHALB der Marker. Das ist kein Schoenheits-
    detail: scripts/geschichten_bilder.py ersetzt den Block zwischen den
    Markern komplett. Stuende die Unterschrift ausserhalb, schriebe jedes
    Skript sie an seine Stelle und sie erschiene doppelt.
    """
    if not bildpfad or not os.path.exists(bildpfad.lstrip("/")):
        return ""
    unter = ('<p class="bildunter">%s</p>' % esc(unterschrift)) if unterschrift else ""
    return ('%s<img class="pbild" src="%s" alt="" width="%d" height="%d" '
            'loading="lazy" decoding="async">%s%s\n'
            % (MARK_A, esc(bildpfad), BREITE, HOEHE, unter, MARK_E))


def kuerzen(text, grenze=158):
    """Meta-Description auf Wortgrenze kuerzen statt mitten im Satz abzuschneiden."""
    text = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", text or "")).strip()
    if len(text) <= grenze:
        return text
    return text[:grenze].rsplit(" ", 1)[0].rstrip(" ,;:—-") + " …"


# --------------------------------------------------------------------------- Karten
def karte_geschichte(s):
    b = bild_tag(s.get("bild"), s.get("bildunter", ""))
    # data-suche traegt den Text, nach dem der Seitenfilter sucht.
    such = esc(" ".join([s.get("titel", ""), s.get("kurz", "")]).lower())
    return ('<article class="produkt" data-suche="%s">\n%s'
            '<div class="kopf"><span class="tag frei">Kostenlos lesen</span></div>\n'
            '<h4>%s</h4>\n<p class="kurz">%s</p>\n'
            '<div class="kauf"><a class="btn lesen" href="%s">Geschichte lesen</a></div>\n'
            '</article>'
            % (such, b, esc(s["titel"]), esc(s.get("kurz", "")), esc(s["pfad"])))


def karte_produkt(p):
    tag = ('<span class="tag buch">Buch</span>' if p.get("typ") == "buch"
           else '<span class="tag pdf">PDF zum Ausdrucken</span>')
    if p.get("alter"):
        tag += ('<span class="tag meta">%s%s</span>'
                % (esc(p["alter"]), " Jahren" if str(p["alter"]).startswith("ab") else " Jahre"))
    if p.get("reihe"):
        band = (" &middot; Band %s" % esc(p["band"])) if p.get("band") else ""
        tag += '<span class="tag meta">%s%s</span>' % (esc(p["reihe"]), band)

    knoepfe = ""
    if p.get("seite"):
        knoepfe += ('<!-- buchseite --><a class="btn buchseite" href="%s">Mehr zum Buch</a>'
                    '<!-- /buchseite -->' % esc(p["seite"]))
    if p.get("amazon"):
        knoepfe += ('<a class="btn amazon" href="%s" target="_blank" rel="noopener sponsored">'
                    'Bei Amazon ansehen</a>' % esc(p["amazon"]))
    if p.get("etsy"):
        knoepfe += ('<a class="btn etsy" href="%s" target="_blank" rel="noopener sponsored">'
                    'Auf Etsy ansehen</a>' % esc(p["etsy"]))

    such = esc(" ".join([p.get("titel", ""), p.get("kurz", "")]).lower())
    return ('<article class="produkt" data-suche="%s">\n%s'
            '<div class="kopf">%s</div>\n<h4>%s</h4>\n<p class="kurz">%s</p>\n'
            '<div class="kauf">%s</div>\n</article>'
            % (such, bild_tag(p.get("bild")), tag,
               esc(p["titel"]), esc(p.get("kurz", "")), knoepfe))


# --------------------------------------------------------------------------- Seite
KOPF = """<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<title>{title}</title>
<meta name="description" content="{beschreibung}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="{basis}/bibliothek/{key}/">
<meta property="og:type" content="website">
<meta property="og:url" content="{basis}/bibliothek/{key}/">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{beschreibung}">
<meta property="og:locale" content="de_DE">
<meta name="twitter:card" content="summary_large_image">
<link rel="stylesheet" href="/consent.css">
<link rel="stylesheet" href="/bibliothek/bibliothek.css">
</head>
<body>
<div class="container">
<a class="skip-link" href="#inhalt">Zum Inhalt springen</a>
{ldjson}
<p class="krumen"><a href="/index.html">Startseite</a> &rsaquo; <a href="/bibliothek/">Bibliothek</a> &rsaquo; {label}</p>
<header class="bib-head">
<h1>{headline}</h1>
<p class="sub">{label}</p>
</header>
<main id="inhalt">
<section class="card">
<p class="intro">{intro}</p>
</section>
"""

FUSS = """</main>
<footer>
  <p class="footer-brand">Der Lernolotl</p>
  <p class="footer-tagline">Pädagogisch aufgewertete Vorlesegeschichten</p>
  <div class="footer-links">
    <a href="/index.html">Startseite</a>
    <a href="/bibliothek/">Bibliothek</a>
    <a href="/buecher/">Bücher</a>
    <a href="/impressum.html">Impressum</a>
    <a href="/datenschutz.html">Datenschutz</a>
    <a href="/cookie-richtlinie.html">Cookie-Richtlinie</a>
    <a href="/kontakt.html">Kontakt</a>
  </div>
  <div class="footer-info"><p>&copy; 2026 Der Lernolotl &ndash; Alle Rechte vorbehalten</p></div>
</footer>
</div>

<div id="cookieBanner" class="cookie-banner">
  <div class="cookie-content">
    <div class="cookie-text">
      <strong>&#127850; Wir verwenden Cookies</strong><br>
      Diese Website nutzt eine anonyme, cookiefreie Reichweitenmessung. Werbe- oder Tracking-Cookies werden nicht gesetzt. Weitere Informationen finden Sie in unserer <a href="/datenschutz.html">Datenschutzerkl&auml;rung</a>.
    </div>
    <div class="cookie-buttons">
      <button class="cookie-btn cookie-accept" onclick="acceptCookies()">Alle akzeptieren</button>
      <button class="cookie-btn cookie-decline" onclick="declineCookies()">Nur notwendige</button>
    </div>
  </div>
</div>
<script>
  function showCookieBanner(){ if(!localStorage.getItem('cookieConsent')) document.getElementById('cookieBanner').classList.add('show'); }
  function acceptCookies(){ localStorage.setItem('cookieConsent','accepted'); document.getElementById('cookieBanner').classList.remove('show'); }
  function declineCookies(){ localStorage.setItem('cookieConsent','declined'); document.getElementById('cookieBanner').classList.remove('show'); }
  window.addEventListener('load', showCookieBanner);
</script>
<script src="/cookies.js"></script>
<script src="/bibliothek/bibliothek.js"></script>
</body>
</html>
"""

WERBEHINWEIS = ('<p class="werbehinweis"><strong>Anzeige:</strong> Diese Seite stellt eigene '
                'B&uuml;cher und Materialien vor. Die Links f&uuml;hren zu Amazon und Etsy; beim '
                'Kauf dort erhalten wir eine Verg&uuml;tung. F&uuml;r dich &auml;ndert sich der '
                'Preis dadurch nicht. Die Geschichten auf dieser Website bleiben kostenlos.</p>')


def seite_bauen(thema, texte, geschichten, produkte, alle_themen):
    key, label = thema["key"], thema["label"]
    t = texte.get(key, {})

    frei = sorted([g for g in geschichten if key in g.get("themen", [])],
                  key=lambda g: sortierschluessel(g["titel"]))
    buecher = [p for p in produkte if p.get("typ") == "buch" and key in p.get("themen", [])]
    pdfs    = [p for p in produkte if p.get("typ") == "pdf"  and key in p.get("themen", [])]

    beschreibung = t.get("description") or ""
    # Von Hand abgeschnittene Beschreibungen ("… die …") sauber neu bilden.
    if not beschreibung or beschreibung.rstrip().endswith(("…", "...")):
        beschreibung = kuerzen(t.get("intro") or thema.get("headline", ""))

    ldjson = json.dumps({
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": "%s – Lernolotl Bibliothek" % label,
        "url": "%s/bibliothek/%s/" % (BASIS_URL, key),
        "description": re.sub(r"<[^>]+>", "", t.get("intro") or ""),
        "inLanguage": "de-DE",
        "isPartOf": {"@type": "WebSite", "name": "Der Lernolotl", "url": BASIS_URL + "/"},
    }, ensure_ascii=False)

    teile = [KOPF.format(
        title=t.get("title") or "%s | Der Lernolotl" % label,
        beschreibung=esc(beschreibung), basis=BASIS_URL, key=key,
        label=label, headline=thema.get("headline", label),
        intro=t.get("intro", ""),
        ldjson='<script type="application/ld+json">%s</script>' % ldjson,
    )]

    # ---- kostenlose Geschichten: vollstaendig ----
    if frei:
        teile.append(
            '<section class="card">\n'
            '<h2>Kostenlose Geschichten zum Thema</h2>\n'
            '<p>Diese Geschichten kannst du sofort lesen oder vorlesen &ndash; ohne Anmeldung, '
            'ohne Kosten. <strong>%d Geschichten</strong> sind es zu diesem Thema &ndash; '
            'alle stehen hier.</p>\n'
            '<div class="seitenfilter">\n'
            '<label for="seitenfilter" class="skip-link">Auf dieser Seite suchen</label>\n'
            '<input type="search" id="seitenfilter" placeholder="Auf dieser Seite suchen &ndash; '
            'z.&nbsp;B. Wut, Angst, Einschlafen &hellip;" autocomplete="off">\n'
            '<p id="seitenfilter-zahl" role="status"></p>\n'
            '</div>\n'
            '<div class="produkte">%s</div>\n'
            '</section>\n' % (len(frei), "".join(karte_geschichte(g) for g in frei)))

    # ---- Kaufbares: gedeckelt ----
    if buecher or pdfs:
        teile.append('<section class="card">' + WERBEHINWEIS)
        if buecher:
            sicht = buecher[:MAX_BUCH]
            teile.append('<h2>Passende B&uuml;cher</h2><div class="produkte">%s</div>'
                         % "".join(karte_produkt(p) for p in sicht))
            if len(buecher) > len(sicht):
                teile.append('<p style="margin-top:14px;"><a href="/bibliothek/?thema=%s&amp;typ=buch">'
                             'Alle %d B&uuml;cher zu diesem Thema</a></p>' % (key, len(buecher)))
        if pdfs:
            sicht = pdfs[:MAX_PDF]
            teile.append('<h3>Materialien zum Ausdrucken</h3><div class="produkte">%s</div>'
                         % "".join(karte_produkt(p) for p in sicht))
            if len(pdfs) > len(sicht):
                teile.append('<p style="margin-top:14px;"><a href="/bibliothek/?thema=%s&amp;typ=pdf">'
                             'Alle %d Materialien zu diesem Thema</a></p>' % (key, len(pdfs)))
        teile.append('</section>')

    # ---- verwandte Themen ----
    verwandt = [k for k in t.get("verwandt", []) if k in alle_themen and k != key]
    if verwandt:
        teile.append('<section class="card"><h2>Verwandte Themen</h2><div class="verwandt">%s</div>'
                     '</section>\n'
                     % "".join('<a href="/bibliothek/%s/">%s</a>' % (k, esc(alle_themen[k]))
                               for k in verwandt))

    teile.append(FUSS)
    return "".join(teile)


# --------------------------------------------------------------------------- Uebersicht
def kacheln_aktualisieren(pfad, themen, geschichten, produkte):
    """Setzt die Zahlen im Themen-Gitter der Bibliotheks-Startseite neu."""
    if not os.path.exists(pfad):
        return False
    text = open(pfad, encoding="utf-8").read()
    kacheln = []
    for t in themen:
        key = t["key"]
        n_frei = sum(1 for g in geschichten if key in g.get("themen", []))
        n_kauf = sum(1 for p in produkte if key in p.get("themen", []))
        kacheln.append(
            '<a class="themen-kachel" href="/bibliothek/%s/"><div class="name">%s</div>'
            '<div class="anz">%d B&uuml;cher &amp; Materialien &middot; %s</div></a>'
            % (key, esc(t["label"]), n_kauf,
               "1 kostenlose Geschichte" if n_frei == 1 else "%d kostenlose Geschichten" % n_frei))
    neu = re.sub(r'(<div class="themen-gitter">).*?(</div>\s*</section>)',
                 lambda m: m.group(1) + "".join(kacheln) + m.group(2),
                 text, count=1, flags=re.S)
    if neu == text:
        return False
    open(pfad, "w", encoding="utf-8").write(neu)
    return True


# --------------------------------------------------------------------------- Ablauf
def main():
    p = argparse.ArgumentParser()
    p.add_argument("--pruefen", action="store_true",
                   help="nichts schreiben, nur melden, welche Seiten abweichen")
    args = p.parse_args()

    daten = json.load(open(JSON_PFAD, encoding="utf-8"))
    texte = json.load(open(TEXTE_PFAD, encoding="utf-8"))
    themen, geschichten, produkte = daten["themen"], daten["geschichten"], daten["produkte"]
    alle = {t["key"]: t["label"] for t in themen}

    print("Geschichten: %d | Produkte: %d | Themen: %d"
          % (len(geschichten), len(produkte), len(themen)))

    abweichend = geschrieben = 0
    for thema in themen:
        key = thema["key"]
        ordner = os.path.join(THEMEN_DIR, key)
        ziel = os.path.join(ordner, "index.html")
        neu = seite_bauen(thema, texte, geschichten, produkte, alle)
        alt = open(ziel, encoding="utf-8").read() if os.path.exists(ziel) else ""

        n_frei = sum(1 for g in geschichten if key in g.get("themen", []))
        vorher = alt.count('class="tag frei"')
        if neu == alt:
            print("   = %-20s %3d Geschichten (unveraendert)" % (key, n_frei))
            continue
        abweichend += 1
        if args.pruefen:
            print("   ! %-20s %3d Geschichten (Seite zeigt %d)" % (key, n_frei, vorher))
            continue
        os.makedirs(ordner, exist_ok=True)
        open(ziel, "w", encoding="utf-8").write(neu)
        geschrieben += 1
        print("   + %-20s %3d Geschichten (vorher %d)" % (key, n_frei, vorher))

    if args.pruefen:
        print("\n%d Seite(n) weichen vom Datenstand ab." % abweichend)
        return 1 if abweichend else 0

    if kacheln_aktualisieren(os.path.join(THEMEN_DIR, "index.html"),
                             themen, geschichten, produkte):
        print("   + Themen-Gitter auf der Bibliotheksseite aktualisiert")
    print("\n%d Seite(n) neu geschrieben." % geschrieben)
    return 0


if __name__ == "__main__":
    sys.exit(main())
