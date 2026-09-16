# Rechtliche Korrekturen lernolotl.de — September 2026

117 geänderte Dateien. Alle Pfade entsprechen der Repo-Struktur:
einfach über den bestehenden Stand kopieren und committen.

Kein Rechtsrat. Die Punkte stammen aus einem Abgleich des Repo-Stands
mit dem, was auf der Seite tatsächlich läuft.

---

## 1. OS-Plattform entfernt (Abmahnrisiko)
`impressum.html`, `lernolotl/impressum.html`

Die EU-Plattform zur Online-Streitbeilegung wurde zum 20. Juli 2025
eingestellt (Verordnung EU 2024/3228). Seitdem ist der Hinweis nicht
nur überflüssig, sondern muss entfernt werden — ein verbliebener Link
gilt als abmahnfähig.

Ersetzt durch die weiterhin bestehende Pflichtangabe nach § 36 VSBG.

## 2. Google AdSense: Code und Erklärungen entfernt
`cookies.js`, `datenschutz.html`, `cookie-richtlinie.html` (+ lernolotl/)

Der AdSense-Loader stand mit unausgefüllter Platzhalter-ID
(`ca-pub-XXXXXXXXXXXXXXX`) im Code und wurde bei Klick auf
„Alle akzeptieren" geladen. Gleichzeitig erklärten Datenschutz- und
Cookie-Seite AdSense als aktiv eingesetzt.

Beides passte nicht zusammen und nicht zur Realität. Der Loader ist
raus, die Erklärungen sagen jetzt, dass derzeit kein Werbenetzwerk
eingebunden ist. An der Stelle in `cookies.js` steht ein Kommentar,
wo der Aufruf hingehört, falls du AdSense später wirklich nutzt.

## 3. Google Analytics: falsche Cookie-Angaben entfernt
`cookie-richtlinie.html` (+ lernolotl/)

Die Cookie-Tabelle führte `_ga`, `_gid`, `IDE`, `DSID` und `NID` auf.
Keines dieser Cookies wird gesetzt — Google Analytics läuft auf der
Seite nicht. Eine Cookie-Richtlinie, die Dienste auflistet, die es
nicht gibt, ist genauso fehlerhaft wie eine, die welche verschweigt.

## 4. Cookie-Banner-Text korrigiert (110 Seiten)
Der Banner behauptete, die Seite zeige „personalisierte Werbung"
bzw. „relevante Anzeigen". Das stimmte nicht. Neuer Text benennt,
was tatsächlich passiert: anonyme, cookiefreie Reichweitenmessung,
keine Werbe- oder Tracking-Cookies.

## 5. GoatCounter: Begründung richtiggestellt
`cookies.js`

Im Code stand „technisch notwendig". Reichweitenmessung ist nie
technisch notwendig — mit dieser Begründung wäre sie angreifbar.
GoatCounter setzt allerdings keine Cookies und speichert nichts auf
dem Endgerät, sodass § 25 Abs. 1 TDDDG nicht greift und
Art. 6 Abs. 1 lit. f DSGVO trägt. Genau das steht jetzt dort.

## 6. Werbekennzeichnung ergänzt
`cookies.js`

Die per JavaScript eingefügten Produktboxen (Vorlesezeit-Karten,
Gefühls-Bundles) waren nicht als Werbung erkennbar. Labels tragen
jetzt „Anzeige · …", und alle Produktlinks haben `rel="sponsored"`.

## 7. Preisangabe aus dem Button entfernt
`cookies.js`

Im Button stand „3,99 € · Jetzt holen". Preise auf der eigenen Seite
musst du aktuell halten und geraten in die Nähe von
Preisangabenpflichten. Jetzt: „Auf Etsy ansehen" — der Preis steht
dort, wo er ohnehin gepflegt wird.

## 8. Weiterleitungen zu Amazon und Etsy erklärt
`datenschutz.html` (+ lernolotl/)

Neuer Abschnitt 5a: reine Textlinks, keine eingebetteten Skripte
oder Zählpixel, Verarbeitung erst ab Klick, mit Verweis auf die
Datenschutzerklärungen beider Anbieter.

## 9. Stand-Datum aktualisiert
Datenschutz und Cookie-Richtlinie standen auf „Januar 2025".

---

## Noch offen — bitte selbst prüfen

- **Amazon-Partner-ID `prawe-21`:** Im Impressum genannt, aber die
  Buchlinks im Repo enthalten keinen `tag=`-Parameter. Entweder die
  Links ergänzen oder die Teilnahme im Impressum streichen.
- **Autorenname:** Das Impressum nennt „Paul Rawe", die Meta-Angabe
  auf der Startseite „Paul R.". Sollte einheitlich sein.
- **Bildrechte-Absatz im Impressum** spricht von Produktbildern
  „vom Hersteller bzw. von Amazon". Wenn du nur eigene Cover
  verwendest, ist das missverständlich.
- **Barrierefreiheitsstärkungsgesetz (BFSG):** Seit Juni 2025 in
  Kraft. Da die Seite selbst nichts verkauft, spricht viel für eine
  Ausnahme — im Zweifel kurz anwaltlich klären lassen.
