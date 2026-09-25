/* =====================================================
   Spiel: Zehner-Brücke
   Übt: Zahlen ergänzen / zerlegen (bis 5, 10, 20)
   Bilder: bilder/bruecke/fluss.webp, planke-1/2/3.webp
           bilder/kacheln/bruecke.webp
   ===================================================== */
(function () {
  'use strict';

  const STUFEN = [
    'Brücke mit 5 Planken',
    'Brücke mit 10 Planken, Lücken am Ende',
    'Brücke mit 10 Planken, Lücken verteilt',
    '10 Planken, Antwort über Zahlenfeld',
    'Brücke mit 20 Planken',
    '20 Planken, Lücken verteilt'
  ];

  const KACHEL_ERSATZ = '<svg viewBox="0 0 120 90"><rect width="120" height="90" rx="14" fill="#bfe3ec"/>' +
    '<rect x="0" y="0" width="16" height="90" fill="#8fcf97"/><rect x="104" y="0" width="16" height="90" fill="#8fcf97"/>' +
    '<g fill="#c98b4f" stroke="#7a4f24" stroke-width="2">' +
    '<rect x="20" y="36" width="10" height="22" rx="2"/><rect x="33" y="36" width="10" height="22" rx="2"/><rect x="46" y="36" width="10" height="22" rx="2"/>' +
    '<rect x="59" y="36" width="10" height="22" rx="2"/></g><g fill="none" stroke="#3d5f75" stroke-width="2" stroke-dasharray="3 3">' +
    '<rect x="72" y="36" width="10" height="22" rx="2"/><rect x="85" y="36" width="10" height="22" rx="2"/></g></svg>';

  function erzeuge(stufe, z) {
    const ziel = stufe <= 1 ? 5 : (stufe <= 4 ? 10 : 20);
    const fehlen = ziel === 5 ? z.int(1, 4) : (ziel === 10 ? z.int(1, 9) : z.int(2, 12));
    const verteilt = stufe === 3 || stufe === 6 || (stufe === 4 && z.int(0, 1) === 1);
    const fehlt = new Array(ziel).fill(false);
    const stellen = verteilt
      ? z.mischen(Array.from({ length: ziel }, function (_, i) { return i; })).slice(0, fehlen)
      : Array.from({ length: fehlen }, function (_, i) { return ziel - fehlen + i; });
    stellen.forEach(function (i) { fehlt[i] = true; });

    const eingabe = stufe >= 4 ? 'zahlenfeld' : 'auswahl';
    let auswahl = [];
    if (eingabe === 'auswahl') {
      const kand = z.mischen([fehlen - 2, fehlen - 1, fehlen + 1, fehlen + 2].filter(function (n) { return n >= 0 && n <= ziel; }));
      auswahl = z.mischen([fehlen, kand[0], kand[1]]).sort(function (a, b) { return a - b; });
    }
    return {
      ziel: ziel, fehlen: fehlen, fehlt: fehlt, eingabe: eingabe, auswahl: auswahl,
      text: 'Die Brücke braucht ' + ziel + ' Planken. Wie viele fehlen noch?',
      tippText: 'Zähl nur die leeren Stellen. Ich habe sie für dich nummeriert.',
      loesungText: 'Es fehlen ' + fehlen + '. ' + (ziel - fehlen) + ' und ' + fehlen + ' sind zusammen ' + ziel + '.'
    };
  }

  function zeige(fl, a, api) {
    const h = api.h;
    const planken = [];
    const reihen = [];
    const proReihe = a.ziel === 20 ? 10 : a.ziel;
    for (let r = 0; r < a.ziel / proReihe; r++) {
      const reihe = h('div', { class: 'planken-reihe', style: { gridTemplateColumns: 'repeat(' + proReihe + ', minmax(0, 1fr))' } });
      for (let i = r * proReihe; i < (r + 1) * proReihe; i++) {
        let el;
        if (a.fehlt[i]) {
          el = h('div', { class: 'planke leer' }, h('span', { class: 'planke-nr' }));
        } else {
          el = h('div', { class: 'planke holz' }, api.flaechenBild('bruecke/planke-' + ((i % 3) + 1), 'planke-bild'));
        }
        planken.push(el);
        reihe.appendChild(el);
      }
      reihen.push(reihe);
    }
    const szene = h('div', { class: 'bruecke-szene' }, [
      api.flaechenBild('bruecke/fluss', 'hg-bild'),
      h('div', { class: 'ufer links' }), h('div', { class: 'ufer rechts' }),
      h('div', { class: 'bruecke', role: 'img', 'aria-label': (a.ziel - a.fehlen) + ' Planken liegen, ' + a.fehlen + ' Lücken' }, reihen)
    ]);

    function fuellen() {
      let n = 0;
      planken.forEach(function (p, i) {
        if (!a.fehlt[i]) return;
        n++;
        p.classList.remove('leer');
        p.classList.add('holz', 'neu');
        if (api.animiert()) p.style.animationDelay = (n * 0.08) + 's';
        p.innerHTML = '';
        p.appendChild(api.flaechenBild('bruecke/planke-' + ((i % 3) + 1), 'planke-bild'));
      });
    }
    function nummerieren() {
      let n = 0;
      planken.forEach(function (p, i) {
        if (!a.fehlt[i]) return;
        n++;
        const nr = p.querySelector('.planke-nr');
        if (nr) nr.textContent = String(n);
        p.classList.add('markiert');
      });
    }

    const knoepfe = [];
    const zahlen = a.eingabe === 'auswahl' ? a.auswahl : Array.from({ length: a.ziel + 1 }, function (_, i) { return i; });
    const eingabe = h('div', { class: 'eingabe ' + (a.eingabe === 'auswahl' ? 'zahl-auswahl' : 'zahlenfeld' + (a.ziel === 20 ? ' gross' : '')) },
      zahlen.map(function (n) {
        const b = h('button', { type: 'button', class: 'zahl-knopf', onclick: function () {
          if (api.istFertig()) return;
          if (n === a.fehlen) {
            b.classList.add('richtig');
            fuellen();
            api.antwort(true, 'Genau! ' + (a.ziel - a.fehlen) + ' und ' + a.fehlen + ' sind zusammen ' + a.ziel + '.');
          } else {
            b.classList.add('daneben');
            b.disabled = true;
            api.antwort(false, 'Zähl die leeren Stellen noch einmal.');
          }
        } }, String(n));
        knoepfe.push({ n: n, b: b });
        return b;
      }));

    fl.appendChild(szene);
    fl.appendChild(eingabe);

    return {
      tipp: nummerieren,
      loesungZeigen: function () {
        nummerieren();
        fuellen();
        knoepfe.forEach(function (k) { if (k.n === a.fehlen) k.b.classList.add('richtig'); });
      }
    };
  }

  Teich.registriere({
    id: 'bruecke',
    titel: 'Zehner-Brücke',
    untertitel: 'Wie viele Planken fehlen?',
    maxStufe: STUFEN.length,
    stufen: STUFEN,
    kachelErsatz: KACHEL_ERSATZ,
    erzeuge: erzeuge,
    zeige: zeige
  });
})();
