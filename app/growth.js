/* ===== Growth Engine › Campaign (BUILD_SPEC section 5). Replaces v3.12 (app/crm.js). =====
 * Create a campaign (WhatsApp now, email later): shopper category → (pick shoppers) → voucher or cashback →
 * rules → review → submit. Ideas for this week (competitors + the merchant's store + the calendar) start the same
 * journey prefilled; a post idea opens Studio. Results per campaign by voucher or cashback ID. No holdout for now.
 */
const GE={acct:null,dismissed:{},extra:[],camps:[],drafts:{},claims:[],settings:{cap:7,hold:0,lang:'id',quiet:true},seq:1100};
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

/* ----- the Studio image for an idea: a saved design, or one Studio makes from the idea's product ----- */
function geAutoDesign(i,L){const k='auto-'+i.id+'-'+L;let s=GS.designs.find(d=>d.key===k);if(s)return s;
  const cc=ST_COPY.fashion.playful[L],b=i.voucher?(i.voucher.kind==='pct'?'-'+i.voucher.v+'%':''):'',h=(GE_HEAD[i.id]||{})[L]||geL(i.title);
  s={key:k,auto:true,merchant:true,at:geNow(),product:{id:i.product},cat:'fashion',name:'',paid:true,
    design:{id:k,format:'1:1',lang:L,tone:'playful',badge:b,logoOn:true,logoPos:'bottom-left',brand:GE_BRAND.colour,round:0,seen:[],tags:[],match:100,tight:false},
    v:{scene:i.scene||'studio-white',layout:'left',h,s:cc.s[0],c:i.type==='post'?cc.c[1]||cc.c[0]:(L==='id'?'Pakai voucher':'Use voucher'),hi:0,si:0,ci:0,badge:b}};
  return s}
function geDesignOf(g){const s=GS.designs.find(d=>d.key===g.design);if(s)return s;const a=geAutoDesign(g.i,g.lang),v=g.voucher,b=v?(v.kind==='pct'?'-'+v.v+'%':'-'+Math.round(v.v/1000)+'rb'):'';a.v.badge=a.design.badge=b;return a}
function geImg(sd,W=540,fmt){const k=stSwap(sd),keepF=STU.design.format;if(fmt)STU.design.format=fmt;stBrandOn();const r=stRender(sd.v,W,{});STU.design.format=keepF;stSwap(k);return r.c}

/* ===== Campaign tab: create (from scratch or an idea), overall metrics, metrics by campaign, the list ===== */
function renderGrowth(){const el=document.getElementById('view-gro'),g=GS.route||{};
  if(GS.account==='lead'){el.innerHTML=geTabs('gro')+geLocked('gro');return}
  geInit();cpInit();
  if(g.sub==='campaign'){geRenderCamp(el,g.id);return}
  const ideas=geIdeaList().filter(i=>!GE.dismissed[i.id]),dates=geBigDates(GE_HOL_CACHE),wk=geNow(),we=new Date(wk.getTime()+6*DAY);
  const cs=GE.camps,R=cs.map(geRes),sum=k=>R.reduce((a,r)=>a+(r[k]||0),0),sales=sum('sales'),cost=R.reduce((a,r)=>a+r.cost+r.vcost,0),f=n=>Math.round(n).toLocaleString(geLang()==='id'?'id-ID':'en-US');
  const byC=cs.map((c,i)=>({c,r:R[i]})).filter(x=>x.c.st!=='scheduled').sort((a,b)=>b.r.sales-a.r.sales).slice(0,6),mx=Math.max(1,...byC.map(x=>x.r.sales));
  el.innerHTML=`${geTabs('gro',`${geLangSeg()}<button class="btn btn-o" data-gset>${ic('gear',15)}${geT('g.settings')}</button>`)}
  <section class="card g-create"><div><b>${geT('g.create.h')}</b><span>${geT('g.create.sub')}</span></div>
    <ol class="g-steps">${['ch','who','type','rules','review'].map((k,i)=>`<li><i>${i+1}</i>${geT('cj.s.'+k)}</li>`).join('')}</ol>
    <a class="btn btn-p" href="#marketing/growth/campaigns/new" data-gnew>${ic('plus',15)}${geT('cj.new')}</a></section>
  <div class="sec-h"><div><h2 class="sec">${geT('g.week',{from:cpShort(wk),to:cpShort(we)})}</h2><p class="sec-sub">${geT('g.ideas.sub2')}</p></div></div>
  <p class="g-loop">${ic('repeat',13)}${geT('g.f.made',{c:CP.tracked.length,d:dates.filter(d=>d.kind!=='payday').length})}</p>
  <div class="g-ideas">${ideas.map(geIdeaCard).join('')||`<section class="card w-empty"><span class="qic">${ic('bulb',22,1.6)}</span><div><b>${geT('g.ideas.none')}</b></div></section>`}</div>
  <details class="g-cald"><summary>${ic('calendar',14)}${geT('g.cal.h')} · <span id="g-cal-src">${GE_HOL_LIVE?geT('g.cal.live'):geT('g.cal.fb')}</span></summary>
  <div class="g-cal">${dates.filter(d=>d.kind!=='payday').slice(0,8).map(d=>`<div class="g-day g-${d.kind}"><b>${d.at.getDate()}</b><span>${d.at.toLocaleDateString(geLang()==='id'?'id-ID':'en-GB',{month:'short'})}</span><small>${esc(geL(d.n))}</small><i>${geT('g.kind.'+d.kind)}</i></div>`).join('')}</div></details>
  <div class="sec-h"><div><h2 class="sec">${geT('g.all.h')}</h2><p class="sec-sub">${geT('g.all.sub')}</p></div></div>
  <div class="g-pulse g-k5">${[[geT('g.all.camps'),f(cs.length),geT('g.all.run',{n:cs.filter(c=>c.st==='running').length})],[geT('g.all.sent'),f(sum('sent')),geT('g.all.read',{n:f(sum('read'))})],
      [geT('g.all.used'),f(sum('redeemed')),geT('g.all.used.sub')],[geT('g.k.sales'),geJt(sales),geT('g.all.cost',{c:geJt(cost)})],[geT('g.k.ret'),cost?geT('g.k.ret.v',{x:(sales/cost).toFixed(1).replace('.',geLang()==='id'?',':'.')}):'—',geT('g.all.ret.sub')]].map(([k,v,s])=>`<section class="card"><span>${k}</span><b>${v}</b><small>${s}</small></section>`).join('')}</div>
  ${byC.length?`<section class="card g-byc"><h4>${geT('g.byc.h')}</h4>${byC.map(({c,r})=>`<button class="g-bar" data-gcamp="${c.id}"><span><b>${esc(geL(c.name))}</b><small>${c.id} · ${geT('g.type.'+(c.type||'voucher'))} · ${geT('g.byc.used',{n:f(r.redeemed),s:f(r.sent)})}</small></span><i><em style="width:${Math.max(2,r.sales/mx*100)}%"></em></i><b>${geJt(r.sales)}</b></button>`).join('')}</section>`:''}
  <div class="sec-h" id="g-camps"><div><h2 class="sec">${geT('g.camps.h')}</h2><p class="sec-sub">${geT('g.camps.sub')}</p></div></div>
  ${geCampList()}`;
  el.onclick=geLandClick;
  el.querySelectorAll('[data-gnew]').forEach(a=>a.onclick=()=>{GS.cj=null;GS.campPre=null});
  if(!GE_HOL_CACHE)geHolidays().then(h=>{GE_HOL_CACHE=h;if(location.hash==='#marketing/growth/campaigns')renderGrowth()})}
let GE_HOL_CACHE=null;
function geIdeaCard(i){const L=geLang(),c=geCampOf(i.id),v=i.voucher,chs=i.ch.map(k=>`<span class="g-ch" title="${geT('g.ch.'+k)}">${ic(GE_CH.find(x=>x[0]===k)[1],14)}${geT('g.ch.'+k)}</span>`).join('');
  return`<section class="card g-idea">
    <div class="g-ih"><span class="st ${i.type==='post'?'gr':'pu'} sm">${geT('g.type.'+i.type)}</span>${i.src.map(s=>`<span class="g-src g-src-${s}">${geT('g.src.'+s)}</span>`).join('')}${i.fresh?`<span class="st ok sm">${geT('cp.new')}</span>`:''}</div>
    <h3>${esc(geL(i.title))}</h3><p>${esc(geL(i.why).replace('{n}',(i.segs||[]).reduce((a,k)=>a+geSegN(k),0).toLocaleString(L==='id'?'id-ID':'en-US')))}</p>
    <div class="g-im">${chs}${v?`<span class="g-v">${ic('tag',13)}${esc(geOffer(i,v,L))}</span>`:''}</div>
    <div class="g-if"><div class="g-exp"><b>${geRange(geExpOf(i))}</b><span>${geT(i.type==='post'?'g.exp.post':'g.exp')}</span></div>
      ${c?`<a class="btn btn-o" href="#marketing/growth/campaign/${c.id}">${geT('g.running')}</a>`:`<button class="btn btn-o" data-gnot="${i.id}">${geT('g.not')}</button><button class="btn btn-p" data-gidea="${i.id}">${geT(i.type==='post'?'g.idea.content':'g.idea.camp')}</button>`}</div></section>`}
/* an idea opens the same journeys as everything else: a campaign idea → Create campaign, a post idea → Studio */
function geIdeaGo(id){const i=geIdea(id);if(!i)return;track('idea_used',{id,type:i.type});
  if(i.type==='post'){GS.cr=null;GS.studioPre={ch:'feed',fmt:'still',product:i.product,caption:geL(i.caption),from:{idea:i.id,name:geL(i.title)}};go('marketing/growth/studio/new');return}
  GS.cj=null;GS.campPre={type:'voucher',segs:[...(i.segs||[])],voucher:i.voucher?{...i.voucher}:null,tpl:i.tpl,name:geL(i.title),idea:i.id,design:geAutoDesign(i,GE.settings.lang).key,from:{idea:i.id,name:geL(i.title)}};
  if(!GS.designs.some(d=>d.key===GS.campPre.design))GS.designs.push(geAutoDesign(i,GE.settings.lang));
  go('marketing/growth/campaigns/new')}
function geLandClick(e){const b=e.target.closest('button');if(!b)return;const D=b.dataset;
  if('gset' in D)geSettings();
  if(D.lang)geSetLang(D.lang);
  if(D.gidea)geIdeaGo(D.gidea);
  if(D.gnot){e.stopPropagation();if(popFor===b){closePop();return}popFor=b;
    pop.innerHTML=`<h6>${geT('g.not.h')}</h6>${['rel','did','later'].map(k=>`<button class="opt" data-why="${k}">${geT('g.not.'+k)}</button>`).join('')}`;
    pop.querySelectorAll('[data-why]').forEach(o=>o.onclick=()=>{closePop();GE.dismissed[D.gnot]=o.dataset.why;track('idea_dismissed',{reason:o.dataset.why});toast(geT('g.not.done'));renderGrowth()});placePop(b,true)}
  if(D.gcamp)go('marketing/growth/campaign/'+D.gcamp)}

/* ===== Campaign list ===== */
function geCampList(){const groups=[['running',GE.camps.filter(c=>c.st==='running')],['scheduled',GE.camps.filter(c=>c.st==='scheduled')],['ended',GE.camps.filter(c=>c.st==='ended')]];
  if(!GE.camps.length)return`<section class="card w-empty"><span class="qic">${ic('chart',22,1.6)}</span><div><b>${geT('g.camps.none')}</b><span>${geT('g.camps.none.sub')}</span></div><a class="btn btn-p" href="#marketing/growth/campaigns/new">${geT('cj.new')}</a></section>`;
  return`<section class="card"><div class="tbl-wrap"><table class="cp-tbl g-ct"><thead><tr><th>${geT('g.c.name')}</th><th>${geT('g.c.status')}</th><th>${geT('g.c.type')}</th><th>${geT('g.c.ch')}</th><th>${geT('g.c.start')}</th><th class="r">${geT('g.c.sent')}</th><th class="r">${geT('g.c.used')}</th><th class="r">${geT('g.c.sales')}</th><th></th></tr></thead>
  <tbody>${groups.flatMap(([k,cs])=>cs.map(c=>{const r=geRes(c);return`<tr><td><b>${esc(geL(c.name))}</b><small>${c.id}</small></td><td><span class="st ${k==='running'?'ok':k==='scheduled'?'pu':'gr'} sm">${geT('g.st.'+k)}</span></td><td>${geT('g.type.'+(c.type||'voucher'))}</td><td>${c.ch.map(x=>geT('g.ch.'+x)).join(', ')}</td><td>${geFdate(c.start)}</td><td class="r">${r.sent.toLocaleString()}</td><td class="r">${r.redeemed.toLocaleString()}</td><td class="r">${geJt(r.sales)}</td><td class="r"><button class="btn btn-o" data-gcamp="${c.id}">${geT('g.c.open')}</button></td></tr>`})).join('')}</tbody></table></div></section>`}

/* ===== Create campaign: channel → shoppers → (pick shoppers) → voucher or cashback → rules → review → submit ===== */
const CJ_ALL=['new','repeat','vip','risk','lapsed'];
function cjNew(pre={}){return{step:pre.design&&pre.fromStudio?'who':'ch',ch:'wa',segs:pre.segs||[],sel:new Set(pre.sel||[]),type:pre.type||'voucher',
  voucher:pre.voucher||{kind:'pct',v:10,max:20000,min:100000,days:7,quota:200},cb:pre.cb||{v:20000,min:100000,days:14,quota:150},
  tpl:pre.tpl||'promo_discount',lang:GE.settings.lang,design:pre.design||null,name:pre.name||'',send:'now',pm:'balance',from:pre.from||null,idea:pre.idea||null,q:'',fseg:''}}
const cjSteps=j=>['ch','who',...(j.segs.includes('sel')?['pick']:[]),'type','rules','review'];
function cjAud(j){if(j.segs.includes('sel')){const n=j.sel.size;return{n,opt:0,busy:0,send:n}}
  const ks=j.segs.includes('all')?[...CJ_ALL]:j.segs,n=ks.reduce((a,k)=>a+geSegN(k),0),opt=Math.round(n*.03),busy=GE.camps.some(c=>c.st==='running'&&c.ch.includes('wa'))?Math.round(n*.06):0;
  return{n,opt,busy,send:Math.max(0,n-opt-busy)}}
const cjSegName=k=>k==='all'?geT('cj.all'):k==='sel'?geT('cj.sel'):geL(geSeg(k).n);
/* the offer, in the shopper's language, for the WhatsApp template */
function cjOffer(j,L=j.lang){const v=j.voucher,c=j.cb,R=n=>rp(n);
  if(j.type==='cashback')return L==='id'?`cashback ${R(c.v)} untuk pesanan pertama min. ${R(c.min)}`:`${R(c.v)} cashback on your first order of ${R(c.min)} or more`;
  return v.kind==='pct'?(L==='id'?`diskon ${v.v}% (maks ${R(v.max)}), min. belanja ${R(v.min)}`:`${v.v}% off (up to ${R(v.max)}) on orders of ${R(v.min)} or more`)
    :(L==='id'?`potongan ${R(v.v)}, min. belanja ${R(v.min)}`:`${R(v.v)} off on orders of ${R(v.min)} or more`)}
const cjDays=j=>j.type==='cashback'?j.cb.days:j.voucher.days;
GX.camp=g=>{geInit();cpInit();if(!GS.cj){GS.cj=cjNew(GS.campPre||{});GS.campPre=null;track('campaign_create_started',{from:GS.cj.from?Object.keys(GS.cj.from)[0]:'scratch'})}
  return{title:geT('cj.new'),html:`<div class="gi" id="cj"></div>`,after:cjDraw}};
function cjDraw(){const el=document.getElementById('cj');if(!el||!GS.cj)return;const j=GS.cj,st=cjSteps(j);if(!st.includes(j.step))j.step='who';const k=st.indexOf(j.step);
  el.innerHTML=`${j.from?`<p class="cj-from">${ic('info',14)}${geT('cj.from',{n:esc(j.from.name||cjSegName(j.from.seg||'all'))})}</p>`:''}
  <div class="gi-steps">${st.map((s,i)=>`${i?'<span class="stp-l"></span>':''}<button class="stp${i===k?' on':i<k?' done':''}" data-cjstep="${s}" ${i>k?'disabled':''}><i>${i<k?ic('check',11,2.6):i+1}</i><span>${geT('cj.s.'+s)}</span></button>`).join('')}</div>
  <div class="gi-grid"><div class="gi-main">${cjBody(j)}</div><aside class="gi-side" id="cj-side">${cjSide(j)}</aside></div>
  <div class="gi-foot">${k?`<button class="btn btn-o" data-cjstep="${st[k-1]}">${geT('g.back')}</button>`:'<span></span>'}
    ${j.step==='review'?`<button class="btn btn-p" id="cj-go">${ic('rocket',15)}${geT(j.send==='now'?'cj.submit':'cj.schedule')}</button>`:`<button class="btn btn-p" data-cjnext>${geT('cj.next')}</button>`}</div>`;
  el.onclick=cjClick;el.oninput=e=>cjInput(e,false);el.onchange=e=>cjInput(e,true)}
function cjBody(j){const f=n=>Math.round(n).toLocaleString(geLang()==='id'?'id-ID':'en-US');
  if(j.step==='ch')return`<section class="card"><h4>${geT('cj.ch.h')}</h4><div class="gi-tog cj-ch">
    <label class="gi-t on"><input type="radio" name="cjch" checked><span>${ic('chat2',18)}</span><div><b>WhatsApp</b><small>${geT('cj.ch.wa',{c:rp(GE_LIMITS.waCost)})}</small></div></label>
    <label class="gi-t cj-off" aria-disabled="true"><input type="radio" name="cjch" disabled><span>${ic('mail',18)}</span><div><b>Email <span class="st gr sm">${geT('cj.soon')}</span></b><small>${geT('cj.ch.email')}</small></div></label></div></section>`;
  if(j.step==='who'){const all=[...CJ_ALL,'checkout'],tot=CJ_ALL.reduce((a,k)=>a+geSegN(k),0);
    return`<section class="card"><h4>${geT('cj.who.h')}</h4><p class="d-sub">${geT('cj.who.sub')}</p><div class="cj-segs">
    ${[['all',tot,geT('cj.all.rule')],...all.map(k=>[k,geSegN(k),geL(geSeg(k).rule)]),['sel',GE_SHOPLIST.length,geT('cj.sel.rule')]].map(([k,n,r])=>`<label class="gi-t${j.segs.includes(k)?' on':''}"><input type="checkbox" data-cjseg="${k}" ${j.segs.includes(k)?'checked':''}><div><b>${esc(cjSegName(k))}</b><small>${esc(r)}</small></div><em>${f(n)}</em></label>`).join('')}</div></section>`}
  if(j.step==='pick'){const q=j.q.toLowerCase(),list=GE_SHOPLIST.filter(s=>(!j.fseg||s.seg===j.fseg)&&(!q||s.n.toLowerCase().includes(q)||s.phone.includes(q)));
    return`<section class="card"><div class="gi-h"><h4>${geT('cj.pick.h')}</h4><b class="cj-cnt">${geT('cj.pick.n',{n:j.sel.size})}</b></div>
    <div class="cj-pf"><input id="cj-q" placeholder="${geT('cj.pick.q')}" value="${esc(j.q)}" autocomplete="off"><select id="cj-fseg"><option value="">${geT('cj.pick.allseg')}</option>${CJ_ALL.map(k=>`<option value="${k}" ${j.fseg===k?'selected':''}>${esc(geL(geSeg(k).n))}</option>`).join('')}</select><button class="btn btn-o" data-cjall>${geT('cj.pick.all')}</button></div>
    <div class="cj-list" id="cj-list">${cjList(list,j)}</div><p class="d-sub">${geT('cj.pick.note')}</p></section>`}
  if(j.step==='type')return`<section class="card"><h4>${geT('cj.type.h')}</h4><div class="gi-tog">
    ${['voucher','cashback'].map(k=>`<label class="gi-t${j.type===k?' on':''}"><input type="radio" name="cjtype" value="${k}" ${j.type===k?'checked':''}><span>${ic(k==='voucher'?'tag':'wallet',18)}</span><div><b>${geT('g.type.'+k)}</b><small>${geT('cj.type.'+k)}</small></div></label>`).join('')}</div>
    <div class="cj-ex">${cjExample(j)}</div></section>`;
  if(j.step==='rules'){const v=j.voucher,c=j.cb,mine=GS.designs.filter(s=>s.thumb||s.merchant).slice(0,8),tpls=Object.keys(GE_WA).filter(k=>GE_WA[k].cat==='marketing');
    return`<section class="card"><h4>${geT('cj.rules.h')}</h4>
    <div class="fld"><label for="cj-name">${geT('cj.name')}</label><input id="cj-name" value="${esc(j.name)}" placeholder="${geT('cj.name.ph')}"></div>
    ${j.type==='voucher'?`<div class="gi-vf">
      <div class="fld"><label>${geT('g.v.kind')}</label><div class="seg">${['pct','amt'].map(x=>`<button class="${v.kind===x?'on':''}" data-cjvk="${x}">${x==='pct'?'%':'Rp'}</button>`).join('')}</div></div>
      <div class="fld"><label for="cjv-v">${geT('g.v.value')}</label><input id="cjv-v" type="number" min="1" value="${v.v}" data-cjv="v"></div>
      ${v.kind==='pct'?`<div class="fld"><label for="cjv-max">${geT('g.v.max')}</label><input id="cjv-max" type="number" min="0" step="1000" value="${v.max}" data-cjv="max"></div>`:''}
      <div class="fld"><label for="cjv-min">${geT('g.v.min')}</label><input id="cjv-min" type="number" min="0" step="1000" value="${v.min}" data-cjv="min"></div>
      <div class="fld"><label for="cjv-days">${geT('g.v.days')}</label><input id="cjv-days" type="number" min="1" value="${v.days}" data-cjv="days"></div>
      <div class="fld"><label for="cjv-quota">${geT('g.v.quota')}</label><input id="cjv-quota" type="number" min="1" value="${v.quota}" data-cjv="quota"></div></div>`
    :`<div class="gi-vf">
      <div class="fld"><label for="cjc-v">${geT('cj.cb.v')}</label><input id="cjc-v" type="number" min="1000" step="1000" value="${c.v}" data-cjc="v"></div>
      <div class="fld"><label for="cjc-min">${geT('g.v.min')}</label><input id="cjc-min" type="number" min="0" step="1000" value="${c.min}" data-cjc="min"></div>
      <div class="fld"><label for="cjc-days">${geT('g.v.days')}</label><input id="cjc-days" type="number" min="1" value="${c.days}" data-cjc="days"></div>
      <div class="fld"><label for="cjc-quota">${geT('g.v.quota')}</label><input id="cjc-quota" type="number" min="1" value="${c.quota}" data-cjc="quota"></div></div>
      <p class="d-sub">${geT('cj.cb.rule')}</p>`}
    </section>
    <section class="card"><h4>${geT('cj.msg.h')}</h4>
    <div class="gi-vf"><div class="fld"><label for="cj-tpl">${geT('g.tpl')}</label><select id="cj-tpl">${tpls.map(k=>`<option value="${k}" ${j.tpl===k?'selected':''}>${geT('tpl.'+k)}</option>`).join('')}</select></div>
      <div class="fld"><label>${geT('g.lang')}</label>${geLangSegX(j.lang)}</div>
      <div class="fld"><label>${geT('cj.when')}</label><div class="seg">${['now','tmr'].map(x=>`<button class="${j.send===x?'on':''}" data-cjsend="${x}">${geT('cj.when.'+x)}</button>`).join('')}</div></div></div>
    <p class="d-sub">${geT('cj.tpl.note')}</p>
    <div class="fld"><label>${geT('cj.img')}</label><div class="gi-pick"><button class="cj-noimg${j.design?'':' on'}" data-cjimg="">${geT('cj.img.none')}</button>${mine.map(s=>`<button class="${j.design===s.key?'on':''}" data-cjimg="${s.key}" title="${esc(s.v.h)}"><img src="${s.thumb||geImg(s,140).toDataURL('image/jpeg',.7)}" alt="${esc(s.v.h)}"></button>`).join('')}</div>
      <button class="lnk" data-cjstudio>${ic('studio',14)}${geT('cj.img.new')}</button></div></section>`}
  /* review */
  const a=cjAud(j),cost=a.send*GE_LIMITS.waCost,lines=[[ic('chat2',15),geT('cj.r.ch'),'WhatsApp · '+geT('tpl.'+j.tpl)+' · '+j.lang.toUpperCase()],[ic('user',15),geT('cj.r.who'),j.segs.map(cjSegName).join(', ')+' · '+geT('cj.r.n',{n:f(a.send)})],
    [ic(j.type==='voucher'?'tag':'wallet',15),geT('g.type.'+j.type),geCap(cjOffer(j,geLang()))],[ic('calendar',15),geT('cj.r.valid'),geT('cj.r.days',{n:cjDays(j),until:geUntil(cjDays(j))})+' · '+geT('cj.r.quota',{n:j.type==='voucher'?j.voucher.quota:j.cb.quota})],
    [ic('clock',15),geT('cj.when'),geT('cj.when.'+j.send)]];
  return`<section class="card"><h4>${esc(j.name||geT('cj.name.ph'))}</h4><ul class="gi-sum">${lines.map(([i,k,v])=>`<li>${i}<span>${k}</span><b>${esc(v)}</b></li>`).join('')}</ul></section>
  <section class="card"><h4>${geT('cj.r.money')}</h4><div class="gi-cost"><div><span>${geT('cj.r.reach')}</span><b>${f(a.n)}</b></div>${a.opt?`<div><span>${geT('cj.r.opt')}</span><b>−${f(a.opt)}</b></div>`:''}${a.busy?`<div><span>${geT('cj.r.busy')}</span><b>−${f(a.busy)}</b></div>`:''}
    <div><span>${geT('cj.r.msgs',{n:f(a.send),c:rp(GE_LIMITS.waCost)})}</span><b>${rp(cost)}</b></div><div class="t"><span>${geT('cj.r.now')}</span><b>${rp(cost)}</b></div></div>
    <p class="d-sub">${geT('cj.r.later')}</p>
    ${cost?`<div class="fld"><label>${geT('ex.method')}</label><div class="st-pm"><label class="st-chk"><input type="radio" name="cjpm" value="balance" ${j.pm==='balance'?'checked':''}> ${geT('ex.balance',{bal:rp(GS.balance)})}</label><label class="st-chk"><input type="radio" name="cjpm" value="link" ${j.pm==='link'?'checked':''}> ${geT('ex.other')}</label></div></div>`:''}</section>
  <section class="card cj-ex">${cjExample(j)}</section>`}
function cjList(list,j){return list.map(s=>`<label class="cj-sh"><input type="checkbox" data-cjsh="${s.id}" ${j.sel.has(s.id)?'checked':''}><b>${esc(s.n)}</b><span>${fphone(s.phone)}</span><span class="st gr sm">${esc(geL(geSeg(s.seg).n))}</span><small>${geT('cj.sh.v',{o:s.orders,d:s.last})}</small></label>`).join('')||`<p class="d-sub">${geT('cj.pick.none')}</p>`}
/* what one order looks like, so the merchant sees what they receive */
function cjExample(j){const p=Math.max(j.type==='cashback'?j.cb.min:j.voucher.min,150000),v=j.voucher,d=j.type==='cashback'?j.cb.v:v.kind==='pct'?Math.min(v.max||1e12,Math.round(p*v.v/100)):v.v,fee=Math.round(p*GE_FEE/100),pay=Math.round((p-(j.type==='voucher'?d:0))*.007);
  const rows=j.type==='cashback'?[[geT('cj.e.price'),rp(p)],[geT('cj.e.pays'),rp(p)],[geT('cj.e.cb'),'−'+rp(d)],[geT('cj.e.fee',{p:String(GE_FEE).replace('.',geLang()==='id'?',':'.')}),'−'+rp(fee)],[geT('cj.e.pay'),'−'+rp(pay)]]
    :[[geT('cj.e.price'),rp(p)],[geT('cj.e.disc'),'−'+rp(d)],[geT('cj.e.pays'),rp(p-d)],[geT('cj.e.fee',{p:String(GE_FEE).replace('.',geLang()==='id'?',':'.')}),'−'+rp(fee)],[geT('cj.e.pay'),'−'+rp(pay)]];
  const get=p-d-fee-pay;
  return`<h4>${geT('cj.e.h')}</h4><div class="gi-cost">${rows.map(([k,x])=>`<div><span>${k}</span><b>${x}</b></div>`).join('')}<div class="t"><span>${geT('cj.e.get')}</span><b>${rp(get)}</b></div></div><p class="d-sub">${geT(j.type==='cashback'?'cj.e.cb.note':'cj.e.v.note')}</p>`}
function cjSide(j){const L=j.lang,tp=GE_WA[j.tpl]||{},sd=j.design?GS.designs.find(d=>d.key===j.design):null,img=sd?geImg(sd,360).toDataURL('image/jpeg',.8):null,a=cjAud(j);
  const who=j.segs.includes('sel')?(GE_SHOPLIST.find(s=>j.sel.has(s.id))||GE_SHOPLIST[0]).n.split(' ')[0]:GE_SHOPPERS[0].n;
  const body=String(tp[L]||'').replace(/\{\{(\d)\}\}/g,(m,n)=>`<mark>${esc([who,GE_OWNER.store,cjOffer(j),geUntil(cjDays(j)),'flik.id/v/ARU'+(GE.seq+1)][n-1])}</mark>`);
  return`<div class="gi-sh">${geT('cj.side.h')}</div>
  <div class="ge-wa"><div class="gi-sender">${esc(GE_OWNER.store)} via FLIK · ${geT('tpl.'+j.tpl)}</div><div class="ge-bub">${img?`<div class="ge-bimg"><img src="${img}" alt="${geT('g.side.img')}"></div>`:''}<p>${body}</p><small class="ge-bf">${GE_WA_FOOT[L]}</small><div class="ge-bbtn">${GE_WA_BTN[L].map(b=>`<span>${b}</span>`).join('')}</div></div></div>
  <div class="gi-vcard">${ic(j.type==='voucher'?'tag':'wallet',15)}<div><b>${esc(geCap(cjOffer(j,geLang())))}</b><span>${geT('cj.side.v',{n:a.send.toLocaleString(),until:geUntil(cjDays(j))})}</span></div></div>
  <p class="d-sub">${geT('cj.side.tpl')}</p>`}
function cjSideOnly(){const s=document.getElementById('cj-side');if(s&&GS.cj)s.innerHTML=cjSide(GS.cj)}
function cjNext(j){const st=cjSteps(j),k=st.indexOf(j.step);
  if(j.step==='who'&&!j.segs.length){toast(geT('cj.need.who'));return}
  if(j.step==='pick'&&!j.sel.size){toast(geT('cj.need.pick'));return}
  if(j.step==='rules'){const v=j.type==='voucher'?j.voucher:j.cb;if(!(v.v>0)||!(v.days>0)||!(v.quota>0)||j.type==='voucher'&&v.kind==='pct'&&v.v>90){toast(geT('cj.need.rules'));return}
    if(!j.name.trim())j.name=j.type==='voucher'?geCap(cjOffer(j,geLang()).split(',')[0]):geT('cj.cb.name',{v:rp(j.cb.v)})}
  j.step=st[k+1];cjDraw();scrollTo(0,0)}
function cjClick(e){const j=GS.cj,b=e.target.closest('button');if(!b||!j)return;const D=b.dataset;
  if(D.cjstep){j.step=D.cjstep;cjDraw()}
  if('cjnext' in D)cjNext(j);
  if(D.cjvk){j.voucher.kind=D.cjvk;if(D.cjvk==='amt'&&j.voucher.v<1000)j.voucher.v=25000;if(D.cjvk==='pct'&&j.voucher.v>90)j.voucher.v=10;cjDraw()}
  if(D.cjsend){j.send=D.cjsend;cjDraw()}
  if(D.gwl){j.lang=D.gwl;cjDraw()}
  if(D.cjimg!==undefined){j.design=D.cjimg||null;cjDraw()}
  if('cjstudio' in D){GS.studioReturn={camp:true};GS.cr=null;GS.studioPre={ch:'wa',fmt:'still',from:{camp:true,name:j.name||geT('cj.new')}};go('marketing/growth/studio/new')}
  if('cjall' in D){const q=j.q.toLowerCase();GE_SHOPLIST.filter(s=>(!j.fseg||s.seg===j.fseg)&&(!q||s.n.toLowerCase().includes(q))).forEach(s=>j.sel.add(s.id));cjDraw()}
  if(b.id==='cj-go')cjSubmit(j)}
function cjInput(e,commit){const j=GS.cj,t=e.target,D=t.dataset;if(!j)return;
  if(D.cjseg&&commit){const k=D.cjseg;if(t.checked){if(k==='all'||k==='sel')j.segs=[k];else j.segs=[...j.segs.filter(x=>x!=='all'&&x!=='sel'),k]}else j.segs=j.segs.filter(x=>x!==k);cjDraw();return}
  if(D.cjsh){t.checked?j.sel.add(D.cjsh):j.sel.delete(D.cjsh);const c=document.querySelector('.cj-cnt');if(c)c.textContent=geT('cj.pick.n',{n:j.sel.size});return}
  if(t.id==='cj-q'||t.id==='cj-fseg'){if(t.id==='cj-q')j.q=t.value;else j.fseg=t.value;const q=j.q.toLowerCase();document.getElementById('cj-list').innerHTML=cjList(GE_SHOPLIST.filter(s=>(!j.fseg||s.seg===j.fseg)&&(!q||s.n.toLowerCase().includes(q)||s.phone.includes(q))),j);return}
  if(t.name==='cjtype'&&commit){j.type=t.value;cjDraw();return}
  if(t.name==='cjpm'){j.pm=t.value;return}
  if(t.id==='cj-name'){j.name=t.value;return}
  if(t.id==='cj-tpl'){j.tpl=t.value;cjSideOnly();return}
  if(D.cjv){j.voucher[D.cjv]=Math.max(0,+t.value||0);cjSideOnly();if(commit)cjDraw();return}
  if(D.cjc){j.cb[D.cjc]=Math.max(0,+t.value||0);if(D.cjc==='v')j.cb.v=Math.round(j.cb.v);cjSideOnly();if(commit)cjDraw()}}
/* submit: pay the WhatsApp messages from the balance or a payment link, send through FLIK's approved template, open the results */
function cjSubmit(j){const a=cjAud(j),cost=a.send*GE_LIMITS.waCost,label=geT('g.e.ledger',{name:j.name});
  const pay=!cost?Promise.resolve({}):j.pm==='balance'?ledgerDebit(cost,label):paymentLinkSheet(cost,label);
  pay.then(r=>{const id='C-'+(++GE.seq),start=j.send==='tmr'?new Date(geNow().getTime()+DAY):geNow(),v=j.type==='voucher'?{...j.voucher}:{kind:'amt',v:j.cb.v,max:j.cb.v,min:j.cb.min,days:j.cb.days,quota:j.cb.quota};
    const c={id,idea:j.idea,name:{id:j.name,en:j.name},type:j.type,tpl:j.tpl,lang:j.lang,segs:[...j.segs],sel:[...j.sel],ch:['wa'],voucher:v,hold:0,conv:j.type==='cashback'?.045:.05,
      start,st:j.send==='tmr'?'scheduled':'running',n:a.send,offer:{id:cjOffer(j,'id'),en:cjOffer(j,'en')},aud:{...a,hold:0},cost,code:'ARU'+id.slice(2),claims:0,cashier:0,paid:r.ledgerTxnId?'balance':r.paymentLinkId?'payment_link':'none',design:j.design,from:j.from};
    GE.camps.unshift(c);
    if(c.st==='running'&&a.send){const sd=j.design?GS.designs.find(d=>d.key===j.design):null,img=sd?geImg(sd,540).toDataURL('image/jpeg',.82):null,off=cjOffer(j),until=geUntil(cjDays(j),start);
      const to=j.segs.includes('sel')?GE_SHOPLIST.filter(s=>j.sel.has(s.id)).map(s=>({n:s.n.split(' ')[0],phone:s.phone})):GE_SHOPPERS;
      if(a.send>5)GS.outbox.unshift({more:geT('g.e.more',{n:(a.send-5).toLocaleString(geLang()==='id'?'id-ID':'en-US')})});
      to.slice(0,Math.min(5,a.send)).forEach(s=>waSend(c.tpl,c.lang,[s.n,GE_OWNER.store,off,until,'flik.id/v/'+c.code],img,s.phone))}
    track('campaign_submitted',{type:c.type,segments:c.segs.join(','),pay:c.paid,from:j.from?Object.keys(j.from)[0]:'scratch'});
    GS.cj=null;toast(c.st==='scheduled'?geT('g.e.sched'):geT('g.e.done'));go('marketing/growth/campaign/'+id)}).catch(()=>{})}
const geLangSegX=l=>`<div class="seg" role="group" aria-label="WhatsApp language">${['id','en'].map(x=>`<button class="${l===x?'on':''}" data-gwl="${x}">${x.toUpperCase()}</button>`).join('')}</div>`;
function geDl(name,href,delay){setTimeout(()=>{try{const a=document.createElement('a');a.href=href;a.download=name;document.body.appendChild(a);a.click();a.remove()}catch(e){}},delay)}
/* Offline poster with a claim QR: parked for now (Reza, 6 Nov). Kept so the claim page and cashier still have a way in. */
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
  if(!c){el.innerHTML=`<div class="ph"><div><h1>${geT('gro.camp.h')}</h1><p class="sec-sub ge-sub"><a href="#marketing/growth/campaigns">${geT('tab.camp')}</a> › ${esc(id)}</p></div></div><section class="card w-empty"><span class="qic">${ic('chart',22,1.6)}</span><div><b>${geT('g.c.gone')}</b><span>${geT('g.c.gone.sub')}</span></div><a class="btn btn-p" href="#marketing/growth/campaigns">${geT('tab.camp')}</a></section>`;return}
  const r=geRes(c),f=n=>Math.round(n).toLocaleString(geLang()==='id'?'id-ID':'en-US'),days=Math.max(0,Math.floor((geNow()-c.start)/DAY)),off=c.ch.includes('off'),fun=[['sent',r.sent],['delivered',r.delivered],['read',r.read],['clicked',r.clicked],...(off?[['claimed',r.claimed]]:[]),['redeemed',r.redeemed]];
  const end=new Date(c.start.getTime()+(c.voucher?c.voucher.days:c.days||14)*DAY);
  el.innerHTML=`<div class="ph"><div><h1>${esc(geL(c.name))}</h1><p class="sec-sub ge-sub"><a href="#marketing/growth/campaigns">${geT('tab.camp')}</a> › ${c.id} · <span class="st ${c.st==='running'?'ok':c.st==='scheduled'?'pu':'gr'} sm">${geT('g.st.'+c.st)}</span> · ${geT('g.c.dates',{a:geFdate(c.start),b:geFdate(end)})}</p></div>
    <div class="g-hact"><button class="btn btn-o" data-gcsv>${ic('export',15)}${geT('g.c.csv')}</button>${c.st==='running'?`<button class="btn btn-o" data-gend>${geT('bar.end')}</button>`:''}${c.ch.includes('off')&&c.st!=='ended'?`<a class="btn btn-o" href="#claim/${c.code}">${ic('qr',15)}${geT('g.c.claim')}</a>`:''}</div></div>
  ${c.st==='running'&&days<1?`<p class="g-note">${ic('clock',14)}${geT('g.c.early')}</p>`:''}
  ${c.from||c.type?`<p class="cj-from">${ic(c.type==='cashback'?'wallet':'tag',14)}${esc(geCap(c.offer?geL(c.offer):geOffer({},c.voucher,geLang())))} · ${geT('g.type.'+(c.type||'voucher'))} · ${geT('g.c.code',{code:c.code})}${c.from&&c.from.name?' · '+geT('cj.from',{n:esc(c.from.name)}):''}</p>`:''}
  <div class="g-pulse g-k">${[[geT('g.k.sales'),geJt(r.sales),geT('g.k.sales.sub',{n:f(r.redeemed)})],c.hold?[geT('g.k.extra'),geJt(r.extra),r.lift?geT('g.k.lift',{x:r.lift.toFixed(1).replace('.',geLang()==='id'?',':'.')}):geT('g.k.wait')]:[geT('g.k.used'),f(r.redeemed),geT('g.k.used.sub',{n:f(r.sent),p:r.sent?Math.round(r.redeemed/r.sent*1000)/10:0})],
      [geT('g.k.cost'),geJt(r.cost+r.vcost),geT('g.k.cost.sub',{a:geJt(r.cost),b:geJt(r.vcost)})],[geT('g.k.ret'),(c.hold?r.ret:r.sales/Math.max(1,r.cost+r.vcost))?geT('g.k.ret.v',{x:(c.hold?r.ret:r.sales/Math.max(1,r.cost+r.vcost)).toFixed(1).replace('.',geLang()==='id'?',':'.')}):'—',geT('g.k.ret.sub')]].map(([k,v,s])=>`<section class="card"><span>${k}</span><b>${v}</b><small>${s}</small></section>`).join('')}</div>
  ${r.lift&&c.hold?`<section class="card g-hold"><span class="qic">${ic('chart',20,1.6)}</span><div><b>${geT('g.hold.h',{x:r.lift.toFixed(1).replace('.',geLang()==='id'?',':'.'),extra:geJt(r.extra)})}</b><span>${geT('g.hold.sub',{n:f(r.hold),p:c.hold||10})}</span></div></section>`:''}
  <div class="g-two"><section class="card"><h4>${geT('g.c.funnel')}</h4><div class="g-fun">${fun.map(([k,v])=>`<div><span>${geT('g.fn.'+k)}</span><i><em style="width:${r.sent?Math.max(1.5,v/r.sent*100):0}%"></em></i><b>${f(v)}</b></div>`).join('')}</div></section>
    <section class="card"><h4>${geT('g.c.by')}</h4><table class="cp-tbl"><tbody>${[['on',r.on],['cashier',r.cashier],...(off?[['claim',r.claim]]:[])].map(([k,v])=>`<tr><td>${geT('g.by.'+k)}</td><td class="r"><b>${f(v)}</b></td></tr>`).join('')}</tbody></table>
      <p class="d-sub">${geT('g.c.attr')}</p></section></div>
  ${c.st==='ended'?`<section class="card g-learn"><span class="qic">${ic('bulb',20,1.6)}</span><div><b>${geT('g.learn.h')}</b><span>${c.hold?geT(r.lift>=1.5?'g.learn.good':'g.learn.meh',{x:(r.lift||0).toFixed(1)}):geT('g.learn.used',{p:r.sent?Math.round(r.redeemed/r.sent*1000)/10:0})}</span></div></section>`:''}`;
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
  track('campaign_ended',{id:c.id});toast(geT('g.ended'));if(location.hash==='#marketing/growth/campaign/'+c.id||location.hash==='#marketing/growth/campaigns')show();else go('marketing/growth/campaign/'+c.id)}
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
    <div class="fld"><label for="gs-lang">${geT('s.lang')}</label><select id="gs-lang"><option value="id" ${s.lang==='id'?'selected':''}>Bahasa Indonesia</option><option value="en" ${s.lang==='en'?'selected':''}>English</option></select></div>
    <div class="fld"><label>${geT('s.owner')}</label><input value="${esc(GE_OWNER.name)} · ${fphone(GE_OWNER.phone)}" readonly><p class="d-sub">${geT('s.owner.sub')}</p></div>
    <label class="st-chk"><input type="checkbox" id="gs-q" ${s.quiet?'checked':''}> ${geT('s.quiet')}</label></div>
  <div class="mf"><button class="btn btn-o" data-mclose>${geT('pay.cancel')}</button><button class="btn btn-p" id="gs-save">${geT('s.save')}</button></div>`;mscrim.classList.add('open');
  document.getElementById('gs-save').onclick=()=>{s.cap=+document.getElementById('gs-cap').value;s.lang=document.getElementById('gs-lang').value;s.quiet=document.getElementById('gs-q').checked;
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
