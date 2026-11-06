/* ===== Competitor monitoring (BUILD_SPEC section 4) =====
 * Instagram and the competitor's own Shopify or WooCommerce site only. No marketplaces, no TikTok.
 * B1 lead: one-time Instagram snapshot. B2 merchant: up to LIMITS.competitors, Instagram + website, weekly.
 * B3 friendly states, AI fallback for posts the rules can't place, and "Get an idea" into the Growth Engine.
 * Instagram needs a partner account, so it is always example data here. A real shop website is read live
 * (public Shopify /products.json or WooCommerce Store API) when the browser is allowed to; otherwise it says so.
 */
const CP={acct:null,tracked:[],snap:null,sel:null,tab:'posts',busy:false,classified:{}};
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
    FLIK.apiLog.unshift({name:'competitor.website',method:'GET',path:'https://'+d+(fx&&fx.platform==='woocommerce'?'/wp-json/wc/store/v1/products':'/products.json'),source:'example data (fictional shop)'});
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
function cpInit(){if(CP.acct===GS.account)return;CP.acct=GS.account;CP.snap=null;CP.tab='posts';CP.classified={};
  CP.tracked=GS.account==='new'?[cpMake('kain.kita.id')]:geMerchant()?[cpMake('kain.kita.id'),cpMake('lunaloom.co')]:[];
  CP.tracked.forEach(c=>{c.added=new Date(NOW-20*DAY);cpSite(c).then(()=>{if(location.hash==='#marketing/competitors')renderCompete()})});
  CP.sel=CP.tracked[0]?CP.tracked[0].h:null}
const cpActs=c=>c.f.private?[]:c.f.activity.map((a,i)=>({i,d:a[0],kind:a[1],t:{id:a[2],en:a[3]},at:cpDay(a[0])})).filter(a=>a.d<=GS.dayOffset).sort((a,b)=>b.d-a.d);
const cpNew=a=>a.d>GS.dayOffset-7;

/* ===== Page ===== */
function renderCompete(){cpInit();const el=document.getElementById('view-cmp'),lead=GS.account==='lead';
  el.innerHTML=`<div class="ph"><div><h1>${geT('cmp.h')}</h1><p class="sec-sub ge-sub">${lead?geT('cmp.lead.sub'):geT('cmp.sub')}</p></div>
    ${lead?'':`<button class="btn btn-p" data-cpadd ${CP.tracked.length>=limitCap('competitors')?'disabled':''}>${ic('plus',15)}${geT('cp.add')}</button>`}</div>
  ${lead?cpLeadHtml():cpMerchantHtml()}`;
  el.onclick=cpClick;el.onsubmit=e=>{e.preventDefault();if(e.target.id==='cp-lead-f')cpLeadGo()};
  if(!lead)cpClassify()}

/* ----- B1 lead: one look at one competitor on Instagram ----- */
function cpLeadHtml(){
  if(CP.busy)return`<section class="card cp-load"><span class="ai-dots"><i></i><i></i><i></i></span>${geT('cp.loading')}</section>`;
  if(!CP.snap)return`<section class="card cp-lead"><form id="cp-lead-f"><div class="fld"><label for="cp-h">${geT('cp.ig')}</label>
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

/* ----- B2 merchant: the full view ----- */
function cpMerchantHtml(){const cap=limitCap('competitors'),all=CP.tracked.flatMap(c=>cpActs(c).filter(cpNew).map(a=>({c,a})));
  const c=CP.tracked.find(x=>x.h===CP.sel)||CP.tracked[0];
  return`<p class="cp-ref">${ic('repeat',14)}${geT('cp.ref',{date:geFdate(cpRefreshed())})} · ${geT('cp.slots',{n:CP.tracked.length,cap})}</p>
  ${all.length?`<section class="card cp-week"><div class="sec-h"><div><h2 class="sec">${geT('cp.week.h')}</h2><p class="sec-sub">${geT('cp.week.sub')}</p></div></div>
    <div class="cp-wl">${all.slice(0,4).map(({c,a})=>`<div class="cp-wi"><span class="cp-k cp-k-${a.kind}">${geT('cp.kind.'+a.kind)}</span><div><b>${esc(c.f.name)}</b> ${esc(geL(a.t))}<small>${cpShort(a.at)}</small></div>${cpIdeaBtn(c,a)}</div>`).join('')}</div></section>`:''}
  ${CP.tracked.length?`<div class="cp-list" role="tablist">${CP.tracked.map(x=>{const n=cpActs(x).filter(cpNew).length;
      return`<button class="cp-chip${x===c?' on':''}" data-cpsel="${esc(x.h)}" role="tab" aria-selected="${x===c}"><span class="cp-av" style="background:${x.f.private?'#d5dbe1':'#8a5a3b'}">${esc((x.f.name||x.h)[0].toUpperCase())}</span><span><b>${esc(x.f.name)}</b><small>@${esc(x.h)}</small></span>${n?`<span class="ge-n">${n}</span>`:''}</button>`}).join('')}
      ${CP.tracked.length<cap?`<button class="cp-chip cp-addc" data-cpadd>${ic('plus',15)}${geT('cp.add')}</button>`:''}</div>
    ${cpPanel(c)}`
  :`<section class="card w-empty"><span class="qic">${ic('eye',22,1.6)}</span><div><b>${geT('cp.empty.h')}</b><span>${geT('cp.empty.sub',{n:cap})}</span></div><button class="btn btn-p" data-cpadd>${geT('cp.add')}</button></section>`}`}
function cpPanel(c){if(c.f.private)return`<section class="card cp-state">${ic('lock',22,1.6)}<div><b>${geT('cp.private.h')}</b><span>${geT('cp.private')}</span></div><button class="btn btn-o" data-cprm="${esc(c.h)}">${geT('cp.remove')}</button></section>`;
  const tabs=[['posts',geT('cp.t.posts')],['products',geT('cp.t.products')],['activity',geT('cp.t.activity')]];
  return`${cpProfile(c,false)}
  <div class="tabs" role="tablist">${tabs.map(([k,n])=>`<button class="tab${CP.tab===k?' on':''}" data-cptab="${k}" role="tab" aria-selected="${CP.tab===k}">${n}${k==='activity'?`<span class="ct">${cpActs(c).length}</span>`:''}</button>`).join('')}</div>
  ${CP.tab==='posts'?cpPosts(c,false):CP.tab==='products'?cpProducts(c):cpActivity(c)}`}
function cpProfile(c,lead){const f=c.f,s=cpStats(f);
  return`<section class="card cp-prof"><div class="cp-ph"><span class="cp-av lg">${esc(f.name[0])}</span><div><b>${esc(f.name)}</b><span>@${esc(c.h)} · ${geT('cp.followers',{n:f.followers.toLocaleString(geLang()==='id'?'id-ID':'en-US')})} · ${geT('cp.posts30',{n:s.n})}</span><small>${esc(geL(f.bio))}${f.gen?' · '+geT('cp.gen'):''}</small></div>
    ${lead?'':`<div class="cp-src"><span class="st gr sm">${ic('studio',12)}Instagram</span>${c.site?`<span class="st ${c.siteSt==='ok'?'ok':c.siteSt==='loading'?'gr':'warn'} sm">${esc(c.site)}${c.platform?' · '+(c.platform==='shopify'?'Shopify':'WooCommerce'):''}${c.live?' · '+geT('cp.live'):''}</span>`:''}<button class="lnk" data-cprm="${esc(c.h)}">${geT('cp.remove')}</button></div>`}</div>
    <div class="cp-det"><div><span>${geT('cp.d.promos')}</span><b>${s.promos?geT('cp.d.promos.v',{n:s.promos,r:s.disc?s.disc[0]===s.disc[1]?s.disc[0]+'%':s.disc[0]+'–'+s.disc[1]+'%':''}):geT('cp.d.none')}</b></div>
      <div><span>${geT('cp.d.times')}</span><b>${s.hours}</b></div><div><span>${geT('cp.d.themes')}</span><b>${s.themes.map(t=>geT('cp.type.'+t)).join(', ')||'—'}</b></div></div></section>`}
function cpPosts(c,lead){const f=c.f,cl=CP.classified[c.h]||{};
  return`<div class="cp-grid">${f.posts.slice(0,9).map((p,i)=>{const ty=p[1]||cl[i],ai=!p[1]&&cl[i];
    return`<figure class="cp-post"><div class="cp-img" style="background:${p[3]}"><img src="${stThumbSrc(stProd(p[2]))}" alt="${esc(geL({id:p[5],en:p[6]}))}">${p[4]?`<span class="cp-tag">${esc(p[4])}</span>`:''}</div>
      <figcaption>${ty?`<span class="cp-k cp-k-${ty}">${geT('cp.type.'+ty)}</span>${ai?aiTag():''}`:lead?'':`<span class="cp-k">${geT('cp.reading')}</span>`}<p>${esc(geL({id:p[5],en:p[6]}))}</p><small>${cpShort(cpDay(-p[0]))} · ${String(p[7]).padStart(2,'0')}:00 · ♥ ${p[8].toLocaleString()}</small></figcaption></figure>`}).join('')}</div>`}
/* B3: a post with no rule match goes to the AI fallback once, and is tagged AI */
function cpClassify(){CP.tracked.forEach(c=>{if(c.f.private||CP.classified[c.h])return;CP.classified[c.h]={};
  c.f.posts.slice(0,9).forEach((p,i)=>{if(p[1])return;mockLLM('classify',{caption:p[6]}).then(r=>{if(r.ai){CP.classified[c.h][i]=r.type;if(location.hash==='#marketing/competitors'&&CP.sel===c.h&&CP.tab==='posts')renderCompete()}})})})}
function cpProducts(c){const st=c.siteSt;
  if(st==='loading')return`<section class="card cp-load"><span class="ai-dots"><i></i><i></i><i></i></span>${geT('cp.site.loading')}</section>`;
  if(st!=='ok'){const k={none:'none',unsupported:'unsup',down:'down',browser:'browser'}[st]||'none';
    return`<section class="card cp-state">${ic(k==='none'?'plus':'info',22,1.6)}<div><b>${geT('cp.site.'+k+'.h')}</b><span>${geT('cp.site.'+k,{site:esc(c.site)})}</span></div>${k==='none'?`<button class="btn btn-o" data-cpsite="${esc(c.h)}">${geT('cp.site.add')}</button>`:''}</section>`}
  return`<section class="card"><div class="tbl-wrap"><table class="cp-tbl"><thead><tr><th>${geT('cp.p.name')}</th><th class="r">${geT('cp.p.price')}</th><th class="r">${geT('cp.p.was')}</th><th>${geT('cp.p.stock')}</th><th>${geT('cp.p.week')}</th></tr></thead>
    <tbody>${c.products.map(p=>`<tr><td>${esc(p.n)}</td><td class="r">${rp(p.p)}</td><td class="r">${p.c?`<s>${rp(p.c)}</s> <span class="cp-off">−${Math.round((1-p.p/p.c)*100)}%</span>`:'—'}</td><td>${p.stock?`<span class="st ok sm">${geT('cp.p.in')}</span>`:`<span class="st gr sm">${geT('cp.p.out')}</span>`}</td><td>${p.chg?`<span class="cp-k cp-k-${p.chg==='new'?'new':'price'}">${geT(p.chg==='new'?'cp.p.new':'cp.p.chg')}</span>`:''}</td></tr>`).join('')}</tbody></table></div>
    <p class="d-sub">${c.live?geT('cp.p.live',{site:esc(c.site)}):geT('cp.p.fix')}</p></section>`}
function cpActivity(c){const as=cpActs(c);
  return`<section class="card"><div class="tl cp-tl">${as.map(a=>`<div class="tli${cpNew(a)?' pu':''}"><i>${ic(a.kind==='price'?'tag':a.kind==='new'?'plus':a.kind==='promo'?'sparkle':'studio',10,2)}</i><div class="cp-ai"><div><b>${esc(geL(a.t))}${cpNew(a)?` <span class="st pu sm">${geT('cp.new')}</span>`:''}</b><span>${cpShort(a.at)} · ${geT('cp.kind.'+a.kind)}</span></div>${cpIdeaBtn(c,a)}</div></div>`).join('')||`<p class="d-sub">${geT('cp.act.none')}</p>`}</div>
  <p class="d-sub">${geT('cp.act.next')}</p></section>`}
function cpIdeaBtn(c,a){const id=geIdeaIdFor(c.h,a.i);return id?`<a class="btn btn-o cp-ib" href="#marketing/growth/idea/${id}">${geT('cp.idea.open')}</a>`:`<button class="btn btn-o cp-ib" data-cpidea="${esc(c.h)}|${a.i}">${ic('sparkle',14)}${geT('cp.idea')}</button>`}

/* ----- Add a competitor (merchant) ----- */
function cpAddSheet(pre={}){const cap=limitCap('competitors');
  if(CP.tracked.length>=cap){toast(geT('limit.competitors'));track('limit_reached',{limit:'competitors',account:GS.account});return}
  modal.classList.add('nw');
  modal.innerHTML=`<div class="mh"><h3>${geT('cp.add')}</h3><button class="ib" data-mclose aria-label="Close">${ic('x',18)}</button></div>
  <form class="mb" id="cp-add-f"><p class="vf-lead">${geT('cp.add.sub',{n:cap-CP.tracked.length})}</p>
    <div class="fld"><label for="cp-ah">${geT('cp.ig')}</label><div class="cp-in"><span>@</span><input id="cp-ah" placeholder="sare.basic" value="${esc(pre.h||'')}" ${pre.h?'readonly':''} autocomplete="off"></div></div>
    <div class="fld"><label for="cp-as">${geT('cp.site')} <span class="opt-l">${geT('st.optional')}</span></label><input id="cp-as" placeholder="sare-basic.example" autocomplete="off"></div>
    <p class="d-sub">${geT('cp.site.hint')}</p><p class="cp-err" id="cp-aerr" hidden></p>
    <div class="cp-try">${geT('cp.try')} ${Object.keys(CP_FIX).filter(h=>!CP.tracked.some(c=>c.h===h)).map(h=>`<button type="button" class="chip" data-cpfill="${h}">@${h}</button>`).join('')}<button type="button" class="chip" data-cpfill="shopee">shopee.co.id/…</button></div></form>
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
    if(pre.h){const c=CP.tracked.find(x=>x.h===pre.h);closeModal();c.site=d;cpSite(c).then(renderCompete);CP.tab='products';renderCompete();return}
    if(CP.tracked.some(c=>c.h===h)){say(geT('cp.dup'));return}
    if(CP.tracked.length>=limitCap('competitors')){say(geT('limit.competitors'));return}
    closeModal();const c=cpMake(h,d);c.added=geNow();CP.tracked.push(c);CP.sel=h;CP.tab=d?'products':'posts';
    FLIK.apiLog.unshift({name:'instagram.businessDiscovery',method:'GET',path:'/v1/competitors/instagram/'+h,source:'example data (Instagram needs a partner account)'});
    track('competitor_added',{source:d?'instagram+website':'instagram',account:GS.account});cpSite(c).then(()=>{if(location.hash==='#marketing/competitors')renderCompete()});renderCompete()};
  document.getElementById('cp-ago').onclick=go;document.getElementById('cp-add-f').onsubmit=e=>{e.preventDefault();go()};
  setTimeout(()=>document.getElementById(pre.h?'cp-as':'cp-ah').focus(),50)}

function cpClick(e){const b=e.target.closest('button');if(!b)return;const D=b.dataset;
  if('cpadd' in D)cpAddSheet();
  if(D.cpsel){CP.sel=D.cpsel;CP.tab='posts';renderCompete()}
  if(D.cptab){CP.tab=D.cptab;renderCompete()}
  if(D.cprm){CP.tracked=CP.tracked.filter(c=>c.h!==D.cprm);CP.sel=CP.tracked[0]?CP.tracked[0].h:null;track('competitor_removed',{});renderCompete()}
  if(D.cpsite)cpAddSheet({h:D.cpsite});
  if(D.cptry){CP.draft=D.cptry;CP.err='';renderCompete();document.getElementById('cp-h').value=D.cptry}
  if('cpup' in D){track('merchant_cta_clicked',{from:'competitors'});toast(geT('lead.signup.toast'))}
  if(D.cpidea){const [h,i]=D.cpidea.split('|'),c=CP.tracked.find(x=>x.h===h);if(c)geIdeaFromActivity(c,+i)}}
document.addEventListener('ge:tick',()=>{CP.classified={}});
