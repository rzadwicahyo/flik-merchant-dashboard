/* ===== Marketing › Growth Engine: FLIK as the merchant's marketing consultant (CRM) =====
 * PRD: "FLIK Growth Engine: Merchant CRM PRD" (2 Nov). One loop: Know → Recommend → Act → Measure.
 * Rules decided with Reza:
 *  - every insight ends in an action that runs through FLIK (a voucher or a FLIK link);
 *  - a merchant only sees shoppers who interacted with their own store; cross-merchant data stays with FLIK;
 *  - the engine works per channel (online, offline), not per merchant category;
 *  - the merchant opts in to every campaign; nothing runs on its own;
 *  - fee = commission + campaign fee, charged only on attributed orders (voucher or link used in the period);
 *    campaign fee is flat or %, set per campaign; caps and holdout are configurable;
 *  - merchant voucher: deducted before disbursement; FLIK voucher: FLIK pays the discount.
 * Recommendations are rule-based (no ML/AI yet). Everything here is example data.
 */
document.querySelector('.main').insertAdjacentHTML('beforeend','<main class="content" id="view-crm" hidden></main>');
Object.assign(VIEWS,{crm:['marketing/growth','Growth Engine']});
{const mk=NAV.find(n=>n.t==='Marketing');if(mk)mk.sub.unshift({t:'Growth Engine',v:'crm'})}

const GE_COMMISSION=2;        // % FLIK commission (example; the merchant's real rate comes from their pricing)
const GE_AOV=285000;          // example average order value
const GE={tab:'overview',ch:'all',cmps:[],settings:{post:true,receipt:true,cashier:true,cap:7},seeded:false};
const GE_TABS=[['overview','Overview'],['cmps','Your campaigns'],['flik','FLIK campaigns'],['settings','Settings']];
const GE_CH={all:'All channels',online:'Online',offline:'Offline'};

/* ---- Know: segments from the merchant's own shoppers, keyed by phone number (online + offline merged) ---- */
const GE_SEG=[
  {k:'new',n:'New',rule:'1 order, 14 to 60 days ago',on:1640,off:920,gmv:610e6},
  {k:'repeat',n:'Repeat',rule:'2 or more orders in 90 days',on:410,off:262,gmv:498e6},
  {k:'vip',n:'VIP',rule:'Top 5% by spend in 180 days',on:118,off:71,gmv:342e6},
  {k:'risk',n:'At risk',rule:'Repeat shopper, no order in 45 to 90 days',on:384,off:207,gmv:0},
  {k:'lapsed',n:'Lapsed',rule:'No order in more than 90 days',on:690,off:452,gmv:0},
  {k:'abandon',n:'Checkout not paid',rule:'Reached FLIK checkout, didn’t pay, last 7 days',on:86,off:0,gmv:0}];
const segN=(s,ch=GE.ch)=>ch==='online'?s.on:ch==='offline'?s.off:s.on+s.off;
const segOf=k=>GE_SEG.find(s=>s.k===k);
const GE_BENCH={repeat:10.8,peers:14.2,cat:'fashion'};   // peer number = anonymised FLIK merchants, same category and channel mix

/* ---- Recommend: rule-based playbooks ---- */
const GE_PLAY={
  second:{n:'Second purchase',ic:'repeat',seg:'new',conv:.06,offer:['pct',15],min:150000,days:14,fee:['pct',1.5],
    why:n=>`${plural(n,'shopper')} bought once 14 to 60 days ago. Most of your shoppers never come back after the first order, so this is the biggest lever.`,
    msg:'Hi {{name}}, thanks for shopping at {{store}}! Here is {{offer}} off your next order, valid until {{end}}. Use code {{code}} or tap {{link}}'},
  recover:{n:'Finish checkout',ic:'cart',seg:'abandon',conv:.18,offer:['amt',20000],min:200000,days:3,fee:['pct',1.5],ch:'online',
    why:n=>`${plural(n,'shopper')} reached your FLIK checkout in the last 7 days and didn’t pay. They are the closest to buying.`,
    msg:'Hi {{name}}, your cart at {{store}} is still waiting. Finish your order with {{offer}} off until {{end}}: {{link}}'},
  winback:{n:'Win back',ic:'clock',seg:'risk',conv:.04,offer:['pct',10],min:150000,days:14,fee:['amt',2000],
    why:n=>`${plural(n,'repeat shopper')} haven’t ordered in 45 to 90 days. After 90 days they are much harder to bring back.`,
    msg:'Hi {{name}}, we miss you at {{store}}! Come back with {{offer}} off until {{end}}. Code {{code}} or {{link}}'},
  vip:{n:'VIP reward',ic:'star',seg:'vip',conv:.10,offer:['amt',50000],min:500000,days:21,fee:['pct',1],
    why:n=>`Your ${plural(n,'top shopper')} bring a third of your GMV. A thank-you keeps them buying.`,
    msg:'Hi {{name}}, you are one of {{store}}’s favourite customers. Enjoy {{offer}} off your next order until {{end}}. Code {{code}} or {{link}}'}};
if(!P.repeat)Object.assign(P,{repeat:'<path d="M17 2.5 20.5 6 17 9.5"/><path d="M3.5 11.5V10a4 4 0 0 1 4-4h13"/><path d="M7 21.5 3.5 18 7 14.5"/><path d="M20.5 12.5V14a4 4 0 0 1-4 4h-13"/>',
  star:'<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z"/>',clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'});
const geIc=n=>ic(P[n]?n:'tag',18);

/* ---- FLIK campaigns: FLIK-funded, across several merchants; the merchant decides to join ---- */
const GE_FLIK=[
  {id:'F-1212',n:'12.12 Payday Sale',d0:new Date(2026,11,10),d1:new Date(2026,11,14),offer:['amt',25000],min:200000,fee:['pct',2],joined:34,
   segs:['repeat','vip','risk'],about:'FLIK sends a Rp25.000 voucher to your shoppers in the segments you pick. FLIK pays the voucher; you get the full order amount.'},
  {id:'F-GJN',n:'Gajian week',d0:new Date(2026,9,25),d1:new Date(2026,9,31),offer:['pct',10],min:150000,fee:['amt',3000],joined:21,max:30000,
   segs:['new','repeat'],about:'10% off up to Rp30.000 at payday, paid by FLIK. Shown on WhatsApp, after checkout and at the cashier.'}];

/* ---- example campaigns for an active merchant ---- */
function geSeed(){if(GE.seeded)return;GE.seeded=true;
  GE.cmps.push(geMake('second',{id:'C-1042',st:'running',d0:new Date(NOW-6*DAY),res:{sent:2310,read:1890,red:97,hold:231,holdRed:5,gmv:27.6e6}}));
  GE.cmps.push(geMake('winback',{id:'C-0987',st:'ended',d0:new Date(NOW-40*DAY),res:{sent:540,read:418,red:26,hold:60,holdRed:1,gmv:8.1e6}}))}
function geMake(play,o={}){const p=GE_PLAY[play],s=segOf(p.seg),ch=p.ch||'all',n=segN(s,ch);
  return{id:o.id||'C-'+(1100+GE.cmps.length),play,name:p.n,seg:p.seg,ch,offer:p.offer.slice(),min:p.min,days:p.days,fee:p.fee.slice(),
    budget:Math.round(n*.9*p.conv*offerVal(p.offer)*1.5/1e5)*1e5||1e6,maxSends:n,hold:10,msg:p.msg,src:'merchant',
    st:o.st||'draft',d0:o.d0||new Date(NOW.getTime()+DAY),res:o.res||null}}
const offerVal=o=>o[0]==='pct'?GE_AOV*o[1]/100:o[1];
const offerTx=o=>o[0]==='pct'?`${o[1]}%`:rp(o[1]);
const feeTx=f=>f[0]==='pct'?`${String(f[1]).replace('.',',')}% of the order`:`${rp(f[1])} per order`;
const feeAmt=(f,gmv,orders)=>f[0]==='pct'?gmv*f[1]/100:f[1]*orders;
const endOf=c=>new Date(c.d0.getTime()+c.days*DAY);
function geExpect(c){const p=GE_PLAY[c.play],n=Math.min(segN(segOf(c.seg),c.ch),c.maxSends),reach=Math.round(n*(1-c.hold/100)),orders=Math.round(reach*(p?p.conv:.05)),gmv=orders*GE_AOV;
  return{n,reach,orders,gmv,vc:Math.min(orders*offerVal(c.offer),c.budget),fee:feeAmt(c.fee,gmv,orders),com:gmv*GE_COMMISSION/100}}
const geStat=st=>({draft:['Draft','gr'],scheduled:['Scheduled','pu'],running:['Running','ok'],paused:['Paused','warn'],ended:['Ended','gr']}[st]);

/* ===== Render ===== */
function renderCrm(){const el=document.getElementById('view-crm');
  if(!has('pay')){el.innerHTML=`<h1>Growth Engine</h1><section class="card w-empty"><span class="qic">${ic('chart',22,1.6)}</span><div><b>Growth Engine works with FLIK Payments</b><span>Campaigns end in a FLIK checkout, payment link or cashier voucher, so FLIK can see which orders they bring.</span></div><button class="btn btn-p" data-toast="Opens Payments setup">Set up Payments</button></section>`;return}
  if(PS.mode==='new'){el.innerHTML=`<h1>Growth Engine</h1><section class="card w-empty"><span class="qic">${ic('user',22,1.6)}</span><div><b>Your first recommendations show up after 50 customers</b><span>Every shopper who pays through FLIK, online or at your cashier, is saved by phone number. FLIK then tells you who to bring back and how.</span></div><a class="btn btn-p" href="#invoices/create">Create invoice</a></section>`;return}
  geSeed();
  el.innerHTML=`<div class="ph"><div><h1>Growth Engine</h1><p class="sec-sub ge-sub">Who your customers are, what to do next, and what it brought in. Only shoppers of Aruna Studio are shown.</p></div><button class="btn btn-p" data-genew>${ic('plus',15)}New campaign</button></div>
  <div class="tabs" role="tablist">${GE_TABS.map(([k,t])=>`<button class="tab${GE.tab===k?' on':''}" role="tab" aria-selected="${GE.tab===k}" data-getab="${k}">${t}${k==='cmps'&&GE.cmps.filter(c=>c.st==='running'||c.st==='scheduled').length?` <span class="ge-n">${GE.cmps.filter(c=>c.st==='running'||c.st==='scheduled').length}</span>`:''}</button>`).join('')}</div>
  <div id="ge-body">${({overview:geOverview,cmps:geCampaigns,flik:geFlik,settings:geSettings})[GE.tab]()}</div>`;
  track('crm_tab_viewed',{tab:GE.tab})}

function geOverview(){const tot=sum(GE_SEG.filter(s=>['new','repeat','vip','risk','lapsed'].includes(s.k)),s=>segN(s)),run=GE.cmps.filter(c=>c.res),attr=sum(run,c=>c.res.gmv);
  const recs=Object.keys(GE_PLAY).filter(k=>!GE.cmps.some(c=>c.play===k&&(c.st==='running'||c.st==='scheduled'))&&(GE.ch!=='offline'||!GE_PLAY[k].ch)).map(k=>[k,GE_PLAY[k],segN(segOf(GE_PLAY[k].seg),GE_PLAY[k].ch||GE.ch)]).filter(x=>x[2]>0);
  DL['ge-seg']=()=>['flik-customer-segments',['Segment','Rule','Online','Offline','Total','GMV 90 days'],GE_SEG.map(s=>[s.n,s.rule,s.on,s.off,s.on+s.off,s.gmv])];
  return`<div class="ge-k">
    ${geKpi('Customers (180 days)',tot.toLocaleString('id-ID'),'Online and offline, merged by phone number')}
    ${geKpi('Repeat rate',fpct(GE_BENCH.repeat),`Similar ${GE_BENCH.cat} merchants on FLIK: ${fpct(GE_BENCH.peers)}`,'warn')}
    ${geKpi('At risk of leaving',segN(segOf('risk')).toLocaleString('id-ID'),'Repeat shoppers, no order in 45 to 90 days')}
    ${geKpi('GMV from campaigns',compact(attr),`${plural(run.length,'campaign')}, attributed by voucher or link`,'ok')}</div>
  <div class="sec-h"><div><h2 class="sec">What to do this week</h2><p class="sec-sub">Written from your own shoppers every Monday. Each one is a campaign you can review and start.</p></div>
    <div class="sec-a"><div class="seg" role="tablist" aria-label="Channel">${Object.entries(GE_CH).map(([k,t])=>`<button class="${GE.ch===k?'on':''}" data-gech="${k}">${t}</button>`).join('')}</div></div></div>
  <div class="ge-recs">${recs.length?recs.map(([k,p,n],i)=>{const c=geMake(k);c.ch=p.ch||GE.ch;const e=geExpect(c);return`<section class="card ge-rec${k==='second'?' top':''}">
    <div class="ge-rh"><span class="ge-ic">${geIc(p.ic)}</span><div><b>${p.n}</b><span class="src">${segOf(p.seg).n} · ${plural(n,'shopper')} · ${p.ch?'Online only':GE_CH[GE.ch]}</span></div>${k==='second'?'<span class="st pu">Biggest lever</span>':''}</div>
    <p>${p.why(n)}</p>
    <dl class="ge-dl"><dt>Offer</dt><dd>${offerTx(p.offer)} off, min. ${rp(p.min)}, ${p.days} days</dd><dt>Expected</dt><dd>~${plural(e.orders,'order')} · ~${compact(e.gmv)}</dd><dt>Fee</dt><dd>Only on orders it brings: ${feeTx(p.fee)}</dd></dl>
    <div class="ge-ra"><button class="btn btn-p" data-gerec="${k}">Review campaign</button><button class="btn btn-o" data-geskip="${k}">Not now</button></div></section>`}).join('')
    :`<section class="card w-empty"><span class="qic">${ic('check',22,1.6)}</span><div><b>Nothing new this week</b><span>Your campaigns cover every recommendation. Check results in Your campaigns.</span></div></section>`}</div>
  <div class="sec-h"><div><h2 class="sec">Your customers</h2><p class="sec-sub">Segments update every night. Thresholds can be changed in Settings.</p></div><div class="sec-a">${dlBtn('ge-seg')}</div></div>
  <div class="tbl-wrap"><table class="ge-t"><thead><tr><th>Segment</th><th>Rule</th><th class="r">Online</th><th class="r">Offline</th><th class="r">Total</th><th class="r">GMV, 90 days</th><th></th></tr></thead><tbody>
    ${GE_SEG.map(s=>{const play=Object.keys(GE_PLAY).find(k=>GE_PLAY[k].seg===s.k);return`<tr><td><b>${s.n}</b></td><td class="src">${s.rule}</td><td class="r num">${s.on.toLocaleString('id-ID')}</td><td class="r num">${s.off?s.off.toLocaleString('id-ID'):'<span class="src">—</span>'}</td><td class="r num"><b>${(s.on+s.off).toLocaleString('id-ID')}</b></td><td class="r num">${s.gmv?compact(s.gmv):'<span class="src">—</span>'}</td><td class="r">${play?`<button class="lnk" data-gerec="${play}">${GE_PLAY[play].n}</button>`:''}</td></tr>`}).join('')}</tbody></table></div>
  <p class="ge-fine">Peer numbers are averages of other FLIK merchants and never show who their shoppers are.</p>`}
const geKpi=(l,v,s,tone)=>`<section class="card ge-kpi"><span class="kpi-l">${l}</span><b class="num${tone?' '+tone:''}">${v}</b><span class="src">${s}</span></section>`;

function geCampaigns(){const L=GE.cmps.slice().sort((a,b)=>({running:0,scheduled:1,paused:2,draft:3,ended:4}[a.st]-{running:0,scheduled:1,paused:2,draft:3,ended:4}[b.st]));
  if(!L.length)return`<section class="card w-empty"><span class="qic">${ic('tag',22,1.6)}</span><div><b>No campaigns yet</b><span>Start one from What to do this week, or join a FLIK campaign.</span></div><button class="btn btn-p" data-getab="overview">See recommendations</button></section>`;
  DL['ge-cmps']=()=>['flik-campaigns',['ID','Campaign','Source','Status','Channel','Start','End','Sent','Orders','Attributed GMV','Incremental GMV','Campaign fee'],L.map(c=>{const r=geRes(c);return[c.id,c.name,c.src==='flik'?'FLIK':'Merchant',geStat(c.st)[0],GE_CH[c.ch],fdayISO(c.d0),fdayISO(endOf(c)),r?r.sent:'',r?r.red:'',r?r.gmv:'',r?Math.round(r.inc):'',r?Math.round(r.fee):'']})];
  return`<div class="sec-h"><div><h2 class="sec">${plural(L.length,'campaign')}</h2><p class="sec-sub">Orders count when the shopper uses the campaign voucher or link during the campaign. Incremental compares with the holdout group, who got nothing.</p></div><div class="sec-a">${dlBtn('ge-cmps')}</div></div>
  <div class="tbl-wrap"><table class="ge-t"><thead><tr><th>Campaign</th><th>Status</th><th>Channel</th><th>Period</th><th class="r">Sent</th><th class="r">Orders</th><th class="r">Attributed GMV</th><th class="r">Incremental</th><th class="r">Fees</th></tr></thead><tbody>
  ${L.map(c=>{const r=geRes(c),s=geStat(c.st);return`<tr data-gecmp="${c.id}"><td><b>${esc(c.name)}</b><span class="src ge-l2">${c.id} · ${c.src==='flik'?'FLIK campaign':segOf(c.seg).n}</span></td><td><span class="st ${s[1]}">${s[0]}</span></td><td>${GE_CH[c.ch]}</td><td class="date">${c.d0.getDate()} ${MON[c.d0.getMonth()]} to ${fday(endOf(c))}</td>
    <td class="r num">${r?r.sent.toLocaleString('id-ID'):'<span class="src">—</span>'}</td><td class="r num">${r?r.red:'<span class="src">—</span>'}</td><td class="r num">${r?compact(r.gmv):'<span class="src">—</span>'}</td><td class="r num">${r?`<span class="delta up">+${compact(r.inc)}</span>`:'<span class="src">—</span>'}</td><td class="r num">${r?compact(r.fee+r.com):'<span class="src">—</span>'}</td></tr>`}).join('')}</tbody></table></div>`}
function geRes(c){const r=c.res;if(!r)return null;const cr=r.red/Math.max(1,r.sent),hr=r.holdRed/Math.max(1,r.hold),aov=r.gmv/Math.max(1,r.red),inc=Math.max(0,(cr-hr)*r.sent*aov);
  return{...r,cr,hr,aov,inc,fee:feeAmt(c.fee,r.gmv,r.red),com:r.gmv*GE_COMMISSION/100,vc:r.red*offerVal(c.offer)}}

function geFlik(){return`<div class="sec-h"><div><h2 class="sec">FLIK campaigns you can join</h2><p class="sec-sub">FLIK runs these across several merchants and pays the voucher. You choose which of your segments and channels take part.</p></div></div>
  <div class="ge-recs">${GE_FLIK.map(f=>{const j=GE.cmps.find(c=>c.fid===f.id),soon=f.d0>NOW;return`<section class="card ge-rec">
    <div class="ge-rh"><span class="ge-ic fl">${ic('sparkle',18)}</span><div><b>${f.n}</b><span class="src">${fday(f.d0)} to ${fday(f.d1)} · ${f.joined} merchants joined</span></div>${j?'<span class="st ok">Joined</span>':soon?'<span class="st pu">Open</span>':'<span class="st warn">Running</span>'}</div>
    <p>${f.about}</p>
    <dl class="ge-dl"><dt>Offer</dt><dd>${offerTx(f.offer)} off${f.max?`, up to ${rp(f.max)}`:''}, min. ${rp(f.min)}</dd><dt>Voucher</dt><dd>FLIK voucher, paid by FLIK</dd><dt>Fee</dt><dd>Only on orders it brings: ${feeTx(f.fee)}</dd></dl>
    <div class="ge-ra">${j?`<button class="btn btn-o" data-gecmp="${j.id}">See campaign</button>`:`<button class="btn btn-p" data-gejoin="${f.id}">Review and join</button>`}</div></section>`}).join('')}</div>`}

function geSettings(){const S=GE.settings,row=(k,t,d)=>`<div class="ws-r"><div><b>${t}</b><span>${d}</span></div><button class="sw${S[k]?' on':''}" data-geset="${k}" role="switch" aria-checked="${!!S[k]}" aria-label="${t}"></button></div>`;
  return`<section class="card ge-set"><h2 class="sec" style="margin-top:0">Where campaigns can appear</h2>
    ${row('post','Offer on the page after checkout (online)','Shows the next-purchase voucher on FLIK’s thank-you page. Off: shoppers see the standard thank-you page.')}
    ${row('receipt','Voucher on the receipt (online and offline)','Adds the voucher to the WhatsApp or email receipt FLIK sends.')}
    ${row('cashier','Prompt in the cashier app (offline)','When the cashier enters a phone number that has a campaign voucher, the app shows it and applies it.')}
    <div class="ws-r"><div><b>At most one message per shopper every</b><span>Across all your campaigns and FLIK campaigns together, so shoppers don’t feel spammed.</span></div><div class="fld ge-cap"><select data-gecap>${[3,7,14].map(d=>`<option value="${d}" ${S.cap===d?'selected':''}>${d} days</option>`).join('')}</select></div></div>
    <p class="ge-fine">Messages come from FLIK’s WhatsApp number with your store name. Every message has a way to stop marketing messages, and shoppers who stop are never sent to again.</p></section>`}

/* ===== Review a campaign: settings on the left, what the shopper and cashier see on the right ===== */
let GED=null,gePv='wa';
function geOpen(c){GED=c;gePv=c.ch==='offline'?'cashier':'wa';modal.classList.add('wide');drawGe();mscrim.classList.add('open');track('crm_campaign_reviewed',{play:c.play||'flik',src:c.src})}
function drawGe(){const c=GED,e=geExpect(c),fl=c.src==='flik',ro=c.st!=='draft';
  const segs=fl?GE_FLIK.find(f=>f.id===c.fid).segs:[c.seg];
  modal.innerHTML=`<div class="mh"><h3>${ro?esc(c.name):fl?'Join '+esc(c.name):'Review campaign: '+esc(c.name)}</h3><button class="ib" data-mclose aria-label="Close">${ic('x',18)}</button></div>
  <div class="mb ge-m"><div class="ge-ml">
    ${ro?geResults(c):''}
    <div class="dsec"><h5>Who gets it</h5>
      ${fl?`<div class="ge-chk">${segs.map(k=>`<label class="ck"><input type="checkbox" data-gefseg="${k}" ${c.fsegs.includes(k)?'checked':''} ${ro?'disabled':''}> ${segOf(k).n} <span class="src">${plural(segN(segOf(k),c.ch),'shopper')}</span></label>`).join('')}</div>`
      :`<p class="ge-p"><b>${segOf(c.seg).n}</b>: ${segOf(c.seg).rule}. ${plural(e.n,'shopper')}.</p>`}
      <div class="fld"><label>Channel</label><div class="seg">${Object.entries(GE_CH).map(([k,t])=>`<button class="${c.ch===k?'on':''}" data-gefch="${k}" ${ro||(GE_PLAY[c.play]&&GE_PLAY[c.play].ch&&k!=='online')?'disabled':''}>${t}</button>`).join('')}</div>
        <div class="hint">${c.ch==='online'?'WhatsApp with a FLIK link, plus the page after checkout and the receipt.':c.ch==='offline'?'WhatsApp with a voucher code, plus a prompt in your cashier app.':'Online and offline. The voucher works on both and can be used once.'}</div></div>
      <div class="fld"><label for="ge-hold">Holdout group</label><select id="ge-hold" data-gef="hold" ${ro?'disabled':''}>${[5,10,20].map(v=>`<option value="${v}" ${c.hold===v?'selected':''}>${v}% get nothing, to measure the real effect</option>`).join('')}</select></div></div>
    <div class="dsec"><h5>Offer</h5>
      <div class="ge-g2"><div class="fld"><label>Discount</label><div class="ge-in"><select data-gef="otype" ${ro||fl?'disabled':''}><option value="pct" ${c.offer[0]==='pct'?'selected':''}>%</option><option value="amt" ${c.offer[0]==='amt'?'selected':''}>Rp</option></select><input data-gef="oval" inputmode="numeric" value="${c.offer[1]}" ${ro||fl?'disabled':''}></div></div>
      <div class="fld"><label>Minimum order</label><input data-gef="min" inputmode="numeric" value="${c.min}" ${ro||fl?'disabled':''}></div>
      <div class="fld"><label>Starts</label><input type="date" data-gef="d0" value="${fdayISO(c.d0)}" ${ro||fl?'disabled':''}></div>
      <div class="fld"><label>Days</label><input data-gef="days" inputmode="numeric" value="${c.days}" ${ro||fl?'disabled':''}></div></div>
      <p class="ge-p src">${fl?'FLIK voucher: FLIK pays the discount and you get the full order amount.':'Merchant voucher: the discount is deducted from the order before it reaches your balance.'}</p></div>
    <div class="dsec"><h5>Limits</h5>
      <div class="ge-g2">${fl?'':`<div class="fld"><label>Voucher budget</label><input data-gef="budget" inputmode="numeric" value="${c.budget}" ${ro?'disabled':''}><div class="hint">The campaign stops when vouchers worth this are used.</div></div>`}
      <div class="fld"><label>Most messages to send</label><input data-gef="maxSends" inputmode="numeric" value="${c.maxSends}" ${ro?'disabled':''}><div class="hint">Plus at most 1 message per shopper every ${GE.settings.cap} days.</div></div></div></div>
    <div class="dsec"><h5>What you pay</h5>
      <dl class="kv"><dt>Orders this campaign brings</dt><dd>Commission ${GE_COMMISSION}% + campaign fee ${feeTx(c.fee)}</dd><dt>All other orders</dt><dd>Commission ${GE_COMMISSION}% only, as today</dd><dt>Messages</dt><dd>Included, no charge</dd></dl>
      ${ro?'':`<div class="ge-est"><b>If it goes as expected</b><span>~${plural(e.orders,'order')} from ${plural(e.reach,'shopper')} · ~${compact(e.gmv)} GMV</span><span>Campaign fee ~${compact(e.fee)} · ${fl?'voucher paid by FLIK':`vouchers ~${compact(e.vc)}`}</span></div>`}</div>
  </div>
  <div class="ge-mr"><div class="tabs ge-pvt" role="tablist">${[['wa','WhatsApp'],['post','After checkout'],['cashier','Cashier app']].filter(([k])=>k==='wa'||(k==='post'?c.ch!=='offline':c.ch!=='online')).map(([k,t])=>`<button class="tab${gePv===k?' on':''}" data-gepv="${k}">${t}</button>`).join('')}</div>${gePreview(c)}</div></div>
  <div class="mf">${ro?`${c.st==='running'?'<button class="btn btn-o" data-gest="paused">Pause</button>':c.st==='paused'?'<button class="btn btn-o" data-gest="running">Resume</button>':''}${c.st!=='ended'?'<button class="btn btn-o" data-gest="ended">End campaign</button>':''}<button class="btn btn-p" data-mclose>Done</button>`
    :`<button class="btn btn-o" data-mclose>Cancel</button><button class="btn btn-p" data-gego>${fl?'Join campaign':'Start campaign'}</button>`}</div>`;
  modal.onclick=geModalClick;modal.onchange=geModalChange}
function geResults(c){const r=geRes(c);if(!r)return`<p class="ge-p src">Results show up once the first messages are sent.</p>`;
  return`<div class="ge-res"><div class="ge-rk">${[['Sent',r.sent.toLocaleString('id-ID')],['Orders',r.red],['Attributed GMV',compact(r.gmv)],['Incremental GMV','+'+compact(r.inc)]].map(([l,v])=>`<div><span class="kpi-l">${l}</span><b class="num">${v}</b></div>`).join('')}</div>
    <div class="ge-bars"><div><span>Got the campaign</span><i style="width:${Math.min(100,r.cr*100*8)}%"></i><b class="num">${fpct(r.cr*100)}</b></div><div class="h"><span>Holdout (${plural(r.hold,'shopper')})</span><i style="width:${Math.min(100,r.hr*100*8)}%"></i><b class="num">${fpct(r.hr*100)}</b></div></div>
    <p class="ge-p src">${fpct(r.cr*100)} of shoppers who got it ordered, against ${fpct(r.hr*100)} who didn’t. Fees so far: commission ${compact(r.com)} + campaign fee ${compact(r.fee)}. Vouchers used: ${compact(r.vc)}.</p></div>`}
function geFill(t,c){const end=endOf(c);return esc(t).replace(/\{\{name\}\}/g,'Rina').replace(/\{\{store\}\}/g,'Aruna Studio').replace(/\{\{offer\}\}/g,offerTx(c.offer)).replace(/\{\{end\}\}/g,`${end.getDate()} ${MON[end.getMonth()]}`).replace(/\{\{code\}\}/g,'<b>ARUNA-RN7K</b>').replace(/\{\{link\}\}/g,'<u>flik.id/r/aruna-rn7k</u>')}
function gePreview(c){
  if(gePv==='wa')return`<div class="ge-ph"><div class="wa-h ge-wah"><b>Aruna Studio</b><span class="wa-by">via FLIK</span></div><div class="wa-chat"><div class="wa-m in"><span>${geFill(c.msg,c)}</span><span class="ge-stop">Reply STOP to stop offers from Aruna Studio</span><em>10:02</em></div></div>
    ${c.st==='draft'&&c.src!=='flik'?`<div class="fld"><label for="ge-msg">Message</label><textarea id="ge-msg" class="rk-tpl" rows="4" data-gef="msg">${esc(c.msg)}</textarea><div class="hint">Variables: {{name}} {{store}} {{offer}} {{end}} {{code}} {{link}}</div></div>`:''}</div>`;
  if(gePv==='post')return`<div class="ge-ph ge-ty"><span class="ge-ok">${ic('check',22,2)}</span><b>Payment successful</b><span class="src">Order #AR-20418 · ${rp(GE_AOV)}</span><div class="ge-vc"><span class="kpi-l">Your next order</span><b>${offerTx(c.offer)} off</b><span class="src">Min. ${rp(c.min)} · until ${fday(endOf(c))}</span><button class="btn btn-p">Save voucher</button></div>${GE.settings.post?'':'<p class="ge-fine">Turned off in Settings: shoppers see the standard page.</p>'}</div>`;
  return`<div class="ge-ph ge-cash"><div class="ge-cb"><span class="kpi-l">Cashier app · Pay</span><b class="num">${rp(GE_AOV)}</b><span class="src">Shopper +62 812-4410-7781</span></div>
    <div class="ge-pr"><span class="ge-ic">${geIc('star')}</span><div><b>Rina S. has a voucher</b><span>${esc(c.name)}: ${offerTx(c.offer)} off, min. ${rp(c.min)}</span></div></div>
    <div class="ge-pa"><button class="btn btn-o">Not now</button><button class="btn btn-p">Apply voucher</button></div>${GE.settings.cashier?'':'<p class="ge-fine">Turned off in Settings: the cashier won’t see this prompt.</p>'}</div>`}
const geNum=v=>+String(v).replace(/\D/g,'')||0;
function geModalChange(e){const t=e.target,c=GED;if(!t.dataset)return;
  if(t.dataset.gefseg){const k=t.dataset.gefseg;c.fsegs=t.checked?[...new Set([...c.fsegs,k])]:c.fsegs.filter(x=>x!==k);c.maxSends=sum(c.fsegs,k=>segN(segOf(k),c.ch));drawGe();return}
  const f=t.dataset.gef;if(!f)return;
  if(f==='hold')c.hold=+t.value;else if(f==='otype')c.offer[0]=t.value;else if(f==='oval')c.offer[1]=geNum(t.value);else if(f==='min')c.min=geNum(t.value);
  else if(f==='d0'){const d=new Date(t.value+'T09:00');if(!isNaN(d))c.d0=d}else if(f==='days')c.days=Math.max(1,geNum(t.value));else if(f==='budget')c.budget=geNum(t.value);else if(f==='maxSends')c.maxSends=geNum(t.value);else if(f==='msg')c.msg=t.value;
  drawGe()}
function geModalClick(e){const c=GED,b=e.target.closest('button');if(!b)return;
  if(b.dataset.gefch){c.ch=b.dataset.gefch;c.maxSends=c.src==='flik'?sum(c.fsegs,k=>segN(segOf(k),c.ch)):segN(segOf(c.seg),c.ch);if(c.ch==='online'&&gePv==='cashier'||c.ch==='offline'&&gePv==='post')gePv='wa';drawGe();return}
  if(b.dataset.gepv){gePv=b.dataset.gepv;drawGe();return}
  if(b.dataset.gest){c.st=b.dataset.gest;track('crm_campaign_status',{id:c.id,st:c.st});toast(`${c.name} ${c.st==='ended'?'ended':c.st==='paused'?'paused':'resumed'}`);closeModal();renderCrm();return}
  if('gego' in b.dataset){
    if(c.src==='flik'&&!c.fsegs.length){toast('Pick at least one segment');return}
    if(!c.offer[1]){toast('Set a discount');return}
    c.st=c.d0<=NOW?'running':'scheduled';if(!GE.cmps.includes(c))GE.cmps.push(c);
    if(c.st==='running')c.res={sent:0,read:0,red:0,hold:Math.round(c.maxSends*c.hold/100),holdRed:0,gmv:0};
    track('crm_campaign_started',{id:c.id,play:c.play||c.fid,src:c.src,ch:c.ch,hold:c.hold,fee:c.fee.join(':')});
    toast(c.src==='flik'?`You joined ${c.name}`:`${c.name} ${c.st==='running'?'is running':'starts '+fday(c.d0)}`);closeModal();GE.tab='cmps';renderCrm()}}

/* ===== Clicks on the page ===== */
document.getElementById('view-crm').addEventListener('click',e=>{const b=e.target.closest('[data-getab],[data-gech],[data-gerec],[data-geskip],[data-gejoin],[data-gecmp],[data-geset],[data-genew]');if(!b)return;const d=b.dataset;
  if(d.getab){GE.tab=d.getab;renderCrm();return}
  if(d.gech){GE.ch=d.gech;renderCrm();return}
  if(d.gerec){const c=geMake(d.gerec);c.ch=GE_PLAY[d.gerec].ch||GE.ch;c.maxSends=segN(segOf(c.seg),c.ch);geOpen(c);return}
  if(d.geskip){toast(`${GE_PLAY[d.geskip].n} comes back next Monday if it still fits`);track('crm_rec_skipped',{play:d.geskip});b.closest('.ge-rec').remove();return}
  if(d.gejoin){const f=GE_FLIK.find(x=>x.id===d.gejoin);const c={id:'C-'+(1100+GE.cmps.length),fid:f.id,name:f.n,src:'flik',seg:f.segs[0],fsegs:f.segs.slice(0,2),ch:'all',offer:f.offer.slice(),min:f.min,
    d0:f.d0,days:Math.round((f.d1-f.d0)/DAY)+1,fee:f.fee.slice(),budget:0,hold:10,st:'draft',res:null,msg:`Hi {{name}}, FLIK and {{store}} have a gift: {{offer}} off until {{end}}. Code {{code}} or {{link}}`};
    c.maxSends=sum(c.fsegs,k=>segN(segOf(k),c.ch));geOpen(c);return}
  if(d.gecmp){const c=GE.cmps.find(x=>x.id===d.gecmp);if(c)geOpen(c);return}
  if(d.geset){GE.settings[d.geset]=!GE.settings[d.geset];track('crm_setting_changed',{k:d.geset,on:GE.settings[d.geset]});renderCrm();return}
  if('genew' in d){GE.tab='overview';renderCrm();toast('Pick a recommendation to start from');}});
document.getElementById('view-crm').addEventListener('change',e=>{if(e.target.dataset.gecap!==undefined){GE.settings.cap=+e.target.value;track('crm_setting_changed',{k:'cap',v:GE.settings.cap})}});
