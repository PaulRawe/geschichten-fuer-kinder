/* =====================================================
   Spiel: Lernolotls Weg
   Übt: Planen, Reihenfolgen, Richtungen (Vorstufe Programmieren)
   Jedes Level wird zufällig erzeugt und automatisch auf
   Lösbarkeit geprüft (Breitensuche) -> unendlich viele Level.
   Bilder: bilder/weg/wasser.webp, stein.webp, futter.webp
           bilder/lernolotl/schwimmt.webp, bilder/kacheln/weg.webp
   ===================================================== */
(function () {
  'use strict';

  const STUFEN = [
    '4×4, keine Steine, kurzer Weg',
    '4×4, 2 Steine',
    '5×5, 3 Steine',
    '5×5, 5 Steine, längerer Weg',
    '6×6, 7 Steine',
    '6×6, 9 Steine, Umwege nötig'
  ];
  const PARAM = {
    1: { n: 4, steine: 0, min: 2, max: 3 },
    2: { n: 4, steine: 2, min: 3, max: 4 },
    3: { n: 5, steine: 3, min: 4, max: 5 },
    4: { n: 5, steine: 5, min: 5, max: 6 },
    5: { n: 6, steine: 7, min: 6, max: 8 },
    6: { n: 6, steine: 9, min: 7, max: 10 }
  };
  const RICHTUNG = {
    hoch: { dr: -1, dc: 0, grad: 0, name: 'nach oben' },
    rechts: { dr: 0, dc: 1, grad: 90, name: 'nach rechts' },
    runter: { dr: 1, dc: 0, grad: 180, name: 'nach unten' },
    links: { dr: 0, dc: -1, grad: 270, name: 'nach links' }
  };
  const PFEIL = function (grad, groesse) {
    return '<svg viewBox="0 0 24 24" width="' + groesse + '" height="' + groesse + '" style="transform:rotate(' + grad + 'deg)" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6"/></svg>';
  };
  const STEIN_ERSATZ = '<svg viewBox="0 0 60 60"><ellipse cx="30" cy="33" rx="22" ry="16" fill="#8d9894"/><ellipse cx="23" cy="27" rx="8" ry="4" fill="#b3bcb8"/></svg>';
  const FUTTER_ERSATZ = '<svg viewBox="0 0 60 60"><circle cx="21" cy="36" r="11" fill="#f28b5f"/><circle cx="39" cy="36" r="11" fill="#f28b5f"/><circle cx="30" cy="22" r="11" fill="#f6a483"/><path d="M30 11q5-7 12-4" stroke="#4e9a5a" stroke-width="4" fill="none" stroke-linecap="round"/></svg>';
  const KACHEL_ERSATZ = '<svg viewBox="0 0 120 90"><rect width="120" height="90" rx="14" fill="#bfe3ec"/>' +
    '<g fill="#e4f4f7"><rect x="14" y="10" width="26" height="22" rx="5"/><rect x="47" y="10" width="26" height="22" rx="5"/><rect x="80" y="10" width="26" height="22" rx="5"/>' +
    '<rect x="14" y="36" width="26" height="22" rx="5"/><rect x="47" y="36" width="26" height="22" rx="5"/><rect x="80" y="36" width="26" height="22" rx="5"/>' +
    '<rect x="14" y="62" width="26" height="22" rx="5"/><rect x="47" y="62" width="26" height="22" rx="5"/><rect x="80" y="62" width="26" height="22" rx="5"/></g>' +
    '<ellipse cx="60" cy="47" rx="9" ry="6" fill="#8d9894"/><circle cx="93" cy="21" r="7" fill="#f28b5f"/><circle cx="27" cy="73" r="8" fill="#a9ddb6" stroke="#2f4f45" stroke-width="2"/>' +
    '<path d="M27 64V21h58" fill="none" stroke="#3d5f75" stroke-width="3" stroke-dasharray="4 4"/></svg>';

  function key(r, c) { return r + ',' + c; }

  function kuerzesterWeg(n, start, ziel, steine) {
    const vorher = {};
    const q = [start];
    vorher[key(start.r, start.c)] = null;
    while (q.length) {
      const p = q.shift();
      if (p.r === ziel.r && p.c === ziel.c) {
        const weg = [];
        let k = key(p.r, p.c);
        while (vorher[k]) { weg.unshift(vorher[k].richtung); k = vorher[k].von; }
        return weg;
      }
      for (const name in RICHTUNG) {
        const d = RICHTUNG[name];
        const nr = p.r + d.dr, nc = p.c + d.dc, k2 = key(nr, nc);
        if (nr < 0 || nc < 0 || nr >= n || nc >= n || steine.has(k2) || k2 in vorher) continue;
        vorher[k2] = { von: key(p.r, p.c), richtung: name };
        q.push({ r: nr, c: nc });
      }
    }
    return null;
  }

  function erzeuge(stufe, z) {
    let p = PARAM[Math.min(stufe, 6)];
    for (let versuch = 0; versuch < 800; versuch++) {
      if (versuch === 400) p = Object.assign({}, p, { min: p.min - 1, max: p.max + 2 });
      const start = { r: z.int(0, p.n - 1), c: z.int(0, p.n - 1) };
      const ziel = { r: z.int(0, p.n - 1), c: z.int(0, p.n - 1) };
      if (start.r === ziel.r && start.c === ziel.c) continue;
      const steine = new Set();
      let schutz = 0;
      while (steine.size < p.steine && schutz++ < 200) {
        const r = z.int(0, p.n - 1), c = z.int(0, p.n - 1);
        if ((r === start.r && c === start.c) || (r === ziel.r && c === ziel.c)) continue;
        steine.add(key(r, c));
      }
      const weg = kuerzesterWeg(p.n, start, ziel, steine);
      if (!weg || weg.length < p.min || weg.length > p.max) continue;
      return {
        n: p.n, start: start, ziel: ziel, steine: Array.from(steine), weg: weg,
        plaetze: Math.min(12, Math.max(6, weg.length + 3)),
        text: 'Leg Pfeile, damit Lernolotl zum Futter schwimmt.',
        sprechText: 'Leg Pfeile, damit Lernolotl zum Futter schwimmt. Dann tippe auf Losschwimmen.',
        tippText: 'Die Punkte zeigen dir den Anfang vom Weg.',
        loesungText: 'So kommt Lernolotl zum Futter. Schau, wie er schwimmt.'
      };
    }
    // Sollte nie passieren: einfacher Notfall-Level
    return { n: 4, start: { r: 3, c: 0 }, ziel: { r: 3, c: 2 }, steine: [], weg: ['rechts', 'rechts'], plaetze: 6,
      text: 'Leg Pfeile, damit Lernolotl zum Futter schwimmt.', tippText: 'Die Punkte zeigen dir den Weg.', loesungText: 'So kommt Lernolotl zum Futter.' };
  }

  function zeige(fl, a, api) {
    const h = api.h;
    const steine = new Set(a.steine);
    let programm = [];
    let laeuft = false;
    let pos = { r: a.start.r, c: a.start.c };
    let spur = new Set();
    let hinweise = new Set();

    const zellen = [];
    const raster = h('div', { class: 'weg-raster', style: { gridTemplateColumns: 'repeat(' + a.n + ', minmax(0, 1fr))' }, role: 'img', 'aria-label': 'Teich mit ' + a.n + ' mal ' + a.n + ' Feldern' });
    for (let r = 0; r < a.n; r++) {
      for (let c = 0; c < a.n; c++) {
        const z = h('div', { class: 'weg-zelle' });
        zellen.push(z);
        raster.appendChild(z);
      }
    }
    const loloEl = h('div', { class: 'weg-lolo' }, api.bild('lernolotl/schwimmt', 'Lernolotl', null, 'weg-lolo-bild'));
    // Fehlt "schwimmt.webp", nimm das Standbild
    const fallbackImg = loloEl.querySelector('img');
    if (fallbackImg) fallbackImg.addEventListener('error', function () { loloEl.innerHTML = ''; loloEl.appendChild(api.lolo('winkt')); });

    function zeichnen() {
      for (let r = 0; r < a.n; r++) {
        for (let c = 0; c < a.n; c++) {
          const z = zellen[r * a.n + c];
          const k = key(r, c);
          z.innerHTML = '';
          z.className = 'weg-zelle';
          if (steine.has(k)) { z.classList.add('stein'); z.appendChild(api.bild('weg/stein', 'Stein', STEIN_ERSATZ, 'weg-ding')); }
          else if (r === a.ziel.r && c === a.ziel.c && !(pos.r === r && pos.c === c)) { z.classList.add('ziel'); z.appendChild(api.bild('weg/futter', 'Futter', FUTTER_ERSATZ, 'weg-ding')); }
          if (spur.has(k)) z.appendChild(h('span', { class: 'spur' }));
          else if (hinweise.has(k)) z.appendChild(h('span', { class: 'spur hinweis' }));
          if (pos.r === r && pos.c === c) z.appendChild(loloEl);
        }
      }
    }

    const plaetze = h('div', { class: 'programm', style: { gridTemplateColumns: 'repeat(' + Math.min(a.plaetze, 6) + ', minmax(0, 1fr))' }, 'aria-label': 'Dein Weg' });
    function programmZeichnen() {
      plaetze.innerHTML = '';
      for (let i = 0; i < a.plaetze; i++) {
        const r = programm[i];
        plaetze.appendChild(h('div', { class: 'platz' + (r ? ' voll' : ''), html: r ? PFEIL(RICHTUNG[r].grad, 22) : '' }));
      }
      zurueckKnopf.disabled = laeuft || programm.length === 0;
      losKnopf.disabled = laeuft || programm.length === 0;
      pfeilKnoepfe.forEach(function (b) { b.disabled = laeuft || programm.length >= a.plaetze; });
    }

    const pfeilKnoepfe = ['hoch', 'rechts', 'runter', 'links'].map(function (r) {
      return h('button', { type: 'button', class: 'pfeil-knopf', 'aria-label': 'Pfeil ' + RICHTUNG[r].name, html: PFEIL(RICHTUNG[r].grad, 30), onclick: function () {
        if (laeuft || api.istFertig() || programm.length >= a.plaetze) return;
        programm.push(r);
        if (spur.size) { spur = new Set(); pos = { r: a.start.r, c: a.start.c }; zeichnen(); }
        programmZeichnen();
      } });
    });
    const zurueckKnopf = h('button', { type: 'button', class: 'knopf neben', onclick: function () {
      if (laeuft) return;
      programm.pop();
      programmZeichnen();
    } }, 'Pfeil weg');
    const losKnopf = h('button', { type: 'button', class: 'knopf haupt', onclick: function () { schwimmen(programm.slice(), false); } }, 'Losschwimmen');

    function schwimmen(befehle, istLoesung) {
      if (laeuft || (!istLoesung && api.istFertig())) return;
      laeuft = true;
      pos = { r: a.start.r, c: a.start.c };
      spur = new Set();
      zeichnen();
      programmZeichnen();
      let i = 0;
      const takt = api.animiert() ? 380 : 0;
      function schritt() {
        if (i >= befehle.length) return ende(pos.r === a.ziel.r && pos.c === a.ziel.c ? 'ziel' : 'kurz');
        const d = RICHTUNG[befehle[i]];
        const nr = pos.r + d.dr, nc = pos.c + d.dc;
        if (nr < 0 || nc < 0 || nr >= a.n || nc >= a.n) return ende('rand');
        if (steine.has(key(nr, nc))) return ende('stein');
        spur.add(key(pos.r, pos.c));
        pos = { r: nr, c: nc };
        i++;
        zeichnen();
        if (pos.r === a.ziel.r && pos.c === a.ziel.c) return ende('ziel');
        if (takt) setTimeout(schritt, takt); else schritt();
      }
      function ende(ergebnis) {
        laeuft = false;
        if (istLoesung) { programmZeichnen(); return; }
        if (ergebnis === 'ziel') {
          programmZeichnen();
          api.antwort(true, 'Geschafft! Lernolotl hat sein Futter gefunden.');
          return;
        }
        const text = ergebnis === 'stein' ? 'Oh, da ist ein Stein im Weg. Probier einen anderen Weg.'
          : ergebnis === 'rand' ? 'Da ist der Rand vom Teich. Probier einen anderen Pfeil.'
          : 'Noch nicht ganz da. Leg noch mehr Pfeile dazu.';
        api.antwort(false, text);
        setTimeout(function () {
          if (api.istFertig()) return;
          pos = { r: a.start.r, c: a.start.c };
          spur = new Set();
          zeichnen();
          programmZeichnen();
        }, takt ? 1100 : 0);
        programmZeichnen();
      }
      if (takt) setTimeout(schritt, takt); else schritt();
    }

    fl.appendChild(h('div', { class: 'weg-szene' }, [api.flaechenBild('weg/wasser', 'hg-bild'), raster]));
    fl.appendChild(h('div', { class: 'programm-kopf' }, 'Dein Weg'));
    fl.appendChild(plaetze);
    fl.appendChild(h('div', { class: 'eingabe pfeile' }, pfeilKnoepfe));
    fl.appendChild(h('div', { class: 'knopf-reihe weg-steuerung' }, [zurueckKnopf, losKnopf]));
    zeichnen();
    programmZeichnen();

    return {
      tipp: function () {
        let p = { r: a.start.r, c: a.start.c };
        hinweise = new Set();
        const anzahl = Math.max(2, Math.ceil(a.weg.length / 2));
        a.weg.slice(0, anzahl).forEach(function (r) { p = { r: p.r + RICHTUNG[r].dr, c: p.c + RICHTUNG[r].dc }; hinweise.add(key(p.r, p.c)); });
        hinweise.delete(key(a.ziel.r, a.ziel.c));
        zeichnen();
      },
      loesungZeigen: function () {
        programm = a.weg.slice(0, a.plaetze);
        programmZeichnen();
        setTimeout(function () { schwimmen(programm.slice(), true); }, api.animiert() ? 700 : 0);
      }
    };
  }

  Teich.registriere({
    id: 'weg',
    titel: 'Lernolotls Weg',
    untertitel: 'Leg Pfeile bis zum Futter',
    maxStufe: STUFEN.length,
    stufen: STUFEN,
    kachelErsatz: KACHEL_ERSATZ,
    erzeuge: erzeuge,
    zeige: zeige
  });
})();
