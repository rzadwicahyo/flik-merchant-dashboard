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
  store:'<path d="M4 9.5 5.5 4.5h13L20 9.5"/><path d="M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0"/><path d="M5.5 11.5v8h13v-8"/><path d="M10 19.5v-4h4v4"/>'
});

/* ===== State ===== */
const GS={account:'active',lang:null,usage:{},outbox:[],ledger:[],balance:GE_BALANCE,dayOffset:0,full:null};
GE_LEDGER_SEED.forEach(l=>GS.ledger.push({at:new Date(NOW-l.d*DAY),label:l.label,amount:l.amount}));
const geNow=()=>new Date(NOW.getTime()+GS.dayOffset*DAY);
const geMerchant=()=>['new','active','top'].includes(GS.account);
const geFdate=d=>d.toLocaleDateString(geLang()==='id'?'id-ID':'en-GB',{day:'numeric',month:'short',year:'numeric'});
/* Bahasa by default on public pages (Studio, claim), English in the dashboard, unless the bar sets it */
const geLang=()=>GS.lang||(GS.full&&GX_PUBLIC.includes(GS.full.full)?'id':'en');
function geT(k,v){const s=(GE_I18N[geLang()]||{})[k]??GE_I18N.en[k]??k;return v?s.replace(/\{(\w+)\}/g,(m,x)=>v[x]??m):s}
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
  GS.balance-=amount;const id='LG-'+(9000+GS.ledger.length);GS.ledger.unshift({at:geNow(),label,amount:-amount,id});
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
  const m={at:geNow(),template,lang,to,text:body,image:tp.noImage?null:image};GS.outbox.unshift(m);
  FLIK.apiLog.unshift({name:'whatsapp.send',method:'POST',path:'/v1/whatsapp/messages',source:'example data (outbox)'});
  geBarCounts();return m}

/* ===== Full-screen overlay: public Studio page, editor, idea review, claim page ===== */
const GX_PUBLIC=['studio','claim'];
const GX={};   // full-screen renderers, registered by studio.js and growth.js: GX[name] = g => ({title, html, after})
document.body.insertAdjacentHTML('beforeend','<div class="gx" id="gx" hidden role="dialog" aria-modal="false"><div class="gx-top" id="gx-top"></div><div class="gx-body" id="gx-body"></div></div>');
const gx=document.getElementById('gx');
function geRoute(h){let g=null;const id=h.split('/').pop();
  if(h==='studio')g={view:'stu',full:'studio'};
  else if(h==='studio/edit')g={view:'stu',full:'edit'};
  else if(h.startsWith('marketing/growth/idea/'))g={view:'gro',full:'idea',id};
  else if(h.startsWith('marketing/growth/campaign/'))g={view:'gro',sub:'campaign',id};
  else if(h.startsWith('claim/'))g={view:'gro',full:'claim',id};
  else if(h==='marketing/growth')g={view:'gro'};
  else if(h==='marketing/studio')g={view:'stu'};
  else if(h==='marketing/competitors')g={view:'cmp'};
  if(!g)return null;
  /* a stranger only has the public pages */
  if(GS.account==='anon'&&!['studio','edit','claim'].includes(g.full))return{redirect:'studio'};
  return g}
function geOpen(g){GS.full=g;const r=(GX[g.full]||(()=>({title:'',html:''})))(g),pub=GX_PUBLIC.includes(g.full);
  document.getElementById('gx-top').innerHTML=pub
    ?`<span class="gx-logo">FLIK <i>${g.full==='studio'?'Studio':''}</i></span><span class="gx-sp"></span>${geLangSeg()}${g.full==='studio'?`<button class="btn btn-o" data-gxsignin>${geT('gx.signin')}</button>`:''}`
    :`<button class="ib" data-gxclose aria-label="${geT('gx.close')}">${ic('x',18)}</button><span class="sep"></span><b>${esc(r.title||'')}</b><span class="gx-sp"></span>${r.actions||''}`;
  document.getElementById('gx-body').innerHTML=r.html||'';
  gx.classList.toggle('pub',pub);gx.hidden=false;document.body.classList.add('gx-open');if(r.after)r.after()}
function geClose(){if(gx.hidden)return;gx.hidden=true;GS.full=null;document.body.classList.remove('gx-open')}
gx.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
  if('gxclose' in b.dataset)go(GS.full&&GS.full.view==='stu'?'marketing/studio':'marketing/growth');
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
  else if(k!=='anon'&&h==='studio')go('marketing/studio');
  else show()}
function geBarCounts(){const n=document.getElementById('pt-wa');if(n)n.textContent=GS.outbox.length}
function geSync(view){const on=['gro','stu','cmp'].includes(view)||!gx.hidden;document.body.classList.toggle('ge-on',on);
  document.getElementById('pt-acv').textContent=geT('acct.'+GS.account);
  document.querySelector('.pbar .pb-lang').innerHTML=geLangSeg();geBarCounts()}
function geOutbox(){
  drawer.innerHTML=`<div class="dh"><span class="kind">${ic('chat2',15)}${geT('outbox.title')}</span><button class="ib" data-dclose aria-label="Close">${ic('x',18)}</button></div>
  <div class="db"><p class="d-sub" style="margin:0 0 14px">${geT('outbox.sub')}</p>
  <div class="ge-wa">${GS.outbox.length?GS.outbox.map(m=>`<div class="ge-bub">${m.image?`<div class="ge-bimg">${m.image.startsWith('data:')?`<img src="${m.image}" alt="Message image">`:esc(m.image)}</div>`:''}<p>${esc(m.text)}</p><div class="ge-bm"><span class="chip">${esc(m.template)} · ${m.lang.toUpperCase()}</span><span>${geT('outbox.to')} ${fphone(m.to)}</span><time>${m.at.toTimeString().slice(0,5)}</time></div></div>`).join(''):`<p class="d-sub">${geT('outbox.empty')}</p>`}</div></div>`;
  openDrawer()}
function geLedger(){
  drawer.innerHTML=`<div class="dh"><span class="kind">${ic('wallet',15)}${geT('ledger.title')}</span><button class="ib" data-dclose aria-label="Close">${ic('x',18)}</button></div>
  <div class="db"><p class="d-sub" style="margin:0 0 14px">${geT('ledger.sub')}</p>
  <div class="ge-bal"><span>${geT('ledger.balance')}</span><b>${rp(GS.balance)}</b></div>
  <div class="ev">${GS.ledger.map(l=>`<div class="ev-i"><div class="hd"><b>${esc(l.label)}</b><time>${geFdate(l.at)}</time></div><span class="${l.amount<0?'ge-neg':'ge-pos'}">${l.amount<0?'−':'+'}${rp(l.amount)}</span></div>`).join('')}</div></div>`;
  openDrawer()}
function geLimits(){const keys=['regenPerDesign','designsPerDay','freeExportsPerMonth','llmFallbacksPerDay','ownContextPerWeek','competitors'];
  const draw=()=>{drawer.innerHTML=`<div class="dh"><span class="kind">${ic('sliders',15)}${geT('limits.title')}</span><button class="ib" data-dclose aria-label="Close">${ic('x',18)}</button></div>
  <div class="db"><p class="d-sub" style="margin:0 0 14px">${geT('limits.sub')}</p>
  <div class="ge-limw"><table class="ge-lim"><thead><tr><th></th>${GE_ACCOUNTS.map(a=>`<th class="${a===GS.account?'on':''}" title="${geT('acct.'+a)}">${geT('acct.s.'+a)}</th>`).join('')}</tr></thead>
  <tbody>${keys.map(k=>`<tr><th>${geT('limits.'+k)}</th>${GE_ACCOUNTS.map(a=>`<td class="${a===GS.account?'on':''}"><input type="number" min="0" value="${GE_LIMITS[k][a]}" data-lk="${k}" data-la="${a}" aria-label="${geT('limits.'+k)}, ${geT('acct.'+a)}"></td>`).join('')}</tr>`).join('')}</tbody></table></div>
  <div class="ge-lim2">${['leadExportPrice','exportPrice','waCost'].map(k=>`<div class="fld"><label for="lk-${k}">${geT('limits.'+k)}</label><input id="lk-${k}" type="number" min="0" step="500" value="${GE_LIMITS[k]}" data-lk="${k}"></div>`).join('')}</div>
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
  <ol><li><b>Studio (stranger):</b> make a product image, see watermarked previews, sign up to download.</li>
  <li><b>Lead:</b> download free, then a one-time look at one competitor on Instagram.</li>
  <li><b>Active merchant:</b> Marketing › Growth Engine shows ideas for this week from competitors, the store and big dates.</li>
  <li><b>Run an idea:</b> adjust the voucher and channels, pay WhatsApp sends from the balance, see the messages in Outbox.</li>
  <li><b>Results:</b> Skip 7 days, then End campaign: results against the holdout, a CSV, and the owner's WhatsApp report.</li></ol>
  <p class="vf-lead">Screens fill in ticket by ticket (docs/prototype/TICKETS.md).</p></div>
  <div class="mf"><button class="btn btn-p" data-mclose>Start</button></div>`;mscrim.classList.add('open')}}

/* ===== Sidebar: Marketing › Growth Engine, Studio, Competitors ===== */
Object.assign(VIEWS,{gro:['marketing/growth','Growth Engine'],stu:['marketing/studio','Studio'],cmp:['marketing/competitors','Competitors']});
['gro','stu','cmp'].forEach(v=>document.querySelector('.main').insertAdjacentHTML('beforeend',`<main class="content" id="view-${v}" hidden></main>`));
{const mk=NAV.find(n=>n.t==='Marketing');if(mk)mk.sub.unshift({t:'Growth Engine',v:'gro'},{t:'Studio',v:'stu'},{t:'Competitors',v:'cmp'})}
