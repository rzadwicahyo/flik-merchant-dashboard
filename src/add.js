/* ===== FLIK Shipping Phase 1 prototype (builds on Raam's reference dashboard) ===== */
Object.assign(P,{
  sparkle:'<path d="M12 3.5l1.8 4.7 4.7 1.8-4.7 1.8L12 16.5l-1.8-4.7L5.5 10l4.7-1.8z"/><path d="M18.5 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>',
  shield:'<path d="M12 3.5 5 6v5.5c0 4.2 2.9 7.6 7 9 4.1-1.4 7-4.8 7-9V6z"/><path d="m9 12 2 2 4-4"/>',
  mail:'<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="m4 7 8 6 8-6"/>',
  route:'<circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h7.5a3.5 3.5 0 0 0 0-7h-7a3.5 3.5 0 0 1 0-7H16"/>',
  percent:'<path d="M18 6 6 18"/><circle cx="7.5" cy="7.5" r="2"/><circle cx="16.5" cy="16.5" r="2"/>',
  pulse:'<path d="M3 12h4l2.5-6 5 12 2.5-6h4"/>',
  book:'<path d="M5 4.5h10a3 3 0 0 1 3 3v12H8a3 3 0 0 1-3-3z"/><path d="M5 16.5a3 3 0 0 1 3-3h10"/>'
});
const DAY=864e5,HOUR=36e5;
const PS={mode:'new',verified:false,vd:{},vStep:0,vLater:false,first:{addr:false,created:false,paid:false},pay:{link:false,checkout:false},fund:{apply:false},prod:'shipping',ckClosed:{},events:[],dr:30,hTab:'shipping',hDays:30,ops:'ops@arunastudio.id',owner:'owner@arunastudio.id',alertsSeen:false};
const WH_ALL=WAREHOUSES.slice();
const esc=v=>String(v??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ago=d=>{const h=(NOW-d)/HOUR;if(h<1)return'Just now';if(h<24)return`${Math.floor(h)} h ago`;const n=Math.floor(h/24);return n===1?'1 day ago':`${n} days ago`};
const normPhone=p=>{let d=String(p||'').replace(/\D/g,'');if(d.startsWith('0'))d='62'+d.slice(1);else if(d.startsWith('8'))d='62'+d;return d};
const phoneOk=p=>/^62\d{9,12}$/.test(normPhone(p));
const fphone=p=>{const d=normPhone(p).slice(2);return'+62 '+d.slice(0,3)+'-'+d.slice(3,7)+'-'+d.slice(7)};
const localPhone=p=>{const d=normPhone(p).slice(2);return d.slice(0,3)+'-'+d.slice(3,7)+'-'+d.slice(7)};

/* ===== Event tracker (R4): first-party, no shopper data ===== */
function track(name,props={}){PS.events.unshift({name,props,at:new Date()});const n=document.getElementById('pt-evn');if(n)n.textContent=PS.events.length}

/* ===== Statuses, problems and severity (appendix, R12, R13) ===== */
const SL={pay:['Awaiting payment','warn'],ready:['Ready for pickup','pu'],transit:['In transit','gr'],delivered:['Delivered','ok'],credited:['Delivered, COD credited','ok'],
  dfail:['Delivery failed','bad'],pfail:['Pickup failed','bad'],returning:['Returning to you','warn'],returned:['Returned','gr'],lost:['Lost or damaged','bad'],cancelled:['Cancelled','gr']};
const sPill2=s=>`<span class="st ${SL[s][1]}">${SL[s][0]}${s==='delivered'||s==='credited'?ic('check',13,2.2):''}</span>`;
const SEVC={Critical:'bad',High:'warn',Medium:'pu'};
const sevPill=(sv,sm)=>`<span class="st ${SEVC[sv]}${sm?' sm':''}">${sv}</span>`;
const PROB={
  pfail:{l:'Pickup failed',sev:'Critical',next:'Reschedule the pickup.',act:'Reschedule pickup'},
  dfail:{l:'Delivery failed',sev:'Critical',next:'Confirm the address and phone with the shopper, then request redelivery.',act:'Request redelivery'},
  lost:{l:'Lost or damaged',sev:'Critical',next:'File a claim.',act:'File a claim'},
  stuck4:{l:'No update for 4 days',sev:'High',next:'Ask FLIK support to chase the courier.',act:'Ask FLIK support'},
  returning:{l:'Return in process',sev:'High',next:'Contact the shopper to save the order, or get ready to receive the return.',act:'Contact shopper'},
  stuck2:{l:'No update for 48 hours',sev:'Medium',next:'Wait one more day, or ask FLIK support to chase the courier.',act:'Ask FLIK support'},
  codpend:{l:'COD pending',sev:'Medium',next:'See when the COD will be credited.',act:'View COD timeline'}};
const PORDER=['pfail','dfail','lost','stuck4','returning','stuck2','codpend'];
function probOf(s){if(s.handled)return null;
  if(s.st==='pfail'||s.st==='dfail'||s.st==='lost'||s.st==='returning')return s.st;
  if(s.st==='transit'){const h=(NOW-s.upd)/HOUR;return h>=96?'stuck4':h>=48?'stuck2':null}
  if(s.st==='delivered'&&s.cod&&(NOW-s.upd)>=DAY)return'codpend';return null}

/* ===== Example shipments for the active merchant (seeded) ===== */
const AREAS=[['Coblong','Dago','Kota Bandung','Jawa Barat','40135'],['Tebet','Tebet Barat','Jakarta Selatan','DKI Jakarta','12810'],['Gubeng','Airlangga','Kota Surabaya','Jawa Timur','60286'],['Medan Baru','Darat','Kota Medan','Sumatera Utara','20153'],
  ['Denpasar Barat','Dauh Puri','Kota Denpasar','Bali','80113'],['Gedongtengen','Sosromenduran','Kota Yogyakarta','DI Yogyakarta','55271'],['Semarang Tengah','Sekayu','Kota Semarang','Jawa Tengah','50132'],['Panakkukang','Pandang','Kota Makassar','Sulawesi Selatan','90231']]
  .map(a=>({kec:a[0],kel:a[1],city:a[2],prov:a[3],zip:a[4]}));
const STREETS=['Jl. Ir. H. Juanda No. 120','Jl. Tebet Raya No. 45','Jl. Diponegoro No. 3','Jl. Sei Batang Hari No. 7','Jl. Gajah Mada No. 18','Jl. Dagen No. 12','Jl. Pemuda No. 21','Jl. Boulevard No. 9'];
const AWBP={spx:'SPXID0',jnt:'JP',jne:'JNE0',ninja:'NLIDAP',lion:'99LP',sicepat:'0045',anteraja:'1000'};
const mkAwb=k=>AWBP[k]+String(Math.floor(1e9+rnd()*8.9e9));
const SVC_IDX={spx:SERVICES.findIndex(v=>v[0]==='spx'&&v[1]==='Standard'),jnt:SERVICES.findIndex(v=>v[0]==='jnt'),jne:SERVICES.findIndex(v=>v[0]==='jne'&&v[1]==='Regular')};
const ITEMS=['Linen shirt x2','Canvas tote bag x1','Batik dress x1','Leather sneakers x1','Voile scarf x3','Basic tee x3','Wide-leg trousers x1'];
let SH=[],shpSeq=0;
function genActive(){seed=4242;const out=[];
  const FORCE={1:'pfail',3:'dfail',8:'dfail',15:'dfail',20:'lost',5:'returning',11:'returning',18:'returning',24:'returning',12:'stuck4',16:'stuck4',21:'stuck4',26:'stuck4',6:'stuck2',7:'stuck2',10:'stuck2',14:'stuck2',17:'stuck2',19:'stuck2',9:'codpend',23:'codpend'};
  for(let i=0;i<420;i++){
    const created=new Date(NOW.getTime()-i*.87*DAY-rnd()*.4*DAY-2*HOUR),age=(NOW-created)/DAY;
    const ck=rnd()<.9?'spx':rnd()<.6?'jnt':'jne',svc=SERVICES[SVC_IDX[ck]],cod=rnd()<.88,a=AREAS[Math.floor(rnd()*AREAS.length)],kg=Math.max(1,Math.round(rnd()*2));
    let st,upd;const f=FORCE[i];
    if(f==='stuck4'){st='transit';upd=new Date(NOW-(4.2+rnd()*1.5)*DAY)}
    else if(f==='stuck2'){st='transit';upd=new Date(NOW-(2.1+rnd()*1.4)*DAY)}
    else if(f==='codpend'){st='delivered';upd=new Date(NOW-(1.3+rnd())*DAY)}
    else if(f){st=f;upd=new Date(NOW-(2+rnd()*10)*HOUR)}
    else if(age<.4){st=rnd()<.35?'pay':'ready';upd=created}
    else if(age<1.4){st=rnd()<.25?'ready':'transit';upd=new Date(NOW-rnd()*10*HOUR)}
    else if(age<5){const r=rnd();st=r<.5?'transit':'delivered';upd=new Date(NOW-rnd()*20*HOUR);if(st==='delivered'&&cod)st='credited'}
    else{const r=rnd();st=cod?(r<.14?'returned':'credited'):(r<.03?'returned':'delivered');upd=new Date(created.getTime()+(3+rnd()*3)*DAY);if(r>.985)st='cancelled'}
    if(upd>NOW)upd=new Date(NOW-HOUR);
    out.push({id:'s'+(++shpSeq),awb:st==='pay'?null:mkAwb(ck),order:'ORD-'+(52800-i),name:CUST[Math.floor(rnd()*CUST.length)],phone:'62812'+String(Math.floor(1e7+rnd()*8.9e7)),area:a,street:STREETS[AREAS.indexOf(a)],
      svc,cod,codv:cod?Math.round((99000+rnd()*480000)/1000)*1000:0,cost:kg*svc[4],st,created,upd,wh:WH_ALL[i%4===3?1:0],items:pick(ITEMS),kg,handled:null});
  }
  return out}

/* ===== Prototype bar (not part of the product) ===== */
document.body.insertAdjacentHTML('beforeend',`<div class="pt" role="region" aria-label="Prototype controls"><b>Prototype</b>
  <div class="seg" role="tablist" aria-label="Merchant"><button data-mode="new">New merchant</button><button data-mode="active">Active merchant</button></div>
  <button class="pb" data-pt="guide">${ic('book',14)}Guide</button><button class="pb" data-pt="events">${ic('pulse',14)}Events <span class="n" id="pt-evn">0</span></button></div>`);
document.querySelector('.pt').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
  if(b.dataset.mode){setMode(b.dataset.mode);return}
  if(b.dataset.pt==='guide')guideModal();if(b.dataset.pt==='events')eventsDrawer()});
function setMode(m){PS.mode=m;PS.vd={};PS.vStep=0;PS.vLater=false;PG.tab='all';PG.prob=null;PG.page=0;
  if(m==='new'){PS.verified=false;PS.first={addr:false,created:false,paid:false};WAREHOUSES.length=0;SH=[]}
  else{PS.verified=true;PS.first={addr:true,created:true,paid:true};WAREHOUSES.length=0;WAREHOUSES.push(...WH_ALL);SH=genActive()}
  PS.alertsSeen=false;document.querySelectorAll('.pt [data-mode]').forEach(x=>x.classList.toggle('on',x.dataset.mode===m));
  const bell=document.getElementById('bell');if(!bell.querySelector('.dot')&&m==='active')bell.insertAdjacentHTML('beforeend','<span class="dot"></span>');if(m==='new')bell.querySelector('.dot')?.remove();
  if(location.hash==='#shipments/create')location.hash='home';else show(hashView())}
function guideModal(){
  modal.classList.add('wide');
  modal.innerHTML=`<div class="mh"><h3>What to try</h3><button class="ib" data-mclose aria-label="Close">${ic('x',18)}</button></div>
  <div class="mb guide"><p class="vf-lead">FLIK Shipping Phase 1, built on Raam's reference dashboard. Everything here is example data. The dark bar at the bottom switches between a new and an active merchant.</p>
  <ol>
  <li><b>New merchant:</b> Home and Shipping show the checklist, and Shipping shows the explainer. Every menu opens without verifying. <span class="r">R1, R6, R7</span></li>
  <li><b>Create a shipment:</b> verification is asked once, at payment. "Remind me later" keeps the shipment and the form. <span class="r">R5</span></li>
  <li><b>Bulk upload:</b> in Create shipment, choose Bulk upload and try "Your own order export". AI matches the columns, then you fix rows on screen. <span class="r">R10, R11</span></li>
  <li><b>Active merchant:</b> Shipments has Needs Action with severity, suggested next steps and a date range. The bell shows alerts and the email previews. <span class="r">R12, R13</span></li>
  <li><b>Export:</b> the report downloads straight away and previews the ideal columns. <span class="r">R8, R9</span></li>
  <li><b>Events:</b> each tracked event, with no shopper data. <span class="r">R4</span></li></ol>
  <p class="vf-lead">There are no ad pixels or Google Ads tags on any page, and the product is named FLIK Shipping throughout (R2, R3). Downloads and emails are simulated.</p></div>
  <div class="mf"><button class="btn btn-p" data-mclose>Start</button></div>`;
  mscrim.classList.add('open')}
function eventsDrawer(){
  drawer.innerHTML=`<div class="dh"><span class="kind">${ic('pulse',15)}Tracked events</span><button class="ib" data-dclose aria-label="Close">${ic('x',18)}</button></div>
  <div class="db"><p class="d-sub" style="margin:0 0 14px">Stored in FLIK's own event store and read in Metabase. Each event carries merchant id, user id, time and page. No shopper names, phones, addresses or AWBs.</p>
  <div class="ev">${PS.events.length?PS.events.map(e=>`<div class="ev-i"><div class="hd"><b>${e.name}</b><time>${String(e.at.getHours()).padStart(2,'0')}:${String(e.at.getMinutes()).padStart(2,'0')}:${String(e.at.getSeconds()).padStart(2,'0')}</time></div>${Object.keys(e.props).length?`<pre>${esc(JSON.stringify(e.props))}</pre>`:''}</div>`).join(''):'<p class="d-sub">No events yet.</p>'}</div></div>`;
  drawer.classList.add('open');dscrim.classList.add('open');drawer.setAttribute('aria-hidden','false');drawer.querySelector('[data-dclose]').onclick=closeDetail}
mscrim.addEventListener('click',e=>{if(!mscrim.classList.contains('open'))setTimeout(()=>modal.classList.remove('wide','xl','lg'),200)});
const _closeModal=closeModal;closeModal=function(){_closeModal();modal.classList.remove('wide','xl','lg')};

function ckDone(k){if(PS.first[k])return;PS.first[k]=true;track('checklist_step_done',{step:k})}
document.addEventListener('click',e=>{const b=e.target.closest('[data-ck]');if(!b)return;const k=b.dataset.ck;
  if(k==='addr')addWhModal();else if(k==='created')location.hash='shipments/create';else{const p=SH.find(s=>s.st==='pay');if(p)payPending(p.id);else location.hash='shipments/create'}});
function addWhModal(after){
  modal.innerHTML=`<div class="mh"><h3>Add pickup address</h3><button class="ib" data-mclose aria-label="Close">${ic('x',18)}</button></div>
  <div class="mb"><div class="fld"><label for="wn">Name</label><input id="wn" value="Main warehouse"></div><div class="fld"><label for="wa">Full address</label><input id="wa" value="Jl. Kemang Raya No. 12, Bangka, Mampang Prapatan, Jakarta Selatan, DKI Jakarta 12730"></div><div class="fld"><label for="wp">Contact phone</label><input id="wp" value="+62 812-3456-7890"></div></div>
  <div class="mf"><button class="btn btn-o" data-mclose>Cancel</button><button class="btn btn-p" id="wsave">Save address</button></div>`;
  mscrim.classList.add('open');
  document.getElementById('wsave').onclick=()=>{WAREHOUSES.push({n:document.getElementById('wn').value||'Main warehouse',a:document.getElementById('wa').value});ckDone('addr');closeModal();toast('Pickup address saved');if(after)after();else show(hashView())}}

/* ===== Verification only when money moves (R5) ===== */
const VSEC=[['Business owner',[['pic','PIC phone number','+62 812-3456-7890'],['nik','NIK','16 digits'],['ktp','KTP photo','file']]],
  ['Bank account',[['bank','Bank','select'],['acct','Account number','e.g. 1234567890'],['holder','Account holder name','As shown in your bank']]],
  ['Business',[['brand','Brand name','e.g. Aruna Studio'],['npwp','NPWP','15 or 16 digits'],['nib','NIB','13 digits']]]];
const VACT={create_shipment:'pay for shipments',top_up:'top up your balance',create_invoice:'send invoices',resume:'move money'};
const vDone=i=>VSEC[i][1].every(f=>String(PS.vd[f[0]]||'').trim());
function vBanner(){if(PS.verified||!PS.vLater)return'';const n=[0,1,2].filter(vDone).length;
  return`<div class="vb">${ic('shield',18)}<div class="tx"><b>Finish verifying your business</b><span>${n} of 3 sections done. You need it before paying for shipments, topping up or withdrawing.</span></div><button class="btn btn-p" data-vresume>Resume</button></div>`}
document.addEventListener('click',e=>{if(e.target.closest('[data-vresume]'))verifyGate('resume',null)});
function verifyGate(action,cont){
  track('verification_prompted',{action});PS.vStep=Math.min(PS.vStep,2);
  const draw=()=>{const i=PS.vStep,sec=VSEC[i];
    modal.classList.add('wide');
    modal.innerHTML=`<div class="mh"><h3>Verify your business</h3><button class="ib" data-vlater aria-label="Close">${ic('x',18)}</button></div>
    <div class="mb"><p class="vf-lead">FLIK verifies every business before money moves. You need it once to ${VACT[action]}.${cont?' Your work is saved, and you return to it right after.':''}</p>
    <div><div class="vf-steps">${VSEC.map((_,k)=>`<i class="${k<=i?'on':''}"></i>`).join('')}</div><p class="vf-lead" style="margin-top:8px">${i+1} of 3 · <b style="color:var(--ink)">${sec[0]}</b></p></div>
    <div class="vf-g">${sec[1].map(f=>f[2]==='file'?`<div class="fld" style="grid-column:1/-1"><label>${f[1]}</label><button class="vf-up${PS.vd[f[0]]?' set':''}" data-vfile="${f[0]}">${ic(PS.vd[f[0]]?'check':'upload',16)}${PS.vd[f[0]]?'ktp-photo.jpg uploaded':'Upload a clear photo of the KTP'}</button></div>`
      :f[2]==='select'?`<div class="fld"><label for="v-${f[0]}">${f[1]}</label><select id="v-${f[0]}" data-v="${f[0]}"><option value="">Choose bank</option>${['BCA','Mandiri','BNI','BRI','CIMB Niaga'].map(b=>`<option ${PS.vd[f[0]]===b?'selected':''}>${b}</option>`).join('')}</select></div>`
      :`<div class="fld"><label for="v-${f[0]}">${f[1]}</label><input id="v-${f[0]}" data-v="${f[0]}" value="${esc(PS.vd[f[0]]||'')}" placeholder="${f[2]}"></div>`).join('')}</div>
    <button class="lnk" style="justify-self:start;color:var(--primary);font-weight:500;font-size:13px" data-vfill>Fill with example data</button></div>
    <div class="mf split"><button class="lnk" data-vlater>Remind me later</button><div style="display:flex;gap:8px">${i?'<button class="btn btn-o" data-vback>Back</button>':''}<button class="btn btn-p" id="vnext" ${vDone(i)?'':'disabled'}>${i<2?'Continue':'Submit and continue'}</button></div></div>`;
    modal.oninput=modal.onchange=e=>{const k=e.target.dataset.v;if(k){PS.vd[k]=e.target.value;document.getElementById('vnext').disabled=!vDone(PS.vStep)}};
    modal.onclick=e=>{const b=e.target.closest('button');if(!b)return;
      if(b.dataset.vfile){PS.vd[b.dataset.vfile]='ktp-photo.jpg';draw()}
      else if('vfill' in b.dataset){const ex={pic:'+62 812-3456-7890',nik:'3174012345678901',ktp:'ktp-photo.jpg',bank:'BCA',acct:'5271234567',holder:'Aruna Studio',brand:'Aruna Studio',npwp:'01.234.567.8-901.000',nib:'9120001234567'};VSEC[i][1].forEach(f=>PS.vd[f[0]]=ex[f[0]]);draw()}
      else if('vback' in b.dataset){PS.vStep--;draw()}
      else if('vlater' in b.dataset){PS.vLater=true;modal.onclick=modal.oninput=modal.onchange=null;closeModal();toast('Saved. Resume from Home or Shipping');refreshPage()}
      else if(b.id==='vnext'&&!b.disabled){if(i<2){PS.vStep++;draw();return}
        PS.verified=true;PS.vLater=false;track('verification_completed',{action});modal.onclick=modal.oninput=modal.onchange=null;closeModal();
        toast(cont?'Business verified. Continuing where you left off':'Business verified');refreshPage();if(cont)setTimeout(cont,250)}};
  };
  draw();mscrim.classList.add('open')}
function refreshPage(){const v=hashView();if(v==='home')renderHomeExtra();if(v==='shp'&&sx.hidden)renderShp()}

/* ===== Home additions (renderHomeExtra lives in add2.js) ===== */
document.querySelector('#view-home h1').insertAdjacentHTML('afterend','<div id="home-extra"></div>');
document.addEventListener('click',e=>{if(e.target.closest('[data-gona]')){PG.tab='na';PG.prob=null;PG.page=0;if(location.hash==='#shipments')renderShp();else location.hash='shipments'}});

/* ===== Shipments page (R6 explainer, R12 Needs Action, date range) ===== */
const ART_SHP=document.getElementById('es-art-shp').innerHTML;
const PG={tab:'all',prob:null,page:0};const PER2=20;
const inRange=s=>s.created>=new Date(NOW-PS.dr*DAY);
function naCounts(){const c={total:0,sev:{Critical:0,High:0,Medium:0},p:{}};SH.filter(inRange).forEach(s=>{const p=probOf(s);if(p){c.total++;c.sev[PROB[p].sev]++;c.p[p]=(c.p[p]||0)+1}});return c}
const STABS2=[['all','All'],['na','Needs action'],['pay','Awaiting payment'],['ready','Ready for pickup'],['transit','In transit'],['delivered','Delivered'],['returned','Returned']];
const tabMatch=(s,t)=>t==='all'||(t==='na'?!!probOf(s):t==='delivered'?(s.st==='delivered'||s.st==='credited'):t==='returned'?(s.st==='returned'||s.st==='returning'):s.st===t);
const cName=k=>COURIERS.find(c=>c.k===k).n;
document.getElementById('view-shp').addEventListener('click',e=>{
  const b=e.target.closest('button');
  if(b){const d=b.dataset;
    if(d.stb2){PG.tab=d.stb2;PG.prob=null;PG.page=0;renderShp();return}
    if(d.prob!=null){PG.prob=d.prob||null;PG.page=0;renderShp();return}
    if(d.pg){PG.page+=+d.pg;renderShp();scrollTo(0,0);return}
    if(d.act){e.stopPropagation();doAction(d.act);return}
    if('excta' in d){track('explainer_cta_clicked',{page:'shipments'});return}
    if('report' in d){reportModal();return}
    if('alertset' in d){alertSettings();return}
    if(b.id==='drchip'){e.stopPropagation();if(popFor===b){closePop();return}popFor=b;
      pop.innerHTML=`<h6>Created</h6>${[7,30,90].map(n=>`<button class="opt" data-n="${n}"><span class="rdo${PS.dr===n?' on':''}"></span>Last ${n} days</button>`).join('')}`;
      pop.querySelectorAll('[data-n]').forEach(o=>o.onclick=()=>{PS.dr=+o.dataset.n;PG.page=0;closePop();renderShp()});placePop(b);return}
    return}
  const tr=e.target.closest('tr[data-sid]');if(tr)openShipment(tr.dataset.sid)});

/* Shipment detail drawer */
function openShipment(id){const s=SH.find(x=>x.id===id);if(!s)return;const p=probOf(s);
  const tl=[];const t0=s.created;tl.push([t0,'Shipment created','']);
  if(s.st!=='pay'&&s.st!=='cancelled'){tl.push([new Date(t0.getTime()+5*60000),'Paid from FLIK balance','']);if(s.st!=='ready'&&s.st!=='pfail')tl.push([new Date(t0.getTime()+20*HOUR),'Picked up by courier','']);
    if(s.st==='pfail')tl.push([s.upd,'Pickup failed: courier could not reach the pickup address','pu']);
    if(['transit','delivered','credited','dfail','returning','returned','lost'].includes(s.st))tl.push([new Date(Math.min(s.upd,t0.getTime()+30*HOUR)),'Arrived at sorting hub, '+s.area.city.replace('Kota ',''),'']);
    if(s.st==='dfail')tl.push([s.upd,'Delivery failed: shopper not at home','pu']);
    if(s.st==='returning'||s.st==='returned')tl.push([new Date(s.upd-DAY),'Delivery failed 2 times, returning to sender',''],[s.upd,s.st==='returned'?'Returned to your warehouse':'Return in transit','pu']);
    if(s.st==='lost')tl.push([s.upd,'Courier reported the parcel as damaged','pu']);
    if(s.st==='delivered'||s.st==='credited')tl.push([s.upd,'Delivered','ok']);
    if(s.st==='credited')tl.push([new Date(s.upd.getTime()+DAY),`COD ${rp(s.codv)} credited to your FLIK balance`,'ok'])}
  if(s.handled)tl.push([NOW,s.handled,'pu']);
  drawer.innerHTML=`<div class="dh"><span class="kind">${ic('truck',15)}Shipment</span><button class="ib" data-dclose aria-label="Close">${ic('x',18)}</button></div>
  <div class="db"><div class="d-amt"><b class="mono" style="font-size:20px">${s.awb||'Awaiting payment'}</b>${sPill2(s.st)}</div><p class="d-sub">${cName(s.svc[0])} ${s.svc[1]} · ${SVCKIND(s.svc)} · ${s.cod?'COD':'Non-COD'} · created ${fdateY(s.created)}</p>
  ${p?`<div class="dprob"><div class="hd">${sevPill(PROB[p].sev)}<b>${PROB[p].l}</b></div><p><b style="font-weight:500">Suggested next step:</b> ${PROB[p].next}</p><button class="btn btn-p" data-act="${s.id}">${PROB[p].act}</button></div>`:s.handled?`<div class="dprob ok">${s.handled}</div>`:''}
  ${s.st==='pay'?`<div class="d-acts"><button class="btn btn-p" data-paynow="${s.id}">Pay now</button></div>`:''}
  <div class="dsec"><h5>Tracking</h5><div class="tl">${tl.reverse().map(x=>`<div class="tli ${x[2]}"><i></i><div><b>${x[1]}</b><span>${fdateY(x[0])}</span></div></div>`).join('')}</div></div>
  ${(s.st==='delivered'||s.st==='credited')?`<div class="dsec"><h5>Proof of delivery</h5><div class="pod"><span class="ph">${ic('pkg',26,1.4)}</span><div><b style="color:var(--ink);font-size:13.5px;display:block">Received by ${esc(s.name.split(' ')[0])}${s.cod?', paid in cash':''}</b><span class="vf-lead">${cName(s.svc[0])} courier photo · ${fdateY(s.upd)}</span><button class="lnk" style="color:var(--primary);font-weight:500;font-size:13px;margin-top:6px" data-toast="Opens the full-size photo">View photo</button></div></div></div>`:''}
  <div class="dsec"><h5>Customer</h5><dl class="kv"><dt>Name</dt><dd>${esc(s.name)}</dd><dt>Phone</dt><dd>${fphone(s.phone)}</dd><dt>Address</dt><dd>${esc(s.street)}, ${[s.area.kel,s.area.kec,s.area.city,s.area.prov].filter(Boolean).map(esc).join(', ')} ${s.area.zip}</dd></dl></div>
  <div class="dsec"><h5>Package and payment</h5><dl class="kv"><dt>Contents</dt><dd>${esc(s.items)}</dd><dt>Weight</dt><dd>${s.kg} kg</dd><dt>Payment</dt><dd>${s.cod?'COD':'Non-COD'}</dd>${s.cod?`<dt>COD amount</dt><dd class="num">${rp(s.codv)}</dd>`:''}<dt>Shipping cost</dt><dd class="num">${rp(s.cost)}</dd><dt>Pickup from</dt><dd>${s.wh?s.wh.n:'Main warehouse'}</dd></dl></div></div>`;
  drawer.classList.add('open');dscrim.classList.add('open');drawer.setAttribute('aria-hidden','false');
  drawer.querySelector('[data-dclose]').onclick=closeDetail;
  drawer.querySelectorAll('[data-act]').forEach(b=>b.onclick=()=>doAction(b.dataset.act));
  drawer.querySelectorAll('[data-paynow]').forEach(b=>b.onclick=()=>{closeDetail();payPending(b.dataset.paynow)})}

/* Suggested next steps (rule-based; AI triage comes later) */
function doAction(id){const s=SH.find(x=>x.id===id),p=probOf(s);if(!p)return;
  const done=(msg,tst)=>{s.handled=msg;if(p==='pfail')s.st='ready';track('needs_action_step_taken',{problem:p,step:PROB[p].act});closeModal();closeDetail();toast(tst||msg);renderShp();renderHomeExtra()};
  const head=t=>`<div class="mh"><h3>${t}</h3><button class="ib" data-mclose aria-label="Close">${ic('x',18)}</button></div>`;
  const sub=`<p class="vf-lead"><span class="mono">${s.awb}</span> · ${esc(s.name)}, ${esc(s.area.city)}</p>`;
  let body='',btn='',fn=null;
  if(p==='pfail'){let di=0,si=0;const drawP=()=>{modal.innerHTML=head('Reschedule pickup')+`<div class="mb">${sub}<div class="fld"><label>Day</label><div class="sx-slots">${DAYS.map((d,i)=>`<button class="${di===i?'on':''}" data-d="${i}">${i===0?'Tomorrow':DOW[d.getDay()]}, ${d.getDate()} ${MON[d.getMonth()]}</button>`).join('')}</div></div><div class="fld"><label>Time</label><div class="sx-slots">${SLOTS.map((t,i)=>`<button class="${si===i?'on':''}" data-s="${i}">${t}</button>`).join('')}</div></div></div><div class="mf"><button class="btn btn-o" data-mclose>Cancel</button><button class="btn btn-p" id="ago">Reschedule pickup</button></div>`;
      modal.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{di=+b.dataset.d;drawP()});modal.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>{si=+b.dataset.s;drawP()});
      document.getElementById('ago').onclick=()=>done(`Pickup rescheduled for ${DOW[DAYS[di].getDay()]}, ${fday(DAYS[di])}, ${SLOTS[si]}`,'Pickup rescheduled')};drawP();mscrim.classList.add('open');return}
  if(p==='dfail'){body=`${sub}<div class="fld"><label for="ra">Address</label><input id="ra" value="${esc(s.street)}, ${esc(s.area.kel)}, ${esc(s.area.kec)}, ${esc(s.area.city)} ${s.area.zip}"></div><div class="fld"><label for="rp2">Shopper phone</label><input id="rp2" value="${fphone(s.phone)}"></div><div class="fld"><label for="rn">Note for the courier</label><input id="rn" placeholder="e.g. Call before delivery, leave with security"></div>`;btn='Request redelivery';fn=()=>done('Redelivery requested')}
  if(p==='lost'){body=`${sub}<div class="fld"><label for="cv">Item value</label><input id="cv" class="num" value="${rp(s.codv||250000)}"></div><div class="fld"><label for="cd">What happened</label><input id="cd" value="Courier reported the parcel as damaged"></div><div class="fld"><label>Photos</label><button class="vf-up" data-toast="Photo added">${ic('upload',16)}Add photos of the parcel</button></div>`;btn='Submit claim';fn=()=>done('Claim submitted. FLIK replies within 3 working days','Claim submitted')}
  if(p==='stuck2'||p==='stuck4'){body=`${sub}<p>Last courier update was ${ago(s.upd).toLowerCase()}. FLIK support asks ${cName(s.svc[0])} for an update and tells you in this shipment's timeline.</p>`;btn='Ask FLIK support';fn=()=>done('FLIK support is chasing the courier','Request sent to FLIK support')}
  if(p==='returning'){body=`${sub}<p>The courier is bringing this parcel back after failed delivery attempts. Contact the shopper to save the order, or get ready to receive the return.</p><div class="vabox"><span class="kpi-l">Shopper WhatsApp</span><b class="num" style="font-size:17px;letter-spacing:0">${fphone(s.phone)}</b></div>`;btn='Mark as contacted';fn=()=>done('Shopper contacted')}
  if(p==='codpend'){body=`${sub}<div class="tl"><div class="tli ok"><i></i><div><b>Delivered</b><span>${fdateY(s.upd)}</span></div></div><div class="tli"><i></i><div><b>COD ${rp(s.codv)} confirmed by ${cName(s.svc[0])}</b><span>Expected ${fday(new Date(NOW.getTime()+DAY))}</span></div></div><div class="tli"><i></i><div><b>Credited to your FLIK balance</b><span>Same-day payout after confirmation</span></div></div></div>`;btn='Got it';fn=()=>{closeModal();track('needs_action_step_taken',{problem:p,step:'View COD timeline'})}}
  modal.innerHTML=head(PROB[p].act)+`<div class="mb">${body}</div><div class="mf"><button class="btn btn-o" data-mclose>Cancel</button><button class="btn btn-p" id="ago">${btn}</button></div>`;
  mscrim.classList.add('open');document.getElementById('ago').onclick=fn}

/* ===== Alerts: bell, email previews, recipients (R13) ===== */
const critAlerts=()=>SH.filter(s=>{const p=probOf(s);return p&&PROB[p].sev==='Critical'}).sort((a,b)=>b.upd-a.upd);
document.getElementById('bell').onclick=e=>{e.stopPropagation();const b=e.currentTarget;if(popFor===b){closePop();return}popFor=b;b.querySelector('.dot')?.remove();
  const cr=critAlerts(),c=naCounts();
  pop.innerHTML=`<div class="menu" style="width:340px"><h6>Alerts</h6>${PS.mode==='new'&&!SH.length?'<p style="padding:6px 10px 10px;color:var(--muted);font-size:13px">No alerts yet. Problems with your shipments show up here and by email.</p>':''}
  ${cr.slice(0,4).map(s=>{const p=probOf(s);return`<button class="alert-i" data-al="${s.id}">${sevPill('Critical',1)}<span class="tx"><b>${PROB[p].l}</b><span>${s.awb} · ${esc(s.name)}, ${esc(s.area.city)}</span></span><time>${ago(s.upd)}</time></button>`}).join('')}
  ${SH.length?`<button class="alert-i" data-al="sum">${ic('mail',16)}<span class="tx"><b>Daily summary sent</b><span>Today 08:00 WIB to ${PS.ops}: ${c.sev.High} High, ${c.sev.Medium} Medium</span></span><time>8 h ago</time></button>`:''}
  <div class="pop-acts"><button class="btn btn-o" data-emprev>${ic('mail',15)}Preview alert emails</button><button class="btn btn-o" data-alertset>Alert settings</button></div></div>`;
  pop.querySelectorAll('[data-al]').forEach(x=>x.onclick=()=>{closePop();if(x.dataset.al==='sum'){emailPreview('sum');return}const s=SH.find(y=>y.id===x.dataset.al);track('alert_opened',{problem:probOf(s),channel:'dashboard'});openShipment(s.id)});
  pop.querySelector('[data-emprev]').onclick=()=>{closePop();emailPreview('crit')};pop.querySelector('[data-alertset]').onclick=()=>{closePop();alertSettings()};
  placePop(b,true)};
function emailPreview(which){
  const cr=critAlerts()[0]||(SH[0]||{awb:'SPXID01234567890',name:'Rina Putri',area:AREAS[0],svc:SERVICES[SVC_IDX.spx],codv:459000,cod:true,st:'dfail'});
  const c=naCounts(),p=probOf(cr)||'dfail';
  const draw=()=>{modal.classList.add('wide');
    modal.innerHTML=`<div class="mh"><h3>Alert emails</h3><button class="ib" data-mclose aria-label="Close">${ic('x',18)}</button></div>
    <div class="mb"><div class="seg" role="tablist"><button class="${which==='crit'?'on':''}" data-w="crit">Critical alert</button><button class="${which==='sum'?'on':''}" data-w="sum">Daily summary</button></div>
    ${which==='crit'?`<div class="em"><div class="em-h"><span>To <b>${PS.ops}</b> (ops team)</span><span>Subject <b>Delivery problem: ${PROB[p].l}, ${cr.awb}</b></span><span>Sent straight away</span></div>
      <div class="em-b"><h4>${PROB[p].l}</h4><p>${cName(cr.svc[0])} reported a problem with a parcel to ${esc(cr.name)} in ${esc(cr.area.city)}.</p>
      <div><div class="em-row"><span>Tracking number</span><b class="mono">${cr.awb}</b></div><div class="em-row"><span>COD amount</span><b>${cr.cod?rp(cr.codv):'Non-COD'}</b></div><div class="em-row"><span>Suggested next step</span><b style="text-align:right;max-width:60%">${PROB[p].next}</b></div></div>
      <span class="btn btn-p">Open in FLIK</span><p class="em-note">You get one email per shipment and problem. FLIK Shipping, Aruna Studio.</p></div></div>`
    :`<div class="em"><div class="em-h"><span>To <b>${PS.ops}</b> (ops team)</span><span>Subject <b>${c.sev.High+c.sev.Medium} shipments need attention today</b></span><span>Every day at 08:00 WIB</span></div>
      <div class="em-b"><h4>Your shipments today</h4><p>Open High and Medium problems, grouped by type.</p>
      <div>${PORDER.filter(k=>PROB[k].sev!=='Critical'&&c.p[k]).map(k=>`<div class="em-row"><span>${sevPill(PROB[k].sev,1)} ${PROB[k].l}</span><b>${c.p[k]}</b></div>`).join('')||'<div class="em-row"><span>Nothing open</span><b>0</b></div>'}</div>
      <span class="btn btn-p">Open Needs Action</span><p class="em-note">Critical problems are emailed straight away, so they are not repeated here.</p></div></div>`}
    <p class="em-note">If no ops contact is set, alerts go to the account owner (${PS.owner}).</p></div>
    <div class="mf"><button class="btn btn-o" data-alertset2>Alert settings</button><button class="btn btn-p" data-mclose>Close</button></div>`;
    modal.querySelectorAll('[data-w]').forEach(b=>b.onclick=()=>{which=b.dataset.w;draw()});modal.querySelector('[data-alertset2]').onclick=alertSettings};
  draw();mscrim.classList.add('open');track('alert_opened',{problem:which==='crit'?p:'daily_summary',channel:'email'})}
function alertSettings(){
  modal.classList.add('wide');
  modal.innerHTML=`<div class="mh"><h3>Alert settings</h3><button class="ib" data-mclose aria-label="Close">${ic('x',18)}</button></div>
  <div class="mb"><div class="fld"><label for="opsm">Ops team email</label><input id="opsm" value="${esc(PS.ops)}" placeholder="Leave empty to use the account owner"><p class="hint">If this is empty, alerts go to the account owner, ${PS.owner}.</p></div>
  <div class="tbl-wrap" style="margin-top:0"><table class="sevt"><thead><tr><th>Severity</th><th>Problems</th><th>Dashboard</th><th>Email</th></tr></thead><tbody>
  ${['Critical','High','Medium'].map(sv=>`<tr><td>${sevPill(sv,1)}</td><td>${PORDER.filter(k=>PROB[k].sev===sv).map(k=>PROB[k].l).join(', ')}</td><td>${sv==='Medium'?'Badge on Needs Action':'Straight away'}</td><td>${sv==='Critical'?'Straight away, one per shipment':'Daily summary, 08:00 WIB'}</td></tr>`).join('')}</tbody></table></div>
  <p class="em-note">A shipment alerts once per problem. If it moves from 48 hours to 4 days without an update, only the higher alert is sent.</p></div>
  <div class="mf"><button class="btn btn-o" data-mclose>Cancel</button><button class="btn btn-p" id="opsave">Save</button></div>`;
  mscrim.classList.add('open');
  document.getElementById('opsave').onclick=()=>{const v=document.getElementById('opsm').value.trim();PS.ops=v||PS.owner;closeModal();toast(v?`Alerts go to ${v}`:`Alerts go to the account owner, ${PS.owner}`)}}

/* ===== Shipping report: one-click download, ideal columns (R8, R9) ===== */
const RCOLS=[['Order ID'],['Created'],['Payment type'],['Pickup from'],['Customer name'],['Customer phone'],['Address'],['Kelurahan'],['Kecamatan'],['City'],['Province'],['Postcode',1],['Product'],['Quantity'],['Item value'],['Declared weight (kg)'],['Dimensions (cm)'],['Charged weight (kg)',1],
  ['Courier'],['Service'],['Tracking number'],['Status'],['Last courier update'],['Courier note'],['Proof of delivery'],['Scheduled pickup'],['Actual pickup'],['Estimated delivery',1],['Delivered on'],['Delivery attempts',1],['Failure reason',1],['Returned on'],['Return reason',1],['Zone',1],
  ['Shipping fee'],['Discount'],['Shipping fee after discount'],['COD amount'],['COD fee'],['COD credited'],['COD credited on',1]];
function reportModal(){let dr=PS.dr;
  const n=()=>SH.filter(s=>s.created>=new Date(NOW-dr*DAY)).length;
  const draw=()=>{modal.classList.add('wide');
    modal.innerHTML=`<div class="mh"><h3>Download shipping report</h3><button class="ib" data-mclose aria-label="Close">${ic('x',18)}</button></div>
    <div class="mb"><div class="fld"><label>Created</label><div class="seg">${[7,30,90].map(x=>`<button class="${dr===x?'on':''}" data-r="${x}">Last ${x} days</button>`).join('')}</div></div>
    <div class="vf-g"><div class="fld"><label for="rc">Courier</label><select id="rc"><option>All couriers</option>${COURIERS.map(c=>`<option>${c.n}</option>`).join('')}</select></div><div class="fld"><label for="rs">Status</label><select id="rs"><option>All statuses</option>${Object.values(SL).map(x=>`<option>${x[0]}</option>`).join('')}</select></div></div>
    <p class="vf-lead">${n()} shipments, ${RCOLS.length} columns. The Excel file downloads to this device. No email link.</p></div>
    <div class="mf"><button class="btn btn-o" data-mclose>Cancel</button><button class="btn btn-p" id="rgo2">${ic('export',15)}Download report</button></div>`;
    modal.querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>{dr=+b.dataset.r;draw()});
    document.getElementById('rgo2').onclick=go};
  const go=()=>{const rows=n(),t0=Date.now();track('report_export_started',{date_range_days:dr,filters:0,rows});
    modal.querySelector('.mb').innerHTML=`<p style="color:var(--ink);font-weight:500">Building your report: ${rows} shipments</p><div class="rp-prog"><i id="rpi"></i></div><p class="vf-lead">Large reports are built on the server and stream to your device.</p>`;
    modal.querySelector('.mf').innerHTML='<button class="btn btn-o" data-mclose>Cancel</button>';
    requestAnimationFrame(()=>requestAnimationFrame(()=>{const i=document.getElementById('rpi');if(i)i.style.width='100%'}));
    setTimeout(()=>{if(!mscrim.classList.contains('open'))return;const fn=`flik-shipping-report-${fday(NOW).replace(/ /g,'-')}.xlsx`;track('report_downloaded',{date_range_days:dr,rows,seconds:Math.round((Date.now()-t0)/1000)});
      modal.classList.remove('wide');modal.classList.add('xl');
      const ex=SH.filter(s=>s.created>=new Date(NOW-dr*DAY)).slice(0,5);
      const cell=(s,c)=>{const a=s.area;switch(c){case'Order ID':return s.order;case'Created':return fdateY(s.created);case'Payment type':return s.cod?'COD':'Non-COD';case'Pickup from':return s.wh?s.wh.n:'';case'Customer name':return esc(s.name);case'Customer phone':return fphone(s.phone);case'Address':return esc(s.street);case'Kelurahan':return a.kel;case'Kecamatan':return a.kec;case'City':return a.city;case'Province':return a.prov;case'Postcode':return a.zip;
        case'Product':return esc(s.items.replace(/ x\d+$/,''));case'Quantity':return(s.items.match(/x(\d+)$/)||[0,1])[1];case'Item value':return rp(s.codv||199000);case'Declared weight (kg)':return s.kg;case'Dimensions (cm)':return'30 × 20 × 5';case'Charged weight (kg)':return s.kg;case'Courier':return cName(s.svc[0]);case'Service':return s.svc[1];case'Tracking number':return s.awb||'';case'Status':return SL[s.st][0];
        case'Last courier update':return fdateY(s.upd);case'Courier note':return s.st==='dfail'?'Shopper not at home':'';case'Proof of delivery':return(s.st==='delivered'||s.st==='credited')?'<span style="color:var(--primary)">View photo</span>':'';case'Scheduled pickup':return fday(new Date(s.created.getTime()+DAY));case'Actual pickup':return s.st==='pay'||s.st==='ready'?'':fday(new Date(s.created.getTime()+20*HOUR));
        case'Estimated delivery':return fday(new Date(s.created.getTime()+3*DAY));case'Delivered on':return(s.st==='delivered'||s.st==='credited')?fday(s.upd):'';case'Delivery attempts':return s.st==='dfail'?1:s.st==='returned'||s.st==='returning'?2:(s.st==='delivered'||s.st==='credited')?1:0;case'Failure reason':return s.st==='dfail'||s.st==='returned'?'Shopper not at home':'';case'Returned on':return s.st==='returned'?fday(s.upd):'';case'Return reason':return s.st==='returned'?'Refused by shopper':'';case'Zone':return a.prov==='DKI Jakarta'?'Intra-city':'Inter-island';
        case'Shipping fee':return rp(s.svc[5]?s.svc[5]*s.kg:s.cost);case'Discount':return rp((s.svc[5]?s.svc[5]*s.kg:s.cost)-s.cost);case'Shipping fee after discount':return rp(s.cost);case'COD amount':return s.cod?rp(s.codv):'';case'COD fee':return s.cod?rp(Math.round(s.codv*.03)):'';case'COD credited':return s.st==='credited'?rp(s.codv-Math.round(s.codv*.03)):'';case'COD credited on':return s.st==='credited'?fday(new Date(s.upd.getTime()+DAY)):'';default:return''}};
      modal.innerHTML=`<div class="mh"><h3>Report downloaded</h3><button class="ib" data-mclose aria-label="Close">${ic('x',18)}</button></div>
      <div class="mb"><div class="rp-done">${ic('check',16,2.4)}${fn} · ${rows} rows</div>
      <p class="vf-lead">Preview of the first rows (example data). Headers and statuses are in English, phone numbers keep every digit, and the legacy brand and internal columns are gone.</p>
      <div class="rp-pv"><table><thead><tr>${RCOLS.map(c=>`<th class="${c[1]?'gap':''}">${c[0]}</th>`).join('')}</tr></thead><tbody>${ex.map(s=>`<tr>${RCOLS.map(c=>`<td>${cell(s,c[0])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
      <span class="rp-legend"><i></i>Prototype note: FLIK's data doesn't hold this column yet. To discuss with the FLIK team.</span></div>
      <div class="mf"><button class="btn btn-p" data-mclose>Done</button></div>`},1500)};
  draw();mscrim.classList.add('open')}

/* ===== Create shipment hooks: warehouse, verification, saving ===== */
function pickupCard(){const w=WAREHOUSES[X.wh];
  return w?`<section><div class="sx-h">Pickup from</div><div class="sx-card sx-whc"><span class="ic">${ic('wh',18)}</span><div><b>${w.n}</b><span>${w.a}</span></div><button class="btn btn-o" data-wh>Change</button></div></section>`
    :`<section><div class="sx-h">Pickup from</div><div class="sx-card sx-whc"><span class="ic">${ic('wh',18)}</span><div><b>Add a pickup address</b><span>Couriers pick up your parcels from here.</span></div><button class="btn btn-p" data-addwh>Add address</button></div></section>`}
sxBody.addEventListener('click',e=>{if(e.target.closest('[data-addwh]'))addWhModal(()=>drawSx())});
function stepHook(){track('shipment_step_viewed',{step:SSTEPS[X.step],mode:X.how==='bulk'?'bulk':'single',cod:X.pay==='cod'});if(X.step===4)ckDone('created')}
function addCreated(c,sv,st){const out=[];
  X.ships.forEach(sh=>{const kg=kgOf(sh),area=sh.area||{kec:'',kel:'',city:sh.addr.city,prov:'',zip:sh.addr.zip};
    const cod=(sh.pay||'cod')==='cod',si=svcFor(X.ships.indexOf(sh)),svc=si!=null?SERVICES[si]:sv;
    out.push({id:'s'+(++shpSeq),awb:st==='pay'?null:mkAwb(svc[0]),order:'ORD-'+(52801+shpSeq),name:sh.name,phone:normPhone(sh.phone),area,street:sh.addr.street,svc,cod,codv:cod?codVal(sh):0,cost:svc[4]*kg,st,created:new Date(NOW.getTime()+60000),upd:new Date(NOW.getTime()+60000),wh:WAREHOUSES[whIx(sh.wh)],items:sh.items,kg,handled:null,pod:null})});
  SH.unshift(...out);track('shipment_created',{count:out.length,cod_rows:out.filter(o=>o.cod).length,non_cod_rows:out.filter(o=>!o.cod).length,courier:sv[0],service:sv[1],mode:X.how==='bulk'?'bulk':'single',paid:st!=='pay',warehouses:new Set(out.map(o=>o.wh&&o.wh.n)).size});
  if(X.how==='bulk')track('bulk_upload_submitted',{rows:out.length,rows_with_errors_left:0,reupload:false});
  ckDone('created');if(st!=='pay')ckDone('paid');PG.tab='all';return out}
document.getElementById('sx-close').onclick=()=>{
  if(X&&!X.done&&X.step===4){addCreated(costs(),SERVICES[X.svc],'pay');toast(`Saved. ${X.ships.length===1?'1 shipment is':X.ships.length+' shipments are'} waiting for payment`)}
  location.hash='shipments'};
function payPending(id){
  if(!PS.verified){verifyGate('create_shipment',()=>payPending(id));return}
  const s=SH.find(x=>x.id===id);const batch=SH.filter(x=>x.st==='pay'&&x.created.getTime()===s.created.getTime());
  batch.forEach(x=>{x.st='ready';x.awb=mkAwb(x.svc[0]);x.upd=new Date(NOW.getTime()+120000)});
  ckDone('paid');track('shipment_created',{count:batch.length,cod:s.cod,courier:s.svc[0],service:s.svc[1],mode:'single',paid:true});
  toast(`Paid ${rp(batch.reduce((a,x)=>a+x.cost,0)+PLATFORM)} from your FLIK balance`);show(hashView())}

/* ===== Bulk upload v1 + AI column mapping (R10, R11) ===== */
const FIELDS=[['order','Order ID'],['name','Customer name'],['phone','Customer phone'],['street','Full address'],['kec','Kecamatan'],['kel','Kelurahan'],['city','City'],['prov','Province'],['zip','Postcode'],['items','Product name'],['kg','Weight (kg)'],['pay','Payment method'],['cod','COD or item value'],['wh','Pickup from'],['note','Courier note'],['none',"Don't use"]];
const REQ=['name','phone','street','items','kg','cod'];
const OWN_MAP=[['No. Pesanan','INV/20261012/MPL/3381','order','High'],['Nama Penerima','Rina Putri','name','High'],['No. Telepon','0812-7781-2093','phone','High'],['Alamat Pengiriman','Jl. Ir. H. Juanda No. 120','street','High'],
  ['Kecamatan','Coblong','kec','High'],['Kota/Kabupaten','Kota Bandung','city','High'],['Provinsi','Jawa Barat','prov','High'],['Kode Pos','40135','zip','High'],['Nama Produk','Linen shirt, white, L x2','items','High'],
  ['Berat (gram)','800','kg','Medium','Converted from grams to kg'],['Total Pembayaran','Rp578.000','cod','Medium','Used as the COD amount for COD orders'],['Metode Pembayaran','COD','pay','High','COD rows ship as COD, the rest as non-COD'],['Gudang','Jakarta','wh','Medium','Matched to your pickup addresses'],['Catatan','Rumah pagar hijau','note','High'],['SKU Induk','KLP-W-L','none','Low','Not needed for shipping']]
  .map(m=>({col:m[0],ex:m[1],ai:m[2],to:m[2],conf:m[3],why:m[4]||''}));
const ZIPKEL={'40135':['Dago','Coblong'],'12810':['Tebet Barat','Tebet'],'20153':['Darat','Medan Baru'],'80113':['Dauh Puri','Denpasar Barat'],'50132':['Sekayu','Semarang Tengah'],'60286':['Airlangga','Gubeng'],'90231':['Pandang','Panakkukang'],'12730':['Bangka','Mampang Prapatan'],'55271':['Sosromenduran','Gedongtengen'],'60226':['Pradahkalikendal','Dukuh Pakis']};
const R=(name,phone,street,kec,kel,city,prov,zip,items,kg,dims,cod,x={})=>({name,phone,street,kec,kel,city,prov,zip,items,kg:String(kg),l:String(dims[0]),w:String(dims[1]),h:String(dims[2]),cod:String(cod),pay:'cod',wh:0,...x});
const OWN_ROWS=()=>[R('Rina Putri','0812-7781-2093','Jl. Ir. H. Juanda No. 120','Coblong','','Kota Bandung','Jawa Barat','40135','Linen shirt, white, L x2',0.8,[30,25,5],578000),
  R('Budi Santoso','6285733021184','Jl. Tebet Raya No. 45','Tebet','','Jakarta Selatan','DKI Jakarta','12810','Canvas tote bag x1',0.4,[35,30,3],149000,{pay:'non'}),
  R('Sari Wulandari','+62 878-9910-4432','Jl. Raya Darmo Permai III No. 9','Dukuh Pakis','','Kota Surabaya','Jawa Timur','','Batik dress, indigo x1',0.5,[30,25,5],375000,{sug:{zip:'60226',kel:'Pradahkalikendal',conf:'High'}}),
  R('Andi Pratama','0812-345','Jl. Sei Batang Hari No. 7','Medan Baru','','Kota Medan','Sumatera Utara','20153','Leather sneakers, 42 x1',1.2,[35,22,13],459000),
  R('Dewi Lestari','0857-1120-7781','Jl. Gajah Mada No. 18','Denpasar Barat','','Kota Denpasar','Bali','80113','Voile scarf, floral x3',0.3,[1,1,1],375000,{wh:1}),
  R('Rina Putri','0812-7781-2093','Jl. Ir. H. Juanda No. 120','Coblong','','Kota Bandung','Jawa Barat','40135','Linen shirt, white, L x2',0.8,[30,25,5],578000,{dupOf:0}),
  R('Fajar Nugroho','0821-3345-9087','Jl. Dagen No. 12, dekat Malioboro','Gedongtengen','','Kota Yogyakarta','DI Yogyakarta','','Basic tee, black x3',0.6,[30,20,5],297000,{sug:{zip:'55271',kel:'Sosromenduran',conf:'Medium'}}),
  R('Maya Sari','0813-2290-1145','Jl. Pemuda No. 21','Semarang Tengah','','Kota Semarang','Jawa Tengah','50132','Wide-leg trousers x1',0.5,[30,25,5],219000)];
const TPL_ROWS=()=>[R('Nadia Rahma','6281234567890','Jl. Kemang Selatan No. 8','Bangka','Mampang Prapatan','Jakarta Selatan','DKI Jakarta','12730','Linen shirt, white, M x1',0.4,[30,25,5],289000,{swap:true}),
  R('Yoga Saputra','62 821 4455 6677','Jl. Diponegoro No. 3','Gubeng','Airlangga','Kota Surabaya','Jawa Timur','60286','Canvas tote bag x2',0.8,[35,30,6],298000,{pay:'non'}),
  R('Putri Ayu','0813-77','Jl. Boulevard No. 9','Panakkukang','Pandang','Kota Makassar','Sulawesi Selatan','90231','Batik dress, indigo x1',0.5,[30,25,5],375000),
  R('Agus Setiawan','0857-3302-1184','Jl. Pemuda No. 21','Semarang Tengah','','Kota Semarang','Jawa Tengah','50132','Leather sneakers, 41 x1',1.2,[35,22,13],459000,{wh:1}),
  R('Rizky Ramadhan','0878-1234-5566','Jl. Ir. H. Juanda No. 77','Coblong','Dago','Kota Bandung','Jawa Barat','40135','Basic tee, black x2',0.4,[30,20,4],198000,{pay:'non',wh:1}),
  R('Yoga Saputra','62 821 4455 6677','Jl. Diponegoro No. 3','Gubeng','Airlangga','Kota Surabaya','Jawa Timur','60286','Canvas tote bag x2',0.8,[35,30,6],298000,{dupOf:1})];
function prepRows(rows){rows.forEach(r=>{if(!r.kel&&ZIPKEL[r.zip]){r.kel=ZIPKEL[r.zip][0];r.kelAuto=true}});return rows}
function issuesOf(r,i){if(r.removed)return[{t:'info',f:[],m:'Removed from this upload.',a:[['Undo','undo']]}];const out=[];
  if(!r.name.trim())out.push({t:'err',f:['name'],m:'Add the customer name.'});
  if(!phoneOk(r.phone))out.push({t:'err',f:['phone'],m:`"${esc(r.phone)}" is too short. Use 08…, 62… or +62….`});
  if(!r.street.trim())out.push({t:'err',f:['street'],m:'Add the full address.'});
  if(r.sug&&!r.sugOk&&!/^\d{5}$/.test(r.zip))out.push({t:'sug',f:['zip','kel'],m:`AI suggests postcode ${r.sug.zip} and kelurahan ${r.sug.kel} from the address (${r.sug.conf.toLowerCase()} confidence).`,a:[['Accept','acc']]});
  else{if(!/^\d{5}$/.test(r.zip))out.push({t:'err',f:['zip'],m:'Add a 5-digit postcode.'});if(!r.kel.trim())out.push({t:'err',f:['kel'],m:'Add the kelurahan.'})}
  if(r.swap)out.push({t:'err',f:['kec','kel'],m:`Kecamatan and kelurahan look swapped for postcode ${r.zip}.`,a:[['Swap them','swap']]});
  if(r.dupOf!=null&&!r.keep)out.push({t:'err',f:['name','phone','street'],m:`Same phone, address and product as row ${r.dupOf+1}.`,a:[['Remove row','rm'],['Keep both','keep']]});
  if(!(+r.kg>0))out.push({t:'err',f:['kg'],m:'Add the weight in kg.'});
  if(r.pay==='cod'&&!(+String(r.cod).replace(/\D/g,'')>0))out.push({t:'err',f:['cod'],m:'Add the amount the courier collects.'});
  if(+r.l===1&&+r.w===1&&+r.h===1)out.push({t:'warn',f:['dims'],m:'Size is 1 × 1 × 1 cm. FLIK has 25 × 20 × 3 cm saved for this product.',a:[['Use saved size','dims']]});
  if(r.kelAuto)out.push({t:'info',f:[],m:`Kelurahan filled from postcode ${r.zip}.`});
  const cn2=covNote(r);if(cn2)out.push(cn2);
  if(r.sugOk)out.push({t:'info',f:[],m:'AI suggestion accepted.'});
  return out}
const bkTotals=()=>{const t={err:0,sug:0,warn:0,cod:0,non:0};X.bk.rows.forEach(r=>{if(!r.removed)t[r.pay==='cod'?'cod':'non']++});X.bk.rows.forEach((r,i)=>{const is=issuesOf(r,i);if(is.some(x=>x.t==='err'))t.err++;if(is.some(x=>x.t==='sug'))t.sug++;if(is.some(x=>x.t==='warn'))t.warn++});return t};
function step0Ok(){if(X.how!=='bulk')return X.ships.length&&X.ships.every(shipOk);const B=X.bk;if(!B||B.stage!=='rows')return false;const t=bkTotals();return!t.err&&!t.sug&&B.rows.some(r=>!r.removed)}
function bkSum(){const t=bkTotals();const live=X.bk.rows.filter(r=>!r.removed).length;const whn=new Set(X.bk.rows.filter(r=>!r.removed).map(r=>r.wh||0)).size;
  return`${t.err?`<span class="st bad">${t.err} ${t.err===1?'row':'rows'} to fix</span>`:''}${t.sug?`<span class="st pu">${t.sug} ${t.sug===1?'suggestion':'suggestions'} to confirm</span>`:''}${t.warn?`<span class="st warn">${t.warn} to check</span>`:''}${!t.err&&!t.sug?`<span class="st ok">${live} shipments ready${ic('check',13,2.2)}</span>`:''}<span class="bk-mix">${t.cod} COD · ${t.non} non-COD${whn>1?` · ${whn} pickup addresses`:''}</span>
  <span class="sp"></span>${t.sug?'<button class="btn btn-o" data-bkall>Accept all suggestions</button>':''}<button class="btn btn-o" data-bkonly>${X.bk.only?'Show all rows':'Show rows with issues only'}</button>`}
const cellCls=(is,f)=>is.some(x=>x.t==='err'&&x.f.includes(f))?'err':is.some(x=>x.t==='sug'&&x.f.includes(f))?'sug':is.some(x=>x.t==='warn'&&x.f.includes(f))?'warn':'';
function issHtml(is,i){const bad=is.filter(x=>x.t!=='info'),vis=bad.length||is.some(x=>x.a)?is:is;
  return(bad.length||is.some(x=>x.a)?'':`<span class="okk">${ic('check',13,2.4)}Ready</span>`)+vis.map(x=>`<div class="is ${x.t}"><span>${x.t==='sug'?ic('sparkle',13):''}${x.m}</span>${x.a?`<span class="acts">${x.a.map(a=>`<button class="btn ${a[1]==='acc'||a[1]==='swap'?'btn-p':'btn-o'}" data-bka="${a[1]}" data-r="${i}">${a[0]}</button>`).join('')}</span>`:''}</div>`).join('')}
function rowHtml(r,i){const is=issuesOf(r,i);const inp2=(f,lab,o='')=>`<td data-c="${f}" class="${f==='kel'&&r.kelAuto&&!cellCls(is,f)?'auto':cellCls(is,f)}"><input data-r="${i}" data-f="${f}" value="${esc(f==='zip'&&r.sug&&!r.sugOk&&!r.zip?'':r[f])}" placeholder="${f==='zip'&&r.sug&&!r.sugOk?r.sug.zip:f==='kel'&&r.sug&&!r.sugOk?r.sug.kel:''}" aria-label="Row ${i+1} ${lab}" ${o}></td>`;
  return`<tr data-row="${i}" class="${r.removed?'gone':''}"><td class="rn">${i+1}</td><td class="iss" data-iss="${i}">${issHtml(is,i)}</td>${inp2('name','customer name')}${inp2('phone','phone')}${inp2('street','address')}${inp2('kec','kecamatan')}${inp2('kel','kelurahan')}${inp2('zip','postcode','inputmode="numeric"')}${inp2('items','product')}${inp2('kg','weight','inputmode="decimal"')}
  <td data-c="dims" class="${cellCls(is,'dims')}"><div class="dims"><input data-r="${i}" data-f="l" value="${r.l}" aria-label="Row ${i+1} length" inputmode="numeric"><input data-r="${i}" data-f="w" value="${r.w}" aria-label="Row ${i+1} width" inputmode="numeric"><input data-r="${i}" data-f="h" value="${r.h}" aria-label="Row ${i+1} height" inputmode="numeric"></div></td>
  ${inp2('cod',r.pay==='cod'?'COD amount':'item value','inputmode="numeric"')}
  <td data-c="pay"><select data-r="${i}" data-f="pay" aria-label="Row ${i+1} payment method"><option value="cod" ${r.pay==='cod'?'selected':''}>COD</option><option value="non" ${r.pay!=='cod'?'selected':''}>Non-COD</option></select></td>
  <td data-c="wh"><select data-r="${i}" data-f="wh" aria-label="Row ${i+1} pickup from">${WAREHOUSES.map((w,k)=>`<option value="${k}" ${whIx(r.wh)===k?'selected':''}>${w.n}</option>`).join('')}</select></td></tr>`}
function shipmentsSection(){
  if(X.how!=='bulk')return`<section><div class="sx-h">Shipments</div>${X.ships.map(shipCard).join('')}<div class="sx-row"><button class="btn btn-o" data-addship>${ic('plus',15,2)}Add shipment</button><button class="btn btn-o" data-reset style="color:var(--muted)">Reset</button></div></section>`;
  const B=X.bk||(X.bk={stage:'choose'});
  if(B.stage==='choose')return`<section><div class="sx-h">Shipments</div><div class="sx-drop"><span class="ic">${ic('upload',20)}</span><b>Upload your order file</b>The FLIK template, or the order file you already have. CSV or Excel, up to 500 rows. Bahasa headers are fine, and COD and non-COD orders can sit in the same file.
    <div class="sx-row" style="justify-content:center;margin-top:16px"><button class="btn btn-o" data-dltpl>${ic('export',15)}Download template</button><button class="btn btn-p" data-toast="In this prototype, pick one of the example files below">Choose file</button></div>
    <div class="bk-ex"><span>Example files</span><button class="btn btn-o" data-bkex="template">${ic('sheet',15)}FLIK template, filled in</button><button class="btn btn-o" data-bkex="own">${ic('sheet',15)}Your own order export</button></div></div>
    <p class="bk-hint">${ic('sparkle',14)}Using your own file? FLIK suggests where each column goes. You confirm before anything is created.</p>
    <p class="bk-hint">${ic('wh',14)}Shipping from more than one warehouse? Set <b style="font-weight:500;color:var(--ink)">Pickup from</b> per row and FLIK books one pickup per address.</p></section>`;
  if(B.stage==='map'){const miss=REQ.filter(f=>!B.map.some(m=>m.to===f));const changed=B.map.filter(m=>m.to!==m.ai).length;
    return`<section id="bksec"><div class="sx-h">Match your columns <span class="ai-tag">${ic('sparkle',13)}Suggested by AI</span></div>
    <p class="sx-lead" style="margin-bottom:14px">FLIK read <b style="color:var(--ink);font-weight:500">${B.file}</b>: 8 orders and ${B.map.length} columns. Check where each column goes, then confirm.</p>
    <div class="tbl-wrap mp" style="margin-top:0"><table><thead><tr><th>Your column</th><th>Example value</th><th>Goes to</th><th>Match</th></tr></thead><tbody>
    ${B.map.map((m,i)=>`<tr class="${m.to!==m.ai?'changed':''}"><td class="src"><b>${m.col}</b></td><td><div class="ex">${esc(m.ex)}</div></td><td><select data-mapi="${i}" aria-label="FLIK field for ${m.col}">${FIELDS.map(f=>`<option value="${f[0]}" ${m.to===f[0]?'selected':''}>${f[1]}</option>`).join('')}</select>${m.why&&m.to===m.ai?`<span class="why">${m.why}</span>`:''}</td><td>${m.to!==m.ai?'<span class="st pu">Set by you</span>':`<span class="st ${m.conf==='High'?'ok':m.conf==='Medium'?'warn':'gr'}">${m.conf}</span>`}</td></tr>`).join('')}</tbody></table></div>
    <div class="miss">${ic('warn',16)}<div><b>Your file has no kelurahan column</b><p>FLIK needs a kelurahan for every shipment. It's filled from the postcode. Where a row has no postcode, AI suggests both from the address, and you confirm them in the next step.</p></div></div>
    ${miss.length?`<div class="miss" style="background:var(--bad-bg);color:var(--bad-tx)">${ic('warn',16)}<div><b style="color:var(--bad-tx)">Still needed: ${miss.map(f=>FIELDS.find(x=>x[0]===f)[1]).join(', ')}</b><p style="color:var(--bad-tx)">Choose which of your columns holds it.</p></div></div>`:''}
    <p class="bk-hint">${ic('shield',14)}To suggest this, only the column names and 5 example rows are read, and names and phone numbers are hidden first.</p>
    <div class="sx-row" style="margin-top:16px"><button class="btn btn-o" data-bkback>Choose another file</button><button class="btn btn-p" data-bkconfirm ${miss.length?'disabled':''}>Confirm ${changed?'columns':'all columns'}</button></div></section>`}
  const vis=B.rows.map((r,i)=>[r,i]).filter(([r,i])=>!B.only||issuesOf(r,i).some(x=>x.t!=='info'));
  return`<section id="bksec"><div class="sx-h">Check your shipments</div>
  <p class="sx-lead" style="margin-bottom:14px">${B.file}: ${B.rows.length} rows.${B.src==='template'?' FLIK template recognized; the example row was skipped.':' Columns matched as you confirmed.'} Fix the highlighted cells here. There's no need to upload again.</p>
  <div class="bk-sum" id="bk-sum">${bkSum()}</div>
  <div class="tbl-wrap bk" style="margin-top:0"><table><thead><tr><th></th><th>Check</th><th class="c-name">Customer name</th><th class="c-ph">Phone</th><th class="c-ad">Full address</th><th class="c-ar">Kecamatan</th><th class="c-ar">Kelurahan</th><th class="c-zip">Postcode</th><th class="c-pr">Product</th><th class="c-kg">Kg</th><th class="c-dm">L × W × H cm</th><th class="c-cod">COD or item value</th><th class="c-pay">Payment method</th><th class="c-wh">Pickup from</th></tr></thead>
  <tbody id="bk-body">${vis.map(([r,i])=>rowHtml(r,i)).join('')||'<tr><td colspan="14" style="height:auto;border:0"><div class="empty"><b>No rows with issues</b>Everything is ready.</div></td></tr>'}</tbody></table></div>
  <div class="sx-row" style="margin-top:14px"><button class="btn btn-o" data-bkback>Upload another file</button></div></section>`}
sxBody.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const d=b.dataset;if(!X)return;
  if(d.bkex){const own=d.bkex==='own';X.bk=own?{stage:'map',src:'own',file:'pesanan_oktober.xlsx',map:OWN_MAP.map(m=>({...m})),edited:new Set(),fixed:new Set()}:{stage:'rows',src:'template',file:'Template_COD_FLIK.xlsx',rows:prepRows(TPL_ROWS()),edited:new Set(),fixed:new Set()};
    track('bulk_upload_started',{source:own?'own_file':'flik_template',header_language:'id',rows:own?8:6});
    if(own)track('bulk_mapping_proposed',{columns_mapped:X.bk.map.filter(m=>m.ai!=='none').length,low_confidence:X.bk.map.filter(m=>m.conf==='Low').length});drawSx();toBk();return}
  if('bkback' in d){X.bk={stage:'choose'};drawSx();return}
  if('bkconfirm' in d){const B=X.bk;track('bulk_mapping_confirmed',{columns_mapped:B.map.filter(m=>m.to!=='none').length,columns_changed_by_merchant:B.map.filter(m=>m.to!==m.ai).length,low_confidence:B.map.filter(m=>m.conf==='Low').length});
    B.stage='rows';B.rows=prepRows(OWN_ROWS());drawSx();toBk();return}
  if('bkall' in d){X.bk.rows.forEach(r=>{if(r.sug&&!r.sugOk&&!/^\d{5}$/.test(r.zip)){r.zip=r.sug.zip;r.kel=r.sug.kel;r.sugOk=true;X.bk.fixed.add('ai_suggestion')}});drawSx();return}
  if('bkonly' in d){X.bk.only=!X.bk.only;drawSx();return}
  if(d.bka){const r=X.bk.rows[+d.r];X.bk.edited.add(+d.r);
    if(d.bka==='acc'){r.zip=r.sug.zip;r.kel=r.sug.kel;r.sugOk=true;X.bk.fixed.add('ai_suggestion')}
    if(d.bka==='swap'){[r.kec,r.kel]=[r.kel,r.kec];r.swap=false;X.bk.fixed.add('swapped_area')}
    if(d.bka==='rm'){r.removed=true;X.bk.fixed.add('duplicate')}
    if(d.bka==='keep'){r.keep=true;X.bk.fixed.add('duplicate')}
    if(d.bka==='undo'){r.removed=false}
    if(d.bka==='dims'){r.l='25';r.w='20';r.h='3';X.bk.fixed.add('placeholder_size')}
    drawSx()}});
sxBody.addEventListener('change',e=>{const s=e.target;if(s.dataset.mapi!=null){X.bk.map[+s.dataset.mapi].to=s.value;drawSx()}
  if(s.dataset.f==='pay'||s.dataset.f==='wh'){const i=+s.dataset.r,r=X.bk.rows[i];r[s.dataset.f]=s.dataset.f==='wh'?+s.value:s.value;X.bk.edited.add(i);drawSx()}});
sxBody.addEventListener('input',e=>{const t=e.target;if(t.dataset.f==null||t.dataset.r==null||!X.bk||!X.bk.rows)return;const i=+t.dataset.r,r=X.bk.rows[i],f=t.dataset.f;
  r[f]=t.value;X.bk.edited.add(i);if(f==='phone'&&phoneOk(t.value))X.bk.fixed.add('phone');if(f==='kel'||f==='kec'){r.kelAuto=false}if((f==='zip'||f==='kel')&&r.sug&&/^\d{5}$/.test(r.zip))r.sugOk=false;
  const tr=sxBody.querySelector(`tr[data-row="${i}"]`),is=issuesOf(r,i);
  tr.querySelectorAll('td[data-c]').forEach(td=>{const c=td.dataset.c;td.className=c==='kel'&&r.kelAuto&&!cellCls(is,c)?'auto':cellCls(is,c)});
  tr.querySelector('[data-iss]').innerHTML=issHtml(is,i);document.getElementById('bk-sum').innerHTML=bkSum();document.getElementById('sx-next').disabled=!stepOk()});
function toBk(){const el=document.getElementById('bksec');if(el)sxBody.scrollTop+=el.getBoundingClientRect().top-sxBody.getBoundingClientRect().top-16}
function bulkToShips(){const B=X.bk;track('bulk_rows_fixed',{rows_edited:B.edited.size,error_types_fixed:[...B.fixed]});
  X.ships=B.rows.filter(r=>!r.removed).map(r=>({phone:localPhone(r.phone),name:r.name,pay:r.pay||'cod',wh:whIx(r.wh),addr:{street:r.street,city:[r.kel,r.kec,r.city].filter(Boolean).join(', '),zip:r.zip},area:{kec:r.kec,kel:r.kel,city:r.city,prov:r.prov,zip:r.zip},
    l:r.l,w:r.w,h:r.h,kg:r.kg,items:r.items,cod:(+String(r.cod).replace(/\D/g,'')).toLocaleString('id-ID'),open:false}))}

/* ===== Sidebar: Shipping pages open; Analytics > Shipping noted ===== */
NAV.find(n=>n.t==='Shipping').sub=[{t:'Shipments',v:'shp'},{t:'Tracking',v:'trk'},{t:'Warehouse',v:'whs'},{t:'Red Zone',v:'rz'}];
NAV.find(n=>n.t==='Analytics').sub=['Checkout',{t:'Shipping',v:'ana'}];
nav.innerHTML=NAV.map(n=>n.h?`<div class="navh">${n.h}</div>`:n.sub?`<div class="grp"><button class="ni">${ic(n.i)}${n.t}<span class="chev">${ic('chev',14)}</span></button><div class="sub">${n.sub.map(s=>s.v?`<button class="ni" data-view="${s.v}">${s.t}</button>`:`<button class="ni" data-toast="Opens ${s}">${s}</button>`).join('')}</div></div>`:n.v?`<button class="ni" data-view="${n.v}">${ic(n.i)}${n.t}</button>`:`<button class="ni" data-toast="Opens ${n.t}">${ic(n.i)}${n.t}</button>`).join('');
nav.querySelectorAll('.grp>.ni').forEach(b=>b.onclick=()=>b.parentElement.classList.toggle('open'));
nav.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{location.hash=VIEWS[b.dataset.view][0]});
document.getElementById('balv').closest('button').addEventListener('click',()=>{});

/* ===== Router (extends Raam's) ===== */
const SHIPV=['shp','trk','whs','rz'];
function show(view){
  if(location.hash==='#invoices/create'){view='inv';openEditor()}else if(!ie.hidden)closeEditor();
  if(location.hash==='#shipments/create'){view='shp';openShip();track('shipment_step_viewed',{step:'Details',mode:'single',cod:true})}else if(!sx.hidden)closeShip();
  if(location.hash==='#merchant-cash-advance/apply'){view='mca';openMca()}else if(!mx.hidden)closeMca();
  Object.keys(VIEWS).forEach(k=>{const el=document.getElementById('view-'+k);if(el)el.hidden=k!==view});
  document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('on',b.dataset.view===view));
  document.title=VIEWS[view][1]+' | FLIK Dashboard';
  if(view==='home'){drawChart();renderHomeExtra()}
  if(view==='mca')renderMca();
  if(view==='shp')renderShp();else if(SHIPV.includes(view)||view==='ana')renderSub(view);
  if(SHIPV.includes(view))nav.querySelector('[data-view="shp"]').closest('.grp').classList.add('open');
  if(view==='ana')nav.querySelector('[data-view="ana"]').closest('.grp').classList.add('open');
  if(view==='shp'||SHIPV.includes(view))PS.prod='shipping';if(view==='inv')PS.prod='payments';if(view==='mca')PS.prod='funding';
  if(view==='inv'){renderInv();nav.querySelector('[data-view="inv"]').closest('.grp').classList.add('open')}
  closeDetail();closePop();setSide(false);scrollTo(0,0);document.body.classList.toggle('inflow',!sx.hidden||!ie.hidden||!mx.hidden);
  track('menu_opened',{menu:VIEWS[view][1],verified:PS.verified})}
/* bootstrap runs at the end of the v2 script */
