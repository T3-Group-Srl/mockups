(function(){
'use strict';
if (document.body.dataset.page !== 'home') return;
var S = window.SITE || {impianti:[], contenuti:[]};
var MESI = ['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre'];
var MESI_B = ['gen','feb','mar','apr','mag','giu','lug','ago','set','ott','nov','dic'];
var bySis = {}; S.impianti.forEach(function(d){ bySis[d.sis]=d; });
function esc(s){ return (s==null?'':String(s)).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
function pd(s){ var p=s.split('-'); return new Date(+p[0], p[1]-1, +p[2]); }
function today(){ var t=new Date(); t.setHours(0,0,0,0); return t; }
function place(c){ var d = c.impianti.length ? bySis[c.impianti[0]] : null; if(!d) return ''; return d.denominazione ? d.denominazione.replace(/"([^"]*)"/g,'“$1”') : d.ubicazione.split(/\s[-–]\s/)[0]; }
function url(c){ return 'contenuto.html?id=' + encodeURIComponent(c.id); }
var ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

var ev = S.contenuti.filter(function(c){ return c.tipo==='evento' && pd(c.fine||c.inizio) >= today(); }).sort(function(a,b){ return pd(a.inizio)-pd(b.inizio); });
var news = S.contenuti.filter(function(c){ return c.tipo==='news'; }).sort(function(a,b){ return pd(b.data)-pd(a.data); });

// prossimo evento
var next = ev[0], nx = document.getElementById('m-next');
if (next && nx){
  var d = pd(next.inizio);
  nx.href = url(next);
  nx.innerHTML = '<span class="m-pill m-pill-dark">Prossimo evento</span>' +
    '<span class="m-next-date"><b>' + d.getDate() + '</b><span>' + MESI[d.getMonth()] + '<br>' + (next.orario||'') + '</span></span>' +
    '<span class="m-next-title">' + esc(next.titolo) + '</span>' +
    '<span class="m-next-place">' + esc(place(next)) + ' <i aria-hidden="true">' + ARROW + '</i></span>';
}

// pannello eventi
var list = document.getElementById('m-events');
if (list){
  list.innerHTML = ev.slice(0,4).map(function(c){
    var d = pd(c.inizio);
    return '<li><span class="m-ev-date"><b>' + d.getDate() + '</b> ' + MESI_B[d.getMonth()] + '</span>' +
      '<span class="m-ev-time">' + esc(c.orario||'') + '</span>' +
      '<span class="m-ev-main"><a href="' + url(c) + '">' + esc(c.titolo) + '</a><span>' + esc(c.categoria) + ' · ' + esc(place(c)) + '</span></span>' +
      '<span class="m-pill m-pill-white" aria-hidden="true">Dettagli</span></li>';
  }).join('') || '<li><span class="m-ev-main">Nessun evento in programma.</span></li>';
}

// card news: solo news e avvisi (gli eventi sono già nel pannello)
var cards = document.getElementById('home-cards');
if (cards){
  var open = news.filter(function(c){ return c.scadenza && pd(c.scadenza) >= today(); });
  var rest = news.filter(function(c){ return open.indexOf(c) < 0; });
  cards.innerHTML = open.slice(0,1).concat(rest).slice(0,3).map(function(c){
    var isOpen = open.indexOf(c) > -1, d = pd(c.data);
    return '<li class="card' + (isOpen ? ' featured' : '') + '"><div class="card-body">' +
      '<p class="kicker">' + esc(c.categoria) + (isOpen ? ' <span class="badge badge-open">Aperto</span>' : '') + '</p>' +
      '<h3><a href="' + url(c) + '">' + esc(c.titolo) + '</a></h3>' +
      '<p class="m-card-sum">' + esc(c.sommario) + '</p>' +
      '<p class="meta-l">' + d.getDate() + ' ' + MESI[d.getMonth()] + ' ' + d.getFullYear() + (isOpen ? ' · scade il ' + pd(c.scadenza).getDate() + ' ' + MESI[pd(c.scadenza).getMonth()] : '') + '</p>' +
      '</div></li>';
  }).join('');
}
})();
