/* ===== Shipping › Monitoring: what needs action, at the level of detail of AG's Loanbook =====
 * Tabs: Summary (batches, needs resolving), Health, Courier performance, All shipments, Claims, Tickets.
 * Every section exports straight to the device.
 */
document.querySelector('.main').insertAdjacentHTML('beforeend','<main class="content" id="view-mon" hidden></main>');
const MS={cl:{st:'',cat:''},tab:'summary',days:30,f:{wh:'',k:'',pay:''},rt:'open',open:new Set(),allB:false,perf:'city',hArea:'city',
  l:{q:'',st:'',mon:'',pg:0,sel:new Set()},reset(){this.cl={st:'',cat:''};this.tab='summary';this.f={wh:'',k:'',pay:''};this.rt='open';this.open=new Set();this.allB=false;this.l={q:'',st:'',mon:'',pg:0,sel:new Set()}}};
const MTABS=[['summary','Summary'],['health','Health'],['perf','Courier performance'],['list','All shipments'],['claims','Claims'],['tickets','Tickets']];
/* period: 'today', 'yday', a number of days, or 0 for all time */
const dayStart=(o=0)=>{const d=new Date(NOW);d.setHours(0,0,0,0);return new Date(d-o*DAY)};
const inPeriod=d=>MS.days==='today'?d>=dayStart():MS.days==='yday'?d>=dayStart(1)&&d<dayStart():!MS.days||d>=new Date(NOW-MS.days*DAY);
const periodTx=()=>MS.days==='today'?'Today':MS.days==='yday'?'Yesterday':MS.days?`Last ${MS.days} days`:'All time';
const msBase=()=>SH.filter(s=>inPeriod(s.created)&&(!MS.f.wh||s.wh===MS.f.wh)&&(!MS.f.k||s.k===MS.f.k)&&(!MS.f.pay||s.pay===MS.f.pay));
const finL=l=>l.filter(s=>s.st==='delivered'||s.st==='returned'||s.st==='lost');
const srL=l=>{const f=finL(l);return f.length?pct(f.filter(s=>s.st==='delivered').length,f.length):null};
const sevRank=s=>{const m=monOf(s);return SEV3[m]?SEV3[m][2]:9};
const awbTd=s=>`<td class="mono">${s.awb||'<span class="inv-sub">After pickup</span>'}</td>`;
const cTd=s=>`<td><div class="sx-cl">${cLogo(s.k)}<span>${cName(s.k)}</span></div></td>`;
const secH=(t,sub,dl,extra='')=>`<div class="sec-h"><div><h2 class="sec">${t}</h2>${sub?`<p class="sec-sub">${sub}</p>`:''}</div><div class="sec-a">${extra}${dl?dlBtn(dl):''}</div></div>`;
const SHIP_HEAD=['AWB','Batch','Created','Shipment status','Monitoring status','Issue type','Courier','Service','Updated','Shopper name','Shopper phone','Street','Kelurahan','Kecamatan','City','Province','Postcode','Pickup from','Payment','COD / goods value','Published rate','Shipping cost','COD fee','Product','Qty','Weight (kg)','Ticket'];
const shipRow=s=>[s.awb||'',s.batch,fdateY(s.created),SST3[s.st][0],MON3[monOf(s)][0],ityTx((issueOf(s)||{}).ty),cName(s.k),SERVICES[s.svc][1],fdateY(s.upd),s.name,'+'+s.phone,s.street,s.area.kel,s.area.kec,s.area.city,s.area.prov,s.area.zip,s.wh,s.pay==='cod'?'COD':'Non-COD',s.val,s.pub,s.cost,s.codFee,s.items,s.qty,s.kg,s.tk||''];

function renderMon(){const el=document.getElementById('view-mon');
  if(!SH.length){el.innerHTML=`<h1>Monitoring</h1><section class="card w-empty"><span class="qic">${ic('pulse',22,1.6)}</span><div><b>Nothing to monitor yet</b><span>After your first shipment, this page shows each batch, anything delayed or at risk, and how each courier performs for you.</span></div><button class="btn btn-p" data-newshp>Create shipment</button></section>`;return}
  const base=msBase(),open=SH.filter(s=>rstate(s)==='open').length;
  el.innerHTML=`<div class="ph"><h1>Monitoring</h1><button class="btn btn-p" data-newshp>${ic('plus',15,2)}Create shipment</button></div>
  <div class="tabs" role="tablist">${MTABS.map(t=>`<button class="tab${MS.tab===t[0]?' on':''}" data-mt="${t[0]}">${t[1]}${t[0]==='summary'&&open?`<span class="badge">${open}</span>`:t[0]==='tickets'&&TK.filter(k=>k.st!=='resolved').length?`<span class="ct">${TK.filter(k=>k.st!=='resolved').length}</span>`:t[0]==='claims'&&CL.filter(clNeeds).length?`<span class="ct">${CL.filter(clNeeds).length}</span>`:''}</button>`).join('')}</div>
  <div class="filters">${fchip('days','Created',periodTx())}${fchip('wh','Warehouse',MS.f.wh)}${fchip('k','Courier',MS.f.k&&cName(MS.f.k))}${fchip('pay','Payment',MS.f.pay&&(MS.f.pay==='cod'?'COD':'Non-COD'))}
    ${MS.f.wh||MS.f.k||MS.f.pay?'<button class="lnk" data-fclear>Clear filters</button>':''}<div class="fright"><span class="ms-n">${plural(base.length,'shipment')}</span></div></div>
  <div id="mon-body">${({summary:monSummary,health:monHealth,perf:monPerf,list:monList,claims:monClaims,tickets:monTickets})[MS.tab](base)}</div>`;
  track('monitoring_viewed',{tab:MS.tab})}
const fchip=(k,l,v)=>`<button class="chip${v?' set':''}" data-fc="${k}">${v?'':ic('pluscirc')}<span>${l}</span>${v?` <span class="val">${esc(v)}</span>`:''}</button>`;
function fpop(b,k){if(popFor===b){closePop();return}popFor=b;
  const O=k==='days'?[['today','Today'],['yday','Yesterday'],[7,'Last 7 days'],[30,'Last 30 days'],[90,'Last 90 days'],[0,'All time']]:k==='wh'?[['','All warehouses'],...WH.map(w=>[w.code,`${w.n} · ${w.code}`])]:k==='k'?[['','All couriers'],...COURIERS.map(c=>[c.k,c.n])]:[['','COD and non-COD'],['cod','COD'],['non','Non-COD']];
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
  return tiles(base)+waHtml()+secH('Batches','Click a batch to see its shipments.','m-batches')+
  `<div class="bt-g">${shown.map(x=>{const o=MS.open.has(x.b.id);return`<div class="bt${o?' open':''}"><button class="bt-c" data-bt="${x.b.id}" aria-expanded="${o}">
    <div class="bt-h"><span class="mono">${x.b.id}</span>${x.b.auto?`<span class="st ok sm" title="Booked automatically when the shopper confirmed or paid on WhatsApp">${ic('chat2',11)}Auto-booked</span>`:''}${x.issues?`<span class="st warn sm">${x.issues} to resolve</span>`:''}<span class="chev">${ic('chev',15)}</span></div>
    <div class="bt-k">${cLogo(x.b.k)}<span>${cName(x.b.k)} ${SERVICES[x.b.svc][1]}</span><span class="src">· ${fdate(x.b.created)}</span></div>
    <dl class="bt-n"><div><dt>Shipments</dt><dd>${x.n}</dd></div><div><dt>Delivered</dt><dd>${x.del}</dd></div><div><dt>Returned</dt><dd>${x.ret}</dd></div><div><dt>Success</dt><dd>${x.sr==null?'—':fpct(x.sr)}</dd></div></dl>
    <span class="bar"><i style="width:${x.sr||0}%"></i></span></button>
    ${o?batchList(x):''}</div>`}).join('')}</div>
  ${bs.length>9?`<div class="sx-row" style="justify-content:center"><button class="btn btn-o" data-allb>${MS.allB?'Show fewer':`Show all ${bs.length} batches`}</button></div>`:''}
  ${resolveHtml(base)}`}
/* ---- Orders waiting for a Risky shopper to confirm or pay on WhatsApp; each books itself when they answer ---- */
const drAct=p=>p.st==='later'?`<button class="btn btn-o" data-waship="${p.id}">${ic('truck',14)}Ship anyway</button><button class="dots-b" data-wam="${p.id}" aria-label="Other actions">${ic('dots',16)}</button>`
  :p.st==='sent'?`<button class="btn btn-o" data-wasim="${p.id}" title="Prototype: the shopper's answer">${ic('chat2',14)}${p.kind==='pay'?'Shopper pays':'Shopper confirms'}</button><button class="dots-b" data-wam="${p.id}" aria-label="Other actions">${ic('dots',16)}</button>`:'';
const DRORD={later:0,sent:1};
const waOpen=()=>PEND.filter(p=>p.st==='sent'||p.st==='later');
function waHtml(){const A=waOpen().sort((a,b)=>DRORD[a.st]-DRORD[b.st]||a.sent-b.sent);if(!A.length)return'';const L=MS.allD?A:A.slice(0,6),later=A.filter(p=>p.st==='later').length,quiet=A.filter(p=>p.st==='sent'&&NOW-p.sent>=WA_HOURS*HOUR).length;
  DL['m-wa']=()=>['flik-waiting-for-shopper',['Batch','Shopper','Phone','City','Amount','Check','Courier','Status','Since'],A.map(p=>[p.id,p.ship.name,'+'+normPhone(p.ship.phone),p.ship.addr.area.city,+String(p.ship.val).replace(/\D/g,''),DRK[p.kind][0],cName(SERVICES[p.svc][0])+' '+SERVICES[p.svc][1],drLab(p),fdateY(p.sent)])];
  const wait=p=>{const h=(NOW-p.sent)/HOUR;return h<1?`${Math.max(1,Math.round(h*60))} min`:h<48?`${Math.round(h)} h`:`${Math.floor(h/24)} days`};
  return secH('Risky shoppers',`Orders waiting for the shopper's answer on WhatsApp, or for your decision. A shopper who confirms or pays gets booked automatically, with an AWB. A shopper who cancels takes the order off this list. Nothing else leaves until you ship it or cancel it.`,'m-wa',`<button class="btn btn-o" data-wset>${ic('chat2',15)}WhatsApp settings</button> `+(later?`<span class="st gr sm">${later} for you to decide</span> `:'')+(quiet?`<span class="st warn sm">${quiet} no answer for ${WA_HOURS} h+</span>`:''))+
  `<div class="tbl-wrap"><table class="mt"><thead><tr><th>Batch</th><th>Shopper</th><th>Destination</th><th class="r">Amount</th><th>Courier</th><th>Status</th><th>Waiting</th><th class="r">Action</th></tr></thead><tbody>
  ${L.map(p=>{const s=p.ship,q=p.st==='sent'&&NOW-p.sent>=WA_HOURS*HOUR;return`<tr data-wa="${p.id}"><td class="mono">${p.id}</td><td><b>${esc(s.name)}</b><span class="src">${fphone(s.phone)}</span></td><td>${esc(s.addr.area.kec)}<span class="src">${esc(s.addr.area.city)}</span></td><td class="r num">${rp(+s.val)}<span class="src">${s.pay==='cod'?'COD':'Paid · non-COD'}</span></td><td><div class="sx-cl">${cLogo(SERVICES[p.svc][0])}<span>${cName(SERVICES[p.svc][0])} ${SERVICES[p.svc][1]}</span></div></td>
    <td><span class="st ${DRST[p.st][1]} sm">${drLab(p)}</span>${q?'<span class="src wa-q">No answer yet</span>':`<span class="src">${DRK[p.kind][0]}</span>`}</td><td class="upd">${wait(p)}</td>
    <td class="r act">${drAct(p)}</td></tr>`}).join('')}</tbody></table></div>${A.length>6?`<div class="sx-row" style="justify-content:center"><button class="btn btn-o" data-alld>${MS.allD?'Show fewer':`Show all ${A.length}`}</button></div>`:''}`}
function waAct(p,a){if(a==='ya'){const sh=confirmPend(p);track(p.kind==='pay'?'shopper_paid':'shopper_confirmed',{});track('waiting_order_booked',{courier:sh.k});toast(`${p.kind==='pay'?'Paid':'Confirmed'}. ${sh.awb} booked automatically`)}
  else if(a==='batal'){p.st='declined';p.log.unshift(['Shopper replied BATAL. Order cancelled, nothing charged',NOW]);track('shopper_declined',{});toast('The shopper cancelled. The order is cancelled and nothing was charged')}
  else if(a==='ship'){const sh=sendPend(p,NOW,true);track('waiting_order_shipped_anyway',{from:p.kind});toast(`${sh.awb} booked`)}
  else if(a==='resend'){p.sent=NOW;p.log.unshift([(p.kind==='pay'?'Payment link':'Confirmation')+' sent again',NOW]);p.resent=(p.resent||0)+1;track('risky_resent',{kind:p.kind});toast('Sent again on WhatsApp')}
  else if(a==='sendwa'||a==='sendpay'){p.kind=a==='sendwa'?'wa':'pay';p.tpl=TPL[p.kind];p.st='sent';p.sent=NOW;p.log.unshift([p.kind==='pay'?'Payment link sent on WhatsApp from FLIK':'Confirmation sent on WhatsApp from FLIK',NOW]);track('risky_check_sent',{kind:p.kind,from:'later'});toast('Sent on WhatsApp')}
  else if(a==='cancel'){p.st='cancelled';p.log.unshift(['Cancelled by you. Nothing charged',NOW]);track('risky_cancelled',{from:p.kind});toast('Cancelled. Nothing was charged')}
  closeDetail();renderMon()}
function waDrawer(id){drawer.classList.remove('chat');const p=PEND.find(x=>x.id===id),s=p.ship,sc=shopperScore(s.phone,s.addr.area,{val:s.val,street:s.addr.street}),ok=p.st==='booked';
  drawer.innerHTML=`<div class="dh"><span class="kind">${ic(p.st==='later'?'clock':'chat2',15)}${p.st==='later'?'Waiting for your decision':'Waiting for the shopper'}</span><button class="ib" data-dclose aria-label="Close">${ic('x',18)}</button></div>
  <div class="db"><div class="d-hd"><b>${p.id} · ${esc(s.name)}</b><div class="pills"><span class="st ${DRST[p.st][1]} sm">${drLab(p)}</span></div></div>
  ${p.st==='later'?'':`<div class="wa-chat"><div class="wa-m out"><span>${esc(waText(p))}</span><em>${fdateY(p.sent)} · from FLIK for ${MERCHANT}</em></div>
    ${ok?`<div class="wa-m in"><span>${p.kind==='pay'?'Pembayaran berhasil ✓':'YA'}</span><em>${p.kind==='pay'?'Payment':'Shopper'}</em></div>`:p.st==='declined'?`<div class="wa-m in"><span>BATAL</span><em>Shopper</em></div>`:''}</div>`}
  <div class="dsec"><dl class="kv"><dt>Score now</dt><dd>${scorePill(sc)}<span class="src">${esc(sc.why)}</span></dd><dt>${s.pay==='cod'?'COD':'Paid by shopper'}</dt><dd class="num">${rp(+s.val)}</dd><dt>Ships from</dt><dd>${esc(whByCode(s.wh).n)} (${s.wh})</dd><dt>Courier</dt><dd><div class="sx-cl">${cLogo(SERVICES[p.svc][0])}<span>${cName(SERVICES[p.svc][0])} ${SERVICES[p.svc][1]}</span></div></dd><dt>Address</dt><dd>${esc(s.addr.street)}, ${esc(areaTx(s.addr.area))}</dd>${p.sid?`<dt>Shipment</dt><dd><button class="lnk mono" data-sid2="${p.sid}">${p.awb}</button></dd>`:''}</dl></div>
  <div class="dsec"><h5>Log</h5><div class="tl">${p.log.map((l,i)=>`<div class="tli ${i===0&&(p.st==='booked'||p.st==='shipped')?'ok':''}"><i>${i===0&&(p.st==='booked'||p.st==='shipped')?ic('check',11,3):''}</i><div><b>${esc(l[0])}</b><span>${fdateY(l[1])}</span></div></div>`).join('')}</div></div>
  ${p.st==='later'?`<div class="d-acts"><button class="btn btn-p" data-waa="ship">Ship anyway</button><button class="btn btn-o" data-waa="sendwa">Confirm on WhatsApp</button><button class="btn btn-o" data-waa="sendpay">Send a payment link</button><button class="btn btn-o" data-waa="cancel">Cancel order</button></div>`:''}
  ${p.st==='sent'?`<div class="d-acts"><button class="btn btn-o" data-waa="ship">Ship now without waiting</button>${p.resent?'':'<button class="btn btn-o" data-waa="resend">Send again</button>'}<button class="btn btn-o" data-waa="cancel">Cancel order</button></div>
  <div class="dsec proto"><h5>Prototype</h5><p class="d-sub">Simulate the shopper's answer.</p><div class="d-acts"><button class="btn btn-o" data-waa="ya">${p.kind==='pay'?'Shopper pays':'Shopper replies YA'}</button><button class="btn btn-o" data-waa="batal">Shopper replies BATAL</button></div></div>`:''}</div>`;
  openDrawer();drawer.onclick=e=>{const b=e.target.closest('[data-waa]');if(b)waAct(p,b.dataset.waa)};track('draft_opened',{status:p.st,kind:p.kind})}
function batchList(x){const id='m-b-'+x.b.id;DL[id]=()=>['flik-'+x.b.id,SHIP_HEAD,x.s.map(shipRow)];
  return`<div class="bt-l"><div class="sec-h"><b>${plural(x.n,'shipment')} in ${x.b.id}</b><div class="sec-a"><button class="btn btn-o" data-prbt="${x.b.id}">${ic('print',15)}Print ${plural(x.s.filter(s=>s.awb).length,'label')}</button>${dlBtn(id)}</div></div><div class="tbl-wrap"><table class="mt"><thead><tr><th>AWB</th><th>Created</th><th>Shipment status</th><th>Monitoring</th><th>Courier</th><th>Updated</th><th>Shopper</th><th>Phone</th></tr></thead><tbody>
  ${x.s.map(s=>`<tr data-sid="${s.id}">${awbTd(s)}<td class="date">${fdate(s.created)}</td><td>${stPill3(s.st)}</td>${monIssTd(s)}${cTd(s)}<td class="upd">${ago(s.upd)}</td><td>${esc(s.name)}</td><td class="mono">${fphone(s.phone)}</td></tr>`).join('')}</tbody></table></div></div>`}
/* ---- Needs resolving: every shipment that isn't Safe or On track and has no ticket yet, grouped by monitoring status.
   Taking an action opens a ticket, and the shipment moves to the Tickets tab (AG, 25 Oct) ---- */
/* one Issue cell instead of three (Reza, 27 Oct): the issue type says what happened, the line under it says what to do */
const isDetail=s=>s.st==='failed'&&s.tries>=2?`Attempt ${s.tries}. `:s.rtLost?`Stuck for ${ageTx((NOW-s.retSince)/DAY)}. `:'';
const monIssTd=s=>{const is=issueOf(s);return`<td class="mon-is">${monPill(monOf(s))}${is?`<span>${ITY[is.ty][1]}</span>`:''}</td>`};
const ityTd=ty=>ty&&ITY[ty]?`<td class="ity"><span>${ITG[ITY[ty][0]]}</span><b>${ITY[ty][1]}</b></td>`:'<td class="ity"><span>—</span></td>';
/* issue type filter, shared by Needs resolving and Tickets: a group (pk) or one type (pk_late) */
const ityIn=ty=>!MS.ity||ty===MS.ity||(ty&&ITY[ty]&&ITY[ty][0]===MS.ity);
const ityFilter=tys=>{const n=k=>tys.filter(t=>t===k||(ITY[t]&&ITY[t][0]===k)).length;
  return`<label class="ity-f">Issue type <select data-ityf><option value="">All · ${tys.length}</option>${Object.entries(ITG).map(([g,gn])=>`<optgroup label="${gn}"><option value="${g}"${MS.ity===g?' selected':''}>All ${gn.toLowerCase()} · ${n(g)}</option>${Object.entries(ITY).filter(([,v])=>v[0]===g).map(([k,v])=>`<option value="${k}"${MS.ity===k?' selected':''}>${gn} / ${v[1]} · ${n(k)}</option>`).join('')}</optgroup>`).join('')}</select></label>`};
const RGRP=[['problem','Lost, damaged, stuck on the way back, or returned without your confirmation.'],['risk','Delivery failed, or the shopper rejected the parcel or says they never ordered. Act before the next attempt.'],['delayed','Still on the way, but past the courier\'s SLA for this route.']];
const slaTd=s=>`<td class="num">${s.st==='pickup'?`Pickup ${PICKUP_SLA} d`:`${slaOf(s)} d`}</td>`;
const ageTd=s=>{const d=ageDays(s),o=d-slaOf(s);return`<td class="age${o>0?' over':''}"><b class="num">${ageTx(d)}</b>${o>0?`<span>${ageTx(o)} over</span>`:`<span>${ageTx(slaOf(s)-d)} left</span>`}</td>`};
function resolveHtml(base){const all=base.filter(needsAct),pool=all.filter(s=>ityIn(issueOf(s).ty)),by=m=>pool.filter(s=>monOf(s)===m).sort((a,b)=>(ageDays(b)-slaOf(b))-(ageDays(a)-slaOf(a)));
  DL['m-resolve']=()=>['flik-needs-resolving',['AWB','Courier','Shipment status','Monitoring status','Issue group','Issue type','Issue','SLA (days)','Age (days)','Over SLA (days)','Shopper name','Shopper phone','City'],RGRP.flatMap(([m])=>by(m)).map(s=>[s.awb||'',cName(s.k),SST3[s.st][0],MON3[monOf(s)][0],ITG[ITY[issueOf(s).ty][0]],ITY[issueOf(s).ty][1],issueOf(s).t,slaOf(s),Math.round(ageDays(s)*10)/10,Math.max(0,Math.round((ageDays(s)-slaOf(s))*10)/10),s.name,'+'+s.phone,s.area.city])];
  const row=s=>{const is=issueOf(s);return`<tr data-sid="${s.id}">${awbTd(s)}${cTd(s)}<td>${stPill3(s.st)}</td><td class="nx"><b>${ityTx(is.ty)}</b><span>${isDetail(s)}${is.next}</span>${s.st==='failed'&&PS.boost&&s.pay==='cod'?`<span class="st pu sm boost">${ic('chat2',11)}Boost sent on WhatsApp</span>`:''}</td>${slaTd(s)}${ageTd(s)}
    <td class="r act">${s.st==='failed'?`<button class="btn btn-o" data-ndrgo="${s.id}">Reattempt</button>`:`<button class="btn btn-o" data-act="${s.id}" data-a="${is.act}">${TKT[is.act][1]}</button>`}<button class="dots-b" data-actm="${s.id}" aria-label="Other actions">${ic('dots',16)}</button></td></tr>`};
  return secH('Needs resolving',`${plural(all.length,'shipment')} that aren't safe or on track and have no ticket yet. Age counts from pickup; the SLA is the courier's promise for that route. Taking an action opens a ticket, and you follow it in Tickets.${PS.boost?' Delivery Boost is on: shoppers with a failed COD delivery get a WhatsApp to agree a time.':''}`,'m-resolve',`<button class="btn btn-o" data-wset>${ic('chat2',15)}Delivery Boost ${PS.boost?'on':'off'}</button> `)+
  (all.length?`<div class="ity-bar">${ityFilter(all.map(s=>issueOf(s).ty))}${MS.ity?`<button class="lnk" data-ityf-clear>Clear</button>`:''}</div>`:'')+(pool.length?`<div class="tbl-wrap"><table class="mt rg"><thead><tr><th>AWB</th><th>Courier</th><th>Shipment status</th><th>Issue</th><th>SLA</th><th>Age</th><th class="r">Action</th></tr></thead>
  ${RGRP.map(([m,tx])=>{const l=by(m);return l.length?`<tbody><tr class="grp nohover"><td colspan="7">${monPill(m)} <b class="num">${l.length}</b><span>${tx}</span></td></tr>${l.slice(0,MS.allR&&MS.allR[m]?l.length:25).map(row).join('')}${l.length>25?`<tr class="nohover"><td colspan="7" style="text-align:center"><button class="lnk" data-allr="${m}">${MS.allR&&MS.allR[m]?'Show fewer':`Show all ${l.length}`}</button></td></tr>`:''}</tbody>`:''}).join('')}</table></div>`
  :all.length?`<p class="sec-sub">No shipment with that issue type.</p>`:`<section class="card w-empty"><span class="qic">${ic('check',22,1.6)}</span><div><b>Nothing needs resolving</b><span>Delayed, at-risk and problem shipments without a ticket show up here.</span></div></section>`)}

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
    <div class="fright">${L.sel.size?`<button class="btn btn-p" data-prsel>${ic('print',15)}Print ${plural(L.sel.size,'label')}</button><button class="lnk" data-prclr>Clear</button>`:''}<button class="btn btn-o" data-prb>${ic('print',15)}Print by batch</button>${dlBtn('m-list','Export '+rows.length.toLocaleString('id-ID'))}</div></div>
  <div class="tbl-wrap"><table class="mt ms-pt"><thead><tr><th class="selc">${(()=>{const pg=rows.slice(L.pg*PERL,L.pg*PERL+PERL).filter(s=>s.awb),on=pg.length&&pg.every(s=>L.sel.has(s.id));return`<button class="ie-chk" data-lselall aria-pressed="${on}" aria-label="Select this page"><span class="cb${on?' on':''}">${on?ic('check',12,3):''}</span></button>`})()}</th><th>AWB</th><th>Created</th><th>Shopper</th><th>Destination</th><th>Courier</th><th>Payment</th><th>Shipment status</th><th>Monitoring</th><th>Updated</th><th></th></tr></thead><tbody>
  ${rows.length?rows.slice(L.pg*PERL,L.pg*PERL+PERL).map(s=>`<tr data-sid="${s.id}"><td class="selc">${s.awb?`<button class="ie-chk" data-lsel="${s.id}" aria-pressed="${L.sel.has(s.id)}" aria-label="Select ${s.awb}"><span class="cb${L.sel.has(s.id)?' on':''}">${L.sel.has(s.id)?ic('check',12,3):''}</span></button>`:''}</td>${awbTd(s)}<td class="date">${fdate(s.created)}</td><td class="cust"><b>${esc(s.name)}</b><span>${fphone(s.phone)}</span></td><td>${esc(s.area.kec)}<span class="src">${esc(s.area.city)}</span></td>${cTd(s)}<td>${s.pay==='cod'?`<span class="st pu sm">COD</span> <span class="num">${rp(s.val)}</span>`:'<span class="st gr sm">Non-COD</span>'}</td><td>${stPill3(s.st)}</td>${monIssTd(s)}<td class="upd">${ago(s.upd)}</td><td class="r">${s.awb?`<button class="ib tt" data-prs="${s.id}" data-tt="Print label" aria-label="Print the label for ${s.awb}">${ic('print',16)}</button>`:''}</td></tr>`).join('')
    :`<tr><td colspan="11" style="height:auto;border:0;cursor:default"><div class="empty"><b>No shipments match</b>Try another AWB, or clear the filters.</div></td></tr>`}</tbody></table></div>
  <div class="foot"><span><b>${rows.length.toLocaleString('id-ID')}</b> ${rows.length===1?'shipment':'shipments'}</span><div class="pager"><button class="btn btn-o" data-lpg="-1" ${L.pg?'':'disabled'}>Previous</button><button class="btn btn-o" data-lpg="1" ${L.pg<pages-1?'':'disabled'}>Next</button></div></div>`}

function printLabels(L,scope){if(!L.length)return;track('labels_printed',{scope,labels:L.length});toast(`Printing ${plural(L.length,'label')} (PDF, 10×10 cm, one per parcel)`)}

/* ---- Claims: lost or damaged parcels the courier owes the merchant for ---- */
const clOpen=c=>c.st==='evidence'||c.st==='filed',clOwed=c=>c.st==='accepted'||c.st==='partial',clNeeds=c=>c.st==='evidence'&&!clDocsDone(c);
const CLTABS=[['','All'],['evidence','Collecting evidence'],['filed','Filed'],['owed','Accepted'],['paid','Paid'],['rejected','Rejected']];
const clIn=(c,f)=>!f||(f==='owed'?clOwed(c):c.st===f);
function monClaims(base){const ids=new Set(base.map(x=>x.id)),all=CL.filter(c=>ids.has(c.sid)),F=MS.cl,rows=all.filter(c=>clIn(c,F.st)&&(!F.cat||c.cat===F.cat));
  DL['m-claims']=()=>['flik-claims',['Claim ID','Case','AWB','Courier','Type','Claim status','Courier reference','Claimed','Accepted','Paid','Loss known','Last update'],rows.map(c=>[c.id,c.tk||'',c.awb||'',cName(c.k),CLCAT[c.cat][0],CLST[c.st][0],c.ref||'',c.amount,c.acc||'',c.paid||'',fdateY(c.known),fdateY(c.log[0][1])])];
  const need=all.filter(clNeeds),owed=all.filter(clOwed),paid=all.filter(c=>c.st==='paid'),rej=all.filter(c=>c.st==='rejected');
  const T=[['Claims',all.length.toLocaleString('id-ID'),compact(sum(all,c=>c.amount))+' claimed'],['Needs your documents',need.length,need.length?'Add them before the courier\'s deadline':'Nothing to add',need.length?'warn':''],
    ['Filed with the courier',all.filter(c=>c.st==='filed').length,compact(sum(all.filter(c=>c.st==='filed'),c=>c.amount))+' waiting for an answer'],['Accepted, not paid yet',owed.length,compact(sum(owed,c=>c.acc))+' paid when the courier pays'],
    ['Paid to your balance',paid.length,compact(sum(paid,c=>c.paid))+' received','ok'],['Rejected',rej.length,compact(sum(rej,c=>c.amount))+' not paid',rej.length?'bad':'']];
  const cats=Object.entries(CLCAT).map(([k,v])=>{const l=all.filter(c=>c.cat===k);return`<button class="cl-c${F.cat===k?' on':''}" data-clcat="${k}"><span>${v[0]}</span><b class="num">${l.length}</b><small>${compact(sum(l,c=>c.amount))} · ${l.filter(clOpen).length} open</small><em>${v[1]}</em></button>`}).join('');
  return`<div class="sx-row cl-top"><p class="sec-sub">When a parcel is lost or damaged, FLIK files the claim with the courier for you. The money reaches your balance once the courier pays.</p><button class="btn btn-p" data-clnew>${ic('plus',15,2)}Report lost or damaged</button></div><div class="kp">${T.map(t=>`<div class="kp-t${t[3]?' '+t[3]:''}"><span>${t[0]}</span><b class="num">${t[1]}</b><small>${t[2]}</small></div>`).join('')}</div>
  ${secH('By type','Pick one to filter the list.','')}<div class="cl-g">${cats}</div>
  ${secH('All claims',`${plural(rows.length,'claim')}${F.cat?` · ${CLCAT[F.cat][0]} <button class="lnk" data-clcat="">Clear</button>`:''}`,'m-claims')}
  <div class="tabs sm" role="tablist">${CLTABS.map(t=>`<button class="tab${F.st===t[0]?' on':''}" data-clst="${t[0]}">${t[1]}<span class="ct">${all.filter(c=>clIn(c,t[0])).length}</span></button>`).join('')}</div>
  <div class="tbl-wrap"><table class="mt cl-t"><thead><tr><th>Claim ID</th><th>AWB</th><th>Courier</th><th>Type</th><th>Claim status</th><th>What's happening</th><th class="r">Claimed</th><th>Last update</th></tr></thead><tbody>
  ${rows.length?rows.map(c=>`<tr data-cl="${c.id}"><td class="mono">${c.id}</td><td class="mono">${c.awb||'—'}</td>${cTd(c)}<td>${CLCAT[c.cat][0]}</td><td><span class="st ${CLST[c.st][1]} sm">${CLST[c.st][0]}</span></td><td class="cl-ln${clNeeds(c)?' due':''}">${esc(clLine(c))}</td><td class="r num">${rp(c.amount)}</td><td class="upd">${ago(c.log[0][1])}</td></tr>`).join('')
    :`<tr><td colspan="8" style="height:auto;border:0;cursor:default"><div class="empty"><b>No claims here</b>Report a parcel from Needs resolving when it's lost or damaged.</div></td></tr>`}</tbody></table></div>`}
function stepper(flow,lab,cur,bad){const at=flow.indexOf(cur);return`<div class="tstp">${flow.map((k,i)=>`<div class="stp-i ${i<at||(i===at&&!bad)?'done':''}${i===at?' cur':''}${i===at&&bad?' bad':''}"><i>${i<at||(i===at&&!bad)?ic('check',10,3):''}</i>${lab[k][0]}</div>`).join('')}</div>`}
const logTl=(log,LAB)=>`<div class="tl">${log.map((l,i)=>{const cl=l[2]&&LAB[l[2]]?LAB[l[2]][1]:'';return`<div class="tli ${i===0?(cl==='ok'?'ok':cl==='bad'?'bad':''):''}"><i>${i===0&&cl==='ok'?ic('check',11,3):''}</i><div><b>${esc(l[0])}</b><span>${l[2]&&LAB[l[2]]?`<em class="st ${LAB[l[2]][1]} sm">${LAB[l[2]][0]}</em> `:''}${fdateY(l[1])}</span></div></div>`}).join('')}</div>`;
/* ---- Reporting a lost or damaged parcel: which type fits this shipment, and why not ---- */
function claimCases(s){const dup=clOf(s),since=(NOW-s.upd)/DAY,out=[];
  {let ok=false,why;
    const late=new Date(s.upd.getTime()+clCfg(s.k).days*DAY);
    if(s.st==='lost'&&late<NOW)why=`${cName(s.k)} reported it lost on ${fdate(s.upd)} and only accepts claims filed within ${plural(clCfg(s.k).days,'day')}. FLIK support can still check it with the courier.`;
    else if(s.st==='lost'){ok=true;why=`${cName(s.k)} reported the parcel lost.`}
    else if(s.rtLost){ok=true;why=`The return has been in transit past its SLA + 3 days, so it counts as lost.`}
    else if(['transit','picked','ofd'].includes(s.st)&&since>=7){ok=true;why='No tracking update for 7 days, so it counts as lost.'}
    else if(['transit','picked','ofd','pickup'].includes(s.st)){why=`The parcel is still on its way. It counts as lost after 7 days with no update (last update ${ago(s.upd)}).`}
    else why='Only parcels the courier lost can be reported as lost.';
    out.push({cat:'lost',ok,why})}
  {let ok=false,why;
    if(s.st==='delivered'&&since<=2){ok=true;why='Delivered less than 2 days ago, so damage can still be reported.'}
    else if(s.st==='delivered')why=`Damage has to be reported within 2 days of delivery. This one was delivered ${Math.floor(since)} days ago.`;
    else why='Only delivered parcels can be reported as damaged.';
    out.push({cat:'dmg',ok,why})}
  if(dup)out.forEach(c=>{if(c.ok){c.ok=false;c.why=`Already claimed in ${dup.id} (${CLST[dup.st][0].toLowerCase()}).`}});return out}
function claimExamples(){const f=fn=>SH.find(fn);return[['Lost parcel',f(s=>s.st==='lost'&&!clOf(s))],['Just delivered',f(s=>s.st==='delivered'&&(NOW-s.upd)/DAY<=2&&!clOf(s))],
  ['Delivered last week',f(s=>s.st==='delivered'&&(NOW-s.upd)/DAY>5)],['Still on the way',f(s=>['transit','picked','ofd'].includes(s.st))]].filter(x=>x[1])}
const docBtns=(cat,docs,attr)=>clNeed(cat).map(d=>`<button class="vf-up${docs[d]?' done':''}" ${attr}="${d}">${ic(docs[d]?'check':'upload',16)}${CLDOCS[d]}${docs[d]?' · added':''}</button>`).join('');
const capNote=s=>clCapped(s)?`<span class="src">The goods value is ${rp(s.val)}. ${cName(s.k)} pays up to ${rp(clAmount(s))} for this parcel.</span>`:'<span class="src">The goods value on the shipment</span>';
function claimModal(sid){const C={sid:sid||null,cat:null,docs:{},q:''};modal.classList.add('nw');
  const draw=()=>{const s=C.sid&&SH.find(x=>x.id===C.sid),cases=s?claimCases(s):[];if(s&&(!C.cat||!cases.find(c=>c.cat===C.cat&&c.ok)))C.cat=(cases.find(c=>c.ok)||{}).cat||null;
    const cur=cases.find(c=>c.cat===C.cat),can=s&&cur&&cur.ok,days=s?clCfg(s.k).days:0;
    modal.innerHTML=`<div class="mh"><h3>Report a lost or damaged parcel</h3><button class="ib" data-mclose aria-label="Close">${ic('x',18)}</button></div>
    <div class="mb">${s?`<div class="tk-s">${cLogo(s.k)}<span><b class="mono">${s.awb||'—'}</b> · ${cName(s.k)} ${SERVICES[s.svc][1]} · ${esc(s.area.city)}</span>${stPill3(s.st)}${sid?'':'<button class="lnk" id="cl-chg">Change</button>'}</div>
      <div class="fld"><label>What happened</label><div class="cl-cases">${cases.map(c=>`<button class="cl-case${c.cat===C.cat?' on':''}" data-cc="${c.cat}" ${c.ok?'':'disabled'}><span class="rdo${c.cat===C.cat?' on':''}"></span><div><b>${CLCAT[c.cat][0]}</b><span>${esc(c.why)}</span></div>${c.ok?'<span class="st ok sm">Can claim</span>':'<span class="st gr sm">Not eligible</span>'}</button>`).join('')}</div></div>
      ${can?`<div class="fld"><label>Claim amount</label><div class="cl-amt"><b class="num">${rp(clAmount(s))}</b>${capNote(s)}</div></div>
      <div class="fld"><label>Documents</label><div class="cl-docs">${docBtns(C.cat,C.docs,'data-cdoc')}</div><span class="src" style="margin-top:6px">${cName(s.k)} only accepts claims filed within ${plural(days,'day')} of the loss. Add what you have now; you can add the rest from the claim.</span></div>
      <div class="fld"><label for="cl-n">Note</label><input id="cl-n" placeholder="Optional"></div>`:cases.length?`<div class="sx-note">${ic('bulb',16)}<span>This shipment can't be claimed right now. If something else went wrong, contact FLIK support from the shipment.</span></div>`:''}`
    :`<div class="fld"><label for="cl-q">Tracking number (AWB)</label><input id="cl-q" placeholder="Type or paste an AWB" value="${esc(C.q)}" autocomplete="off"></div><div id="cl-res">${clRes(C.q)}</div>
      <div class="fld"><label>Try a case</label><div class="cl-ex">${claimExamples().map(([l,x])=>`<button class="chip" data-clpick="${x.id}">${l}</button>`).join('')}</div></div>`}</div>
    <div class="mf"><button class="btn btn-o" data-mclose>Cancel</button><button class="btn btn-p" id="cl-go" ${can?'':'disabled'}>Report to FLIK</button></div>`;
    mscrim.classList.add('open');
    const q=document.getElementById('cl-q');if(q){q.focus();q.setSelectionRange(q.value.length,q.value.length);q.oninput=()=>{C.q=q.value;document.getElementById('cl-res').innerHTML=clRes(C.q)}}}
  const clRes=v=>{v=v.trim().toUpperCase();if(v.length<4)return'';const l=SH.filter(s=>s.awb&&s.awb.includes(v)).slice(0,5);
    return l.length?`<div class="cl-res">${l.map(s=>`<button class="opt" data-clpick="${s.id}">${cLogo(s.k)}<span class="mono">${s.awb}</span><span class="src">${esc(s.area.city)}</span>${stPill3(s.st)}</button>`).join('')}</div>`:'<p class="sec-sub">No shipment with that AWB.</p>'};
  modal.onclick=e=>{const t=e.target.closest('button');if(!t)return;
    if(t.dataset.clpick){C.sid=t.dataset.clpick;C.cat=null;C.docs={};draw();return}
    if(t.id==='cl-chg'){C.sid=null;draw();return}
    if(t.dataset.cc){C.cat=t.dataset.cc;C.docs={};draw();return}
    if(t.dataset.cdoc){C.docs[t.dataset.cdoc]=true;draw();return}
    if(t.id==='cl-go'){const s=SH.find(x=>x.id===C.sid),n=(document.getElementById('cl-n')||{}).value||'';
      FLIK.api.createTicket({awb:s.awb,type:'claim',reason:CLCAT[C.cat][0],note:n});const c=addClaim(s,C.cat,NOW,'evidence','Merchant',{...C.docs});track('claim_reported',{type:C.cat,courier:s.k,docs:Object.keys(C.docs).length});
      closeModal();closeDetail();MS.tab='claims';MS.cl={st:'',cat:''};renderMon();toast(clDocsDone(c)?`${c.id} reported. FLIK files it with ${cName(s.k)}`:`${c.id} reported. Add the rest of the documents by ${fdate(clDue(c))}`);claimDrawer(c.id)}};
  draw()}
function claimDrawer(id){drawer.classList.remove('chat');const c=CL.find(x=>x.id===id),s=SH.find(x=>x.id===c.sid),bad=c.st==='rejected',flow=bad?['evidence','filed','rejected']:c.st==='partial'?['evidence','filed','partial','paid']:CL_FLOW;
  const left=Math.ceil((clDue(c)-NOW)/DAY);
  drawer.innerHTML=`<div class="dh"><span class="kind">${ic('shield',15)}Claim</span><button class="ib" data-dclose aria-label="Close">${ic('x',18)}</button></div>
  <div class="db"><div class="d-hd"><b class="mono">${c.id}</b><div class="pills"><span class="st ${CLST[c.st][1]} sm">${CLST[c.st][0]}</span></div></div>
  ${stepper(flow,CLST,c.st,bad)}
  <div class="d-iss${clNeeds(c)?'':' calm'}"><b>${esc(clLine(c))}</b>${clNeeds(c)?`<span>${left>0?`${plural(left,'day')} left to add them.`:'Add them today.'}</span>`:''}</div>
  ${c.st==='evidence'?`<div class="dsec"><h5>Documents</h5><div class="cl-docs">${docBtns(c.cat,c.docs,'data-cldoc="'+c.id+'" data-doc')}</div></div>`:''}
  <div class="dsec"><dl class="kv"><dt>Type</dt><dd>${CLCAT[c.cat][0]}<span class="src">${CLCAT[c.cat][1]}</span></dd><dt>Courier</dt><dd><div class="sx-cl">${cLogo(c.k)}<span>${cName(c.k)}</span></div></dd><dt>Shipment</dt><dd><button class="lnk mono" data-sid2="${s.id}">${c.awb||s.id}</button></dd>
    <dt>Claimed</dt><dd class="num">${rp(c.amount)}${c.capped?`<span class="src">${cName(c.k)}'s limit for this parcel. The goods value is ${rp(s.val)}.</span>`:''}</dd>${c.acc?`<dt>Accepted</dt><dd class="num">${rp(c.acc)}</dd>`:''}${c.paid?`<dt>Paid</dt><dd class="num">${rp(c.paid)} · ${fdateY(c.paidAt)}</dd>`:''}
    ${c.ref?`<dt>Courier reference</dt><dd class="mono">${c.ref}</dd>`:''}<dt>Loss known</dt><dd>${fdateY(c.known)}</dd>${c.st==='evidence'?`<dt>File by</dt><dd>${fdateY(clDue(c))}</dd>`:''}<dt>Case</dt><dd><span class="mono">${c.tk}</span>${c.st!=='evidence'?'<span class="src">Resolved: claim filed</span>':''}</dd></dl></div>
  <div class="dsec"><h5>Status log</h5>${logTl(c.log,CLST)}</div></div>`;
  openDrawer();track('claim_opened',{type:c.cat,status:c.st})}

/* ---- Tickets ---- */
const tkSubj=t=>{const s=SH.find(x=>x.id===t.sid),is=s&&(issueOf(s)||s.had);return is?is.t:TKT[t.type][0]};
function monTickets(){const A=TK.slice().sort((a,b)=>b.log[0][1]-a.log[0][1]),L=A.filter(t=>ityIn(t.ty));
  DL['m-tickets']=()=>['flik-tickets',['Ticket ID','Monitoring status','Issue group','Issue type','AWB','Courier','Ticket status','Type','Subject','Ticket created at','Last update'],TKCAT.flatMap(m=>L.filter(t=>t.cat===m)).map(t=>{const s=SH.find(x=>x.id===t.sid)||{};return[t.id,MON3[t.cat][0],t.ty?ITG[ITY[t.ty][0]]:'',t.ty?ITY[t.ty][1]:'',t.awb||'',cName(s.k),TKST[tkSt(t)][0],TKT[t.type][0],tkSubj(t),fdateY(t.created),fdateY(t.log[0][1])]})];
  const open=A.filter(t=>tkSt(t)!=='resolved').length;
  return secH('Tickets',`Every action you take in Needs resolving opens a ticket here, grouped by the monitoring status it was opened for. Claims are the Problem tickets. ${plural(open,'ticket')} open.`,'m-tickets')+
  (A.length?`<div class="ity-bar">${ityFilter(A.map(t=>t.ty))}${MS.ity?`<button class="lnk" data-ityf-clear>Clear</button>`:''}</div>`:'')+(L.length?`<div class="tbl-wrap"><table class="mt rg"><thead><tr><th>Ticket ID</th><th>Issue type</th><th>AWB</th><th>Courier</th><th>Ticket status</th><th>Ticket created at</th><th>Last update</th></tr></thead>
  ${TKCAT.map(m=>{const l=L.filter(t=>t.cat===m);return l.length?`<tbody><tr class="grp nohover"><td colspan="7">${monPill(m)} <b class="num">${l.length}</b><span>${l.filter(t=>tkSt(t)!=='resolved').length} open</span></td></tr>${l.map(t=>{const s=SH.find(x=>x.id===t.sid)||{};return`<tr data-tk="${t.id}"><td><span class="mono">${t.id}</span><span class="src">${TKT[t.type][0]}</span></td>${ityTd(t.ty)}<td class="mono">${t.awb||'—'}</td>${s.k?cTd(s):'<td>—</td>'}<td><span class="st ${TKST[tkSt(t)][1]} sm">${TKST[tkSt(t)][0]}</span></td><td class="date">${fdate(t.created)}</td><td class="upd">${ago(t.log[0][1])}</td></tr>`}).join('')}</tbody>`:''}).join('')}</table></div>`
  :A.length?`<p class="sec-sub">No ticket with that issue type.</p>`:`<section class="card w-empty"><span class="qic">${ic('ticket',22,1.6)}</span><div><b>No tickets</b><span>Actions you take in Needs resolving open tickets here.</span></div></section>`)}

/* ---- Shipment drawer: details, issue, tracking history ---- */
function timeline(s){const sv=SERVICES[s.svc],w=whByCode(s.wh),at=f=>new Date(s.created.getTime()+(s.upd-s.created)*f),from=w?w.city:'Warehouse',to=s.area.city;
  const ev=[['Booked with FLIK Shipping',from,s.created,'']];if(s.st==='pickup')return ev.reverse();
  ev.push(['Picked up by '+cName(s.k),from,at(.12),''],['Left sorting hub',from,at(.3),''],['Arrived at delivery hub',to,at(.62),'']);
  if(['ofd','delivered','failed','returning','returned'].includes(s.st))ev.push(['Out for delivery',to,at(.82),'']);
  if(s.st==='delivered')ev.push([`Delivered, received by ${podOf(s).by.replace(' (shopper)','')}`,to,s.upd,'ok']);
  if(s.st==='failed'){ev.push([`Delivery attempt ${s.tries} failed: ${WHY[s.why]||WHY.nothome}`,to,s.upd,'warn']);if(PS.boost&&s.pay==='cod')ev.push([`Delivery Boost: FLIK asked ${s.name.split(' ')[0]} on WhatsApp for a good time. ${rp(boostFee(s))} if it's delivered`,to,new Date(s.upd.getTime()+10*60000),''])}
  if(s.st==='returning'||s.st==='returned')ev.push(['Delivery attempt 2 failed: shopper refused the parcel',to,at(.88),'warn'],['Return started',to,at(.92),'warn']);
  if(s.st==='returned')ev.push(['Returned to sender',from,s.upd,'bad']);if(s.st==='lost')ev.push(['Reported lost at the sorting hub',to,s.upd,'bad']);
  return ev.reverse()}
/* ---- Shipment drawer = the merchant's tracking page: progress, estimate, proof of delivery, history, details ---- */
const TRK_OK=['Booked','Picked up','In transit','Out for delivery','Delivered'];
function trkSteps(s){
  if(s.st==='returning'||s.st==='returned')return{L:['Booked','Picked up','In transit','Delivery failed','Returning','Returned'],at:s.st==='returned'?(s.noConf?5:6):4,bad:s.st==='returned'&&s.noConf};
  if(s.st==='failed')return{L:[...TRK_OK.slice(0,3),'Delivery failed','Delivered'],at:3,bad:true};
  if(s.st==='lost')return{L:[...TRK_OK.slice(0,3),'Lost',''].filter(Boolean),at:3,bad:true};
  return{L:TRK_OK,at:{pickup:0,picked:1,transit:2,ofd:3,delivered:5}[s.st]??0}}
function trkEta(s){const due=new Date(pickAt(s).getTime()+slaOf(s)*DAY);
  if(s.st==='delivered')return`Delivered ${fdateY(s.upd)}${s.upd>due?`, ${ageTx((s.upd-due)/DAY)} after the courier's estimate`:''}`;
  if(s.st==='returned')return`Returned to ${esc((whByCode(s.wh)||{}).n||s.wh)} ${fdateY(s.upd)}`;
  if(s.st==='lost')return`Reported lost ${fdateY(s.upd)}`;
  if(s.st==='returning')return`On its way back to ${esc((whByCode(s.wh)||{}).n||s.wh)}`;
  if(s.st==='pickup')return`Waiting for ${cName(s.k)} to pick it up`;
  if(s.st==='failed')return`Next attempt after the shopper is reached. Courier's estimate was ${fdate(due)}`;
  return NOW>due?`Past the courier's estimate of ${fdate(due)}`:`Estimated delivery by ${fdate(due)}`}
/* proof of delivery, of a failed attempt, or of the return: what the courier's app sends back */
const POD_REL=['Shopper','Family member','Security guard','Neighbour'];
function podOf(s){const h=hsh(s.id),w=whByCode(s.wh)||{};
  if(s.st==='delivered'){const rel=POD_REL[h%4];return{kind:'Proof of delivery',scene:'door',at:s.upd,by:rel==='Shopper'?s.name.split(' ')[0]+' (shopper)':rel,gps:`${5+h%40} m from the shopper's address`,sign:true,note:rel==='Shopper'?'Handed to the shopper':`Handed to the ${rel.toLowerCase()}, as the shopper asked`}}
  if(s.st==='failed')return{kind:'Proof of attempt',scene:s.why==='notfound'?'street':'door',at:s.upd,by:'',gps:`${10+h%60} m from the shopper's address`,sign:false,note:`${WHY[s.why]||WHY.nothome}. The courier called the shopper ${1+h%3} times.`.replace(/^./,c=>c.toUpperCase())}
  if(s.st==='returned')return{kind:'Proof of return',scene:'wh',at:s.upd,by:`Warehouse staff at ${w.n||s.wh}`,gps:`At ${w.n||s.wh}`,sign:true,note:'Returned to your pickup address'}
  return null}
/* an example photo and signature, drawn rather than loaded, so the prototype needs no image files */
function podPhoto(scene,h,big){const W=big?560:240,H=big?360:150,c=['#d9cbb4','#c9d6cf','#d6d0e4'][h%3];
  const box=`<g transform="translate(${W*.42} ${H*.52})"><rect width="${W*.2}" height="${H*.26}" rx="3" fill="#b98a55"/><rect x="${W*.085}" width="${W*.03}" height="${H*.26}" fill="#d9b27c"/><rect x="${W*.02}" y="${H*.04}" width="${W*.06}" height="${H*.06}" fill="#fff" opacity=".85"/></g>`;
  const bg=scene==='wh'?`<rect width="${W}" height="${H}" fill="#cfd3d8"/><rect y="${H*.72}" width="${W}" height="${H*.28}" fill="#a9aeb5"/>${[0,1,2,3].map(i=>`<rect x="${W*(.05+i*.24)}" y="${H*.12}" width="${W*.18}" height="${H*.5}" fill="#e8eaed" stroke="#b7bcc2"/>`).join('')}`
    :scene==='street'?`<rect width="${W}" height="${H}" fill="#cfe0ea"/><rect y="${H*.62}" width="${W}" height="${H*.38}" fill="#9da3a8"/><rect x="${W*.08}" y="${H*.2}" width="${W*.3}" height="${H*.42}" fill="${c}"/><rect x="${W*.6}" y="${H*.26}" width="${W*.32}" height="${H*.36}" fill="#e6dccb"/>`
    :`<rect width="${W}" height="${H}" fill="${c}"/><rect x="${W*.3}" y="${H*.08}" width="${W*.4}" height="${H*.7}" fill="#7a5b3e"/><circle cx="${W*.64}" cy="${H*.45}" r="${W*.012}" fill="#e8c27a"/><rect y="${H*.78}" width="${W}" height="${H*.22}" fill="#8f8a83"/>`;
  return`<svg viewBox="0 0 ${W} ${H}" class="pod-img" role="img" aria-label="Example photo from the courier">${bg}${scene==='street'?'':box}<text x="${W-8}" y="${H-8}" text-anchor="end" font-size="${big?13:10}" fill="#fff" opacity=".9" font-family="Inter,sans-serif">Example photo</text></svg>`}
function podSign(h){let d='M10 34',x=10;for(let i=0;i<7;i++){x+=14+(h>>i)%9;d+=` q ${6+(h>>(i+2))%6} ${-18-(h>>i)%14} ${12} ${-(h>>(i+1))%10+6}`}return`<svg viewBox="0 0 160 50" class="pod-sig" role="img" aria-label="Recipient's signature"><path d="${d}" fill="none" stroke="#1e2a4a" stroke-width="1.6" stroke-linecap="round"/></svg>`}
function podHtml(s){const p=podOf(s);if(!p)return'';const h=hsh(s.id);
  return`<div class="dsec"><h5>${p.kind}</h5><div class="pod"><button class="pod-ph" data-podz="${s.id}" aria-label="Open the photo">${podPhoto(p.scene,h,false)}</button>
    <dl class="kv pod-kv">${p.by?`<dt>Received by</dt><dd>${esc(p.by)}</dd>`:''}<dt>Time</dt><dd>${fdateY(p.at)}</dd><dt>Location</dt><dd>${esc(p.gps)}</dd><dt>Note</dt><dd>${esc(p.note)}</dd>${p.sign?`<dt>Signature</dt><dd>${podSign(h)}</dd>`:''}</dl></div></div>`}
function podZoom(id){const s=SH.find(x=>x.id===id),p=podOf(s);modal.classList.add('nw');
  modal.innerHTML=`<div class="mh"><h3>${p.kind} · <span class="mono">${s.awb}</span></h3><button class="ib" data-mclose aria-label="Close">${ic('x',18)}</button></div><div class="mb">${podPhoto(p.scene,hsh(s.id),true)}<p class="src" style="margin-top:10px">${cName(s.k)} · ${fdateY(p.at)} · ${esc(p.gps)}</p></div>`;
  mscrim.classList.add('open');track('pod_opened',{kind:p.kind})}
function openShipment(id){drawer.classList.remove('chat');const s=SH.find(x=>x.id===id);if(!s)return;const is=issueOf(s),m=monOf(s),t=s.tk&&TK.find(k=>k.id===s.tk),cl=clOf(s),T=trkSteps(s),ev=timeline(s);
  drawer.innerHTML=`<div class="dh"><span class="kind">${ic('truck',15)}Tracking</span><button class="ib" data-dclose aria-label="Close">${ic('x',18)}</button></div>
  <div class="db"><div class="d-hd"><b class="mono">${s.awb||'AWB after pickup'}</b><div class="pills">${stPill3(s.st)} ${monPill(m)}</div></div>
  <div class="trk-card"><div class="trk-top">${cLogo(s.k)}<div><b>${esc(trkEta(s))}</b><span>${cName(s.k)} ${SERVICES[s.svc][1]} · ${esc((whByCode(s.wh)||{}).city||s.wh)} to ${esc(s.area.city)}</span></div></div>
    <ol class="trk-st">${T.L.map((l,i)=>`<li class="${i<T.at?'done':i===T.at?(T.bad?'bad':'cur'):''}"><i>${i<T.at?ic('check',10,3):''}</i><span>${l}</span></li>`).join('')}</ol>
    <p class="trk-last">${ic('pin',14)}<span>Last update: ${esc(ev[0][0])} · ${esc(ev[0][1])} · ${ago(ev[0][2])}</span></p>
    ${s.awb?`<div class="trk-acts"><button class="btn btn-o sm" data-cpawb="${s.awb}">${ic('copy',14)}Copy AWB</button><button class="btn btn-o sm" data-cptrk="${s.awb}">${ic('ext',14)}Copy tracking link for the shopper</button><button class="btn btn-o sm" data-prs="${s.id}">${ic('print',14)}Print label</button></div>`:''}</div>
  ${is&&rstate(s)==='open'?`<div class="d-iss"><b>${ityTx(is.ty)}</b><span>${isDetail(s)}${is.next}</span><div class="d-acts">${['claim','support','customer'].map(a=>`<button class="btn ${a===is.act?'btn-p':'btn-o'}" data-act="${s.id}" data-a="${a}">${TKT[a][1]}</button>`).join('')}</div></div>`:''}
  ${cl?`<div class="d-cl"><span class="kind">${ic('shield',15)}<b class="mono">${cl.id}</b><span class="st ${CLST[cl.st][1]} sm">${CLST[cl.st][0]}</span></span><span>${esc(clLine(cl))}</span><button class="lnk" data-cl="${cl.id}">Open claim</button></div>`:''}
  ${t?`<div class="d-tk">${ic('ticket',16)}<span><b>${t.id}</b> · ${TKT[t.type][0]} · ${t.ty?ityTx(t.ty):MON3[t.cat][0]}</span><span class="st ${TKST[tkSt(t)][1]} sm">${TKST[tkSt(t)][0]}</span><button class="lnk" data-tk="${t.id}">Open</button></div>`:''}
  ${podHtml(s)}
  <div class="dsec"><h5>Tracking history</h5><div class="tl">${ev.map(e=>`<div class="tli ${e[3]}"><i>${e[3]==='ok'?ic('check',11,3):''}</i><div><b>${e[0]}</b><span>${e[1]} · ${fdateY(e[2])}</span></div></div>`).join('')}</div></div>
  <div class="dsec"><h5>Details</h5><dl class="kv"><dt>Courier</dt><dd><div class="sx-cl">${cLogo(s.k)}<span>${cName(s.k)} ${SERVICES[s.svc][1]}</span></div></dd><dt>Batch</dt><dd class="mono">${s.batch}</dd><dt>Pickup from</dt><dd>${esc((whByCode(s.wh)||{}).n||s.wh)} · ${s.wh}</dd><dt>Created</dt><dd>${fdateY(s.created)}</dd>
    <dt>Shopper</dt><dd>${esc(s.name)}<span class="src">${fphone(s.phone)}</span></dd><dt>Address</dt><dd>${esc(s.street)}, ${esc(areaTx(s.area))}, ${esc(s.area.prov)} ${s.area.zip}</dd>
    <dt>Product</dt><dd>${esc(s.items)} ×${s.qty} · ${s.kg} kg</dd><dt>Payment</dt><dd>${s.pay==='cod'?`COD · ${rp(s.val)}`:`Non-COD · goods ${rp(s.val)}`}</dd><dt>Shipping</dt><dd class="num"><s class="inv-sub">${rp(s.pub)}</s> ${rp(s.cost)}${s.codFee?` · COD fee ${rp(s.codFee)}`:''}</dd><dt>Shopper score</dt><dd>${scorePill(shopperScore(s.phone,s.area))}</dd></dl></div></div>`;
  openDrawer();track('shipment_opened',{monitoring:m,shipment_status:s.st})}

/* ---- Actions → tickets ---- */
function ndrModal(id){const s=SH.find(x=>x.id===id),left=Math.max(1,3-s.tries);let how='again',wa=true;
  const draw=()=>{modal.classList.add('lg');modal.innerHTML=`<div class="mh"><h3>Delivery failed · reattempt</h3><button class="ib" data-mclose aria-label="Close">${ic('x',18)}</button></div>
  <div class="mb"><div class="tk-s">${cLogo(s.k)}<span><b class="mono">${s.awb}</b> · ${esc(s.name)} · ${esc(s.area.kec)}, ${esc(s.area.city)}</span><span class="st ${s.tries>=2?'bad':'warn'} sm">Attempt ${s.tries} failed</span></div>
    <p class="d-sub" style="margin:0">${cName(s.k)} tried ${s.tries===1?'once':s.tries+' times'}. ${left===1?'This is the last attempt: if it fails, the parcel comes back and you pay shipping both ways.':`${left} attempts left before it comes back to you.`} FLIK sends your answer to ${cName(s.k)} before the next attempt.</p>
    <div class="seg" role="tablist"><button class="${how==='again'?'on':''}" data-how2="again">Try again</button><button class="${how==='ret'?'on':''}" data-how2="ret">Return to me</button></div>
    ${how==='again'?`<div class="fld"><label for="nd-h">House number or landmark</label><input id="nd-h" placeholder="e.g. No. 19, green gate next to the mosque"></div>
    <div class="fld"><label for="nd-p">Other phone number</label><input id="nd-p" placeholder="Optional" inputmode="numeric"></div>
    <div class="fld"><label>When</label><div class="sx-slots"><button class="on" type="button">Next attempt</button><button type="button">Tomorrow</button></div></div>
    <label class="ck"><input type="checkbox" id="nd-wa" ${wa?'checked':''}> Also ask the shopper on WhatsApp for a good time, from FLIK for ${MERCHANT}</label>
    <p class="src">The courier can change the house number, landmark and phone. A new kecamatan, city or postcode needs a new shipment.</p>`
    :`<p class="sx-note warn">${ic('warn',15)}<span>The parcel comes back to ${esc((whByCode(s.wh)||{}).n||s.wh)}. Return shipping is charged from your balance and the COD isn't collected.</span></p>`}</div>
  <div class="mf"><button class="btn btn-o" data-mclose>Cancel</button><button class="btn btn-p" id="nd-go">${how==='again'?'Send to courier':'Return to me'}</button></div>`;
  modal.querySelectorAll('[data-how2]').forEach(b=>b.onclick=()=>{how=b.dataset.how2;draw()});const c=document.getElementById('nd-wa');if(c)c.onchange=()=>{wa=c.checked};
  document.getElementById('nd-go').onclick=()=>{const h=(document.getElementById('nd-h')||{}).value||'',ph=(document.getElementById('nd-p')||{}).value||'';
    const note=how==='again'?`Please try delivering again.${h?' House number or landmark: '+h+'.':''}${ph?' Other phone: '+ph+'.':''}`:'Please return this parcel to me.';
    const t=addTicket(s,'support','Merchant',NOW,note);if(how==='again'&&wa)t.chat.push({from:'sys',text:'WhatsApp sent to '+s.name.split(' ')[0]+' from FLIK, asking for a good time',at:NOW});
    track('ndr_action',{action:how==='again'?'reattempt':'return',attempt:s.tries,whatsapp:how==='again'&&wa,critical:s.tries>=2});closeModal();renderMon();toast(`${t.id} created. ${how==='again'?`Sent to ${cName(s.k)} for the next attempt`:'Return requested'}. Follow it in Tickets`)}};
  draw();mscrim.classList.add('open')}
function actionModal(id,type){if(type==='claim'){claimModal(id);return}const s=SH.find(x=>x.id===id),is=issueOf(s)||{t:''};let note='';
  const def=s.st==='returned'||s.st==='returning'?'ret':'lost';
  const body=type==='claim'?`<div class="fld"><label for="tk-c">Claim category</label><select id="tk-c">${Object.entries(CLCAT).map(([k,v])=>`<option value="${k}"${k===def?' selected':''}>${v[0]}</option>`).join('')}</select><span class="src" id="tk-cs" style="margin-top:6px">${CLCAT[def][1]}</span></div><div class="fld"><label for="tk-v">Claim value</label><div class="pre"><em>Rp</em><input id="tk-v" value="${clAmount(s,def).toLocaleString('id-ID')}"></div></div><div class="fld"><label>Proof</label><button class="vf-up" data-toast="Opens file picker">${ic('upload',16)}Add photos or the invoice</button></div>`
    :type==='support'?`<div class="fld"><label for="tk-r">What should FLIK do</label><select id="tk-r"><option>Chase the courier for an update</option><option>Reschedule the pickup</option><option>Change the delivery address</option><option>Hold and return the parcel</option></select></div>`
    :`<div class="fld"><label>To</label><div class="tk-to">${ic('chat2',16)}<span><b>${esc(s.name)}</b> · ${fphone(s.phone)} · WhatsApp from FLIK</span></div></div><div class="fld"><label for="tk-m">Message</label><textarea id="tk-m" rows="5">Halo ${esc(s.name.split(' ')[0])}, ini Aruna Studio. Kurir ${cName(s.k)} belum berhasil mengantar paket Anda (${s.awb}). Boleh konfirmasi alamat dan waktu yang pas untuk pengantaran? Terima kasih.</textarea></div>`;
  modal.innerHTML=`<div class="mh"><h3>${TKT[type][1]}</h3><button class="ib" data-mclose aria-label="Close">${ic('x',18)}</button></div>
  <div class="mb"><div class="tk-s">${cLogo(s.k)}<span><b class="mono">${s.awb||'—'}</b> · ${esc(is.t)}</span>${monPill(monOf(s))}</div>${body}<div class="fld"><label for="tk-n">Note ${type==='customer'?'(internal)':''}</label><input id="tk-n" placeholder="Optional"></div></div>
  <div class="mf"><button class="btn btn-o" data-mclose>Cancel</button><button class="btn btn-p" id="tk-go">${type==='customer'?'Send on WhatsApp':type==='claim'?'File claim':'Send to FLIK support'}</button></div>`;
  mscrim.classList.add('open');
  const cs=document.getElementById('tk-c');if(cs)cs.onchange=()=>{document.getElementById('tk-cs').textContent=CLCAT[cs.value][1];document.getElementById('tk-v').value=clAmount(s,cs.value).toLocaleString('id-ID')};
  document.getElementById('tk-go').onclick=async()=>{note=document.getElementById('tk-n').value;const r=document.getElementById('tk-r')||(cs&&{value:CLCAT[cs.value][0]});
    if(cs){const c=addClaim(s,cs.value);track('claim_filed',{category:cs.value,courier:s.k})}await FLIK.api.createTicket({awb:s.awb,type,reason:r?r.value:'',note});
    const t=addTicket(s,type,'Merchant',NOW,(r?r.value+'. ':'')+note);closeModal();closeDetail();track('issue_action_taken',{action:type,monitoring:monOf(s)});
    toast(`${t.id} created. Follow it in Tickets`);renderMon();if(type!=='claim')ticketDrawer(t.id)}}
/* a ticket opens as a chat with FLIK support, like Intercom; FLIK and the courier's team answer from FLIK's ticketing platform */
function chatHtml(t,s){const who=m=>m.from==='me'?['You','']:m.from==='flik'?AGENT.flik:AGENT.k(s.k);
  return t.chat.map(m=>m.from==='sys'?`<div class="ch-sys">${esc(m.text)} · ${fdateY(m.at)}</div>`:`<div class="ch-m ${m.from==='me'?'me':'them'}">${m.from==='me'?'':`<span class="ch-av ${m.from}">${m.from==='flik'?'F':cLogo(s.k)}</span>`}<div><em>${who(m)[0]}${who(m)[1]?` · ${who(m)[1]}`:''}</em><span>${esc(m.text)}</span><small>${ago(m.at)}</small></div></div>`).join('')}
function ticketDrawer(id){const t=TK.find(k=>k.id===id),s=SH.find(x=>x.id===t.sid);if(t.claim){claimDrawer(t.claim);return}
  drawer.classList.add('chat');
  drawer.innerHTML=`<div class="dh"><span class="kind">${ic('chat2',15)}${t.id} · ${esc(tkSubj(t))}</span><button class="ib" data-dclose aria-label="Close">${ic('x',18)}</button></div>
  <div class="ch-top"><div class="ch-who"><span class="ch-av flik">F</span><span class="ch-av">${cLogo(s.k)}</span><div><b>FLIK support and ${cName(s.k)}</b><span>Usually reply within an hour, 08:00–21:00</span></div></div><span class="st ${TKST[t.st][1]} sm">${TKST[t.st][0]}</span></div>
  <div class="db ch-body" id="ch-body">
    <button class="ch-ship" data-sid2="${s.id}">${cLogo(s.k)}<span><b class="mono">${s.awb||'AWB after pickup'}</b> · ${esc(s.area.kec)}, ${esc(s.area.city)}</span>${monPill(monOf(s))}</button>
    ${chatHtml(t,s)}
    <details class="ch-log"><summary>Status log</summary>${tstepHtml(t)}${logTl(t.log,TKST)}</details>
  </div>
  ${t.st==='resolved'?`<div class="ch-closed">This ticket is resolved. <button class="lnk" data-tkre>Reopen</button></div>`:`<div class="ch-in"><textarea id="ch-t" rows="2" placeholder="Write a message to FLIK support"></textarea><div class="ch-acts"><button class="ib" data-toast="Opens file picker" aria-label="Attach">${ic('upload',16)}</button><span class="sp"></span><button class="btn btn-o sm-b" id="ch-sim" title="Prototype">${cName(s.k)} replies</button><button class="btn btn-o sm-b" id="tk-sim" title="Prototype">${s.st==='returning'?'Parcel returned':'Courier delivers'}</button><button class="btn btn-p" id="ch-send">Send</button></div></div>`}`;
  openDrawer();track('ticket_opened',{type:t.type,status:t.st});
  const body=document.getElementById('ch-body');body.scrollTop=body.scrollHeight;
  const redraw=()=>{ticketDrawer(id);renderMon()};
  const send=document.getElementById('ch-send');if(send){const ta=document.getElementById('ch-t');
    ta.onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send.click()}};
    send.onclick=()=>{const v=ta.value.trim();if(!v)return;t.chat.push({from:'me',text:v,at:new Date()});track('ticket_message_sent',{type:t.type});ticketDrawer(id);
      /* prototype: FLIK support picks it up */
      setTimeout(()=>{if(!drawer.classList.contains('open'))return;if(t.st==='open'){t.st='progress';t.log.unshift(['FLIK support picked it up',new Date(),'progress'])}
        agentSay(t,'flik',`Thanks! I've passed this to ${cName(s.k)} and will update you here as soon as they reply.`,new Date());if(document.getElementById('ch-body'))redraw()},1800)}}
  const cs=document.getElementById('ch-sim');if(cs)cs.onclick=()=>{if(t.st==='open'){t.st='progress';t.log.unshift(['FLIK support picked it up',new Date(),'progress'])}
    agentSay(t,'3pl',s.st==='returning'?'The shopper refused the parcel, so it is on its way back to your warehouse.':'We checked with our hub: the parcel is out for delivery today.',new Date());redraw()};
  const b=document.getElementById('tk-sim');if(b)b.onclick=()=>{s.st=s.st==='returning'?'returned':'delivered';s.upd=new Date(NOW.getTime()+5*60000);t.st='resolved';
    t.log.unshift([s.st==='delivered'?`${cName(s.k)}: delivered. Ticket closed`:'Returned to sender. Ticket closed',s.upd,'resolved']);agentSay(t,'sys',s.st==='delivered'?'Delivered. Ticket closed':'Returned to sender. Ticket closed',new Date());toast(`${t.id} resolved: the shipment is safe`);redraw()};
  const re=drawer.querySelector('[data-tkre]');if(re)re.onclick=()=>{t.st='open';t.log.unshift(['Reopened by you',new Date(),'open']);agentSay(t,'sys','Reopened',new Date());redraw()}}
const tstepHtml=t=>stepper(['open','progress','resolved'],TKST,t.st);

/* ---- events ---- */
document.getElementById('view-mon').addEventListener('click',e=>{const t=e.target.closest('button,tr,select');if(!t)return;const d=t.dataset;
  if(t.tagName==='SELECT')return;
  if(d.mt){MS.tab=d.mt;renderMon();return}
  if(d.fc){e.stopPropagation();fpop(t,d.fc);return}
  if('fclear' in d){MS.f={wh:'',k:'',pay:''};renderMon();return}
  if(d.bt){MS.open.has(d.bt)?MS.open.delete(d.bt):MS.open.add(d.bt);track('batch_expanded',{});renderMon();return}
  if('allb' in d){MS.allB=!MS.allB;renderMon();return}
  if('alld' in d){MS.allD=!MS.allD;renderMon();return}
  if('ityfClear' in d){MS.ity='';renderMon();return}
  if(d.allr){MS.allR=MS.allR||{};MS.allR[d.allr]=!MS.allR[d.allr];renderMon();return}
  if(d.ndrgo){e.stopPropagation();ndrModal(d.ndrgo);return}
  if(d.act){e.stopPropagation();actionModal(d.act,d.a);return}
  if(d.actm){e.stopPropagation();if(popFor===t){closePop();return}popFor=t;const s=SH.find(x=>x.id===d.actm);
    pop.innerHTML=`<div class="menu">${['claim','support','customer'].map(a=>`<button class="opt" data-pa="${a}">${ic(a==='claim'?'shield':a==='support'?'chat2':'phone2',15)}${TKT[a][1]}</button>`).join('')}<button class="opt" data-pa="open">${ic('ext',15)}Open shipment</button></div>`;
    pop.querySelectorAll('[data-pa]').forEach(o=>o.onclick=()=>{closePop();o.dataset.pa==='open'?openShipment(s.id):actionModal(s.id,o.dataset.pa)});placePop(t,true);return}
  if(d.tk){e.stopPropagation();ticketDrawer(d.tk);return}
  if(d.wasim){e.stopPropagation();waAct(PEND.find(p=>p.id===d.wasim),'ya');return}
  if(d.waship){e.stopPropagation();waAct(PEND.find(p=>p.id===d.waship),'ship');return}
  if(d.wam){e.stopPropagation();if(popFor===t){closePop();return}popFor=t;const p=PEND.find(x=>x.id===d.wam);
    pop.innerHTML=p.st==='later'?`<div class="menu"><button class="opt" data-pw="sendwa">${ic('chat2',15)}Confirm on WhatsApp</button><button class="opt" data-pw="sendpay">${ic('wallet',15)}Send a payment link</button><button class="opt" data-pw="cancel">${ic('x',15)}Cancel order</button><button class="opt" data-pw="open">${ic('ext',15)}Open</button></div>`
      :`<div class="menu"><button class="opt" data-pw="ship">${ic('truck',15)}Ship now without waiting</button>${p.resent?'':`<button class="opt" data-pw="resend">${ic('chat2',15)}Send again</button>`}<button class="opt" data-pw="cancel">${ic('x',15)}Cancel order</button><button class="opt" data-pw="batal">${ic('chat2',15)}Shopper cancels (prototype)</button><button class="opt" data-pw="open">${ic('ext',15)}Open</button></div>`;
    pop.querySelectorAll('[data-pw]').forEach(o=>o.onclick=()=>{closePop();o.dataset.pw==='open'?waDrawer(p.id):waAct(p,o.dataset.pw)});placePop(t,true);return}
  if(d.wa){waDrawer(d.wa);return}
  if(d.cl){claimDrawer(d.cl);return}
  if('clnew' in d){claimModal();return}
  if('clcat' in d){MS.cl.cat=MS.cl.cat===d.clcat?'':d.clcat;renderMon();return}
  if('clst' in d){MS.cl.st=d.clst;renderMon();return}
  if(d.ha){MS.hArea=d.ha;renderMon();return}
  if(d.perf){MS.perf=d.perf;renderMon();return}
  if(d.lpg){MS.l.pg+=+d.lpg;renderMon();return}
  /* labels: per row, the selected rows, or a whole batch (one 10×10 cm label per parcel) */
  if(d.lsel){e.stopPropagation();const S=MS.l.sel;S.has(d.lsel)?S.delete(d.lsel):S.add(d.lsel);renderMon();return}
  if('lselall' in d){const L=MS.l,pg=listRows(msBase()).slice(L.pg*PERL,L.pg*PERL+PERL).filter(s=>s.awb),on=pg.every(s=>L.sel.has(s.id));pg.forEach(s=>on?L.sel.delete(s.id):L.sel.add(s.id));renderMon();return}
  if('prclr' in d){MS.l.sel.clear();renderMon();return}
  if(d.prs){e.stopPropagation();printLabels([SH.find(s=>s.id===d.prs)],'row');return}
  if('prsel' in d){printLabels(SH.filter(s=>MS.l.sel.has(s.id)),'selected');MS.l.sel.clear();renderMon();return}
  if(d.prbt){e.stopPropagation();printLabels(SH.filter(s=>s.batch===d.prbt&&s.awb),'batch');return}
  if('prb' in d){e.stopPropagation();if(popFor===t){closePop();return}popFor=t;const B=BATCH.filter(b=>SH.some(s=>s.batch===b.id&&s.awb&&s.st==='pickup')).slice(0,12);
    pop.innerHTML=`<div class="menu" style="width:300px"><h6>Batches waiting for pickup</h6>${B.length?B.map(b=>{const n=SH.filter(s=>s.batch===b.id&&s.awb).length;return`<button class="opt" data-pbt="${b.id}">${cLogo(b.k)}<span style="flex:1"><b class="mono">${b.id}</b><span class="src" style="display:block">${esc((whByCode(b.wh)||{n:b.wh}).n)} · ${fdate(b.created)}</span></span><span class="num">${plural(n,'label')}</span></button>`}).join(''):'<p class="src" style="padding:4px 10px 8px">No batch is waiting for pickup</p>'}</div>`;
    pop.querySelectorAll('[data-pbt]').forEach(o=>o.onclick=()=>{closePop();printLabels(SH.filter(s=>s.batch===o.dataset.pbt&&s.awb),'batch')});placePop(t,true);return}
  if(d.sid){openShipment(d.sid)}});
document.getElementById('view-mon').addEventListener('change',e=>{const k=e.target.dataset.lf;if(k){MS.l[k]=e.target.value;MS.l.pg=0;renderMon()}});
let msT;document.getElementById('view-mon').addEventListener('input',e=>{if(e.target.id!=='ms-q')return;MS.l.q=e.target.value;MS.l.pg=0;clearTimeout(msT);msT=setTimeout(()=>{renderMon();const q=document.getElementById('ms-q');q.focus();q.setSelectionRange(q.value.length,q.value.length)},250)});
drawer.addEventListener('click',e=>{const pz=e.target.closest('[data-podz]');if(pz){podZoom(pz.dataset.podz);return}
  const cp=e.target.closest('[data-cpawb],[data-cptrk]');if(cp){const v=cp.dataset.cpawb||`https://track.flik.id/${cp.dataset.cptrk}`;try{navigator.clipboard.writeText(v)}catch(_){}toast(cp.dataset.cpawb?'AWB copied':'Tracking link copied. The shopper sees the same progress, without your prices');track(cp.dataset.cpawb?'awb_copied':'tracking_link_copied',{});return}
  const pr=e.target.closest('.trk-acts [data-prs]');if(pr){const x=SH.find(y=>y.id===pr.dataset.prs);printLabels([x],'shipment');return}
  const dc=e.target.closest('[data-cldoc]');if(dc){const c=CL.find(x=>x.id===dc.dataset.cldoc);if(!c.docs[dc.dataset.doc]){c.docs[dc.dataset.doc]=true;c.log.unshift([CLDOCS[dc.dataset.doc]+' added',NOW,'']);track('claim_doc_added',{doc:dc.dataset.doc});
    if(clDocsDone(c))toast(`Documents complete. FLIK files ${c.id} with ${cName(c.k)}`);claimDrawer(c.id);if(document.getElementById('view-mon'))renderMon()}return}
  const o=e.target.closest('.d-cl [data-cl]');if(o){claimDrawer(o.dataset.cl);return}
  const a=e.target.closest('[data-act]');if(a){actionModal(a.dataset.act,a.dataset.a);return}const k=e.target.closest('[data-tk]');if(k){ticketDrawer(k.dataset.tk);return}const s=e.target.closest('[data-sid2]');if(s)openShipment(s.dataset.sid2)});

document.addEventListener('change',e=>{if(e.target.matches('[data-ityf]')){MS.ity=e.target.value;track('issue_type_filtered',{value:MS.ity||'all'});renderMon()}});
