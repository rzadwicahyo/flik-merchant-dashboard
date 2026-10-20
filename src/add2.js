/* ===== FLIK Shipping prototype v2: contextual checklist, shipping graph, coverage, red zone ===== */

/* --- Coverage and red zone (example data; in production this is the courier coverage API) --- */
const CHK=[{k:'spx',n:'SPX Express'},{k:'jnt',n:'J&T Express'},{k:'jne',n:'JNE'},{k:'ninja',n:'Ninja Xpress'},{k:'lion',n:'Lion Parcel'},{k:'sicepat',n:'SiCepat'},{k:'anteraja',n:'AnterAja'},
  {k:'idexpress',n:'ID Express'},{k:'gosend',n:'GoSend'},{k:'lalamove',n:'Lalamove'},{k:'paxel',n:'Paxel'},{k:'tiki',n:'TIKI'},{k:'rpx',n:'RPX'},{k:'sap',n:'SAP Express'},{k:'mrspeedy',n:'Borzo'}];
const BOOKABLE=['spx','jnt','jne','ninja','lion','sicepat','anteraja'];
/* 'ok' delivers · 'no' no coverage · 'rzcod' red zone for COD only · 'rz' red zone for everything */
const COVX={
  '80113':{jne:'ok',spx:'rzcod',jnt:'rzcod',ninja:'rzcod',lion:'rzcod',sicepat:'rzcod',anteraja:'rzcod',idexpress:'rzcod',paxel:'ok',tiki:'ok',gosend:'ok',lalamove:'ok',mrspeedy:'ok',rpx:'ok',sap:'ok'},
  '90231':{ninja:'ok',spx:'rzcod',jne:'rzcod',jnt:'rzcod',lion:'rz',sicepat:'rzcod',anteraja:'rzcod',idexpress:'no',gosend:'no',lalamove:'no',paxel:'no',mrspeedy:'no',tiki:'ok',rpx:'ok',sap:'ok'},
  '20153':{jnt:'ok',spx:'rzcod',jne:'rzcod',ninja:'rzcod',lion:'rzcod',sicepat:'rzcod',anteraja:'rzcod',gosend:'no',lalamove:'no',mrspeedy:'no',idexpress:'ok',paxel:'ok',tiki:'ok',rpx:'ok',sap:'ok'},
  '55271':{spx:'rzcod',jnt:'ok',jne:'ok',ninja:'rzcod',lion:'ok',sicepat:'ok',anteraja:'ok',gosend:'no',lalamove:'no',mrspeedy:'no'},
  '98411':{spx:'no',jnt:'no',ninja:'no',lion:'rz',sicepat:'no',anteraja:'no',jne:'ok',gosend:'no',lalamove:'no',mrspeedy:'no',paxel:'no',idexpress:'no',tiki:'ok',rpx:'ok',sap:'rzcod'},
  '40135':{},'12810':{},'12730':{},'60286':{},'50132':{},'60226':{},'40125':{},'15341':{jnt:'rzcod',spx:'ok',jne:'ok',ninja:'ok',lion:'ok',sicepat:'ok',anteraja:'ok'},'70111':{gosend:'no',lalamove:'no',mrspeedy:'no',paxel:'no',spx:'ok',jne:'ok',jnt:'ok',ninja:'rzcod',lion:'ok',sicepat:'ok',anteraja:'ok'}};
const hash=s=>{let h=0;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))&0xffff;return h};
function covOf(zip,k){const z=String(zip||'');const t=COVX[z];if(t&&t[k])return t[k];
  const h=hash(z+'|'+k);
  if(!t){if(h%11===0)return'no';if(h%17===0)return'rz';if(h%7===0)return'rzcod'}
  else if(['gosend','lalamove','mrspeedy','paxel','rpx','sap','tiki','idexpress'].includes(k)){if(h%5===0)return'no';if(h%9===0)return'rzcod'}
  return'ok'}
/* can courier k take this row? */
const canTake=(zip,pay,k)=>{const c=covOf(zip,k);return c==='ok'||(c==='rzcod'&&pay!=='cod')};
const covLabel=c=>c==='ok'?'Delivers':c==='no'?'No coverage':c==='rz'?'Red zone':'Red zone for COD';
function covNote(r){if(!r.zip)return null;const pay=r.pay||'cod';
  const bad=BOOKABLE.filter(k=>!canTake(r.zip,pay,k)),name=k=>CHK.find(c=>c.k===k).n;
  if(!bad.length)return null;
  if(bad.length>=BOOKABLE.length-1){const ok=BOOKABLE.filter(k=>canTake(r.zip,pay,k));
    return{t:'warn',f:[],m:`Only ${ok.map(name).join(' and ')||'a cargo courier'} ${ok.length===1?'delivers':'deliver'} to ${r.zip}${pay==='cod'?' with COD: the others have it in their red zone':''}.`}}
  return{t:'info',f:[],m:`${bad.map(name).join(', ')} ${bad.length===1?'does':'do'} not take ${r.zip}${pay==='cod'?' with COD':''}.`}}
/* cheapest service (same group as the chosen one) that can take a row */
function cheapestFor(ship,group){const zip=ship.area?ship.area.zip:ship.addr&&ship.addr.zip,pay=ship.pay||'cod';
  const list=SERVICES.map((v,i)=>[v,i]).filter(([v])=>v[2]===group&&BOOKABLE.includes(v[0])&&canTake(zip,pay,v[0])).sort((a,b)=>a[0][4]-b[0][4]);
  return list.length?list[0][1]:null}
const shipZip=s=>s.area?s.area.zip:(s.addr?s.addr.zip:'');
const svcCovers=(svcIdx,s)=>canTake(shipZip(s),s.pay||'cod',SERVICES[svcIdx][0]);
const svcCoverCount=i=>X.ships.filter(s=>svcCovers(i,s)).length;
/* seeded delivery rate per courier, last 90 days */
const DRATE={spx:97,jnt:96,jne:95,ninja:94,lion:93,sicepat:92,anteraja:94};
const favCourier=()=>{const c={};SH.forEach(s=>{c[s.svc[0]]=(c[s.svc[0]]||0)+1});const k=Object.keys(c).sort((a,b)=>c[b]-c[a])[0];return k||null};

/* --- Checklist: one product at a time, contextual, closable (R7) --- */
const CKP={
  shipping:{t:'FLIK Shipping',h:'Get your first shipment out',done:'Your first shipment is on its way',
    steps:[['addr','Add a pickup address','Couriers pick up from here.','Add address'],['created','Create your first shipment','Single or bulk, COD and non-COD together.','Create shipment'],['paid','Send your first shipment','Non-COD shipping is paid from your balance. COD is deducted after delivery.','Send it']],
    tail:'Track it in Shipments. Anything that goes wrong shows up in Needs action.'},
  payments:{t:'FLIK Payments',h:'Take your first online payment',done:'You can take payments',
    steps:[['link','Create a payment link','Share it on WhatsApp or Instagram.','Create link'],['checkout','Connect Checkout to your store','Cards, VA, e-wallet and QRIS in one checkout.','Connect']],
    tail:'Every payment lands in your FLIK balance.',key:'pay'},
  funding:{t:'FLIK Funding',h:'See how much you can borrow',done:'Your application is in',
    steps:[['apply','Check your funding offer','Based on the sales FLIK already sees.','Check offer']],
    tail:'The FLIK team contacts you on WhatsApp.',key:'fund'}};
const ckStore=p=>CKP[p].key?PS[CKP[p].key]:PS.first;
const ckLeft=p=>CKP[p].steps.filter(s=>!ckStore(p)[s[0]]).length;
const ckPick=()=>{const order=[PS.prod,'shipping','payments','funding'].filter((v,i,a)=>a.indexOf(v)===i);
  return order.find(p=>ckLeft(p)&&!PS.ckClosed[p])||null};
let ckSeen=new Set();
function ckHtml(where,prod){const p=prod||ckPick();if(!p)return'';
  const C=CKP[p],st=ckStore(p),total=C.steps.length,done=total-ckLeft(p),next=C.steps.find(s=>!st[s[0]]);
  if(!ckSeen.has(where+p+done)){ckSeen.add(where+p+done);track('checklist_viewed',{product:p,page:where,steps_done:done,steps_total:total})}
  const others=Object.keys(CKP).filter(k=>k!==p&&ckLeft(k)).map(k=>`<button class="lnk" data-ckgo="${k}">${CKP[k].t.replace('FLIK ','')}</button>`).join('<i>·</i>');
  if(!next)return`<section class="ck"><div class="ck-h"><h3>${C.done}</h3><span class="sc">${total} of ${total} done</span><button class="ib ck-x" data-ckclose="${p}" aria-label="Close checklist">${ic('x',16)}</button></div><div class="ck-bar"><i style="width:100%"></i></div><p class="vf-lead">${C.tail}</p>${others?`<p class="ck-also">Also in FLIK: ${others}</p>`:''}</section>`;
  return`<section class="ck" aria-label="Get started with ${C.t}"><div class="ck-h"><h3>${C.h}</h3><span class="sc">${done} of ${total} done</span><button class="ib ck-x" data-ckclose="${p}" aria-label="Close checklist">${ic('x',16)}</button></div>
  <div class="ck-bar"><i style="width:${done/total*100}%"></i></div>
  ${C.steps.map(c=>{const d=st[c[0]],n=next===c;return`<div class="ck-s${d?' done':''}${n?' next':''}"><span class="dot">${d?ic('check',13,2.6):''}</span><span class="tx"><b>${c[1]}</b><span>${c[2]}</span></span>${n?`<button class="btn btn-p" data-ck="${c[0]}">${c[3]}</button>`:''}</div>`}).join('')}
  ${others?`<p class="ck-also">Also in FLIK: ${others}</p>`:''}</section>`}
document.addEventListener('click',e=>{
  const x=e.target.closest('[data-ckclose]');if(x){PS.ckClosed[x.dataset.ckclose]=true;track('checklist_closed',{product:x.dataset.ckclose});refreshAll();toast('Checklist hidden. Open it again from Help › Setup guide');return}
  const g=e.target.closest('[data-ckgo]');if(g){const p=g.dataset.ckgo;PS.prod=p;PS.ckClosed[p]=false;track('checklist_switched',{product:p});
    if(p==='payments')location.hash='invoices';else if(p==='funding')location.hash='merchant-cash-advance';else location.hash='shipments';return}
  const s=e.target.closest('[data-ck]');if(!s)return;const k=s.dataset.ck;
  if(k==='addr')addWhModal();
  else if(k==='created')location.hash='shipments/create';
  else if(k==='paid'){const p=SH.find(v=>v.st==='pay');if(p)payPending(p.id);else location.hash='shipments/create'}
  else if(k==='link'){PS.pay.link=true;track('checklist_step_done',{product:'payments',step:k});toast('Payment link created');refreshAll()}
  else if(k==='checkout'){PS.pay.checkout=true;track('checklist_step_done',{product:'payments',step:k});toast('Checkout connected');refreshAll()}
  else if(k==='apply'){PS.fund.apply=true;track('checklist_step_done',{product:'funding',step:k});location.hash='merchant-cash-advance/apply'}});
function refreshAll(){const v=hashView();if(v==='home')renderHomeExtra();else if(v==='shp'&&sx.hidden)renderShp();else if(['trk','whs','rz','ana'].includes(v))renderSub(v)}
/* Help › Setup guide reopens it */
(function(){const h=document.querySelector('[data-toast="Opens FLIK help center"]');if(!h)return;h.removeAttribute('data-toast');
  h.onclick=e=>{e.stopPropagation();if(popFor===h){closePop();return}popFor=h;
    pop.innerHTML=`<div class="menu"><h6>Help</h6><button class="opt" data-hsetup>${ic('check',16)}Setup guide</button><button class="opt" data-toast="Opens the FLIK help centre">${ic('book',16)}Help centre</button><button class="opt" data-toast="Opens WhatsApp support">${ic('chat',16)}Chat with support</button></div>`;
    pop.querySelector('[data-hsetup]').onclick=()=>{PS.ckClosed={};closePop();track('setup_guide_reopened',{});refreshAll();toast('Setup guide is back on Home')};placePop(h,true)}})();

/* --- Home: quick access, contextual checklist, shipping graph (R7, chart) --- */
const HOMEC=document.getElementById('view-home');
HOMEC.querySelector('.sec:last-of-type').insertAdjacentHTML('beforebegin','<div id="home-chart"></div>');
(function(){const old=HOMEC.querySelectorAll('.sec');old[old.length-1].hidden=true;old[old.length-1].nextElementSibling.hidden=true})();
const HD=[['7','Last 7 days',7],['30','Last 30 days',30],['90','Last 90 days',90],['180','Last 6 months',180],['365','Last 12 months',365]];
const HTABS=[['shipping','Shipping'],['payments','Payments'],['cross','More from FLIK']];
function renderHomeExtra(){const el=document.getElementById('home-extra');let h=vBanner();
  if(PS.mode==='active'){const c=naCounts();if(c.total)h+=`<div class="na-strip">${ic('warn',20)}<div class="tx"><b>${c.total} shipments need action</b><span>Last ${PS.dr} days. Critical problems are also emailed to ${PS.ops} straight away.</span></div><div class="na-sev">${['Critical','High','Medium'].filter(s=>c.sev[s]).map(s=>`<span class="st ${SEVC[s]}">${c.sev[s]} ${s}</span>`).join('')}</div><button class="btn btn-p" data-gona>Review shipments</button></div>`}
  h+=ckHtml('home');
  el.innerHTML=h;renderHomeChart()}
/* buckets: daily, weekly or monthly depending on the range */
function buckets(days){const out=[];const step=days<=14?1:days<=90?7:30;
  for(let off=days-step;off>=0;off-=step){const d0=new Date(NOW);d0.setHours(0,0,0,0);d0.setDate(d0.getDate()-off-step+1);const d1=new Date(d0);d1.setDate(d1.getDate()+step);
    out.push({d0,d1,step,cod:0,non:0,codv:0,nonv:0,n:0,del:0,ret:0})}
  return out}
function shipSeries(days){const bs=buckets(days);
  SH.forEach(s=>{const b=bs.find(x=>s.created>=x.d0&&s.created<x.d1);if(!b)return;
    const v=s.cod?s.codv:Math.round(s.cost*8.5);b.n++;if(s.cod){b.cod++;b.codv+=v}else{b.non++;b.nonv+=v}
    if(s.st==='delivered'||s.st==='credited')b.del++;if(s.st==='returned'||s.st==='returning')b.ret++});
  return bs}
const bLabel=b=>b.step===1?`${b.d0.getDate()} ${MON[b.d0.getMonth()]}`:b.step===7?`${b.d0.getDate()} ${MON[b.d0.getMonth()]}`:`${MON[b.d0.getMonth()]} ${String(b.d0.getFullYear()).slice(2)}`;
function renderHomeChart(){const el=document.getElementById('home-chart');
  const tabs=`<div class="tabs hc-tabs" role="tablist">${HTABS.map(t=>`<button class="tab${PS.hTab===t[0]?' on':''}" data-htab="${t[0]}">${t[1]}</button>`).join('')}</div>`;
  if(PS.hTab==='cross'){el.innerHTML=`<h2 class="sec">Your business</h2>${tabs}<div class="es-cards c3">
    <section class="es-card"><span class="qic">${ic('coins',20,1.6)}</span><h3>FLIK Funding</h3><p>Borrow against the sales FLIK already sees, with no collateral. Repay from your daily settlements.</p><button class="es-link" data-xsell="funding">See your offer</button></section>
    <section class="es-card"><span class="qic">${ic('cart',20,1.6)}</span><h3>FLIK Payments</h3><p>Take cards, VA, e-wallet and QRIS with one checkout, and settle into the same balance you ship from.</p><button class="es-link" data-xsell="payments">Create a payment link</button></section>
    <section class="es-card"><span class="qic">${ic('tag',20,1.6)}</span><h3>Free shipping promos</h3><p>Give shoppers free or discounted shipping over a minimum spend, and FLIK applies it at checkout.</p><button class="es-link" data-toast="Opens the new promo form">Create a promo</button></section></div>`;
    el.querySelectorAll('[data-xsell]').forEach(b=>b.onclick=()=>{PS.prod=b.dataset.xsell;location.hash=b.dataset.xsell==='funding'?'merchant-cash-advance':'invoices'});
    track('home_chart_tab',{tab:'cross'});return}
  if(PS.hTab==='payments'){el.innerHTML=`<h2 class="sec">Payments summary</h2>${tabs}<section class="card"><div class="kpi-row"><div class="kpi"><div class="kpi-v"><b class="num">Rp0</b></div><span class="kpi-l">Last ${PS.hDays} days</span></div></div>
    <div class="lite" style="margin:0"><span class="qic">${ic('cart',22,1.6)}</span><div class="tx"><h2>Take your first payment to fill this graph</h2><p>Payment links, Checkout and invoices all land here, so you can see what sells and what settles.</p></div><button class="btn btn-p" data-xsell="payments">Create a payment link</button></div></section>`;
    el.querySelectorAll('[data-xsell]').forEach(b=>b.onclick=()=>{PS.prod='payments';location.hash='invoices'});
    track('home_chart_tab',{tab:'payments'});return}
  const empty=!SH.length;
  el.innerHTML=`<h2 class="sec">Shipping summary</h2>${tabs}
  <section class="card">${empty?`<div class="lite" style="margin:0"><span class="qic">${ic('truck',22,1.6)}</span><div class="tx"><h2>Ship your first order to fill this graph</h2><p>Once parcels start moving you see orders, GMV, how many arrive and how many come back, split by COD and non-COD.</p></div><button class="btn btn-p" data-newshp>Create shipment</button></div>`
  :`<div class="kpi-row"><div class="kpi" id="hk"></div><div class="kpi-ctl"><button class="chip set" id="hrange"><span>Period</span> <span class="val">${(HD.find(d=>+d[0]===PS.hDays)||HD[1])[1]}</span>${ic('chev',14,2)}</button>
    <div class="seg" id="hmetric"><button class="${PS.hMetric!=='gmv'?'on':''}" data-hm="count">Shipment orders</button><button class="${PS.hMetric==='gmv'?'on':''}" data-hm="gmv">Total GMV</button></div></div></div>
  <div class="hc-legend"><span class="lg cod"></span>COD<span class="lg non"></span>Non-COD<span class="sp"></span><span class="hc-rate" id="hrate"></span></div>
  <div class="chart" id="shipchart"></div>`}</section>`;
  if(empty)return;
  document.getElementById('hrange').onclick=e=>{e.stopPropagation();const b=e.currentTarget;if(popFor===b){closePop();return}popFor=b;
    pop.innerHTML=`<h6>Period</h6>${HD.map(d=>`<button class="opt" data-n="${d[2]}"><span class="rdo${PS.hDays===d[2]?' on':''}"></span>${d[1]}</button>`).join('')}<p class="src" style="padding:6px 10px 2px">Up to 12 months</p>`;
    pop.querySelectorAll('[data-n]').forEach(o=>o.onclick=()=>{PS.hDays=+o.dataset.n;closePop();track('home_chart_range',{days:PS.hDays});renderHomeChart()});placePop(b,true)};
  document.querySelectorAll('#hmetric [data-hm]').forEach(b=>b.onclick=()=>{PS.hMetric=b.dataset.hm;track('home_chart_metric',{metric:PS.hMetric});renderHomeChart()});
  drawShipChart();track('home_chart_tab',{tab:'shipping',days:PS.hDays,metric:PS.hMetric||'count'})}
function drawShipChart(){const el=document.getElementById('shipchart');if(!el||!el.clientWidth)return;
  const gmv=PS.hMetric==='gmv',bs=shipSeries(PS.hDays);
  const tot=bs.reduce((a,b)=>({n:a.n+b.n,cod:a.cod+b.cod,non:a.non+b.non,v:a.v+b.codv+b.nonv,del:a.del+b.del,ret:a.ret+b.ret}),{n:0,cod:0,non:0,v:0,del:0,ret:0});
  const pct=(a,b)=>b?Math.round(a/b*100)+'%':'—';
  document.getElementById('hk').innerHTML=`<div class="kpi-v"><b class="num">${gmv?rp(tot.v):tot.n.toLocaleString('id-ID')}</b></div><span class="kpi-l">${gmv?'GMV shipped':'Shipment orders'} · ${tot.cod} COD, ${tot.non} non-COD</span>`;
  document.getElementById('hrate').innerHTML=`Delivered ${pct(tot.del,tot.n)}${ic('check',13,2.4)} · Returned ${pct(tot.ret,tot.n)}`;
  const W=el.clientWidth,Hh=el.clientHeight,L=gmv?64:34,R=12,T=14,B=28,iw=W-L-R,ih=Hh-T-B;
  const val=b=>gmv?[b.codv,b.nonv]:[b.cod,b.non];
  const max=niceMax(Math.max(1,...bs.map(b=>val(b)[0]+val(b)[1])));
  const Y=v=>T+ih-(v/max)*ih,bw=Math.max(6,Math.min(34,iw/bs.length*.62)),cx=i=>L+iw*(i+.5)/bs.length;
  let g='';for(let i=0;i<=5;i++){const v=max*i/5,y=Y(v);g+=`<line class="gl" x1="${L}" x2="${W-R}" y1="${y}" y2="${y}"/><text class="ax" x="${L-8}" y="${y+4}" text-anchor="end">${gmv?compact(v):Math.round(v)}</text>`}
  const step=Math.ceil(bs.length/8);
  bs.forEach((b,i)=>{if(i%step===0||i===bs.length-1)g+=`<text class="ax" x="${cx(i)}" y="${Hh-6}" text-anchor="middle">${bLabel(b)}</text>`});
  const bars=bs.map((b,i)=>{const [c,n]=val(b),x=cx(i)-bw/2;const yc=Y(c),yn=Y(c+n);
    return`${c?`<rect x="${x}" y="${yc}" width="${bw}" height="${Math.max(1,T+ih-yc)}" rx="2" fill="#6A4BFF"/>`:''}${n?`<rect x="${x}" y="${yn}" width="${bw}" height="${Math.max(1,yc-yn)}" rx="2" fill="#9BD1C4"/>`:''}
    <rect class="hitb" x="${cx(i)-iw/bs.length/2}" y="${T}" width="${iw/bs.length}" height="${ih}" fill="transparent" data-b="${i}"/>`}).join('');
  el.innerHTML=`<svg viewBox="0 0 ${W} ${Hh}">${g}${bars}</svg><div class="tip" id="stip"></div>`;
  const tip=el.querySelector('#stip');
  el.querySelectorAll('.hitb').forEach(h=>{h.addEventListener('mousemove',()=>{const b=bs[+h.dataset.b],[c,n]=val(b);
    tip.innerHTML=`<b>${gmv?rp(c+n):(c+n)+' orders'}</b><span>${bLabel(b)}${b.step>1?` – ${new Date(b.d1-864e5).getDate()} ${MON[new Date(b.d1-864e5).getMonth()]}`:''} · COD ${gmv?compact(c):c} · non-COD ${gmv?compact(n):n}</span>`;
    tip.style.display='block';tip.style.left=Math.max(80,Math.min(W-80,cx(+h.dataset.b)))+'px';tip.style.top=Y(c+n)+'px'});
    h.addEventListener('mouseleave',()=>tip.style.display='none')})}
addEventListener('resize',()=>{if(!document.getElementById('view-home').hidden&&PS.hTab==='shipping')drawShipChart()});
document.addEventListener('click',e=>{const t=e.target.closest('[data-htab]');if(!t)return;PS.hTab=t.dataset.htab;renderHomeChart()});

/* --- Shipments page: pay-later explainer, list + direct export (R6, R8, R9) --- */
const HOWSTEPS=[['wh','Add your pickup address','One or more warehouses. Couriers collect from there.'],['sheet','Add your orders','Type them in, or upload the order file you already have. COD and non-COD in one go.'],
  ['truck','Pick a courier and a pickup slot','Compare discounted prices, coverage and delivery rates, then book the pickup.'],['coins','Track it and get paid','Follow every parcel. COD money lands in your FLIK balance after delivery.']];
function renderShp(){
  const el=document.getElementById('view-shp');
  if(!SH.length){track('explainer_viewed',{page:'shipments'});
    el.innerHTML=`<h1>Shipments</h1>${vBanner()}
    <section class="es-hero"><div class="es-copy"><span class="es-kick">FLIK Shipping</span><h2>Ship now, pay after delivery</h2><p>Create a COD shipment without paying anything up front. The courier collects the money from your shopper, FLIK takes the shipping fee and the COD fee out of it, and the rest goes to your FLIK balance. If a parcel comes back, you only pay the shipping fee there and back.</p><button class="btn btn-p es-cta" data-newshp data-excta>Create shipment</button><button class="es-link" data-howto>How FLIK Shipping works</button></div><div class="es-art" aria-hidden="true">${ART_SHP}</div></section>
    <div class="es-cards c3">
      <section class="es-card"><span class="qic">${ic('route',20,1.6)}</span><h3>Every courier, one dashboard</h3><p>JNE, J&amp;T, SPX, Ninja Xpress, Lion Parcel, SiCepat and AnterAja. Compare price, coverage and delivery rate, book the pickup and track every parcel here.</p></section>
      <section class="es-card"><span class="qic">${ic('percent',20,1.6)}</span><h3>Up to 40% off shipping</h3><p>FLIK's rates on every courier, shown next to the normal price before you choose. No minimum volume.</p></section>
      <section class="es-card"><span class="qic">${ic('coins',20,1.6)}</span><h3>COD with nothing up front</h3><p>FLIK charges a 3% COD fee on the amount the courier collects. It is deducted together with the shipping fee when the parcel is delivered, not before.</p></section></div>
    <section class="how"><h2 class="sec" style="margin-top:0">How it works</h2><div class="how-g">${HOWSTEPS.map((s,i)=>`<div class="how-s"><span class="n">${i+1}</span><span class="qic">${ic(s[0],19,1.6)}</span><b>${s[1]}</b><span>${s[2]}</span></div>`).join('')}</div></section>
    ${ckHtml('shipments','shipping')}`;return}
  const c=naCounts();
  let rows=SH.filter(s=>inRange(s)&&tabMatch(s,PG.tab));
  if(PG.tab==='na'){if(PG.prob)rows=rows.filter(s=>probOf(s)===PG.prob);rows.sort((a,b)=>PORDER.indexOf(probOf(a))-PORDER.indexOf(probOf(b))||a.upd-b.upd)}
  const pages=Math.max(1,Math.ceil(rows.length/PER2));PG.page=Math.min(PG.page,pages-1);const view=rows.slice(PG.page*PER2,PG.page*PER2+PER2);
  const na=PG.tab==='na';
  el.innerHTML=`<div class="ph"><h1>Shipments</h1><div class="ph-acts"><button class="btn btn-o" data-shpexport>${ic('export',15)}Export</button><button class="btn btn-p" data-newshp>${ic('plus',15,2)}Create shipment</button></div></div>
  ${vBanner()}
  ${!na&&c.total?`<div class="na-strip">${ic('warn',20)}<div class="tx"><b>${c.total} shipments need action</b><span>Each one comes with a suggested next step.</span></div><div class="na-sev">${['Critical','High','Medium'].filter(s=>c.sev[s]).map(s=>`<span class="st ${SEVC[s]}">${c.sev[s]} ${s}</span>`).join('')}</div><button class="btn btn-o" data-stb2="na">Review</button></div>`:''}
  <div class="tabs" role="tablist">${STABS2.map(t=>`<button class="tab${PG.tab===t[0]?' on':''}" data-stb2="${t[0]}">${t[1]}${t[0]==='na'&&c.total?`<span class="badge">${c.total}</span>`:''}</button>`).join('')}</div>
  <div class="filters"><button class="chip set" id="drchip"><span>Created</span> <span class="val">Last ${PS.dr} days</span>${ic('chev',14,2)}</button>
    ${na?`<button class="chip${!PG.prob?' on':''}" data-prob="">All problems <span class="ct">${c.total}</span></button>${PORDER.filter(p=>c.p[p]).map(p=>`<button class="chip${PG.prob===p?' on':''}" data-prob="${p}">${PROB[p].l} <span class="ct">${c.p[p]}</span></button>`).join('')}`
      :`<button class="chip" data-toast="Filter by courier">${ic('pluscirc')}Courier</button><button class="chip" data-toast="Filter by payment type">${ic('pluscirc')}COD / Non-COD</button><button class="chip" data-toast="Filter by warehouse">${ic('pluscirc')}Warehouse</button>`}
    ${na?`<div class="fright"><button class="btn btn-o" data-alertset>${ic('mail',15)}Alert settings</button></div>`:''}</div>
  <div class="tbl-wrap"><table><thead><tr>${na?'<th>Problem</th><th>Tracking number</th><th>Customer</th><th>Courier</th><th>Last update</th><th>COD value</th><th>Suggested next step</th><th></th>'
    :'<th>Shipping cost</th><th></th><th>Tracking number</th><th>Customer</th><th>Courier</th><th>Payment</th><th>Last update</th><th>Created</th>'}</tr></thead><tbody>
  ${view.length?view.map(s=>{const p=probOf(s);return na?`<tr data-sid="${s.id}"><td>${sevPill(PROB[p].sev,1)}<div style="margin-top:4px;font-weight:500;color:var(--ink)">${PROB[p].l}</div></td><td class="mono">${s.awb||'—'}</td><td class="cust"><b>${esc(s.name)}</b><span>${esc(s.area.city)}</span></td><td><div class="sx-cl">${cLogo(s.svc[0])}<span>${cName(s.svc[0])}</span></div></td><td class="upd${(NOW-s.upd)>=2*DAY?' stale':''}">${ago(s.upd)}</td><td class="num">${s.cod?rp(s.codv):'<span class="inv-sub">Non-COD</span>'}</td><td class="nx">${PROB[p].next}</td><td><button class="btn btn-o" data-act="${s.id}">${PROB[p].act}</button></td></tr>`
    :`<tr data-sid="${s.id}"><td class="amt num">${rp(s.cost)}</td><td class="c-st">${sPill2(s.st)}${p?` ${sevPill(PROB[p].sev,1)}`:''}</td><td class="mono">${s.awb||'<span class="inv-sub">After pickup</span>'}</td><td class="cust"><b>${esc(s.name)}</b><span>${esc(s.area.city)}</span></td><td><div class="sx-cl">${cLogo(s.svc[0])}<span>${cName(s.svc[0])} · ${s.svc[1]}</span></div></td><td>${s.cod?`<span class="st pu sm">COD</span> <span class="num">${rp(s.codv)}</span>`:'<span class="st gr sm">Non-COD</span>'}</td><td class="upd">${ago(s.upd)}</td><td class="date">${fdate(s.created)}</td></tr>`}).join('')
    :`<tr><td colspan="8" style="height:auto;border:0;cursor:default"><div class="empty"><b>${na?'Nothing needs action':'No shipments'}</b>${na?'Problems with your shipments in this period show up here.':'No shipments match this view.'}</div></td></tr>`}
  </tbody></table></div>
  <div class="foot"><span><b>${rows.length}</b> ${rows.length===1?'shipment':'shipments'} · last ${PS.dr} days</span><div class="pager"><button class="btn btn-o" data-pg="-1" ${PG.page?'':'disabled'}>Previous</button><button class="btn btn-o" data-pg="1" ${PG.page<pages-1?'':'disabled'}>Next</button></div></div>
  <p class="ana-link">Delivery and return rates, courier comparison and the full shipping report are in <button class="lnk" data-goana>Analytics › Shipping</button>.</p>`;
  if(na)track('needs_action_opened',{problem:PG.prob||'all',count:PG.prob?c.p[PG.prob]:c.total,date_range_days:PS.dr})}
document.addEventListener('click',e=>{
  if(e.target.closest('[data-goana]')){location.hash='analytics/shipping';return}
  if(e.target.closest('[data-howto]')){howModal();return}
  if(e.target.closest('[data-shpexport]')){exportModal();return}
  if(e.target.closest('[data-dltpl]')){track('template_downloaded',{});toast('Template_FLIK_Shipping.xlsx downloaded to this device')}});
function howModal(){modal.classList.add('lg');
  modal.innerHTML=`<div class="mh"><h3>How FLIK Shipping works</h3><button class="ib" data-mclose aria-label="Close">${ic('x',18)}</button></div>
  <div class="mb"><div class="how-g">${HOWSTEPS.map((s,i)=>`<div class="how-s"><span class="n">${i+1}</span><span class="qic">${ic(s[0],19,1.6)}</span><b>${s[1]}</b><span>${s[2]}</span></div>`).join('')}</div>
  <table class="sevt" style="margin-top:18px"><thead><tr><th>Payment</th><th>Paid up front</th><th>Deducted on delivery</th><th>If it comes back</th></tr></thead><tbody>
  <tr><td><span class="st pu sm">COD</span></td><td>Nothing</td><td>Shipping fee + 3% COD fee</td><td>Shipping fee there and back, no COD fee</td></tr>
  <tr><td><span class="st gr sm">Non-COD</span></td><td>Shipping fee, from your FLIK balance</td><td>Nothing</td><td>Return shipping fee</td></tr></tbody></table>
  <p class="em-note">Example fees for the prototype. The FLIK team confirms the final numbers.</p></div>
  <div class="mf"><button class="btn btn-p" data-mclose>Got it</button></div>`;mscrim.classList.add('open');track('explainer_howto_opened',{page:'shipments'})}
/* Export: straight to the merchant's device (R8) */
function exportModal(){let dr=PS.dr;
  const n=()=>SH.filter(s=>s.created>=new Date(NOW-dr*DAY)).length;
  const draw=()=>{modal.innerHTML=`<div class="mh"><h3>Export shipments</h3><button class="ib" data-mclose aria-label="Close">${ic('x',18)}</button></div>
    <div class="mb"><div class="fld"><label>Created</label><div class="seg">${[7,30,90,365].map(x=>`<button class="${dr===x?'on':''}" data-r="${x}">${x===365?'Last 12 months':'Last '+x+' days'}</button>`).join('')}</div></div>
    <p class="vf-lead">${n()} shipments. The Excel file downloads straight to this device, with the columns you see in the table.</p></div>
    <div class="mf"><button class="btn btn-o" data-mclose>Cancel</button><button class="btn btn-p" id="exgo">${ic('export',15)}Download</button></div>`;
    modal.querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>{dr=+b.dataset.r;draw()});
    document.getElementById('exgo').onclick=()=>{track('shipments_exported',{date_range_days:dr,rows:n()});closeModal();toast(`flik-shipments-${fday(NOW).replace(/ /g,'-')}.xlsx downloaded to this device`)}};
  draw();mscrim.classList.add('open')}

/* --- Analytics › Shipping (R9): rates, couriers and the full report --- */
function renderAna(el){
  if(!SH.length){el.innerHTML=`<h1>Analytics · Shipping</h1>`+lite('chart','Shipping analytics start with your first parcel','Delivered and return rates, courier comparison and the full shipping report show up here once you ship.','<button class="btn btn-p" data-newshp>Create shipment</button>')+ckHtml('analytics','shipping');return}
  const days=PS.dr,from=new Date(NOW-days*DAY),rows=SH.filter(s=>s.created>=from);
  const pct=(a,b)=>b?Math.round(a/b*100):0;
  const del=rows.filter(s=>s.st==='delivered'||s.st==='credited').length,ret=rows.filter(s=>s.st==='returned'||s.st==='returning').length;
  const cod=rows.filter(s=>s.cod),gmv=rows.reduce((a,s)=>a+(s.cod?s.codv:Math.round(s.cost*8.5)),0);
  const byC={};rows.forEach(s=>{const k=s.svc[0];byC[k]=byC[k]||{n:0,del:0,ret:0,cost:0,kg:0};const b=byC[k];b.n++;b.cost+=s.cost;b.kg+=s.kg;if(s.st==='delivered'||s.st==='credited')b.del++;if(s.st==='returned'||s.st==='returning')b.ret++});
  const kpi=(l,v,s)=>`<div class="an-k"><span class="kpi-l">${l}</span><b class="num">${v}</b>${s?`<span class="an-s">${s}</span>`:''}</div>`;
  el.innerHTML=`<div class="ph"><h1>Analytics · Shipping</h1><div class="ph-acts"><button class="chip set" id="anr"><span>Created</span> <span class="val">Last ${days} days</span>${ic('chev',14,2)}</button><button class="btn btn-p" data-report>${ic('export',15)}Download report</button></div></div>
  <div class="an-kpis">${kpi('Shipment orders',rows.length.toLocaleString('id-ID'),`${cod.length} COD · ${rows.length-cod.length} non-COD`)}${kpi('GMV shipped',rp(gmv),'Value the couriers carried')}${kpi('Delivered rate',pct(del,rows.length)+'%',`${del} of ${rows.length} delivered, the rest still moving`)}${kpi('Return rate',pct(ret,rows.length)+'%',`${ret} parcels came back`)}</div>
  <h2 class="sec">Courier performance</h2>
  <div class="tbl-wrap"><table><thead><tr><th>Courier</th><th class="num">Shipments</th><th class="num">Delivered</th><th class="num">Returned</th><th class="num">Avg. cost / kg</th><th>Delivery rate, last 90 days</th></tr></thead><tbody>
  ${Object.keys(byC).sort((a,b)=>byC[b].n-byC[a].n).map(k=>{const b=byC[k];return`<tr><td><div class="sx-cl">${cLogo(k)}<span>${cName(k)}</span></div></td><td class="num">${b.n}</td><td class="num">${pct(b.del,b.n)}%</td><td class="num">${pct(b.ret,b.n)}%</td><td class="num">${rp(Math.round(b.cost/Math.max(1,b.kg)))}</td><td><div class="an-bar"><i style="width:${DRATE[k]||90}%"></i></div><span class="an-s">${DRATE[k]||90}% of parcels delivered first time</span></td></tr>`}).join('')}
  </tbody></table></div>
  <p class="ana-link">The report has one row per shipment and ${RCOLS.length} columns, including proof of delivery, failure reasons and COD settlement.</p>`;
  document.getElementById('anr').onclick=e=>{e.stopPropagation();const b=e.currentTarget;if(popFor===b){closePop();return}popFor=b;
    pop.innerHTML=`<h6>Created</h6>${[7,30,90,365].map(nn=>`<button class="opt" data-n="${nn}"><span class="rdo${PS.dr===nn?' on':''}"></span>${nn===365?'Last 12 months':'Last '+nn+' days'}</button>`).join('')}`;
    pop.querySelectorAll('[data-n]').forEach(o=>o.onclick=()=>{PS.dr=+o.dataset.n;closePop();renderSub('ana')});placePop(b,true)};
  track('analytics_shipping_opened',{date_range_days:days})}

/* --- Tracking, Warehouse, Red Zone (R6) --- */
document.getElementById('view-tx').insertAdjacentHTML('beforebegin','<main class="content" id="view-trk" hidden></main><main class="content" id="view-whs" hidden></main><main class="content" id="view-rz" hidden></main><main class="content" id="view-ana" hidden></main>');
Object.assign(VIEWS,{trk:['shipping/tracking','Tracking'],whs:['shipping/warehouse','Warehouse'],rz:['shipping/red-zone','Red Zone'],ana:['analytics/shipping','Analytics · Shipping']});
const lite=(icn,h,p,btn)=>`<section class="lite"><span class="qic">${ic(icn,22,1.6)}</span><div class="tx"><h2>${h}</h2><p>${p}</p></div>${btn}</section>`;
const SVCKIND=sv=>{const g=sv[2];return g==='exp'?(/Sameday|Same day/i.test(sv[1])?'Sameday':'Next day'):g==='cargo'?'Cargo':'Regular'};
function trkCard(s,awb){if(!s)return`<div class="trk-c miss"><b class="mono">${esc(awb)}</b><p class="vf-lead">Not found in your shipments. Check the number, or track it on the courier's own site.</p></div>`;
  const p=probOf(s);
  return`<div class="trk-c" data-open="${s.id}"><div class="trk-h"><div class="sx-cl">${cLogo(s.svc[0])}<span>${cName(s.svc[0])} · ${s.svc[1]}</span></div>${sPill2(s.st)}</div>
  <b class="mono">${s.awb}</b>
  <div class="trk-tags"><span class="st gr sm">${SVCKIND(s.svc)}</span><span class="st ${s.cod?'pu':'gr'} sm">${s.cod?'COD '+rp(s.codv):'Non-COD'}</span></div>
  <p class="trk-p">${esc(s.items)}</p>
  <p class="vf-lead">${esc(s.name)}, ${esc(s.area.city)} · updated ${ago(s.upd).toLowerCase()}</p>
  ${p?`<p class="trk-prob">${sevPill(PROB[p].sev,1)} ${PROB[p].l}</p>`:(s.st==='delivered'||s.st==='credited')?`<p class="trk-pod">${ic('check',14,2.4)}Proof of delivery available</p>`:''}</div>`}
function renderTrk(el){
  if(!SH.some(s=>s.awb)){el.innerHTML=`<h1>Tracking</h1>`+lite('track','Track every parcel here','Paste up to 10 tracking numbers at once and see where each parcel is, with proof of delivery once it arrives.','<button class="btn btn-p" data-newshp>Create shipment</button>')+ckHtml('tracking','shipping');return}
  const have=SH.filter(s=>s.awb).slice(0,3).map(s=>s.awb);
  el.innerHTML=`<h1>Tracking</h1><p class="vf-lead" style="margin:8px 0 16px">Track up to 10 tracking numbers at once. Separate them with a comma, a space or a new line.</p>
  <div class="trk-f"><textarea id="trkq" rows="2" placeholder="SPXID0123456789, JP1234567890">${have.join(', ')}</textarea><button class="btn btn-p" id="trkgo">${ic('search',15)}Track</button></div>
  <p class="bk-hint" id="trkn">${have.length} of 10 tracking numbers</p><div id="trkres"></div>`;
  const q=document.getElementById('trkq'),out=document.getElementById('trkres');
  const parse=()=>q.value.split(/[,\s]+/).filter(Boolean);
  q.oninput=()=>{const n=parse().length;document.getElementById('trkn').innerHTML=`${n} of 10 tracking numbers${n>10?' · only the first 10 are tracked':''}`};
  document.getElementById('trkgo').onclick=()=>{const list=parse().slice(0,10);
    track('tracking_searched',{count:list.length,found:list.filter(a=>SH.some(s=>s.awb===a)).length});
    out.innerHTML=`<div class="trk-g">${list.map(a=>trkCard(SH.find(s=>s.awb===a),a)).join('')}</div>`;
    out.querySelectorAll('[data-open]').forEach(x=>x.onclick=()=>openShipment(x.dataset.open))};
  document.getElementById('trkgo').click()}
function renderRz(el){const A=RZAREAS;
  el.innerHTML=`<div class="ph"><h1>Red Zone</h1></div>
  <p class="vf-lead" style="margin:0 0 16px;max-width:760px">Check an area before you ship to it. A red zone is an area where a courier accepts the parcel but delivery or COD collection often fails, so FLIK blocks it. The same check runs on every row when you create a shipment.</p>
  <div class="rz-f"><label class="search rz-s"><span>${ic('search')}</span><input id="rzq" placeholder="Postcode, kelurahan or kecamatan" autocomplete="off"></label><button class="btn btn-p" id="rzgo">Check area</button></div>
  <div id="rzsug" class="rz-sug" hidden></div><div id="rzres"></div>`;
  const q=document.getElementById('rzq'),sug=document.getElementById('rzsug');let cur=null;
  const show=()=>{const v=q.value.trim().toLowerCase();if(!v){sug.hidden=true;return}
    const hits=A.filter(a=>(a.zip+' '+a.kel+' '+a.kec+' '+a.city).toLowerCase().includes(v)).slice(0,6);
    sug.hidden=!hits.length;sug.innerHTML=hits.map((a,i)=>`<button class="opt" data-a="${A.indexOf(a)}"><b>${a.zip}</b> – ${a.kel}, ${a.kec}, ${a.city}, ${a.prov}</button>`).join('');
    sug.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{cur=A[+b.dataset.a];q.value=`${cur.zip} – ${cur.kel}, ${cur.kec}, ${cur.city}`;sug.hidden=true;run()})};
  q.oninput=show;
  const run=()=>{const a=cur||A.find(x=>q.value.includes(x.zip))||A[0];cur=a;
    const res=CHK.map(c=>({c,st:covOf(a.zip,c.k),okCod:canTake(a.zip,'cod',c.k),okNon:canTake(a.zip,'non',c.k)}));
    res.sort((x,y)=>(y.okCod+y.okNon)-(x.okCod+x.okNon)||x.c.n.localeCompare(y.c.n));
    const nn=res.filter(r=>r.okNon).length,nc=res.filter(r=>r.okCod).length,nz=res.filter(r=>r.st==='rzcod'||r.st==='rz').length;
    track('red_zone_checked',{postcode:a.zip,couriers_total:res.length,couriers_delivering:nn,couriers_cod:nc});
    document.getElementById('rzres').innerHTML=`<div class="rz-sum"><b>${nn} of ${res.length} couriers deliver to ${a.zip}, ${nc} of them with COD</b><span>${nz?`${nz} ${nz===1?'courier has':'couriers have'} this area in their red zone. `:''}${a.kel}, ${a.kec}, ${a.city}, ${a.prov}</span></div>
    <div class="rz-grid">${res.map(r=>`<div class="rz-c${r.okNon?'':' off'}">${cLogo(r.c.k)}<b>${r.c.n}</b><div class="rz-p"><span class="st ${r.okNon?'ok':'bad'} sm">Non-COD: ${r.okNon?'Delivers':r.st==='no'?'No coverage':'Red zone'}</span><span class="st ${r.okCod?'ok':'bad'} sm">COD: ${r.okCod?'Delivers':r.st==='no'?'No coverage':'Red zone'}</span></div></div>`).join('')}</div>
    <p class="em-note">Example coverage for the prototype. In production this comes from each courier's coverage and red zone API, refreshed daily.</p>`};
  document.getElementById('rzgo').onclick=run;
  q.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();run()}};
  run()}
const RZAREAS=[...AREAS,{kec:'Cisauk',kel:'Cisauk',city:'Kabupaten Tangerang',prov:'Banten',zip:'15341'},{kec:'Mampang Prapatan',kel:'Bangka',city:'Jakarta Selatan',prov:'DKI Jakarta',zip:'12730'},
  {kec:'Dukuh Pakis',kel:'Pradahkalikendal',city:'Kota Surabaya',prov:'Jawa Timur',zip:'60226'},{kec:'Banjarmasin Tengah',kel:'Kertak Baru',city:'Kota Banjarmasin',prov:'Kalimantan Selatan',zip:'70111'},
  {kec:'Sorong',kel:'Klaligi',city:'Kota Sorong',prov:'Papua Barat',zip:'98411'},{kec:'Cibeunying Kidul',kel:'Sukapada',city:'Kota Bandung',prov:'Jawa Barat',zip:'40125'}];
function renderSub(v){const el=document.getElementById('view-'+v);
  if(v==='trk')renderTrk(el);
  if(v==='ana')renderAna(el);
  if(v==='whs')el.innerHTML=`<div class="ph"><h1>Warehouse</h1>${WAREHOUSES.length?`<button class="btn btn-p" data-addwh2>${ic('plus',15,2)}Add address</button>`:''}</div>`+(WAREHOUSES.length?`<p class="vf-lead" style="margin:0 0 14px">Couriers collect from these addresses. In a bulk upload you choose the pickup address per row, and FLIK books one pickup per address.</p><div class="wh-list">${WAREHOUSES.map(w=>`<div class="sx-card sx-whc"><span class="ic">${ic('wh',18)}</span><div><b>${w.n}</b><span>${w.a}</span></div><button class="btn btn-o" data-toast="Opens edit address">Edit</button></div>`).join('')}</div>`
    :lite('wh','Add where couriers pick up','Add one or more pickup addresses so every shipment knows where it starts. You can ship from several warehouses in the same batch.','<button class="btn btn-p" data-addwh2>Add address</button>')+ckHtml('warehouse','shipping'));
  if(v==='rz')renderRz(el);
  el.querySelectorAll('[data-addwh2]').forEach(b=>b.onclick=()=>addWhModal())}

/* --- Create shipment: payment method per row, several warehouses, coverage, batch split --- */
SERVICES.forEach(v=>{if(v[6])v[6]=null});   // Raam's static tags are replaced by the ones below
const shipPay=s=>s.pay||'cod';
const whIx=v=>Math.max(0,Math.min(+v||0,WAREHOUSES.length-1));
const shipWh=s=>whIx(s.wh);
const svcFor=i=>X.svcMap&&X.svcMap[i]!=null?X.svcMap[i]:X.svc;
function shipOk2(s){return s.phone.replace(/\D/g,'').length>=9&&s.name.trim()&&!!s.addr&&+s.kg>0&&!!s.items.trim()&&(shipPay(s)!=='cod'||codVal(s)>0)}
function step0Ok(){if(X.how!=='bulk')return!!X.ships.length&&X.ships.every(shipOk2);
  const B=X.bk;if(!B||B.stage!=='rows')return false;const t=bkTotals();return!t.err&&!t.sug&&B.rows.some(r=>!r.removed)}
function stepOk(){if(X.step===0)return!!WAREHOUSES.length&&step0Ok();if(X.step===1)return X.svc!=null;if(X.step===2)return X.day!=null&&X.slot!=null;if(X.step===4)return BAL>=costs().payNow;return true}
function costs(){const rate=PAYOUT.find(p=>p[0]===X.payout)[2];
  let ship=0,list=0,codShip=0,nonShip=0,codTot=0;
  X.ships.forEach((s,i)=>{const si=svcFor(i);if(si==null)return;const sv=SERVICES[si],kg=kgOf(s),p=sv[4]*kg;
    ship+=p;list+=(sv[5]||sv[4])*kg;
    if(shipPay(s)==='cod'){codShip+=p;codTot+=codVal(s)}else nonShip+=p});
  const codFee=Math.round(codTot*rate);
  const payNow=nonShip+PLATFORM,atDel=codShip+codFee;
  return{ship,list,save:list-ship,codShip,nonShip,codTot,codFee,platform:PLATFORM,payNow,atDel,total:payNow}}
/* one pickup per courier and warehouse */
function batches(){const m={};X.ships.forEach((s,i)=>{const si=svcFor(i);const k=si+'|'+shipWh(s);(m[k]=m[k]||{svc:si,wh:shipWh(s),ix:[]}).ix.push(i)});return Object.values(m)}
const svcName=i=>`${cName(SERVICES[i][0])} ${SERVICES[i][1]}`;

function pickupCard(){const whs=[...new Set(X.ships.map(shipWh))];
  const w=WAREHOUSES[X.wh]||WAREHOUSES[0];
  if(!WAREHOUSES.length)return`<section><div class="sx-h">Pickup from</div><div class="sx-card sx-whc"><span class="ic">${ic('wh',18)}</span><div><b>Add a pickup address</b><span>Couriers pick up your parcels from here.</span></div><button class="btn btn-p" data-addwh>Add address</button></div></section>`;
  return`<section><div class="sx-h">Pickup from</div>
  <div class="sx-card sx-whc"><span class="ic">${ic('wh',18)}</span><div><b>${w.n}</b><span>${w.a}</span></div><button class="btn btn-o" data-wh>Change</button></div>
  <div class="sx-note">${ic('route',16)}<div><b>You can ship from several warehouses at once</b><span>${X.how==='bulk'?`Set <b style="font-weight:500">Pickup from</b> per row in the table below. FLIK books one pickup per address.${whs.length>1?` This upload uses ${whs.length} addresses.`:''}`:'Each shipment has its own <b style="font-weight:500">Pickup from</b>, so one batch can leave from more than one warehouse.'}</span></div></div></section>`}
function payNote(){return`<section><div class="sx-h">Payment</div>
  <div class="sx-note">${ic('coins',16)}<div><b>COD and non-COD in the same batch</b><span>Payment method is set per shipment, so you upload or enter your orders once. Non-COD shipping is paid from your FLIK balance now; for COD, the shipping fee and the ${PAYOUT.find(p=>p[0]===X.payout)[2]*100}% COD fee are deducted from what the courier collects, after delivery.</span></div></div>
  <select class="sx-sel" id="sx-payout" aria-label="COD payout">${PAYOUT.map(p=>`<option value="${p[0]}" ${X.payout===p[0]?'selected':''}>${p[1]}</option>`).join('')}</select></section>`}
function shipCard(s,i){const ok=shipOk2(s),cod=shipPay(s)==='cod';
  return`<div class="sx-ship${s.open?' open':''}"><button class="sx-sh" data-tog="${i}"><b>Shipment ${i+1}</b>${ok?`<span class="ok">${ic('check',15,2.4)}</span>`:''}<span class="sum">${!s.open&&s.name?`${s.name}${s.addr?' · '+s.addr.city:''} · ${cod?'COD':'Non-COD'}`:''}</span><span class="chev">${ic('chev',16)}</span></button>
  <div class="sx-sb"><div class="sx-g sx-g2">${inp(i,'phone','Customer WhatsApp','812-3456-7890',{pre:'+62',num:1})}${inp(i,'name','Customer name','Full name')}</div>
  <div class="sx-g"><div class="sx-f"><label>Customer address</label><button class="sx-addr${s.addr?' set':''}" data-addr="${i}">${s.addr?`${s.addr.street}, ${s.addr.city} ${s.addr.zip}`:'Set customer address'}<span class="chev">${ic('chev',16)}</span></button></div></div>
  <div class="sx-g sx-g2"><div class="sx-f"><label for="sp${i}">Payment method</label><select id="sp${i}" class="sx-sel" data-sp="${i}"><option value="cod" ${cod?'selected':''}>COD, the courier collects</option><option value="non" ${cod?'':'selected'}>Non-COD, already paid</option></select></div>
  <div class="sx-f"><label for="sw${i}">Pickup from</label><select id="sw${i}" class="sx-sel" data-sw="${i}">${WAREHOUSES.map((w,k)=>`<option value="${k}" ${shipWh(s)===k?'selected':''}>${w.n}</option>`).join('')}</select></div></div>
  <div class="sx-g sx-g4">${inp(i,'l','Length','0',{unit:'cm',num:1})}${inp(i,'w','Width','0',{unit:'cm',num:1})}${inp(i,'h','Height','0',{unit:'cm',num:1})}${inp(i,'kg','Weight','0',{unit:'kg',num:1})}</div>
  <div class="sx-g sx-g2">${inp(i,'items','Package contents','e.g. 3 pyjamas, 5 swimsuits')}${inp(i,'cod',cod?'COD amount':'Item value','0',{pre:'Rp',num:1})}</div>
  ${s.addr&&covNote({zip:s.addr.zip,pay:shipPay(s)})?`<p class="sx-cov">${ic('warn',14)}${covNote({zip:s.addr.zip,pay:shipPay(s)}).m}</p>`:''}
  ${X.ships.length>1?`<div class="sx-row" style="margin-top:14px;justify-content:flex-end"><button class="btn btn-d" data-del="${i}">${ic('trash',15)}Remove</button></div>`:''}</div></div>`}
sxBody.addEventListener('change',e=>{const t=e.target;
  if(t.dataset.sp!=null){X.ships[+t.dataset.sp].pay=t.value;X.svcMap=null;X.splitOk=false;drawSx()}
  if(t.dataset.sw!=null){X.ships[+t.dataset.sw].wh=+t.value;drawSx()}});

/* Courier step: coverage, cheapest, your favourite, delivery rate */
function courierStep(){const fav=PS.mode==='active'?favCourier():null,n=X.ships.length;
  const totals={};SERVICES.forEach((v,i)=>{if(BOOKABLE.includes(v[0]))totals[i]=X.ships.reduce((a,s)=>a+v[4]*kgOf(s),0)});
  const cheapest=Object.keys(totals).sort((a,b)=>totals[a]-totals[b])[0];
  return`<h2>Choose a courier</h2><p class="sx-lead">Prices cover all ${n} ${n===1?'shipment':'shipments'} (${X.ships.reduce((a,s)=>a+kgOf(s),0)} kg in total). Coverage is checked per destination, COD included.</p>`+
  [['reg','Regular'],['exp','Express'],['cargo','Cargo']].map(g=>{
    const rows=COURIERS.map(c=>[c,SERVICES.map((v,i)=>[v,i]).filter(([v])=>v[0]===c.k&&v[2]===g[0])]).filter(r=>r[1].length);
    return`<div class="sx-grp"><h3>${g[1]}</h3>${rows.map(([c,list])=>`<div class="sx-cr"><div class="nm">${cLogo(c.k)}<span><b>${c.n}</b>${fav===c.k?'<span class="sx-tag fav">Your favourite</span>':''}<span class="cr-rate">${DRATE[c.k]||90}% delivered, last 90 days</span></span></div>
    <div class="sx-svcs">${list.map(([v,i])=>{const p=svcPrice(v),l=svcList(v),cov=svcCoverCount(i),full=cov===n;
      return`<button class="sx-svc${X.svc===i?' on':''}" data-svc="${i}">${+cheapest===i?'<span class="sx-tag ch">Cheapest</span>':''}<span class="n">${v[1]}<span class="rdo${X.svc===i?' on':''}"></span></span><span class="d">${v[3]}</span>
      <span class="cov ${full?'ok':'part'}">${full?`${ic('check',12,2.6)}Covers all ${n}`:`${ic('warn',12)}Covers ${cov} of ${n}`}</span>
      <span class="p num">${rp(p)}${l?`<s>${rp(l)}</s>`:''}</span></button>`}).join('')}</div></div>`).join('')}</div>`}).join('')}
/* Uncovered rows: send them with the cheapest courier that does cover them, or drop them */
function splitPlan(){const group=SERVICES[X.svc][2],plan={},drop=[];
  X.ships.forEach((s,i)=>{if(svcCovers(X.svc,s))return;const alt=cheapestFor(s,group)??cheapestFor(s,'reg');
    if(alt==null)drop.push(i);else(plan[alt]=plan[alt]||[]).push(i)});
  return{plan,drop}}
function splitModal(){const {plan,drop}=splitPlan(),bad=Object.values(plan).reduce((a,v)=>a+v.length,0)+drop.length,n=X.ships.length;
  const why=s=>{const k=SERVICES[X.svc][0],c=covOf(shipZip(s),k);return c==='no'?'No coverage':c==='rz'?'Red zone':'Red zone for COD'};
  const line=(i,alt)=>{const s=X.ships[i];return`<tr><td><b>${esc(s.name)}</b><div class="inv-sub">${esc((s.addr&&s.addr.city)||s.area.city)} ${shipZip(s)}</div></td><td><span class="st bad sm">${why(s)}</span></td><td>${shipPay(s)==='cod'?'<span class="st pu sm">COD</span>':'<span class="st gr sm">Non-COD</span>'}</td><td>${alt==null?'<span class="inv-sub">No courier covers it</span>':`<div class="sx-cl">${cLogo(SERVICES[alt][0])}<span>${svcName(alt)} · ${rp(SERVICES[alt][4]*kgOf(s))}</span></div>`}</td></tr>`};
  const nb=Object.keys(plan).length+1;
  track('coverage_block_shown',{courier:SERVICES[X.svc][0],rows_total:n,rows_blocked:bad,batches_suggested:nb});
  modal.classList.add('lg');
  modal.innerHTML=`<div class="mh"><h3>${bad} of ${n} shipments can't go with ${svcName(X.svc)}</h3><button class="ib" data-mclose aria-label="Close">${ic('x',18)}</button></div>
  <div class="mb"><p class="vf-lead">The other ${n-bad} stay with ${svcName(X.svc)}. For these, FLIK picks the cheapest courier that does deliver there, so each parcel still goes out at the lowest price. That makes ${nb} ${nb===1?'batch':'batches'}, one pickup per courier and address.</p>
  <div class="tbl-wrap" style="margin-top:0"><table class="sevt split-t"><thead><tr><th>Shipment</th><th>Why</th><th>Payment</th><th>Cheapest courier that covers it</th></tr></thead><tbody>
  ${Object.keys(plan).map(alt=>plan[alt].map(i=>line(i,+alt)).join('')).join('')}${drop.map(i=>line(i,null)).join('')}</tbody></table></div>
  ${drop.length?`<p class="em-note">${drop.length} ${drop.length===1?'shipment has':'shipments have'} no courier at all for that address. ${drop.length===1?'It is':'They are'} removed from this batch.</p>`:''}</div>
  <div class="mf split"><button class="lnk" data-spdrop>Remove ${bad} ${bad===1?'shipment':'shipments'}</button><button class="btn btn-p" data-spgo>Split into ${nb} ${nb===1?'batch':'batches'}</button></div>`;
  mscrim.classList.add('open');
  modal.querySelector('[data-spgo]').onclick=()=>{X.svcMap={};Object.keys(plan).forEach(alt=>plan[alt].forEach(i=>X.svcMap[i]=+alt));
    if(drop.length){X.ships=X.ships.filter((s,i)=>!drop.includes(i));X.svcMap=null;X.splitOk=true;closeModal();track('coverage_split_accepted',{batches:nb,removed:drop.length});toast(`${drop.length} removed, the rest split into ${nb} batches`);X.step=1;drawSx();document.getElementById('sx-next').click();return}
    X.splitOk=true;track('coverage_split_accepted',{batches:nb,removed:0});closeModal();toast(`Split into ${nb} batches`);X.step=2;drawSx();sxBody.scrollTop=0;stepHook()};
  modal.querySelector('[data-spdrop]').onclick=()=>{const keep=X.ships.filter(s=>svcCovers(X.svc,s));
    track('coverage_rows_removed',{removed:X.ships.length-keep.length});X.ships=keep;X.svcMap=null;X.splitOk=true;closeModal();
    if(X.bk&&X.bk.rows)X.bk.rows.forEach(r=>{if(!canTake(r.zip,r.pay,SERVICES[X.svc][0]))r.removed=true});
    toast(`${bad} removed from this batch`);X.step=2;drawSx();sxBody.scrollTop=0}}
function sxNext(){
  if(X.step===0){if(X.how==='bulk')bulkToShips();X.step=1;X.svcMap=null;X.splitOk=false;drawSx();sxBody.scrollTop=0;stepHook();return true}
  if(X.step===1){if(X.ships.some(s=>!svcCovers(X.svc,s))&&!X.splitOk){splitModal();return true}
    X.step=2;drawSx();sxBody.scrollTop=0;stepHook();return true}
  if(X.step<4){X.step++;drawSx();sxBody.scrollTop=0;stepHook();return true}
  if(!PS.verified){verifyGate('create_shipment',()=>document.getElementById('sx-next').click());return true}
  return false}

function drawSx(){const st=X.step;
  document.getElementById('sx-steps').innerHTML=X.done?'':SSTEPS.map((t,i)=>`${i?'<span class="stp-l"></span>':''}<span class="stp${i===st?' on':i<st?' done':''}"><i>${i<st?ic('check',11,3):i+1}</i><span>${t}</span></span>`).join('');
  if(X.done){sxFoot.hidden=true;sxBody.innerHTML=doneHtml();return}
  sxFoot.hidden=false;let main='';
  if(st===0){main=`<h2>Shipment details</h2><p class="sx-lead">Where it ships from, who receives it, and how each shopper pays.</p>
    ${pickupCard()}
    <section><div class="sx-h">Add shipments</div><div class="sx-opts">
      <button class="sx-opt${X.how==='manual'?' on':''}" data-how="manual"><span class="ic">${ic('pkg',18)}</span><div><b>Manual entry</b><span>Fill in each shipment</span></div></button>
      <button class="sx-opt${X.how==='bulk'?' on':''}" data-how="bulk"><span class="ic">${ic('sheet',18)}</span><div><b>Bulk upload</b><span>Upload many at once with a spreadsheet</span></div></button></div></section>
    ${payNote()}
    ${shipmentsSection()}`}
  else if(st===1)main=courierStep();
  else if(st===2){const bs=batches();
    main=`<h2>Schedule pickup</h2><p class="sx-lead">${bs.length===1?`${svcName(bs[0].svc)} picks up ${X.ships.length} ${X.ships.length===1?'shipment':'shipments'} from ${WAREHOUSES[bs[0].wh].n}.`:`${bs.length} pickups: one per courier and pickup address.`}</p>
    <section class="sx-card"><div class="sx-h" style="margin-bottom:4px">${ic('clock',18)}Pickup window</div>
      <div class="sx-f" style="margin-top:14px"><label>Day</label><div class="sx-slots">${DAYS.map((d,i)=>`<button class="${X.day===i?'on':''}" data-day="${i}">${i===0?'Tomorrow':DOW[d.getDay()]}, ${d.getDate()} ${MON[d.getMonth()]}</button>`).join('')}</div></div>
      <div class="sx-f" style="margin-top:18px"><label>Time</label><div class="sx-slots">${SLOTS.map((t,i)=>`<button class="${X.slot===i?'on':''}" data-slot="${i}">${t}</button>`).join('')}</div></div>
      <p class="em-note" style="margin-top:14px">Slots come from each courier's API. The courier confirms the pickup after you pay.</p></section>
    <section><div class="sx-h">Pickups in this batch</div>${bs.map(b=>`<div class="sx-card sx-whc" style="margin-bottom:10px"><span class="ic">${ic('truck',18)}</span><div><b>${svcName(b.svc)} · ${b.ix.length} ${b.ix.length===1?'parcel':'parcels'}</b><span>${WAREHOUSES[b.wh].n} · ${WAREHOUSES[b.wh].a}</span></div></div>`).join('')}</section>`}
  else if(st===3){const bs=batches();
    main=`<h2>Review shipments</h2><p class="sx-lead">Check everything before you pay.</p>
    <section><div class="sx-h">Pickup</div><div class="sx-card sx-whc"><span class="ic">${ic('clock',18)}</span><div><b>${pickupTx()}</b><span>${bs.length} ${bs.length===1?'pickup':'pickups'} · ${[...new Set(bs.map(b=>WAREHOUSES[b.wh].n))].join(', ')}</span></div><button class="btn btn-o" data-go="2">Edit</button></div></section>
    ${bs.length>1?`<section><div class="sx-h">Batches</div>${bs.map((b,k)=>`<div class="sx-card sx-whc" style="margin-bottom:10px"><span class="ic">${ic('pkg',18)}</span><div><b>Batch ${k+1}: ${svcName(b.svc)}</b><span>${b.ix.length} ${b.ix.length===1?'parcel':'parcels'} from ${WAREHOUSES[b.wh].n} · ${rp(b.ix.reduce((a,i)=>a+SERVICES[b.svc][4]*kgOf(X.ships[i]),0))}</span></div></div>`).join('')}</section>`:''}
    <section><div class="sx-h">Shipments</div>${X.ships.map((s,i)=>{const sv=SERVICES[svcFor(i)],cod=shipPay(s)==='cod';
      return`<div class="sx-card" style="margin-bottom:12px"><div class="sx-row" style="margin:0 0 14px"><b style="color:var(--ink);font-weight:600">Shipment ${i+1}</b><span class="st ${cod?'pu':'gr'} sm">${cod?'COD':'Non-COD'}</span><span class="sp"></span><button class="btn btn-o" data-go="0">Edit</button></div>
      <dl class="sx-dl"><div><dt>Customer</dt><dd>${esc(s.name)}</dd></div><div><dt>WhatsApp</dt><dd>+62 ${s.phone}</dd></div><div><dt>Courier</dt><dd>${svcName(svcFor(i))}</dd></div><div><dt>Shipping</dt><dd class="num">${rp(sv[4]*kgOf(s))}</dd></div>
      <div class="w2"><dt>Address</dt><dd>${esc(s.addr.street)}, ${esc(s.addr.city)} ${s.addr.zip}</dd></div><div><dt>Contents</dt><dd>${esc(s.items)}</dd></div><div><dt>Size · weight</dt><dd>${s.l||0}×${s.w||0}×${s.h||0} cm · ${s.kg} kg</dd></div>
      <div><dt>Pickup from</dt><dd>${WAREHOUSES[shipWh(s)].n}</dd></div><div><dt>${cod?'COD amount':'Item value'}</dt><dd class="num">${rp(codVal(s))}</dd></div></dl></div>`}).join('')}</section>`}
  else{const c=costs(),nCod=X.ships.filter(s=>shipPay(s)==='cod').length,nNon=X.ships.length-nCod;
    main=`<h2>Payment</h2><p class="sx-lead">Non-COD shipping is paid now from your FLIK balance. COD costs are deducted from what the courier collects, after delivery.</p>
    <div class="sx-pay"><div class="sx-bal"><span>FLIK balance</span><b class="num">${rp(BAL)}</b></div><div class="sx-due"><span>You pay now</span><b class="num">${rp(c.payNow)}</b></div></div>
    <section class="sx-card"><div class="sx-h">Pay now</div><dl class="sx-kv"><dt>Shipping for ${nNon} non-COD ${nNon===1?'shipment':'shipments'}</dt><dd class="num">${rp(c.nonShip)}</dd><dt>Platform fee</dt><dd class="num">${rp(c.platform)}</dd><dt class="t">Total now</dt><dd class="t num">${rp(c.payNow)}</dd></dl></section>
    ${nCod?`<section class="sx-card" style="margin-top:14px"><div class="sx-h">Deducted when delivered</div><dl class="sx-kv"><dt>Shipping for ${nCod} COD ${nCod===1?'shipment':'shipments'}</dt><dd class="num">${rp(c.codShip)}</dd><dt>COD fee (${PAYOUT.find(p=>p[0]===X.payout)[2]*100}% of ${rp(c.codTot)})</dt><dd class="num">${rp(c.codFee)}</dd><dt class="t">Deducted from COD</dt><dd class="t num">${rp(c.atDel)}</dd></dl>
      <p class="em-note" style="margin-top:12px">The courier collects ${rp(c.codTot)}. After delivery, ${rp(c.codTot-c.atDel)} goes to your FLIK balance. If a parcel comes back, FLIK deducts the shipping fee there and back and charges no COD fee.</p></section>`:''}
    ${c.save?`<p style="color:var(--ok-tx);margin-top:14px;font-size:13.5px;font-weight:500">You save ${rp(c.save)} against the couriers' normal prices.</p>`:''}`}
  sxBody.innerHTML=`<div class="sx-in solo${st===0&&X.how==='bulk'&&X.bk&&X.bk.stage!=='choose'?' wide':''}"><div class="sx-main">${main}</div></div>`;
  sxFoot.innerHTML=`${st?`<button class="btn btn-o" data-back>Back</button>`:''}<span class="sp"></span><button class="btn btn-p" id="sx-next" ${stepOk()?'':'disabled'}>${st===4?`Confirm and pay ${rp(costs().payNow)}`:'Continue'}</button>`}
function doneHtml(){const d=X.done,bs=batches(),cod=X.ships.filter(s=>shipPay(s)==='cod').length;
  return`<div class="sx-done"><div class="sx-ok"><i>${ic('check',18,2.6)}</i><b>${X.ships.length} ${X.ships.length===1?'shipment':'shipments'} created<span>${bs.length===1?svcName(bs[0].svc):bs.length+' batches'} · ${cod} COD, ${X.ships.length-cod} non-COD</span></b><button class="btn btn-o" data-toast="Printing shipping labels">${ic('print',15)}Print labels</button></div>
  ${bs.length>1?`<div class="sx-bl">${bs.map((b,k)=>`<div><b>Batch ${k+1} · ${svcName(b.svc)}</b><span>${b.ix.length} ${b.ix.length===1?'parcel':'parcels'} · pickup from ${WAREHOUSES[b.wh].n}</span></div>`).join('')}</div>`:''}
  <div class="sx-next"><div><span class="ic">${ic('truck',19)}</span><b>Pickup</b><span>${bs.length===1?d.courier+' picks up':'The couriers pick up'} on ${d.when}.</span></div><div><span class="ic">${ic('pkg',19)}</span><b>Pack your parcel</b><span>Pack each order and stick its label on before the courier arrives.</span></div></div>
  <div class="sx-row" style="margin-top:24px;justify-content:flex-end"><button class="btn btn-o" data-again>Create another</button><button class="btn btn-p" data-view-shp>View shipments</button></div></div>`}
document.addEventListener('click',e=>{if(e.target.closest('[data-report]')){reportModal();return}});

/* --- bootstrap --- */
setMode('new');
show(hashView());
