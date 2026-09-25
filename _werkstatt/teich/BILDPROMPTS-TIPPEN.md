# Bildprompts für den Tasten-Teich (Ergänzung)

Gleiches Vorgehen wie in `BILDPROMPTS.md`: neuer Chat in ChatGPT, Lernolotl-Vorlagenbild hochladen, zuerst den **Stil-Block** (Abschnitt 0 in `BILDPROMPTS.md`) schicken, dann diese Prompts. PNG umbenennen, in `_werkstatt/teich/rohbilder/` legen, `python sprites_schneiden.py` starten.

Das Spiel läuft auch ohne diese Bilder (Ersatzgrafiken).

**Wichtig:** Keine Buchstaben auf Tasten und kein Text im Bild. Die echte Tastatur zeichnet das Spiel selbst. Gemalte Tastaturen mit Fantasie-Buchstaben würden Kinder nur verwirren.

---

### 1. Lernolotl tippt + Ziel-Seerose → `tippen-dinge.png`
Sammelbild, zwei Dinge nebeneinander. Das Skript legt sie nach `lernolotl/tippt.webp` (Bild oben in der Aufgabenkarte) und `tippen/ziel.webp` (Ziel am Ende der Schwimmbahn).

```
Landscape image (3:2). Two separate drawings side by side with lots of empty space between them, same size:
Left: Lernolotl sitting and happily typing on a small, simple, rounded computer keyboard with blank keys (no letters, no symbols on the keys), both hands on the keys, looking focused and content.
Right: a large round green lily pad with one open pink water-lily flower on it, seen slightly from above (a friendly finish goal).
Real transparent background (PNG with alpha channel). No shadows, no scenery, no text.
```

### 2. Schwimmbahn → `hg-bahn.png`
Einzelbild, sehr breit und ruhig. Lernolotl schwimmt darauf von links nach rechts.

```
Wide landscape image (3:1 if possible, otherwise 3:2). Side view of a calm, light-blue pond water lane stretching from left to right, gentle soft wave line on the surface, a few tiny bubbles, a thin strip of green reeds only at the far right end. The whole middle is plain and calm. No characters, no animals, no text.
```

### 3. Kachel für die Spielauswahl → `kachel-tippen.png`
```
Landscape image (3:2), simple and calm. Lernolotl sits on a lily pad and types on a big friendly keyboard with blank rounded keys (no letters, no symbols). Two keys in the middle glow softly in mint green. Small calm water around, simple soft background, no text, no letters.
```

---

| Rohbild in `rohbilder/` | wird zu (in `spiele/teich/bilder/`) | wofür |
|---|---|---|
| `tippen-dinge.png` | `lernolotl/tippt.webp`, `tippen/ziel.webp` | Aufgabenkarte, Ziel der Schwimmbahn |
| `hg-bahn.png` | `tippen/bahn.webp` | Schwimmbahn über der Zeile |
| `kachel-tippen.png` | `kacheln/tippen.webp` | Spielauswahl |

Lernolotl *schwimmt* (aus `lernolotl-posen.png` in der ersten Prompt-Liste) wird auch hier auf der Bahn benutzt.
