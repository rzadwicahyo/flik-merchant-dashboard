/* ===== Shipping › Shipment =====
 * New to Shipping: the explainer, the setup checklist and Create shipment.
 * Active shipper: goes straight to Create shipment. The sidebar stays visible on the create page.
 */
const ART_SHP=document.getElementById('es-art-shp').innerHTML;
const HOWSTEPS=[['wh','Add your pickup address','One or more warehouses. Couriers collect from there.'],['sheet','Add your orders','Type them in, or upload the order file you already have. COD and non-COD in one go.'],
  ['sparkle','FLIK picks the courier','The smart courier engine fixes your file, scores each shopper, and recommends the courier that delivers best where your parcels go.'],['coins','Track it and get paid','Monitoring flags anything that needs you. COD money lands in your FLIK balance after delivery.']];
function renderShp(){
  const el=document.getElementById('view-shp');track('explainer_viewed',{page:'shipment'});
  el.innerHTML=`<h1>Shipment</h1>
    <section class="es-hero"><div class="es-copy"><span class="es-kick">FLIK Shipping</span><h2>Ship now, pay after delivery</h2><p>Create a COD shipment without paying anything up front. The courier collects from your shopper, FLIK deducts the shipping fee and the 3% COD fee, and the rest goes to your FLIK balance. Non-COD shipping is paid from your balance when you book.</p><div class="es-ctas"><button class="btn btn-p es-cta" data-newshp>Create shipment</button><button class="btn btn-o es-cta" data-howto>How it works</button></div></div><div class="es-art" aria-hidden="true">${ART_SHP}</div></section>
    ${ckHtml('shipment')}
    <div class="es-cards c3">
      <section class="es-card"><span class="qic">${ic('sparkle',20,1.6)}</span><h3>A smart courier engine</h3><p>Upload any order file. FLIK matches your columns, fixes typos and swapped fields, and recommends the courier with the best delivery rate in each area.</p></section>
      <section class="es-card"><span class="qic">${ic('percent',20,1.6)}</span><h3>Up to 40% off shipping</h3><p>FLIK's rates on JNE, J&amp;T, SPX, Ninja Xpress, Lion Parcel, SiCepat and AnterAja, shown next to the published price. No minimum volume.</p></section>
      <section class="es-card"><span class="qic">${ic('shield',20,1.6)}</span><h3>Fewer failed COD deliveries</h3><p>Each shopper gets a score from their delivery history, and red zones are caught before you book. Monitoring tells you what needs action.</p></section></div>
    <section class="how"><h2 class="sec" style="margin-top:0">How it works</h2><div class="how-g">${HOWSTEPS.map((s,i)=>`<div class="how-s"><span class="n">${i+1}</span><span class="qic">${ic(s[0],19,1.6)}</span><b>${s[1]}</b><span>${s[2]}</span></div>`).join('')}</div></section>`}
function howModal(){modal.classList.add('lg');
  modal.innerHTML=`<div class="mh"><h3>How FLIK Shipping works</h3><button class="ib" data-mclose aria-label="Close">${ic('x',18)}</button></div>
  <div class="mb"><div class="how-g">${HOWSTEPS.map((s,i)=>`<div class="how-s"><span class="n">${i+1}</span><span class="qic">${ic(s[0],19,1.6)}</span><b>${s[1]}</b><span>${s[2]}</span></div>`).join('')}</div>
  <table class="sevt" style="margin-top:18px"><thead><tr><th>Payment</th><th>When you book</th><th>When it's delivered</th><th>If it comes back</th></tr></thead><tbody>
  <tr><td><span class="st pu sm">COD</span></td><td>Nothing</td><td>Shipping, platform fee and 3% COD fee are deducted from the COD. The rest goes to your balance.</td><td>Shipping and platform fee from your balance. No COD fee.</td></tr>
  <tr><td><span class="st gr sm">Non-COD</span></td><td>Shipping and platform fee from your balance</td><td>Nothing more</td><td>Return shipping from your balance</td></tr></tbody></table></div>
  <div class="mf"><button class="btn btn-p" data-mclose>Got it</button></div>`;mscrim.classList.add('open')}
document.addEventListener('click',e=>{if(e.target.closest('[data-howto]'))howModal()});

/* ===== Create shipment ===== */
const STEPS3=['Details','Courier','Pickup','Review','Payment'];
const PLATFORM3=1000,CODFEE=.03;
PS.bal=BAL;
const setBal=v=>{PS.bal=v;document.getElementById('balv').textContent=rp(v)};
const defWh=()=>(WH.find(w=>w.def&&w.active)||WH.find(w=>w.active)||{}).code||'';
const newShip3=()=>({phone:'',name:'',addr:null,wh:defWh(),pay:'cod',items:'',qty:1,kg:'',l:'',w:'',h:'',val:'',open:true});
const blank3=()=>({step:0,how:'manual',ships:[newShip3()],bk:null,svc:null,map:{},day:null,slot:null,done:null,group:'reg',drafts:[],hold:{},mapU:{},rmd:[],chf:'all'});
/* Risky COD shoppers are caught when the merchant submits the details, before the courier step */
const scoreOf=s=>shopperScore(s.phone,s.addr.area,{val:s.val,street:s.addr.street});
const riskyAt=i=>{const s=X.ships[i];return s.pay==='cod'&&s.addr&&scoreOf(s).band==='Risky'};
/* an order waiting for the shopper on WhatsApp is not booked or charged now; it books itself when the shopper answers */
const held=i=>!!X.hold[i],heldN=()=>X.ships.filter((s,i)=>held(i)).length;
const kgOf3=s=>Math.max(1,Math.ceil(+s.kg||0),Math.ceil((+s.l||0)*(+s.w||0)*(+s.h||0)/6000));
const valOf=s=>+String(s.val).replace(/\D/g,'')||0;
const shipOk3=s=>phoneOk(normPhone(s.phone))&&s.name.trim()&&s.addr&&whCodes().includes(s.wh)&&+s.kg>0&&s.items.trim()&&+s.qty>=1&&(s.pay!=='cod'||valOf(s)>0);
const parcel=s=>({area:s.addr.area,pay:s.pay,kg:kgOf3(s),origin:whArea(whByCode(s.wh)),val:valOf(s)});
const svcFor3=i=>i in X.map?X.map[i]:X.svc;
function openShip(){X=blank3();sx.hidden=false;document.body.style.overflow='hidden';document.body.classList.add('inflow');track('shipment_create_opened',{merchant:PS.mode});drawSx()}
function closeShip(){sx.hidden=true;document.body.style.overflow='';document.body.classList.remove('inflow')}
document.getElementById('sx-close').onclick=()=>go(SH.length?'monitoring':'shipments');
function stepOk(){const s=X.step;
  if(s===0)return!!WH.length&&(X.how==='bulk'?!!(X.bk&&X.bk.stage==='rows'&&!X.bk.fix&&!bkCounts().left):X.ships.length&&X.ships.every(shipOk3));
  if(s===1)return X.svc!=null&&X.ships.every((x,i)=>svcFor3(i)!=null);if(s===2)return X.day!=null&&X.slot!=null;if(s===4)return PS.bal>=costs().now;return true}
const sxSync=()=>{const b=document.getElementById('sx-next');if(b)b.disabled=!stepOk()};

/* costs: published rate − FLIK discount + COD fee + platform fee */
function costs(){const o={pub:0,disc:0,net:0,cod:0,codFee:0,plat:0,now:0,later:0,nCod:0,nNon:0,codTot:0};
  X.ships.forEach((s,i)=>{const si=svcFor3(i);if(si==null||held(i))return;const p=parcel(s),r=rateOf(si,p.origin,p.area,p.kg),cf=s.pay==='cod'?Math.round(p.val*CODFEE):0;
    o.pub+=r.pub;o.disc+=r.disc;o.net+=r.net;o.codFee+=cf;o.plat+=PLATFORM3;
    if(s.pay==='cod'){o.nCod++;o.codTot+=p.val;o.later+=r.net+cf+PLATFORM3}else{o.nNon++;o.now+=r.net+PLATFORM3}});
  o.total=o.pub-o.disc+o.codFee+o.plat;return o}

/* ---- manual entry ---- */
const inp3=(i,k,lab,ph,o={})=>`<div class="sx-f"><label for="s${i}${k}">${lab}</label><div class="${o.pre?'pre':o.unit?'unit':''}">${o.pre?`<em>${o.pre}</em>`:''}<input id="s${i}${k}" data-si="${i}" data-k="${k}" value="${esc(X.ships[i][k])}" placeholder="${ph}" ${o.num?'inputmode="numeric"':''}>${o.unit?`<em>${o.unit}</em>`:''}</div></div>`;
function shipCard(s,i){const ok=shipOk3(s),cod=s.pay==='cod';
  const sc=s.addr&&phoneOk(normPhone(s.phone))?scoreOf(s):null;
  return`<div class="sx-ship${s.open?' open':''}" data-card="${i}"><button class="sx-sh" data-tog="${i}"><b>Shipment ${i+1}</b>${ok?`<span class="ok">${ic('check',15,2.4)}</span>`:''}<span class="sum">${!s.open&&s.name?`${esc(s.name)}${s.addr?' · '+s.addr.area.city:''} · ${cod?'COD':'Non-COD'}`:''}</span><span class="chev">${ic('chev',16)}</span></button>
  <div class="sx-sb"><div class="sx-g sx-g2">${inp3(i,'phone','Customer WhatsApp','812-3456-7890',{pre:'+62',num:1})}${inp3(i,'name','Customer name','Full name')}</div>
  <div class="sx-g"><div class="sx-f"><label>Customer address</label><button class="sx-addr${s.addr?' set':''}" data-addr="${i}">${ic('pin',16)}<span>${s.addr?`${esc(s.addr.street)}, ${areaTx(s.addr.area)} ${s.addr.area.zip}${s.addr.pin?' · pinned':''}`:'Search the address or drop a pin'}</span><span class="chev">${ic('chev',16)}</span></button>
    ${sc?`<p class="sx-sc">${scorePill(sc)}<span>${esc(sc.why)}</span></p>`:''}</div></div>
  <div class="sx-g sx-g2"><div class="sx-f"><label for="s${i}wh">Pickup from</label><select class="sx-sel" id="s${i}wh" data-si="${i}" data-k="wh">${WH.filter(w=>w.active).map(w=>`<option value="${w.code}" ${s.wh===w.code?'selected':''}>${esc(w.n)} · ${w.code}</option>`).join('')}</select></div>
    <div class="sx-f"><label>Payment method</label><div class="seg sx-seg" role="radiogroup"><button class="${cod?'on':''}" data-spay="${i}" data-v="cod" role="radio" aria-checked="${cod}">COD</button><button class="${cod?'':'on'}" data-spay="${i}" data-v="non" role="radio" aria-checked="${!cod}">Non-COD</button></div></div></div>
  <div class="sx-g sx-g3">${inp3(i,'items','Product name','e.g. Linen shirt · White')}<div class="sx-f"><label for="s${i}qty">Quantity</label><div class="qty sx-qty"><button data-qd="${i}" data-d="-1" aria-label="Less">${ic('minus',14,2)}</button><input id="s${i}qty" data-si="${i}" data-k="qty" value="${s.qty}" inputmode="numeric"><button data-qd="${i}" data-d="1" aria-label="More">${ic('plus',14,2)}</button></div></div></div>
  <div class="sx-g sx-g4">${inp3(i,'l','Length','0',{unit:'cm',num:1})}${inp3(i,'w','Width','0',{unit:'cm',num:1})}${inp3(i,'h','Height','0',{unit:'cm',num:1})}${inp3(i,'kg','Weight','0',{unit:'kg',num:1})}</div>
  <div class="sx-g sx-g2">${inp3(i,'val',cod?'COD amount':'Goods value','0',{pre:'Rp',num:1})}<div class="sx-f sx-hint"><span>${cod?'What the courier collects from the shopper. FLIK charges a 3% COD fee on it, after delivery.':'For insurance and claims. The shopper has already paid.'}</span></div></div>
  ${X.ships.length>1?`<div class="sx-row" style="margin-top:14px;justify-content:flex-end"><button class="btn btn-d" data-del="${i}">${ic('trash',15)}Remove</button></div>`:''}</div></div>`}
/* address: search FLIK's address data, then pinpoint on the map (Google Maps in production) */
function addrModal(i){const s=X.ships[i];let a=s.addr?{...s.addr}:{street:'',area:null,pin:null},q=a.area?areaTx(a.area):'',sug=[];
  const draw=()=>{const p=a.pin||{x:50,y:52};
    modal.innerHTML=`<div class="mh"><h3>Customer address</h3><button class="ib" data-mclose aria-label="Close">${ic('x',18)}</button></div>
    <div class="mb"><div class="fld"><label for="ad-q">Kelurahan, kecamatan or postcode</label><div class="ad-s"><input id="ad-q" value="${esc(q)}" placeholder="e.g. Dago, Coblong or 40135" autocomplete="off">${sug.length?`<div class="ie-dd">${sug.map((x,k)=>`<button class="opt" data-sg="${k}"><b>${x.kel}, ${x.kec}</b><span>${x.city}, ${x.prov} ${x.zip}</span></button>`).join('')}</div>`:''}</div></div>
    <div class="fld"><label for="ad-st">Street, building and house number</label><input id="ad-st" value="${esc(a.street)}" placeholder="Jl. Ir. H. Juanda No. 120"></div>
    <div class="fld"><label>Pinpoint <span class="src">Drag the map pin to the door. Couriers see it.</span></label><div class="map${a.area?'':' off'}" id="ad-map" role="application" aria-label="Map preview">${mapSvg(a.area)}<span class="map-pin" style="left:${p.x}%;top:${p.y}%">${ic('pin',26,2)}</span>${a.area?'':'<span class="map-tx">Search an area first</span>'}<span class="map-attr">Map preview · Google Maps in the product</span></div>
      ${a.area?`<p class="src" style="margin-top:6px">${a.pin?`Pinned at ${(-6.2-hsh(a.area.zip)%300/100+p.y/1000).toFixed(5)}, ${(106.8+hsh(a.area.kec)%400/100+p.x/1000).toFixed(5)}`:'Pin is at the centre of '+a.area.kel+'. Click the map to move it.'}</p>`:''}</div></div>
    <div class="mf"><button class="btn btn-o" data-mclose>Cancel</button><button class="btn btn-p" id="adsave" ${a.area&&a.street.trim()?'':'disabled'}>Save address</button></div>`;
    const qi=document.getElementById('ad-q');qi.oninput=async()=>{q=qi.value;sug=q.trim().length>1?await FLIK.api.geocode({query:q.trim()}):[];const pos=qi.selectionStart;draw();const n=document.getElementById('ad-q');n.focus();n.setSelectionRange(pos,pos)};
    document.getElementById('ad-st').oninput=e=>{a.street=e.target.value;document.getElementById('adsave').disabled=!(a.area&&a.street.trim())};
    modal.querySelectorAll('[data-sg]').forEach(b=>b.onclick=()=>{a.area=sug[+b.dataset.sg];q=areaTx(a.area);sug=[];a.pin=null;draw();document.getElementById('ad-st').focus()});
    document.getElementById('ad-map').onclick=e=>{if(!a.area)return;const r=e.currentTarget.getBoundingClientRect();a.pin={x:Math.round((e.clientX-r.left)/r.width*100),y:Math.round((e.clientY-r.top)/r.height*100)};draw()};
    document.getElementById('adsave').onclick=()=>{s.addr={street:a.street.trim(),area:a.area,pin:a.pin};closeModal();track('address_set',{pinned:!!a.pin});drawSx()}};
  draw();mscrim.classList.add('open');setTimeout(()=>document.getElementById(a.area?'ad-st':'ad-q').focus(),0)}
function mapSvg(a){const h=a?hsh(a.kec):1;let g='';for(let k=0;k<7;k++){const y=10+((h>>k)%80);g+=`<path d="M0 ${y} Q 50 ${y+((h>>(k+2))%30)-15} 100 ${y+((h>>(k+4))%20)-10}" />`}
  for(let k=0;k<6;k++){const x=8+((h>>(k+1))%84);g+=`<path d="M${x} 0 L ${x+((h>>k)%24)-12} 100" />`}
  return`<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><rect width="100" height="100" class="mp-bg"/><path class="mp-river" d="M-5 ${30+h%30} C 30 ${20+h%50}, 60 ${60+h%20}, 105 ${40+h%40}"/><g class="mp-rd">${g}</g></svg>`}

/* ---- courier step: recommendation in plain words, batches and red zones in the side panel ---- */
const in10=sr=>Math.max(1,Math.min(10,Math.round(sr/10)));
function courierHtml(){const P=X.ships.map(parcel),rec=recommend(P,X.group),n=X.ships.length,h=heldN();X.rec=rec;rzFix();
  const R=rec.list.find(o=>o.i===rec.best),groups=[['reg','Regular'],['exp','Express'],['cargo','Cargo']];
  return`<h2>Choose a courier</h2><p class="sx-lead">Prices cover all ${plural(n,'shipment')}${h?`, including ${h} waiting for the shopper (charged only once they confirm)`:''}. <b>Delivered</b> means: of all the parcels a courier carried to the same kecamatan as your orders in the last 90 days, for every FLIK merchant, how many arrived.</p>
  ${R?`<section class="rec"><span class="bk-ai-ic">${ic('sparkle',16)}</span><div><b>Recommended: ${cName(R.k)} ${SERVICES[R.i][1]}</b><span>Delivers best where your orders are going: ${in10(R.sr)} in 10 of its parcels arrived there in the last 90 days${R.red.length?'':', and it delivers to every address in this list'}. ${rp(R.net)} for ${plural(n,'shipment')}.</span></div>${X.svc===R.i?`<span class="st ok">${ic('check',13,2.4)}Selected</span>`:`<button class="btn btn-p" data-svc="${R.i}">Use ${cName(R.k)}</button>`}</section>`:''}
  <div class="seg sx-grp-seg" role="tablist">${groups.map(g=>`<button class="${X.group===g[0]?'on':''}" data-grp="${g[0]}">${g[1]}</button>`).join('')}</div>
  <div class="sx-grp">${COURIERS.map(c=>[c,rec.list.filter(o=>o.k===c.k)]).filter(r=>r[1].length).sort((a,b)=>Math.max(...b[1].map(o=>o.sr))-Math.max(...a[1].map(o=>o.sr))).map(([c,list])=>`<div class="sx-cr"><div class="nm">${cLogo(c.k)}${c.n}</div><div class="sx-svcs">${list.map(o=>{const sv=SERVICES[o.i],on=X.svc===o.i;
    return`<button class="sx-svc${on?' on':''}${o.red.length?' rz':''}" data-svc="${o.i}">${o.i===rec.best?'<span class="sx-tag">Recommended</span>':o.i===rec.cheap?'<span class="sx-tag ch">Cheapest</span>':''}<span class="n">${sv[1]}<span class="rdo${on?' on':''}"></span></span><span class="d">${etaOf(sv,sum(P,p=>zoneMul(p.origin,p.area))/n)}</span><span class="p num">${rp(o.net)}${o.pub>o.net?`<s>${rp(o.pub)}</s>`:''}</span>
      <span class="sr"><i style="width:${Math.max(0,(o.sr-60)/40*100)}%"></i></span><span class="srt" title="${fpct(o.sr)} of its parcels to your orders' kecamatan arrived, last 90 days">${in10(o.sr)} in 10 delivered</span>${o.red.length?`<span class="rzt">${ic('warn',12)}${plural(o.red.length,'order')} it can't take</span>`:''}</button>`}).join('')}</div></div>`).join('')}</div>`}
/* orders the chosen courier can't deliver: each goes with FLIK's recommendation unless the merchant picks another courier that delivers there */
const rzRows=()=>X.svc==null?[]:X.ships.map((s,i)=>[s,i]).filter(([s])=>rzBlocks(SERVICES[X.svc][0],s.addr.area,s.pay));
const rzOpts=s=>{const q=parcel(s);return X.rec.list.map(o=>o.i).filter(i=>i!==X.svc&&reach(i,q.origin,q.area)&&!rzBlocks(SERVICES[i][0],q.area,q.pay)).sort((a,b)=>srOf(SERVICES[b][0],q.area).sr-srOf(SERVICES[a][0],q.area).sr)};
function rzFix(){X.map={};rzRows().forEach(([s,i])=>{const o=rzOpts(s),def=o.includes(X.rec.best)?X.rec.best:o.length?o[0]:null;X.map[i]=X.mapU[i]!=null&&o.includes(X.mapU[i])?X.mapU[i]:def;X.rzDef=X.rzDef||{};X.rzDef[i]=def})}
function batchPanel(){if(X.svc==null)return`<h4>Batches</h4><p class="sp-tx">Choose a courier. You'll see here how your ${plural(X.ships.length,'shipment')} split into batches, and any order that courier can't take.</p>`;
  const pk=pickups(),h=heldN(),red=rzRows(),k=SERVICES[X.svc][0];
  return`<div class="sp-h"><h4>${plural(pk.length+h,'batch','batches')}</h4><b class="num">${rp(costs().net)}</b></div>
  <p class="sp-tx">One batch is one warehouse with one courier service. Each batch gets its own pickup, and every parcel gets its AWB from the courier when you book.</p>
  <div class="sp-l">${pk.map(p=>`<div class="sp-r">${cLogo(SERVICES[p.svc][0])}<div><b>${cName(SERVICES[p.svc][0])} ${SERVICES[p.svc][1]}</b><span>from ${esc(whByCode(p.wh).n)} (${p.wh})${p.svc!==X.svc?` · can deliver where ${cName(k)} can't`:''}</span></div><em>${plural(p.ships.length,'order')}</em></div>`).join('')}
  ${h?`<div class="sp-r"><span class="qic sm">${ic('chat2',14)}</span><div><b>${plural(h,'order')} waiting for the shopper</b><span>Each is a batch of its own, booked automatically when the shopper confirms or pays</span></div><em>${plural(h,'batch','batches')}</em></div>`:''}</div>
  ${red.length?`<div class="sp-rz"><h4>${plural(red.length,'order')} can't go with ${cName(k)} ${SERVICES[X.svc][1]}</h4><p class="sp-tx">${cName(k)} doesn't deliver${red.some(([s])=>rzOf(k,s.addr.area)==='cod')?' COD':''} to these addresses, so they would come back. Each one goes with the courier that delivers best there. You can pick another one that delivers there, or remove the order.</p>
    ${red.map(([s,i])=>{const o=rzOpts(s),t=X.map[i];return`<div class="sp-o"><div class="sp-oh"><b>${esc(s.name)}</b><button class="ib sm" data-rzrm="${i}" aria-label="Remove this order" title="Remove this order">${ic('trash',14)}</button></div><span class="src">${esc(s.addr.area.kec)}, ${esc(s.addr.area.city)}</span>
      <div class="sp-pills"><span class="st bad sm">${RZ_TX[rzOf(k,s.addr.area)]}</span><span class="st ${s.pay==='cod'?'pu':'gr'} sm">${s.pay==='cod'?'COD':'Non-COD'}</span></div>
      ${o.length?`<select data-rzm="${i}" aria-label="Courier for ${esc(s.name)}">${o.map(j=>{const q=parcel(s);return`<option value="${j}" ${j===t?'selected':''}>${cName(SERVICES[j][0])} ${SERVICES[j][1]} · ${rp(rateOf(j,q.origin,q.area,q.kg).net)} · ${in10(srOf(SERVICES[j][0],q.area).sr)} in 10 arrive${j===X.rzDef[i]?' · Recommended':''}</option>`}).join('')}</select>`:`<span class="sx-note warn sm">${ic('warn',13)}No courier delivers here. Remove it to continue.</span>`}</div>`}).join('')}</div>`:''}`}

/* ---- batches: one per warehouse and courier service (JKT-01 with JNE Regular and JKT-01 with JNE Same Day are two) ---- */
function pickups(){const m={};X.ships.forEach((s,i)=>{if(held(i))return;const si=svcFor3(i),k=si+'|'+s.wh;(m[k]=m[k]||{svc:si,wh:s.wh,ships:[]}).ships.push(i)});return Object.values(m)}
const DAYS3=[0,1,2].map(i=>new Date(NOW.getFullYear(),NOW.getMonth(),NOW.getDate()+1+i));
const pickupTx3=()=>X.day==null?'—':`${DOW[DAYS3[X.day].getDay()]}, ${fday(DAYS3[X.day])} · ${SLOTS[X.slot]}`;
/* what changed between the uploaded file (or what was typed) and what is booked */
function chgRows(){const L=[],nm=s=>s.name,rn=(s,i)=>s.row!=null?s.row+1:i+1;
  if(X.how==='bulk'&&X.bk&&X.bk.rows)X.bk.rows.filter(r=>r.flag).forEach(r=>{if(r.removed){L.push(['edit',r.i+1,r.name,'Removed · duplicate row','In the file','Removed']);return}
    Object.keys(r.bad).filter(k=>k[0]!=='_'&&String(r.bad[k])!==String(r[k])).forEach(k=>L.push(['edit',r.i+1,r.name,`${BK_LBL[k]} · ${r.ai&&r.ai.includes(k)?'fixed by AI':'edited by you'}`,r.bad[k]||'(empty)',r[k]]))});
  X.rmd.forEach(s=>L.push(['rm',s.row!=null?s.row+1:'–',nm(s),'Removed · Risky shopper','In this booking','Removed']));
  X.ships.forEach((s,i)=>{if(held(i))L.push(['wa',rn(s,i),nm(s),X.hold[i]==='pay'?'Payment link on WhatsApp':'Confirm on WhatsApp','Ships now','Waits for the shopper']);
    if(i in X.map&&X.map[i]!=null)L.push(['cour',rn(s,i),nm(s),"Courier changed · can't deliver there",`${cName(SERVICES[X.svc][0])} ${SERVICES[X.svc][1]}`,`${cName(SERVICES[X.map[i]][0])} ${SERVICES[X.map[i]][1]}`])});
  return L}
function chgHtml(){const L=chgRows();if(!L.length)return'';const T=[['all','All'],['edit','Edited'],['wa','WhatsApp'],['cour','Courier'],['rm','Removed']].filter(t=>t[0]==='all'||L.some(r=>r[0]===t[0])),V=X.chf==='all'?L:L.filter(r=>r[0]===X.chf);
  return`<section><div class="sx-h">Changes ${X.how==='bulk'?'from your file':'since you added them'}</div><p class="sx-lead" style="margin-top:-4px">${plural(L.length,'change')}. ${plural(X.ships.length-heldN(),'order')} ship now${heldN()?`, ${heldN()} wait for the shopper`:''}.</p>
  <div class="seg sm" style="margin-bottom:10px">${T.map(t=>`<button class="${X.chf===t[0]?'on':''}" data-chf="${t[0]}">${t[1]} · ${t[0]==='all'?L.length:L.filter(r=>r[0]===t[0]).length}</button>`).join('')}</div>
  <div class="tbl-wrap"><table class="rv"><thead><tr><th>Row</th><th>Customer</th><th>What changed</th><th>Before</th><th>Now</th></tr></thead><tbody>
  ${V.slice(0,60).map(r=>`<tr><td class="rn">${r[1]}</td><td>${esc(r[2])}</td><td>${esc(r[3])}</td><td><s class="src" style="display:inline">${esc(String(r[4]))}</s></td><td><b>${esc(String(r[5]))}</b></td></tr>`).join('')}</tbody></table></div>${V.length>60?`<p class="src" style="margin-top:6px">Showing 60 of ${V.length}. The full list is in the export.</p>`:''}</section>`}
function reviewHtml(){const pk=pickups();
  return`<h2>Review shipments</h2><p class="sx-lead">Check everything before you book.</p>
  <section><div class="sx-h">Pickups · ${pickupTx3()}</div>${pk.map(p=>{const w=whByCode(p.wh);return`<div class="sx-card sx-whc"><span class="ic">${cLogo(SERVICES[p.svc][0])}</span><div><b>${cName(SERVICES[p.svc][0])} ${SERVICES[p.svc][1]} · ${plural(p.ships.length,'parcel')}</b><span>${esc(w.n)} (${w.code}) · ${esc(whAddr(w))}</span></div><button class="btn btn-o" data-go3="2">Edit</button></div>`}).join('')}</section>
  ${chgHtml()}
  <section><div class="sx-h">Shipments</div><div class="tbl-wrap"><table class="rv"><thead><tr><th>#</th><th>Customer</th><th>Destination</th><th>From</th><th>Courier</th><th>Payment</th><th>Shopper score</th><th class="r">Shipping</th></tr></thead><tbody>
  ${X.ships.slice(X.rpg*50,X.rpg*50+50).map((s,j)=>{const i=X.rpg*50+j,si=svcFor3(i),p=parcel(s),r=rateOf(si,p.origin,p.area,p.kg);return`<tr><td class="rn">${i+1}</td><td><b>${esc(s.name)}</b><span class="src">${fphone(s.phone)}</span></td><td>${esc(s.addr.area.kec)}<span class="src">${esc(s.addr.area.city)}</span></td><td>${s.wh}</td><td><div class="sx-cl">${cLogo(SERVICES[si][0])}<span>${cName(SERVICES[si][0])}</span></div>${X.map[i]!=null?`<span class="src">${cName(SERVICES[X.svc][0])} can't deliver there</span>`:''}</td><td>${s.pay==='cod'?`<span class="st pu sm">COD</span> <span class="num">${rp(valOf(s))}</span>`:'<span class="st gr sm">Non-COD</span>'}</td><td>${scorePill(scoreOf(s))}${held(i)?`<span class="src">Waits for the shopper</span>`:riskyAt(i)?'<span class="src">Shipped anyway</span>':''}</td><td class="r num">${rp(r.net)}</td></tr>`}).join('')}</tbody></table></div>
  ${X.ships.length>50?`<div class="foot"><span>Showing <b>${X.rpg*50+1}–${Math.min(X.ships.length,X.rpg*50+50)}</b> of <b>${X.ships.length}</b></span><div class="pager"><button class="btn btn-o" data-rpg="-1" ${X.rpg?'':'disabled'}>Previous</button><button class="btn btn-o" data-rpg="1" ${(X.rpg+1)*50<X.ships.length?'':'disabled'}>Next</button></div></div>`:''}${X.how==='manual'?`<div class="sx-row"><button class="btn btn-o" data-go3="0">Edit shipments</button></div>`:''}</section>`}
/* ---- Risky shoppers: caught when the details are submitted, before the courier step ---- */
const RKO=[['wa','Confirm on WhatsApp'],['pay','Send payment link'],['ship','Ship anyway'],['rm','Remove']];
function riskyModal(){const R=X.ships.map((s,i)=>[s,i]).filter(([s,i])=>riskyAt(i)),ch={};R.forEach(([s,i])=>ch[i]=hasWa(s.phone)?'wa':'');let pv='wa',ed=false,draft=TPL.wa;
  track('risky_shoppers_found',{orders:R.length,of:X.ships.length,no_whatsapp:R.filter(([s])=>!hasWa(s.phone)).length});
  const draw=()=>{const n=k=>R.filter(([s,i])=>ch[i]===k).length,ex=(R.find(([s,i])=>ch[i]===pv)||R.find(([s])=>hasWa(s.phone))||R[0])[0],left=X.ships.length-n('rm')-n('wa')-n('pay'),open=R.filter(([s,i])=>!ch[i]).length;
    const miss=TPL_NEED[pv].filter(v=>!(ed?draft:TPL[pv]).includes('{{'+v+'}}'));
    modal.classList.add('xl');
    modal.innerHTML=`<div class="mh"><h3>${plural(R.length,'COD order needs','COD orders need')} a check before shipping</h3><button class="ib" data-mclose aria-label="Close">${ic('x',18)}</button></div>
    <div class="mb"><p class="d-sub" style="margin:0">Parcels to these shoppers often come back, and a returned COD parcel costs you shipping both ways. Choose what happens to each order. An order you send a check for waits as its own batch and is booked automatically as soon as the shopper confirms or pays. No answer in ${WA_HOURS} hours cancels it, with nothing charged.</p>
    <div class="rk2"><div class="rk2-l">
      <div class="rk2-all"><div><b>All ${plural(R.length,'order')}</b><span class="src">One action for every order with WhatsApp</span></div><select data-rka aria-label="Action for all orders"><option value="">Choose…</option>${RKO.map(o=>`<option value="${o[0]}">${o[1]}</option>`).join('')}</select></div>
      <div class="tbl-wrap"><table class="sevt rk-t"><thead><tr><th>Shopper</th><th>Score</th><th>COD</th><th>Action</th></tr></thead><tbody>
      ${R.map(([s,i])=>{const sc=scoreOf(s),wa=hasWa(s.phone);return`<tr><td><b>${esc(s.name)}</b><span class="src">${fphone(s.phone)}</span>${wa?'':`<span class="st gr sm" title="This number isn't on WhatsApp, so FLIK can't ask the shopper">No WhatsApp</span>`}</td>
        <td><span class="rk-sc ${sc.cls}">${sc.score}</span> <span class="src" style="display:inline">${sc.band}</span><ul class="rk-f">${sc.f.filter(x=>x[2]!=='ok').map(x=>`<li>${esc(x[1])}</li>`).join('')}</ul></td>
        <td class="num">${rp(valOf(s))}</td><td><select data-rk="${i}" class="${ch[i]?'':'need'}" aria-label="Action for ${esc(s.name)}">${ch[i]?'':'<option value="">Choose…</option>'}${RKO.filter(o=>wa||o[0]==='ship'||o[0]==='rm').map(o=>`<option value="${o[0]}" ${ch[i]===o[0]?'selected':''}>${o[1]}</option>`).join('')}</select></td></tr>`}).join('')}</tbody></table></div></div>
    <div class="rk2-r"><b>What the shopper gets on WhatsApp</b><div class="seg sm"><button class="${pv==='wa'?'on':''}" data-pv="wa">Confirmation</button><button class="${pv==='pay'?'on':''}" data-pv="pay">Payment link</button></div>
      <div class="wa-pv"><div class="wa-pvh"><span class="av">F</span><div><b>FLIK</b><span>on behalf of ${MERCHANT}</span></div></div><div class="wa-m out"><span>${esc(fillTpl(ed?draft:TPL[pv],ex,'W-preview'))}</span><em>10:47</em></div>
        ${pv==='wa'?'<div class="wa-q"><span>YA</span><span>BATAL</span></div>':''}</div>
      ${ed?`<textarea id="rk-tpl" rows="5" aria-label="Message wording">${esc(draft)}</textarea><div class="tpl-v">${TPL_VARS.filter(v=>pv==='pay'||v[0]!=='payment_link').map(v=>`<button class="chip" data-tv="${v[0]}">${v[1]}</button>`).join('')}</div>
        ${miss.length?`<p class="sx-note warn sm">${ic('warn',13)}Keep ${miss.map(v=>'{{'+v+'}}').join(', ')} in the message.</p>`:''}<div class="sx-row" style="gap:8px;justify-content:flex-end"><button class="lnk" data-tpl="reset">Use FLIK's wording</button><button class="btn btn-o" data-tpl="cancel">Cancel</button><button class="btn btn-p" data-tpl="save" ${miss.length?'disabled':''}>Save wording</button></div>`
        :`<button class="lnk" data-tpl="edit">${ic('edit',13)} Edit the wording</button>`}
      <p class="src">Sent from FLIK's WhatsApp number through Qontak, with your store name in the message. The shopper's reply shows on Monitoring. New wording is checked by WhatsApp before its first use (usually within a day); until then FLIK's wording is sent.</p></div></div></div>
    <div class="mf split"><span class="src">${open?`Choose an action for ${plural(open,'order')} without WhatsApp`:`${plural(n('wa')+n('pay'),'order')} wait for the shopper · ${n('rm')} removed`}</span><div style="display:flex;gap:8px"><button class="btn btn-o" data-mclose>Cancel</button><button class="btn btn-p" id="rk-go" ${open?'disabled':''}>Continue with ${plural(left,'order')}</button></div></div>`;
    modal.querySelectorAll('[data-rk]').forEach(el=>el.onchange=()=>{ch[el.dataset.rk]=el.value;draw()});
    const all=modal.querySelector('[data-rka]');all.onchange=()=>{const v=all.value;if(!v)return;R.forEach(([s,i])=>{if(hasWa(s.phone)||v==='ship'||v==='rm')ch[i]=v});draw()};
    modal.querySelectorAll('[data-pv]').forEach(b=>b.onclick=()=>{pv=b.dataset.pv;ed=false;draft=TPL[pv];draw()});
    const ta=document.getElementById('rk-tpl');if(ta)ta.oninput=()=>{draft=ta.value;const m=TPL_NEED[pv].filter(v=>!draft.includes('{{'+v+'}}'));const sv=modal.querySelector('[data-tpl="save"]');if(sv)sv.disabled=!!m.length;modal.querySelector('.wa-pv .wa-m span').textContent=fillTpl(draft,ex,'W-preview')};
    modal.querySelectorAll('[data-tv]').forEach(b=>b.onclick=()=>{const t=document.getElementById('rk-tpl'),v='{{'+b.dataset.tv+'}}',a=t.selectionStart||t.value.length;draft=t.value.slice(0,a)+v+t.value.slice(a);draw()});
    modal.querySelectorAll('[data-tpl]').forEach(b=>b.onclick=()=>{const a=b.dataset.tpl;if(a==='edit'){ed=true;draft=TPL[pv]}else if(a==='cancel'){ed=false}else if(a==='reset'){draft=TPL_DEF[pv]}else if(a==='save'){TPL[pv]=draft;ed=false;track('whatsapp_wording_saved',{kind:pv,custom:draft!==TPL_DEF[pv]});toast('Wording saved. WhatsApp checks it before its first use')}draw()});
    document.getElementById('rk-go').onclick=()=>{closeModal();const ships=[],hold={};
      X.ships.forEach((s,i)=>{const c=ch[i];if(c)track('risky_choice',{choice:c,whatsapp:hasWa(s.phone)});if(c==='rm'){X.rmd.push(s);return}if(c==='wa'||c==='pay')hold[ships.length]=c;ships.push(s)});
      X.ships=ships;X.hold=hold;track('risky_resolved',{confirm:n('wa'),payment_link:n('pay'),removed:n('rm'),shipped_anyway:n('ship')});
      if(!X.ships.length){closeShip();go('shipments');toast('Every order was removed');return}
      X.step=1;X.rpg=0;drawSx();sxBody.scrollTop=0;if(n('wa')+n('pay'))toast(`${plural(n('wa')+n('pay'),'order waits','orders wait')} for the shopper`)}};
  draw();mscrim.classList.add('open')}
/* prototype: the first shopper answers a few seconds later, so the automatic booking can be seen */
function simShopper(p){setTimeout(()=>{if(p.st!=='sent')return;const sh=confirmPend(p);track(p.kind==='pay'?'shopper_paid':'shopper_confirmed',{});track('waiting_order_booked',{courier:sh.k});
  toast(`${p.ship.name.split(' ')[0]} ${p.kind==='pay'?'paid':'confirmed'} on WhatsApp. ${sh.awb} booked automatically`);if(!document.getElementById('view-mon').hidden)renderMon()},12000)}
function payHtml(){const c=costs(),low=PS.bal<c.now;
  return`<h2>Payment</h2><p class="sx-lead">Non-COD shipping is paid now from your FLIK balance. COD shipping is deducted from the COD when the parcel is delivered, or from your balance if it comes back.</p>
  <div class="sx-pay"><div class="sx-bal"><span>FLIK balance</span><b class="num">${rp(PS.bal)}</b>${low?`<button class="lnk" data-topup>Top up</button>`:''}</div><div class="sx-due"><span>You pay now</span><b class="num">${rp(c.now)}</b></div></div>
  ${low?`<div class="sx-note warn">${ic('warn',16)}<span>Your balance is ${rp(c.now-PS.bal)} short of the non-COD shipping. Top up to continue.</span></div>`:''}
  <section class="sx-card"><div class="sx-h">Cost breakdown</div><table class="cost"><thead><tr><th></th><th class="r">Non-COD · ${c.nNon}</th><th class="r">COD · ${c.nCod}</th><th class="r">Total</th></tr></thead><tbody>
  ${(()=>{const part=f=>{let a=0,b=0;X.ships.forEach((s,i)=>{const p=parcel(s),r=rateOf(svcFor3(i),p.origin,p.area,p.kg),v=f(s,r,p);s.pay==='cod'?b+=v:a+=v});return[a,b]};
    const rows=[['Published rate','The couriers’ own price',part((s,r)=>r.pub),''],['FLIK discount','',part((s,r)=>r.disc),'−'],['COD fee','3% of the COD amount',part((s,r,p)=>s.pay==='cod'?Math.round(p.val*CODFEE):0),''],['Platform fee',`${rp(PLATFORM3)} per shipment`,part(()=>PLATFORM3),'']];
    return rows.map(r=>`<tr><td>${r[0]}${r[1]?`<span class="src">${r[1]}</span>`:''}</td><td class="r num">${r[3]}${rp(r[2][0])}</td><td class="r num">${r[3]}${rp(r[2][1])}</td><td class="r num">${r[3]}${rp(r[2][0]+r[2][1])}</td></tr>`).join('')})()}
  <tr class="t"><td>Total payable</td><td class="r num">${rp(c.now)}</td><td class="r num">${rp(c.later)}</td><td class="r num">${rp(c.total)}</td></tr>
  <tr class="when"><td>When it's charged</td><td class="r">Now, from your balance</td><td class="r">When delivered or returned</td><td></td></tr></tbody></table></section>
  ${heldN()?`<div class="sx-note">${ic('chat2',16)}<span>${plural(heldN(),'order waiting','orders waiting')} for the shopper ${heldN()>1?'are':'is'} not in this payment. Each one is booked and charged the same way once the shopper confirms or pays.</span></div>`:''}
  ${c.nCod?`<p class="sx-foot-n">When all ${c.nCod} COD parcels are delivered, ${rp(c.codTot-c.later)} goes to your balance (${rp(c.codTot)} collected, minus ${rp(c.later)}).</p>`:''}`}
function doneHtml(){const d=X.done;return`<div class="sx-done"><div class="sx-ok"><i>${ic('check',18,2.6)}</i><b>${d.n?plural(d.n,'shipment')+' booked':'Waiting for shoppers'}<span>${d.batches.map(b=>b.id).join(' · ')||'Nothing booked yet'}</span></b>${d.n?'':'<span></span>'}<button class="btn btn-o" data-toast="Printing ${d.n} shipping labels">${ic('print',15)}Print labels</button></div>
  <div class="sx-next">${d.batches.map(b=>`<div><span class="ic">${cLogo(b.k)}</span><b>${cName(b.k)} · ${plural(b.n,'parcel')}</b><span>Pickup from ${esc(b.whn)} on ${d.when}.</span></div>`).join('')}${d.drafts&&d.drafts.length?`<div class="wa-n"><span class="ic">${ic('chat2',19)}</span><b>${plural(d.drafts.length,'order waits','orders wait')} for the shopper on WhatsApp</b><span>Each is booked automatically into the next pickup as soon as the shopper confirms or pays, with the courier you chose. No answer in ${WA_HOURS} hours cancels it, with nothing charged.</span></div>`:''}<div><span class="ic">${ic('pulse',19)}</span><b>Follow them in Monitoring</b><span>Anything delayed or at risk shows up there with what to do.</span></div></div>
  <div class="sx-row" style="margin-top:24px;justify-content:flex-end"><button class="btn btn-o" data-again>Create another</button><button class="btn btn-p" data-tomon>View in Monitoring</button></div></div>`}

function drawSx(){const st=X.step;
  document.getElementById('sx-steps').innerHTML=X.done?'':STEPS3.map((t,i)=>`${i?'<span class="stp-l"></span>':''}<span class="stp${i===st?' on':i<st?' done':''}"><i>${i<st?ic('check',11,3):i+1}</i><span>${t}</span></span>`).join('');
  if(X.done){sxFoot.hidden=true;sxBody.innerHTML=`<div class="sx-in solo"><div class="sx-main">${doneHtml()}</div></div>`;return}
  sxFoot.hidden=false;let main='';
  if(st===0){main=`<h2>Shipment details</h2><p class="sx-lead">Who receives each parcel, where it ships from and how the shopper pays.</p>
    ${WH.length?'':`<div class="sx-note warn">${ic('wh',16)}<span><b>Add a pickup address first.</b> Couriers need to know where to collect.</span><button class="btn btn-o" data-addwh>Add pickup address</button></div>`}
    <section><div class="sx-h">Add shipments</div><div class="sx-opts">
      <button class="sx-opt${X.how==='manual'?' on':''}" data-how="manual"><span class="ic">${ic('pkg',18)}</span><div><b>Manual entry</b><span>Fill in each shipment</span></div></button>
      <button class="sx-opt${X.how==='bulk'?' on':''}" data-how="bulk"><span class="ic">${ic('sheet',18)}</span><div><b>Bulk upload</b><span>Up to 500 orders from a spreadsheet, from several warehouses</span></div></button></div></section>
    <section><div class="sx-h">Shipments</div>${X.how==='bulk'?bulkHtml():X.ships.map(shipCard).join('')+`<div class="sx-row"><button class="btn btn-o" data-addship>${ic('plus',15,2)}Add shipment</button><button class="btn btn-o" data-reset style="color:var(--muted)">Reset</button></div>`}</section>`}
  else if(st===1)main=courierHtml();
  else if(st===2){const pk=pickups();
    main=`<h2>Schedule pickup</h2><p class="sx-lead">${plural(pk.length,'pickup')}: one for each courier and warehouse. They all come on the day and time you choose.</p>
    <section>${pk.map(p=>{const w=whByCode(p.wh);return`<div class="sx-card sx-whc" style="margin-bottom:10px"><span class="ic">${cLogo(SERVICES[p.svc][0])}</span><div><b>${cName(SERVICES[p.svc][0])} ${SERVICES[p.svc][1]} · ${plural(p.ships.length,'parcel')}</b><span>${esc(w.n)} (${w.code}) · ${esc(w.city)}</span></div></div>`}).join('')}</section>
    <section class="sx-card"><div class="sx-f"><label>Day</label><div class="sx-slots">${DAYS3.map((d,i)=>`<button class="${X.day===i?'on':''}" data-day="${i}">${i===0?'Tomorrow':DOW[d.getDay()]}, ${d.getDate()} ${MON[d.getMonth()]}</button>`).join('')}</div></div>
      <div class="sx-f" style="margin-top:18px"><label>Time</label><div class="sx-slots">${SLOTS.map((t,i)=>`<button class="${X.slot===i?'on':''}" data-slot="${i}">${t}</button>`).join('')}</div></div></section>`}
  else if(st===3)main=reviewHtml();
  else main=payHtml();
  const wide=(X.how==='bulk'&&X.bk&&X.bk.stage!=='drop'&&st===0)||st===3;
  sxBody.innerHTML=st===1?`<div class="sx-in"><div class="sx-main">${main}</div><aside class="sx-side sp">${batchPanel()}</aside></div>`:`<div class="sx-in solo${wide?' wide':''}"><div class="sx-main">${main}</div></div>`;
  const c=st===4?costs():null;
  sxFoot.innerHTML=`${st?`<button class="btn btn-o" data-back>Back</button>`:''}<span class="sp"></span>${st===0&&X.how==='bulk'&&X.bk&&X.bk.rows?`<span class="foot-n">${plural(X.bk.rows.filter(r=>!r.removed).length,'order')}</span>`:''}<button class="btn btn-p" id="sx-next" ${stepOk()?'':'disabled'}>${st===4?(c.now?`Pay ${rp(c.now)} and book`:'Book shipments'):'Continue'}</button>`}

function sxNext(){
  if(X.step===0){if(X.how==='bulk')X.ships=X.bk.rows.filter(r=>!r.removed).map(bkShip);X.map={};X.svc=null;X.group='reg';track('shipment_details_done',{mode:X.how,rows:X.ships.length,cod:X.ships.filter(s=>s.pay==='cod').length});
    X.hold={};X.mapU={};X.rmd=[];X.rzDef={};
    if(X.ships.some((s,i)=>riskyAt(i))){riskyModal();return}}
  if(X.step===1){const red=rzRows();track('courier_chosen',{courier:SERVICES[X.svc][0],recommended:X.svc===X.rec.best,cant_deliver:red.length,changed_from_recommended:red.filter(([s,i])=>X.map[i]!==X.rzDef[i]).length})}
  if(X.step===3)track('payment_viewed',{});
  if(X.step<4){X.step++;X.rpg=0;drawSx();sxBody.scrollTop=0;return}
  if(!PS.verified){verifyGate('create_shipment',book);return}book()}
async function book(){const c=costs(),pk=pickups(),when=pickupTx3().replace(' · ',', ');
  const batches=pk.map(p=>{const id=`B-${String(NOW.getFullYear()).slice(2)}${String(NOW.getMonth()+1).padStart(2,'0')}${String(NOW.getDate()).padStart(2,'0')}-${String(BATCH.length+1).padStart(3,'0')}`;
    const b={id,created:new Date(NOW.getTime()+60000),k:SERVICES[p.svc][0],svc:p.svc,wh:p.wh};BATCH.unshift(b);
    p.ships.forEach(i=>{const s=X.ships[i],q=parcel(s),r=rateOf(p.svc,q.origin,q.area,q.kg);
      SH.unshift({id:'S'+(SH.length+1),batch:id,created:b.created,svc:p.svc,k:b.k,wh:p.wh,area:q.area,street:s.addr.street,name:s.name,phone:normPhone(s.phone),items:s.items,qty:+s.qty,kg:q.kg,pay:s.pay,val:q.val,pub:r.pub,cost:r.net,codFee:s.pay==='cod'?Math.round(q.val*CODFEE):0,tries:0,st:'pickup',upd:b.created,awb:mkAwb(b.k),tk:null,had:null})});
    return{id,k:b.k,n:p.ships.length,whn:whByCode(p.wh).n}});
  /* the request FLIK's API would take: one batch per pickup (warehouse + courier service) */
  await FLIK.api.createShipments({pickup:{date:DAYS3[X.day].toISOString().slice(0,10),slot:SLOTS[X.slot]},batches:pk.map((p,j)=>({ref:batches[j].id,warehouse:p.wh,courier:SERVICES[p.svc][0],service:SERVICES[p.svc][1],
    shipments:p.ships.map(i=>{const s=X.ships[i],q=parcel(s);return{recipient:{name:s.name,phone:normPhone(s.phone),street:s.addr.street,kelurahan:q.area.kel,kecamatan:q.area.kec,city:q.area.city,province:q.area.prov,postcode:q.area.zip,pin:s.addr.pin||null},
      items:s.items,qty:+s.qty,weight_kg:q.kg,dims_cm:[+s.l||0,+s.w||0,+s.h||0],payment:s.pay==='cod'?'COD':'NON_COD',cod_amount:s.pay==='cod'?q.val:0,item_value:q.val}})}))});
  /* orders waiting for the shopper: FLIK sends the WhatsApp; each one books itself with its courier when the shopper answers */
  X.drafts=[];for(const [i,s] of X.ships.entries()){if(!held(i))continue;const p=addPend(s,X.hold[i],svcFor3(i));X.drafts.push(p);
    await FLIK.api.verifyShopper({ref:p.id,kind:p.kind==='pay'?'payment_link':'confirmation',phone:normPhone(s.phone),amount:valOf(s),warehouse:s.wh,courier:SERVICES[p.svc][0],service:SERVICES[p.svc][1],template:p.tpl,expires_h:WA_HOURS})}
  if(X.drafts.length)simShopper(X.drafts[0]);
  setBal(PS.bal-c.now);ckDone('created');ckDone('paid');
  /* the first transaction tags the merchant: a new merchant becomes a Shipping merchant */
  if(!has('ship')){PS.flags=PS.mode==='new'?'ship':'payship';syncBar();track('merchant_tagged',{products:FLAGS[PS.flags].w.join('+')})}
  track('shipment_booked',{waiting_for_shopper:X.drafts.length,shipments:X.ships.length-X.drafts.length,batches:batches.length,cod:c.nCod,non_cod:c.nNon,paid_now:c.now,split:Object.keys(X.map).length>0});
  X.done={n:X.ships.length-X.drafts.length,batches,when,drafts:X.drafts};drawSx();sxBody.scrollTop=0}

/* the create flow owns its events (Raam's handlers for the old flow never see them) */
sx.addEventListener('click',e=>{if(!e.target.closest('#sx-body,#sx-foot'))return;e.stopPropagation();closePop();
  const tt=e.target.closest('[data-toast]');if(tt){toast(tt.dataset.toast);return}
  const t=e.target.closest('button,a');if(!t)return;const d=t.dataset;
  if(t.closest('#sx-foot')){if('back' in d){X.step--;drawSx();sxBody.scrollTop=0}else if(t.id==='sx-next'&&!t.disabled)sxNext();return}
  if(X.how==='bulk'&&bkClick(t))return;
  if(d.tog!=null)X.ships[d.tog].open=!X.ships[d.tog].open;
  else if(d.how){X.how=d.how}
  else if(d.spay!=null){X.ships[d.spay].pay=d.v}
  else if(d.qd!=null){const s=X.ships[d.qd];s.qty=Math.max(1,(+s.qty||1)+(+d.d))}
  else if('addship' in d){X.ships.forEach(s=>s.open=false);X.ships.push(newShip3())}
  else if('reset' in d){X.ships=[newShip3()]}
  else if(d.del!=null)X.ships.splice(+d.del,1);
  else if(d.addr!=null){addrModal(+d.addr);return}
  else if('addwh' in d){addWhModal(()=>{X.ships.forEach(s=>{if(!s.wh)s.wh=defWh()});drawSx()});return}
  else if(d.grp){X.group=d.grp;X.svc=null;X.mapU={}}
  else if(d.svc!=null){X.svc=+d.svc;X.mapU={}}
  else if(d.day!=null)X.day=+d.day;
  else if(d.slot!=null)X.slot=+d.slot;
  else if(d.go3!=null)X.step=+d.go3;
  else if(d.rpg){X.rpg+=+d.rpg}
  else if(d.chf){X.chf=d.chf}
  else if(d.rzrm!=null){const i=+d.rzrm,sh=(o)=>{const n={};Object.entries(o).forEach(([k,v])=>{k=+k;if(k<i)n[k]=v;else if(k>i)n[k-1]=v});return n};X.rmd.push(X.ships[i]);X.ships.splice(i,1);X.hold=sh(X.hold);X.mapU=sh(X.mapU);track('cant_deliver_removed',{});if(!X.ships.length){closeShip();go('shipments');return}}
  else if('topup' in d){topupModal();return}
  else if('again' in d){X=blank3()}
  else if('tomon' in d){MS.tab='summary';go('monitoring');return}
  else return;
  drawSx()},true);
sx.addEventListener('input',e=>{if(!e.target.closest('#sx-body'))return;e.stopPropagation();const t=e.target;
  if(X.bk&&bkInput(t))return;
  if(t.dataset.si!=null&&t.tagName!=='SELECT'){const s=X.ships[t.dataset.si],k=t.dataset.k;if(k==='val'){const n=+t.value.replace(/\D/g,'');t.value=n?n.toLocaleString('id-ID'):''}s[k]=t.value;
    const card=t.closest('.sx-ship'),ok=shipOk3(s),hs=card.querySelector('.sx-sh .ok');if(ok&&!hs)card.querySelector('.sx-sh b').insertAdjacentHTML('afterend',`<span class="ok">${ic('check',15,2.4)}</span>`);if(!ok&&hs)hs.remove();sxSync()}},true);
sx.addEventListener('change',e=>{if(!e.target.closest('#sx-body'))return;e.stopPropagation();const t=e.target;
  if(X.bk&&bkChange(t))return;
  if(t.dataset.si!=null&&t.tagName==='SELECT'){X.ships[t.dataset.si][t.dataset.k]=t.value;sxSync()}
  else if(t.dataset.rzm!=null){X.mapU[t.dataset.rzm]=+t.value;track('cant_deliver_courier_changed',{recommended:+t.value===X.rzDef[t.dataset.rzm]});drawSx()}},true);
/* top up: same modal as Raam's, verified first, and the balance goes up when paid */
function topupModal(title){if(typeof title!=='string')title='Top up balance';if(!PS.verified){verifyGate('top_up',()=>topupModal(title));return}
  let amt=1000000,via='bca';
  const draw=()=>{modal.innerHTML=`<div class="mh"><h3>${title}</h3><button class="ib" data-mclose aria-label="Close">${ic('x',18)}</button></div>
  <div class="mb"><div class="fld"><label for="tamt">Amount</label><input id="tamt" class="num" value="${amt.toLocaleString('id-ID')}"></div>
  <div class="amtopts">${[100000,500000,1000000,5000000].map(v=>`<button class="${v===amt?'on':''}" data-a="${v}">${rp(v)}</button>`).join('')}</div>
  <div class="fld"><label>Pay with</label><div class="paylist">${[['bca','BCA virtual account'],['mandiri','Mandiri virtual account'],['qris','QRIS']].map(m=>`<button class="payopt${via===m[0]?' on':''}" data-v="${m[0]}">${pmBadge(m[0])}<span style="flex:1">${m[1]}</span><span class="rdo${via===m[0]?' on':''}"></span></button>`).join('')}</div></div></div>
  <div class="mf"><button class="btn btn-o" data-mclose>Cancel</button><button class="btn btn-p" id="tgo">Continue</button></div>`;
  const inp=document.getElementById('tamt'),go=document.getElementById('tgo');
  inp.oninput=()=>{amt=+inp.value.replace(/\D/g,'');go.disabled=!(amt>=10000)};
  modal.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{amt=+b.dataset.a;draw()});
  modal.querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>{via=b.dataset.v;draw()});
  go.onclick=()=>{modal.innerHTML=`<div class="mh"><h3>Complete your top up</h3><button class="ib" data-mclose aria-label="Close">${ic('x',18)}</button></div><div class="mb"><div class="vabox">${via==='qris'?`<span class="kpi-l">Scan with any banking or e-wallet app</span><b>QRIS · ${rp(amt)}</b>`:`<span class="kpi-l">${via==='bca'?'BCA':'Mandiri'} virtual account number</span><b class="num">8808 0812 3456 7890</b><span class="kpi-l">Transfer exactly ${rp(amt)}</span>`}</div><p class="kpi-l">Your balance updates automatically after payment.</p></div><div class="mf"><button class="btn btn-o" data-mclose>Close</button><button class="btn btn-p" id="tdone">I've paid</button></div>`;
    document.getElementById('tdone').onclick=()=>{closeModal();setBal(PS.bal+amt);track('balance_topped_up',{amount:amt});toast(`${rp(amt)} added to your balance`);if(!sx.hidden&&X&&X.step===4)drawSx()}};
  };
  draw();mscrim.classList.add('open')}
document.getElementById('baladd').onclick=()=>topupModal();
