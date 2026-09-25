/* =====================================================
   Spiel: Teich-Memory
   Übt: Merkfähigkeit, Aufmerksamkeit; ab Stufe 7 Bild und Wort
   Jede Runde neu gemischt, Motive aus dem Teich -> endlos.
   Keine Zeit, keine Züge-Anzeige. Nicht passende Karten
   bleiben kurz offen und drehen sich dann ruhig zurück.
   Bilder: bilder/teich/<ding>.webp (schon vorhanden),
           bilder/memory/rueckseite.webp, bilder/kacheln/memory.webp
   ===================================================== */
(function () {
  'use strict';

  const STUFEN = [
    '2 Paare (4 Karten)',
    '3 Paare (6 Karten)',
    '4 Paare (8 Karten)',
    '6 Paare (12 Karten)',
    '8 Paare (16 Karten)',
    '10 Paare (20 Karten)',
    'Bild und Wort: 6 Paare',
    'Bild und Wort: 8 Paare'
  ];
  const PARAM = {
    1: { paare: 2, spalten: 2 }, 2: { paare: 3, spalten: 3 }, 3: { paare: 4, spalten: 4 },
    4: { paare: 6, spalten: 4 }, 5: { paare: 8, spalten: 4 }, 6: { paare: 10, spalten: 5 },
    7: { paare: 6, spalten: 4, wort: true }, 8: { paare: 8, spalten: 4, wort: true }
  };
  // Kurze Wörter für die Wortkarten (Nomen groß, wie es richtig ist)
  const WORT = {
    seerose: 'Seerose', fisch: 'Fisch', stein: 'Stein', schilf: 'Schilf', muschel: 'Muschel', libelle: 'Libelle',
    frosch: 'Frosch', schnecke: 'Schnecke', blume: 'Blume', krebs: 'Krebs', entchen: 'Entchen', kaefer: 'Käfer'
  };

  const KACHEL_ERSATZ = '<svg viewBox="0 0 120 90"><rect width="120" height="90" rx="14" fill="#e4f4f7"/>' +
    '<g stroke="#3d5f75" stroke-width="2"><rect x="14" y="14" width="24" height="28" rx="5" fill="#7ecac3"/><rect x="48" y="14" width="24" height="28" rx="5" fill="#fff"/>' +
    '<rect x="82" y="14" width="24" height="28" rx="5" fill="#7ecac3"/><rect x="14" y="50" width="24" height="28" rx="5" fill="#fff"/>' +
    '<rect x="48" y="50" width="24" height="28" rx="5" fill="#7ecac3"/><rect x="82" y="50" width="24" height="28" rx="5" fill="#7ecac3"/></g>' +
    '<circle cx="60" cy="28" r="7" fill="#f28b5f"/><circle cx="26" cy="64" r="7" fill="#f28b5f"/></svg>';

  function erzeuge(stufe, z) {
    const p = PARAM[Math.min(stufe, 8)];
    const ids = z.mischen(Object.keys(WORT)).slice(0, p.paare);
    let karten = [];
    ids.forEach(function (id) {
      karten.push({ id: id, art: 'bild' });
      karten.push({ id: id, art: p.wort ? 'wort' : 'bild' });
    });
    karten = z.mischen(karten);
    return {
      karten: karten, paare: p.paare, spalten: p.spalten, wort: !!p.wort,
      text: p.wort ? 'Finde die Paare: Bild und Wort gehören zusammen.' : 'Finde die Paare.',
      sprechText: p.wort ? 'Finde die Paare. Ein Bild und das passende Wort gehören zusammen.' : 'Finde die Paare. Dreh immer zwei Karten um.',
      tippText: 'Schau genau hin: Lernolotl zeigt dir kurz die Karten.'
    };
  }

  function zeige(fl, a, api) {
    const h = api.h;
    const namen = {};
    api.teichDinge.forEach(function (d) { namen[d.id] = d.name; });
    let offen = [];
    const gefunden = new Set();
    let sperre = false, fehl = 0;
    const warte = api.animiert() ? 1500 : 1800;

    const zaehler = h('div', { class: 'memory-zaehler', 'aria-live': 'polite' });
    function zaehlerSetzen() { zaehler.textContent = 'Paare: ' + (gefunden.size / 2) + ' von ' + a.paare; }

    const knoepfe = a.karten.map(function (k, i) {
      const inhalt = k.art === 'wort'
        ? h('span', { class: 'memory-wort' }, WORT[k.id])
        : api.bild('teich/' + k.id, '', api.teichErsatz[k.id], 'memory-bild');
      const b = h('button', { type: 'button', class: 'karte', 'aria-label': 'Karte ' + (i + 1) + ', verdeckt', onclick: function () { tippe(i); } }, [
        h('span', { class: 'karte-innen' }, [
          h('span', { class: 'karte-rueck' }, api.flaechenBild('memory/rueckseite', 'rueck-bild')),
          h('span', { class: 'karte-vorn' }, inhalt)
        ])
      ]);
      return b;
    });
    function beschriften(i) {
      const k = a.karten[i], b = knoepfe[i];
      const sichtbar = b.classList.contains('offen') || gefunden.has(i);
      b.setAttribute('aria-label', 'Karte ' + (i + 1) + (sichtbar ? ': ' + (k.art === 'wort' ? 'Wort ' + WORT[k.id] : 'Bild ' + (namen[k.id] || WORT[k.id])) : ', verdeckt'));
    }

    function tippe(i) {
      if (api.istFertig() || sperre || gefunden.has(i) || offen.indexOf(i) >= 0) return;
      knoepfe[i].classList.add('offen');
      beschriften(i);
      offen.push(i);
      if (offen.length < 2) return;
      const x = offen[0], y = offen[1];
      offen = [];
      if (a.karten[x].id === a.karten[y].id) {
        gefunden.add(x); gefunden.add(y);
        knoepfe[x].classList.add('gefunden'); knoepfe[y].classList.add('gefunden');
        zaehlerSetzen();
        if (gefunden.size === a.karten.length) {
          const wertung = fehl <= a.paare ? 'gut' : (fehl > a.paare * 3 ? 'schwer' : 'ok');
          api.antwort(true, 'Alle Paare gefunden! Toll gemerkt.', wertung);
        } else {
          api.hinweis('Ein Paar: ' + WORT[a.karten[x].id] + '!', 'richtig');
        }
        return;
      }
      fehl++;
      sperre = true;
      api.hinweis('Kein Paar. Merk dir, wo die beiden liegen.', 'neutral');
      setTimeout(function () {
        knoepfe[x].classList.remove('offen'); knoepfe[y].classList.remove('offen');
        beschriften(x); beschriften(y);
        sperre = false;
      }, warte);
    }

    const raster = h('div', { class: 'memory-raster', style: { gridTemplateColumns: 'repeat(' + a.spalten + ', minmax(0, 1fr))' } }, knoepfe);
    fl.appendChild(zaehler);
    fl.appendChild(h('div', { class: 'memory-szene' + (a.karten.length >= 16 ? ' gross' : '') }, [api.flaechenBild('hintergrund/teich', 'hg-bild'), raster]));
    zaehlerSetzen();

    return {
      tipp: function () {
        if (sperre) return;
        sperre = true;
        let zeigen;
        if (offen.length === 1) {
          const partner = a.karten.findIndex(function (k, j) { return j !== offen[0] && k.id === a.karten[offen[0]].id; });
          zeigen = [partner];
        } else {
          zeigen = a.karten.map(function (_, j) { return j; }).filter(function (j) { return !gefunden.has(j) && offen.indexOf(j) < 0; });
        }
        zeigen.forEach(function (j) { knoepfe[j].classList.add('offen', 'spicken'); });
        setTimeout(function () {
          zeigen.forEach(function (j) { knoepfe[j].classList.remove('offen', 'spicken'); });
          sperre = false;
        }, 1400);
      },
      tippText: function () {
        return offen.length === 1 ? 'Schau: Da liegt die passende Karte.' : 'Schau genau hin: Lernolotl zeigt dir kurz alle Karten.';
      }
    };
  }

  Teich.registriere({
    id: 'memory',
    titel: 'Teich-Memory',
    untertitel: 'Finde die Paare',
    maxStufe: STUFEN.length,
    stufen: STUFEN,
    kachelErsatz: KACHEL_ERSATZ,
    erzeuge: erzeuge,
    zeige: zeige
  });
})();
