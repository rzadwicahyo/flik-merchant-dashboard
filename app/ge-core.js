/* ===== Growth Engine v2 + Studio: shared pieces (P0) =====
 * Account state, language, limits, the AI fallback stand-in, balance/ledger, FLIK payment link,
 * the WhatsApp outbox, the full-screen overlay for Studio and idea pages, and the prototype bar
 * additions. Spec: docs/prototype/BUILD_SPEC.md. Everything is example data.
 */
Object.assign(P,{
  studio:'<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="m4 17 5-4.5 3.5 3 2.5-2 5 3.5"/><path d="M17.5 2.5l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6z"/>',
  eye:'<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  rocket:'<path d="M12 15.5 8.5 12c1.5-4.5 4.5-8 11-8.5-.5 6.5-4 9.5-8.5 11z"/><path d="M8.5 12 5 11l2.5-3.5h4M12 15.5l1 3.5 3.5-2.5v-4"/><path d="M6 18c-1 .5-1.5 1.5-1.5 1.5S5.5 19 6 18z"/>',
  clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  sliders:'<path d="M5 6h14M5 12h14M5 18h14"/><circle cx="9" cy="6" r="1.8"/><circle cx="15" cy="12" r="1.8"/><circle cx="8" cy="18" r="1.8"/>',
  repeat:'<path d="M17 3.5 20 6.5l-3 3"/><path d="M4 11.5v-1a4 4 0 0 1 4-4h12"/><path d="M7 20.5 4 17.5l3-3"/><path d="M20 12.5v1a4 4 0 0 1-4 4H4"/>',
  lock:'<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
  info:'<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.6v.1"/>',
  calendar:'<rect x="4" y="5.5" width="16" height="15" rx="2"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>',
  qr:'<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><path d="M14 14h2.5v2.5H14zM17.5 17.5H20V20h-2.5zM14 19.5h1M19.5 14v1"/>',
  star:'<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z"/>',
  phone:'<rect x="7" y="2.5" width="10" height="19" rx="2.2"/><path d="M10.5 18.5h3"/>',
  store:'<path d="M4 9.5 5.5 4.5h13L20 9.5"/><path d="M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0"/><path d="M5.5 11.5v8h13v-8"/><path d="M10 19.5v-4h4v4"/>'
});

/* ===== State ===== */
const GS={account:'active',lang:null,usage:{},outbox:[],ledger:[],balance:GE_BALANCE,dayOffset:0,full:null};
GE_LEDGER_SEED.forEach(l=>GS.ledger.push({at:new Date(NOW-l.d*DAY),label:l.label,amount:l.amount}));
const geNow=()=>new Date(NOW.getTime()+GS.dayOffset*DAY);
const geMerchant=()=>['new','active','top'].includes(GS.account);
const geFdate=d=>d.toLocaleDateString(geLang()==='id'?'id-ID':'en-GB',{day:'numeric',month:'short',year:'numeric'});
/* Bahasa by default on public pages (Studio, claim), English in the dashboard, unless the bar sets it */
const geLang=()=>GS.lang||(GS.account==='anon'||GS.full&&GX_PUBLIC.includes(GS.full.full)?'id':'en');
function geT(k,v){const s=(GE_I18N[geLang()]||{})[k]??GE_I18N.en[k]??k;return v?s.replace(/\{(\w+)\}/g,(m,x)=>v[x]??m):s}
/* bilingual example data: {id, en} → the current language */
const geL=o=>o&&typeof o==='object'&&!Array.isArray(o)?(o[geLang()]??o.en):o;

/* ===== Free public data, live where it exists, example data when it doesn't answer =====
 * Only public, free, keyless sources (config.js liveFreeApis; ?live=0 turns them off). Anything that needs
 * a key or a partner account (Instagram, WhatsApp, payments) stays example data in the prototype. */
const geLiveOn=()=>FLIK.config.liveFreeApis!==false&&new URLSearchParams(location.search).get('live')!=='0';
function geFetchJson(name,url,ms=4500){
  if(!geLiveOn()){FLIK.apiLog.unshift({name,method:'GET',path:url,source:'example data (live sources off)'});return Promise.reject(new Error('off'))}
  const c=new AbortController(),t=setTimeout(()=>c.abort(),ms),t0=performance.now();
  return fetch(url,{signal:c.signal,headers:{accept:'application/json'}}).then(r=>{if(!r.ok)throw new Error('HTTP '+r.status);return r.json()})
    .then(j=>{clearTimeout(t);FLIK.apiLog.unshift({name,method:'GET',path:url,source:'live · public, free',ms:Math.round(performance.now()-t0)});track('live_source_used',{source:name});return j})
    .catch(e=>{clearTimeout(t);FLIK.apiLog.unshift({name,method:'GET',path:url,source:'example data (live call failed: '+(e.name==='AbortError'?'timeout':e.message)+')'});throw e})}
/* Indonesian public holidays (date.nager.at, free, no key); the built-in list is the fallback */
let GE_HOL=null,GE_HOL_LIVE=false;
const geHolidays=()=>GE_HOL||(GE_HOL=(()=>{const y=geNow().getFullYear();
  return Promise.all([y,y+1].map(n=>geFetchJson('calendar.publicHolidays','https://date.nager.at/api/v3/PublicHolidays/'+n+'/ID')))
    .then(a=>{GE_HOL_LIVE=true;return a.flat().filter(h=>h&&h.date).map(h=>[h.date,'holiday',h.localName||h.name,h.name||h.localName])})
    .catch(()=>GE_DATES.filter(d=>d[4]))})());
/* every big date from today to 5 months ahead: built-in moments + public holidays (live or fallback) */
function geBigDates(hol){const from=new Date(geNow().getTime()-DAY),to=new Date(geNow().getTime()+150*DAY),seen=new Set(),out=[];
  [...GE_DATES.filter(d=>!d[4]),...(hol||GE_DATES.filter(d=>d[4]))].forEach(d=>{const at=new Date(d[0]+'T00:00:00'),k=d[0]+d[2].toLowerCase();
    if(at<from||at>to||seen.has(k))return;seen.add(k);out.push({at,kind:d[1],n:{id:d[2],en:d[3]}})});
  return out.sort((a,b)=>a.at-b.at)}

const aiTag=()=>`<span class="ge-ai" title="Written by AI because the ready-made options didn't fit">${ic('sparkle',11)}${geT('ai.tag')}</span>`;

/* ===== Limits: counters per account status ===== */
function limitCap(name){const v=GE_LIMITS[name];return typeof v==='object'?(v[GS.account]??0):v}
function limitLeft(name,scope=''){return Math.max(0,limitCap(name)-(GS.usage[name+':'+scope]||0))}
function useLimit(name,scope=''){const k=name+':'+scope,cap=limitCap(name),used=GS.usage[k]||0;
  if(used>=cap){track('limit_reached',{limit:name,account:GS.account});return{ok:false,left:0,message:geT('limit.'+name)}}
  GS.usage[k]=used+1;return{ok:true,left:cap-used-1}}

/* ===== AI fallback stand-in: canned answers after 1.2 s, counted and logged like the real call ===== */
function mockLLM(kind,input){const l=useLimit('llmFallbacksPerDay');
  if(!l.ok){toast(l.message);return Promise.resolve({ai:false,message:l.message})}
  FLIK.apiLog.unshift({name:'llm.fallback',method:'POST',path:'/v1/ai/fallback?case='+kind,source:'example data (AI fallback, no real call)'});
  track('llm_fallback',{case:kind});
  return new Promise(r=>setTimeout(()=>r({ai:true,...(GE_LLM[kind]?GE_LLM[kind](input):{})}),1200))}

/* ===== Money: FLIK balance (ledger) or a FLIK payment link ===== */
function ledgerDebit(amount,label){
  if(GS.balance<amount){toast(geT('pay.low'));return Promise.reject(new Error('balance'))}
  GS.balance-=amount;if(typeof BAL==='number'){BAL=GS.balance;const bv=document.getElementById('balv');if(bv)bv.textContent=rp(BAL)}const id='LG-'+(9000+GS.ledger.length);GS.ledger.unshift({at:geNow(),label,amount:-amount,id});
  FLIK.apiLog.unshift({name:'ledger.debit',method:'POST',path:'/v1/ledger/debits',source:'example data'});
  track('ledger_debited',{amount});geBarCounts();return Promise.resolve({ledgerTxnId:id})}
function paymentLinkSheet(amount,label){return new Promise((res,rej)=>{
  const id='PL-'+(hsh(label+amount+GS.ledger.length)%90000+10000);
  FLIK.apiLog.unshift({name:'paymentLink.create',method:'POST',path:'/v1/payment-links',source:'example data'});
  modal.classList.add('nw');
  modal.innerHTML=`<div class="mh"><h3>${geT('pay.title')}</h3><button class="ib" data-plx aria-label="${geT('pay.cancel')}">${ic('x',18)}</button></div>
  <div class="mb"><p class="vf-lead">${geT('pay.sub')}</p>
  <div class="ge-pl"><span>${esc(label)}</span><b>${rp(amount)}</b><code>pay.flik.id/l/${id}</code></div>
  <div class="fld"><label>${geT('pay.methods')}</label><div class="ge-chips">${['QRIS','Virtual account','E-wallet','Card'].map(m=>`<span class="chip">${m}</span>`).join('')}</div></div>
  <p class="d-sub">${geT('pay.proto')}</p></div>
  <div class="mf"><button class="btn btn-o" data-plx>${geT('pay.cancel')}</button><button class="btn btn-p" id="pl-paid">${geT('pay.mark')}</button></div>`;
  mscrim.classList.add('open');
  modal.onclick=e=>{const b=e.target.closest('button');if(!b)return;
    if('plx' in b.dataset){closeModal();rej(new Error('cancelled'))}
    if(b.id==='pl-paid'){closeModal();track('payment_link_paid',{amount});toast(geT('pay.paid'));res({paymentLinkId:id})}}})}

/* ===== WhatsApp: FLIK's approved templates only, image header per send; the prototype keeps an outbox ===== */
function waSend(template,lang,vars=[],image=null,to=GE_OWNER.phone){
  const tp=GE_WA[template]||{},body=(tp[lang]||tp.en||`[${template}]`).replace(/\{\{(\d+)\}\}/g,(m,i)=>vars[i-1]??m);
  const m={at:geNow(),template,lang,to,text:body,image:tp.noImage?null:image,foot:tp.cat==='marketing'?GE_WA_FOOT[lang]:null,btns:tp.cat==='marketing'?GE_WA_BTN[lang]:null};GS.outbox.unshift(m);
  FLIK.apiLog.unshift({name:'whatsapp.send',method:'POST',path:'/v1/whatsapp/messages',source:'example data (outbox)'});
  geBarCounts();return m}

/* ===== Full-screen overlay: public Studio page, editor, idea review, claim page ===== */
const GX_PUBLIC=['studio','claim'];
const GX={};   // full-screen renderers, registered by studio.js and growth.js: GX[name] = g => ({title, html, after})
document.body.insertAdjacentHTML('beforeend','<div class="gx" id="gx" hidden role="dialog" aria-modal="false"><div class="gx-top" id="gx-top"></div><div class="gx-body" id="gx-body"></div></div>');
const gx=document.getElementById('gx');
/* Growth Engine is one sidebar item with four tabs: My Brand, Competitor, Studio, Campaign */
const GE_TABS=[['brd','marketing/growth','person','tab.brand'],['cmp','marketing/growth/competitors','eye','tab.cmp'],['stu','marketing/growth/studio','studio','tab.stu'],['gro','marketing/growth/campaigns','rocket','tab.camp']];
const GE_VIEWS=GE_TABS.map(t=>t[0]);
const GE_OLD={'marketing/studio':'marketing/growth/studio','marketing/competitors':'marketing/growth/competitors','studio/new':'marketing/growth/studio/new'};
function geRoute(h){let g=null;const id=h.split('/').pop();
  if(GE_OLD[h]&&GS.account!=='anon')return{redirect:GE_OLD[h]};
  if(h.startsWith('marketing/growth/idea/'))return{redirect:'marketing/growth/campaigns'};
  if(h==='studio')g={view:'stu',full:'studio'};
  else if(h==='studio/edit')g={view:'stu',full:'edit'};
  else if(h==='studio/new')g={view:'stu',full:'new'};
  else if(h==='marketing/growth/studio/new')g={view:'stu',full:'create'};
  else if(h==='marketing/growth/campaigns/new')g={view:'gro',full:'camp'};
  else if(h.startsWith('marketing/growth/campaign/'))g={view:'gro',sub:'campaign',id};
  else if(h.startsWith('claim/'))g={view:'gro',full:'claim',id};
  else{const t=GE_TABS.find(x=>x[1]===h);if(t)g={view:t[0]}}
  /* a stranger only has the public pages; a lead has Studio and a one-time competitor look (My Brand and Campaign are locked) */
  if(!g)return GS.account==='anon'?{redirect:'studio'}:GS.account==='lead'?{redirect:'marketing/growth/studio'}:null;
  if(GS.account==='anon'&&!['studio','edit','claim'].includes(g.full))return{redirect:'studio'};
  if(GS.account==='lead'&&['camp'].includes(g.full))return{redirect:'marketing/growth/campaigns'};
  return g}
/* the tab bar on top of every Growth Engine page */
function geTabs(on,actions=''){const lead=GS.account==='lead';
  return`<div class="ph ge-ph"><div><h1>${geT('gro.h')}</h1><p class="sec-sub ge-sub">${geT('tab.sub.'+on)}</p></div>${actions?`<div class="g-hact">${actions}</div>`:''}</div>
  <div class="tabs ge-tabs" role="tablist">${GE_TABS.map(([v,h,i,k])=>{const lock=lead&&(v==='brd'||v==='gro');return`<a class="tab${v===on?' on':''}" href="#${h}" role="tab" aria-selected="${v===on}" data-getab="${v}">${ic(i,15)}${geT(k)}${lock?`<span class="ge-tlock">${ic('lock',11)}</span>`:''}</a>`}).join('')}</div>`}
/* what a lead sees on a locked tab */
function geLocked(v){return`<section class="card st-cta st-up ge-locked"><span class="qic">${ic('rocket',20,1.6)}</span><div><b>${geT('lock.'+v+'.h')}</b><span>${geT('lock.'+v+'.sub')}</span><ul>${['lead.b1','lead.b2','lead.b3','lead.b4'].map(k=>`<li>${ic('check',13,2.4)}${geT(k)}</li>`).join('')}</ul></div><button class="btn btn-p" data-gelead>${geT('gro.lead.cta')}</button></section>`}
document.addEventListener('click',e=>{const b=e.target.closest('[data-gelead]');if(!b)return;track('merchant_cta_clicked',{from:location.hash.slice(1)});toast(geT('lead.signup.toast'))});
function geOpen(g){GS.full=g;const r=(GX[g.full]||(()=>({title:'',html:''})))(g),pub=GX_PUBLIC.includes(g.full);
  document.getElementById('gx-top').innerHTML=pub
    ?`<span class="gx-logo">FLIK <i>${g.full==='studio'?'Studio':''}</i></span><span class="gx-sp"></span>${geLangSeg()}${g.full==='studio'?`<button class="btn btn-o" data-gxsignin>${geT('gx.signin')}</button>`:''}`
    :`<button class="ib" data-gxclose aria-label="${geT('gx.close')}">${ic('x',18)}</button><span class="sep"></span><b>${esc(r.title||'')}</b><span class="gx-sp"></span>${r.actions||''}`;
  document.getElementById('gx-body').innerHTML=r.html||'';
  gx.classList.toggle('pub',pub);gx.hidden=false;document.body.classList.add('gx-open');if(r.after)r.after()}
function geClose(){if(gx.hidden)return;gx.hidden=true;GS.full=null;document.body.classList.remove('gx-open')}
gx.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
  if('gxclose' in b.dataset)go(GS.full&&GS.full.view==='stu'?'marketing/growth/studio':GS.full&&GS.full.view==='gro'?'marketing/growth/campaigns':'marketing/growth');
  if('gxsignin' in b.dataset)toast('Opens FLIK sign-in for existing merchants');
  if(b.dataset.lang)geSetLang(b.dataset.lang)});

/* Shared page pieces */
const geLangSeg=()=>`<div class="seg ge-lang" role="group" aria-label="Language">${['id','en'].map(l=>`<button class="${geLang()===l?'on':''}" data-lang="${l}">${l.toUpperCase()}</button>`).join('')}</div>`;
function geSoon(items){return`<section class="card ge-soon"><div class="ge-soon-h"><span class="qic">${ic('rocket',20,1.6)}</span><div><b>${geT('soon')}</b><span>${geT('soon.sub')}</span></div></div>
  <ul>${items.map(([id,txt])=>`<li><span class="st pu">${id}</span>${esc(txt)}</li>`).join('')}</ul></section>`}
function geSetLang(l){GS.lang=l;track('language_switched',{lang:l});show()}

/* ===== Prototype bar additions (only on the new screens; the Shipping switch stays elsewhere) ===== */
document.querySelector('.pbar').insertAdjacentHTML('beforeend',`<span class="pb-ge">
  <button class="pb" id="pt-acct">${ic('person',14)}<span id="pt-acv"></span>${ic('chev',12)}</button>
  <span class="pb-lang"></span>
  <button class="pb" data-ge="outbox">${ic('chat2',14)}${geT('bar.outbox')} <span class="n" id="pt-wa">0</span></button>
  <button class="pb" data-ge="ledger">${ic('wallet',14)}${geT('bar.ledger')}</button>
  <button class="pb" data-ge="limits">${ic('sliders',14)}${geT('bar.limits')}</button>
  <button class="pb" data-ge="skip">${ic('clock',14)}${geT('bar.skip')}</button>
  <button class="pb" data-ge="end">${geT('bar.end')}</button>
  <button class="pb" data-ge="cashier">${ic('store',14)}${geT('bar.cashier')}</button></span>`);
document.querySelector('.pbar .pb-ge').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;e.stopPropagation();
  if(b.id==='pt-acct'){if(popFor===b){closePop();return}popFor=b;
    pop.innerHTML=`<h6>${geT('bar.account')}</h6>${GE_ACCOUNTS.map(k=>`<button class="opt" data-acc="${k}"><span class="rdo${GS.account===k?' on':''}"></span>${geT('acct.'+k)}</button>`).join('')}`;
    pop.querySelectorAll('[data-acc]').forEach(o=>o.onclick=()=>{closePop();geSetAccount(o.dataset.acc)});placePop(b,false);return}
  if(b.dataset.lang){geSetLang(b.dataset.lang);return}
  const a=b.dataset.ge;
  if(a==='outbox')geOutbox();if(a==='ledger')geLedger();if(a==='limits')geLimits();
  if(a==='skip'){GS.dayOffset+=7;track('demo_clock_skipped',{days:GS.dayOffset});toast(geT('bar.skipped',{date:geFdate(geNow())}));document.dispatchEvent(new Event('ge:tick'));show()}
  if(a==='end'){if(typeof geEndCampaign==='function')geEndCampaign();else toast(geT('bar.noCampaign'))}
  if(a==='cashier'){if(typeof geCashier==='function')geCashier();else geCashierSoon()}});
function geSetAccount(k){GS.account=k;GS.usage={};track('account_switched',{account:k});
  const h=location.hash.replace(/^#/,'');
  if(k==='anon'&&!/^(studio|claim\/)/.test(h))go('studio');
  else if(k!=='anon'&&h==='studio')go('marketing/growth/studio');
  else show()}
function geBarCounts(){const n=document.getElementById('pt-wa');if(n)n.textContent=GS.outbox.filter(m=>!m.more).length}
function geSync(view){document.body.classList.toggle('ge-lead',GS.account==='lead');const ab=document.querySelector('.acct b');if(ab)ab.textContent=GS.account==='lead'?(GS.lead||ST_LEAD_EXAMPLE).brand:GE_OWNER.store;const on=GE_VIEWS.includes(view)||!gx.hidden;if(GE_VIEWS.includes(view)){nav.querySelectorAll('[data-view="brd"]').forEach(b=>b.classList.add('on'));openGrp('brd')}document.body.classList.toggle('ge-on',on);
  document.getElementById('pt-acv').textContent=geT('acct.'+GS.account);
  document.querySelector('.pbar .pb-lang').innerHTML=geLangSeg();geBarCounts()}
function geOutbox(){
  drawer.innerHTML=`<div class="dh"><span class="kind">${ic('chat2',15)}${geT('outbox.title')}</span><button class="ib" data-dclose aria-label="Close">${ic('x',18)}</button></div>
  <div class="db"><p class="d-sub" style="margin:0 0 14px">${geT('outbox.sub')}</p>
  <div class="ge-wa">${GS.outbox.length?GS.outbox.map(m=>m.more?`<p class="ge-more">${esc(m.more)}</p>`:`<div class="ge-bub">${m.image?`<div class="ge-bimg">${m.image.startsWith('data:')?`<img src="${m.image}" alt="Message image">`:esc(m.image)}</div>`:''}<p>${esc(m.text)}</p>${m.foot?`<small class="ge-bf">${esc(m.foot)}</small>`:''}${m.btns?`<div class="ge-bbtn">${m.btns.map(b=>`<span>${esc(b)}</span>`).join('')}</div>`:''}<div class="ge-bm"><span class="chip">${esc(m.template)} · ${m.lang.toUpperCase()}</span><span>${geT('outbox.to')} ${fphone(m.to)}</span><time>${m.at.toTimeString().slice(0,5)}</time></div></div>`).join(''):`<p class="d-sub">${geT('outbox.empty')}</p>`}</div></div>`;
  openDrawer()}
function geLedger(){
  drawer.innerHTML=`<div class="dh"><span class="kind">${ic('wallet',15)}${geT('ledger.title')}</span><button class="ib" data-dclose aria-label="Close">${ic('x',18)}</button></div>
  <div class="db"><p class="d-sub" style="margin:0 0 14px">${geT('ledger.sub')}</p>
  <div class="ge-bal"><span>${geT('ledger.balance')}</span><b>${rp(GS.balance)}</b></div>
  <div class="ev">${GS.ledger.map(l=>`<div class="ev-i"><div class="hd"><b>${esc(l.label)}</b><time>${geFdate(l.at)}</time></div><span class="${l.amount<0?'ge-neg':'ge-pos'}">${l.amount<0?'−':'+'}${rp(l.amount)}</span></div>`).join('')}</div></div>`;
  openDrawer()}
function geLimits(){const keys=['regenPerDesign','designsPerDay','freeExportsPerMonth','llmFallbacksPerDay','competitors'];
  const draw=()=>{drawer.innerHTML=`<div class="dh"><span class="kind">${ic('sliders',15)}${geT('limits.title')}</span><button class="ib" data-dclose aria-label="Close">${ic('x',18)}</button></div>
  <div class="db"><p class="d-sub" style="margin:0 0 14px">${geT('limits.sub')}</p>
  <div class="ge-limw"><table class="ge-lim"><thead><tr><th></th>${GE_ACCOUNTS.map(a=>`<th class="${a===GS.account?'on':''}" title="${geT('acct.'+a)}">${geT('acct.s.'+a)}</th>`).join('')}</tr></thead>
  <tbody>${keys.map(k=>`<tr><th>${geT('limits.'+k)}</th>${GE_ACCOUNTS.map(a=>`<td class="${a===GS.account?'on':''}"><input type="number" min="0" value="${GE_LIMITS[k][a]}" data-lk="${k}" data-la="${a}" aria-label="${geT('limits.'+k)}, ${geT('acct.'+a)}"></td>`).join('')}</tr>`).join('')}</tbody></table></div>
  <div class="ge-lim2">${['leadExportPrice','exportPrice','waCost','llmPrice','matchMin','cpRefreshPrice','cpAutoDay'].map(k=>`<div class="fld"><label for="lk-${k}">${geT('limits.'+k)}</label><input id="lk-${k}" type="number" min="0" ${k==='cpAutoDay'?'max="28" ':''}step="${k==='matchMin'?5:k==='cpAutoDay'?1:500}" value="${GE_LIMITS[k]}" data-lk="${k}"></div>`).join('')}</div>
  <p class="d-sub">${geT('limits.topup')}</p>
  <button class="btn btn-o" data-lreset>${geT('limits.reset')}</button></div>`;
  drawer.querySelectorAll('input[data-lk]').forEach(i=>i.onchange=()=>{const v=Math.max(0,+i.value||0);if(i.dataset.la)GE_LIMITS[i.dataset.lk][i.dataset.la]=v;else GE_LIMITS[i.dataset.lk]=v;track('limit_changed',{limit:i.dataset.lk,account:i.dataset.la||'all',value:v})});
  drawer.querySelector('[data-lreset]').onclick=()=>{GS.usage={};toast(geT('limits.reset'))};openDrawer()};draw()}
function geCashierSoon(){modal.classList.add('nw');
  modal.innerHTML=`<div class="mh"><h3>${geT('bar.cashier')}</h3><button class="ib" data-mclose aria-label="Close">${ic('x',18)}</button></div><div class="mb">${geSoon([['C5','Cashier looks up the shopper\'s phone number and redeems the voucher']])}</div>`;mscrim.classList.add('open')}

/* The Guide shows the AG demo script on the new screens */
{const _g=guideModal;guideModal=function(){if(!document.body.classList.contains('ge-on'))return _g();
  modal.classList.add('nw');
  modal.innerHTML=`<div class="mh"><h3>Growth Engine v2 + Studio</h3><button class="ib" data-mclose aria-label="Close">${ic('x',18)}</button></div>
  <div class="mb guide"><p class="vf-lead">Example data only. Use Account in the dark bar to switch between a stranger, a lead and merchants.</p>
  <ol><li><b>Stranger</b> (<code>?account=anon</code>): pick the Linen shirt, type “earthy, lebaran feel”, see 4 watermarked previews, then Download and sign up (code <code>123456</code>).</li>
  <li><b>Lead</b>: Growth Engine › Studio and a one-time Competitor look at <code>@kain.kita.id</code>. My Brand and Campaign are locked behind “Become a FLIK merchant”.</li>
  <li><b>My Brand</b> (active merchant): Instagram, Facebook, Meta ads and website next to the competitors' average, then the FLIK store. Send campaign on a segment.</li>
  <li><b>Competitor</b>: the summary compares My brand vs A vs B vs C per channel. Pick a competitor for its channels and action plan (campaign, content, or suggestion only). Add up to 3 (Limits), remove with ×.</li>
  <li><b>Studio</b> › Create content: Instagram feed, carousel, Linen shirt, style “cyberpunk neon” → below 60% match, Use AI (free with the FLIK watermark, or from the balance) → Download.</li>
  <li><b>WhatsApp</b>: create content for WhatsApp › Send with FLIK › pick a template › Choose shoppers.</li>
  <li><b>Campaign</b>: Selected shoppers › Cashback › rules › Review shows what you receive per order › Submit (paid from the balance). Outbox has the messages; Skip 7 days for results; End campaign sends the owner's report.</li></ol>
  <p class="vf-lead">Public holidays and real Shopify/WooCommerce shops are read live when they answer (free, no key). Instagram, WhatsApp and payments are example data. Turn live sources off with <code>?live=0</code>.</p></div>
  <div class="mf"><button class="btn btn-p" data-mclose>Start</button></div>`;mscrim.classList.add('open')}}

/* ===== Sidebar: Marketing › Growth Engine (tabs inside) ===== */
Object.assign(VIEWS,{brd:['marketing/growth','Growth Engine · My Brand'],cmp:['marketing/growth/competitors','Growth Engine · Competitor'],stu:['marketing/growth/studio','Growth Engine · Studio'],gro:['marketing/growth/campaigns','Growth Engine · Campaign']});
GE_VIEWS.forEach(v=>document.querySelector('.main').insertAdjacentHTML('beforeend',`<main class="content" id="view-${v}" hidden></main>`));
{const mk=NAV.find(n=>n.t==='Marketing');if(mk)mk.sub.unshift({t:'Growth Engine',v:'brd'})}

/* A lead's sidebar: Growth Engine (Studio and a competitor look), plus the way to become a merchant */
{const _rn=renderNav;renderNav=function(){if(GS.account!=='lead')return _rn();
  nav.innerHTML=`<div class="navh">FLIK</div><button class="ni" data-view="brd">${ic('rocket')}${geT('nav.growth')}</button>
  <div class="navh">${geT('lead.nav.h')}</div><button class="ni" data-leadup>${ic('store')}${geT('gro.lead.cta')}</button>`;
  nav.querySelector('[data-view]').onclick=()=>go('marketing/growth/studio');
  nav.querySelector('[data-leadup]').onclick=()=>{track('merchant_cta_clicked',{from:'sidebar'});toast('Opens FLIK merchant sign-up')}}}
