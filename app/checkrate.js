/* ===== Shipping › Check rate: every courier for one route, with discount, success rate and red zones ===== */
document.querySelector('.main').insertAdjacentHTML('beforeend','<main class="content" id="view-cr" hidden></main>');
const CR={from:'',to:null,q:'',sug:[],kg:'1',l:'',w:'',h:'',pay:'cod',res:null,sort:'rec',grp:'all'};
const CR_CITIES=[['c:Jakarta Selatan','Jakarta Selatan'],['c:Kota Bandung','Kota Bandung'],['c:Kota Surabaya','Kota Surabaya'],['c:Kota Semarang','Kota Semarang'],['c:Kota Medan','Kota Medan']];
const crOrigin=v=>{if(v.startsWith('c:')){const a=AREA.find(x=>x.city===v.slice(2));return{name:a.city,area:a}}const w=whByCode(v);return{name:`${w.n} (${w.code})`,area:whArea(w)}};
function renderCr(){const el=document.getElementById('view-cr');if(!CR.from)CR.from=defWh()||CR_CITIES[0][0];
  el.innerHTML=`<div class="ph"><h1>Check rate</h1></div>
  <section class="card cr-f"><div class="cr-g">
    <div class="fld"><label for="cr-from">From</label><select id="cr-from" class="sx-sel">${WH.filter(w=>w.active).length?`<optgroup label="Your pickup addresses">${WH.filter(w=>w.active).map(w=>`<option value="${w.code}" ${CR.from===w.code?'selected':''}>${esc(w.n)} · ${w.code}</option>`).join('')}</optgroup>`:''}<optgroup label="Other cities">${CR_CITIES.map(c=>`<option value="${c[0]}" ${CR.from===c[0]?'selected':''}>${c[1]}</option>`).join('')}</optgroup></select></div>
    <div class="fld"><label for="cr-q">To</label><div class="ad-s"><input id="cr-q" value="${esc(CR.q)}" placeholder="City, kecamatan, kelurahan or postcode" autocomplete="off">${CR.sug.length?`<div class="ie-dd">${CR.sug.map((x,k)=>`<button class="opt" data-crs="${k}"><b>${x.kel}, ${x.kec}</b><span>${x.city}, ${x.prov} ${x.zip}</span></button>`).join('')}</div>`:''}</div></div>
    <div class="fld"><label for="cr-kg">Weight</label><div class="unit"><input id="cr-kg" data-cr="kg" value="${CR.kg}" inputmode="decimal"><em>kg</em></div></div>
    <div class="fld cr-dims"><label>Size <span class="src">optional</span></label><div class="cr-d">${['l','w','h'].map(k=>`<div class="unit"><input data-cr="${k}" value="${CR[k]}" placeholder="${k==='l'?'L':k==='w'?'W':'H'}" inputmode="numeric" aria-label="${k==='l'?'Length':k==='w'?'Width':'Height'}"><em>cm</em></div>`).join('')}</div></div>
    <div class="fld"><label>Payment</label><div class="seg sx-seg">${[['cod','COD'],['non','Non-COD']].map(p=>`<button class="${CR.pay===p[0]?'on':''}" data-crp="${p[0]}">${p[1]}</button>`).join('')}</div></div>
    <div class="fld cr-go"><label>&nbsp;</label><button class="btn btn-p" id="cr-go" ${CR.to?'':'disabled'}>Check rate</button></div></div>
    ${CR.to?'':`<p class="trk-ex">Try <button class="lnk" data-crex="80113">80113 Denpasar</button>, <button class="lnk" data-crex="Coblong">Coblong, Bandung</button> or <button class="lnk" data-crex="Medan Petisah">Medan Petisah</button>.</p>`}</section>
  <div id="cr-res">${CR.res?crResults():''}</div>`}
const crKg=()=>Math.max(+String(CR.kg).replace(',','.')||0,(+CR.l||0)*(+CR.w||0)*(+CR.h||0)/6000);
async function crRun(){const o=crOrigin(CR.from),kg=crKg();
  const list=await FLIK.api.rates({from:CR.from.startsWith('c:')?WH_ALL[0].code:CR.from,to:CR.to,kg});
  const ofs=list.map(r=>({...r,...rateOf(r.i,o.area,CR.to,kg),z:rzOf(r.courier,CR.to)}));
  CR.res={o,to:CR.to,kg,list:ofs};track('rate_checked',{to_city:CR.to.city,kg:Math.ceil(kg),pay:CR.pay});renderCr()}
function crResults(){const R=CR.res,blk=r=>r.z==='all'||(r.z==='cod'&&CR.pay==='cod');
  let L=R.list.filter(r=>CR.grp==='all'||r.group===CR.grp);
  const ok=R.list.filter(r=>!blk(r)),best=ok.slice().sort((a,b)=>b.sr-a.sr||a.net-b.net)[0],cheap=ok.slice().sort((a,b)=>a.net-b.net)[0],fast=ok.slice().sort((a,b)=>etaMax(SERVICES[a.i])-etaMax(SERVICES[b.i])||a.net-b.net)[0];
  const sorter={rec:(a,b)=>b.sr-a.sr||a.net-b.net,cheap:(a,b)=>a.net-b.net,fast:(a,b)=>etaMax(SERVICES[a.i])-etaMax(SERVICES[b.i])||a.net-b.net,sr:(a,b)=>b.sr-a.sr}[CR.sort];
  L=L.filter(r=>!blk(r)).sort(sorter).concat(L.filter(blk).sort(sorter));
  const zs=z=>z==='all'?'<span class="st bad sm">Not delivered</span>':z==='cod'?'<span class="st bad sm">Red zone</span>':'<span class="st ok sm">Delivers</span>';
  DL['cr']=()=>['flik-rates-'+R.to.zip,['Courier','Service','Group','Estimate','Published rate','FLIK rate','Discount','Delivery success %','Based on','COD','Non-COD'],L.map(r=>[cName(r.courier),r.service,r.group,r.eta,r.pub,r.net,r.disc,r.sr,r.level==='kecamatan'?`${R.to.kec} (${r.n} shipments)`:`${R.to.city} (city)`,r.z==='all'||r.z==='cod'?'Red zone':'Delivers',r.z==='all'?'Not delivered':'Delivers'])];
  const reds=R.list.filter(blk).map(r=>r.courier).filter((v,i,a)=>a.indexOf(v)===i);
  return`<div class="sec-h"><div><h2 class="sec">${plural(ok.length,'service')} to ${esc(R.to.kel)}, ${esc(R.to.kec)}</h2><p class="sec-sub">From ${esc(R.o.name)} · ${R.kg<1?R.kg.toFixed(1):Math.ceil(R.kg)} kg · ${CR.pay==='cod'?'COD':'Non-COD'}. Success rates come from FLIK shipments to ${esc(R.to.kec)} over the last 90 days, or ${esc(R.to.city)} where there are too few.</p></div><div class="sec-a">${dlBtn('cr')}</div></div>
  ${reds.length?`<div class="sx-note warn">${ic('warn',16)}<span><b>${reds.map(cName).join(', ')} ${reds.length===1?'doesn’t':'don’t'} deliver${CR.pay==='cod'?' COD':''} here.</b> ${CR.pay==='cod'?'Shoppers in red zones often refuse or can’t be reached, so the courier won’t take COD.':''}</span></div>`:''}
  <div class="filters"><div class="seg">${[['all','All'],['reg','Regular'],['exp','Express'],['cargo','Cargo']].map(g=>`<button class="${CR.grp===g[0]?'on':''}" data-crg="${g[0]}">${g[1]}</button>`).join('')}</div>
    <div class="fright"><span class="src">Sort by</span><div class="seg">${[['rec','Recommended'],['cheap','Cheapest'],['fast','Fastest'],['sr','Success rate']].map(g=>`<button class="${CR.sort===g[0]?'on':''}" data-crsort="${g[0]}">${g[1]}</button>`).join('')}</div></div></div>
  <div class="tbl-wrap"><table class="mt cr-t"><thead><tr><th>Courier</th><th>Estimate</th><th class="r">Rate</th><th>Delivery success</th><th>COD</th><th>Non-COD</th><th></th></tr></thead><tbody>
  ${L.map(r=>{const b=blk(r),sv=SERVICES[r.i];return`<tr class="nohover${b?' off':''}"><td><div class="sx-cl">${cLogo(r.courier)}<span><b>${cName(r.courier)} ${r.service}</b></span></div><div class="tags">${!b&&r===best?'<span class="sx-tag">Recommended</span>':''}${!b&&r===cheap?'<span class="sx-tag ch">Cheapest</span>':''}${!b&&r===fast?'<span class="sx-tag fa">Fastest</span>':''}</div></td>
    <td>${r.eta}<span class="src">${({reg:'Regular',exp:'Express',cargo:'Cargo'})[r.group]}</span></td>
    <td class="r"><s class="inv-sub num">${r.pub>r.net?rp(r.pub):''}</s><b class="num cr-p">${rp(r.net)}</b>${r.pub>r.net?`<span class="src">Save ${Math.round(r.disc/r.pub*100)}%</span>`:''}</td>
    <td style="min-width:170px"><span class="srb"><i style="width:${Math.max(0,(r.sr-60)/40*100)}%"></i></span><b class="num">${fpct(r.sr)}</b><span class="src">${r.level==='kecamatan'?`${r.n} shipments to ${esc(R.to.kec)}`:`City rate · ${esc(R.to.city)}`}</span></td>
    <td>${zs(r.z==='all'?'all':r.z==='cod'?'cod':null)}</td><td>${zs(r.z==='all'?'all':null)}</td>
    <td class="r">${b?'':`<button class="btn btn-o" data-crship="${r.i}">Ship</button>`}</td></tr>`}).join('')}</tbody></table></div>`}
const vCr=document.getElementById('view-cr');
vCr.addEventListener('input',async e=>{const t=e.target;
  if(t.id==='cr-q'){CR.q=t.value;CR.to=null;CR.sug=t.value.trim().length>1?await FLIK.api.geocode({query:t.value.trim()}):[];const p=t.selectionStart;renderCr();const n=document.getElementById('cr-q');n.focus();n.setSelectionRange(p,p);return}
  if(t.dataset.cr){CR[t.dataset.cr]=t.value}});
vCr.addEventListener('change',e=>{if(e.target.id==='cr-from'){CR.from=e.target.value;if(CR.res)crRun()}});
vCr.addEventListener('click',async e=>{const t=e.target.closest('button');if(!t)return;const d=t.dataset;
  if(d.crs!=null){CR.to=CR.sug[+d.crs];CR.q=areaTx(CR.to);CR.sug=[];crRun();return}
  if(d.crex){const r=await FLIK.api.geocode({query:d.crex});CR.to=r[0];CR.q=areaTx(CR.to);CR.sug=[];crRun();return}
  if(d.crp){CR.pay=d.crp;renderCr();return}
  if(t.id==='cr-go'){crRun();return}
  if(d.crg){CR.grp=d.crg;renderCr();return}
  if(d.crsort){CR.sort=d.crsort;renderCr();return}
  if(d.crship!=null){track('rate_ship_clicked',{courier:SERVICES[+d.crship][0]});go('shipments/create')}});
