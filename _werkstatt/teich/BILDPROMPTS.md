# Bildprompts für Lernolotls Teich (ChatGPT)

Mit diesen Prompts erstellst du in ChatGPT alle Bilder für das Spiel. Das Spiel läuft auch schon **ohne** diese Bilder: Überall, wo ein Bild fehlt, zeichnet es eine einfache Ersatzgrafik. Du kannst die Bilder also nach und nach ergänzen.

**Schon vorhanden (musst du nicht neu machen):** Lernolotl *winkt*, *freut sich*, *denkt nach* und *zeigt*. Die habe ich aus deinen Website-Bildern übernommen und als WebP in `spiele/teich/bilder/lernolotl/` gelegt.

---

## So gehst du vor

1. **Neuen Chat in ChatGPT öffnen** und zuerst dein Lernolotl-Bild als Vorlage hochladen (z. B. `lernolotl-waving.png` aus dem Hauptordner der Website). So bleibt die Figur gleich.
2. **Den Stil-Block (unten) als erste Nachricht schicken.** Dann einen Prompt nach dem anderen.
3. **Als PNG herunterladen** (nicht per Screenshot), damit der transparente Hintergrund erhalten bleibt.
4. **Datei umbenennen** in den Namen, der beim Prompt steht (z. B. `muster-dinge.png`), und in den Ordner `_werkstatt/teich/rohbilder/` legen.
5. **Skript laufen lassen:** `python sprites_schneiden.py` (siehe ANLEITUNG.md). Es schneidet Sammelbilder in einzelne Dinge, benennt sie richtig und speichert alles als WebP an die richtige Stelle.
6. Seite im Browser neu laden (Strg+F5). Fertig.

**Prüfen vor dem Speichern:**
- Lernolotl hat eine runde Brille und **genau 3 Kiemenfedern pro Seite**.
- Kein Text, keine Buchstaben, keine Zahlen im Bild.
- Bei Sammelbildern: Jedes Ding steht **frei**, mit Abstand zu den anderen, nichts überlappt.
- Hintergrund ist transparent. Falls ChatGPT stattdessen ein grau-weißes **Karomuster** malt oder einen weißen Hintergrund liefert: kein Problem, das Skript kann den Hintergrund entfernen (`--hintergrund-weg`, bei Karomuster zusätzlich `--toleranz 70`). Besser ist aber, nochmal nach „real transparent background (PNG alpha)“ zu fragen.

Die Prompts sind auf Englisch, weil ChatGPT Bildanweisungen auf Englisch am zuverlässigsten umsetzt. Du kannst sie einfach kopieren.

---

## 0. Stil-Block (immer zuerst schicken)

```
For all images in this chat, use exactly this style:
Cute kawaii children's app illustration in sticker style. Clean, bold, dark outlines (very dark green-black, even medium thickness), flat colors with soft cel shading and one small highlight, rounded friendly shapes. Soft pastel palette: mint green, soft teal, cream, light sky blue, with warm coral and sunny yellow accents.
Calm and uncluttered, suitable for autistic and ADHD children: no busy details, no glitter, no text, no letters, no numbers, no watermark, no signature.
The character "Lernolotl" is the mint-green axolotl from the attached reference image: round thin glasses, exactly three feathery gill fins on EACH side of the head (darker teal), cream belly, big friendly eyes. Keep him exactly like the reference.
Please confirm, then wait for my first image request.
```

---

## 1. Sammelbilder (mehrere Dinge auf einem Bild)

### 1.1 Lernolotl – drei neue Posen → `lernolotl-posen.png`
Querformat. Wird genutzt für: *schwimmt* (Spiel „Lernolotls Weg“), *schläft* (Pause), *ruhig* (reizarmer Modus).

```
Landscape image (3:2). Three separate full-body drawings of Lernolotl side by side in one row, evenly spaced with generous empty space between them, all the same size:
1) Lernolotl swimming, seen from the side, body horizontal, facing right, happy face, two tiny bubbles.
2) Lernolotl sleeping peacefully, curled up, eyes closed, calm smile.
3) Lernolotl sitting calmly, relaxed and friendly neutral expression, hands resting in his lap.
Real transparent background (PNG with alpha channel). No ground, no shadows, no scenery.
```

### 1.2 Brückenplanken → `bruecke-planken.png`
Querformat. Drei Varianten, damit die Brücke natürlicher aussieht.

```
Landscape image (3:2). Three separate wooden bridge planks seen from directly above, side by side with lots of space between them. Each plank is an upright rectangle (about 3 times taller than wide) with slightly rounded corners, warm light-brown wood with a few simple grain lines and one small nail dot near the top and bottom. Give the three planks slightly different wood tones. All the same size.
Real transparent background (PNG with alpha channel). No shadows.
```

### 1.3 Dinge für „Muster am Ufer“ → `muster-dinge.png`
Querformat, Raster 3 × 2. **Wichtig:** Jedes Ding hat eine andere Form **und** eine andere Farbe, damit Kinder mit Farbschwäche sie auch unterscheiden können.

```
Landscape image (3:2). Six separate small objects arranged in a clean grid of 3 columns and 2 rows. Each object is centered in its own cell with lots of empty space around it, all objects the same size, simple front view.
Every object must have a clearly different SHAPE and a clearly different COLOR:
Row 1: an orange-coral scallop seashell (fan shape) · a smooth rounded-square blue-grey pebble · a green leaf pointing diagonally.
Row 2: a pink water-lily flower seen from above · a round yellow fish seen from the side · a brown snail with a spiral shell.
Real transparent background (PNG with alpha channel). No shadows, no scenery.
```

### 1.4 Dinge für „Lernolotls Weg“ → `weg-dinge.png`
Querformat, zwei Dinge nebeneinander. Werden von oben auf dem Spielfeld gesehen.

```
Landscape image (3:2). Two separate objects side by side with lots of space between them, seen from directly above (top-down game view), same size:
Left: a grey rounded boulder stone.
Right: a small cluster of three red-orange pond berries with one small green leaf (food for the axolotl).
Real transparent background (PNG with alpha channel). No shadows.
```

### 1.5 Sammelstücke für „Mein Teich“ → `teich-sammlung.png`
Querformat, Raster 4 × 3 (12 Dinge). Die Reihenfolge ist wichtig, weil das Skript sie so benennt.

```
Landscape image (3:2). Twelve separate small pond items arranged in a clean grid of 4 columns and 3 rows. Each item is centered in its own cell with lots of empty space around it, all the same size, friendly and cute:
Row 1: a pink water lily on a green lily pad · a small yellow fish · a smooth grey stone · cattail reeds.
Row 2: a freshwater mussel shell · a light-blue dragonfly · a friendly green frog · a small water snail.
Row 3: a yellow marsh marigold flower · a small friendly red crayfish · a yellow duckling · a cute dark-blue water beetle.
Real transparent background (PNG with alpha channel). No shadows, no scenery, no text.
```

---

## 2. Hintergründe (einzelne Bilder, ohne Transparenz)

Über den Hintergründen liegen Text, Knöpfe und Spielfiguren. Darum sollen sie **ruhig und detailarm** sein.

### 2.1 Teich (Startseite und „Mein Teich“) → `hg-teich.png`
```
Landscape image (3:2). Calm pond background for a children's learning app, seen from the front: light blue water filling most of the image, a soft green grassy bank along the bottom edge (bottom fifth of the image), a few lily pads only at the far left and far right edges, simple reeds in the two bottom corners. Keep the center and the upper left area completely calm and empty (text and the character go there). No characters, no animals, no text. Very low detail.
```

### 2.2 Fluss für die Brücke → `hg-fluss.png`
```
Landscape image (3:2). Top-down view of a calm light-blue river flowing from top to bottom through the middle of the image. Grassy green banks only along the far left and far right edges (each about one tenth of the width). Gentle small ripples, a few tiny pebbles near the banks. No bridge, no characters, no text. The middle stays plain and calm.
```

### 2.3 Sandufer für die Muster → `hg-ufer.png`
```
Landscape image (3:2). Top-down view of a smooth, pale, warm sandy shore filling the whole image, a thin strip of calm light-blue water along the top edge, a few tiny pebbles only in the corners. The center is completely plain sand. No objects in the middle, no characters, no text.
```

### 2.4 Wasser für das Wege-Spielfeld → `hg-wasser.png`
Quadratisch.
```
Square image (1:1). Top-down view of calm, clear pond water, light turquoise, with a very subtle soft ripple pattern evenly across the whole image. No objects, no plants, no characters, no text. Very calm and even.
```

---

## 3. Kacheln für die Spielauswahl (einzelne Bilder)

Diese Bilder sieht man auf der Startseite des Spiels. Hier darf Lernolotl vorkommen (Vorlagenbild im Chat lassen).

### 3.1 Zehner-Brücke → `kachel-bruecke.png`
```
Landscape image (3:2), simple and calm. Lernolotl stands happily on a grassy riverbank next to a small wooden plank bridge that crosses a calm blue river. A few planks of the bridge are missing, so there are visible gaps. Main subject in the center, simple soft background, no text, no numbers.
```

### 3.2 Muster am Ufer → `kachel-muster.png`
```
Landscape image (3:2), simple and calm. Lernolotl sits on a sandy shore and lays a neat row of objects in a repeating pattern: coral seashell, blue pebble, blue pebble, coral seashell, blue pebble, and then one empty spot at the end of the row. Main subject in the center, simple soft background, no text.
```

### 3.3 Lernolotls Weg → `kachel-weg.png`
```
Landscape image (3:2), simple and calm. Top-down view of a pond divided into a soft grid of lighter squares (5 by 4). Lernolotl swims in one square at the bottom left, a grey stone sits in one square, a small cluster of red berries sits in the top right square, and a dotted line shows a path from Lernolotl to the berries going around the stone. No text, no arrows with letters.
```

---

## 4. Optional: Vorschaubild für Pinterest/Teilen → `teaser.png`
Nicht für das Spiel selbst, sondern für Pinterest oder als `og:image`. Das Skript verarbeitet es nicht; einfach selbst als WebP/PNG speichern.
```
Wide image (roughly 1.9:1). Lernolotl waves happily at the edge of a calm pond with lily pads. Around him, three small floating cards show a wooden plank bridge, a row of seashells and pebbles, and a small grid with a dotted path. Calm pastel colors, lots of free space on the left side for a title that I will add later. No text in the image.
```

---

## Übersicht: Welche Datei landet wo?

| Rohbild in `rohbilder/` | wird zu (in `spiele/teich/bilder/`) | wofür |
|---|---|---|
| `lernolotl-posen.png` | `lernolotl/schwimmt.webp`, `schlaeft.webp`, `ruhig.webp` | Wege-Spiel, Pause, reizarmer Modus |
| `bruecke-planken.png` | `bruecke/planke-1.webp`, `-2`, `-3` | Brückenplanken |
| `muster-dinge.png` | `muster/muschel.webp`, `stein`, `blatt`, `seerose`, `fisch`, `schnecke` | Muster-Spiel |
| `weg-dinge.png` | `weg/stein.webp`, `weg/futter.webp` | Wege-Spiel |
| `teich-sammlung.png` | `teich/seerose.webp` … `teich/kaefer.webp` (12 Stück) | Belohnungen „Mein Teich“ |
| `hg-teich.png` | `hintergrund/teich.webp` | Startseite, „Mein Teich“ |
| `hg-fluss.png` | `bruecke/fluss.webp` | Brücken-Spiel |
| `hg-ufer.png` | `muster/ufer.webp` | Muster-Spiel |
| `hg-wasser.png` | `weg/wasser.webp` | Wege-Spiel |
| `kachel-bruecke.png`, `kachel-muster.png`, `kachel-weg.png` | `kacheln/bruecke.webp`, `muster`, `weg` | Spielauswahl |

**Tipp für neue Themen später (Dinos, Züge, Weltall):** Dieselben Prompts mit anderem Motiv verwenden und mit denselben Dateinamen in einem eigenen Bilderordner speichern. Im Code muss dann nur umgeschaltet werden, welcher Bilderordner gilt (`bilderOrdner` oben in `kern.js`). Eine Themenwahl im Erwachsenen-Bereich baue ich dir, wenn es so weit ist.
