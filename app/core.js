/* ===== FLIK Shipping Phase 1 prototype: shared helpers, merchant state, navigation =====
 * Loaded after Raam's reference dashboard (index.html). Function declarations here replace
 * Raam's functions of the same name; everything else is new.
 */
Object.assign(P,{
  sparkle:'<path d="M12 3.5l1.8 4.7 4.7 1.8-4.7 1.8L12 16.5l-1.8-4.7L5.5 10l4.7-1.8z"/><path d="M18.5 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>',
  shield:'<path d="M12 3.5 5 6v5.5c0 4.2 2.9 7.6 7 9 4.1-1.4 7-4.8 7-9V6z"/><path d="m9 12 2 2 4-4"/>',
  mail:'<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="m4 7 8 6 8-6"/>',
  route:'<circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h7.5a3.5 3.5 0 0 0 0-7h-7a3.5 3.5 0 0 1 0-7H16"/>',
  percent:'<path d="M18 6 6 18"/><circle cx="7.5" cy="7.5" r="2"/><circle cx="16.5" cy="16.5" r="2"/>',
  pulse:'<path d="M3 12h4l2.5-6 5 12 2.5-6h4"/>',
  book:'<path d="M5 4.5h10a3 3 0 0 1 3 3v12H8a3 3 0 0 1-3-3z"/><path d="M5 16.5a3 3 0 0 1 3-3h10"/>',
  ticket:'<path d="M4 7.5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1V10a2 2 0 0 0 0 4v2.5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V14a2 2 0 0 0 0-4z"/><path d="M14 6.5v11" stroke-dasharray="2 2"/>',
  map:'<path d="M9 4.5 3.5 6.5v13L9 17.5l6 2 5.5-2v-13L15 6.5z"/><path d="M9 4.5v13M15 6.5v13"/>',
  gauge:'<path d="M4.5 16a7.5 7.5 0 1 1 15 0"/><path d="m12 16 3.5-4.5"/><circle cx="12" cy="16" r="1.2"/>',
  api:'<path d="m8 8-4 4 4 4M16 8l4 4-4 4M13.5 5.5l-3 13"/>',
  person:'<circle cx="12" cy="8" r="3.5"/><path d="M5 19.5c1.2-3.3 3.8-5 7-5s5.8 1.7 7 5"/>',
  phone2:'<path d="M6.5 3.5h3l1.5 4-2 1.5a10 10 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2 2A15.5 15.5 0 0 1 4.5 5.5a2 2 0 0 1 2-2z"/>',
  chat2:'<path d="M4.5 5.5h15v10h-9l-4 3.5v-3.5h-2z"/>',
  split:'<path d="M5 5h4l5 7-5 7H5M14 12h5M16.5 9.5 19 12l-2.5 2.5"/>',
  bulb:'<path d="M9 17.5h6M10 20.5h4M12 3.5a6 6 0 0 0-3.5 10.9V15.5h7v-1.1A6 6 0 0 0 12 3.5z"/>'
});
const DAY=864e5,HOUR=36e5;
const esc=v=>String(v??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ago=d=>{const h=(NOW-d)/HOUR;if(h<1)return'Just now';if(h<24)return`${Math.floor(h)} h ago`;const n=Math.floor(h/24);return n===1?'1 day ago':`${n} days ago`};
const normPhone=p=>{let d=String(p||'').replace(/\D/g,'');if(d.startsWith('0'))d='62'+d.slice(1);else if(d.startsWith('8'))d='62'+d;return d};
const phoneOk=p=>/^62\d{9,12}$/.test(String(p||'').replace(/\D/g,''));
const fphone=p=>{const d=normPhone(p).slice(2);return'+62 '+d.slice(0,3)+'-'+d.slice(3,7)+'-'+d.slice(7)};
const pct=(a,b)=>b?Math.round(a/b*1000)/10:0;
const fpct=v=>(Math.round(v*10)/10).toLocaleString('id-ID')+'%';
const sum=(a,f=x=>x)=>a.reduce((s,x)=>s+f(x),0);
const by=(a,f)=>a.reduce((m,x)=>{const k=f(x);(m[k]=m[k]||[]).push(x);return m},{});
const cName=k=>(COURIERS.find(c=>c.k===k)||{n:k}).n;
const plural=(n,a,b)=>`${n.toLocaleString('id-ID')} ${n===1?a:(b||a+'s')}`;
/* seeded random numbers that don't disturb Raam's own seed */
const mkRng=s=>()=>(s=(s*16807)%2147483647)/2147483647;
const hsh=s=>{let h=7;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;return h};

/* ===== Merchant state (the prototype bar changes it) ===== */
const PS={mode:'new',flags:'payship',verified:false,vd:{},vStep:0,vLater:false,first:{addr:false,created:false,paid:false},ckClosed:false,events:[]};
const FLAGS={pay:{l:'Payments only (default until the first transaction)',w:['pay']},ship:{l:'Shipping only',w:['ship']},payship:{l:'Payments + Shipping',w:['pay','ship']},all:{l:'Payments, Shipping, Funding',w:['pay','ship']}};
const has=p=>FLAGS[PS.flags].w.includes(p);
const WH_ALL=WH.map(w=>({...w}));

/* ===== Event tracker: first-party, no shopper data ===== */
function track(name,props={}){PS.events.unshift({name,props,at:new Date()});const n=document.getElementById('pt-evn');if(n)n.textContent=PS.events.length}

/* ===== Direct download to the device (no Download Centre) ===== */
function dlCsv(file,head,rows,section){
  const q=v=>`"${String(v??'').replace(/"/g,'""')}"`;
  const csv='﻿'+[head.map(q).join(',')].concat(rows.map(r=>r.map(q).join(','))).join('\n');
  try{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download=`${file}-${fdayISO(NOW)}.csv`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1500)}catch(e){}
  track('export_downloaded',{section:section||file,rows:rows.length});toast(`${file}-${fdayISO(NOW)}.csv downloaded (${plural(rows.length,'row')})`)}
const dlBtn=(id,label='Export')=>`<button class="btn btn-o" data-dl="${id}">${ic('export',15)}${label}</button>`;
const DL={};  // section id → () => [file, head, rows]
document.addEventListener('click',e=>{const b=e.target.closest('[data-dl]');if(!b)return;e.stopPropagation();const f=DL[b.dataset.dl];if(f){const [file,head,rows]=f();dlCsv(file,head,rows,b.dataset.dl)}});

/* ===== Prototype bar (not part of the product) ===== */
document.body.insertAdjacentHTML('beforeend',`<div class="pt" role="region" aria-label="Prototype controls"><b>Prototype</b>
  <div class="seg" role="tablist" aria-label="Merchant"><button data-mode="new">New to Shipping</button><button data-mode="active">Active shipper</button></div>
  <button class="pb" id="pt-flags">${ic('user',14)}<span id="pt-flv"></span>${ic('chev',12)}</button>
  <button class="pb" data-pt="guide">${ic('book',14)}Guide</button><button class="pb" data-pt="events">${ic('pulse',14)}Events <span class="n" id="pt-evn">0</span></button><button class="pb" data-pt="api">${ic('api',14)}API</button></div>`);
document.querySelector('.pt').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
  if(b.dataset.mode){PS.qFlags=null;setMode(b.dataset.mode);return}
  if(b.id==='pt-flags'){e.stopPropagation();if(popFor===b){closePop();return}popFor=b;
    pop.innerHTML=`<h6>Products this merchant uses</h6>${Object.entries(FLAGS).map(([k,f])=>`<button class="opt" data-fl="${k}"><span class="rdo${PS.flags===k?' on':''}"></span>${f.l}</button>`).join('')}`;
    pop.querySelectorAll('[data-fl]').forEach(o=>o.onclick=()=>{PS.flags=o.dataset.fl;closePop();syncBar();show()});placePop(b,false);return}
  if(b.dataset.pt==='guide')guideModal();if(b.dataset.pt==='events')eventsDrawer();if(b.dataset.pt==='api')apiDrawer()});
function syncBar(){document.querySelectorAll('.pt [data-mode]').forEach(x=>x.classList.toggle('on',x.dataset.mode===PS.mode));document.getElementById('pt-flv').textContent=FLAGS[PS.flags].l}
function setMode(m){PS.mode=m;
  /* a merchant is tagged with a product at their first transaction; until then Home treats them as Payments */
  PS.flags=PS.qFlags||(m==='new'?'pay':PS.flags==='pay'?'payship':PS.flags);PS.vd={};PS.vStep=0;PS.vLater=false;MS.reset&&MS.reset();
  WH.length=0;
  if(m==='new'){PS.verified=false;PS.first={addr:false,created:false,paid:false};SH.length=0;TK.length=0;CL.length=0;PEND.length=0;VERIFIED.clear()}
  else{PS.verified=true;PS.first={addr:true,created:true,paid:true};WH_ALL.forEach(w=>WH.push({...w}));genActive()}
  whSync();syncBar();
  if(/^#shipments\/create/.test(location.hash))location.hash='home';else show()}
function guideModal(){
  modal.classList.add('wide');
  modal.innerHTML=`<div class="mh"><h3>What to try</h3><button class="ib" data-mclose aria-label="Close">${ic('x',18)}</button></div>
  <div class="mb guide"><p class="vf-lead">FLIK Shipping Phase 1 on Raam's design system. Everything here is example data. Use the dark bar at the bottom to switch merchants.</p>
  <ol>
  <li><b>Home:</b> one compact widget per product, Payments first, then Shipping. A new merchant counts as Payments until their first transaction. Quick access is in the + button.</li>
  <li><b>New to Shipping:</b> Shipping › Shipment explains FLIK Shipping and shows the setup checklist.</li>
  <li><b>Active shipper:</b> Shipping › Shipment goes straight to Create shipment. Try Bulk upload › “Your own export”: the template reader maps your columns, then Fix all with AI.</li>
  <li><b>Smart courier:</b> on the Courier step, each courier shows its delivery rate in your shoppers' areas. Pick SPX to see the red zone split.</li>
  <li><b>Monitoring:</b> batches, what needs resolving, health, courier performance, every shipment, claims and tickets. Each section exports to this device.</li>
  <li><b>Check rate:</b> any warehouse to any kecamatan, kelurahan or postcode (try 80113).</li>
  <li><b>Shipping › Analytics:</b> trends and insights from your shipments, on one screen.</li></ol>
  <p class="vf-lead">Events lists what the screens track, with no shopper data. API shows each call the page made and whether example data answered it.</p></div>
  <div class="mf"><button class="btn btn-p" data-mclose>Start</button></div>`;
  mscrim.classList.add('open')}
function eventsDrawer(){
  drawer.innerHTML=`<div class="dh"><span class="kind">${ic('pulse',15)}Tracked events</span><button class="ib" data-dclose aria-label="Close">${ic('x',18)}</button></div>
  <div class="db"><p class="d-sub" style="margin:0 0 14px">Stored in FLIK's own event store. Each event carries merchant id, user id, time and page. No shopper names, phones, addresses or AWBs.</p>
  <div class="ev">${PS.events.length?PS.events.map(e=>`<div class="ev-i"><div class="hd"><b>${e.name}</b><time>${e.at.toTimeString().slice(0,8)}</time></div>${Object.keys(e.props).length?`<pre>${esc(JSON.stringify(e.props))}</pre>`:''}</div>`).join(''):'<p class="d-sub">No events yet.</p>'}</div></div>`;
  openDrawer()}
function apiDrawer(){const c=FLIK.config;
  drawer.innerHTML=`<div class="dh"><span class="kind">${ic('api',15)}API</span><button class="ib" data-dclose aria-label="Close">${ic('x',18)}</button></div>
  <div class="db"><p class="d-sub" style="margin:0 0 14px">Mode: <b>${c.mode==='api'?'FLIK API through the local proxy':'example data'}</b>. Set it in config.js; the secret key goes in .env for <code>npm start</code>, never in the page. Endpoints are listed in docs/API.md.</p>
  <div class="ev">${FLIK.apiLog.length?FLIK.apiLog.slice(0,60).map(l=>`<div class="ev-i"><div class="hd"><b>${l.method} ${esc(l.path.split('?')[0])}</b><time>${esc(l.source)}</time></div></div>`).join(''):'<p class="d-sub">No calls yet.</p>'}</div></div>`;
  openDrawer()}
function openDrawer(){drawer.classList.add('open');dscrim.classList.add('open');drawer.setAttribute('aria-hidden','false');drawer.querySelector('[data-dclose]').onclick=closeDetail}
const _closeModal=closeModal;closeModal=function(){_closeModal();modal.classList.remove('wide','lg','xl');modal.onclick=modal.oninput=modal.onchange=null};

/* ===== Sidebar: Shipping has Shipment, Monitoring and Check rate ===== */
NAV.splice(0,NAV.length,
  {i:'home',t:'Home',v:'home'},{i:'bal',t:'Balances',v:'bal'},{i:'tx',t:'Transactions',v:'tx'},{i:'user',t:'Customer',v:'cus'},{i:'box',t:'Product Catalog',v:'prd'},
  {h:'Products'},
  {i:'cart',t:'Payments',sub:[{t:'Invoice',v:'inv'},'Offline Shop','Payment Link','Checkout Personalization','Order Form',{t:'Analytics',toast:'Opens Payments analytics (Checkout)'}]},
  {i:'truck',t:'Shipping',sub:[{t:'Shipment',v:'shp'},{t:'Monitoring',v:'mon'},{t:'Check rate',v:'cr'},{t:'Analytics',v:'ana'}]},
  {i:'coins',t:'Merchant Cash Advance',v:'mca'},
  {i:'tag',t:'Marketing',sub:['Chat Commerce','Leads Management','Voucher','Post Purchase Offer','Cashback']},
  {i:'more',t:'More',sub:['Developers','Settings']});
Object.assign(VIEWS,{mon:['monitoring','Monitoring'],cr:['check-rate','Check rate'],ana:['shipping/analytics','Shipping analytics'],wh:['warehouses','Pickup addresses']});
delete VIEWS.cou;delete VIEWS.trk;
function renderNav(){
  const open=[...nav.querySelectorAll('.grp.open>.ni')].map(b=>b.textContent);
  nav.innerHTML=NAV.filter(n=>n.v!=='mca'||PS.flags==='all').map(n=>n.h?`<div class="navh">${n.h}</div>`:n.sub?`<div class="grp"><button class="ni">${ic(n.i)}${n.t}<span class="chev">${ic('chev',14)}</span></button><div class="sub">${n.sub.map(s=>s.v?`<button class="ni" data-view="${s.v}">${s.t}</button>`:`<button class="ni" data-toast="${s.toast||'Opens '+s}">${s.t||s}</button>`).join('')}</div></div>`:n.v?`<button class="ni" data-view="${n.v}">${ic(n.i)}${n.t}</button>`:`<button class="ni" data-toast="Opens ${n.t}">${ic(n.i)}${n.t}</button>`).join('');
  nav.querySelectorAll('.grp>.ni').forEach(b=>{if(open.includes(b.textContent))b.parentElement.classList.add('open');b.onclick=()=>b.parentElement.classList.toggle('open')});
  nav.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{go(VIEWS[b.dataset.view][0])})}
const go=h=>{if(location.hash==='#'+h)show();else location.hash=h};
const openGrp=v=>{const b=nav.querySelector(`[data-view="${v}"]`);if(b&&b.closest('.grp'))b.closest('.grp').classList.add('open')};

/* Profile menu: Pickup addresses moved here from Shipping */
(()=>{const a=document.querySelector('.acct');a.removeAttribute('data-toast');
  a.onclick=e=>{e.stopPropagation();if(popFor===a){closePop();return}popFor=a;
    pop.innerHTML=`<div class="menu"><h6>Aruna Studio</h6><button class="opt" data-toast="Opens Business profile">${ic('person',15)}Business profile</button><button class="opt" data-pm="wh">${ic('wh',15)}Pickup addresses</button><button class="opt" data-toast="Opens Team members">${ic('user',15)}Team members</button><button class="opt" data-toast="Opens API keys">${ic('api',15)}API keys</button><h6>Switch business</h6><button class="opt" data-toast="Switch business account">${ic('sel',15)}Switch business</button></div>`;
    pop.querySelector('[data-pm]').onclick=()=>{closePop();setSide(false);go('warehouses')};placePop(a,false)}})();
document.querySelector('#view-wh h1').textContent='Pickup addresses';
document.querySelector('#wh-new').innerHTML=`${ic('plus',15,2)}Add pickup address`;

/* + menu: create something, plus the quick access that used to sit on Home */
document.getElementById('plus').onclick=e=>{e.stopPropagation();const b=e.currentTarget;if(popFor===b){closePop();return}popFor=b;
  const items=[has('pay')&&['inv','Online invoice','Invoice with your choice of payment methods',()=>go('invoices/create')],
    ['pkg','Create shipment','Many couriers and services in one place',()=>go('shipments/create')],
    ['gauge','Check rate','Compare couriers for any destination',()=>go('check-rate')],
    ['track','Track shipments','Find any shipment by AWB or shopper',()=>{MS.tab='list';go('monitoring')}],
    has('pay')&&['link','Payment link','Share it on WhatsApp or Instagram',()=>toast('Opens the new payment link form')],
    has('pay')&&['form','Order form','A landing page and order form for selling online',()=>toast('Opens the order form builder')],
    ['tag','Add a promo','A shipping or product promo',()=>toast('Opens the new promo form')],
    ['wallet','Top up balance','Balance pays for non-COD shipping',topupModal],
    PS.flags==='all'&&['coins','Funding request','Apply for Merchant Cash Advance',()=>go('merchant-cash-advance/apply')]].filter(Boolean);
  pop.innerHTML=`<div class="menu qa-menu"><h6>Quick access</h6>${items.map((q,i)=>`<button class="opt" data-q="${i}"><span class="qic">${ic(q[0],16,1.7)}</span><span><b>${q[1]}</b><span>${q[2]}</span></span></button>`).join('')}</div>`;
  pop.querySelectorAll('[data-q]').forEach(o=>o.onclick=()=>{closePop();track('quick_access_used',{item:items[+o.dataset.q][1]});items[+o.dataset.q][3]()});placePop(b,true)};

/* Help › Setup guide reopens the checklist */
(()=>{const h=document.querySelector('[data-toast="Opens FLIK help center"]');h.removeAttribute('data-toast');
  h.onclick=e=>{e.stopPropagation();if(popFor===h){closePop();return}popFor=h;
    pop.innerHTML=`<div class="menu"><h6>Help</h6><button class="opt" data-hsetup>${ic('check',15)}Setup guide</button><button class="opt" data-toast="Opens the FLIK help centre">${ic('book',15)}Help centre</button><button class="opt" data-toast="Opens WhatsApp support">${ic('chat2',15)}Chat with support</button></div>`;
    pop.querySelector('[data-hsetup]').onclick=()=>{PS.ckClosed=false;closePop();track('setup_guide_reopened',{});go('shipments');toast('Setup guide is back on Shipment')};placePop(h,true)}})();

/* ===== Setup checklist (Shipping), closable ===== */
const CK=[['addr','Add a pickup address','Couriers pick up from here. Add as many as you ship from.','Add address'],
  ['created','Create your first shipment','Type it in or upload your order file. COD and non-COD together.','Create shipment'],
  ['paid','Send it','Non-COD is paid from your balance. COD is deducted when the parcel is delivered.','Pay and send']];
function ckDone(k){if(PS.first[k])return;PS.first[k]=true;track('checklist_step_done',{step:k})}
function ckHtml(where){if(PS.ckClosed)return'';const done=CK.filter(c=>PS.first[c[0]]).length,next=CK.find(c=>!PS.first[c[0]]);if(!next)return'';
  return`<section class="ck" aria-label="Get started with FLIK Shipping"><div class="ck-h"><h3>Get your first shipment out</h3><span class="sc">${done} of 3 done</span><button class="ib ck-x" data-ckclose aria-label="Close checklist">${ic('x',16)}</button></div>
  <div class="ck-bar"><i style="width:${done/3*100}%"></i></div>
  ${CK.map(c=>{const d=PS.first[c[0]],n=next===c;return`<div class="ck-s${d?' done':''}${n?' next':''}"><span class="dot">${d?ic('check',13,2.6):''}</span><span class="tx"><b>${c[1]}</b><span>${c[2]}</span></span>${n?`<button class="btn btn-p" data-ck="${c[0]}">${c[3]}</button>`:''}</div>`}).join('')}</section>`}
document.addEventListener('click',e=>{
  if(e.target.closest('[data-ckclose]')){PS.ckClosed=true;track('checklist_closed',{});show();toast('Checklist hidden. Bring it back from Help › Setup guide');return}
  const s=e.target.closest('[data-ck]');if(!s)return;const k=s.dataset.ck;
  if(k==='addr')addWhModal();else go('shipments/create')});
function addWhModal(after){
  modal.innerHTML=`<div class="mh"><h3>Add pickup address</h3><button class="ib" data-mclose aria-label="Close">${ic('x',18)}</button></div>
  <div class="mb"><div class="fld"><label for="wn">Name</label><input id="wn" value="Main warehouse"></div><div class="fld"><label for="wa">Street</label><input id="wa" value="Jl. Kemang Raya No. 12, Bangka"></div><div class="fld"><label for="wk">Kecamatan, city</label><input id="wk" value="Mampang Prapatan, Jakarta Selatan" disabled></div><div class="fld"><label for="wp">Contact phone</label><input id="wp" value="+62 812-3456-7890"></div></div>
  <div class="mf"><button class="btn btn-o" data-mclose>Cancel</button><button class="btn btn-p" id="wsave">Save address</button></div>`;
  mscrim.classList.add('open');
  document.getElementById('wsave').onclick=()=>{const w={...WH_ALL[0],n:document.getElementById('wn').value||'Main warehouse',street:document.getElementById('wa').value||WH_ALL[0].street};WH.push(w);whSync();ckDone('addr');closeModal();toast('Pickup address saved');if(after)after();else show()}}

/* ===== Verification only when money moves ===== */
const VSEC=[['Business owner',[['pic','PIC phone number','+62 812-3456-7890'],['nik','NIK','16 digits'],['ktp','KTP photo','file']]],
  ['Bank account',[['bank','Bank','select'],['acct','Account number','e.g. 1234567890'],['holder','Account holder name','As shown in your bank']]],
  ['Business',[['brand','Brand name','e.g. Aruna Studio'],['npwp','NPWP','15 or 16 digits'],['nib','NIB','13 digits']]]];
const VACT={create_shipment:'pay for shipments',top_up:'top up your balance',resume:'move money'};
const vDone=i=>VSEC[i][1].every(f=>String(PS.vd[f[0]]||'').trim());
function verifyGate(action,cont){
  track('verification_prompted',{action});PS.vStep=Math.min(PS.vStep,2);
  const draw=()=>{const i=PS.vStep,sec=VSEC[i];
    modal.classList.add('wide');
    modal.innerHTML=`<div class="mh"><h3>Verify your business</h3><button class="ib" data-vlater aria-label="Close">${ic('x',18)}</button></div>
    <div class="mb"><p class="vf-lead">FLIK verifies every business before money moves. You need it once to ${VACT[action]}.${cont?' Your shipments are saved, and you come straight back to them.':''}</p>
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
      else if('vlater' in b.dataset){PS.vLater=true;closeModal();toast('Saved. Your shipments are still here')}
      else if(b.id==='vnext'&&!b.disabled){if(i<2){PS.vStep++;draw();return}
        PS.verified=true;PS.vLater=false;track('verification_completed',{action});closeModal();
        toast(cont?'Business verified. Continuing where you left off':'Business verified');if(cont)setTimeout(cont,250)}};
  };
  draw();mscrim.classList.add('open')}
/* a ticket chat widens the drawer; any other drawer goes back to normal */
{const _cd=closeDetail;closeDetail=function(){_cd();drawer.classList.remove('chat')}}
