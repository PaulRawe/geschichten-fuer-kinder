/* Lernolotl Bibliothek — Suche, Filter, Themenlisten.
   Einzige Datenquelle: produkte.json

   Zwei Betriebsarten:
   1. Bibliotheksseite (/bibliothek/) — baut die Themenliste aus der JSON.
      ?thema=<key>  klappt dieses Thema auf und zeigt es VOLLSTAENDIG.
      ?typ=<art>    filtert auf frei | buch | pdf.
      ?q=<wort>     setzt die Suche.
   2. Statische Themenseiten (/bibliothek/<key>/) — dort gibt es kein
      #themenliste, sondern nur den Seitenfilter ueber den bereits
      ausgelieferten Karten.                                                   */
(function(){
  var DATA=null, typFilter='alle', suche='', vollThema='';

  /* ---------------------------------------------------------- Seitenfilter
     Laeuft auf den statischen Themenseiten und filtert die Karten, die schon
     im HTML stehen. Jede Karte traegt dafuer ein data-suche-Attribut.        */
  function seitenfilter(){
    var feld=document.getElementById('seitenfilter');
    if(!feld) return;
    /* Nur die Karten im selben Abschnitt filtern. Die Buecher und Materialien
       weiter unten bleiben stehen — sonst raeumt eine Suche nach "Wut" auch
       den Kaufbereich leer, was niemand erwartet.                            */
    var bereich=feld.closest('section')||document,
        zahl=document.getElementById('seitenfilter-zahl'),
        karten=[].slice.call(bereich.querySelectorAll('.produkt[data-suche]')),
        tmr;

    function anwenden(){
      var w=feld.value.trim().toLowerCase(),
          worte=w?w.split(/\s+/):[], treffer=0;
      karten.forEach(function(k){
        var h=k.getAttribute('data-suche')||'';
        var passt=worte.every(function(x){ return h.indexOf(x)>=0; });
        k.style.display=passt?'':'none';
        if(passt) treffer++;
      });
      if(zahl){
        zahl.textContent = !w ? ''
          : treffer===0 ? 'Keine Geschichte auf dieser Seite enthält „'+w+'“.'
          : treffer===1 ? '1 Geschichte gefunden'
          : treffer+' Geschichten gefunden';
      }
    }

    feld.addEventListener('input',function(){
      clearTimeout(tmr); tmr=setTimeout(anwenden,140);
    });

    /* Ein ?q= in der Adresse fuellt den Filter gleich aus — so koennen
       Suchergebnisse und Verlinkungen direkt auf ein Wort zeigen.           */
    var q=new URLSearchParams(location.search).get('q');
    if(q){ feld.value=q; anwenden(); }
  }

  /* ------------------------------------------------------- Bibliotheksseite */
  function el(id){ return document.getElementById(id); }
  function esc(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  function eintraege(){
    var out=[];
    DATA.geschichten.forEach(function(s){
      out.push({art:'frei',titel:s.titel,kurz:s.kurz,themen:s.themen,link:s.pfad,bild:s.bild,bildunter:s.bildunter});
    });
    DATA.produkte.forEach(function(p){
      out.push({art:p.typ,titel:p.titel,kurz:p.kurz,themen:p.themen,
        amazon:p.amazon,etsy:p.etsy,alter:p.alter,reihe:p.reihe,band:p.band,bild:p.bild,seite:p.seite});
    });
    return out;
  }

  function passt(e){
    if(typFilter!=='alle' && e.art!==typFilter) return false;
    if(!suche) return true;
    var h=(e.titel+' '+e.kurz+' '+e.themen.join(' ')).toLowerCase();
    return suche.split(/\s+/).every(function(w){ return h.indexOf(w)>=0; });
  }

  function karte(e){
    var t = e.art==='frei' ? '<span class="tag frei">Kostenlos lesen</span>'
          : e.art==='buch' ? '<span class="tag buch">Buch</span>'
          : '<span class="tag pdf">PDF zum Ausdrucken</span>';
    if(e.alter) t+='<span class="tag meta">'+esc(e.alter)+(e.alter.indexOf('ab')===0?' Jahren':' Jahre')+'</span>';
    if(e.reihe) t+='<span class="tag meta">'+esc(e.reihe)+(e.band?' · Band '+esc(e.band):'')+'</span>';
    var k='';
    if(e.link)   k+='<a class="btn lesen" href="'+esc(e.link)+'">Geschichte lesen</a>';
    if(e.seite)  k+='<a class="btn buchseite" href="'+esc(e.seite)+'">Mehr zum Buch</a>';
    if(e.amazon) k+='<a class="btn amazon" href="'+esc(e.amazon)+'" target="_blank" rel="noopener sponsored">Bei Amazon ansehen</a>';
    if(e.etsy)   k+='<a class="btn etsy" href="'+esc(e.etsy)+'" target="_blank" rel="noopener sponsored">Auf Etsy ansehen</a>';
var b = e.bild ? '<img class="pbild" src="'+esc(e.bild)+'" alt="" width="400" height="400" loading="lazy" decoding="async">'+(e.bildunter?'<p class="bildunter">'+esc(e.bildunter)+'</p>':'') : '';
    return '<article class="produkt">'+b+'<div class="kopf">'+t+'</div><h4>'+esc(e.titel)+'</h4>'+
           '<p class="kurz">'+esc(e.kurz)+'</p><div class="kauf">'+k+'</div></article>';
  }

  function zeichne(){
    var alle=eintraege().filter(passt), box=el('themenliste'), teile=[], gesamt=0, offene=0;
    DATA.themen.forEach(function(t){
      var items=alle.filter(function(e){ return e.themen.indexOf(t.key)>=0; });
      if(!items.length) return;
      gesamt+=items.length;

      /* Ein per ?thema= angefragtes Thema wird aufgeklappt und ungekuerzt
         gezeigt. Das ist der Fall, in dem jemand wirklich ALLE Eintraege
         sehen will — vorher endete dieser Weg im Nichts.                    */
      var voll = (t.key===vollThema);
      var auf  = voll || (suche && offene<2);
      if(auf && !voll) offene++;

      var grenze = voll ? Infinity : 8,
          frei=items.filter(function(x){return x.art==='frei';}).slice(0,grenze),
          buch=items.filter(function(x){return x.art==='buch';}).slice(0,grenze),
          pdf =items.filter(function(x){return x.art==='pdf'; }).slice(0,grenze),
          sicht=frei.concat(buch).concat(pdf);

      var rest='';
      if(items.length>sicht.length){
        rest='<p style="margin-top:14px;"><a href="/bibliothek/'+t.key+'/">Alle '+items.length+
             ' Einträge zu '+esc(t.label)+'</a></p>';
      }

      teile.push('<details class="thema"'+(auf?' open':'')+' id="thema-'+t.key+'">'+
        '<summary class="thema-kopf"><span><span class="pfeil">›</span> '+esc(t.label)+'</span>'+
        '<span class="zahl">'+items.length+'</span></summary>'+
        '<div class="thema-inhalt"><div class="produkte">'+sicht.map(karte).join('')+'</div>'+
        rest+'</div></details>');
    });
    box.innerHTML=teile.join('');
    el('leer').style.display = teile.length ? 'none' : 'block';
    el('trefferzahl').textContent = suche || typFilter!=='alle'
      ? gesamt+' Treffer' : alle.length+' Einträge insgesamt';
  }

  function start(){
    var q=new URLSearchParams(location.search);
    if(q.get('typ')) typFilter=q.get('typ');
    if(q.get('thema')) vollThema=q.get('thema');
    if(q.get('q')){ suche=q.get('q').toLowerCase(); el('suche').value=q.get('q'); }

    document.querySelectorAll('.fchip').forEach(function(b){
      b.setAttribute('aria-pressed', String(b.dataset.typ===typFilter));
      b.addEventListener('click',function(){
        typFilter=b.dataset.typ;
        document.querySelectorAll('.fchip').forEach(function(x){ x.setAttribute('aria-pressed',String(x.dataset.typ===typFilter)); });
        zeichne();
      });
    });

    var tmr;
    el('suche').addEventListener('input',function(ev){
      clearTimeout(tmr);
      tmr=setTimeout(function(){
        suche=ev.target.value.trim().toLowerCase();
        /* Sobald von Hand gesucht wird, gilt die Themenvorgabe nicht mehr —
           sonst bliebe ein Thema unkuerzbar aufgeklappt stehen.             */
        vollThema='';
        zeichne();
      },160);
    });

    zeichne();

    /* Zum aufgeklappten Thema scrollen, damit es nicht unterhalb des
       sichtbaren Bereichs liegt.                                            */
    if(vollThema){
      var ziel=document.getElementById('thema-'+vollThema);
      if(ziel) ziel.scrollIntoView({behavior:'smooth',block:'start'});
    }
  }

  /* ------------------------------------------------------------------ Start */
  seitenfilter();

  if(!document.getElementById('themenliste')) return;   /* statische Themenseite */

  fetch('/bibliothek/produkte.json').then(function(r){ return r.json(); })
    .then(function(d){ DATA=d; start(); })
    .catch(function(){ el('themenliste').innerHTML='<p>Die Bibliothek konnte nicht geladen werden. Bitte lade die Seite neu.</p>'; });
})();
