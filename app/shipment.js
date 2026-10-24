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

/* ===== Create shipment =====
 * The flow is Raam's v4 (vendored in index.html). app/flow.js connects it to Monitoring and adds the 24 Oct decisions.
 */
const CODFEE=.03;
/* a prototype order (app/data.js shape) as the rate and score functions take it */
const valOf=s=>+String(s.val).replace(/\D/g,'')||0;
const parcel=s=>({area:s.addr.area,pay:s.pay,kg:kgOf(s),origin:whArea(whByCode(s.wh)),val:valOf(s)});
/* one balance for the whole prototype: Raam's flow reads BAL, the rest of the app reads PS.bal */
PS.bal=BAL;
const setBal=v=>{PS.bal=BAL=v;document.getElementById('balv').textContent=rp(v)};
document.getElementById('sx-close').onclick=()=>go(SH.length?'monitoring':'shipments');

/* top up: same modal as Raam's, verified first, and the balance goes up when paid */
function topupModal(title,o={}){if(typeof title!=='string')title='Top up balance';if(!PS.verified){verifyGate('top_up',()=>topupModal(title,o));return}
  let amt=o.amt||1000000,via='bca';
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
    document.getElementById('tdone').onclick=()=>{closeModal();setBal(PS.bal+amt);track('balance_topped_up',{amount:amt});if(o.onPaid){o.onPaid(amt);return}toast(`${rp(amt)} added to your balance`)}};
  };
  draw();mscrim.classList.add('open')}
document.getElementById('baladd').onclick=()=>topupModal();

