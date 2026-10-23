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
const blank3=()=>({step:0,how:'manual',ships:[newShip3()],bk:null,svc:null,map:{},day:null,slot:null,done:null,group:'reg'});
const kgOf3=s=>Math.max(1,Math.ceil(+s.kg||0),Math.ceil((+s.l||0)*(+s.w||0)*(+s.h||0)/6000));
const valOf=s=>+String(s.val).replace(/\D/g,'')||0;
const shipOk3=s=>phoneOk(normPhone(s.phone))&&s.name.trim()&&s.addr&&whCodes().includes(s.wh)&&+s.kg>0&&s.items.trim()&&+s.qty>=1&&(s.pay!=='cod'||valOf(s)>0);
const parcel=s=>({area:s.addr.area,pay:s.pay,kg:kgOf3(s),origin:whArea(whByCode(s.wh)),val:valOf(s)});
const svcFor3=i=>X.map[i]!=null?X.map[i]:X.svc;
function openShip(){X=blank3();sx.hidden=false;document.body.style.overflow='hidden';document.body.classList.add('inflow');track('shipment_create_opened',{merchant:PS.mode});drawSx()}
function closeShip(){sx.hidden=true;document.body.style.overflow='';document.body.classList.remove('inflow')}
document.getElementById('sx-close').onclick=()=>go(SH.length?'monitoring':'shipments');
function stepOk(){const s=X.step;
  if(s===0)return!!WH.length&&(X.how==='bulk'?!!(X.bk&&X.bk.stage==='rows'&&!X.bk.fix&&!bkCounts().left):X.ships.length&&X.ships.every(shipOk3));
  if(s===1)return X.svc!=null;if(s===2)return X.day!=null&&X.slot!=null;if(s===4)return PS.bal>=costs().now;return true}
const sxSync=()=>{const b=document.getElementById('sx-next');if(b)b.disabled=!stepOk()};

/* costs: published rate − FLIK discount + COD fee + platform fee */
function costs(){const o={pub:0,disc:0,net:0,cod:0,codFee:0,plat:0,now:0,later:0,nCod:0,nNon:0,codTot:0};
  X.ships.forEach((s,i)=>{const si=svcFor3(i);if(si==null)return;const p=parcel(s),r=rateOf(si,p.origin,p.area,p.kg),cf=s.pay==='cod'?Math.round(p.val*CODFEE):0;
    o.pub+=r.pub;o.disc+=r.disc;o.net+=r.net;o.codFee+=cf;o.plat+=PLATFORM3;
    if(s.pay==='cod'){o.nCod++;o.codTot+=p.val;o.later+=r.net+cf+PLATFORM3}else{o.nNon++;o.now+=r.net+PLATFORM3}});
  o.total=o.pub-o.disc+o.codFee+o.plat;return o}

/* ---- manual entry ---- */
const inp3=(i,k,lab,ph,o={})=>`<div class="sx-f"><label for="s${i}${k}">${lab}</label><div class="${o.pre?'pre':o.unit?'unit':''}">${o.pre?`<em>${o.pre}</em>`:''}<input id="s${i}${k}" data-si="${i}" data-k="${k}" value="${esc(X.ships[i][k])}" placeholder="${ph}" ${o.num?'inputmode="numeric"':''}>${o.unit?`<em>${o.unit}</em>`:''}</div></div>`;
function shipCard(s,i){const ok=shipOk3(s),cod=s.pay==='cod';
  const sc=s.addr&&phoneOk(normPhone(s.phone))?shopperScore(s.phone,s.addr.area):null;
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

/* ---- courier step: smart recommendation, red zones ---- */
function courierHtml(){const P=X.ships.map(parcel),rec=recommend(P,X.group),n=X.ships.length;X.rec=rec;
  const R=rec.list.find(o=>o.i===rec.best),groups=[['reg','Regular'],['exp','Express'],['cargo','Cargo']];
  const lvl=P.filter(p=>srOf('jne',p.area).level==='city').length;
  return`<h2>Choose a courier</h2><p class="sx-lead">Prices cover all ${plural(n,'shipment')}. Delivery rates are from FLIK shipments to the same kecamatan over the last 90 days${lvl?`, or the city where a kecamatan has too few (${lvl} of ${n})`:''}.</p>
  ${R?`<section class="rec"><span class="bk-ai-ic">${ic('sparkle',16)}</span><div><b>Recommended: ${cName(R.k)} ${SERVICES[R.i][1]}</b><span>${fpct(R.sr)} delivered in your shoppers' areas${R.red.length?'':', with none of your parcels in its red zone'}. ${rp(R.net)} for ${plural(n,'shipment')}.</span></div>${X.svc===R.i?`<span class="st ok">${ic('check',13,2.4)}Selected</span>`:`<button class="btn btn-p" data-svc="${R.i}">Use ${cName(R.k)}</button>`}</section>`:''}
  <div class="seg sx-grp-seg" role="tablist">${groups.map(g=>`<button class="${X.group===g[0]?'on':''}" data-grp="${g[0]}">${g[1]}</button>`).join('')}</div>
  <div class="sx-grp">${COURIERS.map(c=>[c,rec.list.filter(o=>o.k===c.k)]).filter(r=>r[1].length).sort((a,b)=>Math.max(...b[1].map(o=>o.sr))-Math.max(...a[1].map(o=>o.sr))).map(([c,list])=>`<div class="sx-cr"><div class="nm">${cLogo(c.k)}${c.n}</div><div class="sx-svcs">${list.map(o=>{const sv=SERVICES[o.i],on=X.svc===o.i;
    return`<button class="sx-svc${on?' on':''}${o.red.length?' rz':''}" data-svc="${o.i}">${o.i===rec.best?'<span class="sx-tag">Recommended</span>':o.i===rec.cheap?'<span class="sx-tag ch">Cheapest</span>':''}<span class="n">${sv[1]}<span class="rdo${on?' on':''}"></span></span><span class="d">${etaOf(sv,sum(P,p=>zoneMul(p.origin,p.area))/n)}</span><span class="p num">${rp(o.net)}${o.pub>o.net?`<s>${rp(o.pub)}</s>`:''}</span>
      <span class="sr"><i style="width:${Math.max(0,(o.sr-60)/40*100)}%"></i></span><span class="srt">${fpct(o.sr)} delivered</span>${o.red.length?`<span class="rzt">${ic('warn',12)}${plural(o.red.length,'parcel')} in red zone</span>`:''}</button>`}).join('')}</div></div>`).join('')}</div>`}
function splitModal(){const sv=X.svc,red=X.ships.map((s,i)=>[s,i]).filter(([s])=>rzBlocks(SERVICES[sv][0],s.addr.area,s.pay)),k=SERVICES[sv][0];
  const plan=red.map(([s,i])=>[i,bestFor(parcel(s),X.group,X.rec.best)]),to=by(plan.filter(p=>p[1]!=null),p=>p[1]),drop=plan.filter(p=>p[1]==null);
  const areas=by(red,([s])=>s.addr.area.kec);
  track('red_zone_found',{courier:k,parcels:red.length,recommended:SERVICES[X.rec.best]?SERVICES[X.rec.best][0]:null});
  modal.classList.add('lg');
  modal.innerHTML=`<div class="mh"><h3>${plural(red.length,'shipment is','shipments are')} in ${cName(k)}'s red zone</h3><button class="ib" data-mclose aria-label="Close">${ic('x',18)}</button></div>
  <div class="mb"><p class="bk-mp">${cName(k)} doesn't deliver${Object.keys(areas).some(a=>rzOf(k,areas[a][0][0].addr.area)==='cod')?' COD':''} to these areas, so these parcels would come back. FLIK suggests sending them with the courier that delivers best there, and the rest with ${cName(k)} as you chose.</p>
  <table class="sevt"><thead><tr><th>Area</th><th>Parcels</th><th>${cName(k)}</th><th>Send with</th></tr></thead><tbody>${Object.entries(areas).map(([kec,l])=>{const t=bestFor(parcel(l[0][0]),X.group,X.rec.best);return`<tr><td><b>${kec}</b><span class="src">${l[0][0].addr.area.city}</span></td><td class="num">${l.length}</td><td><span class="st bad sm">${RZ_TX[rzOf(k,l[0][0].addr.area)]}</span></td><td>${t!=null?`<div class="sx-cl">${cLogo(SERVICES[t][0])}<span>${cName(SERVICES[t][0])} ${SERVICES[t][1]}</span></div><span class="src">${fpct(srOf(SERVICES[t][0],l[0][0].addr.area).sr)} delivered here</span>`:'No courier'}</td></tr>`}).join('')}</tbody></table>
  <div class="split-sum">${Object.entries(to).map(([t,l])=>`<span>${cLogo(SERVICES[t][0])}<b>${l.length}</b> with ${cName(SERVICES[t][0])}</span>`).join('')}<span>${cLogo(k)}<b>${X.ships.length-red.length}</b> with ${cName(k)}</span>${drop.length?`<span class="warn"><b>${drop.length}</b> can't be delivered</span>`:''}</div></div>
  <div class="mf split"><button class="lnk" data-mclose>Choose again</button><div style="display:flex;gap:8px">${X.rec.best!=null?`<button class="btn btn-o" id="sp-all">Send all with ${cName(SERVICES[X.rec.best][0])}</button>`:''}<button class="btn btn-p" id="sp-go">${ic('split',15)}Split and continue</button></div></div>`;
  mscrim.classList.add('open');
  document.getElementById('sp-go').onclick=()=>{X.map={};plan.forEach(([i,t])=>{if(t!=null)X.map[i]=t});track('red_zone_split',{courier:k,moved:plan.length});closeModal();X.step=2;drawSx();toast(`Split into ${Object.keys(to).length+1} couriers`)};
  const all=document.getElementById('sp-all');if(all)all.onclick=()=>{X.svc=X.rec.best;X.map={};closeModal();X.step=2;drawSx()}}

/* ---- pickups: one per courier and warehouse ---- */
function pickups(){const m={};X.ships.forEach((s,i)=>{const si=svcFor3(i),k=si+'|'+s.wh;(m[k]=m[k]||{svc:si,wh:s.wh,ships:[]}).ships.push(i)});return Object.values(m)}
const DAYS3=[0,1,2].map(i=>new Date(NOW.getFullYear(),NOW.getMonth(),NOW.getDate()+1+i));
const pickupTx3=()=>X.day==null?'—':`${DOW[DAYS3[X.day].getDay()]}, ${fday(DAYS3[X.day])} · ${SLOTS[X.slot]}`;
function reviewHtml(){const pk=pickups();
  return`<h2>Review shipments</h2><p class="sx-lead">Check everything before you book.</p>
  <section><div class="sx-h">Pickups · ${pickupTx3()}</div>${pk.map(p=>{const w=whByCode(p.wh);return`<div class="sx-card sx-whc"><span class="ic">${cLogo(SERVICES[p.svc][0])}</span><div><b>${cName(SERVICES[p.svc][0])} ${SERVICES[p.svc][1]} · ${plural(p.ships.length,'parcel')}</b><span>${esc(w.n)} (${w.code}) · ${esc(whAddr(w))}</span></div><button class="btn btn-o" data-go3="2">Edit</button></div>`}).join('')}</section>
  <section><div class="sx-h">Shipments</div><div class="tbl-wrap"><table class="rv"><thead><tr><th>#</th><th>Customer</th><th>Destination</th><th>From</th><th>Courier</th><th>Payment</th><th>Shopper score</th><th class="r">Shipping</th></tr></thead><tbody>
  ${X.ships.slice(X.rpg*50,X.rpg*50+50).map((s,j)=>{const i=X.rpg*50+j,si=svcFor3(i),p=parcel(s),r=rateOf(si,p.origin,p.area,p.kg);return`<tr><td class="rn">${i+1}</td><td><b>${esc(s.name)}</b><span class="src">${fphone(s.phone)}</span></td><td>${esc(s.addr.area.kec)}<span class="src">${esc(s.addr.area.city)}</span></td><td>${s.wh}</td><td><div class="sx-cl">${cLogo(SERVICES[si][0])}<span>${cName(SERVICES[si][0])}</span></div>${X.map[i]!=null?'<span class="src">Moved: red zone</span>':''}</td><td>${s.pay==='cod'?`<span class="st pu sm">COD</span> <span class="num">${rp(valOf(s))}</span>`:'<span class="st gr sm">Non-COD</span>'}</td><td>${scorePill(shopperScore(s.phone,s.addr.area))}</td><td class="r num">${rp(r.net)}</td></tr>`}).join('')}</tbody></table></div>
  ${X.ships.length>50?`<div class="foot"><span>Showing <b>${X.rpg*50+1}–${Math.min(X.ships.length,X.rpg*50+50)}</b> of <b>${X.ships.length}</b></span><div class="pager"><button class="btn btn-o" data-rpg="-1" ${X.rpg?'':'disabled'}>Previous</button><button class="btn btn-o" data-rpg="1" ${(X.rpg+1)*50<X.ships.length?'':'disabled'}>Next</button></div></div>`:''}${X.how==='manual'?`<div class="sx-row"><button class="btn btn-o" data-go3="0">Edit shipments</button></div>`:''}</section>`}
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
  ${c.nCod?`<p class="sx-foot-n">When all ${c.nCod} COD parcels are delivered, ${rp(c.codTot-c.later)} goes to your balance (${rp(c.codTot)} collected, minus ${rp(c.later)}).</p>`:''}`}
function doneHtml(){const d=X.done;return`<div class="sx-done"><div class="sx-ok"><i>${ic('check',18,2.6)}</i><b>${plural(d.n,'shipment')} booked<span>${d.batches.map(b=>b.id).join(' · ')}</span></b><button class="btn btn-o" data-toast="Printing ${d.n} shipping labels">${ic('print',15)}Print labels</button></div>
  <div class="sx-next">${d.batches.map(b=>`<div><span class="ic">${cLogo(b.k)}</span><b>${cName(b.k)} · ${plural(b.n,'parcel')}</b><span>Pickup from ${esc(b.whn)} on ${d.when}.</span></div>`).join('')}<div><span class="ic">${ic('pulse',19)}</span><b>Follow them in Monitoring</b><span>Anything delayed or at risk shows up there with what to do.</span></div></div>
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
  sxBody.innerHTML=`<div class="sx-in solo${wide?' wide':''}"><div class="sx-main">${main}</div></div>`;
  const c=st===4?costs():null;
  sxFoot.innerHTML=`${st?`<button class="btn btn-o" data-back>Back</button>`:''}<span class="sp"></span>${st===0&&X.how==='bulk'&&X.bk&&X.bk.rows?`<span class="foot-n">${plural(X.bk.rows.filter(r=>!r.removed).length,'order')}</span>`:''}<button class="btn btn-p" id="sx-next" ${stepOk()?'':'disabled'}>${st===4?(c.now?`Pay ${rp(c.now)} and book`:'Book shipments'):'Continue'}</button>`}

function sxNext(){
  if(X.step===0){if(X.how==='bulk')X.ships=X.bk.rows.filter(r=>!r.removed).map(bkShip);X.map={};X.svc=null;X.group='reg';track('shipment_details_done',{mode:X.how,rows:X.ships.length,cod:X.ships.filter(s=>s.pay==='cod').length})}
  if(X.step===1){const k=SERVICES[X.svc][0],red=X.ships.filter(s=>rzBlocks(k,s.addr.area,s.pay));track('courier_chosen',{courier:k,recommended:X.svc===X.rec.best});X.map={};if(red.length){splitModal();return}}
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
  setBal(PS.bal-c.now);ckDone('created');ckDone('paid');
  /* the first transaction tags the merchant: a new merchant becomes a Shipping merchant */
  if(!has('ship')){PS.flags=PS.mode==='new'?'ship':'payship';syncBar();track('merchant_tagged',{products:FLAGS[PS.flags].w.join('+')})}
  track('shipment_booked',{shipments:X.ships.length,batches:batches.length,cod:c.nCod,non_cod:c.nNon,paid_now:c.now,split:Object.keys(X.map).length>0});
  X.done={n:X.ships.length,batches,when};drawSx();sxBody.scrollTop=0}

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
  else if(d.grp){X.group=d.grp;X.svc=null}
  else if(d.svc!=null){X.svc=+d.svc}
  else if(d.day!=null)X.day=+d.day;
  else if(d.slot!=null)X.slot=+d.slot;
  else if(d.go3!=null)X.step=+d.go3;
  else if(d.rpg){X.rpg+=+d.rpg}
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
  if(t.dataset.si!=null&&t.tagName==='SELECT'){X.ships[t.dataset.si][t.dataset.k]=t.value;sxSync()}},true);
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
