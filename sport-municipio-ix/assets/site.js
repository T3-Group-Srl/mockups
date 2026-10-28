(function(){
'use strict';

/* ================= dati e utilità ================= */
var S = window.SITE || {impianti:[], contenuti:[]};
var DATA = S.impianti, CONT = S.contenuti;
var CLS_LABEL = {A:'Grande impianto sportivo', B:'Impianto di rilevanza cittadina', C:'Impianto di rilevanza municipale'};
var CLS_SHORT = {A:'Grandi impianti', B:'Rilevanza cittadina', C:'Rilevanza municipale'};
var COMP = {municipio:'Municipio IX', dipartimento:'Dipartimento Grandi Eventi, Sport, Turismo e Moda'};
var COMP_SHORT = {municipio:'Municipio IX', dipartimento:'Dipartimento Sport'};
var CENTER = [41.800, 12.462];
var MESI = ['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre'];
var MESI_B = ['gen','feb','mar','apr','mag','giu','lug','ago','set','ott','nov','dic'];
var PAGE_N = 30;

function $(id){ return document.getElementById(id); }
function esc(s){ return (s==null?'':String(s)).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
function norm(s){ return (s||'').toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[’'"“”«»]/g,' ').replace(/,/g,' ').replace(/\s+/g,' ').trim(); }
function pretty(s){ return s.replace(/"([^"]*)"/g,'“$1”'); }
function firstAddr(u){ return u.split(/\s[-–]\s/)[0].trim(); }
function sisVariants(sis){ var p=sis.split('.'); var a=parseInt(p[0],10), b=parseInt(p[1],10); return [sis, a+'.'+b, a+'.'+(b<10?'0'+b:b)].join(' '); }
function sisNum(d){ return parseInt(d.sis.split('.')[1],10); }
function store(k,v){ try{ if(v===undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k,v); }catch(e){ return null; } }

var k = 0;
DATA.forEach(function(d){
  d.titolo = d.denominazione ? pretty(d.denominazione) : 'Impianto sportivo di ' + firstAddr(d.ubicazione);
  d.hasName = !!d.denominazione;
  d.competenza = d.classe === 'C' ? 'municipio' : 'dipartimento';
  d.attivo = d.stato === 'attivo';
  d.hay = ' ' + norm([d.denominazione, d.ubicazione, CLS_SHORT[d.classe], COMP[d.competenza]].join(' ')) + ' ' + sisVariants(d.sis) + ' ';
  if (typeof d.lat === 'number' && typeof d.lng === 'number') { d.pos=[d.lat,d.lng]; d.approx=false; }
  else { k++; var ang=k*2.39996, r=0.0055*Math.sqrt(k); d.pos=[CENTER[0]+r*Math.cos(ang), CENTER[1]+r*1.33*Math.sin(ang)]; d.approx=true; }
});
var bySis = {}; DATA.forEach(function(d){ bySis[d.sis]=d; });
var byId = {}; DATA.forEach(function(d){ byId[d.id]=d; });
var ACTIVE = DATA.filter(function(d){ return d.attivo; });
function schedaUrl(d){ return 'impianto.html?sis=' + encodeURIComponent(d.sis); }
function directions(d){
  var dest = d.approx ? encodeURIComponent(firstAddr(d.ubicazione)+', Roma') : d.pos[0]+','+d.pos[1];
  return 'https://www.google.com/maps/dir/?api=1&destination='+dest;
}
var NEWWIN = '<span class="sr-only"> (si apre in una nuova finestra)</span>';

/* date */
function today(){ var t=new Date(); t.setHours(0,0,0,0); return t; }
function pd(s){ var p=s.split('-'); return new Date(+p[0], p[1]-1, +p[2]); }
function fmtDate(s){ var d=pd(s); return d.getDate()+' '+MESI[d.getMonth()]+' '+d.getFullYear(); }
function isUpcoming(c){ return pd(c.fine||c.inizio) >= today(); }
function scad(c){ if(!c.scadenza) return null; return pd(c.scadenza) >= today() ? 'aperto' : 'scaduto'; }
function contentUrl(c){ return 'contenuto.html?id=' + encodeURIComponent(c.id); }
function cDate(c){ return c.tipo==='evento' ? c.inizio : c.data; }
function upcomingEvents(){ return CONT.filter(function(c){ return c.tipo==='evento' && isUpcoming(c); }).sort(function(a,b){ return pd(a.inizio)-pd(b.inizio); }); }
function pastEvents(){ return CONT.filter(function(c){ return c.tipo==='evento' && !isUpcoming(c); }).sort(function(a,b){ return pd(b.inizio)-pd(a.inizio); }); }
function newsSorted(){ return CONT.filter(function(c){ return c.tipo==='news'; }).sort(function(a,b){ return pd(b.data)-pd(a.data); }); }
function datebox(c, extra){
  var d = pd(cDate(c)), cls = c.tipo==='evento' ? (isUpcoming(c)?'':' past') : ' news';
  return '<span class="datebox'+cls+(extra||'')+'" aria-hidden="true"><span class="d">'+d.getDate()+'</span><span class="m">'+MESI_B[d.getMonth()]+'</span></span>';
}
function placeOf(c){ var d = c.impianti && c.impianti.length ? bySis[c.impianti[0]] : null; return d; }
function scadBadge(c){
  var s = scad(c); if(!s) return '';
  return s==='aperto' ? '<span class="badge badge-open">Aperto fino al '+fmtDate(c.scadenza)+'</span>' : '<span class="badge badge-closed">Scaduto</span>';
}
function eventMeta(c){
  var d = placeOf(c);
  return fmtDate(c.inizio) + (c.orario? ', '+c.orario : '') + (d ? ' · ' + esc(d.titolo) : '');
}

/* ================= componenti comuni ================= */
function initHeader(){
  var sb = document.querySelector('.search-btn'), bar = $('search-bar');
  if (sb && bar) sb.addEventListener('click', function(){
    var open = bar.hidden; bar.hidden = !open; sb.setAttribute('aria-expanded', open?'true':'false');
    if (open) bar.querySelector('input').focus();
  });
  var mb = document.querySelector('.menu-btn'), mn = $('mobile-nav');
  if (mb && mn) mb.addEventListener('click', function(){
    var open = mn.hidden; mn.hidden = !open; mb.setAttribute('aria-expanded', open?'true':'false');
  });
  document.addEventListener('keydown', function(e){
    if (e.key !== 'Escape') return;
    if (bar && !bar.hidden){ bar.hidden = true; sb.setAttribute('aria-expanded','false'); sb.focus(); }
    if (mn && !mn.hidden){ mn.hidden = true; mb.setAttribute('aria-expanded','false'); mb.focus(); }
  });
  var al = $('alert-bar');
  if (al){
    if (store('alert-closed') === '1') al.hidden = true;
    var x = al.querySelector('.icon-btn');
    x && x.addEventListener('click', function(){ al.hidden = true; store('alert-closed','1'); });
  }
}
function initRating(){
  var stars = $('stars'); if(!stars) return;
  var st='';
  for(var s=1;s<=5;s++) st+='<button type="button" data-s="'+s+'" aria-pressed="false" aria-label="'+s+(s===1?' stella':' stelle')+'"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z"/></svg></button>';
  stars.innerHTML = st;
  stars.addEventListener('click', function(e){
    var b=e.target.closest('button'); if(!b) return; var v=+b.dataset.s;
    stars.querySelectorAll('button').forEach(function(x){ x.classList.toggle('on', +x.dataset.s<=v); x.setAttribute('aria-pressed', +x.dataset.s===v?'true':'false'); });
    $('rating-msg').textContent = 'Grazie, hai dato '+v+(v===1?' stella':' stelle')+'.';
  });
}

/* mappe */
function hasL(){ return typeof L !== 'undefined'; }
function tiles(map){
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom:19,
    attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);
}
function pinIcon(d){
  return L.divIcon({className:'', html:'<div class="pin '+d.classe+(d.attivo?'':' off')+'" data-pin="'+d.id+'">'+d.classe+'</div>', iconSize:[30,30], iconAnchor:[15,15], popupAnchor:[0,-14]});
}
function popupHTML(d){
  return '<h3>'+esc(d.titolo)+'</h3><p>'+esc(firstAddr(d.ubicazione))+'<br>Classe '+d.classe+' · '+COMP_SHORT[d.competenza]+(d.attivo?'':'<br><b>Attualmente non attivo</b>')+'</p><a class="btn" href="'+schedaUrl(d)+'">Apri la scheda</a>';
}
function noMap(el){ el.innerHTML = '<p style="padding:20px">La mappa non è disponibile in questo momento. Usa l\'elenco degli impianti.</p>'; }

/* ================= HOME ================= */
function initHome(){
  var cnt = {A:0,B:0,C:0}; ACTIVE.forEach(function(d){ cnt[d.classe]++; });
  $('n-attivi').textContent = ACTIVE.length;
  ['A','B','C'].forEach(function(c){ $('n-'+c).textContent = cnt[c]; });
  document.querySelectorAll('[data-n-attivi]').forEach(function(e){ e.textContent = ACTIVE.length; });

  // card eventi e news: prima gli eventi in programma, poi l'avviso aperto, poi le news più recenti
  var ev = upcomingEvents().slice(0,2);
  var news = newsSorted();
  var open = news.filter(function(c){ return scad(c)==='aperto'; });
  var rest = news.filter(function(c){ return open.indexOf(c)<0; });
  var pick = ev.concat(open.slice(0,1)).concat(rest).slice(0,4);
  $('home-cards').innerHTML = pick.map(function(c){
    var featured = scad(c)==='aperto';
    var head = c.tipo==='evento'
      ? '<div class="when">'+datebox(c)+'<div><p class="kicker">'+esc(c.categoria)+'</p></div></div>'
      : '<p class="kicker">'+esc(c.categoria)+(featured?' <span class="badge badge-open">Aperto</span>':'')+'</p>';
    var meta = c.tipo==='evento' ? eventMeta(c) : 'Pubblicato il '+fmtDate(c.data)+(c.scadenza && featured ? ' · Scade il '+fmtDate(c.scadenza):'');
    return '<li class="card'+(featured?' featured':'')+'"><div class="card-body">'+head+
      '<h3><a href="'+contentUrl(c)+'">'+esc(c.titolo)+'</a></h3><p class="meta-l">'+meta+'</p></div></li>';
  }).join('');

  var el = $('home-map'); if(!el) return;
  if(!hasL()){ noMap(el); return; }
  var map = L.map(el, {scrollWheelZoom:false});
  tiles(map);
  ACTIVE.forEach(function(d){ L.marker(d.pos,{icon:pinIcon(d), title:d.titolo.replace(/[“”]/g,'"'), alt:d.titolo, keyboard:true}).bindPopup(popupHTML(d)).addTo(map); });
  map.fitBounds(L.latLngBounds(ACTIVE.map(function(d){return d.pos;})).pad(0.15), {maxZoom:14});
  if (ACTIVE.some(function(d){return d.approx;})) $('home-map-note').hidden = false;
}

/* ================= IMPIANTI (esploratore) ================= */
function initImpianti(){
  var st = {q:'', classi:new Set(), comp:new Set(), attivi:true, sort:'sis', vista:'split', shown:PAGE_N, me:null};
  var P = new URLSearchParams(location.search);
  if(P.get('q')) st.q = P.get('q');
  (P.get('classe')||'').split(',').forEach(function(c){ if(/^[ABC]$/.test(c)) st.classi.add(c); });
  (P.get('competenza')||'').split(',').forEach(function(c){ if(COMP[c]) st.comp.add(c); });
  if(P.get('attivi')==='0') st.attivi=false;
  if(['nome','classe'].indexOf(P.get('ordina'))>-1) st.sort=P.get('ordina');
  if(['lista','mappa','split'].indexOf(P.get('vista'))>-1) st.vista=P.get('vista');
  var focusSis = P.get('focus'), wantGeo = P.get('vicino')==='1';

  function writeURL(){
    var p = new URLSearchParams();
    if(st.q) p.set('q',st.q);
    if(st.classi.size) p.set('classe',Array.from(st.classi).sort().join(','));
    if(st.comp.size) p.set('competenza',Array.from(st.comp).sort().join(','));
    if(!st.attivi) p.set('attivi','0');
    if(st.sort!=='sis' && st.sort!=='dist') p.set('ordina',st.sort);
    if(st.vista!=='split') p.set('vista',st.vista);
    var qs = p.toString();
    try{ history.replaceState(null,'',location.pathname+(qs?'?'+qs:'')+location.hash); }catch(e){}
  }
  var ALIASES = [[/\bv\.\s*le\b/g,'viale'],[/\bv\.(?=\s|$)/g,'via'],[/\bp\.?\s*zza\b/g,'piazza'],[/\bl\.?\s*go\b/g,'largo']];
  function terms(){
    var s = (st.q||'').toLowerCase();
    ALIASES.forEach(function(a){ s=s.replace(a[0],a[1]); });
    s = s.replace(/\b(\d{1,2})[,\s](\d{1,2})\b/g,function(m,a,b){return a+'.'+b;});
    s = norm(s);
    return s ? s.split(' ').map(function(t){ return (t.length>=5 && /[aeio]$/.test(t)) ? t.slice(0,-1) : t; }) : [];
  }
  function match(d,o){
    o=o||{};
    if(st.attivi && !o.ignoreAttivi && !d.attivo) return false;
    if(!o.ignoreCls && st.classi.size && !st.classi.has(d.classe)) return false;
    if(!o.ignoreComp && st.comp.size && !st.comp.has(d.competenza)) return false;
    var t = o.terms || terms();
    for(var i=0;i<t.length;i++){ if(d.hay.indexOf(t[i])<0) return false; }
    return true;
  }
  function dist(a,b){var R=6371,r=Math.PI/180,dLat=(b[0]-a[0])*r,dLng=(b[1]-a[1])*r;var x=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(a[0]*r)*Math.cos(b[0]*r)*Math.sin(dLng/2)*Math.sin(dLng/2);return 2*R*Math.asin(Math.sqrt(x));}
  function fmtKm(k){ return k<1 ? Math.round(k*100)*10+' m' : k.toFixed(1).replace('.',',')+' km'; }
  function sorted(l){
    l = l.slice();
    var bySisF = function(a,b){ return sisNum(a)-sisNum(b); };
    if(st.sort==='nome') l.sort(function(a,b){ return (b.hasName-a.hasName) || a.titolo.replace(/[“”]/g,'').localeCompare(b.titolo.replace(/[“”]/g,''),'it'); });
    else if(st.sort==='classe') l.sort(function(a,b){ return a.classe.localeCompare(b.classe) || bySisF(a,b); });
    else if(st.sort==='dist' && st.me) l.sort(function(a,b){ return dist(st.me,a.pos)-dist(st.me,b.pos); });
    else l.sort(bySisF);
    return l;
  }
  function hl(text, t){
    var out = esc(text); if(!t.length) return out;
    var plain = text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
    if (plain.length !== text.length) return out;
    var marks = new Array(text.length).fill(false);
    t.forEach(function(x){ if(x.length<2) return; var i=plain.indexOf(x); while(i>-1){ for(var j=i;j<i+x.length;j++) marks[j]=true; i=plain.indexOf(x,i+x.length);} });
    var res='', open=false;
    for(var j=0;j<text.length;j++){ if(marks[j]&&!open){res+='<mark>';open=true;} if(!marks[j]&&open){res+='</mark>';open=false;} res+=esc(text[j]); }
    if(open) res+='</mark>';
    return res;
  }

  var elResults=$('results'), elCount=$('results-count'), elChips=$('chips'), elMore=$('more'), elEmpty=$('empty');

  // controlli statici
  $('f-classe').innerHTML = ['A','B','C'].map(function(c){
    return '<label class="check"><input type="checkbox" value="'+c+'" name="classe"><span class="cls cls-'+c+'" style="width:26px;height:26px;font-size:14px" aria-hidden="true">'+c+'</span> '+CLS_SHORT[c]+' <span class="c" data-fc="'+c+'"></span></label>';
  }).join('');
  $('f-comp').innerHTML = ['municipio','dipartimento'].map(function(c){
    return '<label class="check"><input type="checkbox" value="'+c+'" name="comp"> '+(c==='municipio'?'Municipio IX (classe C)':'Dipartimento Sport (classi A e B)')+' <span class="c" data-fcomp="'+c+'"></span></label>';
  }).join('');
  var inatt = DATA.length - ACTIVE.length;
  $('f-attivi-help').textContent = inatt+' impianti risultano non attivi: sono in attesa di riqualificazione o di un nuovo progetto.';
  ['A','B','C'].forEach(function(c){ document.querySelectorAll('[data-count="'+c+'"]').forEach(function(e){ e.textContent = ACTIVE.filter(function(d){return d.classe===c;}).length; }); });
  if (DATA.some(function(d){return d.approx;})) $('map-note').hidden = false;

  function syncControls(){
    $('q').value = st.q; $('q-clear').classList.toggle('show', !!st.q);
    document.querySelectorAll('input[name=classe]').forEach(function(i){ i.checked = st.classi.has(i.value); });
    document.querySelectorAll('input[name=comp]').forEach(function(i){ i.checked = st.comp.has(i.value); });
    $('f-attivi').checked = st.attivi;
    $('sort').value = st.sort;
    var ex=$('impianti'); ex.classList.remove('v-lista','v-mappa','v-split'); ex.classList.add('v-'+st.vista);
    document.querySelectorAll('.seg button').forEach(function(b){ b.setAttribute('aria-pressed', b.dataset.v===st.vista?'true':'false'); });
    var n = st.classi.size + st.comp.size + (st.attivi?0:1);
    $('nf').textContent = n ? '('+n+')' : '';
  }
  function facets(){
    var t = terms();
    ['A','B','C'].forEach(function(c){
      var n = DATA.filter(function(d){ return d.classe===c && match(d,{ignoreCls:true,terms:t}); }).length;
      document.querySelector('[data-fc="'+c+'"]').textContent = n;
      var inp = document.querySelector('input[name=classe][value="'+c+'"]'); inp.disabled = n===0 && !st.classi.has(c);
      inp.closest('.check').classList.toggle('disabled', inp.disabled);
    });
    ['municipio','dipartimento'].forEach(function(c){
      var n = DATA.filter(function(d){ return d.competenza===c && match(d,{ignoreComp:true,terms:t}); }).length;
      document.querySelector('[data-fcomp="'+c+'"]').textContent = n;
      var inp = document.querySelector('input[name=comp][value="'+c+'"]'); inp.disabled = n===0 && !st.comp.has(c);
      inp.closest('.check').classList.toggle('disabled', inp.disabled);
    });
  }
  function chips(){
    var c=[];
    if(st.q) c.push({k:'q',label:'Ricerca: '+st.q});
    Array.from(st.classi).sort().forEach(function(x){ c.push({k:'c',v:x,label:'Classe '+x}); });
    Array.from(st.comp).forEach(function(x){ c.push({k:'p',v:x,label:'Competenza: '+COMP_SHORT[x]}); });
    if(!st.attivi) c.push({k:'a',label:'Inclusi i non attivi'});
    elChips.innerHTML = c.map(function(x,i){ return '<li class="chip">'+esc(x.label)+'<button type="button" data-i="'+i+'" aria-label="Rimuovi filtro '+esc(x.label)+'"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></li>'; }).join('');
    elChips._items = c;
  }
  function itemHTML(d,t){
    var dd = st.me ? '<span class="dist">'+fmtKm(dist(st.me,d.pos))+'</span>' : '';
    var nEv = upcomingEvents().filter(function(c){ return c.impianti.indexOf(d.sis)>-1; }).length;
    return '<li class="item" data-id="'+d.id+'">'+
      '<span class="cls cls-'+d.classe+'" aria-hidden="true">'+d.classe+'</span>'+
      '<div><h3><a href="'+schedaUrl(d)+'">'+hl(d.titolo,t)+'</a></h3>'+
      (d.hasName || d.ubicazione!==firstAddr(d.ubicazione) ? '<p class="addr">'+hl(d.ubicazione,t)+'</p>' : '')+
      '<p class="meta"><span>Classe <b>'+d.classe+'</b>, '+CLS_SHORT[d.classe].toLowerCase()+'</span><span>Competenza <b>'+COMP_SHORT[d.competenza]+'</b></span><span>SIS <b>'+hl(d.sis,t)+'</b></span>'+dd+'</p>'+
      (!d.attivo ? '<p class="meta"><span class="tag tag-off">In attesa di riqualificazione</span></p>' : '')+
      (nEv ? '<p class="meta"><span class="tag" style="color:var(--rosso)">'+(nEv===1?'1 evento in programma':nEv+' eventi in programma')+'</span></p>' : '')+
      '<div class="item-actions"><button type="button" class="link-btn" data-showmap="'+d.id+'">Mostra sulla mappa</button><a href="'+directions(d)+'" target="_blank" rel="noopener noreferrer">Indicazioni'+NEWWIN+'</a></div>'+
      '</div></li>';
  }

  var current = [];
  function render(o){
    o=o||{};
    if(!o.keepPage) st.shown = PAGE_N;
    var t = terms();
    current = sorted(DATA.filter(function(d){ return match(d,{terms:t}); }));
    var n = current.length;
    elCount.textContent = n===1 ? '1 impianto trovato' : n+' impianti trovati';
    elResults.innerHTML = current.slice(0,st.shown).map(function(d){ return itemHTML(d,t); }).join('');
    elResults.hidden = n===0; elEmpty.hidden = n!==0;
    if(n===0){
      var offN = st.attivi ? DATA.filter(function(d){ return !d.attivo && match(d,{terms:t,ignoreAttivi:true}); }).length : 0;
      $('empty-hint').textContent = offN ? 'Nessun impianto attivo corrisponde alla ricerca, ma ci sono risultati tra quelli non attivi.' : (st.classi.size||st.comp.size ? 'Nessun risultato con i filtri attivi. Prova a toglierne qualcuno.' : 'Controlla come hai scritto il nome o la via.');
      var so=$('show-off'); so.hidden=!offN; so.textContent = offN===1 ? 'Mostra 1 impianto non attivo' : 'Mostra '+offN+' impianti non attivi';
    }
    elMore.hidden = n<=st.shown;
    if(!elMore.hidden) $('btn-more').textContent = 'Mostra altri impianti ('+(n-st.shown)+')';
    $('filters-apply').textContent = n===1 ? 'Mostra 1 impianto' : 'Mostra '+n+' impianti';
    facets(); chips(); syncControls(); writeURL();
    if(!o.noMap) updateMap(!o.keepView);
  }

  // mappa
  var map, cluster, markers={}, meMarker, firstFit=true;
  function initMap(){
    if(!hasL()){ noMap($('map')); return; }
    map = L.map('map',{scrollWheelZoom:true}).setView(CENTER,13);
    tiles(map);
    cluster = L.markerClusterGroup({showCoverageOnHover:false, maxClusterRadius:28, spiderfyOnMaxZoom:true});
    map.addLayer(cluster);
    DATA.forEach(function(d){
      var m = L.marker(d.pos,{icon:pinIcon(d), title:d.titolo.replace(/[“”]/g,'"'), alt:d.titolo, keyboard:true});
      m.bindPopup(popupHTML(d)); m.on('popupopen',function(){ setActive(d.id,false); });
      markers[d.id]=m;
    });
  }
  function updateMap(fit){
    if(!map) return;
    cluster.clearLayers();
    var ms = current.map(function(d){ return markers[d.id]; });
    cluster.addLayers(ms);
    if((fit||firstFit) && ms.length){
      var b = L.latLngBounds(current.map(function(d){ return d.pos; }));
      if(st.me) b.extend(st.me);
      map.fitBounds(b.pad(0.1),{maxZoom:15, animate:!firstFit});
      firstFit=false;
    }
  }
  function setActive(id, scroll){
    document.querySelectorAll('.item.hl').forEach(function(e){ e.classList.remove('hl'); });
    var li = document.querySelector('.item[data-id="'+id+'"]');
    if(li){ li.classList.add('hl'); if(scroll && st.vista==='split') li.scrollIntoView({block:'nearest',behavior:'smooth'}); }
  }
  function showOnMap(id){
    if(!map || !markers[id]) return;
    if(st.vista==='lista' || (window.innerWidth<992 && st.vista!=='mappa')){ st.vista='mappa'; syncControls(); writeURL(); }
    setTimeout(function(){
      map.invalidateSize();
      if(!cluster.hasLayer(markers[id])){ st.attivi=false; render({keepView:true}); }
      cluster.zoomToShowLayer(markers[id], function(){ markers[id].openPopup(); });
      $('map').scrollIntoView({block:'nearest',behavior:'smooth'});
    },60);
  }

  // eventi
  var tmr;
  $('q').addEventListener('input',function(e){ st.q=e.target.value; $('q-clear').classList.toggle('show',!!st.q); clearTimeout(tmr); tmr=setTimeout(function(){ render(); },200); });
  $('cerca').addEventListener('submit',function(e){ e.preventDefault(); clearTimeout(tmr); st.q=$('q').value; render(); $('results-count').focus(); });
  $('q-clear').addEventListener('click',function(){ st.q=''; render(); $('q').focus(); });
  document.addEventListener('change',function(e){
    var t=e.target;
    if(t.name==='classe'){ t.checked?st.classi.add(t.value):st.classi.delete(t.value); render(); }
    else if(t.name==='comp'){ t.checked?st.comp.add(t.value):st.comp.delete(t.value); render(); }
    else if(t.id==='f-attivi'){ st.attivi=t.checked; render(); }
    else if(t.id==='sort'){ st.sort=t.value; render({keepView:true}); }
  });
  document.querySelectorAll('.seg button').forEach(function(b){ b.addEventListener('click',function(){ st.vista=b.dataset.v; syncControls(); writeURL(); setTimeout(function(){ if(map){ map.invalidateSize(); updateMap(true);} },30); }); });
  elChips.addEventListener('click',function(e){
    var b=e.target.closest('button'); if(!b) return;
    var c=elChips._items[+b.dataset.i];
    if(c.k==='q') st.q=''; else if(c.k==='c') st.classi.delete(c.v); else if(c.k==='p') st.comp.delete(c.v); else if(c.k==='a') st.attivi=true;
    render();
    var first=elChips.querySelector('button'); if(first) first.focus(); else $('results-count').focus();
  });
  function resetAll(){ st.q=''; st.classi.clear(); st.comp.clear(); st.attivi=true; render(); }
  $('show-off').addEventListener('click',function(){ st.attivi=false; render(); $('results-count').focus(); });
  ['reset-1','reset-2','reset-3'].forEach(function(id){ $(id).addEventListener('click',resetAll); });
  $('btn-more').addEventListener('click',function(){ var prev=st.shown; st.shown+=PAGE_N; render({keepPage:true,noMap:true}); var li=elResults.children[prev]; if(li){ var a=li.querySelector('a'); a&&a.focus(); } });
  document.querySelectorAll('[data-cls]').forEach(function(b){ b.addEventListener('click',function(){ st.classi.clear(); st.classi.add(b.dataset.cls); st.comp.clear(); st.q=''; st.attivi=true; render(); $('impianti').scrollIntoView({behavior:'smooth'}); }); });
  document.addEventListener('click',function(e){ var s=e.target.closest('[data-showmap]'); if(s){ e.preventDefault(); showOnMap(s.dataset.showmap); } });
  elResults.addEventListener('mouseover',function(e){ var li=e.target.closest('.item'); if(!li) return; document.querySelectorAll('.pin.active').forEach(function(x){x.classList.remove('active');}); var p=document.querySelector('[data-pin="'+li.dataset.id+'"]'); if(p) p.classList.add('active'); });
  elResults.addEventListener('mouseleave',function(){ document.querySelectorAll('.pin.active').forEach(function(x){x.classList.remove('active');}); });

  function openFilters(){ $('filters').classList.add('open'); $('btn-filters').setAttribute('aria-expanded','true'); document.body.style.overflow='hidden'; $('filters-close').focus(); }
  function closeFilters(){ $('filters').classList.remove('open'); $('btn-filters').setAttribute('aria-expanded','false'); document.body.style.overflow=''; $('btn-filters').focus(); }
  $('btn-filters').addEventListener('click',openFilters);
  $('filters-close').addEventListener('click',closeFilters);
  $('filters-apply').addEventListener('click',closeFilters);
  document.addEventListener('keydown',function(e){ if(e.key==='Escape' && $('filters').classList.contains('open')) closeFilters(); });

  function geo(){
    var msg=$('geo-msg');
    if(!navigator.geolocation){ msg.textContent='Il tuo browser non permette di rilevare la posizione.'; return; }
    msg.textContent='Sto rilevando la tua posizione…';
    navigator.geolocation.getCurrentPosition(function(p){
      st.me=[p.coords.latitude,p.coords.longitude];
      document.querySelector('#sort option[value=dist]').disabled=false;
      st.sort='dist';
      msg.textContent='Impianti ordinati per distanza dalla tua posizione. La posizione non viene salvata.';
      if(map){ if(meMarker) map.removeLayer(meMarker); meMarker=L.marker(st.me,{icon:L.divIcon({className:'',html:'<div class="me-pin"></div>',iconSize:[18,18],iconAnchor:[9,9]}),title:'La tua posizione',keyboard:false}).addTo(map); }
      render();
    },function(){ msg.textContent='Non è stato possibile rilevare la posizione. Cerca per nome o indirizzo.'; },{timeout:10000,maximumAge:300000});
  }
  $('btn-geo').addEventListener('click',geo);

  $('btn-csv').addEventListener('click',function(){
    var cols=['sis','classe','denominazione','ubicazione','competenza','stato','note'];
    var head=['Codice SIS','Classe','Denominazione','Ubicazione','Competenza','Stato','Note'];
    var q=function(v){ v=(v==null?'':String(v)); return '"'+v.replace(/"/g,'""')+'"'; };
    var csv='﻿'+head.join(';')+'\n'+DATA.map(function(d){ return cols.map(function(c){ return q(c==='competenza'?COMP[d.competenza]:d[c]); }).join(';'); }).join('\n');
    var a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})); a.download='impianti-sportivi-municipio-ix.csv'; document.body.appendChild(a); a.click(); a.remove();
  });

  initMap();
  render();
  if(focusSis && bySis[focusSis]) showOnMap(bySis[focusSis].id);
  if(wantGeo) geo();
}

/* ================= SCHEDA IMPIANTO ================= */
function initImpianto(){
  var sis = new URLSearchParams(location.search).get('sis');
  var d = bySis[sis], box = $('scheda');
  if(!d){
    box.innerHTML = '<div class="not-found"><h1>Impianto non trovato</h1><p>Il collegamento potrebbe essere incompleto. Cerca l\'impianto nell\'elenco.</p><p><a class="btn" href="impianti.html">Vai all\'elenco degli impianti</a></p></div>';
    return;
  }
  document.title = d.titolo.replace(/[“”]/g,'"') + ' – Sport nel Municipio IX';
  $('crumb-current').textContent = d.titolo;
  var evs = upcomingEvents().filter(function(c){ return c.impianti.indexOf(d.sis)>-1; });
  var nws = newsSorted().filter(function(c){ return c.impianti.indexOf(d.sis)>-1; });
  var same = DATA.filter(function(x){ return x!==d && firstAddr(x.ubicazione).split(',')[0]===firstAddr(d.ubicazione).split(',')[0]; });
  var near = ACTIVE.filter(function(x){ return x!==d && same.indexOf(x)<0; })
    .sort(function(a,b){ return Math.hypot(a.pos[0]-d.pos[0],a.pos[1]-d.pos[1]) - Math.hypot(b.pos[0]-d.pos[0],b.pos[1]-d.pos[1]); }).slice(0,4);
  var rel = function(list){ return '<ul>'+list.map(function(x){ return '<li><a href="'+schedaUrl(x)+'"><span class="cls cls-'+x.classe+'" aria-hidden="true">'+x.classe+'</span><span><span class="t">'+esc(x.titolo)+'</span><span class="s">Classe '+x.classe+' · SIS '+x.sis+(x.attivo?'':' · non attivo')+'</span></span></a></li>'; }).join('')+'</ul>'; };
  var mini = function(list){ return '<ul class="mini-list">'+list.map(function(c){ return '<li>'+datebox(c)+'<span><a href="'+contentUrl(c)+'">'+esc(c.titolo)+'</a><span class="s">'+(c.tipo==='evento'? fmtDate(c.inizio)+(c.orario?', '+c.orario:'') : esc(c.categoria)+' · '+fmtDate(c.data))+'</span></span></li>'; }).join('')+'</ul>'; };
  var access = d.competenza==='municipio'
    ? '<p>Questo impianto è di <b>competenza del Municipio IX</b>. Per informazioni su accesso, orari, tariffe e concessioni rivolgiti all\'Ufficio sport del Municipio.</p><p><a href="contatti.html#ufficio-sport">Contatti dell\'Ufficio sport</a> · <a href="contatti.html#faq">Domande frequenti</a></p>'
    : '<p>Questo impianto è di <b>competenza del Dipartimento Grandi Eventi, Sport, Turismo e Moda</b> di Roma Capitale. Per informazioni su accesso, tariffe e concessioni rivolgiti al Dipartimento.</p><p><a href="contatti.html#dipartimento">Contatti del Dipartimento</a> · <a href="contatti.html#faq">Domande frequenti</a></p>';
  var html =
    '<div class="detail"><div>'+
      '<div class="d-cls"><span class="cls cls-'+d.classe+'" aria-hidden="true">'+d.classe+'</span><span>Classe '+d.classe+': '+CLS_LABEL[d.classe].toLowerCase()+'</span></div>'+
      '<h1>'+esc(d.titolo)+'</h1>'+
      '<p class="d-addr">'+esc(d.ubicazione)+', Roma</p>'+
      (!d.attivo?'<p class="d-note" style="margin:0 0 24px"><b>Impianto attualmente non attivo.</b> '+esc((d.note||'').replace(/^Impianto attualmente inattivo;?\s*/,''))+'</p>':'')+
      '<div class="d-actions"><a class="btn" href="'+directions(d)+'" target="_blank" rel="noopener noreferrer">Indicazioni stradali'+NEWWIN+'</a><a class="btn btn-outline" href="impianti.html?vista=mappa&focus='+encodeURIComponent(d.sis)+'">Vedi sulla mappa degli impianti</a></div>'+
      '<dl class="d-list">'+
        '<div><dt>Codice SIS</dt><dd>'+d.sis+'</dd></div>'+
        '<div><dt>Classe</dt><dd>'+d.classe+', '+CLS_LABEL[d.classe].toLowerCase()+'</dd></div>'+
        '<div><dt>Competenza</dt><dd>'+esc(COMP[d.competenza])+'</dd></div>'+
        '<div><dt>Stato</dt><dd>'+(d.attivo?'Attivo':'Attualmente non attivo')+'</dd></div>'+
        '<div><dt>Municipio</dt><dd>Municipio IX EUR</dd></div>'+
      '</dl>'+
      '<div class="d-pending"><h3>Informazioni in aggiornamento</h3><p>Gestore, orari, contatti, discipline praticate e foto saranno aggiunti quando disponibili.</p></div>'+
      '<h2>Eventi in programma</h2>'+(evs.length? mini(evs) : '<p>Nessun evento in programma in questo impianto. <a href="eventi-news.html">Vedi tutti gli eventi</a></p>')+
      (nws.length? '<h2>Notizie su questo impianto</h2>'+mini(nws) : '')+
      '<div class="access-box"><h2>Come accedere</h2>'+access+'<p><a href="#">Regolamento impianti sportivi (D.A.C. 186/2023)</a></p></div>'+
    '</div><aside aria-label="Approfondimenti">'+
      '<div class="aside-box"><h2>Dove si trova</h2><p>'+esc(firstAddr(d.ubicazione))+', Roma</p>'+(d.approx?'<p class="f-help">Posizione indicativa, in attesa delle coordinate esatte.</p>':'')+'<div class="mini-map-wrap"><div id="mini-map" role="img" aria-label="Mappa con la posizione dell\'impianto"></div></div></div>'+
      (same.length? '<div class="aside-box"><h2>Nella stessa via</h2>'+rel(same)+'</div>' : '')+
      '<div class="aside-box"><h2>Impianti vicini</h2>'+rel(near)+'</div>'+
      '<div class="aside-box"><h2>Hai trovato un errore?</h2><p>Segnalaci un indirizzo o un dato da correggere.</p><a class="btn btn-outline" href="contatti.html#segnala">Segnala</a></div>'+
    '</aside></div>';
  box.innerHTML = html;
  var el = $('mini-map');
  if(!hasL()){ noMap(el); return; }
  var map = L.map(el,{scrollWheelZoom:false, zoomControl:true}).setView(d.pos, 15);
  tiles(map);
  L.marker(d.pos,{icon:pinIcon(d), keyboard:false}).addTo(map);
}

/* ================= EVENTI E NEWS ================= */
var TABS = [
  {k:'tutti', l:'Tutti'}, {k:'eventi', l:'Eventi'}, {k:'Avvisi e bandi', l:'Avvisi e bandi'},
  {k:'Lavori e chiusure', l:'Lavori e chiusure'}, {k:'Iniziative', l:'Iniziative'}, {k:'Comunicati', l:'Comunicati'}
];
function eventCard(c){
  var d = placeOf(c), up = isUpcoming(c);
  return '<li class="card ev-card'+(up?'':' past')+'"><div class="card-body">'+
    '<div class="when">'+datebox(c)+'<p class="kicker">'+esc(c.categoria)+(up?'':' <span class="badge badge-closed">Concluso</span>')+'</p></div>'+
    '<h3><a href="'+contentUrl(c)+'">'+esc(c.titolo)+'</a></h3>'+
    '<p class="ev-sum">'+esc(c.sommario)+'</p>'+
    '<p class="meta-l">'+(c.orario?'Ore '+esc(c.orario):'')+(d?'<br>'+esc(d.titolo):'')+'</p>'+
  '</div></li>';
}
function feedItem(c){
  var meta = c.tipo==='evento'
    ? eventMeta(c)
    : 'Pubblicato il '+fmtDate(c.data) + (function(){ var d=placeOf(c); return d? ' · '+esc(d.titolo) : ''; })();
  return '<li>'+datebox(c)+'<div><p class="kicker">'+esc(c.categoria)+' '+scadBadge(c)+'</p><h3><a href="'+contentUrl(c)+'">'+esc(c.titolo)+'</a></h3><p>'+esc(c.sommario)+'</p><p class="meta-l">'+meta+'</p></div></li>';
}
function initFeed(){
  var P = new URLSearchParams(location.search);
  var st = {tipo: P.get('tipo')||'tutti', imp: P.get('impianto')||''};
  if(!TABS.some(function(t){return t.k===st.tipo;})) st.tipo='tutti';
  var tabs=$('tabs'), sel=$('f-imp');
  tabs.innerHTML = TABS.map(function(t){ return '<button type="button" data-k="'+esc(t.k)+'" aria-pressed="false">'+t.l+'</button>'; }).join('');
  sel.innerHTML = '<option value="">Tutti gli impianti</option>' + DATA.slice().sort(function(a,b){return sisNum(a)-sisNum(b);}).map(function(d){ return '<option value="'+d.sis+'">'+esc(d.titolo)+' ('+d.sis+')</option>'; }).join('');
  sel.value = bySis[st.imp] ? st.imp : '';
  function ok(c){
    if(st.imp && c.impianti.indexOf(st.imp)<0) return false;
    if(st.tipo==='tutti') return true;
    if(st.tipo==='eventi') return c.tipo==='evento';
    return c.tipo==='news' && c.categoria===st.tipo;
  }
  function section(title, list, id){
    if(!list.length) return '';
    var asCards = list[0].tipo==='evento';
    return '<section class="feed-section" aria-labelledby="'+id+'"><h2 id="'+id+'">'+title+'</h2>'+(asCards ? '<ul class="cards ev-cards">'+list.map(eventCard).join('')+'</ul>' : '<ul class="feed">'+list.map(feedItem).join('')+'</ul>')+'</section>';
  }
  function render(){
    tabs.querySelectorAll('button').forEach(function(b){ b.setAttribute('aria-pressed', b.dataset.k===st.tipo?'true':'false'); });
    var up = upcomingEvents().filter(ok), news = newsSorted().filter(ok), past = pastEvents().filter(ok);
    var n = up.length+news.length+past.length;
    $('feed-count').textContent = n===1 ? '1 contenuto' : n+' contenuti';
    $('feed').innerHTML = n===0
      ? '<div class="feed-empty"><h2 style="font-size:22px;margin-bottom:8px">Nessun contenuto</h2><p style="margin:0">Non ci sono eventi o notizie con questi filtri. <button type="button" class="link-btn" id="feed-reset">Mostra tutto</button></p></div>'
      : section('In programma', up, 'h-up') + section(st.tipo==='eventi'?'':'Notizie e avvisi', news, 'h-news') + section('Eventi conclusi', past, 'h-past');
    var r=$('feed-reset'); if(r) r.addEventListener('click',function(){ st.tipo='tutti'; st.imp=''; sel.value=''; render(); });
    var p=new URLSearchParams(); if(st.tipo!=='tutti') p.set('tipo',st.tipo); if(st.imp) p.set('impianto',st.imp);
    try{ history.replaceState(null,'',location.pathname+(p.toString()?'?'+p.toString():'')); }catch(e){}
  }
  tabs.addEventListener('click',function(e){ var b=e.target.closest('button'); if(!b) return; st.tipo=b.dataset.k; render(); });
  sel.addEventListener('change',function(){ st.imp=sel.value; render(); });
  render();
}

/* ================= DETTAGLIO EVENTO / NEWS ================= */
function ics(c){
  var d=c.inizio.replace(/-/g,''), f=pd(c.fine||c.inizio); f.setDate(f.getDate()+1);
  var fe=f.getFullYear()+String(f.getMonth()+1).padStart(2,'0')+String(f.getDate()).padStart(2,'0');
  var place=placeOf(c);
  var txt=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Sport Municipio IX//IT','BEGIN:VEVENT','UID:'+c.id+'@sport-municipio-ix','DTSTAMP:'+new Date().toISOString().replace(/[-:]/g,'').slice(0,15)+'Z','DTSTART;VALUE=DATE:'+d,'DTEND;VALUE=DATE:'+fe,'SUMMARY:'+c.titolo,'DESCRIPTION:'+(c.orario?'Orario '+c.orario+'. ':'')+c.sommario,'LOCATION:'+(place?firstAddr(place.ubicazione)+', Roma':'Roma'),'END:VEVENT','END:VCALENDAR'].join('\r\n');
  var a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([txt],{type:'text/calendar'})); a.download=c.id+'.ics'; document.body.appendChild(a); a.click(); a.remove();
}
function initContenuto(){
  var id = new URLSearchParams(location.search).get('id');
  var c = CONT.filter(function(x){ return x.id===id; })[0], box=$('dettaglio');
  if(!c){
    box.innerHTML='<div class="not-found"><h1>Contenuto non trovato</h1><p>Il collegamento potrebbe essere scaduto o incompleto.</p><p><a class="btn" href="eventi-news.html">Vai a eventi e news</a></p></div>';
    return;
  }
  document.title = c.titolo + ' – Sport nel Municipio IX';
  $('crumb-current').textContent = c.titolo;
  var place = placeOf(c);
  var imps = c.impianti.map(function(s){ return bySis[s]; }).filter(Boolean);
  var related = (c.tipo==='evento' ? upcomingEvents() : newsSorted()).filter(function(x){ return x!==c; }).slice(0,3);
  var info;
  if(c.tipo==='evento'){
    info = '<dl class="d-list">'+
      '<div><dt>Quando</dt><dd>'+fmtDate(c.inizio)+(c.fine && c.fine!==c.inizio?' – '+fmtDate(c.fine):'')+(c.orario?', ore '+c.orario:'')+'</dd></div>'+
      (place?'<div><dt>Dove</dt><dd><a href="'+schedaUrl(place)+'">'+esc(place.titolo)+'</a><br>'+esc(firstAddr(place.ubicazione))+', Roma</dd></div>':'')+
      (c.organizzatore?'<div><dt>Organizzatore</dt><dd>'+esc(c.organizzatore)+'</dd></div>':'')+
      (c.iscrizione?'<div><dt>Partecipazione</dt><dd>'+esc(c.iscrizione)+'</dd></div>':'')+
    '</dl>';
  } else {
    info = c.scadenza ? '<dl class="d-list"><div><dt>Scadenza</dt><dd>'+fmtDate(c.scadenza)+' '+scadBadge(c)+'</dd></div></dl>' : '';
  }
  var actions = c.tipo==='evento' && isUpcoming(c)
    ? '<div class="d-actions" style="margin-top:24px"><button type="button" class="btn" id="btn-ics">Aggiungi al calendario</button><button type="button" class="btn btn-outline" id="btn-share">Condividi</button></div><p class="geo-msg" id="share-msg" aria-live="polite"></p>'
    : '<div class="d-actions" style="margin-top:24px"><button type="button" class="btn btn-outline" id="btn-share">Condividi</button></div><p class="geo-msg" id="share-msg" aria-live="polite"></p>';
  var attach = (c.allegati||[]).length ? '<h2>Allegati</h2><ul class="attach">'+c.allegati.map(function(a){ return '<li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5"/></svg><a href="#">'+esc(a)+'</a></li>'; }).join('')+'</ul>' : '';
  var html = '<div class="detail"><div>'+
    '<p class="kicker">'+(c.tipo==='evento'?'Evento · ':'')+esc(c.categoria)+(c.tipo==='news'?' <span style="color:var(--testo-2);text-transform:none;letter-spacing:0;font-weight:600">· '+fmtDate(c.data)+'</span>':'')+(c.tipo==='evento'&&!isUpcoming(c)?' <span class="badge badge-closed">Concluso</span>':'')+'</p>'+
    '<h1>'+esc(c.titolo)+'</h1><p class="lead">'+esc(c.sommario)+'</p>'+info+
    '<div class="prose" style="margin-top:28px">'+c.testo.map(function(p){ return '<p>'+esc(p)+'</p>'; }).join('')+'</div>'+
    attach+actions+
    (c.esempio?'<p class="example-note" style="margin-top:28px">Contenuto di esempio, inserito per mostrare la struttura della pagina.</p>':'')+
  '</div><aside aria-label="Approfondimenti">'+
    (place?'<div class="aside-box"><h2>'+(c.tipo==='evento'?'Dove':'Impianto collegato')+'</h2><p><a href="'+schedaUrl(place)+'">'+esc(place.titolo)+'</a><br>'+esc(firstAddr(place.ubicazione))+', Roma</p><div class="mini-map-wrap"><div id="mini-map" role="img" aria-label="Mappa con la posizione dell\'impianto"></div></div></div>':'')+
    (imps.length>1?'<div class="aside-box"><h2>Impianti collegati</h2><ul>'+imps.map(function(x){ return '<li><a href="'+schedaUrl(x)+'"><span class="cls cls-'+x.classe+'" aria-hidden="true">'+x.classe+'</span><span><span class="t">'+esc(x.titolo)+'</span><span class="s">SIS '+x.sis+'</span></span></a></li>'; }).join('')+'</ul></div>':'')+
    (related.length?'<div class="aside-box"><h2>'+(c.tipo==='evento'?'Altri eventi in programma':'Altre notizie')+'</h2><ul class="mini-list" style="border-top:0">'+related.map(function(x){ return '<li>'+datebox(x)+'<span><a href="'+contentUrl(x)+'">'+esc(x.titolo)+'</a><span class="s">'+esc(x.categoria)+'</span></span></li>'; }).join('')+'</ul></div>':'')+
  '</aside></div>';
  box.innerHTML = html;
  var bi=$('btn-ics'); if(bi) bi.addEventListener('click',function(){ ics(c); $('share-msg').textContent='File del calendario scaricato.'; });
  $('btn-share').addEventListener('click',function(){
    if(navigator.share){ navigator.share({title:c.titolo, url:location.href}).catch(function(){}); return; }
    try{ navigator.clipboard.writeText(location.href).then(function(){ $('share-msg').textContent='Link copiato negli appunti.'; }); }catch(e){ $('share-msg').textContent='Copia il link dalla barra degli indirizzi.'; }
  });
  var el=$('mini-map'); if(!el) return;
  if(!hasL()){ noMap(el); return; }
  var map=L.map(el,{scrollWheelZoom:false}).setView(place.pos,15); tiles(map);
  L.marker(place.pos,{icon:pinIcon(place),keyboard:false}).addTo(map);
}

/* ================= CONTATTI ================= */
function initContatti(){
  var f=$('form-segnala'); if(!f) return;
  var sel=$('s-imp');
  sel.innerHTML='<option value="">Nessun impianto in particolare</option>'+DATA.slice().sort(function(a,b){return sisNum(a)-sisNum(b);}).map(function(d){ return '<option value="'+d.sis+'">'+esc(d.titolo)+' ('+d.sis+')</option>'; }).join('');
  var pre=new URLSearchParams(location.search).get('impianto'); if(pre && bySis[pre]) sel.value=pre;
  f.addEventListener('submit',function(e){ e.preventDefault(); $('form-msg').textContent='Mockup: l\'invio non è attivo. Nel sito reale la segnalazione arriverà all\'Ufficio sport.'; });
}

/* ================= avvio ================= */
initHeader();
initRating();
var page = document.body.dataset.page;
({home:initHome, impianti:initImpianti, impianto:initImpianto, feed:initFeed, contenuto:initContenuto, contatti:initContatti}[page] || function(){})();
})();
