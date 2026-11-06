/* ===== Marketing › Growth Engine v2 (BUILD_SPEC section 5). Replaces v3.12 (app/crm.js). =====
 * Three inputs make the ideas: competitors (compete.js), the merchant's own store (segments by phone number,
 * ported from v1) and the calendar (big dates + public holidays). An idea is a post or a campaign. The owner
 * reviews it, adjusts it (channels, voucher, Studio image, WhatsApp template, own context, holdout), executes it,
 * and reads the result against the holdout. Results feed the next week's ideas.
 * C1 ideas · C2 review and adjust · C3 execute · C4 campaigns and results · C5 claim page, cashier, settings.
 */
const GE={acct:null,dismissed:{},extra:[],camps:[],drafts:{},claims:[],settings:{cap:7,hold:10,lang:'id',quiet:true},seq:1100};
const GE_CH=[['wa','chat2'],['ig','studio'],['tt','sparkle'],['off','store']];
/* short headline for the auto-made Studio image */
const GE_HEAD={'i-1111':{id:'Akses awal 11.11',en:'11.11 early access'},'i-kk-sale':{id:'Beli 2, lebih hemat',en:'Buy 2, save more'},'i-second':{id:'Kembali lagi, ya',en:'Come back soon'},
  'i-sumpah':{id:'Bangga pakai batik',en:'Proud in batik'},'i-best':{id:'Terlaris bulan ini',en:'This month\'s best seller'}};

function geInit(){if(GE.acct===GS.account)return;GE.acct=GS.account;GE.dismissed={};GE.extra=[];GE.drafts={};GE.claims=[];GE.seq=1100;
  const sc=GE_SCALE[GS.account]||1;
  GE.camps=['active','top'].includes(GS.account)?GE_CAMP_SEED.map(c=>({...JSON.parse(JSON.stringify(c)),start:new Date(NOW.getTime()+c.start*DAY),st:'ended',code:'ARU'+c.id.slice(2),
    res:Object.fromEntries(Object.entries(c.res).map(([k,v])=>[k,Math.round(v*sc)]))})):[];
  if(geMerchant()&&!GS.designs.some(d=>d.merchant))geSeedDesigns()}
/* two saved Studio designs, so a merchant can pick one for a campaign */
function geSeedDesigns(){[['linen-shirt','festive-red','i-1111','-10%'],['batik-dress','terracotta-sun','i-sumpah','']].forEach(([p,sc,id,b],i)=>{const h=GE_HEAD[id];
  GS.designs.push({key:'m-seed'+i,merchant:true,at:new Date(NOW-(i+2)*DAY),product:{id:p},cat:'fashion',name:'',paid:true,
    design:{id:'m-seed'+i,format:'1:1',lang:'id',tone:'playful',badge:b,logoOn:true,logoPos:'bottom-left',brand:GE_BRAND.colour,round:0,seen:[],tags:[],match:100,tight:false},
    v:{scene:sc,layout:'left',h:h.id,s:ST_COPY.fashion.playful.id.s[0],c:ST_COPY.fashion.playful.id.c[0],hi:0,si:0,ci:0,badge:b}})})}

/* ----- numbers ----- */
const geSc=()=>GE_SCALE[GS.account]||1;
const geSeg=k=>GE_SEG.find(s=>s.k===k);
const geSegN=(k,ch)=>{const s=geSeg(k);if(!s)return 0;const sc=geSc();return Math.round((ch==='on'?s.on:ch==='off'?s.off:s.on+s.off)*sc)};
const geJt=n=>{n=Math.round(n);if(Math.abs(n)>=1e6){const v=n/1e6;return'Rp'+(v>=10?Math.round(v):v.toFixed(1)).toString().replace('.',',').replace(',0','')+' jt'}return rp(Math.round(n/1000)*1000)};
/* expected extra sales: the same model the result screen uses (rate × reach × order value, minus what the holdout buys) */
function geExpOf(i){if(i.type!=='campaign')return i.exp.map(v=>v*Math.max(geSc(),.08));const a=geAudience(i,GE.settings.hold),r=(i.conv||.05)*(i.ch.includes('off')?1:.62),x=a.send*r*GE_AOV*1.04*(1-1/2.3);return[x*.7,x*1.3]}
const geRange=x=>{return x[0]>=1e6?`Rp${Math.round(x[0]/1e6)}–${Math.round(x[1]/1e6)} jt`:`${geJt(x[0])}–${geJt(x[1])}`};
const geCap=t=>t?t.charAt(0).toUpperCase()+t.slice(1):t;
const geVText=v=>v?(v.kind==='pct'?v.v+'%':rp(v.v)):'';
const geOffer=(i,v,L)=>v?String((i.offer||{})[L]||(L==='id'?'diskon {v}':'{v} off')).replace('{v}',geVText(v)).replace('{max}',rp(v.max)):'';
const geUntil=(days,from=geNow())=>geFdate(new Date(from.getTime()+days*DAY));
const geIdeaList=()=>{geInit();const ids=GE_IDEAS_FOR[GS.account]||[];return[...GE.extra,...GE_IDEAS.filter(i=>ids.includes(i.id))]};
const geIdea=id=>geIdeaList().find(i=>i.id===id);
const geCampOf=id=>GE.camps.find(c=>c.idea===id&&c.st!=='ended');
function geAudience(i,hold){const n=(i.segs||[]).reduce((a,k)=>a+geSegN(k),0),opt=Math.round(n*.03),
  busy=GE.camps.some(c=>c.st==='running'&&c.ch.includes('wa'))?Math.round(n*.06):0,h=Math.round((n-opt-busy)*hold/100);
  return{n,on:(i.segs||[]).reduce((a,k)=>a+geSegN(k,'on'),0),off:(i.segs||[]).reduce((a,k)=>a+geSegN(k,'off'),0),opt,busy,hold:h,send:Math.max(0,n-opt-busy-h)}}

/* ----- ideas made from a competitor move (B3 "Get an idea") ----- */
function geIdeaIdFor(h,ai){if(h==='kain.kita.id'&&ai===0&&(GE_IDEAS_FOR[GS.account]||[]).includes('i-kk-sale'))return'i-kk-sale';const x=GE.extra.find(i=>i.cmp===h&&i.act===ai);return x?x.id:null}
function geIdeaFromActivity(c,ai){geInit();const id=geIdeaIdFor(c.h,ai);if(id){go('marketing/growth/idea/'+id);return}
  const a=c.f.activity[ai],n=c.f.name,k=a[1],what={id:a[2],en:a[3]},I={id:'i-c'+(GE.extra.length+1),cmp:c.h,act:ai,src:['competitor'],fresh:true,product:'linen-shirt',exp:[1e6,3e6]};
  if(k==='promo')Object.assign(I,{type:'campaign',segs:['risk','repeat'],ch:['wa','ig'],conv:.06,tpl:'bundle_offer',tpls:['bundle_offer','promo_discount','flash_sale'],scene:'linen-sand',
    voucher:{kind:'amt',v:30000,max:30000,min:300000,days:7,quota:120},offer:{id:'hemat {v} untuk belanja 2 produk',en:'{v} off when you buy 2'},
    title:{id:`Jawab promo ${n} dengan paket hemat`,en:`Answer ${n}'s promo with a bundle`},
    why:{id:`${n}: ${what.id.toLowerCase()}. Pelanggan berulang dan yang berisiko pergi paling mungkin membandingkan. Jawab dengan nilai, bukan diskon lebih dalam.`,en:`${n}: ${what.en.charAt(0).toLowerCase()+what.en.slice(1)}. Repeat and at-risk shoppers are the most likely to compare. Answer with value, not a deeper discount.`}});
  else Object.assign(I,{type:'post',ch:['ig','tt'],scene:k==='new'?'studio-white':'window-light',
    title:k==='price'?{id:`${n} turun harga: tunjukkan kualitas produkmu`,en:`${n} cut prices: show why yours is worth it`}:k==='new'?{id:`${n} rilis produk baru: tampilkan koleksi terbarumu`,en:`${n} launched new products: show your newest pieces`}:{id:`Coba yang berhasil untuk ${n}: reels styling`,en:`Try what worked for ${n}: a styling reel`},
    why:{id:`${n}: ${what.id.toLowerCase()}. Posting minggu ini supaya pengikutmu melihat pilihanmu dulu.`,en:`${n}: ${what.en.charAt(0).toLowerCase()+what.en.slice(1)}. Post this week so your followers see your option first.`},
    caption:{id:'Dibuat untuk dipakai setiap hari: bahan adem, jahitan rapi. Cek koleksinya di link bio.',en:'Made to be worn every day: cool fabric, neat stitching. See the collection at the link in bio.'}});
  GE.extra.unshift(I);track('idea_created',{source:'competitor',type:I.type});toast(geT('g.idea.made'));go('marketing/growth/idea/'+I.id)}

/* ----- the Studio image for an idea: a saved design, or one Studio makes from the idea's product ----- */
function geAutoDesign(i,L){const k='auto-'+i.id+'-'+L;let s=GS.designs.find(d=>d.key===k);if(s)return s;
  const cc=ST_COPY.fashion.playful[L],b=i.voucher?(i.voucher.kind==='pct'?'-'+i.voucher.v+'%':''):'',h=(GE_HEAD[i.id]||{})[L]||geL(i.title);
  s={key:k,auto:true,merchant:true,at:geNow(),product:{id:i.product},cat:'fashion',name:'',paid:true,
    design:{id:k,format:'1:1',lang:L,tone:'playful',badge:b,logoOn:true,logoPos:'bottom-left',brand:GE_BRAND.colour,round:0,seen:[],tags:[],match:100,tight:false},
    v:{scene:i.scene||'studio-white',layout:'left',h,s:cc.s[0],c:i.type==='post'?cc.c[1]||cc.c[0]:(L==='id'?'Pakai voucher':'Use voucher'),hi:0,si:0,ci:0,badge:b}};
  return s}
function geDesignOf(g){const s=GS.designs.find(d=>d.key===g.design);if(s)return s;const a=geAutoDesign(g.i,g.lang),v=g.voucher,b=v?(v.kind==='pct'?'-'+v.v+'%':'-'+Math.round(v.v/1000)+'rb'):'';a.v.badge=a.design.badge=b;return a}
function geImg(sd,W=540,fmt){const k=stSwap(sd),keepF=STU.design.format;if(fmt)STU.design.format=fmt;stBrandOn();const r=stRender(sd.v,W,{});STU.design.format=keepF;stSwap(k);return r.c}

/* ===== C1 landing ===== */
function renderGrowth(){const el=document.getElementById('view-gro'),g=GS.route||{};
  if(GS.account==='lead'){el.innerHTML=`<h1>${geT('gro.h')}</h1><section class="card w-empty"><span class="qic">${ic('rocket',22,1.6)}</span><div><b>${geT('gro.lead.h')}</b><span>${geT('gro.lead.sub')}</span></div><button class="btn btn-p" data-gelead>${geT('gro.lead.cta')}</button></section>`;
    el.querySelector('[data-gelead]').onclick=()=>{track('merchant_cta_clicked',{from:'growth'});toast(geT('lead.signup.toast'))};return}
  geInit();cpInit();
  if(g.sub==='campaign'){geRenderCamp(el,g.id);return}
  const ideas=geIdeaList().filter(i=>!GE.dismissed[i.id]),pulse=GE_PULSE[GS.account]||GE_PULSE.active,wk=geNow(),we=new Date(wk.getTime()+6*DAY);
  const cmpN=CP.tracked.length,cmpCh=CP.tracked.reduce((a,c)=>a+cpActs(c).filter(cpNew).length,0),dates=geBigDates(GE_HOL_CACHE),next=dates.find(d=>d.kind!=='payday');
  const ch=pulse.prev?Math.round((pulse.orders/pulse.prev-1)*100):0;
  el.innerHTML=`<div class="ph"><div><h1>${geT('g.week',{from:cpShort(wk),to:cpShort(we)})}</h1><p class="sec-sub ge-sub">${geT('gro.sub')}</p></div>
    <div class="g-hact">${geLangSeg()}<button class="btn btn-o" data-gset>${ic('gear',15)}${geT('g.settings')}</button></div></div>
  <section class="card g-flow" aria-label="${geT('g.flow.h')}"><div class="g-flow-h"><b>${geT('g.flow.h')}</b><span>${geT('g.flow.sub')}</span></div>
    <div class="g-fl">
      <div class="g-in">
        <a class="g-node" href="#marketing/competitors">${ic('eye',16)}<span><b>${geT('g.f.cmp')}</b><small>${geT('g.f.cmp.v',{n:cmpN,c:cmpCh})}</small></span></a>
        <button class="g-node" data-gseg>${ic('user',16)}<span><b>${geT('g.f.store')}</b><small>${geT('g.f.store.v',{n:pulse.orders,s:GE_SEG.length})}</small></span></button>
        <button class="g-node" data-gcal>${ic('calendar',16)}<span><b>${geT('g.f.cal')}</b><small>${next?geT('g.f.cal.v',{d:esc(geL(next.n)),n:Math.max(0,Math.ceil((next.at-geNow())/DAY))}):'—'}</small></span></button></div>
      <span class="g-arr">${ic('chev',16)}</span>
      <div class="g-node g-core">${ic('bulb',16)}<span><b>${geT('g.f.ideas',{n:ideas.length})}</b><small>${geT('g.f.rules')}</small></span></div>
      <span class="g-arr">${ic('chev',16)}</span>
      <a class="g-node" href="#marketing/studio">${ic('studio',16)}<span><b>${geT('g.f.studio')}</b><small>${geT('g.f.studio.v')}</small></span></a>
      <span class="g-arr">${ic('chev',16)}</span>
      <div class="g-node">${ic('chat2',16)}<span><b>${geT('g.f.run')}</b><small>${geT('g.f.run.v')}</small></span></div>
      <span class="g-arr">${ic('chev',16)}</span>
      <button class="g-node" data-gcamps>${ic('chart',16)}<span><b>${geT('g.f.res')}</b><small>${geT('g.f.res.v')}</small></span></button></div>
    <p class="g-loop">${ic('repeat',13)}${geT('g.f.loop')}</p></section>
  <div class="g-pulse">${[[geT('g.p.orders'),`${pulse.orders}`,pulse.prev?`<span class="${ch>=0?'ge-pos':'ge-neg'}">${ch>=0?'+':''}${ch}%</span> ${geT('g.p.vs')}`:''],
      [geT('g.p.repeat'),pulse.repeat==null?'—':pulse.repeat.toString().replace('.',geLang()==='id'?',':'.')+'%',pulse.repeat==null?geT('g.p.learn'):geT('g.p.peers',{n:String(pulse.peers).replace('.',geLang()==='id'?',':'.')})],
      [geT('g.p.top'),esc(pulse.top),geT('g.p.recent')],[geT('g.p.off'),pulse.off+'%',geT('g.p.off.sub')]].map(([k,v,s])=>`<section class="card"><span>${k}</span><b>${v}</b><small>${s}</small></section>`).join('')}</div>
  ${GS.account==='new'?`<p class="g-note">${ic('info',14)}${geT('g.new.note')}</p>`:''}
  <div class="sec-h"><div><h2 class="sec">${geT('g.ideas.h')}</h2><p class="sec-sub">${geT('g.ideas.sub')}</p></div></div>
  <div class="g-ideas">${ideas.map(geIdeaCard).join('')||`<section class="card w-empty"><span class="qic">${ic('bulb',22,1.6)}</span><div><b>${geT('g.ideas.none')}</b></div></section>`}</div>
  <div class="sec-h" id="g-cal"><div><h2 class="sec">${geT('g.cal.h')}</h2><p class="sec-sub" id="g-cal-src">${GE_HOL_LIVE?geT('g.cal.live'):geT('g.cal.fb')}</p></div></div>
  <div class="g-cal">${dates.filter(d=>d.kind!=='payday').slice(0,8).map(d=>`<div class="g-day g-${d.kind}"><b>${d.at.getDate()}</b><span>${d.at.toLocaleDateString(geLang()==='id'?'id-ID':'en-GB',{month:'short'})}</span><small>${esc(geL(d.n))}</small><i>${geT('g.kind.'+d.kind)}</i></div>`).join('')}</div>
  <div class="sec-h" id="g-camps"><div><h2 class="sec">${geT('g.camps.h')}</h2><p class="sec-sub">${geT('g.camps.sub')}</p></div></div>
  ${geCampList()}`;
  el.onclick=geLandClick;
  if(!GE_HOL_CACHE)geHolidays().then(h=>{GE_HOL_CACHE=h;if(location.hash==='#marketing/growth')renderGrowth()})}
let GE_HOL_CACHE=null;
function geIdeaCard(i){const L=geLang(),c=geCampOf(i.id),v=i.voucher,chs=i.ch.map(k=>`<span class="g-ch" title="${geT('g.ch.'+k)}">${ic(GE_CH.find(x=>x[0]===k)[1],14)}${geT('g.ch.'+k)}</span>`).join('');
  return`<section class="card g-idea">
    <div class="g-ih"><span class="st ${i.type==='post'?'gr':'pu'} sm">${geT('g.type.'+i.type)}</span>${i.src.map(s=>`<span class="g-src g-src-${s}">${geT('g.src.'+s)}</span>`).join('')}${i.fresh?`<span class="st ok sm">${geT('cp.new')}</span>`:''}</div>
    <h3>${esc(geL(i.title))}</h3><p>${esc(geL(i.why).replace('{n}',(i.segs||[]).reduce((a,k)=>a+geSegN(k),0).toLocaleString(L==='id'?'id-ID':'en-US')))}</p>
    <div class="g-im">${chs}${v?`<span class="g-v">${ic('tag',13)}${esc(geOffer(i,v,L))}</span>`:''}</div>
    <div class="g-if"><div class="g-exp"><b>${geRange(geExpOf(i))}</b><span>${geT(i.type==='post'?'g.exp.post':'g.exp')}</span></div>
      ${c?`<a class="btn btn-o" href="#marketing/growth/campaign/${c.id}">${geT('g.running')}</a>`:`<button class="btn btn-o" data-gnot="${i.id}">${geT('g.not')}</button><a class="btn btn-p" href="#marketing/growth/idea/${i.id}">${geT('g.review')}</a>`}</div></section>`}
function geLandClick(e){const b=e.target.closest('button');if(!b)return;const D=b.dataset;
  if('gset' in D)geSettings();
  if('gseg' in D)geSegSheet();
  if('gcal' in D)document.getElementById('g-cal').scrollIntoView({behavior:'smooth'});
  if('gcamps' in D)document.getElementById('g-camps').scrollIntoView({behavior:'smooth'});
  if(D.lang)geSetLang(D.lang);
  if(D.gnot){e.stopPropagation();if(popFor===b){closePop();return}popFor=b;
    pop.innerHTML=`<h6>${geT('g.not.h')}</h6>${['rel','did','later'].map(k=>`<button class="opt" data-why="${k}">${geT('g.not.'+k)}</button>`).join('')}`;
    pop.querySelectorAll('[data-why]').forEach(o=>o.onclick=()=>{closePop();GE.dismissed[D.gnot]=o.dataset.why;track('idea_dismissed',{reason:o.dataset.why});toast(geT('g.not.done'));renderGrowth()});placePop(b,true)}
  if(D.gcamp)go('marketing/growth/campaign/'+D.gcamp)}
/* v1's segments: shoppers keyed by phone number, online and offline merged */
function geSegSheet(){modal.classList.add('nw');
  modal.innerHTML=`<div class="mh"><h3>${geT('g.seg.h')}</h3><button class="ib" data-mclose aria-label="Close">${ic('x',18)}</button></div>
  <div class="mb"><p class="vf-lead">${geT('g.seg.sub')}</p><div class="tbl-wrap"><table class="cp-tbl"><thead><tr><th>${geT('g.seg.n')}</th><th>${geT('g.seg.rule')}</th><th class="r">${geT('g.ch.on')}</th><th class="r">${geT('g.ch.off')}</th></tr></thead>
  <tbody>${GE_SEG.map(s=>`<tr><td><b>${esc(geL(s.n))}</b></td><td>${esc(geL(s.rule))}</td><td class="r">${geSegN(s.k,'on').toLocaleString()}</td><td class="r">${geSegN(s.k,'off').toLocaleString()}</td></tr>`).join('')}</tbody></table></div>
  <p class="d-sub">${geT('g.seg.priv')}</p></div><div class="mf"><button class="btn btn-p" data-mclose>${geT('g.ok')}</button></div>`;mscrim.classList.add('open')}

/* ===== C4 campaigns list ===== */
function geCampList(){const groups=[['running',GE.camps.filter(c=>c.st==='running')],['scheduled',GE.camps.filter(c=>c.st==='scheduled')],['ended',GE.camps.filter(c=>c.st==='ended')]];
  if(!GE.camps.length)return`<section class="card w-empty"><span class="qic">${ic('chart',22,1.6)}</span><div><b>${geT('g.camps.none')}</b><span>${geT('g.camps.none.sub')}</span></div></section>`;
  return`<section class="card"><div class="tbl-wrap"><table class="cp-tbl g-ct"><thead><tr><th>${geT('g.c.name')}</th><th>${geT('g.c.status')}</th><th>${geT('g.c.ch')}</th><th>${geT('g.c.start')}</th><th class="r">${geT('g.c.sales')}</th><th class="r">${geT('g.c.extra')}</th><th></th></tr></thead>
  <tbody>${groups.flatMap(([k,cs])=>cs.map(c=>{const r=geRes(c);return`<tr><td><b>${esc(geL(c.name))}</b><small>${c.id}</small></td><td><span class="st ${k==='running'?'ok':k==='scheduled'?'pu':'gr'} sm">${geT('g.st.'+k)}</span></td><td>${c.ch.map(x=>geT('g.ch.'+x)).join(', ')}</td><td>${geFdate(c.start)}</td><td class="r">${geJt(r.sales)}</td><td class="r">${geJt(r.extra)}</td><td class="r"><button class="btn btn-o" data-gcamp="${c.id}">${geT('g.c.open')}</button></td></tr>`})).join('')}</tbody></table></div></section>`}

/* ===== C2 + C3: idea detail, full screen, 3 steps ===== */
GX.idea=g=>{geInit();const i=geIdea(g.id);
  if(!i)return{title:geT('gro.idea.h'),html:`<div class="gx-in"><section class="card w-empty"><span class="qic">${ic('bulb',22,1.6)}</span><div><b>${geT('g.idea.gone')}</b><span>${geT('g.idea.gone.sub')}</span></div><a class="btn btn-p" href="#marketing/growth">${geT('gro.h')}</a></section></div>`};
  const run=geCampOf(i.id);if(run)return{title:geL(i.title),html:`<div class="gx-in"><section class="card w-empty"><span class="qic">${ic('rocket',22,1.6)}</span><div><b>${geT('g.idea.run')}</b><span>${geT('g.idea.run.sub',{id:run.id})}</span></div><a class="btn btn-p" href="#marketing/growth/campaign/${run.id}">${geT('g.running')}</a></section></div>`};
  if(!GE.drafts[i.id])GE.drafts[i.id]={i,step:1,ch:[...i.ch],voucher:i.voucher?{...i.voucher}:null,tpl:i.tpl,lang:GE.settings.lang,hold:GE.settings.hold,design:null,ctx:'',ai:null,
    cap:{ig:geL(i.caption)||'',tt:geL(i.caption)||''},send:'now',pm:'balance'};
  const d=GE.drafts[i.id];d.i=i;if(!d.cap.ig)d.cap.ig=d.cap.tt=geCapDefault(d);
  track('idea_viewed',{source:i.src[0],type:i.type});
  return{title:geL(i.title),html:`<div class="gi" id="gi"></div>`,after:()=>giDraw(d)}};
function geCapDefault(d){const i=d.i,L=d.lang,v=d.voucher;return L==='id'?`${i.title.id}. ${v?'Pakai '+geOffer(i,v,'id')+' sampai '+geUntil(v.days)+'. ':''}Info lengkap di link bio.`:`${i.title.en}. ${v?'Use '+geOffer(i,v,'en')+' until '+geUntil(v.days)+'. ':''}Details at the link in bio.`}
function giDraw(d){const el=document.getElementById('gi');if(!el)return;const i=d.i,camp=i.type==='campaign',steps=[1,2,3];
  el.innerHTML=`<div class="gi-steps">${steps.map(n=>`${n>1?'<span class="stp-l"></span>':''}<button class="stp${d.step===n?' on':d.step>n?' done':''}" data-gstep="${n}"><i>${d.step>n?ic('check',11,2.6):n}</i><span>${geT('g.s'+n)}</span></button>`).join('')}</div>
  <div class="gi-grid"><div class="gi-main">${d.step===1?giReview(d):d.step===2?giAdjust(d):giExecute(d)}</div><aside class="gi-side" id="gi-side">${giSide(d)}</aside></div>
  <div class="gi-foot">${d.step>1?`<button class="btn btn-o" data-gstep="${d.step-1}">${geT('g.back')}</button>`:'<span></span>'}
    ${d.step<3?`<button class="btn btn-p" data-gstep="${d.step+1}">${d.step===1?geT('g.next.adjust'):geT('g.next.exec')}</button>`:`<button class="btn btn-p" id="gi-go">${ic(camp?'rocket':'export',15)}${camp?geT('g.exec'):geT('g.kit')}</button>`}</div>`;
  el.onclick=e=>giClick(e,d);el.oninput=e=>giInput(e,d);el.onchange=e=>giInput(e,d,true);
  const go=document.getElementById('gi-go');if(go)go.onclick=()=>geExecute(d)}
/* step 1 · Review: why this idea, the data behind it, audience, channels */
function giReview(d){const i=d.i,L=geLang(),a=geAudience(i,d.hold),f=n=>n.toLocaleString(L==='id'?'id-ID':'en-US');
  const data=[];
  if(i.src.includes('date')){const dt=i.date?new Date(i.date+'T00:00:00'):null;if(dt)data.push([ic('calendar',15),geT('g.d.date',{d:geFdate(dt),n:Math.ceil((dt-geNow())/DAY)}),null])}
  if(i.cmp){const c=CP.tracked.find(x=>x.h===i.cmp)||cpMake(i.cmp),act=c.f.activity[i.act];data.push([ic('eye',15),`${esc(c.f.name)}: ${esc(geL({id:act[2],en:act[3]}))} · ${cpShort(cpDay(act[0]))}`,'#marketing/competitors',i.cmp])}
  if(i.segs)i.segs.forEach(k=>{const s=geSeg(k);data.push([ic('user',15),`${esc(geL(s.n))}: ${f(geSegN(k))} · ${esc(geL(s.rule))}`,null])});
  if(i.past){const p=GE.camps.find(c=>c.id===i.past);if(p)data.push([ic('chart',15),geT('g.d.past',{name:esc(geL(p.name)),x:geJt(geRes(p).extra)}),'#marketing/growth/campaign/'+p.id])}
  if(i.src.includes('store')&&!i.segs)data.push([ic('cart',15),geT('g.d.orders'),null]);
  return`<section class="card gi-why"><div class="g-ih"><span class="st ${i.type==='post'?'gr':'pu'} sm">${geT('g.type.'+i.type)}</span>${i.src.map(s=>`<span class="g-src g-src-${s}">${geT('g.src.'+s)}</span>`).join('')}</div>
    <h2>${esc(geL(i.title))}</h2><p>${esc(geL(i.why).replace('{n}',f(a.n)))}</p>
    <h4>${geT('g.r.data')}</h4><ul class="gi-data">${data.map(([ico,t,href,h])=>`<li>${ico}<span>${t}</span>${href?`<a class="lnk" href="${href}" ${h?`data-gcmp="${esc(h)}"`:''}>${geT('g.r.see')}</a>`:''}</li>`).join('')}</ul></section>
  ${i.type==='campaign'?`<section class="card"><h4>${geT('g.r.aud')}</h4>
    <div class="gi-aud"><div><b>${f(a.n)}</b><span>${geT('g.r.shoppers')}</span><small>${geT('g.r.split',{on:f(a.on),off:f(a.off)})}</small></div>
      <ul><li><span>${geT('g.r.opt')}</span><b>−${f(a.opt)}</b></li><li><span>${geT('g.r.busy',{n:GE.settings.cap})}</span><b>−${f(a.busy)}</b></li><li><span>${geT('g.r.hold',{n:d.hold})}</span><b>−${f(a.hold)}</b></li><li class="t"><span>${geT('g.r.send')}</span><b>${f(a.send)}</b></li></ul></div></section>`
  :`<section class="card"><h4>${geT('g.r.who')}</h4><p class="d-sub">${geT('g.r.who.sub')}</p></section>`}
  <section class="card"><h4>${geT('g.r.ch')}</h4><ul class="gi-chs">${d.ch.map(k=>`<li>${ic(GE_CH.find(x=>x[0]===k)[1],15)}<b>${geT('g.ch.'+k)}</b><span>${geT('g.ch.'+k+'.what')}</span></li>`).join('')}</ul></section>`}
/* step 2 · Adjust */
function giAdjust(d){const i=d.i,camp=i.type==='campaign',v=d.voucher,L=geLang(),sd=geDesignOf(d),mine=GS.designs.filter(s=>!s.auto);
  const left=limitLeft('ownContextPerWeek'),cap=limitCap('ownContextPerWeek');
  return`<section class="card"><h4>${geT('g.a.ch')}</h4><div class="gi-tog">${GE_CH.filter(([k])=>camp||k==='ig'||k==='tt').map(([k,ico])=>`<label class="gi-t${d.ch.includes(k)?' on':''}"><input type="checkbox" data-gch="${k}" ${d.ch.includes(k)?'checked':''}>${ic(ico,15)}<span><b>${geT('g.ch.'+k)}</b><small>${geT('g.ch.'+k+'.what')}</small></span></label>`).join('')}</div></section>
  ${camp?`<section class="card"><div class="gi-h"><h4>${geT('g.a.v')}</h4><label class="st-chk"><input type="checkbox" data-gvon ${v?'checked':''}> ${geT('g.a.v.on')}</label></div>
    ${v?`<div class="gi-vf"><div class="fld"><label>${geT('g.a.v.kind')}</label><div class="seg">${['pct','amt'].map(k=>`<button class="${v.kind===k?'on':''}" data-gvk="${k}">${k==='pct'?'%':'Rp'}</button>`).join('')}</div></div>
      <div class="fld"><label for="gv-v">${geT('g.a.v.v')}</label><input id="gv-v" type="number" min="1" data-gv="v" value="${v.v}"></div>
      ${v.kind==='pct'?`<div class="fld"><label for="gv-max">${geT('g.a.v.max')}</label><input id="gv-max" type="number" min="0" step="1000" data-gv="max" value="${v.max}"></div>`:''}
      <div class="fld"><label for="gv-min">${geT('g.a.v.min')}</label><input id="gv-min" type="number" min="0" step="10000" data-gv="min" value="${v.min}"></div>
      <div class="fld"><label for="gv-days">${geT('g.a.v.days')}</label><input id="gv-days" type="number" min="1" max="60" data-gv="days" value="${v.days}"></div>
      <div class="fld"><label for="gv-q">${geT('g.a.v.q')}</label><input id="gv-q" type="number" min="1" data-gv="quota" value="${v.quota}"></div></div>
      <p class="d-sub">${ic('info',13)} ${geT('g.a.v.who')}</p>`:''}</section>`:''}
  <section class="card"><h4>${geT('g.a.img')}</h4><div class="gi-img"><img src="${geImg(sd,360).toDataURL('image/jpeg',.8)}" alt="${esc(sd.v.h)}"><div>
      <p>${sd.auto?geT('g.a.img.auto'):geT('g.a.img.saved',{date:geFdate(sd.at)})}</p>
      <div class="gi-imgb"><button class="btn btn-o" data-gstudio="new">${ic('studio',15)}${geT('g.a.img.make')}</button><button class="btn btn-o" data-gstudio="edit">${geT('g.a.img.edit')}</button></div></div></div>
    ${mine.length?`<p class="d-sub">${geT('g.a.img.pick')}</p><div class="gi-pick">${mine.slice(0,6).map(s=>`<button class="${s.key===sd.key?'on':''}" data-gdes="${esc(s.key)}"><img src="${s.thumb||geImg(s,160).toDataURL('image/jpeg',.7)}" alt="${esc(s.v.h)}"></button>`).join('')}</div>`:''}</section>
  ${d.ch.some(k=>k==='ig'||k==='tt')?`<section class="card"><h4>${geT('g.a.cap')}</h4>${['ig','tt'].filter(k=>d.ch.includes(k)).map(k=>`<div class="fld"><label for="gc-${k}">${geT('g.ch.'+k)}${d.ai?' '+aiTag():''}</label><textarea id="gc-${k}" rows="3" data-gcap="${k}">${esc(d.cap[k])}</textarea></div>`).join('')}</section>`:''}
  ${camp&&d.ch.includes('wa')?`<section class="card"><div class="gi-h"><h4>${geT('g.a.wa')}</h4>${geLangSegX(d.lang)}</div>
    <div class="fld"><label for="g-tpl">${geT('g.a.tpl')}</label><select id="g-tpl" data-gtpl>${i.tpls.map(t=>`<option value="${t}" ${d.tpl===t?'selected':''}>${geT('tpl.'+t)} · ${geT('g.a.ok')}</option>`).join('')}</select></div>
    <p class="d-sub">${ic('lock',13)} ${geT('g.a.locked')}</p></section>`:''}
  ${camp?`<section class="card"><h4>${geT('g.a.ctx')}</h4><p class="d-sub">${geT('g.a.ctx.sub')}</p><div class="gi-ctx"><textarea id="g-ctx" rows="2" placeholder="${geT('g.a.ctx.ph')}">${esc(d.ctx)}</textarea><button class="btn btn-o" data-gctx ${cap?'':'disabled'}>${ic('sparkle',15)}${geT('g.a.ctx.go')}</button></div>
    <p class="d-sub">${cap?geT('g.a.ctx.left',{n:left,cap}):geT('g.a.ctx.none')}</p>${d.ai?`<p class="gi-tweak">${aiTag()} ${esc(d.ai.tweak)}</p>`:''}</section>
  <section class="card"><div class="gi-h"><h4>${geT('g.a.hold')}</h4><button class="lnk" data-ghold title="${esc(geT('g.a.hold.tip'))}">${ic('info',13)} ${geT('g.a.hold.why')}</button></div>
    <div class="gi-hold"><input type="range" min="0" max="30" step="5" value="${d.hold}" data-ghr aria-label="${geT('g.a.hold')}"><b id="g-holdv">${d.hold}%</b></div><p class="d-sub" id="g-holdtip" hidden>${geT('g.a.hold.tip')}</p></section>`:''}`}
const geLangSegX=l=>`<div class="seg" role="group" aria-label="WhatsApp language">${['id','en'].map(x=>`<button class="${l===x?'on':''}" data-gwl="${x}">${x.toUpperCase()}</button>`).join('')}</div>`;
/* step 3 · Execute: summary, cost, payment */
function giExecute(d){const i=d.i,camp=i.type==='campaign',a=geAudience(i,d.hold),v=d.voucher,f=n=>n.toLocaleString(geLang()==='id'?'id-ID':'en-US');
  const wa=d.ch.includes('wa')&&camp?a.send:0,cost=wa*GE_LIMITS.waCost,vcap=v?v.quota*(v.kind==='pct'?v.max:v.v):0;
  return`<section class="card"><h4>${geT('g.e.sum')}</h4><ul class="gi-sum">${d.ch.map(k=>`<li>${ic(GE_CH.find(x=>x[0]===k)[1],15)}<b>${geT('g.ch.'+k)}</b><span>${k==='wa'?geT('g.e.wa',{n:f(wa)}):k==='ig'?geT('g.e.ig'):k==='tt'?geT('g.e.tt'):geT('g.e.off')}</span></li>`).join('')}</ul></section>
  ${camp?`<section class="card"><h4>${geT('g.e.when')}</h4><div class="seg gi-when">${['now','tmr'].map(k=>`<button class="${d.send===k?'on':''}" data-gsend="${k}">${geT('g.e.when.'+k)}</button>`).join('')}</div>
    <p class="d-sub">${geT('g.e.quiet')}</p></section>
  <section class="card"><h4>${geT('g.e.cost')}</h4><div class="gi-cost">
    <div><span>${geT('g.e.cost.wa',{n:f(wa),p:rp(GE_LIMITS.waCost)})}</span><b>${rp(cost)}</b></div>
    ${v?`<div><span>${geT('g.e.cost.v',{q:f(v.quota)})}</span><b>${geT('g.e.upto',{x:rp(vcap)})}</b></div>`:''}
    <div><span>${geT('g.e.fee',{p:String(GE_FEE).replace('.',geLang()==='id'?',':'.')})}</span><b>${geT('g.e.fee.v')}</b></div>
    <div class="t"><span>${geT('g.e.now')}</span><b>${rp(cost)}</b></div></div>
    ${cost?`<div class="fld"><label>${geT('ex.method')}</label><div class="st-pm"><label class="st-chk"><input type="radio" name="gpm" value="balance" ${d.pm==='balance'?'checked':''}> ${geT('ex.balance',{bal:rp(GS.balance)})}${GS.balance<cost?` <span class="cp-err">${geT('pay.low')}</span>`:''}</label><label class="st-chk"><input type="radio" name="gpm" value="link" ${d.pm==='link'?'checked':''}> ${geT('ex.other')}</label></div></div>`:''}</section>`
  :`<section class="card"><h4>${geT('g.e.kit')}</h4><p class="d-sub">${geT('g.e.kit.sub')}</p></section>`}`}
/* the live preview on the right: image, WhatsApp bubble, voucher */
function giSide(d){const i=d.i,sd=geDesignOf(d),L=d.lang,v=d.voucher,img=geImg(sd,360).toDataURL('image/jpeg',.8);
  const wa=i.type==='campaign'&&d.ch.includes('wa'),tp=GE_WA[d.tpl]||{},name=GE_SHOPPERS[0].n;
  const body=wa?String(tp[L]||'').replace(/\{\{(\d)\}\}/g,(m,n)=>`<mark>${esc([name,GE_OWNER.store,geOffer(i,v,L)||geL(i.title),v?geUntil(v.days):geUntil(7),'flik.id/v/ARU'+GE.seq][n-1])}</mark>`):'';
  return`<div class="gi-sh">${geT('g.side.h')}</div>
  ${wa?`<div class="ge-wa"><div class="gi-sender">${esc(GE_OWNER.store)} via FLIK · ${geT('tpl.'+d.tpl)}</div><div class="ge-bub"><div class="ge-bimg"><img src="${img}" alt="${geT('g.side.img')}"></div><p>${body}</p><small class="ge-bf">${GE_WA_FOOT[L]}</small><div class="ge-bbtn">${GE_WA_BTN[L].map(b=>`<span>${b}</span>`).join('')}</div></div></div>`
    :`<div class="gi-post"><img src="${img}" alt="${geT('g.side.img')}"><p>${esc(d.cap.ig||d.cap.tt)}</p></div>`}
  ${v&&i.type==='campaign'?`<div class="gi-vcard">${ic('tag',15)}<div><b>${esc(geCap(geOffer(i,v,geLang())))}</b><span>${geT('g.side.v',{min:rp(v.min),until:geUntil(v.days)})}</span></div></div>`:''}
  ${d.ch.includes('off')&&i.type==='campaign'?`<div class="gi-vcard">${ic('qr',15)}<div><b>${geT('g.side.poster')}</b><span>${geT('g.side.poster.sub')}</span></div></div>`:''}`}
function giSideOnly(d){const s=document.getElementById('gi-side');if(s)s.innerHTML=giSide(d)}
function giClick(e,d){const b=e.target.closest('button,a');if(!b)return;const D=b.dataset;
  if(D.gcmp){CP.sel=D.gcmp;CP.tab='activity'}
  if(D.gstep){d.step=+D.gstep;giDraw(d);document.getElementById('gx-body').scrollTop=0;if(d.step===3)track('idea_adjusted',{field:'done'})}
  if(D.gvk){d.voucher.kind=D.gvk;if(D.gvk==='amt'){d.voucher.v=Math.max(5000,d.voucher.max||10000)}else{d.voucher.v=10}track('idea_adjusted',{field:'voucher_type'});giDraw(d)}
  if(D.gwl){d.lang=D.gwl;track('idea_adjusted',{field:'language'});giDraw(d)}
  if(D.gdes){d.design=D.gdes;track('idea_adjusted',{field:'image'});giDraw(d)}
  if(D.gsend){d.send=D.gsend;giDraw(d)}
  if('ghold' in D){const t=document.getElementById('g-holdtip');if(t)t.hidden=!t.hidden}
  if(D.gstudio){GS.studioReturn={idea:d.i.id};track('idea_adjusted',{field:'studio'});
    if(D.gstudio==='edit')stOpenSaved(geDesignOf(d));else{STU.design=null;STU.product={id:d.i.product};STU.cat='fashion';STU.vibe='';STU.phase='idle';go('studio/new')}}
  if('gctx' in D){const t=document.getElementById('g-ctx').value.trim();if(!t){toast(geT('g.a.ctx.empty'));return}d.ctx=t;
    const l=useLimit('ownContextPerWeek');if(!l.ok){toast(l.message);giDraw(d);return}
    b.disabled=true;b.innerHTML=`<span class="ai-dots"><i></i><i></i><i></i></span>${geT('g.a.ctx.busy')}`;
    mockLLM('context',{text:t,lang:geLang()==='en'?'en':'id',until:d.voucher?geUntil(d.voucher.days):''}).then(r=>{if(r.ai){d.ai=r;d.cap.ig=d.cap.tt=r.caption}track('idea_adjusted',{field:'own_context'});giDraw(d)})}}
function giInput(e,d,commit){const t=e.target,D=t.dataset;
  if(D.gch){const k=D.gch;d.ch=t.checked?[...new Set([...d.ch,k])]:d.ch.filter(x=>x!==k);if(!d.ch.length){d.ch=[k];t.checked=true;toast(geT('g.a.ch.one'))}track('idea_adjusted',{field:'channels'});giDraw(d);return}
  if('gvon' in D){d.voucher=t.checked?{...(d.i.voucher||{kind:'pct',v:10,max:10000,min:150000,days:7,quota:100})}:null;track('idea_adjusted',{field:'voucher'});giDraw(d);return}
  if(D.gv){d.voucher[D.gv]=Math.max(0,+t.value||0);if(commit)track('idea_adjusted',{field:'voucher_'+D.gv});giSideOnly(d);return}
  if(D.gcap){d.cap[D.gcap]=t.value;giSideOnly(d);return}
  if('gtpl' in D){d.tpl=t.value;track('idea_adjusted',{field:'template'});giSideOnly(d);return}
  if('ghr' in D){d.hold=+t.value;document.getElementById('g-holdv').textContent=d.hold+'%';if(commit)track('idea_adjusted',{field:'holdout'});return}
  if(t.name==='gpm'){d.pm=t.value}
  if(t.id==='g-ctx')d.ctx=t.value}

/* ===== C3 execute ===== */
function geExecute(d){const i=d.i,camp=i.type==='campaign',a=geAudience(i,d.hold),wa=d.ch.includes('wa')&&camp?a.send:0,cost=wa*GE_LIMITS.waCost,label=geT('g.e.ledger',{name:geL(i.title)});
  const pay=!cost?Promise.resolve({}):d.pm==='balance'?ledgerDebit(cost,label):paymentLinkSheet(cost,label);
  pay.then(r=>{const sd=geDesignOf(d);
    if(!camp){geKit(d,sd);track('post_kit_downloaded',{channels:d.ch.join(',')});toast(geT('g.kit.done'));GE.dismissed[i.id]='posted';go('marketing/growth');return}
    const id='C-'+(++GE.seq),c={id,idea:i.id,name:i.title,tpl:d.tpl,lang:d.lang,segs:i.segs,ch:[...d.ch],voucher:d.voucher?{...d.voucher}:null,hold:d.hold,conv:i.conv||.06,
      start:d.send==='tmr'?new Date(geNow().getTime()+DAY):geNow(),st:d.send==='tmr'?'scheduled':'running',n:wa,aud:a,cost,code:'ARU'+id.slice(2),claims:0,cashier:0,paid:r.ledgerTxnId?'balance':r.paymentLinkId?'payment_link':'none',design:sd.key};
    GE.camps.unshift(c);
    if(wa&&c.st==='running'){const img=geImg(sd,540).toDataURL('image/jpeg',.82),off=geOffer(i,c.voucher,c.lang)||geL(i.title),until=c.voucher?geUntil(c.voucher.days,c.start):geUntil(7,c.start);
      if(wa>5)GS.outbox.unshift({more:geT('g.e.more',{n:(wa-5).toLocaleString(geLang()==='id'?'id-ID':'en-US')})});
      GE_SHOPPERS.slice(0,Math.min(5,wa)).forEach(s=>waSend(c.tpl,c.lang,[s.n,GE_OWNER.store,off,until,'flik.id/v/'+c.code],img,s.phone))}
    geKit(d,sd,c);
    track('campaign_executed',{channels:c.ch.join(','),pay:c.paid,holdout:c.hold});
    toast(c.st==='scheduled'?geT('g.e.sched'):geT('g.e.done'));go('marketing/growth/campaign/'+id)}).catch(()=>{})}
/* downloads: Instagram/TikTok post kit (PNG + caption), offline poster (A5 PNG with claim QR) */
function geDl(name,href,delay){setTimeout(()=>{try{const a=document.createElement('a');a.href=href;a.download=name;document.body.appendChild(a);a.click();a.remove()}catch(e){}},delay)}
function geKit(d,sd,c){const base=(GE_OWNER.store+'-'+(c?c.id:d.i.id)).toLowerCase().replace(/[^a-z0-9-]+/g,'-');let t=0;
  ['ig','tt'].filter(k=>d.ch.includes(k)).forEach(k=>{geDl(`${base}-${k==='ig'?'instagram':'tiktok'}.png`,geImg(sd,1080,k==='tt'?'9:16':'4:5').toDataURL('image/png'),t);t+=350;
    geDl(`${base}-${k==='ig'?'instagram':'tiktok'}-caption.txt`,URL.createObjectURL(new Blob([d.cap[k]||''],{type:'text/plain'})),t);t+=350});
  if(c&&d.ch.includes('off')){geDl(`${base}-poster-a5.png`,gePoster(c,sd).toDataURL('image/png'),t);track('poster_downloaded',{})}}
function gePoster(c,sd){const W=1240,H=1748,cv=document.createElement('canvas');cv.width=W;cv.height=H;const x=cv.getContext('2d'),F=stFont(),L=c.lang,i=geIdea(c.idea)||{offer:null};
  const wrap=(t,X,Y,maxW,lh)=>{const w=String(t).split(' ');let line='',y=Y;w.forEach(word=>{const n=line?line+' '+word:word;if(x.measureText(n).width>maxW&&line){x.fillText(line,X,y);line=word;y+=lh}else line=n});if(line)x.fillText(line,X,y);return y};
  x.fillStyle='#fffaf3';x.fillRect(0,0,W,H);
  x.save();stRound(x,120,70,1000,1000,28);x.clip();x.drawImage(geImg(sd,1000),120,70,1000,1000);x.restore();
  x.textAlign='left';x.fillStyle='#1d2430';x.font=`700 60px ${F}`;let y=wrap(geCap(geOffer(i,c.voucher,L))||geL(c.name),80,1170,660,70);
  x.font=`400 30px ${F}`;x.fillStyle='#4a5160';
  if(c.voucher)y=wrap(L==='id'?`Min. belanja ${rp(c.voucher.min)} · berlaku sampai ${geUntil(c.voucher.days,c.start)}`:`Min. order ${rp(c.voucher.min)} · valid until ${geUntil(c.voucher.days,c.start)}`,80,y+56,660,40);
  x.font=`600 36px ${F}`;x.fillStyle='#1d2430';y=wrap(L==='id'?'Pindai untuk simpan voucher, lalu tunjukkan nomormu di kasir.':'Scan to save your voucher, then show your number at the cashier.',80,y+70,660,46);
  x.font=`400 24px ${F}`;x.fillStyle='#6a4bff';x.fillText(geClaimUrl(c).replace(/^https?:\/\//,'').replace(/\?account=anon/,''),80,y+50,660);
  geQRDraw(x,geClaimUrl(c),790,1120,370);
  x.fillStyle='#e7e0d4';x.fillRect(80,H-118,W-160,2);
  x.fillStyle='#8a5a3b';x.font=`700 36px ${F}`;x.fillText(GE_OWNER.store,80,H-60);x.fillStyle='#8792a2';x.font=`400 24px ${F}`;x.textAlign='right';x.fillText(L==='id'?'Voucher dari merchant · bukan kode pembayaran':'Merchant voucher · not a payment code',W-80,H-60);
  return cv}
const geClaimUrl=c=>location.href.split(/[?#]/)[0]+'?account=anon#claim/'+c.code;

/* ===== C4 results ===== */
function geRes(c){if(c.res&&c.st==='ended'&&c.final)return c.final;if(c.res)return geDerive(c.res,c.hold||10);
  const el=Math.max(0,(geNow()-c.start)/DAY),f=Math.min(1,el/7),n=c.n||0,conv=c.conv,dv=v=>c.voucher?(c.voucher.kind==='pct'?Math.min(c.voucher.max,GE_AOV*c.voucher.v/100):c.voucher.v):0;
  if(c.st==='scheduled')return geDerive({sent:0,delivered:0,read:0,clicked:0,claimed:0,redeemed:0,sales:0,hold:c.aud.hold,holdRed:0,holdSales:0,cost:c.cost,vcost:0,on:0,cashier:0,claim:0},c.hold);
  const off=c.ch.includes('off'),rate=conv*(off?1:.62)*f,on=Math.round(n*conv*.62*f),cash=Math.round(off?n*conv*.38*f:0)+c.cashier,claim=Math.round(off?n*.012*f:0)+c.claims,red=Math.min(c.voucher?c.voucher.quota:1e9,on+cash);
  const hold=c.aud.hold,holdRed=Math.round(hold*rate/2.3);
  return geDerive({sent:n,delivered:Math.round(n*.965),read:Math.round(n*.965*.81*Math.min(1,.45+el/2)),clicked:Math.round(n*.965*.81*.21*Math.min(1,.3+el/3)),claimed:claim,redeemed:red,
    sales:red*GE_AOV*1.04,hold,holdRed,holdSales:holdRed*GE_AOV,cost:c.cost,vcost:red*dv(),on,cashier:cash,claim},c.hold)}
function geDerive(r,hold){const sent=r.sent||0,rate=sent?r.redeemed/sent:0,hrate=r.hold?r.holdRed/r.hold:0,base=sent*(r.hold?r.holdSales/r.hold:0);
  return{...r,lift:hrate?rate/hrate:rate?null:0,extra:Math.max(0,r.sales-base),ret:(r.cost+r.vcost)?Math.max(0,r.sales-base)/(r.cost+r.vcost):0}}
function geRenderCamp(el,id){const c=GE.camps.find(x=>x.id===id);
  if(!c){el.innerHTML=`<div class="ph"><div><h1>${geT('gro.camp.h')}</h1><p class="sec-sub ge-sub"><a href="#marketing/growth">${geT('gro.h')}</a> › ${esc(id)}</p></div></div><section class="card w-empty"><span class="qic">${ic('chart',22,1.6)}</span><div><b>${geT('g.c.gone')}</b><span>${geT('g.c.gone.sub')}</span></div><a class="btn btn-p" href="#marketing/growth">${geT('gro.h')}</a></section>`;return}
  const r=geRes(c),f=n=>Math.round(n).toLocaleString(geLang()==='id'?'id-ID':'en-US'),days=Math.max(0,Math.floor((geNow()-c.start)/DAY)),fun=[['sent',r.sent],['delivered',r.delivered],['read',r.read],['clicked',r.clicked],['claimed',r.claimed],['redeemed',r.redeemed]];
  const end=new Date(c.start.getTime()+(c.voucher?c.voucher.days:c.days||14)*DAY);
  el.innerHTML=`<div class="ph"><div><h1>${esc(geL(c.name))}</h1><p class="sec-sub ge-sub"><a href="#marketing/growth">${geT('gro.h')}</a> › ${c.id} · <span class="st ${c.st==='running'?'ok':c.st==='scheduled'?'pu':'gr'} sm">${geT('g.st.'+c.st)}</span> · ${geT('g.c.dates',{a:geFdate(c.start),b:geFdate(end)})}</p></div>
    <div class="g-hact"><button class="btn btn-o" data-gcsv>${ic('export',15)}${geT('g.c.csv')}</button>${c.st==='running'?`<button class="btn btn-o" data-gend>${geT('bar.end')}</button>`:''}${c.ch.includes('off')&&c.st!=='ended'?`<a class="btn btn-o" href="#claim/${c.code}">${ic('qr',15)}${geT('g.c.claim')}</a>`:''}</div></div>
  ${c.st==='running'&&days<1?`<p class="g-note">${ic('clock',14)}${geT('g.c.early')}</p>`:''}
  <div class="g-pulse g-k">${[[geT('g.k.sales'),geJt(r.sales),geT('g.k.sales.sub',{n:f(r.redeemed)})],[geT('g.k.extra'),geJt(r.extra),r.lift?geT('g.k.lift',{x:r.lift.toFixed(1).replace('.',geLang()==='id'?',':'.')}):geT('g.k.wait')],
      [geT('g.k.cost'),geJt(r.cost+r.vcost),geT('g.k.cost.sub',{a:geJt(r.cost),b:geJt(r.vcost)})],[geT('g.k.ret'),r.ret?geT('g.k.ret.v',{x:r.ret.toFixed(1).replace('.',geLang()==='id'?',':'.')}):'—',geT('g.k.ret.sub')]].map(([k,v,s])=>`<section class="card"><span>${k}</span><b>${v}</b><small>${s}</small></section>`).join('')}</div>
  ${r.lift?`<section class="card g-hold"><span class="qic">${ic('chart',20,1.6)}</span><div><b>${geT('g.hold.h',{x:r.lift.toFixed(1).replace('.',geLang()==='id'?',':'.'),extra:geJt(r.extra)})}</b><span>${geT('g.hold.sub',{n:f(r.hold),p:c.hold||10})}</span></div></section>`:''}
  <div class="g-two"><section class="card"><h4>${geT('g.c.funnel')}</h4><div class="g-fun">${fun.map(([k,v])=>`<div><span>${geT('g.fn.'+k)}</span><i><em style="width:${r.sent?Math.max(1.5,v/r.sent*100):0}%"></em></i><b>${f(v)}</b></div>`).join('')}</div></section>
    <section class="card"><h4>${geT('g.c.by')}</h4><table class="cp-tbl"><tbody>${[['on',r.on],['cashier',r.cashier],['claim',r.claim]].map(([k,v])=>`<tr><td>${geT('g.by.'+k)}</td><td class="r"><b>${f(v)}</b></td></tr>`).join('')}</tbody></table>
      <p class="d-sub">${geT('g.c.attr')}</p></section></div>
  ${c.st==='ended'?`<section class="card g-learn"><span class="qic">${ic('bulb',20,1.6)}</span><div><b>${geT('g.learn.h')}</b><span>${geT(r.lift>=1.5?'g.learn.good':'g.learn.meh',{x:(r.lift||0).toFixed(1)})}</span></div></section>`:''}`;
  el.onclick=e=>{const b=e.target.closest('button');if(!b)return;if('gcsv' in b.dataset)geCsv(c);if('gend' in b.dataset)geEndCampaign(c)}}
function geCsv(c){const r=geRes(c),days=Math.max(1,Math.min(c.voucher?c.voucher.days:14,Math.ceil((geNow()-c.start)/DAY)||1)),rows=[];
  const share=d=>{const w=[.42,.2,.12,.09,.07,.06,.04];return(w[d]||.03)/Math.min(1,w.slice(0,days).reduce((a,b)=>a+b,0))};
  for(let d=0;d<days;d++){const dt=fdayISO(new Date(c.start.getTime()+d*DAY)),s=share(d),R=k=>Math.round((r[k]||0)*s);
    if(c.ch.includes('wa'))rows.push([dt,'whatsapp',d?0:r.sent,d?0:r.delivered,R('read'),R('clicked'),0,Math.round(r.on*s),Math.round(r.on*s*GE_AOV*1.04),Math.round(r.vcost*(r.redeemed?r.on/r.redeemed:0)*s)]);
    if(c.ch.includes('off'))rows.push([dt,'offline',0,0,0,0,R('claim'),Math.round(r.cashier*s),Math.round(r.cashier*s*GE_AOV*1.04),Math.round(r.vcost*(r.redeemed?r.cashier/r.redeemed:0)*s)])}
  dlCsv('campaign-'+c.id.toLowerCase(),['date','channel','sent','delivered','read','clicked','claimed','redeemed','sales','voucher_cost'],rows,'campaign');track('campaign_csv_downloaded',{days})}
/* End campaign (button or prototype bar): freeze the result and send the owner the WhatsApp report */
function geEndCampaign(c){geInit();c=c||GE.camps.find(x=>x.st==='running');if(!c){toast(geT('bar.noCampaign'));return}
  c.final=geRes(c);c.st='ended';c.res=c.res||c.final;const r=c.final,L=GE.settings.lang;
  waSend('campaign_report',L,[GE_OWNER.name,c.name[L]||geL(c.name),geJt(r.sales),geJt(r.extra),'flik.id/c/'+c.id],geReportImg(c,r,L).toDataURL('image/jpeg',.85),GE_OWNER.phone);
  track('campaign_ended',{id:c.id});toast(geT('g.ended'));if(location.hash==='#marketing/growth/campaign/'+c.id||location.hash==='#marketing/growth')show();else go('marketing/growth/campaign/'+c.id)}
function geReportImg(c,r,L){const W=540,cv=document.createElement('canvas');cv.width=W;cv.height=300;const x=cv.getContext('2d'),F=stFont();
  x.fillStyle='#f2efff';x.fillRect(0,0,W,300);x.fillStyle='#1d2430';x.font=`700 24px ${F}`;x.fillText(c.name[L],28,48,W-56);x.font=`400 15px ${F}`;x.fillStyle='#4a5160';x.fillText(`${GE_OWNER.store} · ${c.id}`,28,74);
  [[L==='id'?'Penjualan':'Sales',geJt(r.sales)],[L==='id'?'Tambahan':'Extra',geJt(r.extra)],[L==='id'?'Voucher dipakai':'Vouchers used',String(r.redeemed)],[L==='id'?'Biaya':'Cost',geJt(r.cost+r.vcost)]].forEach(([k,v],i)=>{const cx=28+(i%2)*250,cy=118+Math.floor(i/2)*86;
    x.fillStyle='#fff';stRound(x,cx,cy,234,72,12);x.fill();x.fillStyle='#687385';x.font=`400 14px ${F}`;x.fillText(k,cx+16,cy+26);x.fillStyle='#002d5d';x.font=`700 24px ${F}`;x.fillText(v,cx+16,cy+56)});return cv}

/* ===== C5 claim page (public, phone-sized) ===== */
GX.claim=g=>{geInit();const c=GE.camps.find(x=>x.code===g.id)||{code:g.id,demo:true,lang:'id',voucher:{kind:'pct',v:10,max:10000,min:150000,days:28,quota:300},start:geNow(),idea:'i-1111',name:GE_IDEAS[0].title};
  const i=geIdea(c.idea)||GE_IDEAS[0],L=geLang(),done=GE.claims.find(x=>x.code===c.code&&x.mine);
  return{html:`<div class="gx-in gc"><section class="gc-card"><img class="gc-logo" src="${GE_BRAND.logo}" alt="${esc(GE_OWNER.store)}">
    <h1>${esc(geCap(geOffer(i,c.voucher,L)))}</h1><p>${geT('c.valid',{min:rp(c.voucher.min),until:geUntil(c.voucher.days,c.start)})}</p>
    ${done?`<div class="gc-ok">${ic('check',22,2.4)}<b>${geT('c.saved')}</b><span>${geT('c.show',{phone:fphone(done.phone)})}</span><code>${esc(c.code)}</code></div>`
    :`<form id="gc-f"><div class="fld"><label for="gc-ph">${geT('c.phone')}</label><input id="gc-ph" inputmode="tel" placeholder="0812 3456 7890" autocomplete="tel"></div>
      <label class="st-chk gc-cons"><input type="checkbox" id="gc-cons"> ${geT('c.consent',{store:esc(GE_OWNER.store)})}</label><p class="cp-err" id="gc-err" hidden></p>
      <button class="btn btn-p st-go" type="submit">${geT('c.save')}</button></form>`}
    <p class="gc-foot">${geT('c.foot')}${c.demo?' · '+geT('c.demo'):''}</p></section></div>`,
  after:()=>{const fm=document.getElementById('gc-f');if(!fm)return;fm.onsubmit=e=>{e.preventDefault();const p=normPhone(document.getElementById('gc-ph').value),err=document.getElementById('gc-err');
    if(!phoneOk(p)){err.textContent=geT('c.bad');err.hidden=false;return}
    if(!document.getElementById('gc-cons').checked){err.textContent=geT('c.cons.need');err.hidden=false;return}
    GE.claims.push({phone:p,code:c.code,camp:c.id,mine:true,at:geNow(),redeemed:false});if(!c.demo)c.claims++;track('voucher_claimed',{campaign:c.id||'demo'});show()}}}};
/* Cashier app preview: the cashier looks up the shopper's phone number and redeems */
function geCashier(){geInit();const draw=(msg='')=>{modal.classList.add('nw');
  modal.innerHTML=`<div class="mh"><h3>${geT('bar.cashier')}</h3><button class="ib" data-mclose aria-label="Close">${ic('x',18)}</button></div>
  <div class="mb gk"><p class="vf-lead">${geT('k.sub')}</p><form id="gk-f" class="cp-in gk-in"><span>${ic('phone2',15)}</span><input id="gk-ph" inputmode="tel" placeholder="0812 3456 7890"><button class="btn btn-p" type="submit">${geT('k.find')}</button></form>
    ${GE.claims.length?`<div class="cp-try">${geT('k.try')} ${GE.claims.slice(-3).map(x=>`<button type="button" class="chip" data-gkph="${x.phone}">${fphone(x.phone)}</button>`).join('')}</div>`:`<p class="d-sub">${geT('k.none')}${geClaimable()?` <a class="lnk" href="#claim/${geClaimable().code}" data-mclose>${geT('k.open')}</a>`:''}</p>`}
    <div id="gk-r">${msg}</div></div><div class="mf"><button class="btn btn-o" data-mclose>${geT('g.ok')}</button></div>`;mscrim.classList.add('open');
  const look=p=>{p=normPhone(p);const v=GE.claims.filter(x=>x.phone===p);const r=document.getElementById('gk-r');
    if(!v.length){r.innerHTML=`<p class="cp-err">${geT('k.nf')}</p>`;return}
    r.innerHTML=v.map((x,j)=>{const c=GE.camps.find(y=>y.id===x.camp),i=c&&geIdea(c.idea)||GE_IDEAS[0],vv=c?c.voucher:{kind:'pct',v:10,max:10000};
      return`<div class="gk-v">${ic('tag',18)}<div><b>${geT('k.found')} · ${esc(geOffer(i,vv,geLang()))}</b><span>${esc(x.code)} · ${geT('k.min',{min:rp(vv.min||0)})}</span></div>${x.redeemed?`<span class="st ok sm">${geT('k.used')}</span>`:`<button class="btn btn-p" data-gkr="${GE.claims.indexOf(x)}">${geT('k.redeem')}</button>`}</div>`}).join('')};
  const f=document.getElementById('gk-f');f.onsubmit=e=>{e.preventDefault();look(document.getElementById('gk-ph').value)};
  modal.onclick=e=>{const b=e.target.closest('button');if(!b)return;
    if(b.dataset.gkph){document.getElementById('gk-ph').value=fphone(b.dataset.gkph);look(b.dataset.gkph)}
    if(b.dataset.gkr){const x=GE.claims[+b.dataset.gkr],c=GE.camps.find(y=>y.id===x.camp);x.redeemed=true;if(c)c.cashier++;track('voucher_redeemed',{channel:'cashier'});toast(geT('k.done'));look(x.phone);if(location.hash.startsWith('#marketing/growth'))renderGrowth()}}};draw()}
const geClaimable=()=>GE.camps.find(c=>c.st==='running'&&c.ch.includes('off'));

/* ===== C5 settings ===== */
function geSettings(){const s=GE.settings;modal.classList.add('nw');
  modal.innerHTML=`<div class="mh"><h3>${geT('g.settings')}</h3><button class="ib" data-mclose aria-label="Close">${ic('x',18)}</button></div>
  <div class="mb g-set"><div class="fld"><label for="gs-cap">${geT('s.cap')}</label><select id="gs-cap">${[3,5,7,10,14].map(n=>`<option value="${n}" ${s.cap===n?'selected':''}>${geT('s.cap.v',{n})}</option>`).join('')}</select><p class="d-sub">${geT('s.cap.sub')}</p></div>
    <div class="fld"><label for="gs-hold">${geT('s.hold')}</label><select id="gs-hold">${[0,5,10,15,20,30].map(n=>`<option value="${n}" ${s.hold===n?'selected':''}>${n}%</option>`).join('')}</select></div>
    <div class="fld"><label for="gs-lang">${geT('s.lang')}</label><select id="gs-lang"><option value="id" ${s.lang==='id'?'selected':''}>Bahasa Indonesia</option><option value="en" ${s.lang==='en'?'selected':''}>English</option></select></div>
    <div class="fld"><label>${geT('s.owner')}</label><input value="${esc(GE_OWNER.name)} · ${fphone(GE_OWNER.phone)}" readonly><p class="d-sub">${geT('s.owner.sub')}</p></div>
    <label class="st-chk"><input type="checkbox" id="gs-q" ${s.quiet?'checked':''}> ${geT('s.quiet')}</label></div>
  <div class="mf"><button class="btn btn-o" data-mclose>${geT('pay.cancel')}</button><button class="btn btn-p" id="gs-save">${geT('s.save')}</button></div>`;mscrim.classList.add('open');
  document.getElementById('gs-save').onclick=()=>{s.cap=+document.getElementById('gs-cap').value;s.hold=+document.getElementById('gs-hold').value;s.lang=document.getElementById('gs-lang').value;s.quiet=document.getElementById('gs-q').checked;
    track('growth_settings_saved',{cap:s.cap,hold:s.hold,lang:s.lang});closeModal();toast(geT('s.saved'));renderGrowth()}}

/* ===== QR code (byte mode, error correction M, versions 1–10), drawn on a canvas. A normal link, never a payment QRIS. ===== */
function geQR(text){const data=[...new TextEncoder().encode(text)];
  const EC=[0,10,16,26,18,24,16,18,22,22,26],NB=[0,1,1,1,2,2,4,4,4,5,5],TOT=[0,26,44,70,100,134,172,196,242,292,346],AL=[0,[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50]];
  let ver=1;for(;ver<=10;ver++){if(4+(ver<10?8:16)+data.length*8<=(TOT[ver]-NB[ver]*EC[ver])*8)break}if(ver>10)throw new Error('QR text too long');
  const size=ver*4+17,cap=(TOT[ver]-NB[ver]*EC[ver])*8,bits=[],put=(v,n)=>{for(let i=n-1;i>=0;i--)bits.push(v>>>i&1)};
  put(4,4);put(data.length,ver<10?8:16);data.forEach(b=>put(b,8));put(0,Math.min(4,cap-bits.length));while(bits.length%8)bits.push(0);
  for(let p=0xEC;bits.length<cap;p^=0xEC^0x11)put(p,8);
  const cw=[];for(let i=0;i<bits.length;i+=8)cw.push(bits.slice(i,i+8).reduce((a,b)=>a<<1|b,0));
  const mul=(x,y)=>{let z=0;for(let i=7;i>=0;i--){z=(z<<1)^((z>>>7)*0x11D);z^=((y>>>i)&1)*x}return z&255};
  const div=(()=>{const r=new Array(EC[ver]).fill(0);r[EC[ver]-1]=1;let root=1;for(let i=0;i<EC[ver];i++){for(let j=0;j<r.length;j++){r[j]=mul(r[j],root);if(j+1<r.length)r[j]^=r[j+1]}root=mul(root,2)}return r})();
  const rem=d=>{const r=div.map(()=>0);d.forEach(b=>{const f=b^r.shift();r.push(0);div.forEach((c,i)=>r[i]^=mul(c,f))});return r};
  const nb=NB[ver],raw=TOT[ver],short=nb-raw%nb,sl=Math.floor(raw/nb),blocks=[];
  for(let i=0,k=0;i<nb;i++){const dat=cw.slice(k,k+sl-EC[ver]+(i<short?0:1));k+=dat.length;const e=rem(dat);if(i<short)dat.push(0);blocks.push(dat.concat(e))}
  const all=[];for(let i=0;i<blocks[0].length;i++)blocks.forEach((b,j)=>{if(i!==sl-EC[ver]||j>=short)all.push(b[i])});
  const M=[...Array(size)].map(()=>Array(size).fill(false)),FN=[...Array(size)].map(()=>Array(size).fill(false)),set=(x,y,v)=>{M[y][x]=v;FN[y][x]=true};
  for(let i=0;i<size;i++){set(6,i,i%2===0);set(i,6,i%2===0)}
  [[3,3],[size-4,3],[3,size-4]].forEach(([cx,cy])=>{for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++){const d=Math.max(Math.abs(dx),Math.abs(dy)),x=cx+dx,y=cy+dy;if(x>=0&&x<size&&y>=0&&y<size)set(x,y,d!==2&&d!==4)}});
  const ap=AL[ver];ap.forEach((a,i)=>ap.forEach((b,j)=>{if(i===0&&j===0||i===0&&j===ap.length-1||i===ap.length-1&&j===0)return;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)set(a+dx,b+dy,Math.max(Math.abs(dx),Math.abs(dy))!==1)}));
  const fmt=mask=>{const d=0<<3|mask;let r=d;for(let i=0;i<10;i++)r=(r<<1)^((r>>>9)*0x537);const b=(d<<10|r)^0x5412,g=i=>(b>>>i&1)===1;
    for(let i=0;i<=5;i++)set(8,i,g(i));set(8,7,g(6));set(8,8,g(7));set(7,8,g(8));for(let i=9;i<15;i++)set(14-i,8,g(i));
    for(let i=0;i<8;i++)set(size-1-i,8,g(i));for(let i=8;i<15;i++)set(8,size-15+i,g(i));set(8,size-8,true)};
  fmt(0);
  if(ver>=7){let r=ver;for(let i=0;i<12;i++)r=(r<<1)^((r>>>11)*0x1F25);const b=ver<<12|r;for(let i=0;i<18;i++){const v=(b>>>i&1)===1,a=size-11+i%3,c=Math.floor(i/3);set(a,c,v);set(c,a,v)}}
  let k=0;for(let right=size-1;right>=1;right-=2){if(right===6)right=5;for(let vert=0;vert<size;vert++)for(let j=0;j<2;j++){const x=right-j,up=((right+1)&2)===0,y=up?size-1-vert:vert;
    if(!FN[y][x]&&k<all.length*8){M[y][x]=(all[k>>>3]>>>(7-(k&7))&1)===1;k++}}}
  const MASKS=[(x,y)=>(x+y)%2===0,(x,y)=>y%2===0,(x,y)=>x%3===0,(x,y)=>(x+y)%3===0,(x,y)=>(Math.floor(x/3)+Math.floor(y/2))%2===0,(x,y)=>x*y%2+x*y%3===0,(x,y)=>(x*y%2+x*y%3)%2===0,(x,y)=>((x+y)%2+x*y%3)%2===0];
  const apply=m=>{for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(!FN[y][x]&&MASKS[m](x,y))M[y][x]=!M[y][x]};
  const score=()=>{let s=0,dark=0;for(let y=0;y<size;y++){let rx=1,ry=1;for(let x=0;x<size;x++){if(M[y][x])dark++;
      if(x){if(M[y][x]===M[y][x-1]){rx++;if(rx===5)s+=3;else if(rx>5)s++}else rx=1;if(M[x][y]===M[x-1][y]){ry++;if(ry===5)s+=3;else if(ry>5)s++}else ry=1}
      if(x&&y&&M[y][x]===M[y-1][x]&&M[y][x]===M[y][x-1]&&M[y][x]===M[y-1][x-1])s+=3}}
    return s+Math.floor(Math.abs(dark*20-size*size*10)/(size*size))*10};
  let best=0,bs=1e9;for(let m=0;m<8;m++){apply(m);fmt(m);const sc=score();if(sc<bs){bs=sc;best=m}apply(m)}
  apply(best);fmt(best);return M}
function geQRDraw(x,text,X,Y,S){const M=geQR(text),n=M.length+8,u=S/n;x.fillStyle='#fff';x.fillRect(X,Y,S,S);x.fillStyle='#000';
  M.forEach((row,r)=>row.forEach((v,c)=>{if(v)x.fillRect(Math.floor(X+(c+4)*u),Math.floor(Y+(r+4)*u),Math.ceil(u),Math.ceil(u))}))}
