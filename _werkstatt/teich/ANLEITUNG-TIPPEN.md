# Ergänzung: Tasten-Teich (Tastaturschreiben)

Das vierte Spiel in Lernolotls Teich. Kinder lernen Schritt für Schritt das Schreiben mit zehn Fingern auf der deutschen Tastatur.

---

## 1. Einbauen

ZIP entpacken und die Ordner `spiele` und `_werkstatt` in deinen Repo-Ordner `geschichten-fuer-kinder` kopieren. Vorhandene Dateien überschreiben.

**Neu:**
- `spiele/teich/js/spiele/tippen.js` (das Spiel)
- `spiele/teich/css/tippen.css` (Aussehen von Tastatur, Zeile, Händen)
- `_werkstatt/teich/BILDPROMPTS-TIPPEN.md`, `ANLEITUNG-TIPPEN.md`

**Ersetzt:**
- `spiele/teich/index.html`: bindet das neue Spiel und die Schrift „Andika“ ein
- `spiele/teich/js/kern.js`: kleine Erweiterungen, die anderen drei Spiele laufen unverändert
- `_werkstatt/teich/bilder-liste.json` und `sprites_schneiden.py`: kennen jetzt die neuen Bilder

`cookies.js` bleibt, wie sie im ersten Paket war.

Danach `spiele/teich/index.html` doppelklicken. In der Auswahl stehen jetzt vier Spiele (2 × 2).

---

## 2. So funktioniert das Spiel

- Oben schwimmt Lernolotl auf einer Bahn. Mit jeder richtigen Taste kommt er ein Stück weiter, am Ende wartet die Seerose.
- Darunter steht die Zeile zum Abtippen. Der nächste Buchstabe ist hell hinterlegt und unterstrichen.
- Die **Bildschirmtastatur** zeigt, wo die gesuchte Taste ist. Jede Taste hat die Farbe ihres Fingers. Tasten, die noch nicht dran waren, sind blass. Neue Tasten haben einen kleinen Punkt. f und j haben wie echte Tastaturen einen Strich zum Ertasten.
- Die **Hände** darunter zeigen den passenden Finger, dazu ein kurzer Satz wie „Nimm den linken Zeigefinger.“ Bei Großbuchstaben leuchtet auch die richtige Umschalttaste und der kleine Finger der anderen Hand.
- Eine Runde hat so viele Zeilen, wie in den Eltern-Einstellungen eingestellt ist (Standard 5).

**Worauf ich für neurodivergente Kinder geachtet habe:**
- **Keine Zeit, kein Tempo, kein Countdown.** Gezählt werden nur Tippfehler. Es gibt bewusst keine Anschläge-pro-Minute-Anzeige.
- **Kein Löschen nötig:** Bei einem Fehler bleibt der Buchstabe einfach stehen, bis die richtige Taste kommt. Nichts rutscht weg, nichts muss korrigiert werden.
- **Fehler bleiben ruhig:** Die gedrückte Taste wird kurz grau, dazu kommt ein kurzer Hinweis. Beim ersten Mal „Fast. Schau auf die helle Taste.“, ab dem zweiten Mal wird gesagt, welcher Finger dran ist. Es gibt keinen Ton und keine rote Farbe.
- **Kurze Zeilen**, gleiche Abläufe, und die Hilfen stehen immer an derselben Stelle.
- **Schrift „Andika“:** Sie wurde für Leseanfänger entwickelt, Buchstaben, die leicht verwechselt werden, sind gut zu unterscheiden.
- **Hilfreiche Sonderfälle:** Ist die Feststelltaste an, sagt das Spiel es freundlich. Ist die Tastatur nicht auf Deutsch eingestellt (ö, ä, ü, z, y kommen falsch an), kommt ein Hinweis, einen Erwachsenen zu fragen.
- Im **reizarmen Modus** sind Tasten und Finger grau statt bunt; nur die gesuchte Taste ist hervorgehoben.
- **Vorlesen:** Mit „Automatisch vorlesen“ werden die Hinweise gesprochen, z. B. „Gesucht ist j. Nimm den rechten Zeigefinger.“

---

## 3. Die Endlos-Matrix

**16 Lektionen × 3 Formen = 48 Stufen.** Jede Zeile wird neu erzeugt.

| Lektion | neue Tasten | Lektion | neue Tasten |
|---|---|---|---|
| 1 | f j | 9 | n m |
| 2 | d k | 10 | o w |
| 3 | s l | 11 | c v |
| 4 | a ö | 12 | b p |
| 5 | g h | 13 | ä ü |
| 6 | e i | 14 | q x y |
| 7 | r u | 15 | Großbuchstaben (Umschalttaste) |
| 8 | t z | 16 | Komma und Punkt, kleine Sätze |

Jede Lektion hat drei Formen:
1. **Tasten:** kurze Gruppen wie `fjf jjf fff` (neue Tasten kommen besonders oft vor)
2. **Silben:** z. B. `fa lös kada`
3. **Wörter:** echte Wörter, die nur aus schon gelernten Buchstaben bestehen, z. B. `hell leise lila`. In den ersten Lektionen gibt es kaum solche Wörter; dann mischt das Spiel Silben dazu.

**Rechtschreibung:** Nomen erscheinen erst ab Lektion 15 (Großbuchstaben), dann richtig großgeschrieben. Vorher kommen nur Wörter vor, die man auch wirklich klein schreibt. So lernen Kinder keine falschen Schreibweisen.

**Anpassung (die zweite Achse der Matrix):** Das Spiel merkt sich auf dem Gerät für jede Taste, wie oft sie getippt und wie oft danebengetippt wurde. Tasten mit vielen Fehlern kommen dann automatisch häufiger vor. In den Eltern-Einstellungen steht, welche Tasten noch schwerfallen, z. B. „r (30 %), t (22 %)“.

**Aufstieg und Abstieg:**
- **Eine Stufe höher:** nach 3 Zeilen in Folge mit höchstens 5 % Tippfehlern und ohne Tipp-Knopf.
- **Eine Stufe tiefer:** wenn eine Zeile mehr als 20 % Fehler hatte.

Der Tipp-Knopf lässt die Hände kurz aufleuchten und sagt den Finger an.

---

## 4. Gut zu wissen

- **Eine echte Tastatur ist nötig**, und zwar eine deutsche (QWERTZ). Auf Tablets und Handys kann man zur Not auf die Bildschirmtasten tippen; das Spiel weist dann darauf hin, dass es mit Tastatur besser geht.
- **Für Kinder, die noch nicht lesen können,** funktionieren die Lektionen 1 bis 5 gut, weil sie nur Buchstabengruppen nachtippen. Für echte Wörter sollte das Kind die Buchstaben kennen.
- **Zähler:** Automatisch wie bei den anderen Spielen. In GoatCounter erscheinen `teich/tippen/runde-start`, `teich/tippen/runde-fertig` und `teich/tippen/runde-fertig/nr-…`.
- **Direktlink** für einen Extra-Button: `https://www.lernolotl.de/spiele/teich/?spiel=tippen`
- **Bilder:** siehe `BILDPROMPTS-TIPPEN.md`. Lernolotl *schwimmt* aus der ersten Prompt-Liste wird auch auf der Bahn benutzt.

---

## 5. Was sich in kern.js geändert hat (für später)

Neue, optionale Möglichkeiten für Spiele. Die alten Spiele nutzen sie nicht und laufen genauso wie vorher.
- `api.antwort(true, text, wertung)`: Ein Spiel kann selbst sagen, wie sauber die Aufgabe war (`'gut'`, `'ok'`, `'schwer'`).
- `api.hinweis(text)`: zeigt einen Hinweis, ohne dass er als Fehlversuch zählt.
- `api.extra`: eigene Daten des Spiels, die auf dem Gerät gespeichert bleiben (hier: Fehler je Taste).
- `loloPose`: eigenes Lernolotl-Bild in der Aufgabenkarte (hier: `tippt`).
- `infoFuerErwachsene()`: eigener Satz in den Eltern-Einstellungen.
