/* =====================================================
   Lernolotls Teich – Kern
   -----------------------------------------------------
   Steuert Auswahl, Runden, Anpassung der Schwierigkeit,
   Spielstand (nur auf diesem Gerät), Zähler, Vorlesen,
   Geräusche und Bilder mit Ersatzgrafik.

   Jedes Spiel ist eine eigene Datei in js/spiele/ und
   meldet sich mit Teich.registriere({...}) an.
   Läuft ohne Server: index.html einfach doppelklicken.
   ===================================================== */
(function () {
  'use strict';

  /* ---------- Einstellungen, die du anpassen kannst ---------- */
  const KONFIG = {
    speicherSchluessel: 'lernolotlTeich.v1',
    // GoatCounter-Konto, das auch deine Seiten zählt:
    goatcounter: 'https://pauleheissta.goatcounter.com/count',
    zaehlerPrefix: 'teich',
    bilderOrdner: 'bilder/',
    // Ab 3 Aufgaben in Folge ohne Fehler und ohne Tipp: eine Stufe höher
    serieFuerAufstieg: 3
  };

  /* ---------- Dinge, die man im Teich sammelt (in dieser Reihenfolge) ---------- */
  const TEICH_DINGE = [
    { id: 'seerose', name: 'Seerose' },
    { id: 'fisch', name: 'Fisch' },
    { id: 'stein', name: 'Glatter Stein' },
    { id: 'schilf', name: 'Schilf' },
    { id: 'muschel', name: 'Muschel' },
    { id: 'libelle', name: 'Libelle' },
    { id: 'frosch', name: 'Frosch' },
    { id: 'schnecke', name: 'Schnecke' },
    { id: 'blume', name: 'Sumpfblume' },
    { id: 'krebs', name: 'Krebs' },
    { id: 'entchen', name: 'Entchen' },
    { id: 'kaefer', name: 'Wasserkäfer' }
  ];

  const STANDARD = {
    einstellungen: { reizarm: false, animationen: true, geraeusche: true, vorlesen: false, aufgabenProRunde: 5 },
    spiele: {},
    teich: [],
    gesamt: { runden: 0, aufgaben: 0 },
    elternGesehen: false
  };

  const spiele = [];
  let daten = ladeDaten();
  let app = null;          // <div id="teich-app">
  let runde = null;        // aktuelle Runde
  let aufgabeZustand = null;
  let elternSpaeter = false;   // "Später" gilt nur bis die Seite neu geladen wird

  /* =====================================================
     Speicher (localStorage, nur auf diesem Gerät)
     ===================================================== */
  function ladeDaten() {
    let roh = null;
    try { roh = JSON.parse(localStorage.getItem(KONFIG.speicherSchluessel) || 'null'); } catch (e) { roh = null; }
    const d = JSON.parse(JSON.stringify(STANDARD));
    if (roh && typeof roh === 'object') {
      Object.assign(d.einstellungen, roh.einstellungen || {});
      d.spiele = roh.spiele || {};
      d.teich = Array.isArray(roh.teich) ? roh.teich : [];
      Object.assign(d.gesamt, roh.gesamt || {});
      d.elternGesehen = !!roh.elternGesehen;
    }
    return d;
  }
  function speichere() {
    try { localStorage.setItem(KONFIG.speicherSchluessel, JSON.stringify(daten)); } catch (e) { /* privat-Modus o. Ä.: Spiel läuft trotzdem */ }
  }
  function stand(id) {
    if (!daten.spiele[id]) daten.spiele[id] = { stufe: 1, runden: 0, aufgaben: 0, richtig: 0 };
    return daten.spiele[id];
  }
  const E = () => daten.einstellungen;

  /* =====================================================
     Zähler (GoatCounter-Ereignisse)
     Lokal (Doppelklick / localhost) wird nichts gesendet.
     ===================================================== */
  function istLokal() {
    const h = location.hostname;
    return location.protocol === 'file:' || !h || h === 'localhost' || /^(127\.|10\.|192\.168\.)/.test(h) || h.endsWith('.local');
  }
  function zaehle(pfad, titel) {
    const voll = KONFIG.zaehlerPrefix + '/' + pfad;
    if (istLokal()) { console.log('[Teich] Zähler (lokal, nicht gesendet):', voll); return; }
    try {
      const img = new Image();
      img.src = KONFIG.goatcounter + '?p=' + encodeURIComponent(voll) + '&t=' + encodeURIComponent(titel || voll) +
        '&e=true&rnd=' + Math.random().toString(36).slice(2);
    } catch (e) { /* egal */ }
  }
  // Runde 1..20 einzeln, danach "20plus". So zählt GoatCounter jede Runde,
  // obwohl es gleiche Pfade pro Besuch nur einmal zählt.
  function rundenFach(n) { return n <= 20 ? 'nr-' + n : 'nr-20plus'; }

  /* =====================================================
     Hilfen: Elemente, Bilder, Zufall
     ===================================================== */
  function h(tag, attrs, kinder) {
    const el = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        const v = attrs[k];
        if (v == null || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'text') el.textContent = v;
        else if (k === 'html') el.innerHTML = v;
        else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
        else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
        else el.setAttribute(k, v === true ? '' : v);
      }
    }
    haenge(el, kinder);
    return el;
  }
  function haenge(el, kinder) {
    if (kinder == null) return;
    if (!Array.isArray(kinder)) kinder = [kinder];
    kinder.forEach(function (k) {
      if (k == null || k === false) return;
      if (Array.isArray(k)) haenge(el, k);
      else el.appendChild(typeof k === 'string' || typeof k === 'number' ? document.createTextNode(String(k)) : k);
    });
  }

  // Bild mit Ersatz: lädt bilder/<pfad>.webp. Fehlt die Datei,
  // erscheint stattdessen die gezeichnete Ersatzgrafik (SVG/HTML).
  function bild(pfad, alt, ersatz, klasse) {
    const hülle = h('span', { class: 'bild ' + (klasse || '') });
    const img = h('img', { src: KONFIG.bilderOrdner + pfad + '.webp', alt: alt || '', draggable: 'false', decoding: 'async' });
    if (!alt) img.setAttribute('aria-hidden', 'true');
    img.addEventListener('error', function () {
      hülle.classList.add('ersatz');
      hülle.innerHTML = ersatz || '';
      if (alt) { hülle.setAttribute('role', 'img'); hülle.setAttribute('aria-label', alt); }
    });
    hülle.appendChild(img);
    return hülle;
  }
  // Hintergrund-/Oberflächenbild: wird bei Fehlen einfach entfernt
  // (dann sieht man die CSS-Farbe darunter).
  function flaechenBild(pfad, klasse) {
    const img = h('img', { class: klasse || 'hg-bild', src: KONFIG.bilderOrdner + pfad + '.webp', alt: '', 'aria-hidden': 'true', draggable: 'false' });
    img.addEventListener('error', function () { img.remove(); });
    return img;
  }

  function zufall(seed) {
    let s = seed >>> 0;
    const r = function () {
      s = (s + 0x6D2B79F5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    return {
      zahl: r,
      int: function (a, b) { return a + Math.floor(r() * (b - a + 1)); },
      wahl: function (arr) { return arr[Math.floor(r() * arr.length)]; },
      mischen: function (arr) {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
        return a;
      }
    };
  }

  function animiert() {
    const reduziert = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return E().animationen && !E().reizarm && !reduziert;
  }

  /* =====================================================
     Vorlesen (Sprachausgabe des Browsers) & Geräusche
     ===================================================== */
  function sprich(text) {
    if (!text || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'de-DE';
      u.rate = 0.9;
      const stimmen = window.speechSynthesis.getVoices();
      const de = stimmen.find(function (v) { return v.lang && v.lang.toLowerCase().indexOf('de') === 0; });
      if (de) u.voice = de;
      window.speechSynthesis.speak(u);
    } catch (e) { /* egal */ }
  }
  function stillSein() { try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (e) { } }
  let audio = null;
  function klang(art) {
    if (!E().geraeusche) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const noten = art === 'fertig' ? [523.25, 659.25, 783.99] : [587.33, 783.99];
      noten.forEach(function (f, i) {
        const o = audio.createOscillator(), g = audio.createGain();
        const t = audio.currentTime + i * 0.14;
        o.type = 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.09, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
        o.connect(g); g.connect(audio.destination);
        o.start(t); o.stop(t + 0.4);
      });
    } catch (e) { /* egal */ }
  }

  /* =====================================================
     Kleine Symbole (Oberfläche)
     ===================================================== */
  const SYM = {
    zurueck: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
    pause: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M9 5v14M15 5v14"/></svg>',
    lautsprecher: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19 6a8.5 8.5 0 0 1 0 12"/></svg>',
    tipp: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z"/></svg>',
    schloss: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
    teich: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="14" rx="9" ry="5"/><path d="M8 13c1.5-1 2.5-1 4 0s2.5 1 4 0"/><path d="M12 9V4M12 6l3-2"/></svg>'
  };

  // Ersatz-Lernolotl (falls ein Bild fehlt)
  const LOLO_ERSATZ = '<svg viewBox="0 0 200 200"><ellipse cx="100" cy="156" rx="52" ry="32" fill="#A9DDB6" stroke="#2f4f45" stroke-width="4"/>' +
    '<g fill="#5fb89a" stroke="#2f4f45" stroke-width="4"><ellipse cx="34" cy="66" rx="22" ry="9" transform="rotate(35 34 66)"/><ellipse cx="26" cy="94" rx="22" ry="9"/><ellipse cx="34" cy="122" rx="22" ry="9" transform="rotate(-35 34 122)"/>' +
    '<ellipse cx="166" cy="66" rx="22" ry="9" transform="rotate(-35 166 66)"/><ellipse cx="174" cy="94" rx="22" ry="9"/><ellipse cx="166" cy="122" rx="22" ry="9" transform="rotate(35 166 122)"/></g>' +
    '<ellipse cx="100" cy="94" rx="62" ry="52" fill="#B8E6C3" stroke="#2f4f45" stroke-width="4"/>' +
    '<circle cx="78" cy="90" r="17" fill="#fff" fill-opacity=".5" stroke="#2f4f45" stroke-width="4"/><circle cx="122" cy="90" r="17" fill="#fff" fill-opacity=".5" stroke="#2f4f45" stroke-width="4"/>' +
    '<circle cx="78" cy="91" r="6" fill="#1f2d29"/><circle cx="122" cy="91" r="6" fill="#1f2d29"/><path d="M91 116 Q100 124 109 116" fill="none" stroke="#1f2d29" stroke-width="4" stroke-linecap="round"/></svg>';

  // Lernolotl-Bild. Fehlt eine Pose (z. B. "schlaeft"), wird "winkt" genommen,
  // fehlt auch das, die gezeichnete Ersatzfigur. Im reizarmen Modus: ruhige Pose.
  function lolo(zustand, klasse) {
    if (E().reizarm) zustand = 'ruhig';
    const hülle = h('span', { class: 'bild lolo ' + (klasse || '') });
    const img = h('img', { src: KONFIG.bilderOrdner + 'lernolotl/' + zustand + '.webp', alt: '', 'aria-hidden': 'true', draggable: 'false' });
    let versucht = false;
    img.addEventListener('error', function () {
      if (!versucht && zustand !== 'winkt') { versucht = true; img.src = KONFIG.bilderOrdner + 'lernolotl/winkt.webp'; return; }
      hülle.classList.add('ersatz');
      hülle.innerHTML = LOLO_ERSATZ;
    });
    hülle.appendChild(img);
    return hülle;
  }

  // Ersatzgrafiken für Teich-Sammelstücke
  const TEICH_ERSATZ = {
    seerose: '<svg viewBox="0 0 60 60"><ellipse cx="30" cy="38" rx="24" ry="12" fill="#66bb6a"/><circle cx="30" cy="30" r="9" fill="#f5a7b8"/><circle cx="30" cy="30" r="3.5" fill="#fbbf24"/></svg>',
    fisch: '<svg viewBox="0 0 60 60"><ellipse cx="26" cy="30" rx="17" ry="11" fill="#fbbf24"/><path d="M41 30 L56 19 L56 41 Z" fill="#fbbf24"/><circle cx="18" cy="27" r="2.5" fill="#2a2a2a"/></svg>',
    stein: '<svg viewBox="0 0 60 60"><ellipse cx="30" cy="34" rx="21" ry="14" fill="#9aa3a0"/><ellipse cx="24" cy="29" rx="7" ry="3" fill="#b9c1be"/></svg>',
    schilf: '<svg viewBox="0 0 60 60"><path d="M20 56V24M30 56V12M40 56V26" stroke="#4e9a5a" stroke-width="4" stroke-linecap="round"/><rect x="26" y="8" width="8" height="18" rx="4" fill="#8a5a2b"/></svg>',
    muschel: '<svg viewBox="0 0 60 60"><path d="M30 12C14 12 9 30 12 42h36c3-12-2-30-18-30z" fill="#f28b5f"/><path d="M30 14v27M21 17l-3 24M39 17l3 24" stroke="#fde7d9" stroke-width="2.5"/></svg>',
    libelle: '<svg viewBox="0 0 60 60"><rect x="28" y="14" width="4" height="36" rx="2" fill="#3d7fb8"/><ellipse cx="18" cy="22" rx="12" ry="5" fill="#bfe3f5"/><ellipse cx="42" cy="22" rx="12" ry="5" fill="#bfe3f5"/><ellipse cx="19" cy="31" rx="10" ry="4" fill="#bfe3f5"/><ellipse cx="41" cy="31" rx="10" ry="4" fill="#bfe3f5"/></svg>',
    frosch: '<svg viewBox="0 0 60 60"><ellipse cx="30" cy="38" rx="20" ry="13" fill="#7cc36b"/><circle cx="21" cy="24" r="7" fill="#7cc36b"/><circle cx="39" cy="24" r="7" fill="#7cc36b"/><circle cx="21" cy="23" r="3" fill="#2a2a2a"/><circle cx="39" cy="23" r="3" fill="#2a2a2a"/><path d="M23 40q7 5 14 0" stroke="#2a2a2a" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg>',
    schnecke: '<svg viewBox="0 0 60 60"><path d="M8 46h40c4 0 6-3 6-6" stroke="#c49a6c" stroke-width="7" stroke-linecap="round" fill="none"/><circle cx="30" cy="32" r="14" fill="#b07a4a"/><path d="M30 32m-6 0a6 6 0 1 0 6-6" stroke="#e8c9a3" stroke-width="3" fill="none"/></svg>',
    blume: '<svg viewBox="0 0 60 60"><path d="M30 56V30" stroke="#4e9a5a" stroke-width="4"/><g fill="#fbbf24"><circle cx="30" cy="16" r="7"/><circle cx="40" cy="24" r="7"/><circle cx="20" cy="24" r="7"/><circle cx="25" cy="33" r="7"/><circle cx="35" cy="33" r="7"/></g><circle cx="30" cy="25" r="5" fill="#f28b5f"/></svg>',
    krebs: '<svg viewBox="0 0 60 60"><ellipse cx="30" cy="36" rx="16" ry="11" fill="#e2674a"/><circle cx="12" cy="22" r="7" fill="#e2674a"/><circle cx="48" cy="22" r="7" fill="#e2674a"/><circle cx="25" cy="30" r="2.5" fill="#2a2a2a"/><circle cx="35" cy="30" r="2.5" fill="#2a2a2a"/></svg>',
    entchen: '<svg viewBox="0 0 60 60"><ellipse cx="32" cy="40" rx="20" ry="12" fill="#fcd34d"/><circle cx="22" cy="24" r="10" fill="#fcd34d"/><path d="M11 25l-8 2 8 3z" fill="#f28b5f"/><circle cx="20" cy="22" r="2.5" fill="#2a2a2a"/></svg>',
    kaefer: '<svg viewBox="0 0 60 60"><ellipse cx="30" cy="34" rx="15" ry="18" fill="#3d5f75"/><circle cx="30" cy="16" r="7" fill="#2a2a2a"/><path d="M30 18v33" stroke="#a8c5d9" stroke-width="2"/><path d="M15 28l-8-4M15 38l-8 2M45 28l8-4M45 38l8 2" stroke="#2a2a2a" stroke-width="3" stroke-linecap="round"/></svg>'
  };

  /* =====================================================
     Ansichten
     ===================================================== */
  function leeren() {
    stillSein();
    app.innerHTML = '';
    app.classList.toggle('reizarm', !!E().reizarm);
    app.classList.toggle('ruhig', !animiert());
    try { if (app.getBoundingClientRect().top < 0) app.scrollIntoView({ block: 'start' }); } catch (e) { }
  }
  function knopf(text, onclick, klasse, attrs) {
    return h('button', Object.assign({ type: 'button', class: 'knopf ' + (klasse || ''), onclick: onclick }, attrs || {}), text);
  }
  function symbolKnopf(sym, label, onclick, klasse) {
    return h('button', { type: 'button', class: 'symbol-knopf ' + (klasse || ''), 'aria-label': label, title: label, onclick: onclick, html: SYM[sym] });
  }
  function vorleseKnopf(text) {
    return symbolKnopf('lautsprecher', 'Vorlesen', function () { sprich(text); }, 'vorlesen');
  }
  function fokus(el) { if (el) setTimeout(function () { try { el.focus({ preventScroll: true }); } catch (e) { } }, 30); }

  /* ---------- Auswahl ---------- */
  function zeigeAuswahl(nurSpiel) {
    leeren();
    runde = null;
    const gruss = nurSpiel ? 'Hallo! Wollen wir ' + nurSpiel.titel + ' spielen?' : 'Hallo! Was möchtest du heute spielen?';
    const kopf = h('div', { class: 'app-kopf' }, [
      h('div', { class: 'app-titel' }, 'Lernolotls Teich'),
      h('div', { class: 'app-kopf-knoepfe' }, [
        h('button', { type: 'button', class: 'text-knopf', onclick: zeigeTeich }, 'Mein Teich'),
        h('button', { type: 'button', class: 'text-knopf eltern-knopf', onclick: zeigeTor }, 'Eltern-Einstellungen')
      ])
    ]);
    const held = h('div', { class: 'held' }, [
      flaechenBild('hintergrund/teich', 'hg-bild'),
      h('div', { class: 'sprechblase' }, [h('p', null, gruss), vorleseKnopf(gruss)]),
      lolo('winkt', 'held-lolo')
    ]);
    const liste = nurSpiel ? [nurSpiel] : spiele;
    const kacheln = h('div', { class: 'kacheln' + (liste.length === 1 ? ' einzeln' : '') }, liste.map(function (sp) {
      const st = stand(sp.id);
      return h('button', { type: 'button', class: 'kachel', onclick: function () { starteRunde(sp); } }, [
        bild('kacheln/' + sp.id, '', sp.kachelErsatz || '', 'kachel-bild'),
        h('span', { class: 'kachel-titel' }, sp.titel),
        h('span', { class: 'kachel-text' }, sp.untertitel),
        h('span', { class: 'kachel-info' }, E().aufgabenProRunde + ' Aufgaben · Stufe ' + st.stufe)
      ]);
    }));
    // Solange die Eltern-Einstellungen noch nie geöffnet wurden: gut sichtbarer Hinweis ganz oben
    let elternHinweis = null;
    if (!daten.elternGesehen && !elternSpaeter) {
      elternHinweis = h('section', { class: 'eltern-hinweis', 'aria-label': 'Hinweis für Eltern' }, [
        h('div', { class: 'eltern-hinweis-text' }, [
          h('strong', null, 'Liebe Eltern, bitte zuerst kurz einstellen'),
          h('span', null, 'Reizarmer Modus, Vorlesen, Geräusche und wie viele Aufgaben eine Runde hat. Dauert etwa eine Minute.')
        ]),
        h('div', { class: 'eltern-hinweis-knoepfe' }, [
          knopf('Jetzt einstellen', zeigeTor, 'haupt'),
          h('button', { type: 'button', class: 'textlink', onclick: function () { elternSpaeter = true; zeigeAuswahl(nurSpiel); } }, 'Später')
        ])
      ]);
    }
    const teile = [kopf, elternHinweis, held, kacheln];
    if (nurSpiel && spiele.length > 1) {
      teile.push(h('p', { class: 'mitte' }, h('button', { type: 'button', class: 'textlink', onclick: function () { zeigeAuswahl(null); } }, 'Alle Spiele ansehen')));
    }
    haenge(app, teile);
  }

  /* ---------- Runde ---------- */
  function starteRunde(sp) {
    runde = { spiel: sp, nr: 0, anzahl: E().aufgabenProRunde, richtig: 0, serie: 0 };
    zaehle(sp.id + '/runde-start', 'Lernolotls Teich: ' + sp.titel + ' – Runde gestartet');
    naechsteAufgabe();
  }

  function naechsteAufgabe() {
    if (!runde) return;
    if (runde.nr >= runde.anzahl) { rundeFertig(); return; }
    runde.nr++;
    const sp = runde.spiel;
    const st = stand(sp.id);
    const z = zufall((Date.now() ^ (runde.nr * 7919)) >>> 0);
    if (!st.extra) st.extra = {};
    const aufgabe = sp.erzeuge(st.stufe, z, st.extra);
    zeigeAufgabe(sp, aufgabe, z);
  }

  function fortschritt() {
    const pads = [];
    for (let i = 1; i <= runde.anzahl; i++) {
      const cls = i < runde.nr ? 'pad fertig' : (i === runde.nr ? 'pad jetzt' : 'pad');
      pads.push(h('span', { class: cls }));
    }
    return h('div', { class: 'fortschritt' }, [
      h('div', { class: 'pads', 'aria-hidden': 'true' }, pads),
      h('div', { class: 'fortschritt-text' }, 'Aufgabe ' + runde.nr + ' von ' + runde.anzahl)
    ]);
  }

  function zeigeAufgabe(sp, aufgabe, z) {
    leeren();
    const zust = aufgabeZustand = { fehler: 0, tipp: false, fertig: false, ergebnis: null, ctrl: null };
    const loloPlatz = h('div', { class: 'aufgabe-lolo' }, lolo(sp.loloPose || 'denkt'));
    const setzeLolo = function (zustand) {
      if (E().reizarm) return;
      loloPlatz.innerHTML = '';
      loloPlatz.appendChild(lolo(zustand));
    };
    const rueckmeldung = h('div', { class: 'rueckmeldung', 'aria-live': 'polite' });
    const flaeche = h('div', { class: 'spielflaeche spiel-' + sp.id, tabindex: '-1' });
    const weiter = knopf(runde.nr >= runde.anzahl ? 'Fertig' : 'Weiter', function () { naechsteAufgabe(); }, 'haupt weiter', { disabled: true });
    const tippKnopf = h('button', { type: 'button', class: 'knopf neben', onclick: function () { gibTipp(); } }, [h('span', { class: 'knopf-sym', html: SYM.tipp }), 'Tipp']);

    function melde(text, art) {
      rueckmeldung.className = 'rueckmeldung ' + (art || '');
      rueckmeldung.textContent = text || '';
      if (text && E().vorlesen) sprich(text);
    }
    function sperren() {
      zust.fertig = true;
      flaeche.classList.add('gesperrt');
      tippKnopf.disabled = true;
      weiter.disabled = false;
      fokus(weiter);
    }
    function gibTipp() {
      if (zust.fertig) return;
      zust.tipp = true;
      if (zust.ctrl && zust.ctrl.tipp) zust.ctrl.tipp();
      melde((zust.ctrl && zust.ctrl.tippText && zust.ctrl.tippText()) || aufgabe.tippText || 'Schau ganz genau hin.', 'tipp');
      setzeLolo('zeigt');
    }
    // wertung (optional, vom Spiel): 'gut' = sauber gelöst, 'ok', 'schwer' = eine Stufe leichter
    function aufgabeAbschliessen(ergebnis, wertung) {
      zust.ergebnis = ergebnis;
      const st = stand(sp.id);
      st.aufgaben++; daten.gesamt.aufgaben++;
      if (ergebnis === 'richtig') {
        st.richtig++; runde.richtig++;
        const sauber = wertung ? (wertung === 'gut' && !zust.tipp) : (zust.fehler === 0 && !zust.tipp);
        if (sauber) runde.serie++; else runde.serie = 0;
        if (wertung === 'schwer') { runde.serie = 0; if (st.stufe > 1) st.stufe--; }
        if (runde.serie >= KONFIG.serieFuerAufstieg && st.stufe < (sp.maxStufe || 1)) { st.stufe++; runde.serie = 0; }
      } else {
        runde.serie = 0;
        if (st.stufe > 1) st.stufe--;
      }
      speichere();
    }

    const api = {
      h: h, bild: bild, flaechenBild: flaechenBild, zufall: z, lolo: lolo,
      teichDinge: TEICH_DINGE, teichErsatz: TEICH_ERSATZ,
      animiert: animiert, reizarm: function () { return !!E().reizarm; },
      sprich: sprich,
      istFertig: function () { return zust.fertig; },
      // Hinweis anzeigen, ohne dass es als Fehlversuch zählt
      hinweis: function (text, art) { if (!zust.fertig) melde(text, art || 'neutral'); },
      // Spiel-eigene Daten, die auf dem Gerät gespeichert bleiben (z. B. Fehler je Taste)
      extra: stand(sp.id).extra,
      speichern: speichere,
      // Das Spiel meldet eine Antwort: richtig (true) oder nicht (false).
      // Optional: wertung 'gut' | 'ok' | 'schwer' (für Spiele, die selbst Fehler zählen)
      antwort: function (richtig, text, wertung) {
        if (zust.fertig) return;
        if (richtig) {
          sperren();
          melde(text || 'Richtig!', 'richtig');
          setzeLolo('freut-sich');
          klang('richtig');
          aufgabeAbschliessen('richtig', wertung);
          return;
        }
        zust.fehler++;
        // 1. Fehler: freundlicher Hinweis · 2. Fehler: Tipp · 3. Fehler: Lösung zeigen
        if (zust.fehler >= 3) {
          if (zust.ctrl && zust.ctrl.loesungZeigen) zust.ctrl.loesungZeigen();
          sperren();
          melde(aufgabe.loesungText || 'So geht es. Beim nächsten Mal klappt es bestimmt.', 'neutral');
          setzeLolo('zeigt');
          aufgabeAbschliessen('gezeigt');
        } else if (zust.fehler === 2) {
          if (!zust.tipp) gibTipp();
          melde(aufgabe.tippText || text, 'tipp');
        } else {
          melde(text || 'Schau nochmal genau hin.', 'neutral');
        }
      }
    };

    const kopf = h('div', { class: 'runde-kopf' }, [
      symbolKnopf('zurueck', 'Runde beenden', frageAufhoeren),
      fortschritt(),
      symbolKnopf('pause', 'Pause', zeigePause)
    ]);
    const karte = h('div', { class: 'aufgabe-karte' }, [
      loloPlatz,
      h('p', { class: 'aufgabe-text' }, aufgabe.text),
      vorleseKnopf(aufgabe.sprechText || aufgabe.text)
    ]);
    const fuss = h('div', { class: 'runde-fuss' }, [tippKnopf, weiter]);
    haenge(app, [kopf, karte, flaeche, rueckmeldung, fuss]);

    zust.ctrl = sp.zeige(flaeche, aufgabe, api) || {};
    if (E().vorlesen) sprich(aufgabe.sprechText || aufgabe.text);
  }

  function rundeFertig() {
    const sp = runde.spiel;
    const st = stand(sp.id);
    st.runden++; daten.gesamt.runden++;
    let neu = null;
    if (daten.teich.length < TEICH_DINGE.length) {
      neu = TEICH_DINGE[daten.teich.length];
      daten.teich.push(neu.id);
    }
    speichere();
    zaehle(sp.id + '/runde-fertig', 'Lernolotls Teich: ' + sp.titel + ' – Runde fertig');
    zaehle(sp.id + '/runde-fertig/' + rundenFach(st.runden), 'Lernolotls Teich: ' + sp.titel + ' – Runde Nr. ' + st.runden + ' (Gerät)');
    const r = runde;
    runde = null;

    leeren();
    klang('fertig');
    const text = neu ? 'Lernolotl schenkt dir etwas für deinen Teich: ' + neu.name + '.' : 'Dein Teich ist schon ganz voll. Toll gemacht!';
    haenge(app, h('div', { class: 'fertig' }, [
      lolo('freut-sich', 'fertig-lolo'),
      h('h2', { class: 'fertig-titel' }, 'Geschafft!'),
      h('p', { class: 'fertig-text' }, 'Du hast alle ' + r.anzahl + ' Aufgaben gemacht.'),
      neu ? h('div', { class: 'geschenk' }, [bild('teich/' + neu.id, neu.name, TEICH_ERSATZ[neu.id], 'geschenk-bild'), h('div', null, [h('div', { class: 'geschenk-neu' }, 'Neu in deinem Teich'), h('div', { class: 'geschenk-name' }, neu.name)])]) : null,
      h('p', { class: 'fertig-text klein' }, text),
      h('div', { class: 'knopf-reihe' }, [
        knopf('Mein Teich ansehen', zeigeTeich, 'neben'),
        knopf('Fertig', function () { zeigeAuswahl(null); }, 'haupt')
      ])
    ]));
    if (E().vorlesen) sprich('Geschafft! ' + text);
  }

  /* ---------- Pause & Aufhören ---------- */
  function overlay(inhalt) {
    const o = h('div', { class: 'overlay', role: 'dialog', 'aria-modal': 'true' }, h('div', { class: 'overlay-karte' }, inhalt));
    app.appendChild(o);
    return o;
  }
  function zeigePause() {
    stillSein();
    const o = overlay([
      lolo('schlaeft', 'pause-lolo'),
      h('h2', null, 'Pause'),
      h('p', null, 'Lernolotl wartet auf dich. Tippe auf Weiter, wenn du bereit bist.'),
      knopf('Weiter', function () { o.remove(); }, 'haupt')
    ]);
    fokus(o.querySelector('.haupt'));
  }
  function frageAufhoeren() {
    stillSein();
    const o = overlay([
      h('h2', null, 'Möchtest du aufhören?'),
      h('p', null, 'Du kannst später eine neue Runde anfangen.'),
      h('div', { class: 'knopf-reihe' }, [
        knopf('Weiterspielen', function () { o.remove(); }, 'haupt'),
        knopf('Aufhören', function () { runde = null; zeigeAuswahl(null); }, 'neben')
      ])
    ]);
    fokus(o.querySelector('.haupt'));
  }

  /* ---------- Mein Teich ---------- */
  function zeigeTeich() {
    leeren();
    const anzahl = daten.teich.length;
    const felder = TEICH_DINGE.map(function (d) {
      const hat = daten.teich.indexOf(d.id) >= 0;
      return h('div', { class: 'teich-feld' + (hat ? ' hat' : '') }, hat
        ? [bild('teich/' + d.id, d.name, TEICH_ERSATZ[d.id], 'teich-bild'), h('span', { class: 'teich-name' }, d.name)]
        : [h('span', { class: 'sr-only' }, 'Noch leer')]);
    });
    haenge(app, [
      h('div', { class: 'app-kopf' }, [
        symbolKnopf('zurueck', 'Zurück', function () { zeigeAuswahl(null); }),
        h('div', { class: 'app-titel' }, 'Mein Teich'),
        h('span', { class: 'platzhalter' })
      ]),
      h('div', { class: 'teich-flaeche' }, [flaechenBild('hintergrund/teich', 'hg-bild'), h('div', { class: 'teich-raster' }, felder)]),
      h('p', { class: 'mitte' }, anzahl + ' von ' + TEICH_DINGE.length + ' gesammelt. Nach jeder Runde kommt etwas dazu.')
    ]);
  }

  /* ---------- Eltern-Einstellungen ---------- */
  function zeigeTor() {
    leeren();
    let timer = null, start = 0;
    const balken = h('span', { class: 'tor-balken' });
    const halten = h('button', { type: 'button', class: 'knopf haupt tor-knopf' }, [balken, h('span', { class: 'tor-text' }, 'Gedrückt halten')]);
    function los(e) {
      if (e && e.type === 'keydown') { if (e.key !== ' ' && e.key !== 'Enter') return; if (e.repeat) return; e.preventDefault(); }
      start = Date.now();
      clearInterval(timer);
      timer = setInterval(function () {
        const p = Math.min(1, (Date.now() - start) / 2500);
        balken.style.width = (p * 100) + '%';
        if (p >= 1) { clearInterval(timer); zeigeErwachsene(); }
      }, 40);
    }
    function stopp() { clearInterval(timer); balken.style.width = '0%'; }
    halten.addEventListener('pointerdown', los);
    halten.addEventListener('keydown', los);
    ['pointerup', 'pointerleave', 'pointercancel', 'keyup', 'blur'].forEach(function (ev) { halten.addEventListener(ev, stopp); });
    halten.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    haenge(app, [
      h('div', { class: 'app-kopf' }, [
        symbolKnopf('zurueck', 'Zurück', function () { zeigeAuswahl(null); }),
        h('div', { class: 'app-titel' }, 'Eltern-Einstellungen'),
        h('span', { class: 'platzhalter' })
      ]),
      h('div', { class: 'tor' }, [
        h('p', null, 'Hier geht es zu den Eltern-Einstellungen und zum Lernstand. Halte den Knopf 3 Sekunden lang gedrückt.'),
        halten
      ])
    ]);
  }

  function zeigeErwachsene() {
    if (!daten.elternGesehen) { daten.elternGesehen = true; speichere(); }
    leeren();
    const e = E();
    function schalter(schl, titel, text) {
      const id = 'e-' + schl;
      const inp = h('input', { type: 'checkbox', id: id, onchange: function () { e[schl] = inp.checked; speichere(); app.classList.toggle('reizarm', !!e.reizarm); app.classList.toggle('ruhig', !animiert()); } });
      inp.checked = !!e[schl];
      return h('label', { class: 'schalter', for: id }, [h('span', { class: 'schalter-text' }, [h('strong', null, titel), h('span', null, text)]), inp]);
    }
    const anzahlKnoepfe = h('div', { class: 'segmente', role: 'group', 'aria-label': 'Aufgaben pro Runde' }, [3, 5, 8].map(function (n) {
      return h('button', { type: 'button', class: 'segment', 'aria-pressed': String(e.aufgabenProRunde === n), onclick: function () { e.aufgabenProRunde = n; speichere(); zeigeErwachsene(); } }, String(n));
    }));
    const spielZeilen = spiele.map(function (sp) {
      const st = stand(sp.id);
      const stufeText = h('span', { class: 'stufe-wert' }, 'Stufe ' + st.stufe + ' von ' + sp.maxStufe);
      const beschr = h('span', { class: 'stufe-beschr' }, (sp.stufen && sp.stufen[st.stufe - 1]) || '');
      function aendern(d) { st.stufe = Math.max(1, Math.min(sp.maxStufe, st.stufe + d)); speichere(); stufeText.textContent = 'Stufe ' + st.stufe + ' von ' + sp.maxStufe; beschr.textContent = (sp.stufen && sp.stufen[st.stufe - 1]) || ''; }
      return h('div', { class: 'spiel-zeile' }, [
        h('div', { class: 'spiel-zeile-kopf' }, [h('strong', null, sp.titel), h('span', { class: 'klein' }, st.runden + ' Runden · ' + st.richtig + ' von ' + st.aufgaben + ' Aufgaben richtig')]),
        h('div', { class: 'stufe' }, [
          h('button', { type: 'button', class: 'symbol-knopf', 'aria-label': sp.titel + ': leichter', onclick: function () { aendern(-1); } }, '−'),
          h('div', { class: 'stufe-mitte' }, [stufeText, beschr]),
          h('button', { type: 'button', class: 'symbol-knopf', 'aria-label': sp.titel + ': schwerer', onclick: function () { aendern(1); } }, '+')
        ]),
        sp.infoFuerErwachsene ? h('p', { class: 'klein' }, sp.infoFuerErwachsene(st.extra || {})) : null
      ]);
    });
    haenge(app, [
      h('div', { class: 'app-kopf' }, [
        symbolKnopf('zurueck', 'Zurück zum Spiel', function () { zeigeAuswahl(null); }),
        h('div', { class: 'app-titel' }, 'Eltern-Einstellungen'),
        h('span', { class: 'platzhalter' })
      ]),
      h('section', { class: 'box' }, [
        h('h3', null, 'Darstellung'),
        schalter('reizarm', 'Reizarmer Modus', 'Gedämpfte Farben, keine Hintergrundbilder, Lernolotl bleibt ruhig'),
        schalter('animationen', 'Bewegungen', 'Kleine Animationen, z. B. wenn Lernolotl schwimmt'),
        schalter('geraeusche', 'Geräusche', 'Leiser Klang bei richtigen Antworten'),
        schalter('vorlesen', 'Automatisch vorlesen', 'Aufgaben und Rückmeldungen werden vorgelesen (Sprachausgabe des Geräts)')
      ]),
      h('section', { class: 'box' }, [
        h('h3', null, 'Aufgaben pro Runde'),
        anzahlKnoepfe,
        h('p', { class: 'klein' }, 'Nach der Runde ist Schluss. Es gibt keine Zeitlimits.')
      ]),
      h('section', { class: 'box' }, [
        h('h3', null, 'Lernstand und Schwierigkeit'),
        h('p', { class: 'klein' }, 'Die Stufe passt sich von selbst an: nach 3 Aufgaben in Folge ohne Fehler eine Stufe höher, nach einer gezeigten Lösung eine Stufe tiefer. Sie können sie hier auch selbst einstellen.'),
        spielZeilen,
        h('p', { class: 'klein' }, 'Auf diesem Gerät insgesamt: ' + daten.gesamt.runden + ' Runden, ' + daten.gesamt.aufgaben + ' Aufgaben.')
      ]),
      h('section', { class: 'box' }, [
        h('h3', null, 'Daten'),
        h('p', { class: 'klein' }, 'Spielstand und Einstellungen werden nur auf diesem Gerät gespeichert. Es gibt kein Konto und keine Werbung. Gezählt wird nur anonym, wie oft Runden gestartet und beendet werden.'),
        knopf('Spielstand zurücksetzen', function () {
          if (window.confirm('Spielstand, Teich und Einstellungen auf diesem Gerät löschen?')) {
            daten = JSON.parse(JSON.stringify(STANDARD)); speichere(); zeigeAuswahl(null);
          }
        }, 'neben')
      ])
    ]);
  }

  /* =====================================================
     Öffentliche Schnittstelle
     ===================================================== */
  window.Teich = {
    registriere: function (spiel) {
      if (!spiel || !spiel.id || spiele.some(function (s) { return s.id === spiel.id; })) return;
      spiele.push(spiel);
    },
    start: function (elementId) {
      app = document.getElementById(elementId || 'teich-app');
      if (!app) return;
      app.classList.add('bereit');
      const p = new URLSearchParams(location.search).get('spiel');
      const nur = spiele.find(function (s) { return s.id === p; }) || null;
      zeigeAuswahl(nur);
      if ('speechSynthesis' in window) { try { window.speechSynthesis.getVoices(); } catch (e) { } }
    },
    // für Tests/Debugging in der Konsole
    _daten: function () { return daten; },
    _hilfen: { h: h, bild: bild, zufall: zufall }
  };
})();
