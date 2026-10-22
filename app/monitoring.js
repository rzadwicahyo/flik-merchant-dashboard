/* ===== Shipping › Monitoring: what needs action, at the level of detail of AG's Loanbook =====
 * Tabs: Summary (batches, needs resolving), Health, Courier performance, All shipments, Tickets.
 * Every section exports straight to the device.
 */
document.querySelector('.main').insertAdjacentHTML('beforeend','<main class="content" id="view-mon" hidden></main>');
const MS={tab:'summary',days:30,f:{wh:'',k:'',pay:''},rt:'open',open:new Set(),allB:false,perf:'city',hArea:'city',
  l:{q:'',st:'',mon:'',pg:0},reset(){this.tab='summary';this.f={wh:'',k:'',pay:''};this.rt='open';this.open=new Set();this.allB=false;this.l={q:'',st:'',mon:'',pg:0}}};
const MTABS=[['summary','Summary'],['health','Health'],['perf','Courier performance'],['list','All shipments'],['tickets','Tickets']];
const msBase=()=>SH.filter(s=>(!MS.days||s.created>=new Date(NOW-MS.days*DAY))&&(!MS.f.wh||s.wh===MS.f.wh)&&(!MS.f.k||s.k===MS.f.k)&&(!MS.f.pay||s.pay===MS.f.pay));
const finL=l=>l.filter(s=>s.st==='delivered'||s.st==='returned'||s.st==='lost');
const srL=l=>{const f=finL(l);return f.length?pct(f.filter(s=>s.st==='delivered').length,f.length):null};
const sevRank=s=>{const m=monOf(s);return SEV3[m]?SEV3[m][2]:9};
const awbTd=s=>`<td class="mono">${s.awb||'<span class="inv-sub">After pickup</span>'}</td>`;
const cTd=s=>`<td><div class="sx-cl">${cLogo(s.k)}<span>${cName(s.k)}</span></div></td>`;
const secH=(t,sub,dl,extra='')=>`<div class="sec-h"><div><h2 class="sec">${t}</h2>${sub?`<p class="sec-sub">${sub}</p>`:''}</div><div class="sec-a">${extra}${dl?dlBtn(dl):''}</div></div>`;
const SHIP_HEAD=['AWB','Batch','Created','Shipment status','Monitoring status','Courier','Service','Updated','Shopper name','Shopper phone','Street','Kelurahan','Kecamatan','City','Province','Postcode','Pickup from','Payment','COD / goods value','Published rate','Shipping cost','COD fee','Product','Qty','Weight (kg)','Ticket'];
const shipRow=s=>[s.awb||'',s.batch,fdateY(s.created),SST3[s.st][0],MON3[monOf(s)][0],cName(s.k),SERVICES[s.svc][1],fdateY(s.upd),s.name,'+'+s.phone,s.street,s.area.kel,s.area.kec,s.area.city,s.area.prov,s.area.zip,s.wh,s.pay==='cod'?'COD':'Non-COD',s.val,s.pub,s.cost,s.codFee,s.items,s.qty,s.kg,s.tk||''];

function renderMon(){const el=document.getElementById('view-mon');
  if(!SH.length){el.innerHTML=`<h1>Monitoring</h1><section class="card w-empty"><span class="qic">${ic('pulse',22,1.6)}</span><div><b>Nothing to monitor yet</b><span>After your first shipment, this page shows each batch, anything delayed or at risk, and how each courier performs for you.</span></div><button class="btn btn-p" data-newshp>Create shipment</button></section>`;return}
  const base=msBase(),open=SH.filter(s=>rstate(s)==='open').length;
  el.innerHTML=`<div class="ph"><h1>Monitoring</h1><button class="btn btn-p" data-newshp>${ic('plus',15,2)}Create shipment</button></div>
  <div class="tabs" role="tablist">${MTABS.map(t=>`<button class="tab${MS.tab===t[0]?' on':''}" data-mt="${t[0]}">${t[1]}${t[0]==='summary'&&open?`<span class="badge">${open}</span>`:t[0]==='tickets'&&TK.filter(k=>k.st!=='resolved').length?`<span class="ct">${TK.filter(k=>k.st!=='resolved').length}</span>`:''}</button>`).join('')}</div>
  <div class="filters">${fchip('days','Created',MS.days?`Last ${MS.days} days`:'All time')}${fchip('wh','Warehouse',MS.f.wh)}${fchip('k','Courier',MS.f.k&&cName(MS.f.k))}${fchip('pay','Payment',MS.f.pay&&(MS.f.pay==='cod'?'COD':'Non-COD'))}
    ${MS.f.wh||MS.f.k||MS.f.pay?'<button class="lnk" data-fclear>Clear filters</button>':''}<div class="fright"><span class="ms-n">${plural(base.length,'shipment')}</span></div></div>
  <div id="mon-body">${({summary:monSummary,health:monHealth,perf:monPerf,list:monList,tickets:monTickets})[MS.tab](base)}</div>`;
  track('monitoring_viewed',{tab:MS.tab})}
const fchip=(k,l,v)=>`<button class="chip${v?' set':''}" data-fc="${k}">${v?'':ic('pluscirc')}<span>${l}</span>${v?` <span class="val">${esc(v)}</span>`:''}</button>`;
function fpop(b,k){if(popFor===b){closePop();return}popFor=b;
  const O=k==='days'?[[7,'Last 7 days'],[30,'Last 30 days'],[90,'Last 90 days'],[0,'All time']]:k==='wh'?[['','All warehouses'],...WH.map(w=>[w.code,`${w.n} · ${w.code}`])]:k==='k'?[['','All couriers'],...COURIERS.map(c=>[c.k,c.n])]:[['','COD and non-COD'],['cod','COD'],['non','Non-COD']];
  const cur=k==='days'?MS.days:MS.f[k];
  pop.innerHTML=`<h6>${({days:'Created',wh:'Warehouse',k:'Courier',pay:'Payment'})[k]}</h6>${O.map((o,i)=>`<button class="opt" data-o="${i}"><span class="rdo${cur===o[0]?' on':''}"></span>${o[1]}</button>`).join('')}`;
  pop.querySelectorAll('[data-o]').forEach(x=>x.onclick=()=>{const v=O[+x.dataset.o][0];if(k==='days')MS.days=v;else MS.f[k]=v;MS.l.pg=0;closePop();track('monitoring_filtered',{filter:k});renderMon()});placePop(b,false)}

/* ---- Summary: tiles, batch cards, needs resolving ---- */
function tiles(l){const f=finL(l),d=l.filter(s=>s.st==='delivered').length,r=l.filter(s=>s.st==='returned'||s.st==='returning').length,way=l.filter(s=>!['delivered','returned','lost'].includes(s.st)).length;
  const cod=sum(l.filter(s=>s.pay==='cod'&&s.st==='delivered'),s=>s.val),need=l.filter(s=>rstate(s)==='open').length;
  const T=[['Shipments',l.length.toLocaleString('id-ID'),`${l.filter(s=>s.pay==='cod').length.toLocaleString('id-ID')} COD`],['Delivered',d.toLocaleString('id-ID'),f.length?`${fpct(pct(d,f.length))} of finished`:'—','ok'],['Returned',r.toLocaleString('id-ID'),f.length?`${fpct(pct(l.filter(s=>s.st==='returned').length,f.length))} of finished`:'—'],['On the way',way.toLocaleString('id-ID'),'Not delivered yet'],['Need resolving',need.toLocaleString('id-ID'),need?'Open issues':'All clear',need?'bad':'ok'],['COD collected',compact(cod),'From delivered parcels']];
  return`<div class="kp">${T.map(t=>`<div class="kp-t${t[3]?' '+t[3]:''}"><span>${t[0]}</span><b class="num">${t[1]}</b><small>${t[2]}</small></div>`).join('')}</div>`}
function batchStats(id,l){const s=l.filter(x=>x.batch===id),f=finL(s);return{s,n:s.length,del:s.filter(x=>x.st==='delivered').length,ret:s.filter(x=>x.st==='returned').length,sr:f.length?pct(f.filter(x=>x.st==='delivered').length,f.length):null,issues:s.filter(x=>rstate(x)==='open').length}}
function monSummary(base){const ids=[...new Set(base.map(s=>s.batch))],bs=ids.map(id=>({b:BATCH.find(x=>x.id===id),...batchStats(id,base)})).filter(x=>x.b).sort((a,b)=>b.b.created-a.b.created);
  const shown=MS.allB?bs:bs.slice(0,9);
  DL['m-batches']=()=>['flik-batches',['Batch','Courier','Service','Pickup from','Created','Shipments','Delivered','Returned','Success rate','Need resolving'],bs.map(x=>[x.b.id,cName(x.b.k),SERVICES[x.b.svc][1],x.b.wh,fdateY(x.b.created),x.n,x.del,x.ret,x.sr==null?'':x.sr+'%',x.issues])];
  return tiles(base)+secH('Batches','Click a batch to see its shipments.','m-batches')+
  `<div class="bt-g">${shown.map(x=>{const o=MS.open.has(x.b.id);return`<div class="bt${o?' open':''}"><button class="bt-c" data-bt="${x.b.id}" aria-expanded="${o}">
    <div class="bt-h"><span class="mono">${x.b.id}</span>${x.issues?`<span class="st warn sm">${x.issues} to resolve</span>`:''}<span class="chev">${ic('chev',15)}</span></div>
    <div class="bt-k">${cLogo(x.b.k)}<span>${cName(x.b.k)} ${SERVICES[x.b.svc][1]}</span><span class="src">· ${fdate(x.b.created)}</span></div>
    <dl class="bt-n"><div><dt>Shipments</dt><dd>${x.n}</dd></div><div><dt>Delivered</dt><dd>${x.del}</dd></div><div><dt>Returned</dt><dd>${x.ret}</dd></div><div><dt>Success</dt><dd>${x.sr==null?'—':fpct(x.sr)}</dd></div></dl>
    <span class="bar"><i style="width:${x.sr||0}%"></i></span></button>
    ${o?batchList(x):''}</div>`}).join('')}</div>
  ${bs.length>9?`<div class="sx-row" style="justify-content:center"><button class="btn btn-o" data-allb>${MS.allB?'Show fewer':`Show all ${bs.length} batches`}</button></div>`:''}
  ${resolveHtml(base)}`}
function batchList(x){const id='m-b-'+x.b.id;DL[id]=()=>['flik-'+x.b.id,SHIP_HEAD,x.s.map(shipRow)];
  return`<div class="bt-l"><div class="sec-h"><b>${plural(x.n,'shipment')} in ${x.b.id}</b><div class="sec-a">${dlBtn(id)}</div></div><div class="tbl-wrap"><table class="mt"><thead><tr><th>AWB</th><th>Created</th><th>Shipment status</th><th>Monitoring</th><th>Courier</th><th>Updated</th><th>Shopper</th><th>Phone</th></tr></thead><tbody>
  ${x.s.map(s=>`<tr data-sid="${s.id}">${awbTd(s)}<td class="date">${fdate(s.created)}</td><td>${stPill3(s.st)}</td><td>${monPill(monOf(s))}</td>${cTd(s)}<td class="upd">${ago(s.upd)}</td><td>${esc(s.name)}</td><td class="mono">${fphone(s.phone)}</td></tr>`).join('')}</tbody></table></div></div>`}
const RT=[['open','Open'],['ack','Acknowledged'],['resolved','Resolved'],['all','All']];
function resolveHtml(base){const pool=base.filter(s=>rstate(s)),cnt=k=>k==='all'?pool.length:pool.filter(s=>rstate(s)===k).length;
  const rows=pool.filter(s=>MS.rt==='all'||rstate(s)===MS.rt).sort((a,b)=>sevRank(a)-sevRank(b)||a.upd-b.upd);
  DL['m-resolve']=()=>['flik-needs-resolving',['AWB','Courier','Created','Shipment status','Monitoring status','Severity','Issue','State','Ticket','Shopper name','Shopper phone','City'],rows.map(s=>{const is=issueOf(s)||s.had||{};return[s.awb||'',cName(s.k),fdateY(s.created),SST3[s.st][0],MON3[monOf(s)][0],SEV3[monOf(s)]?SEV3[monOf(s)][0]:'',is.t||'',({open:'Open',ack:'Acknowledged',resolved:'Resolved'})[rstate(s)],s.tk||'',s.name,'+'+s.phone,s.area.city]})];
  return secH('Needs resolving','Sorted by severity. Taking an action moves it to Acknowledged; it is Resolved once the shipment is safe.','m-resolve')+
  `<div class="tabs sm" role="tablist">${RT.map(t=>`<button class="tab${MS.rt===t[0]?' on':''}" data-rt="${t[0]}">${t[1]}<span class="ct">${cnt(t[0])}</span></button>`).join('')}</div>
  <div class="tbl-wrap"><table class="mt"><thead><tr><th>AWB</th><th>Courier</th><th>Created</th><th>Shipment status</th><th>Monitoring</th><th>Severity</th><th>Issue</th><th class="r">Action</th></tr></thead><tbody>
  ${rows.length?rows.slice(0,60).map(s=>{const st=rstate(s),is=issueOf(s)||s.had||{t:'—'},t=s.tk&&TK.find(k=>k.id===s.tk);return`<tr data-sid="${s.id}">${awbTd(s)}${cTd(s)}<td class="date">${fdate(s.created)}</td><td>${stPill3(s.st)}</td><td>${monPill(monOf(s))}</td><td>${sevPill3(monOf(s))||'<span class="inv-sub">—</span>'}</td><td class="nx"><b>${is.t}</b>${st==='open'&&is.next?`<span>${is.next}</span>`:''}</td>
    <td class="r act">${st==='open'?`<button class="btn btn-o" data-act="${s.id}" data-a="${is.act}">${TKT[is.act][1]}</button><button class="dots-b" data-actm="${s.id}" aria-label="Other actions">${ic('dots',16)}</button>`:t?`<button class="lnk" data-tk="${t.id}">${t.id}</button> <span class="st ${TKST[t.st][1]} sm">${TKST[t.st][0]}</span>`:''}</td></tr>`}).join('')
    :`<tr><td colspan="8" style="height:auto;border:0;cursor:default"><div class="empty"><b>${MS.rt==='open'?'Nothing needs resolving':'Nothing here'}</b>${MS.rt==='open'?'Delayed, at-risk and problem shipments show up here.':'No shipments in this view.'}</div></td></tr>`}</tbody></table></div>
  ${rows.length>60?`<p class="sec-sub" style="margin-top:8px">Showing the 60 most severe. Export for all ${rows.length}.</p>`:''}`}

/* ---- Health: by courier, by area, total ---- */
const HCOLS=['ontrack','delayed','risk','problem','safe'];
const healthRow=l=>{const c={};HCOLS.forEach(k=>c[k]=0);l.forEach(s=>c[monOf(s)]++);return{n:l.length,c,h:pct(c.ontrack+c.safe,l.length)}};
const hBar=c=>`<span class="hb">${HCOLS.map(k=>c.c[k]?`<i class="hb-${k}" style="flex:${c.c[k]}" title="${MON3[k][0]}: ${c.c[k]}"></i>`:'').join('')}</span>`;
const hTable=(rows,first)=>`<div class="tbl-wrap"><table class="mt"><thead><tr><th>${first}</th><th class="r">Shipments</th>${HCOLS.map(k=>`<th class="r">${MON3[k][0]}</th>`).join('')}<th>Mix</th><th class="r">Healthy</th></tr></thead><tbody>${rows.map(([lab,r])=>`<tr class="nohover"><td>${lab}</td><td class="r num">${r.n}</td>${HCOLS.map(k=>`<td class="r num${r.c[k]&&(k==='problem'||k==='risk')?' hot':''}">${r.c[k]||'<span class="inv-sub">0</span>'}</td>`).join('')}<td style="min-width:140px">${hBar(r)}</td><td class="r num"><b>${fpct(r.h)}</b></td></tr>`).join('')}</tbody></table></div>`;
const hRowsCsv=(rows,first)=>[first,'Shipments',...HCOLS.map(k=>MON3[k][0]),'Healthy %'];
function monHealth(base){const tot=healthRow(base);
  const byC=COURIERS.map(c=>[c,base.filter(s=>s.k===c.k)]).filter(x=>x[1].length).map(([c,l])=>[c,healthRow(l)]).sort((a,b)=>a[1].h-b[1].h);
  const key=MS.hArea==='city'?s=>s.area.city:s=>s.area.kec+' · '+s.area.city;
  const byA=Object.entries(by(base,key)).map(([a,l])=>[a,healthRow(l)]).sort((a,b)=>b[1].n-a[1].n);
  const csv=(file,first,rows)=>[file,[first,'Shipments',...HCOLS.map(k=>MON3[k][0]),'Healthy %'],rows.map(([a,r])=>[a,r.n,...HCOLS.map(k=>r.c[k]),r.h])];
  DL['m-h-total']=()=>csv('flik-health-total','Monitoring status',HCOLS.map(k=>[MON3[k][0],{n:tot.c[k],c:Object.fromEntries(HCOLS.map(j=>[j,j===k?tot.c[k]:0])),h:pct(tot.c[k],tot.n)}]));
  DL['m-h-courier']=()=>csv('flik-health-by-courier','Courier',byC.map(([c,r])=>[c.n,r]));
  DL['m-h-area']=()=>csv('flik-health-by-area',MS.hArea==='city'?'City':'Kecamatan',byA);
  return secH('Total shipments',`${plural(tot.n,'shipment')}; ${fpct(tot.h)} on track or safe.`,'m-h-total')+
  `<section class="card hc"><div class="hb big">${HCOLS.map(k=>tot.c[k]?`<i class="hb-${k}" style="flex:${tot.c[k]}"></i>`:'').join('')}</div><div class="hl">${HCOLS.map(k=>`<span><i class="dt hb-${k}"></i>${MON3[k][0]} <b class="num">${tot.c[k].toLocaleString('id-ID')}</b> <span class="src">${fpct(pct(tot.c[k],tot.n))}</span></span>`).join('')}</div></section>`+
  secH('By courier','Least healthy first.','m-h-courier')+hTable(byC.map(([c,r])=>[`<div class="sx-cl">${cLogo(c.k)}<span>${c.n}</span></div>`,r]),'Courier')+
  secH('By area','Where your parcels go.','m-h-area',`<div class="seg">${[['city','City'],['kec','Kecamatan']].map(t=>`<button class="${MS.hArea===t[0]?'on':''}" data-ha="${t[0]}">${t[1]}</button>`).join('')}</div>`)+hTable(byA.map(([a,r])=>[esc(a),r]),MS.hArea==='city'?'City':'Kecamatan')}

/* ---- Courier performance: by city and by service ---- */
function monPerf(base){
  if(MS.perf==='city'){const cities=Object.entries(by(base,s=>s.area.city)).sort((a,b)=>b[1].length-a[1].length),cs=COURIERS.filter(c=>base.some(s=>s.k===c.k));
    const cell=l=>{const f=finL(l);return f.length>=5?pct(f.filter(s=>s.st==='delivered').length,f.length):null};
    DL['m-perf']=()=>['flik-courier-performance-by-city',['City','Shipments',...cs.map(c=>c.n+' success %'),...cs.map(c=>c.n+' shipments')],cities.map(([city,l])=>[city,l.length,...cs.map(c=>{const v=cell(l.filter(s=>s.k===c.k));return v==null?'':v}),...cs.map(c=>l.filter(s=>s.k===c.k).length)])];
    return secH('Courier performance by city','Delivered as a share of finished shipments. Cells with fewer than 5 finished shipments are left out. The darker the cell, the better.','m-perf',perfSeg())+
    `<div class="tbl-wrap"><table class="mt hm"><thead><tr><th>City</th><th class="r">Shipments</th>${cs.map(c=>`<th class="c">${cLogo(c.k)}<span>${c.n}</span></th>`).join('')}</tr></thead><tbody>
    ${cities.map(([city,l])=>{const v=cs.map(c=>[c,cell(l.filter(s=>s.k===c.k)),l.filter(s=>s.k===c.k).length]),best=Math.max(...v.map(x=>x[1]||0));
      return`<tr class="nohover"><td>${esc(city)}</td><td class="r num">${l.length}</td>${v.map(([c,x,n])=>x==null?`<td class="c inv-sub">${n?`${n} sent`:'—'}</td>`:`<td class="c"><span class="hmc" style="--a:${(Math.min(1,Math.max(0,(x-70)/30))*.4+.05).toFixed(2)}"><b class="num">${fpct(x)}</b>${x===best?'<em>Best</em>':''}</span><span class="src">${n} sent</span></td>`).join('')}</tr>`}).join('')}</tbody></table></div>`}
  const rows=SERVICES.map((sv,i)=>[sv,i,base.filter(s=>s.svc===i)]).filter(x=>x[2].length).map(([sv,i,l])=>{const f=finL(l),dl=l.filter(s=>s.st==='delivered');
    return{sv,i,n:l.length,del:dl.length,ret:l.filter(s=>s.st==='returned').length,sr:f.length?pct(dl.length,f.length):null,days:dl.length?Math.round(sum(dl,s=>(s.upd-s.created)/DAY)/dl.length*10)/10:null,cost:Math.round(sum(l,s=>s.cost)/l.length),late:pct(l.filter(s=>monOf(s)==='delayed'||(s.st==='delivered'&&(s.upd-s.created)/DAY>etaMax(sv)+.5)).length,l.length)}}).sort((a,b)=>(b.sr||0)-(a.sr||0));
  DL['m-perf']=()=>['flik-courier-performance-by-service',['Courier','Service','Shipments','Delivered','Returned','Success %','Avg days to deliver','Avg shipping cost','Late %'],rows.map(r=>[cName(r.sv[0]),r.sv[1],r.n,r.del,r.ret,r.sr??'',r.days??'',r.cost,r.late])];
  return secH('Courier performance by service','Success is delivered as a share of finished shipments.','m-perf',perfSeg())+
  `<div class="tbl-wrap"><table class="mt"><thead><tr><th>Service</th><th class="r">Shipments</th><th class="r">Delivered</th><th class="r">Returned</th><th>Success rate</th><th class="r">Avg days</th><th class="r">Late</th><th class="r">Avg shipping cost</th></tr></thead><tbody>
  ${rows.map(r=>`<tr class="nohover"><td><div class="sx-cl">${cLogo(r.sv[0])}<span>${cName(r.sv[0])} ${r.sv[1]}</span></div></td><td class="r num">${r.n}</td><td class="r num">${r.del}</td><td class="r num">${r.ret}</td><td style="min-width:160px">${r.sr==null?'—':`<span class="srb"><i style="width:${Math.max(0,(r.sr-60)/40*100)}%"></i></span><b class="num">${fpct(r.sr)}</b>`}</td><td class="r num">${r.days??'—'}</td><td class="r num">${fpct(r.late)}</td><td class="r num">${rp(r.cost)}</td></tr>`).join('')}</tbody></table></div>`}
const perfSeg=()=>`<div class="seg">${[['city','By city'],['service','By service']].map(t=>`<button class="${MS.perf===t[0]?'on':''}" data-perf="${t[0]}">${t[1]}</button>`).join('')}</div>`;

/* ---- All shipments: filters and a raw export ---- */
const PERL=25;
function listRows(base){const L=MS.l,q=L.q.trim().toLowerCase(),toks=q.split(/[\s,;]+/).filter(Boolean),many=toks.length>1;
  return base.filter(s=>(!L.st||s.st===L.st)&&(!L.mon||monOf(s)===L.mon)&&(!q||(many?toks.includes((s.awb||'').toLowerCase()):[s.awb,s.name,s.phone,s.batch,s.area.city,s.area.kec].join(' ').toLowerCase().includes(q))))}
function monList(base){const rows=listRows(base),L=MS.l,pages=Math.max(1,Math.ceil(rows.length/PERL));L.pg=Math.min(L.pg,pages-1);
  DL['m-list']=()=>['flik-shipments',SHIP_HEAD,rows.map(shipRow)];
  return`<div class="filters ms-lf"><label class="search bl-search"><span>${ic('search',16)}</span><input id="ms-q" value="${esc(L.q)}" placeholder="AWB (several at once), shopper, phone or batch" autocomplete="off" aria-label="Search shipments"></label>
    <select class="chip-sel" data-lf="st" aria-label="Shipment status"><option value="">Any shipment status</option>${Object.entries(SST3).map(([k,v])=>`<option value="${k}" ${L.st===k?'selected':''}>${v[0]}</option>`).join('')}</select>
    <select class="chip-sel" data-lf="mon" aria-label="Monitoring status"><option value="">Any monitoring status</option>${Object.entries(MON3).map(([k,v])=>`<option value="${k}" ${L.mon===k?'selected':''}>${v[0]}</option>`).join('')}</select>
    <div class="fright">${dlBtn('m-list','Export '+rows.length.toLocaleString('id-ID'))}</div></div>
  <div class="tbl-wrap"><table class="mt"><thead><tr><th>AWB</th><th>Created</th><th>Shopper</th><th>Destination</th><th>Courier</th><th>Payment</th><th>Shipment status</th><th>Monitoring</th><th>Updated</th></tr></thead><tbody>
  ${rows.length?rows.slice(L.pg*PERL,L.pg*PERL+PERL).map(s=>`<tr data-sid="${s.id}">${awbTd(s)}<td class="date">${fdate(s.created)}</td><td class="cust"><b>${esc(s.name)}</b><span>${fphone(s.phone)}</span></td><td>${esc(s.area.kec)}<span class="src">${esc(s.area.city)}</span></td>${cTd(s)}<td>${s.pay==='cod'?`<span class="st pu sm">COD</span> <span class="num">${rp(s.val)}</span>`:'<span class="st gr sm">Non-COD</span>'}</td><td>${stPill3(s.st)}</td><td>${monPill(monOf(s))}</td><td class="upd">${ago(s.upd)}</td></tr>`).join('')
    :`<tr><td colspan="9" style="height:auto;border:0;cursor:default"><div class="empty"><b>No shipments match</b>Try another AWB, or clear the filters.</div></td></tr>`}</tbody></table></div>
  <div class="foot"><span><b>${rows.length.toLocaleString('id-ID')}</b> ${rows.length===1?'shipment':'shipments'}</span><div class="pager"><button class="btn btn-o" data-lpg="-1" ${L.pg?'':'disabled'}>Previous</button><button class="btn btn-o" data-lpg="1" ${L.pg<pages-1?'':'disabled'}>Next</button></div></div>`}

/* ---- Tickets ---- */
function monTickets(){DL['m-tickets']=()=>['flik-tickets',['Ticket','Type','AWB','Channel','Status','Created','Last update','Note'],TK.map(t=>[t.id,TKT[t.type][0],t.awb||'',t.ch,TKST[t.st][0],fdateY(t.created),fdateY(t.log[0][1]),t.note])];
  return secH('Tickets','Claims and follow-ups go to FLIK support. Messages to shoppers go out on WhatsApp through Qontak, and replies land here.','m-tickets',`<span class="st ok sm">${ic('check',12,2.4)}Qontak connected</span>`)+
  `<div class="tbl-wrap"><table class="mt"><thead><tr><th>Ticket</th><th>Type</th><th>AWB</th><th>Channel</th><th>Status</th><th>Created</th><th>Last update</th></tr></thead><tbody>
  ${TK.length?TK.map(t=>`<tr data-tk="${t.id}"><td class="mono">${t.id}</td><td>${TKT[t.type][0]}</td><td class="mono">${t.awb||'—'}</td><td>${t.ch}</td><td><span class="st ${TKST[t.st][1]} sm">${TKST[t.st][0]}</span></td><td class="date">${fdate(t.created)}</td><td class="upd">${ago(t.log[0][1])}</td></tr>`).join('')
    :`<tr><td colspan="7" style="height:auto;border:0;cursor:default"><div class="empty"><b>No tickets</b>Actions you take in Needs resolving create tickets here.</div></td></tr>`}</tbody></table></div>`}

/* ---- Shipment drawer: details, issue, tracking history ---- */
function timeline(s){const sv=SERVICES[s.svc],w=whByCode(s.wh),at=f=>new Date(s.created.getTime()+(s.upd-s.created)*f),from=w?w.city:'Warehouse',to=s.area.city;
  const ev=[['Booked with FLIK Shipping',from,s.created,'']];if(s.st==='pickup')return ev.reverse();
  ev.push(['Picked up by '+cName(s.k),from,at(.12),''],['Left sorting hub',from,at(.3),''],['Arrived at delivery hub',to,at(.62),'']);
  if(['ofd','delivered','failed','returning','returned'].includes(s.st))ev.push(['Out for delivery',to,at(.82),'']);
  if(s.st==='delivered')ev.push([`Delivered, received by ${s.name.split(' ')[0]}`,to,s.upd,'ok']);
  if(s.st==='failed')ev.push([s.tries>=2?'Delivery attempt 2 failed: shopper not at home':'Delivery failed: address not found. Next attempt tomorrow',to,s.upd,'warn']);
  if(s.st==='returning'||s.st==='returned')ev.push(['Delivery attempt 2 failed: shopper refused the parcel',to,at(.88),'warn'],['Return started',to,at(.92),'warn']);
  if(s.st==='returned')ev.push(['Returned to sender',from,s.upd,'bad']);if(s.st==='lost')ev.push(['Reported lost at the sorting hub',to,s.upd,'bad']);
  return ev.reverse()}
function openShipment(id){const s=SH.find(x=>x.id===id);if(!s)return;const is=issueOf(s),m=monOf(s),t=s.tk&&TK.find(k=>k.id===s.tk);
  drawer.innerHTML=`<div class="dh"><span class="kind">${ic('truck',15)}Shipment</span><button class="ib" data-dclose aria-label="Close">${ic('x',18)}</button></div>
  <div class="db"><div class="d-hd"><b class="mono">${s.awb||'AWB after pickup'}</b><div class="pills">${stPill3(s.st)} ${monPill(m)} ${sevPill3(m)}</div></div>
  ${is&&rstate(s)==='open'?`<div class="d-iss"><b>${is.t}</b><span>${is.next}</span><div class="d-acts">${['claim','support','customer'].map(a=>`<button class="btn ${a===is.act?'btn-p':'btn-o'}" data-act="${s.id}" data-a="${a}">${TKT[a][1]}</button>`).join('')}</div></div>`:''}
  ${t?`<div class="d-tk">${ic('ticket',16)}<span><b>${t.id}</b> · ${TKT[t.type][0]} · ${t.ch}</span><span class="st ${TKST[t.st][1]} sm">${TKST[t.st][0]}</span><button class="lnk" data-tk="${t.id}">Open</button></div>`:''}
  <div class="dsec"><h5>Details</h5><dl class="kv"><dt>Courier</dt><dd><div class="sx-cl">${cLogo(s.k)}<span>${cName(s.k)} ${SERVICES[s.svc][1]}</span></div></dd><dt>Batch</dt><dd class="mono">${s.batch}</dd><dt>Pickup from</dt><dd>${esc((whByCode(s.wh)||{}).n||s.wh)} · ${s.wh}</dd><dt>Created</dt><dd>${fdateY(s.created)}</dd>
    <dt>Shopper</dt><dd>${esc(s.name)}<span class="src">${fphone(s.phone)}</span></dd><dt>Address</dt><dd>${esc(s.street)}, ${esc(areaTx(s.area))}, ${esc(s.area.prov)} ${s.area.zip}</dd>
    <dt>Product</dt><dd>${esc(s.items)} ×${s.qty} · ${s.kg} kg</dd><dt>Payment</dt><dd>${s.pay==='cod'?`COD · ${rp(s.val)}`:`Non-COD · goods ${rp(s.val)}`}</dd><dt>Shipping</dt><dd class="num"><s class="inv-sub">${rp(s.pub)}</s> ${rp(s.cost)}${s.codFee?` · COD fee ${rp(s.codFee)}`:''}</dd><dt>Shopper score</dt><dd>${scorePill(shopperScore(s.phone,s.area))}</dd></dl></div>
  <div class="dsec"><h5>Tracking history</h5><div class="tl">${timeline(s).map(e=>`<div class="tli ${e[3]}"><i>${e[3]==='ok'?ic('check',11,3):''}</i><div><b>${e[0]}</b><span>${e[1]} · ${fdateY(e[2])}</span></div></div>`).join('')}</div>
    ${s.st==='delivered'||s.st==='returned'?`<div class="trk-pod" style="margin-top:12px"><button data-toast="Opens the photo from the courier">${ic('pkg',18)}Photo</button><button data-toast="Opens the recipient's signature">${ic('doc',18)}Signature</button></div>`:''}</div></div>`;
  openDrawer();track('shipment_opened',{monitoring:m})}

/* ---- Actions → tickets ---- */
function actionModal(id,type){const s=SH.find(x=>x.id===id),is=issueOf(s)||{t:''};let note='';
  const body=type==='claim'?`<div class="fld"><label for="tk-r">What happened</label><select id="tk-r"><option>Lost in transit</option><option>Arrived damaged</option><option>Items missing</option></select></div><div class="fld"><label for="tk-v">Claim value</label><div class="pre"><em>Rp</em><input id="tk-v" value="${s.val.toLocaleString('id-ID')}"></div></div><div class="fld"><label>Proof</label><button class="vf-up" data-toast="Opens file picker">${ic('upload',16)}Add photos or the invoice</button></div>`
    :type==='support'?`<div class="fld"><label for="tk-r">What should FLIK do</label><select id="tk-r"><option>Chase the courier for an update</option><option>Reschedule the pickup</option><option>Change the delivery address</option><option>Hold and return the parcel</option></select></div>`
    :`<div class="fld"><label>To</label><div class="tk-to">${ic('chat2',16)}<span><b>${esc(s.name)}</b> · ${fphone(s.phone)} · WhatsApp through Qontak</span></div></div><div class="fld"><label for="tk-m">Message</label><textarea id="tk-m" rows="5">Halo ${esc(s.name.split(' ')[0])}, ini Aruna Studio. Kurir ${cName(s.k)} belum berhasil mengantar paket Anda (${s.awb}). Boleh konfirmasi alamat dan waktu yang pas untuk pengantaran? Terima kasih.</textarea></div>`;
  modal.innerHTML=`<div class="mh"><h3>${TKT[type][1]}</h3><button class="ib" data-mclose aria-label="Close">${ic('x',18)}</button></div>
  <div class="mb"><div class="tk-s">${cLogo(s.k)}<span><b class="mono">${s.awb||'—'}</b> · ${esc(is.t)}</span>${monPill(monOf(s))}</div>${body}<div class="fld"><label for="tk-n">Note ${type==='customer'?'(internal)':''}</label><input id="tk-n" placeholder="Optional"></div></div>
  <div class="mf"><button class="btn btn-o" data-mclose>Cancel</button><button class="btn btn-p" id="tk-go">${type==='customer'?'Send on WhatsApp':type==='claim'?'File claim':'Send to FLIK support'}</button></div>`;
  mscrim.classList.add('open');
  document.getElementById('tk-go').onclick=async()=>{note=document.getElementById('tk-n').value;const r=document.getElementById('tk-r');await FLIK.api.createTicket({awb:s.awb,type,reason:r?r.value:'',note});
    const t=addTicket(s,type,'Merchant',NOW,(r?r.value+'. ':'')+note);closeModal();closeDetail();track('issue_action_taken',{action:type,monitoring:monOf(s)});
    toast(`${t.id} created. It's now in Acknowledged`);renderMon()}}
function ticketDrawer(id){const t=TK.find(k=>k.id===id),s=SH.find(x=>x.id===t.sid);
  drawer.innerHTML=`<div class="dh"><span class="kind">${ic('ticket',15)}Ticket</span><button class="ib" data-dclose aria-label="Close">${ic('x',18)}</button></div>
  <div class="db"><div class="d-hd"><b class="mono">${t.id}</b><div class="pills"><span class="st ${TKST[t.st][1]} sm">${TKST[t.st][0]}</span></div></div>
  <div class="dsec"><dl class="kv"><dt>Type</dt><dd>${TKT[t.type][0]}</dd><dt>Channel</dt><dd>${t.ch}</dd><dt>Shipment</dt><dd><button class="lnk mono" data-sid2="${s.id}">${s.awb||s.id}</button> ${monPill(monOf(s))}</dd><dt>Created</dt><dd>${fdateY(t.created)}</dd>${t.note?`<dt>Note</dt><dd>${esc(t.note)}</dd>`:''}</dl></div>
  <div class="dsec"><h5>Updates</h5><div class="tl">${t.log.map((l,i)=>`<div class="tli ${i===0&&t.st==='resolved'?'ok':''}"><i>${i===0&&t.st==='resolved'?ic('check',11,3):''}</i><div><b>${esc(l[0])}</b><span>${fdateY(l[1])}</span></div></div>`).join('')}</div></div>
  ${t.st!=='resolved'?`<div class="dsec proto"><h5>Prototype</h5><p class="d-sub">Simulate the courier's next update for this shipment.</p><div class="d-acts"><button class="btn btn-o" id="tk-sim">${s.st==='returning'?'Parcel returned to you':'Courier delivers it'}</button></div></div>`:''}</div>`;
  openDrawer();
  const b=document.getElementById('tk-sim');if(b)b.onclick=()=>{s.st=s.st==='returning'?'returned':'delivered';s.upd=new Date(NOW.getTime()+5*60000);t.st='resolved';
    t.log.unshift([s.st==='delivered'?`${cName(s.k)}: delivered. Ticket closed`:'Returned to sender. Ticket closed',s.upd]);toast(`${t.id} resolved: the shipment is safe`);ticketDrawer(id);renderMon()}}

/* ---- events ---- */
document.getElementById('view-mon').addEventListener('click',e=>{const t=e.target.closest('button,tr,select');if(!t)return;const d=t.dataset;
  if(t.tagName==='SELECT')return;
  if(d.mt){MS.tab=d.mt;renderMon();return}
  if(d.fc){e.stopPropagation();fpop(t,d.fc);return}
  if('fclear' in d){MS.f={wh:'',k:'',pay:''};renderMon();return}
  if(d.bt){MS.open.has(d.bt)?MS.open.delete(d.bt):MS.open.add(d.bt);track('batch_expanded',{});renderMon();return}
  if('allb' in d){MS.allB=!MS.allB;renderMon();return}
  if(d.rt){MS.rt=d.rt;renderMon();return}
  if(d.act){e.stopPropagation();actionModal(d.act,d.a);return}
  if(d.actm){e.stopPropagation();if(popFor===t){closePop();return}popFor=t;const s=SH.find(x=>x.id===d.actm);
    pop.innerHTML=`<div class="menu">${['claim','support','customer'].map(a=>`<button class="opt" data-pa="${a}">${ic(a==='claim'?'shield':a==='support'?'chat2':'phone2',15)}${TKT[a][1]}</button>`).join('')}<button class="opt" data-pa="open">${ic('ext',15)}Open shipment</button></div>`;
    pop.querySelectorAll('[data-pa]').forEach(o=>o.onclick=()=>{closePop();o.dataset.pa==='open'?openShipment(s.id):actionModal(s.id,o.dataset.pa)});placePop(t,true);return}
  if(d.tk){e.stopPropagation();ticketDrawer(d.tk);return}
  if(d.ha){MS.hArea=d.ha;renderMon();return}
  if(d.perf){MS.perf=d.perf;renderMon();return}
  if(d.lpg){MS.l.pg+=+d.lpg;renderMon();return}
  if(d.sid){openShipment(d.sid)}});
document.getElementById('view-mon').addEventListener('change',e=>{const k=e.target.dataset.lf;if(k){MS.l[k]=e.target.value;MS.l.pg=0;renderMon()}});
let msT;document.getElementById('view-mon').addEventListener('input',e=>{if(e.target.id!=='ms-q')return;MS.l.q=e.target.value;MS.l.pg=0;clearTimeout(msT);msT=setTimeout(()=>{renderMon();const q=document.getElementById('ms-q');q.focus();q.setSelectionRange(q.value.length,q.value.length)},250)});
drawer.addEventListener('click',e=>{const a=e.target.closest('[data-act]');if(a){actionModal(a.dataset.act,a.dataset.a);return}const k=e.target.closest('[data-tk]');if(k){ticketDrawer(k.dataset.tk);return}const s=e.target.closest('[data-sid2]');if(s)openShipment(s.dataset.sid2)});
