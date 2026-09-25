# Bildprompts für Teich-Memory und Such-Teich (Ergänzung)

Beide Spiele benutzen deine **12 Teich-Bilder** (`bilder/teich/…`), die schon online sind. Es fehlen nur drei kleine Extras. Bis dahin zeichnet das Spiel Ersatzgrafiken, es läuft also schon jetzt.

Vorgehen wie immer: Chat mit Vorlagenbild und Stil-Block (Abschnitt 0 in `BILDPROMPTS.md`), PNG umbenennen, in `_werkstatt/teich/rohbilder/` legen, `python sprites_schneiden.py`.

### 1. Rückseite der Memory-Karten → `memory-rueckseite.png`
```
Portrait image (2:3). The back side of a children's memory card: a calm mint-green and soft teal pattern with a single round lily pad with a small pink flower in the center, thin cream border, flat and simple, perfectly symmetrical. Fill the whole image edge to edge. No text, no letters, no characters.
```

### 2. Kachel Teich-Memory → `kachel-memory.png`
```
Landscape image (3:2), simple and calm. Lernolotl sits by the pond next to six memory cards lying on a lily pad: four cards face down with a mint-green back, two cards face up showing the same yellow fish. Lernolotl looks happy because he found a pair. Simple soft background, no text.
```

### 3. Kachel Such-Teich → `kachel-suchen.png`
```
Landscape image (3:2), simple and calm. Lernolotl peeks over a pond full of lily pads, frogs, fish, shells and ducks, holding a big round magnifying glass that shows one small green frog enlarged. Friendly and uncluttered, simple soft background, no text.
```

| Rohbild in `rohbilder/` | wird zu (in `spiele/teich/bilder/`) |
|---|---|
| `memory-rueckseite.png` | `memory/rueckseite.webp` |
| `kachel-memory.png` | `kacheln/memory.webp` |
| `kachel-suchen.png` | `kacheln/suchen.webp` |
