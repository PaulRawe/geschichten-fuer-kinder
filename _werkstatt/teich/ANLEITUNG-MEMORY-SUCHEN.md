# Ergänzung: Teich-Memory und Such-Teich

## Einbauen
ZIP entpacken, Inhalt hochladen, „Commit directly to the main branch“.

**Neu:** `spiele/teich/js/spiele/memory.js`, `spiele/teich/js/spiele/suchen.js`, `spiele/teich/css/memory-suchen.css`
**Ersetzt:** `spiele/teich/index.html` (bindet die beiden Spiele ein, ohne Bibliothek-Knopf), `spiele/teich/js/kern.js` (gibt den Spielen die Teich-Bilder weiter), `index.html` der Startseite („Sechs Lernspiele“, zwei neue Spielnamen), `_werkstatt/teich/bilder-liste.json`, `_werkstatt/teich/PINTEREST-PINS.md` (Pin 9 und 10 neu)

## Teich-Memory
- Karten umdrehen, immer zwei. Passen sie, bleiben sie offen und grün umrandet. Passen sie nicht, bleiben sie kurz offen und drehen sich ruhig zurück.
- Keine Zeit, keine Züge-Anzeige; nur „Paare: 2 von 6“.
- **Tipp:** Ist eine Karte offen, zeigt Lernolotl kurz die passende. Sonst sieht man kurz alle Karten.
- **8 Stufen:** 2, 3, 4, 6, 8 und 10 Paare, danach **Bild und Wort** (6 und 8 Paare): Das Bild gehört zum passenden Wort. Das ist eine gute Brücke zum ersten Lesen. Nomen sind richtig großgeschrieben.
- **Aufstieg:** mit höchstens so vielen Fehlgriffen wie Paaren. Memory hat immer etwas Glück; deshalb geht es erst bei sehr vielen Fehlgriffen (mehr als dreimal so viele wie Paare) eine Stufe zurück.

## Such-Teich
- Der Teich ist voller Dinge, Lernolotl sucht bestimmte. Oben stehen die gesuchten Dinge als **Bild mit Zähler** („0 / 2“), so klappt es auch ohne Lesen.
- Richtiges Ding antippen: grüner Kreis mit Haken, der Zähler geht hoch. Falsches Ding: kurz grau und ein ruhiger Hinweis („Das ist ein Frosch. Finde zwei Muscheln …“).
- **Tipp:** Ein gesuchtes Ding leuchtet kurz auf.
- **8 Stufen:** von 6 Dingen mit 1 gesuchten bis 36 Dinge mit 3 Sorten; ab Stufe 7 sind die Dinge unterschiedlich groß und stärker gedreht. In Stufe 5 heißt es „Finde alle Frösche. Es sind vier.“ Die Anzahl wird immer genannt, damit das Kind weiß, wann es fertig ist.
- Jede Szene wird neu verteilt; nichts überlappt.
- **Aufstieg:** höchstens ein Fehlgriff. **Abstieg:** mehr als 8 Fehlgriffe.

## Direktlinks
- https://www.lernolotl.de/spiele/teich/?spiel=memory
- https://www.lernolotl.de/spiele/teich/?spiel=suchen

## Hinweis zum Bibliothek-Knopf
Die Spielseite in diesem Paket ist wieder ohne den schwebenden „Zur Bibliothek“-Knopf. Beim letzten Mal hatte der Workflow ihn noch einmal eingesetzt, weil die Spielseite vor der geänderten Workflow-Datei hochgeladen wurde. Da der Workflow den Ordner `spiele/` jetzt auslässt, bleibt die Seite ab jetzt sauber.
