/* =====================================================
   Spiel: Muster am Ufer
   Übt: Muster erkennen und fortsetzen
   Bilder: bilder/muster/<ding>.webp (muschel, stein, blatt,
           seerose, fisch, schnecke), bilder/muster/ufer.webp
           bilder/kacheln/muster.webp
   ===================================================== */
(function () {
  'use strict';

  const STUFEN = [
    'Zwei Dinge im Wechsel (AB)',
    'Drei Dinge, eins doppelt (ABB / AAB)',
    'Drei verschiedene Dinge (ABC)',
    'Längere Muster (AABB, ABAC …)',
    'Lücke in der Mitte',
    'Lange Muster, Lücke in der Mitte, 4 Antworten'
  ];

  // Jedes Ding unterscheidet sich in Form UND Farbe.
  const DINGE = {
    muschel: { artikel: 'die', name: 'Muschel', ersatz: '<svg viewBox="0 0 60 60"><path d="M30 10C13 10 8 30 11 44h38c3-14-2-34-19-34z" fill="#f28b5f"/><path d="M30 12v31M21 15l-3 28M39 15l3 28" stroke="#fde7d9" stroke-width="3"/></svg>' },
    stein: { artikel: 'der', name: 'Stein', ersatz: '<svg viewBox="0 0 60 60"><rect x="10" y="14" width="40" height="34" rx="9" fill="#5f7fa3"/><rect x="16" y="19" width="14" height="5" rx="2.5" fill="#8fb0d1"/></svg>' },
    blatt: { artikel: 'das', name: 'Blatt', ersatz: '<svg viewBox="0 0 60 60"><path d="M10 50C10 24 26 10 52 10c0 26-16 40-42 40z" fill="#5cae62"/><path d="M12 48L46 16" stroke="#d8f0d9" stroke-width="3" stroke-linecap="round"/></svg>' },
    seerose: { artikel: 'die', name: 'Seerose', ersatz: '<svg viewBox="0 0 60 60"><g fill="#f5a7b8"><ellipse cx="30" cy="16" rx="7" ry="12"/><ellipse cx="30" cy="44" rx="7" ry="12"/><ellipse cx="16" cy="30" rx="12" ry="7"/><ellipse cx="44" cy="30" rx="12" ry="7"/></g><circle cx="30" cy="30" r="7" fill="#fbbf24"/></svg>' },
    fisch: { artikel: 'der', name: 'Fisch', ersatz: '<svg viewBox="0 0 60 60"><ellipse cx="25" cy="30" rx="17" ry="11" fill="#f2c230"/><path d="M40 30L56 18V42z" fill="#f2c230"/><circle cx="17" cy="27" r="3" fill="#2a2a2a"/></svg>' },
    schnecke: { artikel: 'die', name: 'Schnecke', ersatz: '<svg viewBox="0 0 60 60"><path d="M6 48h42c5 0 7-4 7-8" stroke="#c49a6c" stroke-width="7" stroke-linecap="round" fill="none"/><circle cx="30" cy="32" r="15" fill="#8a5a2b"/><path d="M30 32m-7 0a7 7 0 1 0 7-7" stroke="#e8c9a3" stroke-width="3.5" fill="none"/></svg>' }
  };
  const SCHLUESSEL = Object.keys(DINGE);

  const EINHEITEN = {
    1: ['AB'],
    2: ['ABB', 'AAB'],
    3: ['ABC'],
    4: ['AABB', 'ABAC', 'ABCC', 'AABC'],
    5: ['ABB', 'ABC', 'AAB', 'AABB'],
    6: ['AABB', 'ABAC', 'ABCB', 'ABCD']
  };

  const KACHEL_ERSATZ = '<svg viewBox="0 0 120 90"><rect width="120" height="90" rx="14" fill="#f1e2c2"/>' +
    '<circle cx="22" cy="45" r="10" fill="#f28b5f"/><rect x="38" y="35" width="20" height="20" rx="5" fill="#5f7fa3"/>' +
    '<circle cx="74" cy="45" r="10" fill="#f28b5f"/><rect x="90" y="35" width="20" height="20" rx="5" fill="none" stroke="#3d5f75" stroke-width="2.5" stroke-dasharray="4 3"/></svg>';

  function erzeuge(stufe, z) {
    const einheit = z.wahl(EINHEITEN[Math.min(stufe, 6)]);
    const buchst = Array.from(new Set(einheit.split('')));
    const gewaehlt = z.mischen(SCHLUESSEL).slice(0, buchst.length);
    const map = {};
    buchst.forEach(function (b, i) { map[b] = gewaehlt[i]; });

    const laenge = Math.min(10, Math.max(7, einheit.length * 2 + (einheit.length <= 2 ? 3 : 1)));
    const folge = [];
    for (let i = 0; i < laenge; i++) folge.push(map[einheit[i % einheit.length]]);

    const mitte = stufe >= 5;
    const luecke = mitte ? z.int(einheit.length, laenge - 2) : laenge - 1;
    const richtig = folge[luecke];

    const anzahl = stufe >= 6 ? 4 : 3;
    const andere = z.mischen(gewaehlt.filter(function (k) { return k !== richtig; }));
    const fremd = z.mischen(SCHLUESSEL.filter(function (k) { return gewaehlt.indexOf(k) < 0; }));
    const optionen = [richtig].concat(andere, fremd).slice(0, anzahl);

    const einheitNamen = einheit.split('').map(function (b) { return DINGE[map[b]].name; });
    return {
      folge: folge, luecke: luecke, richtig: richtig, einheitLaenge: einheit.length,
      optionen: z.mischen(optionen),
      text: 'Was gehört in die Lücke?',
      sprechText: 'Lernolotl legt eine Reihe am Ufer. Was gehört in die Lücke?',
      tippText: 'Die Farben zeigen dir, wo sich das Muster wiederholt. Sprich es leise mit.',
      loesungText: 'Das Muster wiederholt sich immer wieder: ' + einheitNamen.join(', ') + '.'
    };
  }

  function zeige(fl, a, api) {
    const h = api.h;
    const felder = a.folge.map(function (k, i) {
      const istLuecke = i === a.luecke;
      const inhalt = istLuecke
        ? h('span', { class: 'luecke-zeichen', 'aria-label': 'Lücke' }, '?')
        : api.bild('muster/' + k, DINGE[k].name, DINGE[k].ersatz, 'muster-bild');
      return h('div', { class: 'muster-feld' + (istLuecke ? ' luecke' : '') }, inhalt);
    });
    const reihe = h('div', { class: 'muster-reihe', role: 'list' }, felder.map(function (f) { f.setAttribute('role', 'listitem'); return f; }));
    const szene = h('div', { class: 'muster-szene' }, [api.flaechenBild('muster/ufer', 'hg-bild'), reihe]);

    function einsetzen() {
      const f = felder[a.luecke];
      f.classList.remove('luecke');
      f.classList.add('eingesetzt');
      f.innerHTML = '';
      f.appendChild(api.bild('muster/' + a.richtig, DINGE[a.richtig].name, DINGE[a.richtig].ersatz, 'muster-bild'));
    }
    function einheitenZeigen() {
      felder.forEach(function (f, i) {
        f.classList.add(Math.floor(i / a.einheitLaenge) % 2 === 0 ? 'einheit-a' : 'einheit-b');
        if (i % a.einheitLaenge === 0 && i > 0) f.classList.add('einheit-start');
      });
    }

    const knoepfe = [];
    const eingabe = h('div', { class: 'eingabe muster-auswahl' + (a.optionen.length === 4 ? ' vier' : '') }, a.optionen.map(function (k) {
      const b = h('button', { type: 'button', class: 'form-knopf', 'aria-label': DINGE[k].name, onclick: function () {
        if (api.istFertig()) return;
        if (k === a.richtig) {
          b.classList.add('richtig');
          einsetzen();
          api.antwort(true, 'Richtig! Da gehört ' + DINGE[k].artikel + ' ' + DINGE[k].name + ' hin.');
        } else {
          b.classList.add('daneben');
          b.disabled = true;
          api.antwort(false, 'Fast. Schau, was vor der Lücke kommt.');
        }
      } }, api.bild('muster/' + k, '', DINGE[k].ersatz, 'muster-bild'));
      knoepfe.push({ k: k, b: b });
      return b;
    }));

    fl.appendChild(szene);
    fl.appendChild(h('p', { class: 'hinweis-zeile' }, 'Tippe auf das Ding, das fehlt.'));
    fl.appendChild(eingabe);

    return {
      tipp: einheitenZeigen,
      loesungZeigen: function () {
        einheitenZeigen();
        einsetzen();
        knoepfe.forEach(function (x) { if (x.k === a.richtig) x.b.classList.add('richtig'); });
      }
    };
  }

  Teich.registriere({
    id: 'muster',
    titel: 'Muster am Ufer',
    untertitel: 'Was kommt als Nächstes?',
    maxStufe: STUFEN.length,
    stufen: STUFEN,
    kachelErsatz: KACHEL_ERSATZ,
    erzeuge: erzeuge,
    zeige: zeige
  });
})();
