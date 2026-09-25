# Lernolotls Teich – Anleitung

Drei Lernspiele mit dem Lernolotl, gebaut als Unterseite von lernolotl.de:

- **Zehner-Brücke:** Wie viele Planken fehlen? (Zahlen ergänzen bis 5, 10, 20)
- **Muster am Ufer:** Was gehört in die Lücke? (Muster erkennen)
- **Lernolotls Weg:** Pfeile legen, bis Lernolotl beim Futter ist (Planen, Richtungen)

Jede Aufgabe wird neu erzeugt, es gibt also unbegrenzt viele. Die Schwierigkeit passt sich an.

---

## 1. Was ist im Paket?

Die Ordner im ZIP haben dieselbe Struktur wie dein Repo `geschichten-fuer-kinder`. Du kopierst sie einfach hinein.

```
geschichten-fuer-kinder/              (dein Repo)
├── cookies.js                        ← ERSETZT (siehe Abschnitt 6)
├── spiele/
│   └── teich/                        → www.lernolotl.de/spiele/teich/
│       ├── index.html                Spielseite mit Navigation, Cookie-Banner, Footer
│       ├── css/teich.css             Aussehen (Seitenrahmen wie lernolotls-welt.html + Spiel)
│       ├── js/kern.js                Ablauf, Anpassung, Speicher, Zähler, Vorlesen
│       ├── js/spiele/bruecke.js      jedes Spiel = eine eigene Datei
│       ├── js/spiele/muster.js
│       ├── js/spiele/weg.js
│       └── bilder/
│           ├── lernolotl/            winkt, freut-sich, denkt, zeigt (vorhanden)
│           │                         + schwimmt, schlaeft, ruhig (kommen aus ChatGPT)
│           ├── kacheln/              Bilder für die Spielauswahl
│           ├── hintergrund/          Teich-Hintergrund
│           ├── bruecke/  muster/  weg/  teich/
└── _werkstatt/
    └── teich/                        wird NICHT veröffentlicht (Ordner mit _ lässt GitHub Pages weg)
        ├── ANLEITUNG.md              diese Datei
        ├── BILDPROMPTS.md            alle Prompts für ChatGPT
        ├── bilder-liste.json         welche Bilder es gibt und wohin sie gehören
        ├── sprites_schneiden.py      schneidet ChatGPT-Bilder zu und speichert WebP
        └── rohbilder/                hier legst du die PNGs aus ChatGPT ab
```

---

## 2. Einrichten

1. ZIP entpacken.
2. Die Ordner `spiele` und `_werkstatt` sowie die Datei `cookies.js` in deinen lokalen Repo-Ordner `geschichten-fuer-kinder` kopieren (`cookies.js` überschreiben).
3. Fertig. Es muss nichts installiert werden, um das Spiel zu spielen.

---

## 3. Auf dem Desktop spielen und testen

**Doppelklick auf `spiele/teich/index.html`.** Das Spiel öffnet sich im Browser, ganz ohne Server.

Das ist lokal normal:
- Der Cookie-Banner erscheint (wie auf der echten Seite). Einmal wählen, dann ist er weg.
- Die Links im Footer (Impressum usw.) führen lokal ins Leere. Online funktionieren sie.
- Schriftarten kommen von Google Fonts. Ohne Internet sieht die Schrift etwas anders aus.
- **Der Zähler sendet lokal nichts.** Du siehst in der Browser-Konsole (F12 → Konsole) nur Zeilen wie `[Teich] Zähler (lokal, nicht gesendet): teich/bruecke/runde-fertig`. So verfälschen deine Tests die echten Zahlen nicht.

**Test-Checkliste:**
- [ ] Jedes der drei Spiele einmal ganz durchspielen (5 Aufgaben, danach „Geschafft!“ und ein neues Teil für den Teich).
- [ ] Absichtlich falsch antworten: 1. Fehler = freundlicher Hinweis, 2. Fehler = Tipp, 3. Fehler = Lösung wird gezeigt.
- [ ] Knopf „Tipp“ ausprobieren.
- [ ] Pause-Knopf und Zurück-Knopf (fragt nach, ob man aufhören möchte).
- [ ] Knopf „Eltern-Einstellungen“ → 3 Sekunden gedrückt halten.
- [ ] Dort „Reizarmer Modus“ einschalten und ein Spiel ansehen.
- [ ] „Automatisch vorlesen“ einschalten (nutzt die Sprachausgabe von Windows/Mac/Handy).
- [ ] Handy-Ansicht: F12 → Symbol mit Handy und Tablet oben links → z. B. „iPhone 12“ wählen.
- [ ] Auf dem echten Handy testen, sobald es online ist.

**Spielstand zurücksetzen:** Eltern-Einstellungen → „Spielstand zurücksetzen“.
**Direkt eine höhere Stufe testen:** Eltern-Einstellungen → bei einem Spiel auf „+“.

---

## 4. Bilder aus ChatGPT einbauen

Das Spiel läuft schon jetzt. Wo noch Bilder fehlen, zeichnet es einfache Ersatzgrafiken. Sobald du ein Bild ergänzt, erscheint es automatisch.

1. **Prompts:** siehe `BILDPROMPTS.md` (mit Reihenfolge und Dateinamen).
2. **PNG aus ChatGPT** umbenennen (z. B. `muster-dinge.png`) und in `_werkstatt/teich/rohbilder/` legen.
3. **Skript einmalig vorbereiten:**
   - Python installieren, falls noch nicht vorhanden: python.org → Download. Unter Windows beim Installieren das Häkchen **„Add Python to PATH“** setzen.
   - In der Eingabeaufforderung / im Terminal einmal: `pip install pillow`
4. **Skript starten:** Im Ordner `_werkstatt/teich` die Eingabeaufforderung öffnen (Windows: im Explorer in die Adresszeile `cmd` tippen und Enter) und eingeben:
   ```
   python sprites_schneiden.py
   ```
   Das Skript nimmt alle Bilder aus `rohbilder/`, schneidet Sammelbilder in einzelne Dinge, benennt sie und speichert sie als WebP in `spiele/teich/bilder/…`. Es zeigt dir an, was es gemacht hat.
5. **Browser neu laden** (Strg+F5).

Falls ChatGPT keinen transparenten Hintergrund geliefert hat:
```
python sprites_schneiden.py rohbilder/muster-dinge.png --hintergrund-weg
```
Bei grau-weißem Karomuster zusätzlich `--toleranz 70`.

Falls ein Sammelbild falsch zerschnitten wird (z. B. weil sich zwei Dinge berühren): Bild in ChatGPT mit „more space between the objects“ neu erstellen lassen. Das Skript schneidet sonst nach dem Raster aus `bilder-liste.json`.

Die Rohbilder (PNG) musst du nicht hochladen. Wenn du sie nicht im Repo haben willst, lösch sie nach dem Schneiden oder lass sie einfach im `_werkstatt`-Ordner liegen (der wird nicht veröffentlicht).

---

## 5. Online stellen

1. Änderungen wie gewohnt committen und pushen (z. B. mit GitHub Desktop).
2. Nach ein, zwei Minuten ist das Spiel erreichbar unter: **https://www.lernolotl.de/spiele/teich/**

**Google:** Die Seite ist freigegeben (`index, follow`). Dein Sitemap-Workflow nimmt sie beim nächsten Push automatisch auf.

**Einzelne Spiele direkt verlinken** (für Extra-Buttons, Pinterest-Pins oder QR-Codes in Büchern):
- https://www.lernolotl.de/spiele/teich/?spiel=bruecke
- https://www.lernolotl.de/spiele/teich/?spiel=muster
- https://www.lernolotl.de/spiele/teich/?spiel=weg

Dann erscheint nur dieses eine Spiel mit einem Link „Alle Spiele ansehen“.

**Button auf lernolotls-welt.html**, z. B. neben „Wer ist der Lernolotl?“ (nutzt die Button-Klasse, die dort schon existiert):
```html
<a href="spiele/teich/" class="btn-jump-outline">🎮 Lernspiele</a>
```

---

## 6. Die geänderte cookies.js

Einzige Änderung: Die Links im Footer, den `cookies.js` automatisch einsetzt, beginnen jetzt mit `/` (also `/impressum.html` statt `impressum.html`). Vorher führten sie auf Seiten in Unterordnern (wie `/spiele/teich/`) ins Leere, weil der Browser sie im Unterordner gesucht hat. Auf allen anderen Seiten ändert sich nichts.

Falls du `cookies.js` inzwischen selbst geändert hast: nicht überschreiben, sondern nur diese fünf Links von Hand anpassen (Abschnitt „Footer Injection“ ganz unten in der Datei).

**Nebenbei aufgefallen:** Deine Seiten laden GoatCounter doppelt, einmal direkt im `<head>` (Konto `lernolotl`) und einmal über `cookies.js` (Konto `pauleheissta`). Das Spiel zählt nur ins Konto `lernolotl`. Wenn du das zweite Konto nicht mehr nutzt, kannst du `loadGoatCounter()` in `cookies.js` irgendwann aufräumen.

---

## 7. Der Rundenzähler

Das Spiel meldet an GoatCounter (Konto **lernolotl.goatcounter.com**), wenn eine Runde startet und wenn sie fertig gespielt ist. Es werden keine persönlichen Daten gesendet, nur der Name des Ereignisses.

Im GoatCounter-Dashboard erscheinen diese Einträge in der Liste (wie Seiten, sie beginnen mit `teich/`):

| Eintrag | Bedeutung |
|---|---|
| `teich/bruecke/runde-start` | Besuche, in denen jemand eine Brücken-Runde gestartet hat |
| `teich/bruecke/runde-fertig` | Besuche, in denen jemand eine Brücken-Runde zu Ende gespielt hat |
| `teich/bruecke/runde-fertig/nr-1` … `nr-20`, `nr-20plus` | die wievielte Runde auf diesem Gerät gerade fertig wurde |

(Dasselbe für `muster` und `weg`.)

**Warum die `nr-…`-Einträge?** GoatCounter zählt denselben Eintrag pro Besuch nur einmal (so zählt es auch Seitenaufrufe). Spielt ein Kind drei Runden hintereinander, stünde bei `runde-fertig` nur 1. Die Einträge `nr-1`, `nr-2`, `nr-3` … sind jedes Mal andere, darum wird jede Runde gezählt.

So liest du die Zahlen:
- **Gesamtzahl gespielter Runden (pro Spiel):** alle `nr-…`-Einträge dieses Spiels zusammenzählen. Tipp: im Dashboard ins Filterfeld `teich/bruecke/runde-fertig/nr` eingeben, dann stehen nur diese Zeilen da.
- **Wie viele fangen an und hören wieder auf?** `runde-fertig` geteilt durch `runde-start`. Ein hoher Wert heißt: Kinder spielen die Runde zu Ende.
- **Kommen Kinder wieder?** `nr-1` = Geräte mit mindestens 1 Runde, `nr-5` = Geräte, die schon ihre 5. Runde geschafft haben. Je mehr Geräte bei `nr-5`, `nr-10` usw. ankommen, desto besser wird das Spiel angenommen. Das ist der wichtigste Wert für die Entscheidung, ob sich eine Bezahlversion lohnt.

**Einfacher, aber für die ganze Seite:** In GoatCounter unter *Settings → Data collection → Sessions* kann man einstellen, dass jeder Aufruf gezählt wird. Dann zeigt schon `runde-fertig` alle Runden. Das ändert aber auch, wie deine normalen Seitenaufrufe gezählt werden. Darum habe ich es mit den `nr-…`-Einträgen gelöst.

**Auf dem Gerät selbst** stehen Runden und richtige Aufgaben pro Spiel in den Eltern-Einstellungen.

**Zähler abschalten oder anderes Konto:** oben in `js/kern.js` bei `goatcounter:`.

---

## 8. Datenschutz-Texte

Bereits erledigt (im Komplettpaket enthalten, jeweils auch die Kopien im Ordner `lernolotl/`):
- `datenschutz.html`: In Abschnitt 4 (GoatCounter) steht ein neuer Unterpunkt „Lernspiele Lernolotls Teich“. Er erklärt die anonyme Rundenzählung, die lokale Speicherung des Spielstands und die Vorlesefunktion. Das veraltete „Stand Januar 2025“ in Abschnitt 13 lautet jetzt „September 2026“.
- `cookie-richtlinie.html`: Die Tabelle „Technisch notwendige Cookies“ hat eine neue Zeile `lernolotlTeich.v1`.

Ich bin kein Anwalt; die Texte passen zu deinen bestehenden Formulierungen, im Zweifel bitte prüfen lassen.

---

## 9. Schwierigkeitsstufen

Jedes Spiel hat 6 Stufen. Nach 3 Aufgaben in Folge ohne Fehler und ohne Tipp geht es eine Stufe höher, nach einer gezeigten Lösung eine Stufe tiefer. Die Stufe bleibt auf dem Gerät gespeichert.

| Stufe | Zehner-Brücke | Muster am Ufer | Lernolotls Weg |
|---|---|---|---|
| 1 | 5 Planken, Auswahl aus 3 Zahlen | AB (z. B. Fisch, Stein, Fisch …) | 4×4, keine Steine |
| 2 | 10 Planken, Lücken am Ende | ABB / AAB | 4×4, 2 Steine |
| 3 | 10 Planken, Lücken verteilt | ABC | 5×5, 3 Steine |
| 4 | 10 Planken, Zahlenfeld 0–10 | AABB, ABAC … | 5×5, 5 Steine |
| 5 | 20 Planken, Zahlenfeld 0–20 | Lücke in der Mitte | 6×6, 7 Steine |
| 6 | 20 Planken, Lücken verteilt | lange Muster, 4 Antworten | 6×6, 9 Steine, Umwege |

Beim Wege-Spiel wird jedes Feld zufällig erzeugt und vorher automatisch geprüft, ob es lösbar ist und wie lang der kürzeste Weg ist.

---

## 10. Ein neues Spiel hinzufügen

1. Eine vorhandene Datei kopieren, z. B. `js/spiele/muster.js` → `js/spiele/sortieren.js`.
2. Unten bei `Teich.registriere({...})` eine neue `id`, `titel`, `untertitel` und `stufen` eintragen.
3. `erzeuge(stufe, zufall)` baut eine Aufgabe (Text, Tipp-Text, Lösungstext und die Daten, die das Spiel braucht).
4. `zeige(flaeche, aufgabe, api)` zeichnet die Aufgabe. Bei einer Antwort `api.antwort(true)` oder `api.antwort(false, 'Hinweis')` aufrufen. Um Hinweis, Tipp, Lösung, Zählen, Stufen und Belohnung kümmert sich `kern.js`.
5. In `index.html` eine Zeile ergänzen: `<script src="js/spiele/sortieren.js"></script>`
6. Bilder in `bilder/<id>/` ablegen und in `_werkstatt/teich/bilder-liste.json` eintragen.

Das neue Spiel erscheint automatisch in der Auswahl, in den Eltern-Einstellungen und im Zähler.

---

## 11. Später: App und Bezahlversion

Alles ist so gebaut, dass es ohne Umbau weiterverwendet werden kann:
- **App:** Der Ordner `spiele/teich/` lässt sich später mit einem Werkzeug wie Capacitor in eine Android- und iOS-App verpacken. Der Eltern-Einstellungen mit dem 3-Sekunden-Knopf ist schon als „Elternsperre“ angelegt, die Apple und Google in der Kinder-Kategorie vor Käufen und Links verlangen.
- **Bezahlversion:** Aufteilen in frei spielbare und freischaltbare Spiele/Stufen geht über die Liste der Spiele in `kern.js`. Das baue ich ein, wenn die Zahlen aus Abschnitt 7 zeigen, dass die Spiele angenommen werden.
