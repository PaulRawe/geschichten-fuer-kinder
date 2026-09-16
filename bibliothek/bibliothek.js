/* Lernolotl Bibliothek — Suche, Filter, Themenlisten.
   Einzige Datenquelle: produkte.json  */
(function(){
  var DATA=null, typFilter='alle', suche='';

  function el(id){ return document.getElementById(id); }
  function esc(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  function eintraege(){
    var out=[];
    DATA.geschichten.forEach(function(s){
      out.push({art:'frei',titel:s.titel,kurz:s.kurz,themen:s.themen,link:s.pfad});
    });
    DATA.produkte.forEach(function(p){
      out.push({art:p.typ,titel:p.titel,kurz:p.kurz,themen:p.themen,
        amazon:p.amazon,etsy:p.etsy,alter:p.alter,reihe:p.reihe,band:p.band});
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
    if(e.reihe) t+='<span class="tag meta">'+esc(e.reihe)+(e.band?' \u00b7 Band '+esc(e.band):'')+'</span>';
    var k='';
    if(e.link)   k+='<a class="btn lesen" href="'+esc(e.link)+'">Geschichte lesen</a>';
    if(e.amazon) k+='<a class="btn amazon" href="'+esc(e.amazon)+'" target="_blank" rel="noopener sponsored">Bei Amazon ansehen</a>';
    if(e.etsy)   k+='<a class="btn etsy" href="'+esc(e.etsy)+'" target="_blank" rel="noopener sponsored">Auf Etsy ansehen</a>';
    return '<article class="produkt"><div class="kopf">'+t+'</div><h4>'+esc(e.titel)+'</h4>'+
           '<p class="kurz">'+esc(e.kurz)+'</p><div class="kauf">'+k+'</div></article>';
  }

  function zeichne(){
    var alle=eintraege().filter(passt), box=el('themenliste'), teile=[], gesamt=0, offene=0;
    DATA.themen.forEach(function(t){
      var items=alle.filter(function(e){ return e.themen.indexOf(t.key)>=0; });
      if(!items.length) return;
      gesamt+=items.length;
      var auf = suche && offene<2;
      if(auf) offene++;
      var frei=items.filter(function(x){return x.art==='frei';}).slice(0,8),
          buch=items.filter(function(x){return x.art==='buch';}).slice(0,8),
          pdf =items.filter(function(x){return x.art==='pdf'; }).slice(0,8),
          sicht=frei.concat(buch).concat(pdf);
      teile.push('<details class="thema"'+(auf?' open':'')+'>'+
        '<summary class="thema-kopf"><span><span class="pfeil">\u203a</span> '+esc(t.label)+'</span>'+
        '<span class="zahl">'+items.length+'</span></summary>'+
        '<div class="thema-inhalt"><div class="produkte">'+sicht.map(karte).join('')+'</div>'+
        (items.length>sicht.length ? '<p style="margin-top:14px;"><a href="/bibliothek/'+t.key+'/">Alle '+items.length+' Eintr\u00e4ge zu '+esc(t.label)+'</a></p>' : '')+
        '</div></details>');
    });
    box.innerHTML=teile.join('');
    el('leer').style.display = teile.length ? 'none' : 'block';
    el('trefferzahl').textContent = suche || typFilter!=='alle'
      ? gesamt+' Treffer' : alle.length+' Eintr\u00e4ge insgesamt';
  }

  function start(){
    var q=new URLSearchParams(location.search);
    if(q.get('typ')) typFilter=q.get('typ');
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
      tmr=setTimeout(function(){ suche=ev.target.value.trim().toLowerCase(); zeichne(); },160);
    });
    zeichne();
    var th=q.get('thema');
    if(th){ var d=document.querySelectorAll('.thema'); DATA.themen.forEach(function(t,i){ }); }
  }

  fetch('/bibliothek/produkte.json').then(function(r){ return r.json(); })
    .then(function(d){ DATA=d; start(); })
    .catch(function(){ el('themenliste').innerHTML='<p>Die Bibliothek konnte nicht geladen werden. Bitte lade die Seite neu.</p>'; });
})();
