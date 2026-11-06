/* ===== Growth Engine › My Brand and Competitor (BUILD_SPEC section 4) =====
 * My Brand: the merchant's own Instagram, Facebook, Meta ads and website (read the same public way as a competitor;
 * account sync comes later) + their FLIK store. Competitor: up to LIMITS.competitors, a summary that compares
 * My brand vs A vs B vs C channel by channel, then each competitor in detail with an action plan.
 * Action plans only use the fixed categories in GE_ACTIONS: a campaign (opens Campaign), content (opens Studio)
 * or a suggestion FLIK can't do for you (a price or range gap). Instagram, Facebook and the Meta Ad Library need
 * a Meta app token, so they are example data here. A real shop website is read live (public Shopify /products.json
 * or WooCommerce Store API) when the browser is allowed to; otherwise it says so.
 */
const CP={acct:null,me:null,tracked:[],snap:null,sel:null,ch:'ig',busy:false,classified:{}};
const cpShort=d=>d.toLocaleDateString(geLang()==='id'?'id-ID':'en-GB',{day:'numeric',month:'short'});
const cpDay=d=>new Date(NOW.getTime()+d*DAY);
/* the weekly refresh runs Mondays 07:00 */
function cpRefreshed(){const d=new Date(geNow());d.setHours(7,0,0,0);while(d.getDay()!==1||d>geNow())d.setDate(d.getDate()-1);return d}
function cpHandle(v){v=String(v||'').trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i,'').replace(/^@/,'').replace(/[/?#].*$/,'').toLowerCase();return/^[a-z0-9._]{2,30}$/.test(v)?v:''}
function cpDomain(v){v=String(v||'').trim().toLowerCase().replace(/^https?:\/\//,'').replace(/^www\./,'').replace(/[/?#].*$/,'');return/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(v)?v:''}

/* An Instagram account we don't have in the fixtures gets made-up, clearly-example data in the merchant's category */
function cpGen(h){const R=mkRng(hsh(h)),cat=GS.lead?GS.lead.cat:GE_OWNER.category,prods=ST_PRODUCTS.filter(p=>p.cat===(cat==='fnb'||cat==='beauty'?cat:'fashion')),
  name=h.split(/[._]/).filter(w=>w&&!/^(id|co|official|store|shop)$/.test(w)).map(w=>w[0].toUpperCase()+w.slice(1)).join(' ')||h,
  caps=[['promo','-15%','Diskon 15% minggu ini aja!','15% off, this week only!'],['new','Baru','Menu/produk baru sudah datang.','Something new just landed.'],['ugc','','Makasih sudah tag kami!','Thanks for tagging us!'],
    ['promo','-10%','Promo gajian 10%.','Payday promo: 10% off.'],['new','Baru','Varian baru, cobain yuk.','A new variant, come try it.'],['giveaway','Giveaway','Giveaway! Tag 2 teman.','Giveaway! Tag 2 friends.'],
    [null,'','Di balik layar hari ini.','Behind the scenes today.'],['ugc','','Review dari pelanggan.','A customer review.'],['promo','-20%','Flash sale 20% jam 8 malam.','20% flash sale at 8 pm.']],
  bgs=['#efe3d3','#e3ebe4','#ece4ef','#f3e6dc','#e5e9ef','#efe9dc'];
  return{name,cat,gen:true,followers:1500+Math.floor(R()*38000),bio:{id:'Akun contoh (data contoh)',en:'Example account (example data)'},
    posts:caps.map((c,i)=>[i*3+Math.floor(R()*3),c[0],prods[i%prods.length].id,bgs[i%bgs.length],c[1],c[2],c[3],18+Math.floor(R()*4),200+Math.floor(R()*2400)]),
    products:[],activity:[[-3,'promo','Mulai promo 15% minggu ini','Started a 15% promo this week'],[-6,'new','Produk baru di Instagram','A new product on Instagram']]}}
/* Facebook and Meta ads for an account we don't have in the fixtures (example data) */
function cpGenCh(h,f){const R=mkRng(hsh(h+'fb')),fl=Math.round(f.followers*(.3+R()*.5)),n=Math.floor(R()*4);
  return{fb:{followers:fl,posts30:6+Math.floor(R()*14),avg:Math.round(fl*(.004+R()*.01)),top:['Promo minggu ini','This week\'s promo',Math.round(fl*.03)]},
    ads:[...Array(n)].map((x,i)=>[2+Math.floor(R()*40),['image','video','carousel'][i%3],'Iklan '+(i+1),'Ad '+(i+1),i===0])}}
const cpFix=h=>CP_FIX[h]||cpGen(h);

/* What the rules read from the last 30 days of posts */
function cpStats(f){const ps=f.posts.filter(p=>p[0]<=30),promo=ps.filter(p=>p[1]==='promo'),disc=promo.map(p=>+(/-(\d+)%/.exec(p[4])||[])[1]).filter(Boolean),hrs={};
  ps.forEach(p=>{const k=Math.floor(p[7]/2)*2;hrs[k]=(hrs[k]||0)+1});const hk=+Object.keys(hrs).sort((a,b)=>hrs[b]-hrs[a])[0];
  const th={};ps.forEach(p=>{if(p[1])th[p[1]]=(th[p[1]]||0)+1});const top=Object.keys(th).sort((a,b)=>th[b]-th[a]).slice(0,2);
  return{n:Math.round(ps.length*30/Math.max(...ps.map(p=>p[0]),14)),promos:promo.length,disc:disc.length?[Math.min(...disc),Math.max(...disc)]:null,hours:`${String(hk).padStart(2,'0')}:00–${String(hk+2).padStart(2,'0')}:00`,themes:top}}

/* ===== Website check: fixtures for the fictional shops, live for a real one ===== */
function cpSite(c){const d=c.site;if(!d){c.siteSt='none';return Promise.resolve()}
  const fx=Object.values(CP_FIX).find(f=>f.site===d);
  if(fx||/\.example$/.test(d))return new Promise(r=>setTimeout(()=>{
    FLIK.apiLog.unshift(fx&&fx.platform==='flik'?{name:'store.products',method:'GET',path:'/v1/store/products',source:'example data (your FLIK store)'}:{name:'competitor.website',method:'GET',path:'https://'+d+(fx&&fx.platform==='woocommerce'?'/wp-json/wc/store/v1/products':'/products.json'),source:'example data (fictional shop)'});
    if(!fx){c.siteSt='down'}else if(fx.platform==='custom'){c.siteSt='unsupported'}else{c.siteSt='ok';c.platform=fx.platform;c.products=fx.products.map(p=>({n:p[0],p:p[1],c:p[2],stock:p[3],chg:p[4]}))}r()},800));
  /* a real shop: Shopify first, then WooCommerce; both are public endpoints with no key */
  c.siteSt='loading';
  const week=geNow().getTime()-7*DAY,shop=j=>{if(!j||!Array.isArray(j.products))throw new Error('not shopify');c.platform='shopify';
    c.products=j.products.slice(0,12).map(p=>{const v=(p.variants||[])[0]||{};return{n:p.title,p:Math.round(+v.price||0),c:Math.round(+v.compare_at_price||0),stock:p.variants?p.variants.some(x=>x.available!==false):true,chg:new Date(p.created_at)>week?'new':new Date(p.updated_at)>week?'price':''}})},
    woo=j=>{if(!Array.isArray(j))throw new Error('not woocommerce');c.platform='woocommerce';
    c.products=j.slice(0,12).map(p=>{const pr=p.prices||{},m=Math.pow(10,+pr.currency_minor_unit||0);return{n:String(p.name||'').replace(/<[^>]+>/g,''),p:Math.round(+pr.price/m||0),c:pr.regular_price&&pr.regular_price!==pr.price?Math.round(+pr.regular_price/m):0,stock:p.is_in_stock!==false,chg:p.on_sale?'price':''}})};
  return geFetchJson('competitor.website.shopify','https://'+d+'/products.json?limit=12').then(shop)
    .catch(()=>geFetchJson('competitor.website.woocommerce','https://'+d+'/wp-json/wc/store/v1/products?per_page=12').then(woo))
    .then(()=>{c.siteSt='ok';c.live=true})
    .catch(()=>{c.siteSt='browser'})}

function cpMake(h,site){const f=cpFix(h);return{h,f,site:site===undefined?(f.site||''):site,siteSt:'none',products:[],platform:null,live:false,added:geNow()}}
const cpRe=()=>{if(['#marketing/growth/competitors','#marketing/growth'].includes(location.hash))show()};
function cpInit(){if(CP.acct===GS.account)return;CP.acct=GS.account;CP.snap=null;CP.ch='ig';CP.classified={};
  CP.me=geMerchant()?cpMake('aruna.studio'):null;
  CP.tracked=GS.account==='new'?[cpMake('kain.kita.id')]:geMerchant()?[cpMake('kain.kita.id'),cpMake('lunaloom.co')]:[];
  [CP.me,...CP.tracked].filter(Boolean).forEach(c=>{c.added=new Date(NOW-20*DAY);cpSite(c).then(cpRe)});
  CP.sel=CP.tracked[0]?CP.tracked[0].h:null}
const cpActs=c=>c.f.private?[]:c.f.activity.map((a,i)=>({i,d:a[0],kind:a[1],t:{id:a[2],en:a[3]},at:cpDay(a[0])})).filter(a=>a.d<=GS.dayOffset).sort((a,b)=>b.d-a.d);
const cpNew=a=>a.d>GS.dayOffset-7;
const cpN=(n,d=0)=>n==null?'—':(+n).toLocaleString(geLang()==='id'?'id-ID':'en-US',{maximumFractionDigits:d,minimumFractionDigits:d});
const cpPct=n=>n==null?'—':cpN(n,1)+'%';

/* ===== Channel metrics: what a marketing analytics page would show, per channel ===== */
const CP_CHS=[['ig','studio'],['fb','person'],['ads','sparkle'],['web','store']];
function cpMetrics(c){if(c._m&&c._m.k===GS.dayOffset+c.siteSt)return c._m;const f=c.f,x=CP_CH[c.h]||(c._ch=c._ch||cpGenCh(c.h,f));
  const ps=f.posts.filter(p=>p[0]<=30),s=cpStats(f),er=p=>p[8]/f.followers*100,top=ps.slice().sort((a,b)=>b[8]-a[8]),pr=c.products||[];
  const m={k:GS.dayOffset+c.siteSt,
    ig:{followers:f.followers,posts:s.n,er:ps.length?ps.reduce((a,p)=>a+er(p),0)/ps.length:0,top:top[0]?er(top[0]):0,topPost:top[0],tops:top.slice(0,3),times:s.hours,promo:ps.length?Math.round(ps.filter(p=>p[1]==='promo').length/ps.length*100):0,disc:s.disc,themes:s.themes},
    fb:{followers:x.fb.followers,posts:x.fb.posts30,er:x.fb.avg/x.fb.followers*100,top:x.fb.top[2],topText:{id:x.fb.top[0],en:x.fb.top[1]}},
    ads:{n:x.ads.length,fresh:x.ads.filter(a=>a[4]).length,longest:x.ads.length?Math.max(...x.ads.map(a=>a[0])):0,formats:[...new Set(x.ads.map(a=>a[1]))],list:x.ads},
    web:c.siteSt==='ok'?{n:pr.length,chg:pr.filter(p=>p.chg==='price').length,disc:pr.filter(p=>p.c>p.p).length,fresh:pr.filter(p=>p.chg==='new').length,avg:pr.length?pr.reduce((a,p)=>a+p.p,0)/pr.length:0}:null};
  c._m=m;return m}
/* the rows of each channel's summary table: [label key, value(m), shown as, higher is better] */
const CP_ROWS={
  ig:[['m.followers',m=>m.ig.followers,cpN,1],['m.posts',m=>m.ig.posts,cpN,1],['m.er',m=>m.ig.er,cpPct,1],['m.top',m=>m.ig.top,cpPct,1],['m.times',m=>m.ig.times,v=>v,0],['m.promo',m=>m.ig.promo,v=>v+'%',0]],
  fb:[['m.followers',m=>m.fb.followers,cpN,1],['m.posts',m=>m.fb.posts,cpN,1],['m.er',m=>m.fb.er,cpPct,1],['m.fbtop',m=>m.fb.top,cpN,1]],
  ads:[['m.ads',m=>m.ads.n,cpN,1],['m.adsnew',m=>m.ads.fresh,cpN,1],['m.longest',m=>m.ads.n?m.ads.longest:null,v=>v==null?'—':geT('m.days',{n:v}),1],['m.formats',m=>m.ads.formats.map(k=>geT('fmt.'+k)).join(', ')||'—',v=>v,0]],
  web:[['m.products',m=>m.web&&m.web.n,cpN,1],['m.chg',m=>m.web&&m.web.chg,cpN,0],['m.disc',m=>m.web&&m.web.disc,cpN,0],['m.fresh',m=>m.web&&m.web.fresh,cpN,1],['m.avg',m=>m.web&&m.web.avg,v=>v==null?'—':geJt(v),0]]};

/* the gap line under each channel: you vs the competitors' average, in plain words */
function cpGap(ch,me,cs){const ms=cs.map(cpMetrics),M=cpMetrics(me),avg=f=>{const v=ms.map(f).filter(x=>x!=null);return v.length?v.reduce((a,b)=>a+b,0)/v.length:null};
  if(!cs.length)return'';
  if(ch==='ig'){const p=avg(m=>m.ig.posts),e=avg(m=>m.ig.er);return geT('gap.ig',{me:cpN(M.ig.posts),them:cpN(p),mer:cpPct(M.ig.er),ter:cpPct(e)})+(M.ig.er>=e?' '+geT('gap.ig.good'):'')}
  if(ch==='fb'){const p=avg(m=>m.fb.posts),e=avg(m=>m.fb.er);return geT('gap.fb',{me:cpN(M.fb.posts),them:cpN(p),mer:cpPct(M.fb.er),ter:cpPct(e)})}
  if(ch==='ads'){const n=avg(m=>m.ads.n),fr=ms.reduce((a,m)=>a+m.ads.fresh,0);return geT('gap.ads',{me:M.ads.n,them:cpN(n,1),fresh:fr})}
  if(ch==='web'){if(!M.web)return geT('gap.web.none');const a=avg(m=>m.web&&m.web.avg),d=ms.reduce((x,m)=>x+(m.web?m.web.disc:0),0);
    if(a==null)return geT('gap.web.wait');const pct=Math.round((M.web.avg/a-1)*100);return geT(pct>0?'gap.web.up':'gap.web.down',{me:geJt(M.web.avg),them:geJt(a),p:Math.abs(pct),d})}}

/* ===== Action plan: rules pick from the fixed categories (GE_ACTIONS); nothing outside the list is ever suggested ===== */
function cpPlan(c){if(c.f.private)return[];const m=cpMetrics(c),me=CP.me?cpMetrics(CP.me):null,n=c.f.name,out=[],L=geLang(),acts=cpActs(c).filter(cpNew),add=(k,why,pre)=>{if(!out.some(o=>o.k===k))out.push({k,why,pre})};
  const disc=m.ig.disc,promoNow=acts.some(a=>a.kind==='promo')||m.ig.promo>=25,big=geBigDates(GE_HOL_CACHE).find(d=>d.kind==='shop'&&d.at-geNow()<35*DAY&&d.at>geNow());
  if(promoNow){const d=disc?disc[1]:15;
    add('answer_promo',geT('pl.answer',{n,d,p:m.ig.promo}),{type:'voucher',segs:['repeat','risk'],voucher:{kind:'amt',v:30000,max:30000,min:300000,days:7,quota:120},tpl:'promo_discount',name:geT('pl.answer.name',{n})});
    if(d>=15)add('protect_price',geT('pl.protect',{n,d}),{type:'cashback',segs:['new','repeat'],cb:{v:20000,min:150000,days:14,quota:150},tpl:'promo_discount',name:geT('pl.protect.name')})}
  if(big&&promoNow)add('early_access',geT('pl.early',{n,d:esc(geL(big.n)),k:Math.ceil((big.at-geNow())/DAY)}),{type:'voucher',segs:['vip','repeat'],voucher:{kind:'pct',v:10,max:10000,min:150000,days:Math.max(3,Math.ceil((big.at-geNow())/DAY)),quota:300},tpl:'vip_early_access',name:geT('pl.early.name',{d:geL(big.n)})});
  if(m.web&&m.web.fresh||acts.some(a=>a.kind==='new')){add('new_arrival_wa',geT('pl.arrival',{n}),{type:'voucher',segs:['vip','repeat'],voucher:{kind:'pct',v:5,max:15000,min:100000,days:7,quota:200},tpl:'new_arrival',name:geT('pl.arrival.name')});
    add('new_product_post',geT('pl.newpost',{n}),{ch:'feed',fmt:'carousel'})}
  if(me&&m.ig.er>me.ig.er*1.15&&m.ig.topPost){const t=m.ig.topPost;add('match_content',geT('pl.match',{n,er:cpPct(m.ig.top),type:t[1]?geT('cp.type.'+t[1]).toLowerCase():geT('pl.post')}),{ch:'feed',fmt:'carousel'})}
  if(me&&m.ads.n>=2&&m.ads.n>me.ads.n){add('ad_creative',geT('pl.ads',{n,a:m.ads.n,f:m.ads.fresh}),{ch:'story',fmt:'still'});add('ad_spend',geT('pl.adspend',{n,a:m.ads.n,me:me.ads.n}))}
  if(me&&m.ig.posts>me.ig.posts*1.4)add('posting_time',geT('pl.time',{n,a:cpN(m.ig.posts),me:cpN(me.ig.posts),t:m.ig.times}),{ch:'feed',fmt:'still'});
  if(me&&m.web&&me.web&&m.web.avg<me.web.avg*.9)add('price_gap',geT('pl.price',{n,them:geJt(m.web.avg),me:geJt(me.web.avg),p:Math.round((1-m.web.avg/me.web.avg)*100)}));
  if(me&&m.web&&CP.me.products.length){const mine=new Set(CP.me.products.map(p=>p.n.toLowerCase().split(/[ ·]/)[0])),miss=[...new Set(c.products.map(p=>p.n.split(/[ ·]/)[0]).filter(w=>w&&!mine.has(w.toLowerCase())))].slice(0,3);
    if(miss.length)add('range_gap',geT('pl.range',{n,list:miss.join(', ')}))}
  if(promoNow&&geSegN('lapsed')>0)add('win_back',geT('pl.win',{n,k:cpN(geSegN('lapsed'))}),{type:'voucher',segs:['lapsed','risk'],voucher:{kind:'pct',v:15,max:25000,min:150000,days:10,quota:200},tpl:'win_back',name:geT('pl.win.name')});
  const ord={campaign:0,content:1,tip:2};return out.sort((a,b)=>ord[GE_ACTIONS[a.k].kind]-ord[GE_ACTIONS[b.k].kind]).slice(0,6)}
function cpPlanHtml(c){const pl=cpPlan(c);
  return`<section class="card cp-plan"><div class="sec-h"><div><h3 class="sec">${geT('pl.h')}</h3><p class="sec-sub">${geT('pl.sub',{n:esc(c.f.name)})}</p></div></div>
  ${pl.length?`<div class="cp-pl">${pl.map((a,i)=>{const A=GE_ACTIONS[a.k];return`<div class="cp-pi cp-pi-${A.kind}"><span class="cp-pk">${geT('pl.kind.'+A.kind)}</span><div><b>${esc(geL(A.n))}</b><p>${esc(a.why)}</p></div>
    ${A.kind==='tip'?`<span class="cp-tip">${ic('info',13)}${geT('pl.tip')}</span>`:`<button class="btn ${A.kind==='campaign'?'btn-p':'btn-o'}" data-cpgo="${esc(c.h)}|${i}">${ic(A.kind==='campaign'?'rocket':'studio',14)}${geT(A.kind==='campaign'?'pl.go.camp':'pl.go.content')}</button>`}</div>`}).join('')}</div>`:`<p class="d-sub">${geT('pl.none')}</p>`}
  <p class="d-sub cp-plnote">${ic('info',13)}${geT('pl.note',{n:Object.keys(GE_ACTIONS).length})}</p></section>`}
function cpPlanGo(h,i){const c=CP.tracked.find(x=>x.h===h);if(!c)return;const a=cpPlan(c)[i];if(!a)return;const A=GE_ACTIONS[a.k];track('action_plan_used',{action:a.k,kind:A.kind});
  if(A.kind==='campaign'){GS.cj=null;GS.campPre={...JSON.parse(JSON.stringify(a.pre)),from:{cmp:c.h,name:c.f.name,act:a.k}};go('marketing/growth/campaigns/new')}
  else{GS.cr=null;GS.studioPre={...a.pre,from:{cmp:c.h,name:c.f.name,act:a.k}};go('marketing/growth/studio/new')}}

/* ===== My Brand ===== */
function renderBrand(){cpInit();if(geMerchant())geInit();const el=document.getElementById('view-brd');
  if(GS.account==='lead'){el.innerHTML=geTabs('brd')+geLocked('brd');return}
  const me=CP.me,m=cpMetrics(me),cs=CP.tracked.filter(c=>!c.f.private),avg=f=>{const v=cs.map(c=>f(cpMetrics(c))).filter(x=>x!=null);return v.length?v.reduce((a,b)=>a+b,0)/v.length:null};
  const vs=(v,a,fmt)=>a==null||v==null?'':`<small class="${v>=a?'ge-pos':'ge-neg'}">${geT('b.vs',{v:fmt(a)})}</small>`;
  const card=(ch,rows,extra='')=>`<section class="card b-ch"><div class="b-chh">${ic(CP_CHS.find(x=>x[0]===ch)[1],16)}<b>${geT('ch.'+ch)}</b><span>${esc(ch==='web'?me.site:ch==='ads'?geT('b.adlib'):'@'+me.h)}</span></div>
    <div class="b-ms">${rows.map(([k,v,s])=>`<div><span>${geT(k)}</span><b>${v}</b>${s||''}</div>`).join('')}</div>${extra}</section>`;
  const t=m.ig.topPost,sc=GE_SCALE[GS.account]||1,pulse=GE_PULSE[GS.account]||GE_PULSE.active,o30=Math.round(pulse.orders*4.3),on=GE_SEG.filter(s=>s.k!=='checkout').reduce((a,s)=>a+geSegN(s.k,'on'),0),off=GE_SEG.filter(s=>s.k!=='checkout').reduce((a,s)=>a+geSegN(s.k,'off'),0);
  const top=(me.products||[]).map(p=>({...p,u:Math.round((hsh(p.n)%55+12)*Math.max(sc,.12))})).sort((a,b)=>b.u-a.u).slice(0,5);
  el.innerHTML=`${geTabs('brd',`<button class="btn btn-o" data-bedit>${ic('gear',15)}${geT('b.edit')}</button>`)}
  <div class="sec-h"><div><h2 class="sec">${geT('b.socials')}</h2><p class="sec-sub">${geT('b.socials.sub')}</p></div></div>
  <div class="b-grid">
    ${card('ig',[['m.followers',cpN(m.ig.followers),vs(m.ig.followers,avg(x=>x.ig.followers),cpN)],['m.posts',cpN(m.ig.posts),vs(m.ig.posts,avg(x=>x.ig.posts),cpN)],['m.er',cpPct(m.ig.er),vs(m.ig.er,avg(x=>x.ig.er),cpPct)],['m.times',m.ig.times]],
      t?`<div class="b-top"><div class="cp-img" style="background:${t[3]}"><img src="${stThumbSrc(stProd(t[2]))}" alt=""></div><div><span>${geT('m.top')}</span><b>${esc(geL({id:t[5],en:t[6]}))}</b><small>♥ ${cpN(t[8])} · ${cpPct(m.ig.top)}</small></div></div>`:'')}
    ${card('fb',[['m.followers',cpN(m.fb.followers),vs(m.fb.followers,avg(x=>x.fb.followers),cpN)],['m.posts',cpN(m.fb.posts),vs(m.fb.posts,avg(x=>x.fb.posts),cpN)],['m.er',cpPct(m.fb.er),vs(m.fb.er,avg(x=>x.fb.er),cpPct)],['m.fbtop',cpN(m.fb.top)]],`<p class="d-sub">${esc(geL(m.fb.topText))}</p>`)}
    ${card('ads',[['m.ads',cpN(m.ads.n),vs(m.ads.n,avg(x=>x.ads.n),v=>cpN(v,1))],['m.adsnew',cpN(m.ads.fresh)],['m.longest',m.ads.n?geT('m.days',{n:m.ads.longest}):'—'],['m.formats',m.ads.formats.map(k=>geT('fmt.'+k)).join(', ')||'—']])}
    ${card('web',m.web?[['m.products',cpN(m.web.n)],['m.disc',cpN(m.web.disc)],['m.fresh',cpN(m.web.fresh)],['m.avg',geJt(m.web.avg),vs(-m.web.avg,avg(x=>x.web&&-x.web.avg),v=>geJt(-v))]]:[['m.products',me.siteSt==='loading'?'…':'—']])}
  </div>
  <p class="g-note">${ic('info',14)}${geT('b.how')}</p>
  <div class="sec-h"><div><h2 class="sec">${geT('b.store')}</h2><p class="sec-sub">${geT('b.store.sub')}</p></div><a class="btn btn-o" href="#marketing/growth/campaigns">${geT('b.store.go')}</a></div>
  <div class="g-pulse">${[[geT('b.k.sales'),geJt(o30*GE_AOV),geT('b.k.30')],[geT('b.k.orders'),cpN(o30),geT('b.k.30')],[geT('b.k.aov'),geJt(GE_AOV),geT('b.k.30')],
      [geT('g.p.repeat'),pulse.repeat==null?'—':cpPct(pulse.repeat),pulse.repeat==null?geT('g.p.learn'):geT('g.p.peers',{n:String(pulse.peers).replace('.',geLang()==='id'?',':'.')})],
      [geT('b.k.shoppers'),cpN(on+off),geT('b.k.split',{on:cpN(on),off:cpN(off)})]].map(([k,v,s])=>`<section class="card"><span>${k}</span><b>${v}</b><small>${s}</small></section>`).join('')}</div>
  <div class="g-two">
    <section class="card"><h4>${geT('b.top')}</h4>${top.length?`<table class="cp-tbl"><thead><tr><th>${geT('cp.p.name')}</th><th class="r">${geT('cp.p.price')}</th><th class="r">${geT('b.sold')}</th></tr></thead><tbody>${top.map(p=>`<tr><td>${esc(p.n)}</td><td class="r">${rp(p.p)}</td><td class="r"><b>${cpN(p.u)}</b></td></tr>`).join('')}</tbody></table>`:`<p class="d-sub">${geT('cp.site.loading')}</p>`}</section>
    <section class="card"><h4>${geT('b.segs')}</h4><table class="cp-tbl"><tbody>${GE_SEG.map(s=>`<tr><td><b>${esc(geL(s.n))}</b><small>${esc(geL(s.rule))}</small></td><td class="r">${cpN(geSegN(s.k))}</td><td class="r"><button class="btn btn-o" data-bseg="${s.k}">${geT('b.seg.go')}</button></td></tr>`).join('')}</tbody></table>
      <p class="d-sub">${geT('g.seg.priv')}</p></section></div>`;
  el.onclick=e=>{const b=e.target.closest('button');if(!b)return;
    if('bedit' in b.dataset)cpBrandSheet();
    if(b.dataset.bseg){GS.cj=null;GS.campPre={segs:[b.dataset.bseg],from:{seg:b.dataset.bseg}};go('marketing/growth/campaigns/new')}}}
/* My Brand uses the same method as a competitor: type the handles once (connecting the accounts comes later) */
function cpBrandSheet(){const me=CP.me;modal.classList.add('nw');
  modal.innerHTML=`<div class="mh"><h3>${geT('b.edit')}</h3><button class="ib" data-mclose aria-label="Close">${ic('x',18)}</button></div>
  <form class="mb" id="b-f"><p class="vf-lead">${geT('b.edit.sub')}</p>
    <div class="fld"><label for="b-ig">Instagram</label><div class="cp-in"><span>@</span><input id="b-ig" value="${esc(me.h)}" autocomplete="off"></div></div>
    <div class="fld"><label for="b-fb">${geT('b.fbpage')}</label><input id="b-fb" value="facebook.com/${esc(me.h)}" autocomplete="off"></div>
    <div class="fld"><label for="b-web">${geT('b.site')}</label><input id="b-web" value="${esc(me.site)}" autocomplete="off"></div>
    <p class="d-sub">${geT('b.edit.note')}</p><p class="cp-err" id="b-err" hidden></p></form>
  <div class="mf"><button class="btn btn-o" data-mclose>${geT('pay.cancel')}</button><button class="btn btn-p" id="b-ok">${geT('b.save')}</button></div>`;mscrim.classList.add('open');
  const ok=()=>{const h=cpHandle(document.getElementById('b-ig').value),sv=document.getElementById('b-web').value.trim(),d=sv?cpDomain(sv):'',err=document.getElementById('b-err');
    if(!h){err.textContent=geT('cp.bad');err.hidden=false;return}if(sv&&!d){err.textContent=geT('cp.site.bad');err.hidden=false;return}
    closeModal();CP.me=cpMake(h,d);if(CP_FIX[h]&&CP_FIX[h].own)CP.me.f=CP_FIX[h];track('my_brand_updated',{});cpSite(CP.me).then(cpRe);show()};
  document.getElementById('b-ok').onclick=ok;document.getElementById('b-f').onsubmit=e=>{e.preventDefault();ok()}}

/* ===== Competitor page ===== */
function renderCompete(){cpInit();if(geMerchant())geInit();const el=document.getElementById('view-cmp'),lead=GS.account==='lead';
  el.innerHTML=`${geTabs('cmp',lead?'':`<button class="btn btn-p" data-cpadd ${CP.tracked.length>=limitCap('competitors')?'disabled':''}>${ic('plus',15)}${geT('cp.add')}</button>`)}
  ${lead?cpLeadHtml():cpMerchantHtml()}`;
  el.onclick=cpClick;el.onsubmit=e=>{e.preventDefault();if(e.target.id==='cp-lead-f')cpLeadGo()};
  if(!lead)cpClassify()}

/* ----- lead: one look at one competitor on Instagram ----- */
function cpLeadHtml(){
  if(CP.busy)return`<section class="card cp-load"><span class="ai-dots"><i></i><i></i><i></i></span>${geT('cp.loading')}</section>`;
  if(!CP.snap)return`<p class="sec-sub">${geT('cmp.lead.sub')}</p><section class="card cp-lead"><form id="cp-lead-f"><div class="fld"><label for="cp-h">${geT('cp.ig')}</label>
      <div class="cp-in"><span>@</span><input id="cp-h" placeholder="kain.kita.id" autocomplete="off" value="${esc(CP.draft||'')}"><button class="btn btn-p" type="submit">${geT('cp.look')}</button></div></div>
      <p class="cp-err" id="cp-err" ${CP.err?'':'hidden'}>${CP.err||''}</p>
      <p class="d-sub">${geT('cp.lead.only')}</p>
      <div class="cp-try">${geT('cp.try')} ${['kain.kita.id','lunaloom.co','private.label'].map(h=>`<button type="button" class="chip" data-cptry="${h}">@${h}</button>`).join('')}</div></form></section>
    ${cpUpsell()}`;
  const c=CP.snap;return`<p class="cp-once">${ic('clock',14)}${geT('cp.once',{date:geFdate(c.added)})}</p>${cpProfile(c,true)}${cpPosts(c,true)}${cpUpsell()}`}
function cpUpsell(){return`<section class="card st-cta st-up cp-up"><span class="qic">${ic('rocket',20,1.6)}</span><div><b>${geT('cp.up.h')}</b><span>${geT('cp.up.sub')}</span></div><button class="btn btn-p" data-cpup>${geT('gro.lead.cta')}</button></section>`}
function cpLeadGo(){const raw=document.getElementById('cp-h').value,h=cpHandle(raw);CP.draft=raw;CP.err='';
  if(CP_MARKET.test(cpDomain(raw)+'.')||CP_MARKET.test(raw)){CP.err=geT('cp.market');renderCompete();return}
  if(!h){CP.err=geT('cp.bad');renderCompete();return}
  CP.busy=true;renderCompete();FLIK.apiLog.unshift({name:'instagram.businessDiscovery',method:'GET',path:'/v1/competitors/instagram/'+h,source:'example data (Instagram needs a partner account)'});
  setTimeout(()=>{CP.busy=false;const c=cpMake(h,'');
    if(c.f.private){CP.err=geT('cp.private');renderCompete();return}
    const l=useLimit('competitors');if(!l.ok){CP.err=l.message;renderCompete();return}
    CP.snap=c;track('competitor_added',{source:'instagram',account:'lead'});track('competitor_snapshot_viewed',{});renderCompete()},800)}

/* ----- merchant: summary (My brand vs A vs B vs C), then one competitor in detail ----- */
function cpMerchantHtml(){const cap=limitCap('competitors'),cs=CP.tracked,c=cs.find(x=>x.h===CP.sel)||cs[0];
  const chips=`<div class="cp-list">${cs.map((x,i)=>{const n=cpActs(x).filter(cpNew).length;
      return`<span class="cp-chip${x===c?' on':''}"><button class="cp-cs" data-cpsel="${esc(x.h)}" aria-pressed="${x===c}"><span class="cp-av">${String.fromCharCode(65+i)}</span><span><b>${esc(x.f.name)}</b><small>@${esc(x.h)}</small></span>${n?`<span class="ge-n">${n}</span>`:''}</button><button class="cp-rm" data-cprm="${esc(x.h)}" aria-label="${geT('cp.remove')} ${esc(x.f.name)}" title="${geT('cp.remove')}">${ic('x',13)}</button></span>`}).join('')}
      ${cs.length<cap?`<button class="cp-chip cp-addc" data-cpadd>${ic('plus',15)}${geT('cp.add')}</button>`:''}</div>`;
  if(!cs.length)return`<p class="cp-ref">${ic('repeat',14)}${geT('cp.slots',{n:0,cap})}</p><section class="card w-empty"><span class="qic">${ic('eye',22,1.6)}</span><div><b>${geT('cp.empty.h')}</b><span>${geT('cp.empty.sub',{n:cap})}</span></div><button class="btn btn-p" data-cpadd>${geT('cp.add')}</button></section>`;
  return`<p class="cp-ref">${ic('repeat',14)}${geT('cp.ref',{date:geFdate(cpRefreshed())})} · ${geT('cp.slots',{n:cs.length,cap})}</p>
  ${chips}
  <div class="sec-h"><div><h2 class="sec">${geT('cs.h')}</h2><p class="sec-sub">${geT('cs.sub')}</p></div></div>
  ${cpSummary()}
  <div class="sec-h"><div><h2 class="sec">${geT('cd.h',{n:esc(c.f.name)})}</h2><p class="sec-sub">${geT('cd.sub')}</p></div></div>
  ${cpPanel(c)}`}
function cpSummary(){const me=CP.me,cs=CP.tracked.filter(c=>!c.f.private),cols=[me,...cs],ms=cols.map(cpMetrics);
  return`<div class="cs-grid">${CP_CHS.map(([ch,i])=>`<section class="card cs-ch"><div class="b-chh">${ic(i,16)}<b>${geT('ch.'+ch)}</b></div>
    <div class="tbl-wrap"><table class="cp-tbl cs-tbl"><thead><tr><th></th>${cols.map((c,k)=>`<th class="r">${k?`<span class="cp-av sm">${String.fromCharCode(64+CP.tracked.indexOf(c)+1)}</span>`:''}${esc(k?c.f.name:geT('cs.me'))}</th>`).join('')}</tr></thead>
    <tbody>${CP_ROWS[ch].map(([k,f,fmt,hi])=>{const v=ms.map(f),nums=v.filter(x=>typeof x==='number'),best=hi&&nums.length>1?Math.max(...nums):null;
      return`<tr><th>${geT(k)}</th>${v.map((x,j)=>`<td class="r${best!=null&&x===best?' cs-best':''}${j===0?' cs-me':''}">${fmt(x)}</td>`).join('')}</tr>`}).join('')}</tbody></table></div>
    <p class="cs-gap">${ic('chart',13)}${esc(cpGap(ch,me,cs))}</p></section>`).join('')}</div>`}
function cpPanel(c){if(c.f.private)return`<section class="card cp-state">${ic('lock',22,1.6)}<div><b>${geT('cp.private.h')}</b><span>${geT('cp.private')}</span></div><button class="btn btn-o" data-cprm="${esc(c.h)}">${geT('cp.remove')}</button></section>`;
  const m=cpMetrics(c),acts=cpActs(c);
  return`${cpProfile(c,false)}
  <div class="cd-two"><section class="card cd-did"><h3 class="sec">${geT('cd.did')}</h3><div class="tl cp-tl">${acts.slice(0,5).map(a=>`<div class="tli${cpNew(a)?' pu':''}"><i>${ic(a.kind==='price'?'tag':a.kind==='new'?'plus':a.kind==='promo'?'sparkle':'studio',10,2)}</i><div><b>${esc(geL(a.t))}${cpNew(a)?` <span class="st pu sm">${geT('cp.new')}</span>`:''}</b><span>${cpShort(a.at)} · ${geT('cp.kind.'+a.kind)}</span></div></div>`).join('')||`<p class="d-sub">${geT('cp.act.none')}</p>`}</div><p class="d-sub">${geT('cp.act.next')}</p></section>
  ${cpPlanHtml(c)}</div>
  <div class="tabs" role="tablist">${CP_CHS.map(([k,i])=>`<button class="tab${CP.ch===k?' on':''}" data-cpch="${k}" role="tab" aria-selected="${CP.ch===k}">${ic(i,14)}${geT('ch.'+k)}${k==='ads'&&m.ads.fresh?`<span class="ct">${m.ads.fresh}</span>`:''}</button>`).join('')}</div>
  ${cpChDetail(c,CP.ch)}`}
function cpMRow(rows){return`<div class="cd-ms">${rows.map(([k,v])=>`<div><span>${geT(k)}</span><b>${v}</b></div>`).join('')}</div>`}
function cpChDetail(c,ch){const m=cpMetrics(c);
  if(ch==='ig')return`<section class="card">${cpMRow(CP_ROWS.ig.map(([k,f,fmt])=>[k,fmt(f(m))]))}
    <h4>${geT('cd.tops')}</h4><div class="cp-grid cp-tops">${m.ig.tops.map(p=>cpPostFig(c,p,c.f.posts.indexOf(p),false)).join('')}</div>
    <h4>${geT('cd.recent')}</h4>${cpPosts(c,false)}<p class="d-sub">${geT('cd.src.ig')}</p></section>`;
  if(ch==='fb')return`<section class="card">${cpMRow(CP_ROWS.fb.map(([k,f,fmt])=>[k,fmt(f(m))]))}<div class="cd-q"><span>${geT('m.fbtop')}</span><b>“${esc(geL(m.fb.topText))}”</b><small>${geT('cd.reacts',{n:cpN(m.fb.top)})}</small></div><p class="d-sub">${geT('cd.src.fb')}</p></section>`;
  if(ch==='ads')return`<section class="card">${cpMRow(CP_ROWS.ads.map(([k,f,fmt])=>[k,fmt(f(m))]))}
    ${m.ads.list.length?`<div class="cd-ads">${m.ads.list.slice().sort((a,b)=>a[0]-b[0]).map(a=>`<div class="cd-ad"><span class="cp-k">${geT('fmt.'+a[1])}</span><b>${esc(geL({id:a[2],en:a[3]}))}</b><small>${geT('cd.ad.run',{n:a[0]})}${a[4]?` · <span class="st pu sm">${geT('cp.new')}</span>`:''}</small></div>`).join('')}</div>`:`<p class="d-sub">${geT('cd.ads.none')}</p>`}
    <p class="d-sub">${geT('cd.src.ads')}</p></section>`;
  return`${m.web?cpMRow(CP_ROWS.web.map(([k,f,fmt])=>[k,fmt(f(m))])).replace('cd-ms','cd-ms card'):''}${cpProducts(c)}`}
function cpProfile(c,lead){const f=c.f,s=cpStats(f);
  return`<section class="card cp-prof"><div class="cp-ph"><span class="cp-av lg">${esc(f.name[0])}</span><div><b>${esc(f.name)}</b><span>@${esc(c.h)} · ${geT('cp.followers',{n:f.followers.toLocaleString(geLang()==='id'?'id-ID':'en-US')})} · ${geT('cp.posts30',{n:s.n})}</span><small>${esc(geL(f.bio))}${f.gen?' · '+geT('cp.gen'):''}</small></div>
    ${lead?'':`<div class="cp-src"><span class="st gr sm">${ic('studio',12)}Instagram</span><span class="st gr sm">Facebook</span><span class="st gr sm">Meta ads</span>${c.site?`<span class="st ${c.siteSt==='ok'?'ok':c.siteSt==='loading'?'gr':'warn'} sm">${esc(c.site)}${c.platform?' · '+(c.platform==='shopify'?'Shopify':'WooCommerce'):''}${c.live?' · '+geT('cp.live'):''}</span>`:''}<button class="lnk" data-cprm="${esc(c.h)}">${geT('cp.remove')}</button></div>`}</div>
    <div class="cp-det"><div><span>${geT('cp.d.promos')}</span><b>${s.promos?geT('cp.d.promos.v',{n:s.promos,r:s.disc?s.disc[0]===s.disc[1]?s.disc[0]+'%':s.disc[0]+'–'+s.disc[1]+'%':''}):geT('cp.d.none')}</b></div>
      <div><span>${geT('cp.d.times')}</span><b>${s.hours}</b></div><div><span>${geT('cp.d.themes')}</span><b>${s.themes.map(t=>geT('cp.type.'+t)).join(', ')||'—'}</b></div></div></section>`}
function cpPostFig(c,p,i,lead){const cl=CP.classified[c.h]||{},ty=p[1]||cl[i],ai=!p[1]&&cl[i];
  return`<figure class="cp-post"><div class="cp-img" style="background:${p[3]}"><img src="${stThumbSrc(stProd(p[2]))}" alt="${esc(geL({id:p[5],en:p[6]}))}">${p[4]?`<span class="cp-tag">${esc(p[4])}</span>`:''}</div>
    <figcaption>${ty?`<span class="cp-k cp-k-${ty}">${geT('cp.type.'+ty)}</span>${ai?aiTag():''}`:lead?'':`<span class="cp-k">${geT('cp.reading')}</span>`}<p>${esc(geL({id:p[5],en:p[6]}))}</p><small>${cpShort(cpDay(-p[0]))} · ${String(p[7]).padStart(2,'0')}:00 · ♥ ${p[8].toLocaleString()} · ${cpPct(p[8]/c.f.followers*100)}</small></figcaption></figure>`}
function cpPosts(c,lead){return`<div class="cp-grid">${c.f.posts.slice(0,9).map((p,i)=>cpPostFig(c,p,i,lead)).join('')}</div>`}
/* a post with no rule match goes to the AI fallback once, and is tagged AI */
function cpClassify(){CP.tracked.forEach(c=>{if(c.f.private||CP.classified[c.h])return;CP.classified[c.h]={};
  c.f.posts.slice(0,9).forEach((p,i)=>{if(p[1])return;mockLLM('classify',{caption:p[6]}).then(r=>{if(r.ai){CP.classified[c.h][i]=r.type;if(location.hash==='#marketing/growth/competitors'&&CP.sel===c.h&&CP.ch==='ig')renderCompete()}})})})}
function cpProducts(c){const st=c.siteSt;
  if(st==='loading')return`<section class="card cp-load"><span class="ai-dots"><i></i><i></i><i></i></span>${geT('cp.site.loading')}</section>`;
  if(st!=='ok'){const k={none:'none',unsupported:'unsup',down:'down',browser:'browser'}[st]||'none';
    return`<section class="card cp-state">${ic(k==='none'?'plus':'info',22,1.6)}<div><b>${geT('cp.site.'+k+'.h')}</b><span>${geT('cp.site.'+k,{site:esc(c.site)})}</span></div>${k==='none'?`<button class="btn btn-o" data-cpsite="${esc(c.h)}">${geT('cp.site.add')}</button>`:''}</section>`}
  return`<section class="card"><div class="tbl-wrap"><table class="cp-tbl"><thead><tr><th>${geT('cp.p.name')}</th><th class="r">${geT('cp.p.price')}</th><th class="r">${geT('cp.p.was')}</th><th>${geT('cp.p.stock')}</th><th>${geT('cp.p.week')}</th></tr></thead>
    <tbody>${c.products.map(p=>`<tr><td>${esc(p.n)}</td><td class="r">${rp(p.p)}</td><td class="r">${p.c?`<s>${rp(p.c)}</s> <span class="cp-off">−${Math.round((1-p.p/p.c)*100)}%</span>`:'—'}</td><td>${p.stock?`<span class="st ok sm">${geT('cp.p.in')}</span>`:`<span class="st gr sm">${geT('cp.p.out')}</span>`}</td><td>${p.chg?`<span class="cp-k cp-k-${p.chg==='new'?'new':'price'}">${geT(p.chg==='new'?'cp.p.new':'cp.p.chg')}</span>`:''}</td></tr>`).join('')}</tbody></table></div>
    <p class="d-sub">${c.live?geT('cp.p.live',{site:esc(c.site)}):geT('cp.p.fix')}</p></section>`}

/* ----- add a competitor (up to the configurable limit) ----- */
function cpAddSheet(pre={}){const cap=limitCap('competitors');
  if(!pre.h&&CP.tracked.length>=cap){toast(geT('limit.competitors'));track('limit_reached',{limit:'competitors',account:GS.account});return}
  modal.classList.add('nw');
  modal.innerHTML=`<div class="mh"><h3>${pre.h?geT('cp.site.add'):geT('cp.add')}</h3><button class="ib" data-mclose aria-label="Close">${ic('x',18)}</button></div>
  <form class="mb" id="cp-add-f"><p class="vf-lead">${geT('cp.add.sub',{n:cap-CP.tracked.length})}</p>
    <div class="fld"><label for="cp-ah">${geT('cp.ig')}</label><div class="cp-in"><span>@</span><input id="cp-ah" placeholder="sare.basic" value="${esc(pre.h||'')}" ${pre.h?'readonly':''} autocomplete="off"></div></div>
    <div class="fld"><label for="cp-as">${geT('cp.site')} <span class="opt-l">${geT('st.optional')}</span></label><input id="cp-as" placeholder="sare-basic.example" autocomplete="off"></div>
    <p class="d-sub">${geT('cp.site.hint')} ${geT('cp.add.fb')}</p><p class="cp-err" id="cp-aerr" hidden></p>
    <div class="cp-try">${geT('cp.try')} ${Object.keys(CP_FIX).filter(h=>!CP_FIX[h].own&&!CP.tracked.some(c=>c.h===h)).map(h=>`<button type="button" class="chip" data-cpfill="${h}">@${h}</button>`).join('')}<button type="button" class="chip" data-cpfill="shopee">shopee.co.id/…</button></div></form>
  <div class="mf"><button class="btn btn-o" data-mclose>${geT('pay.cancel')}</button><button class="btn btn-p" id="cp-ago">${geT('cp.add.go')}</button></div>`;
  mscrim.classList.add('open');
  modal.onclick=e=>{const b=e.target.closest('[data-cpfill]');if(!b)return;const k=b.dataset.cpfill;
    if(k==='shopee'){document.getElementById('cp-as').value='https://shopee.co.id/sarebasic';return}
    document.getElementById('cp-ah').value=k;document.getElementById('cp-as').value=(CP_FIX[k]||{}).site||''};
  const go=()=>{const err=document.getElementById('cp-aerr'),hv=document.getElementById('cp-ah').value,sv=document.getElementById('cp-as').value,h=cpHandle(hv),d=sv.trim()?cpDomain(sv):'';
    const say=m=>{err.textContent=m;err.hidden=false};
    if(CP_MARKET.test(sv)||CP_MARKET.test(d+'.')||CP_MARKET.test(hv)){say(geT('cp.market'));track('competitor_marketplace_refused',{});return}
    if(!h&&!pre.h){say(geT('cp.bad'));return}
    if(sv.trim()&&!d){say(geT('cp.site.bad'));return}
    if(pre.h){const c=CP.tracked.find(x=>x.h===pre.h);closeModal();c.site=d;c._m=null;cpSite(c).then(cpRe);CP.ch='web';renderCompete();return}
    if(CP.tracked.some(c=>c.h===h)||CP.me&&CP.me.h===h){say(geT('cp.dup'));return}
    if(CP.tracked.length>=limitCap('competitors')){say(geT('limit.competitors'));return}
    closeModal();const c=cpMake(h,d);c.added=geNow();CP.tracked.push(c);CP.sel=h;CP.ch=d?'web':'ig';
    FLIK.apiLog.unshift({name:'instagram.businessDiscovery',method:'GET',path:'/v1/competitors/instagram/'+h,source:'example data (needs a Meta app token)'});
    FLIK.apiLog.unshift({name:'meta.adLibrary',method:'GET',path:'/v1/competitors/meta-ads?page='+h,source:'example data (needs a Meta app token)'});
    track('competitor_added',{source:d?'instagram+website':'instagram',account:GS.account});cpSite(c).then(cpRe);renderCompete()};
  document.getElementById('cp-ago').onclick=go;document.getElementById('cp-add-f').onsubmit=e=>{e.preventDefault();go()};
  setTimeout(()=>document.getElementById(pre.h?'cp-as':'cp-ah').focus(),50)}

function cpClick(e){const b=e.target.closest('button');if(!b)return;const D=b.dataset;
  if('cpadd' in D)cpAddSheet();
  if(D.cpsel){CP.sel=D.cpsel;CP.ch='ig';renderCompete()}
  if(D.cpch){CP.ch=D.cpch;renderCompete()}
  if(D.cprm){const c=CP.tracked.find(x=>x.h===D.cprm);CP.tracked=CP.tracked.filter(x=>x.h!==D.cprm);if(CP.sel===D.cprm)CP.sel=CP.tracked[0]?CP.tracked[0].h:null;track('competitor_removed',{});toast(geT('cp.removed',{n:c?c.f.name:D.cprm}));renderCompete()}
  if(D.cpsite)cpAddSheet({h:D.cpsite});
  if(D.cptry){CP.draft=D.cptry;CP.err='';renderCompete();document.getElementById('cp-h').value=D.cptry}
  if('cpup' in D){track('merchant_cta_clicked',{from:'competitors'});toast(geT('lead.signup.toast'))}
  if(D.cpgo){const [h,i]=D.cpgo.split('|');cpPlanGo(h,+i)}}
document.addEventListener('ge:tick',()=>{CP.classified={}});
