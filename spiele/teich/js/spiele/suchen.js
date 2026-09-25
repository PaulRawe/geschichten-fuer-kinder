/* =====================================================
   Spiel: Such-Teich (Wimmelbild)
   Übt: genaues Hinsehen, visuelle Unterscheidung, Zählen,
        Arbeitsgedächtnis (mehrere Dinge gleichzeitig suchen)
   Der Teich ist voller Dinge, Lernolotl sucht bestimmte.
   Jede Szene wird neu verteilt -> endlos.
   Oben stehen die gesuchten Dinge als Bild mit Zähler,
   so klappt es auch ohne Lesen.
   Bilder: bilder/teich/<ding>.webp (schon vorhanden),
           bilder/hintergrund/teich.webp, bilder/kacheln/suchen.webp
   ===================================================== */
(function () {
  'use strict';

  const STUFEN = [
    '6 Dinge, 1 gesucht',
    '9 Dinge, 2 gleiche suchen',
    '12 Dinge, 3 gleiche suchen',
    '16 Dinge, 2 verschiedene suchen',
    '20 Dinge, alle einer Sorte finden',
    '24 Dinge, 2 Sorten je 2',
    '30 Dinge, verschieden groß und gedreht',
    '36 Dinge, 3 Sorten je 2'
  ];
  const PARAM = {
    1: { n: 6, sorten: 1, je: 1 }, 2: { n: 9, sorten: 1, je: 2 }, 3: { n: 12, sorten: 1, je: 3 },
    4: { n: 16, sorten: 2, je: 1 }, 5: { n: 20, sorten: 1, je: 4, alle: true }, 6: { n: 24, sorten: 2, je: 2 },
    7: { n: 30, sorten: 2, je: 3, wild: true }, 8: { n: 36, sorten: 3, je: 2, wild: true }
  };
  // [Einzahl, Mehrzahl, Geschlecht]
  const NAME = {
    seerose: ['Seerose', 'Seerosen', 'f'], fisch: ['Fisch', 'Fische', 'm'], stein: ['Stein', 'Steine', 'm'],
    schilf: ['Schilf', 'Schilf', 'n'], muschel: ['Muschel', 'Muscheln', 'f'], libelle: ['Libelle', 'Libellen', 'f'],
    frosch: ['Frosch', 'Frösche', 'm'], schnecke: ['Schnecke', 'Schnecken', 'f'], blume: ['Blume', 'Blumen', 'f'],
    krebs: ['Krebs', 'Krebse', 'm'], entchen: ['Entchen', 'Entchen', 'n'], kaefer: ['Käfer', 'Käfer', 'm']
  };
  const ZAHL = ['', 'ein', 'zwei', 'drei', 'vier', 'fünf'];
  const DEN = { m: 'den', f: 'die', n: 'das' };
  const EIN = { m: 'ein', f: 'eine', n: 'ein' };

  function phrase(id, anzahl) {
    const n = NAME[id];
    return anzahl === 1 ? DEN[n[2]] + ' ' + n[0] : ZAHL[anzahl] + ' ' + n[1];
  }
  function liste(teile) {
    return teile.length === 1 ? teile[0] : teile.slice(0, -1).join(', ') + ' und ' + teile[teile.length - 1];
  }

  const KACHEL_ERSATZ = '<svg viewBox="0 0 120 90"><rect width="120" height="90" rx="14" fill="#bfe3ec"/>' +
    '<ellipse cx="24" cy="24" rx="12" ry="6" fill="#66bb6a"/><circle cx="24" cy="21" r="4" fill="#f5a7b8"/>' +
    '<ellipse cx="70" cy="20" rx="10" ry="6" fill="#fbbf24"/><ellipse cx="96" cy="56" rx="11" ry="7" fill="#7cc36b"/>' +
    '<ellipse cx="40" cy="64" rx="11" ry="7" fill="#9aa3a0"/><ellipse cx="78" cy="72" rx="10" ry="6" fill="#e2674a"/>' +
    '<circle cx="54" cy="42" r="15" fill="none" stroke="#3d5f75" stroke-width="4"/><path d="M65 53l10 10" stroke="#3d5f75" stroke-width="5" stroke-linecap="round"/></svg>';

  function erzeuge(stufe, z) {
    const p = PARAM[Math.min(stufe, 8)];
    const alleIds = Object.keys(NAME);
    const kandidaten = p.je > 1 ? alleIds.filter(function (id) { return id !== 'schilf'; }) : alleIds;
    const ziele = z.mischen(kandidaten).slice(0, p.sorten);
    const rest = alleIds.filter(function (id) { return ziele.indexOf(id) < 0; });

    const dinge = [];
    ziele.forEach(function (id) { for (let i = 0; i < p.je; i++) dinge.push({ id: id, ziel: true }); });
    while (dinge.length < p.n) dinge.push({ id: z.wahl(rest), ziel: false });

    // Verteilen: Raster (für 4:3) mit leichtem Versatz, damit nichts überlappt
    const spalten = Math.ceil(Math.sqrt(p.n * 4 / 3));
    const zeilen = Math.ceil(p.n / spalten);
    const zellen = z.mischen(Array.from({ length: spalten * zeilen }, function (_, i) { return i; })).slice(0, p.n);
    const basis = Math.min(100 / spalten, 75 / zeilen) * 0.78;
    const gemischt = z.mischen(dinge);
    gemischt.forEach(function (d, i) {
      const c = zellen[i] % spalten, r = Math.floor(zellen[i] / spalten);
      const groesse = p.wild ? basis * (0.7 + z.zahl() * 0.3) : basis;
      d.b = groesse;
      d.x = (c + 0.5) * 100 / spalten + (z.zahl() - 0.5) * (100 / spalten - groesse) * 0.8;
      d.y = (r + 0.5) * 100 / zeilen + (z.zahl() - 0.5) * (100 / zeilen - groesse * 4 / 3) * 0.6;
      d.dreh = p.wild ? z.int(-28, 28) : z.int(-6, 6);
    });

    const teile = ziele.map(function (id) { return phrase(id, p.je); });
    let text = 'Finde ' + liste(teile) + '.';
    if (p.alle) text = 'Finde alle ' + NAME[ziele[0]][1] + '. Es sind ' + ZAHL[p.je] + '.';
    return {
      dinge: gemischt, ziele: ziele, je: p.je,
      text: text,
      sprechText: 'Lernolotl sucht etwas im Teich. ' + text,
      tippText: 'Schau mal, da leuchtet etwas.'
    };
  }

  function zeige(fl, a, api) {
    const h = api.h;
    let fehl = 0;
    const gefunden = {};
    a.ziele.forEach(function (id) { gefunden[id] = 0; });

    // Leiste oben: gesuchte Dinge als Bild + Zähler
    const zaehlerEl = {};
    const leiste = h('div', { class: 'such-leiste', 'aria-live': 'polite' }, a.ziele.map(function (id) {
      zaehlerEl[id] = h('span', { class: 'such-zahl' }, '0 / ' + a.je);
      return h('div', { class: 'such-ziel', 'data-id': id }, [
        api.bild('teich/' + id, NAME[id][0], api.teichErsatz[id], 'such-ziel-bild'),
        zaehlerEl[id]
      ]);
    }));

    const knoepfe = a.dinge.map(function (d) {
      const b = h('button', {
        type: 'button', class: 'such-ding', 'aria-label': NAME[d.id][0],
        style: { left: d.x + '%', top: d.y + '%', width: d.b + '%', transform: 'translate(-50%, -50%) rotate(' + d.dreh + 'deg)' },
        onclick: function () { tippe(d, b); }
      }, api.bild('teich/' + d.id, '', api.teichErsatz[d.id], 'such-bild'));
      d.el = b;
      return b;
    });

    function alleGefunden() { return a.ziele.every(function (id) { return gefunden[id] >= a.je; }); }

    function tippe(d, b) {
      if (api.istFertig() || d.gefunden) return;
      if (d.ziel) {
        d.gefunden = true;
        b.classList.add('gefunden');
        b.classList.remove('leuchten');
        gefunden[d.id]++;
        zaehlerEl[d.id].textContent = gefunden[d.id] + ' / ' + a.je;
        if (gefunden[d.id] >= a.je) zaehlerEl[d.id].parentNode.classList.add('erledigt');
        if (alleGefunden()) {
          const wertung = fehl <= 1 ? 'gut' : (fehl > 8 ? 'schwer' : 'ok');
          api.antwort(true, 'Alle gefunden! Lernolotl freut sich.', wertung);
        } else {
          const offen = a.je - gefunden[d.id];
          api.hinweis(offen > 0 ? 'Gefunden! Noch ' + (offen === 1 ? 'eins' : ZAHL[offen]) + '.' : 'Gefunden!', 'richtig');
        }
        return;
      }
      fehl++;
      b.classList.remove('kein'); void b.offsetWidth; b.classList.add('kein');
      const n = NAME[d.id];
      api.hinweis('Das ist ' + EIN[n[2]] + ' ' + n[0] + '. ' + a.text, 'neutral');
    }

    fl.appendChild(leiste);
    fl.appendChild(h('div', { class: 'such-szene' }, [api.flaechenBild('hintergrund/teich', 'hg-bild'), h('div', { class: 'such-flaeche' }, knoepfe)]));

    return {
      tipp: function () {
        const offen = a.dinge.filter(function (d) { return d.ziel && !d.gefunden; });
        if (!offen.length) return;
        const d = offen[0];
        d.el.classList.remove('leuchten'); void d.el.offsetWidth; d.el.classList.add('leuchten');
      }
    };
  }

  Teich.registriere({
    id: 'suchen',
    titel: 'Such-Teich',
    untertitel: 'Wo ist es im Teich?',
    maxStufe: STUFEN.length,
    stufen: STUFEN,
    loloPose: 'zeigt',
    kachelErsatz: KACHEL_ERSATZ,
    erzeuge: erzeuge,
    zeige: zeige
  });
})();
