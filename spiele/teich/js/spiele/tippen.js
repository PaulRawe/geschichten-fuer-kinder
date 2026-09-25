/* =====================================================
   Spiel: Lernolotls Tasten-Teich (Tastaturschreiben)
   Übt: 10-Finger-Schreiben auf deutscher Tastatur (QWERTZ)

   Die "Matrix": 16 Lektionen (welche Tasten) × 3 Formen
   (Tasten → Silben → Wörter) = 48 Stufen. Jede Zeile wird
   neu erzeugt. Tasten, bei denen das Kind oft danebentippt,
   kommen automatisch häufiger vor (Fehler je Taste werden
   auf dem Gerät gespeichert).

   Ruhig gestaltet: keine Zeit, kein Tempo, kein Countdown.
   Bei einem Fehler bleibt der Buchstabe einfach stehen,
   bis die richtige Taste kommt. Die gesuchte Taste und der
   passende Finger leuchten immer.

   Bilder: bilder/lernolotl/tippt.webp, bilder/tippen/ziel.webp,
           bilder/tippen/bahn.webp, bilder/kacheln/tippen.webp
   ===================================================== */
(function () {
  'use strict';

  /* ---------- Tastatur (deutsch, QWERTZ) ---------- */
  const REIHEN = [
    ['q', 'w', 'e', 'r', 't', 'z', 'u', 'i', 'o', 'p', 'ü'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ö', 'ä'],
    ['y', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '-']
  ];
  const FINGER = {
    q: 'lk', a: 'lk', y: 'lk',
    w: 'lr', s: 'lr', x: 'lr',
    e: 'lm', d: 'lm', c: 'lm',
    r: 'lz', f: 'lz', v: 'lz', t: 'lz', g: 'lz', b: 'lz',
    z: 'rz', h: 'rz', n: 'rz', u: 'rz', j: 'rz', m: 'rz',
    i: 'rm', k: 'rm', ',': 'rm',
    o: 'rr', l: 'rr', '.': 'rr',
    p: 'rk', 'ö': 'rk', '-': 'rk', 'ü': 'rk', 'ä': 'rk',
    ' ': 'd'
  };
  const FINGER_NAME = {
    lk: 'linken kleinen Finger', lr: 'linken Ringfinger', lm: 'linken Mittelfinger', lz: 'linken Zeigefinger',
    rz: 'rechten Zeigefinger', rm: 'rechten Mittelfinger', rr: 'rechten Ringfinger', rk: 'rechten kleinen Finger',
    d: 'Daumen'
  };
  // Gleiche Finger an beiden Händen = gleiche Farbe (unterscheiden sich auch in der Helligkeit)
  const FARBE = { k: '#f2a7a7', r: '#f6c98c', m: '#efe08a', z: '#9fd8a8', d: '#d8d2c4' };
  function fingerFarbe(f) { return f === 'd' ? FARBE.d : FARBE[f[1]]; }

  /* ---------- Lektionen: welche Tasten kommen dazu ---------- */
  const LEKTIONEN = [
    { neu: 'fj', name: 'f und j' },
    { neu: 'dk', name: 'd und k' },
    { neu: 'sl', name: 's und l' },
    { neu: 'aö', name: 'a und ö' },
    { neu: 'gh', name: 'g und h' },
    { neu: 'ei', name: 'e und i' },
    { neu: 'ru', name: 'r und u' },
    { neu: 'tz', name: 't und z' },
    { neu: 'nm', name: 'n und m' },
    { neu: 'ow', name: 'o und w' },
    { neu: 'cv', name: 'c und v' },
    { neu: 'bp', name: 'b und p' },
    { neu: 'äü', name: 'ä und ü' },
    { neu: 'qxy', name: 'q, x und y' },
    { neu: '', name: 'Großbuchstaben', gross: true },
    { neu: ',.', name: 'Komma und Punkt', saetze: true }
  ];
  const FORMEN = ['Tasten', 'Silben', 'Wörter'];
  const STUFEN = [];
  LEKTIONEN.forEach(function (l, i) {
    FORMEN.forEach(function (f) { STUFEN.push('Lektion ' + (i + 1) + ': ' + l.name + ' · ' + f); });
  });

  /* ---------- Wörter (richtig geschrieben: Nomen groß) ---------- */
  const KLEIN = ('da das als ja so ist in im es er sie wir ich du und oder auf aus bei bin bist dann denn ein eine einen hat ' +
    'hier kann mal mit nein nie noch nun ob oft um uns von vor was wie wo zu gut rot blau gelb lila rosa grau neu alt jung ' +
    'klein kalt warm laut leise lieb froh fein hell dunkel weich hart still ruhig schnell langsam lang kurz dick satt ' +
    'wach nass sauer viel wenig alle alles sehr gern immer heute jetzt schon auch nur leicht schwer richtig links rechts ' +
    'oben unten hin her lesen laufen rufen sagen singen spielen schwimmen tanzen malen essen sehen gehen lachen hören ' +
    'kommen fallen fliegen springen bauen suchen finden schreiben rechnen zählen tippen lernen helfen fragen danke bitte ' +
    'hallo grün rund müde fühlen führen drücken zurück über küssen später böse schön')
    .split(' ');
  const NOMEN = [
    ['der', 'Fisch'], ['der', 'Frosch'], ['der', 'Teich'], ['der', 'Hase'], ['der', 'Ball'], ['der', 'Baum'], ['der', 'Hund'],
    ['der', 'Igel'], ['der', 'Mond'], ['der', 'Stein'], ['der', 'Stern'], ['der', 'Apfel'], ['der', 'Zug'], ['der', 'Opa'],
    ['der', 'Papa'], ['der', 'Tisch'], ['der', 'Regen'], ['der', 'Wind'], ['der', 'Wal'], ['der', 'Kater'], ['der', 'Käse'],
    ['die', 'Ente'], ['die', 'Sonne'], ['die', 'Blume'], ['die', 'Muschel'], ['die', 'Brille'], ['die', 'Katze'], ['die', 'Maus'],
    ['die', 'Hand'], ['die', 'Nase'], ['die', 'Oma'], ['die', 'Mama'], ['die', 'Schnecke'], ['die', 'Libelle'], ['die', 'Wolke'],
    ['die', 'Tasse'], ['die', 'Kuh'], ['die', 'Robbe'], ['die', 'Tür'],
    ['das', 'Haus'], ['das', 'Buch'], ['das', 'Kind'], ['das', 'Eis'], ['das', 'Boot'], ['das', 'Auto'], ['das', 'Bett'],
    ['das', 'Blatt'], ['das', 'Wasser'], ['das', 'Nest'], ['das', 'Schaf'], ['das', 'Brot'], ['das', 'Pferd']
  ];
  const ADJ = ['rot', 'blau', 'gelb', 'grün', 'klein', 'nass', 'kalt', 'warm', 'lieb', 'froh', 'müde', 'still', 'alt', 'neu', 'lang', 'schnell', 'weich', 'leise', 'laut', 'hell', 'rund', 'schön'];
  const VOKALE = 'aeiouöäü';

  function lektionVon(stufe) { return Math.min(LEKTIONEN.length, Math.ceil(stufe / 3)); }
  function formVon(stufe) { return ((stufe - 1) % 3) + 1; }
  function gelernt(lektion) {
    let s = '';
    for (let i = 0; i < lektion; i++) s += LEKTIONEN[i].neu;
    return s;
  }
  function erlaubt(wort, tasten) {
    for (const ch of wort.toLowerCase()) if (tasten.indexOf(ch) < 0) return false;
    return true;
  }
  function gross(w) { return w.charAt(0).toUpperCase() + w.slice(1); }

  // Gewicht je Taste: neue Tasten und Tasten mit vielen Fehlern kommen häufiger
  function gewichte(tasten, neu, extra) {
    const t = (extra && extra.tasten) || {};
    const g = {};
    for (const ch of tasten) {
      const s = t[ch] || { n: 0, f: 0 };
      g[ch] = 1 + (neu.indexOf(ch) >= 0 ? 2 : 0) + 8 * ((s.f + 0.3) / (s.n + 3));
    }
    return g;
  }
  function gewichtetWaehlen(z, liste, gewichtFn) {
    let summe = 0;
    const w = liste.map(function (x) { const v = gewichtFn(x); summe += v; return v; });
    let r = z.zahl() * summe;
    for (let i = 0; i < liste.length; i++) { r -= w[i]; if (r <= 0) return liste[i]; }
    return liste[liste.length - 1];
  }

  /* ---------- Zeile erzeugen ---------- */
  function erzeuge(stufe, z, extra) {
    const lek = lektionVon(stufe);
    const form = formVon(stufe);
    const L = LEKTIONEN[lek - 1];
    const tasten = gelernt(lek).replace(/[,.]/g, '');
    const neu = L.neu.replace(/[,.]/g, '');
    const g = gewichte(tasten, neu, extra);
    const buchst = tasten.split('');
    const taste = function () { return gewichtetWaehlen(z, buchst, function (c) { return g[c]; }); };
    const mitGross = lek >= 15;

    let nr = 0;
    function tastenEinheit() {
      nr++;
      if (mitGross) return gross(taste()) + taste() + taste();
      const a = neu && (nr <= 2 || z.zahl() < 0.6) ? z.wahl(neu.split('')) : taste();
      let b = taste();
      if (buchst.length > 1) { let s = 0; while (b === a && s++ < 5) b = taste(); }
      const muster = z.wahl(['aaa', 'aba', 'bab', 'aab', 'abb', 'aba']);
      return muster.replace(/a/g, a).replace(/b/g, b);
    }
    function silbe() {
      const vok = buchst.filter(function (c) { return VOKALE.indexOf(c) >= 0; });
      const kon = buchst.filter(function (c) { return VOKALE.indexOf(c) < 0; });
      let s;
      if (!vok.length || !kon.length) {
        const n = z.int(2, 3); s = '';
        for (let i = 0; i < n; i++) s += taste();
      } else {
        const V = function () { return gewichtetWaehlen(z, vok, function (c) { return g[c]; }); };
        const K = function () { return gewichtetWaehlen(z, kon, function (c) { return g[c]; }); };
        s = z.wahl([function () { return K() + V(); }, function () { return K() + V() + K(); }, function () { return V() + K(); }, function () { return K() + V() + K() + V(); }])();
      }
      return mitGross && z.zahl() < 0.5 ? gross(s) : s;
    }
    function woerter(anzahl) {
      const pool = KLEIN.filter(function (w) { return erlaubt(w, tasten); })
        .concat(mitGross ? NOMEN.map(function (n) { return n[1]; }).filter(function (w) { return erlaubt(w, tasten); }) : []);
      const res = [];
      for (let i = 0; i < anzahl; i++) {
        if (pool.length < 6 && z.zahl() < 0.5) { res.push(silbe()); continue; }
        if (!pool.length) { res.push(silbe()); continue; }
        let w, versuch = 0;
        do {
          w = gewichtetWaehlen(z, pool, function (x) {
            let s = 0;
            for (const ch of x.toLowerCase()) s += g[ch] || 1;
            return Math.pow(s / x.length, 2);
          });
        } while (res.indexOf(w) >= 0 && versuch++ < 8);
        res.push(w);
      }
      return res;
    }
    function satz() {
      const n = z.wahl(NOMEN.filter(function (x) { return erlaubt(x[0] + x[1], tasten); }));
      const a = z.wahl(ADJ);
      return z.wahl([
        gross(n[0]) + ' ' + n[1] + ' ist ' + a + '.',
        'Ja, ' + n[0] + ' ' + n[1] + ' ist ' + a + '.',
        gross(n[0]) + ' ' + n[1] + ' ist ' + a + ', sehr ' + a + '.'
      ]);
    }

    let einheiten;
    if (L.saetze) {
      if (form === 3) einheiten = [satz()];
      else {
        const w = woerter(form === 1 ? 3 : 4);
        einheiten = w.map(function (x, i) { return x + (i === w.length - 1 ? '.' : ','); });
        einheiten[0] = gross(einheiten[0]);
      }
    } else if (form === 1) {
      einheiten = []; for (let i = 0; i < 5; i++) einheiten.push(tastenEinheit());
    } else if (form === 2) {
      einheiten = []; for (let i = 0; i < 5; i++) einheiten.push(silbe());
    } else {
      einheiten = woerter(4);
    }
    // nicht zu lang werden lassen
    let zeile = einheiten.join(' ');
    while (zeile.length > 32 && einheiten.length > 2 && !L.saetze) { einheiten.pop(); zeile = einheiten.join(' '); }

    const neuText = (form === 1 && L.neu) ? 'Neu: ' + L.name + '. ' : (form === 1 && L.gross ? 'Neu: Großbuchstaben mit der Umschalttaste. ' : '');
    return {
      zeile: zeile, lektion: lek, form: form,
      text: neuText + 'Tippe die Zeile ab.',
      sprechText: neuText + 'Tippe die Zeile ab.' + (lek <= 4 && form === 1 ? ' Leg die Finger auf die Grundreihe: a s d f und j k l ö. Die Daumen liegen auf der Leertaste.' : ''),
      tippText: 'Schau auf die helle Taste und den hellen Finger.'
    };
  }

  /* ---------- Hände (einfache Zeichnung) ---------- */
  function haendeSvg() {
    const hand = function (p) {
      return '<g>' +
        '<rect data-f="' + p + 'k" x="16" y="42" width="19" height="52" rx="9.5" class="finger"/>' +
        '<rect data-f="' + p + 'r" x="39" y="24" width="19" height="70" rx="9.5" class="finger"/>' +
        '<rect data-f="' + p + 'm" x="62" y="14" width="19" height="80" rx="9.5" class="finger"/>' +
        '<rect data-f="' + p + 'z" x="85" y="26" width="19" height="68" rx="9.5" class="finger"/>' +
        '<rect data-f="d" x="108" y="70" width="19" height="44" rx="9.5" class="finger" transform="rotate(-38 117 92)"/>' +
        '<rect x="14" y="80" width="98" height="38" rx="18" class="handflaeche"/>' +
        '</g>';
    };
    return '<svg viewBox="0 0 300 124" class="haende-svg" aria-hidden="true">' +
      hand('l') + '<g transform="translate(300 0) scale(-1 1)">' + hand('r') + '</g></svg>';
  }

  function tastenName(ch) {
    if (ch === ' ') return 'die Leertaste';
    if (ch === ',') return 'das Komma';
    if (ch === '.') return 'den Punkt';
    if (ch === '-') return 'das Minus';
    if (ch !== ch.toLowerCase()) return 'großes ' + ch;
    return ch;
  }

  /* ---------- Anzeige ---------- */
  function zeige(fl, a, api) {
    const h = api.h;
    const app = fl.closest('.teich-app') || document.body;
    const tasten = gelernt(a.lektion);
    const neu = LEKTIONEN[a.lektion - 1].neu;
    const mitShift = a.lektion >= 15;
    const text = a.zeile;
    let pos = 0, fehler = 0, fehlerHier = 0, layoutZweifel = 0;
    if (!api.extra.tasten) api.extra.tasten = {};
    const statistik = api.extra.tasten;

    // Bahn mit Lernolotl und Ziel
    const loloBahn = h('div', { class: 'bahn-lolo' }, api.bild('lernolotl/schwimmt', '', null, 'bahn-lolo-bild'));
    const img = loloBahn.querySelector('img');
    if (img) img.addEventListener('error', function () { loloBahn.innerHTML = ''; loloBahn.appendChild(api.lolo('winkt')); });
    const bahn = h('div', { class: 'tipp-bahn', 'aria-hidden': 'true' }, [
      api.flaechenBild('tippen/bahn', 'hg-bild'),
      h('div', { class: 'bahn-ziel' }, api.bild('tippen/ziel', '', '<svg viewBox="0 0 60 60"><ellipse cx="30" cy="38" rx="26" ry="13" fill="#66bb6a"/><circle cx="30" cy="30" r="10" fill="#f5a7b8"/><circle cx="30" cy="30" r="4" fill="#fbbf24"/></svg>', 'bahn-ziel-bild')),
      loloBahn
    ]);

    // Zeile
    const zeichen = [];
    const zeile = h('div', { class: 'tipp-zeile', 'aria-label': 'Zeile zum Abtippen: ' + text }, text.split('').map(function (ch) {
      const el = h('span', { class: 'z' + (ch === ' ' ? ' leer' : '') }, ch === ' ' ? '·' : ch);
      zeichen.push(el);
      return el;
    }));

    // Tastatur
    const tastenEl = {};
    function tastenKnopf(ch, klasse, beschriftung) {
      const lo = ch.length === 1 ? ch.toLowerCase() : ch;
      const aktiv = ch === ' ' || tasten.indexOf(lo) >= 0 || (ch.indexOf('shift') === 0 && mitShift);
      const f = FINGER[lo];
      const b = h('button', {
        type: 'button', tabindex: '-1',
        class: 'taste ' + (klasse || '') + (aktiv ? ' an' : ' aus') + (neu.indexOf(lo) >= 0 && lo.length === 1 ? ' neu' : '') + (lo === 'f' || lo === 'j' ? ' fuehler' : ''),
        'aria-label': ch === ' ' ? 'Leertaste' : (ch.indexOf('shift') === 0 ? 'Umschalttaste' : ch),
        onclick: function () { if (ch.length === 1) pruefe(ch, null); }
      }, beschriftung || ch);
      if (f && aktiv && !api.reizarm()) b.style.setProperty('--finger', fingerFarbe(f));
      tastenEl[ch] = b;
      return b;
    }
    const tastatur = h('div', { class: 'tastatur', 'aria-hidden': 'true' }, [
      h('div', { class: 'reihe r1' }, REIHEN[0].map(function (c) { return tastenKnopf(c); })),
      h('div', { class: 'reihe r2' }, REIHEN[1].map(function (c) { return tastenKnopf(c); })),
      h('div', { class: 'reihe r3' }, [tastenKnopf('shiftL', 'shift', '⇧')].concat(REIHEN[2].map(function (c) { return tastenKnopf(c); }), [tastenKnopf('shiftR', 'shift', '⇧')])),
      h('div', { class: 'reihe r4' }, [tastenKnopf(' ', 'leertaste', '')])
    ]);

    const haende = h('div', { class: 'haende', html: haendeSvg() });
    const fingerText = h('div', { class: 'finger-text' });
    const hinweisTouch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches
      ? h('p', { class: 'hinweis-zeile' }, 'Mit einer echten Tastatur geht es am besten. Du kannst aber auch auf die Tasten tippen.') : null;

    fl.appendChild(bahn);
    fl.appendChild(zeile);
    fl.appendChild(tastatur);
    fl.appendChild(h('div', { class: 'haende-zeile' }, [haende, fingerText]));
    if (hinweisTouch) fl.appendChild(hinweisTouch);

    function markieren() {
      zeichen.forEach(function (el, i) {
        el.classList.toggle('fertig', i < pos);
        el.classList.toggle('jetzt', i === pos);
      });
      Object.keys(tastenEl).forEach(function (k) { tastenEl[k].classList.remove('ziel'); });
      haende.querySelectorAll('.finger').forEach(function (f) { f.classList.remove('aktiv'); f.style.fill = ''; });
      const p = text.length ? pos / text.length : 1;
      loloBahn.style.left = 'calc(' + (p * 100) + '% - ' + (p * 64) + 'px)';
      if (pos >= text.length) { fingerText.textContent = ''; return; }
      const ch = text[pos];
      const lo = ch.toLowerCase();
      const k = tastenEl[ch === ' ' ? ' ' : lo];
      if (k) k.classList.add('ziel');
      const f = FINGER[lo];
      const gebraucht = [f];
      if (ch !== lo) {
        const shift = f && f[0] === 'l' ? 'shiftR' : 'shiftL';
        if (tastenEl[shift]) tastenEl[shift].classList.add('ziel');
        gebraucht.push(f && f[0] === 'l' ? 'rk' : 'lk');
      }
      gebraucht.forEach(function (fg) {
        haende.querySelectorAll('[data-f="' + fg + '"]').forEach(function (el) { el.classList.add('aktiv'); el.style.fill = api.reizarm() ? '#cfd8d4' : fingerFarbe(fg); });
      });
      const basis = f ? 'Nimm den ' + FINGER_NAME[f] + (ch === ' ' ? ' für die Leertaste.' : '.') : '';
      fingerText.textContent = (ch !== lo && f ? 'Halte die Umschalttaste mit dem ' + (f[0] === 'l' ? 'rechten' : 'linken') + ' kleinen Finger. ' : '') + basis;
    }

    function zaehle(ch, falsch) {
      const k = ch === ' ' ? ' ' : ch.toLowerCase();
      if (!statistik[k]) statistik[k] = { n: 0, f: 0 };
      statistik[k].n++;
      if (falsch) statistik[k].f++;
    }

    function pruefe(k, e) {
      if (api.istFertig() || pos >= text.length) return;
      const soll = text[pos];
      if (k === soll) {
        zaehle(soll, false);
        pos++; fehlerHier = 0;
        if (pos >= text.length) {
          markieren();
          const quote = fehler / text.length;
          const wertung = quote <= 0.05 ? 'gut' : (quote <= 0.2 ? 'ok' : 'schwer');
          api.antwort(true, fehler === 0 ? 'Super, die ganze Zeile ohne Fehler!' : 'Geschafft! Die Zeile ist fertig.', wertung);
          return;
        }
        if (fehlerHier === 0) api.hinweis('', 'neutral');
        markieren();
        return;
      }
      // daneben
      fehler++; fehlerHier++;
      zaehle(soll, true);
      const gedrueckt = tastenEl[k === ' ' ? ' ' : k.toLowerCase()];
      if (gedrueckt) { gedrueckt.classList.remove('daneben'); void gedrueckt.offsetWidth; gedrueckt.classList.add('daneben'); }
      const jetzt = zeichen[pos];
      jetzt.classList.remove('nochmal'); void jetzt.offsetWidth; jetzt.classList.add('nochmal');

      if (e && e.getModifierState && e.getModifierState('CapsLock') && soll === soll.toLowerCase() && k !== k.toLowerCase()) {
        api.hinweis('Die Feststelltaste ist an. Drück sie einmal, dann geht es weiter.', 'tipp');
        return;
      }
      if (('öäü'.indexOf(soll) >= 0 && ';\'[{:"'.indexOf(k) >= 0) || (soll === 'z' && k === 'y') || (soll === 'y' && k === 'z')) {
        layoutZweifel++;
        if (layoutZweifel >= 2) { api.hinweis('Ist die Tastatur auf Deutsch (QWERTZ) eingestellt? Frag einen Erwachsenen.', 'tipp'); return; }
      }
      const f = FINGER[soll.toLowerCase()];
      if (fehlerHier === 1) api.hinweis('Fast. Schau auf die helle Taste.', 'neutral');
      else api.hinweis('Gesucht ist ' + tastenName(soll) + '. Nimm den ' + (f ? FINGER_NAME[f] : 'passenden Finger') + '.', 'tipp');
    }

    function taste(e) {
      if (!document.body.contains(fl)) { document.removeEventListener('keydown', taste, true); return; }
      if (api.istFertig()) return;
      if (app.querySelector('.overlay')) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key.length !== 1) return;          // Shift, Enter, Tab, Pfeile … ignorieren
      e.preventDefault();
      pruefe(e.key, e);
    }
    document.addEventListener('keydown', taste, true);
    try { if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); fl.focus({ preventScroll: true }); } catch (x) { }
    markieren();

    return {
      tipp: function () {
        haende.classList.remove('blinken'); void haende.offsetWidth; haende.classList.add('blinken');
      },
      tippText: function () {
        if (pos >= text.length) return '';
        const soll = text[pos], f = FINGER[soll.toLowerCase()];
        return 'Gesucht ist ' + tastenName(soll) + '. Nimm den ' + (f ? FINGER_NAME[f] : 'passenden Finger') + '.';
      }
    };
  }

  function infoFuerErwachsene(extra) {
    const t = extra.tasten || {};
    const schwer = Object.keys(t).filter(function (k) { return t[k].n >= 6 && t[k].f / t[k].n >= 0.1; })
      .sort(function (a, b) { return t[b].f / t[b].n - t[a].f / t[a].n; }).slice(0, 4)
      .map(function (k) { return (k === ' ' ? 'Leertaste' : k) + ' (' + Math.round(100 * t[k].f / t[k].n) + ' %)'; });
    return (schwer.length ? 'Tasten, die noch schwerfallen: ' + schwer.join(', ') + '. Sie kommen automatisch häufiger vor.' : 'Bisher keine Taste, die besonders schwerfällt.') +
      ' Gezählt werden nur Tippfehler, nie die Zeit.';
  }

  const KACHEL_ERSATZ = '<svg viewBox="0 0 120 90"><rect width="120" height="90" rx="14" fill="#e4f4f7"/>' +
    '<g fill="#fff" stroke="#3d5f75" stroke-width="1.5">' +
    '<rect x="10" y="30" width="14" height="14" rx="3"/><rect x="27" y="30" width="14" height="14" rx="3"/><rect x="44" y="30" width="14" height="14" rx="3"/>' +
    '<rect x="62" y="30" width="14" height="14" rx="3"/><rect x="79" y="30" width="14" height="14" rx="3"/><rect x="96" y="30" width="14" height="14" rx="3"/>' +
    '<rect x="30" y="50" width="60" height="12" rx="3"/></g>' +
    '<rect x="44" y="30" width="14" height="14" rx="3" fill="#9fd8a8" stroke="#3d5f75" stroke-width="1.5"/><rect x="62" y="30" width="14" height="14" rx="3" fill="#9fd8a8" stroke="#3d5f75" stroke-width="1.5"/>' +
    '<text x="51" y="41" font-size="9" text-anchor="middle" font-family="sans-serif" fill="#1f3a33">f</text><text x="69" y="41" font-size="9" text-anchor="middle" font-family="sans-serif" fill="#1f3a33">j</text></svg>';

  Teich.registriere({
    id: 'tippen',
    titel: 'Tasten-Teich',
    untertitel: 'Schreiben mit zehn Fingern',
    maxStufe: STUFEN.length,
    stufen: STUFEN,
    loloPose: 'tippt',
    kachelErsatz: KACHEL_ERSATZ,
    erzeuge: erzeuge,
    zeige: zeige,
    infoFuerErwachsene: infoFuerErwachsene,
    // für Tests
    _intern: { LEKTIONEN: LEKTIONEN, KLEIN: KLEIN, NOMEN: NOMEN, ADJ: ADJ, gelernt: gelernt }
  });
})();
