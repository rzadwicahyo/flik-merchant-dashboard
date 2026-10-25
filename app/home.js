/* ===== Home: one widget per product the merchant uses (Payments first, then Shipping), side by side ===== */
(()=>{const home=document.getElementById('view-home'),secs=[...home.querySelectorAll('h2.sec')];
  secs[0].remove();document.getElementById('qa').remove();           // Quick access lives in the + menu now
  const pay=document.createElement('div');pay.id='w-pay';secs[1].textContent='Payments summary';
  secs[1].insertAdjacentElement('beforebegin',pay);pay.append(secs[1],home.querySelector('section.card'));
  pay.insertAdjacentHTML('beforeend',`<section class="card w-empty" id="w-pay-empty" hidden><span class="qic">${ic('cart',22,1.6)}</span><div><b>Your sales summary shows up after your first transaction</b><span>Transactions and GMV, compared with the period before.</span></div><button class="btn btn-p" data-goto="invoices/create">Create invoice</button></section>`);
  const g=document.createElement('div');g.className='home-g';pay.insertAdjacentElement('beforebegin',g);g.append(pay);
  g.insertAdjacentHTML('beforeend','<div id="w-ship"></div>')})();

/* area chart in Raam's style: this period as a filled line, the previous one dashed */
function areaChart(el,data,prev,fmt,tip){const W=el.clientWidth,Hh=el.clientHeight;if(!W)return;
  const L=56,R=12,T=12,B=28,iw=W-L-R,ih=Hh-T-B;
  const mx=Math.max(...data.map(x=>x.v),...prev.map(x=>x.v),0);const nice=v=>{if(v<=0)return 1;const p=Math.pow(10,Math.floor(Math.log10(v)));for(const m of[1,1.2,1.5,2,2.5,3,4,5,6,8,10])if(m*p>=v)return m*p;return 10*p};
  const max=fmt.max||nice(mx),min=fmt.min||0,ticks=4;
  const X=i=>L+(data.length===1?iw/2:i*iw/(data.length-1)),Y=v=>T+ih-((v-min)/(max-min))*ih;
  let g='';for(let i=0;i<=ticks;i++){const v=min+(max-min)*i/ticks,y=Y(v);g+=`<line class="gl" x1="${L}" x2="${W-R}" y1="${y}" y2="${y}"/><text class="ax" x="${L-8}" y="${y+4}" text-anchor="end">${fmt.ax(v)}</text>`}
  const step=Math.ceil(data.length/7);data.forEach((x,i)=>{if(i%step===0||i===data.length-1)g+=`<text class="ax" x="${X(i)}" y="${Hh-6}" text-anchor="middle">${x.l}</text>`});
  const smooth=pts=>pts.map((p,i)=>{if(!i)return`M${p[0].toFixed(1)},${p[1].toFixed(1)}`;const p0=pts[i-2]||pts[i-1],p1=pts[i-1],p3=pts[i+1]||p;const c1=[p1[0]+(p[0]-p0[0])/6,Math.min(T+ih,p1[1]+(p[1]-p0[1])/6)],c2=[p[0]-(p3[0]-p1[0])/6,Math.min(T+ih,p[1]-(p3[1]-p1[1])/6)];return`C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p[0].toFixed(1)},${p[1].toFixed(1)}`}).join(' ');
  const line=smooth(data.map((x,i)=>[X(i),Y(x.v)])),pline=smooth(prev.map((x,i)=>[X(i),Y(x.v)]));
  const gid='g'+Math.random().toString(36).slice(2,7);
  el.innerHTML=`<svg viewBox="0 0 ${W} ${Hh}" role="img" aria-label="${esc(fmt.aria||'')}"><defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6A4BFF" stop-opacity=".18"/><stop offset="1" stop-color="#6A4BFF" stop-opacity="0"/></linearGradient></defs>${g}
    <path d="${pline}" fill="none" stroke="#C0C8D2" stroke-width="1.5" stroke-dasharray="4 4"/><path d="${line} L${X(data.length-1)},${T+ih} L${X(0)},${T+ih} Z" fill="url(#${gid})"/><path d="${line}" fill="none" stroke="#6A4BFF" stroke-width="2"/>
    <line class="cur-line" y1="${T}" y2="${T+ih}" style="display:none"/><circle r="4.5" fill="#fff" stroke="#6A4BFF" stroke-width="2" style="display:none"/>
    <rect x="${L}" y="${T}" width="${iw}" height="${ih}" fill="transparent"/></svg><div class="tip"></div>`;
  const svg=el.querySelector('svg'),hit=svg.querySelector('rect:last-of-type'),hl=svg.querySelector('.cur-line'),hp=svg.querySelector('circle'),tp=el.querySelector('.tip');
  const mv=e=>{const r=el.getBoundingClientRect(),x=(e.touches?e.touches[0].clientX:e.clientX)-r.left;const i=Math.max(0,Math.min(data.length-1,Math.round((x-L)/(iw/Math.max(1,data.length-1)))));const d=data[i],px=X(i),py=Y(d.v);
    hl.setAttribute('x1',px);hl.setAttribute('x2',px);hl.style.display='';hp.setAttribute('cx',px);hp.setAttribute('cy',py);hp.style.display='';
    tp.innerHTML=`<b>${tip(d.v)}</b><span>${d.tl||d.l} · prev. ${tip(prev[i]?prev[i].v:0)}</span>`;tp.style.display='block';tp.style.left=Math.max(70,Math.min(W-70,px))+'px';tp.style.top=py+'px'};
  hit.addEventListener('mousemove',mv);hit.addEventListener('touchstart',mv,{passive:true});hit.addEventListener('mouseleave',()=>{hl.style.display=hp.style.display='none';tp.style.display='none'})}

/* daily buckets up to 30 days, weekly beyond */
function bucketsOf(days,offset=0){const step=days<=31?1:7,n=Math.ceil(days/step),out=[];const end=new Date(NOW);end.setHours(24,0,0,0);
  for(let i=n-1;i>=0;i--){const d1=new Date(end-(i*step+offset)*DAY),d0=new Date(d1-step*DAY);out.push({d0,d1,l:`${d0.getDate()} ${MON[d0.getMonth()]}`,tl:step===1?fday(d0):`Week of ${fday(d0)}`})}return out}
/* shipping widget: COD and non-COD as two overlapping area lines (no stacking) */
const SER=[['cod','COD','#6A4BFF',s=>s.pay==='cod'],['non','Non-COD','#14A38B',s=>s.pay==='non']];
const HSM={ships:['Shipments',l=>l.length,v=>Math.round(v).toLocaleString('id-ID'),v=>Math.round(v)],val:['Value',l=>sum(l,s=>s.val),v=>rp(Math.round(v)),v=>compact(v)]};
function multiArea(el,rows,fmt){const W=el.clientWidth,Hh=el.clientHeight;if(!W)return;
  const L=48,R=10,T=10,B=24,iw=W-L-R,ih=Hh-T-B,n=rows.length;
  const nice=v=>{if(v<=0)return 4;const p=Math.pow(10,Math.floor(Math.log10(v)));for(const m of[1,1.2,1.5,2,2.5,3,4,5,6,8,10])if(m*p>=v)return m*p;return 10*p};
  const max=nice(Math.max(...rows.flatMap(r=>SER.map(o=>r[o[0]])))),X=i=>L+(n===1?iw/2:i*iw/(n-1)),Y=v=>T+ih-v/max*ih;
  let g='';for(let i=0;i<=3;i++){const v=max*i/3,y=Y(v);g+=`<line class="gl" x1="${L}" x2="${W-R}" y1="${y}" y2="${y}"/><text class="ax" x="${L-6}" y="${y+4}" text-anchor="end">${fmt(v)}</text>`}
  const step=Math.ceil(n/(W<500?4:6));rows.forEach((r,i)=>{if((i%step===0&&n-1-i>=step*.7)||i===n-1)g+=`<text class="ax" x="${X(i)}" y="${Hh-6}" text-anchor="${i===0?'start':i===n-1?'end':'middle'}">${r.l}</text>`});
  const smooth=pts=>pts.map((p,i)=>{if(!i)return`M${p[0].toFixed(1)},${p[1].toFixed(1)}`;const p0=pts[i-2]||pts[i-1],p1=pts[i-1],p3=pts[i+1]||p;const c1=[p1[0]+(p[0]-p0[0])/6,Math.min(T+ih,p1[1]+(p[1]-p0[1])/6)],c2=[p[0]-(p3[0]-p1[0])/6,Math.min(T+ih,p[1]-(p3[1]-p1[1])/6)];return`C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p[0].toFixed(1)},${p[1].toFixed(1)}`}).join(' ');
  const gid='m'+Math.random().toString(36).slice(2,7);
  const areas=SER.map((o,k)=>{const d=smooth(rows.map((r,i)=>[X(i),Y(r[o[0]])]));return{fill:`<path d="${d} L${X(n-1)},${T+ih} L${X(0)},${T+ih} Z" fill="url(#${gid}${k})"/>`,line:`<path d="${d}" fill="none" stroke="${o[2]}" stroke-width="2"/>`}});
  el.innerHTML=`<svg viewBox="0 0 ${W} ${Hh}" role="img" aria-label="COD and non-COD ${HSM[HS.m][0].toLowerCase()}, ${perTx(HS.per).toLowerCase()}"><defs>${SER.map((o,k)=>`<linearGradient id="${gid}${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${o[2]}" stop-opacity=".16"/><stop offset="1" stop-color="${o[2]}" stop-opacity="0"/></linearGradient>`).join('')}</defs>${g}
    ${areas.map(a=>a.fill).join('')}${areas.map(a=>a.line).join('')}<line class="cur-line" y1="${T}" y2="${T+ih}" style="display:none"/>${SER.map(o=>`<circle r="4" fill="#fff" stroke="${o[2]}" stroke-width="2" style="display:none"/>`).join('')}
    <rect x="${L}" y="${T}" width="${iw}" height="${ih}" fill="transparent"/></svg><div class="tip"></div>`;
  const svg=el.querySelector('svg'),hit=svg.querySelector('rect:last-of-type'),hl=svg.querySelector('.cur-line'),dots=[...svg.querySelectorAll('circle')],tp=el.querySelector('.tip');
  const mv=e=>{const r=el.getBoundingClientRect(),x=(e.touches?e.touches[0].clientX:e.clientX)-r.left,i=Math.max(0,Math.min(n-1,Math.round((x-L)/(iw/Math.max(1,n-1))))),row=rows[i],px=X(i);
    hl.setAttribute('x1',px);hl.setAttribute('x2',px);hl.style.display='';SER.forEach((o,k)=>{dots[k].setAttribute('cx',px);dots[k].setAttribute('cy',Y(row[o[0]]));dots[k].style.display=''});
    tp.innerHTML=`<b>${row.tl}</b>${SER.map(o=>`<span class="tr"><i style="background:${o[2]}"></i>${o[1]}<em class="num">${HSM[HS.m][2](row[o[0]])}</em></span>`).join('')}`;
    tp.style.display='block';tp.style.left=Math.max(80,Math.min(W-80,px))+'px';tp.style.top=Math.min(...SER.map(o=>Y(row[o[0]])))+'px'};
  hit.addEventListener('mousemove',mv);hit.addEventListener('touchstart',mv,{passive:true});hit.addEventListener('mouseleave',()=>{hl.style.display='none';dots.forEach(d=>d.style.display='none');tp.style.display='none'})}
/* ===== Period and filters, shared by both Home widgets (Reza, 24 Oct: This month by default, no filter) ===== */
const HPER=[['today','Today'],['7','Last 7 days'],['month','This month'],['lmonth','Last month'],['30','Last 30 days'],['90','Last 90 days']];
const perTx=k=>HPER.find(p=>p[0]===k)[1];
const HS={per:'month',m:'ships',f:{c:'',wh:''}};
const HP={per:'month',m:'count',f:{mk:'',ch:'',ol:''}};
/* the period, the period before it of the same length, and the buckets the chart draws */
function perRange(k){const t0=new Date(NOW);t0.setHours(0,0,0,0);const t1=new Date(t0.getTime()+DAY);
  let d0,d1,p0;
  if(k==='today'){d0=t0;d1=t1;p0=new Date(t0-DAY)}
  else if(k==='month'){d0=new Date(t0.getFullYear(),t0.getMonth(),1);d1=t1;p0=new Date(t0.getFullYear(),t0.getMonth()-1,1)}
  else if(k==='lmonth'){d0=new Date(t0.getFullYear(),t0.getMonth()-1,1);d1=new Date(t0.getFullYear(),t0.getMonth(),1);p0=new Date(t0.getFullYear(),t0.getMonth()-2,1)}
  else{d0=new Date(t1-(+k)*DAY);d1=t1;p0=new Date(d0-(+k)*DAY)}
  const span=(d1-d0)/DAY,step=k==='today'?2*3600000:span<=31?DAY:7*DAY,n=Math.ceil((d1-d0)/step),pn=Math.min(n,Math.ceil((d0-p0)/step));
  const B=Array.from({length:n},(_,i)=>{const a=new Date(d0.getTime()+i*step),b=new Date(Math.min(d1,a.getTime()+step));
    return{a,b,pa:new Date(p0.getTime()+i*step),pb:new Date(p0.getTime()+(i+1)*step),l:k==='today'?`${String(a.getHours()).padStart(2,'0')}:00`:`${a.getDate()} ${MON[a.getMonth()]}`,
      tl:k==='today'?`${String(a.getHours()).padStart(2,'0')}:00–${String(b.getHours()||24).padStart(2,'0')}:00`:step===DAY?fday(a):`${fday(a)} – ${fday(new Date(b-DAY))}`}});
  return{d0,d1,p0,p1:new Date(p0.getTime()+(d1-d0)),B,pn,prevTx:k==='today'?'yesterday':k==='month'?'the same days last month':k==='lmonth'?'the month before':`the ${k} days before`}}
const inR=(d,a,b)=>d>=a&&d<b;
/* filter chips: one menu each, "All" first */
const fChip=(id,lab,val,all)=>`<button class="chip${val?' set':''}" data-hf="${id}">${ic(val?'check':'pluscirc',14)}<span>${val?esc(val):lab}</span>${val?'':ic('chev',14,2)}</button>`;
const perChip=(id,k)=>`<button class="chip set" data-hper="${id}"><span>Period</span> <span class="val">${perTx(k)}</span>${ic('chev',14,2)}</button>`;

/* --- Payments: transactions or GMV, by payment method, channel and outlet --- */
const OUTLETS=['Online store','Kemang outlet','Dago outlet'];  // prototype: outlets aren't in Raam's payment data
const outletOf=p=>p.source==='FLIK Checkout'?OUTLETS[0]:OUTLETS[1+hsh(p.id)%2];
const PF={mk:['Payment method',()=>[...new Set(PAY.map(p=>METHODS[p.mk].cat))],p=>METHODS[p.mk].cat],ch:['Channel',()=>[...new Set(PAY.map(p=>p.source))],p=>p.source],ol:['Outlet',()=>OUTLETS,outletOf]};
const SF={c:['Courier',()=>[...new Set(SH.map(s=>s.k))].map(cName),s=>cName(s.k)],wh:['Warehouse',()=>[...new Set(SH.map(s=>s.wh))].map(w=>(whByCode(w)||{n:w}).n),s=>(whByCode(s.wh)||{n:s.wh}).n]};
const payRows=()=>PAY.filter(p=>Object.entries(HP.f).every(([k,v])=>!v||PF[k][2](p)===v));
const shipF=()=>SH.filter(s=>Object.entries(HS.f).every(([k,v])=>!v||SF[k][2](s)===v));
const PM={count:['Transactions',l=>l.length,v=>Math.round(v).toLocaleString('id-ID'),v=>`${Math.round(v).toLocaleString('id-ID')} transactions`],gmv:['Total GMV',l=>sum(l,p=>p.amount),v=>compact(Math.round(v)),v=>rp(Math.round(v))]};
function payWidget(){const R=perRange(HP.per),ok=payRows().filter(p=>p.status==='succeeded'),M=PM[HP.m];
  const cur=ok.filter(p=>inR(p.created,R.d0,R.d1)),prev=ok.filter(p=>inR(p.created,R.p0,R.p1)),v=M[1](cur),pv=M[1](prev);
  const d=pv?(v-pv)/pv*100:null,all=payRows().filter(p=>inR(p.created,R.d0,R.d1)),pend=all.filter(p=>p.status==='pending').length;
  return`<div class="sec-h"><h2 class="sec">Payments summary</h2><button class="lnk" data-goto="transactions">Open Transactions ${ic('chev',13)}</button></div>
  <section class="card w-card">
    <div class="w-top"><div class="w-k"><div><span>${M[0]}</span><b class="num">${HP.m==='count'?M[2](v):rp(v)}</b>${d==null?'':`<span class="delta ${d>=0?'up':'down'}" title="Compared with ${R.prevTx}">${d>=0?'+':''}${(Math.round(d*10)/10).toLocaleString('id-ID')}%</span>`}</div><div><span>Success rate</span><b class="num">${all.length?fpct(pct(cur.length,all.length)):'—'}</b></div></div>
      <div class="seg sm">${Object.entries(PM).map(([k,m])=>`<button class="${HP.m===k?'on':''}" data-hpm="${k}">${m[0]}</button>`).join('')}</div></div>
    <div class="w-ctl w-f">${perChip('pay',HP.per)}${Object.entries(PF).map(([k,f])=>fChip('pay.'+k,f[0],HP.f[k])).join('')}${Object.values(HP.f).some(Boolean)?'<button class="lnk" data-hclr="pay">Clear</button>':''}</div>
    <div class="chart sm" id="paychart"></div>
    <div class="w-stats">${[...new Set(PAY.map(p=>METHODS[p.mk].cat))].slice(0,4).map(c=>`<span>${c} <b class="num">${M[2](M[1](cur.filter(p=>METHODS[p.mk].cat===c)))}</b></span>`).join('')}<span class="sp"></span></div>
    <button class="w-flag${pend?'':' zero'}" data-goto="transactions">${ic(pend?'warn':'check',16)}<span><b>${plural(pend,'payment is','payments are')} pending</b></span><span class="sp"></span>View ${ic('chev',13)}</button>
  </section>`}
drawChart=function(){const el=document.getElementById('paychart');if(!el)return;const R=perRange(HP.per),ok=payRows().filter(p=>p.status==='succeeded'),M=PM[HP.m];
  const data=R.B.map(b=>({v:M[1](ok.filter(p=>inR(p.created,b.a,b.b))),l:b.l,tl:b.tl})),prev=R.B.map((b,i)=>({v:i<R.pn?M[1](ok.filter(p=>inR(p.created,b.pa,b.pb))):0}));
  const mx=Math.max(...data.map(x=>x.v),...prev.map(x=>x.v));
  areaChart(el,data,prev,{max:HP.m==='count'?Math.max(4,Math.ceil(mx/4)*4):0,ax:v=>HP.m==='count'?Math.round(v):compact(v),aria:`${M[0]}, ${perTx(HP.per).toLowerCase()}`},M[3])};

/* --- Shipping: COD and non-COD as two lines, by courier and warehouse --- */
function shipRows(){const R=perRange(HS.per),l=shipF();return R.B.map(b=>{const x=l.filter(s=>inR(s.created,b.a,b.b)),r={l:b.l,tl:b.tl};SER.forEach(o=>r[o[0]]=HSM[HS.m][1](x.filter(o[3])));return r})}
function shipWidget(){const R=perRange(HS.per),l=shipF(),all=l.filter(s=>inR(s.created,R.d0,R.d1)),prev=l.filter(s=>inR(s.created,R.p0,R.p1));
  const sr=l=>{const f=l.filter(s=>['delivered','returned','lost'].includes(s.st));return f.length?pct(f.filter(s=>s.st==='delivered').length,f.length):0};
  const codv=l=>sum(l.filter(s=>s.pay==='cod'&&s.st==='delivered'),s=>s.val);
  const dl=(v,p,pts)=>{if(!prev.length)return'';const d=pts?v-p:p?(v-p)/p*100:0;return`<span class="delta ${d>=0?'up':'down'}" title="Compared with ${R.prevTx}">${d>=0?'+':''}${(Math.round(d*10)/10).toLocaleString('id-ID')}${pts?' pts':'%'}</span>`};
  const K=[['Shipments',all.length.toLocaleString('id-ID'),dl(all.length,prev.length)],['Delivery success',all.length?fpct(sr(all)):'—',dl(sr(all),sr(prev),1)],['COD collected',compact(codv(all)),dl(codv(all),codv(prev))]];
  const need=SH.filter(s=>rstate(s)==='open'),crit=need.filter(s=>monOf(s)==='problem').length;
  return`<div class="sec-h"><h2 class="sec">Shipping summary</h2><button class="lnk" data-goto="monitoring">Open Monitoring ${ic('chev',13)}</button></div>
  <section class="card w-card">
    <div class="w-top"><div class="w-k">${K.map(k=>`<div><span>${k[0]}</span><b class="num">${k[1]}</b>${k[2]}</div>`).join('')}</div>
      <div class="seg sm">${Object.entries(HSM).map(([k,m])=>`<button class="${HS.m===k?'on':''}" data-hsm="${k}">${m[0]}</button>`).join('')}</div></div>
    <div class="w-ctl w-f">${perChip('ship',HS.per)}${Object.entries(SF).map(([k,f])=>fChip('ship.'+k,f[0],HS.f[k])).join('')}${Object.values(HS.f).some(Boolean)?'<button class="lnk" data-hclr="ship">Clear</button>':''}</div>
    <div class="chart sm" id="shipchart"></div>
    <div class="w-stats">${SER.map(o=>`<span><i class="ln2" style="border-color:${o[2]}"></i>${o[1]} <b class="num">${HSM[HS.m][2](HSM[HS.m][1](all.filter(o[3])))}</b></span>`).join('')}<span class="sp"></span><span>Returned <b class="num">${all.filter(s=>s.st==='returned'||s.st==='returning').length.toLocaleString('id-ID')}</b></span></div>
    <button class="w-flag${need.length?'':' zero'}" data-goto="monitoring">${ic(need.length?'warn':'check',16)}<span><b>${plural(need.length,'shipment needs','shipments need')} resolving</b>${crit?` · ${crit} critical`:''}</span><span class="sp"></span>Review ${ic('chev',13)}</button>
  </section>`}
function renderHomeExtra(){
  const wp=document.getElementById('w-pay'),el=document.getElementById('w-ship');
  wp.hidden=!has('pay');el.hidden=!has('ship');document.querySelector('.home-g').classList.toggle('two',has('pay')&&has('ship'));
  const newPay=PS.mode==='new';
  wp.innerHTML=newPay?`<h2 class="sec">Payments summary</h2><section class="card w-empty"><span class="qic">${ic('cart',22,1.6)}</span><div><b>Your sales summary shows up after your first transaction</b><span>Transactions and GMV, compared with the period before.</span></div><button class="btn btn-p" data-goto="invoices/create">Create invoice</button></section>`:payWidget();
  if(has('ship'))el.innerHTML=!SH.length?`<h2 class="sec">Shipping summary</h2><section class="card w-empty"><span class="qic">${ic('truck',22,1.6)}</span><div><b>Your shipping summary shows up after your first shipment</b><span>COD and non-COD shipments, delivery success and COD value, compared with the period before.</span></div><button class="btn btn-p" data-newshp>Create shipment</button></section>`:shipWidget();
  requestAnimationFrame(()=>{if(has('pay')&&!newPay)drawChart();drawShipChart()})}
function drawShipChart(){const el=document.getElementById('shipchart');if(el)multiArea(el,shipRows(),HSM[HS.m][3])}
document.addEventListener('click',e=>{
  const m=e.target.closest('[data-hsm]');if(m){HS.m=m.dataset.hsm;renderHomeExtra();return}
  const pm=e.target.closest('[data-hpm]');if(pm){HP.m=pm.dataset.hpm;renderHomeExtra();return}
  const g=e.target.closest('[data-goto]');if(g){go(g.dataset.goto);return}
  const c=e.target.closest('[data-hclr]');if(c){(c.dataset.hclr==='pay'?HP:HS).f=c.dataset.hclr==='pay'?{mk:'',ch:'',ol:''}:{c:'',wh:''};renderHomeExtra();return}
  const r=e.target.closest('[data-hper]');if(r){e.stopPropagation();if(popFor===r){closePop();return}popFor=r;const S=r.dataset.hper==='pay'?HP:HS;
    pop.innerHTML=`<div class="menu" style="width:200px"><h6>Period</h6>${HPER.map(([k,t])=>`<button class="opt" data-n="${k}"><span class="rdo${S.per===k?' on':''}"></span>${t}</button>`).join('')}</div>`;
    pop.querySelectorAll('[data-n]').forEach(o=>o.onclick=()=>{S.per=o.dataset.n;closePop();track('home_period_changed',{widget:r.dataset.hper,period:S.per});renderHomeExtra()});placePop(r,true);return}
  const f=e.target.closest('[data-hf]');if(f){e.stopPropagation();if(popFor===f){closePop();return}popFor=f;const [w,k]=f.dataset.hf.split('.'),S=w==='pay'?HP:HS,D=(w==='pay'?PF:SF)[k];
    pop.innerHTML=`<div class="menu" style="width:220px"><h6>${D[0]}</h6>${['',...D[1]()].map(v=>`<button class="opt" data-v="${esc(v)}"><span class="rdo${S.f[k]===v?' on':''}"></span>${v?esc(v):`All ${D[0].toLowerCase()}s`}</button>`).join('')}</div>`;
    pop.querySelectorAll('[data-v]').forEach(o=>o.onclick=()=>{S.f[k]=o.dataset.v;closePop();track('home_filter_changed',{widget:w,filter:k});renderHomeExtra()});placePop(f,true)}});
addEventListener('resize',()=>{if(!document.getElementById('view-home').hidden){drawShipChart();if(document.getElementById('paychart'))drawChart()}});

/* ===== Today and yesterday, in words (AG, 25 Oct): a merchant skips a plain chart, so Home leads with what to do today and
   what happened yesterday. Written from rules over the same data, no AI, so it costs nothing to show. ===== */
document.querySelector('.home-g').insertAdjacentHTML('beforebegin','<div id="home-brief"></div>');
const dayAt=o=>{const d=new Date(NOW);d.setHours(0,0,0,0);return new Date(d-o*DAY)};
function todoList(){const T=[],n=x=>x.toLocaleString('id-ID');
  if(has('ship')&&SH.length){
    const later=PEND.filter(p=>p.st==='later').length,quiet=PEND.filter(p=>p.st==='sent'&&NOW-p.sent>=WA_HOURS*HOUR).length,need=SH.filter(needsAct),by=m=>need.filter(s=>monOf(s)===m);
    const fail=need.filter(s=>s.st==='failed'),prob=by('problem'),late=by('delayed'),pick=SH.filter(s=>s.st==='pickup'&&s.awb),pb=new Set(pick.map(s=>s.batch)).size;
    if(fail.length)T.push(['bad','truck',`Answer ${n(fail.length)} failed ${fail.length===1?'delivery':'deliveries'}`,'Tell the courier how to try again before the next attempt.','monitoring']);
    if(later)T.push(['warn','clock',`Decide on ${n(later)} risky ${later===1?'order':'orders'}`,'Ship anyway or cancel. They are not in any batch yet.','monitoring']);
    if(quiet)T.push(['warn','chat2',`${n(quiet)} ${quiet===1?'shopper hasn\'t':'shoppers haven\'t'} answered for ${WA_HOURS} hours`,'Ship without waiting, or cancel the order.','monitoring']);
    if(prob.length)T.push(['bad','shield',`Claim ${n(prob.length)} lost or returned ${prob.length===1?'parcel':'parcels'}`,'Lost, damaged, or returned without your confirmation.','monitoring']);
    if(late.length)T.push(['warn','clock',`Chase ${n(late.length)} late ${late.length===1?'shipment':'shipments'}`,'Past the courier\'s SLA for the route. Ask FLIK support to follow up.','monitoring']);
    if(pick.length)T.push(['','print',`Print labels for ${n(pick.length)} ${pick.length===1?'parcel':'parcels'}`,`${plural(pb,'batch is','batches are')} waiting for pickup.`,'monitoring','list'])}
  if(has('pay')&&PS.mode!=='new'){const pend=PAY.filter(p=>p.status==='pending').length;if(pend)T.push(['','wallet',`Follow up ${n(pend)} pending ${pend===1?'payment':'payments'}`,'Shoppers who haven\'t paid yet.','transactions'])}
  return T}
function yesterdayLines(){const a=dayAt(1),b=dayAt(0),c=dayAt(2),L=[],inY=d=>d>=a&&d<b,inP=d=>d>=c&&d<a,n=x=>x.toLocaleString('id-ID');
  const cmp=(v,p,u='')=>p?` (${v>=p?'up':'down'} from ${n(p)}${u} the day before)`:'';
  if(has('ship')&&SH.length){const made=SH.filter(s=>inY(s.created)),pm=SH.filter(s=>inP(s.created)),del=SH.filter(s=>s.st==='delivered'&&inY(s.upd)),ret=SH.filter(s=>s.st==='returned'&&inY(s.upd)),fl=SH.filter(s=>s.st==='failed'&&inY(s.upd));
    const cod=sum(del.filter(s=>s.pay==='cod'),s=>s.val),bs=new Set(made.map(s=>s.batch)).size;
    L.push(made.length?`You shipped <b>${plural(made.length,'parcel')}</b> in ${plural(bs,'batch','batches')}${cmp(made.length,pm.length)}.`:'You shipped nothing yesterday.');
    if(del.length||ret.length)L.push(`<b>${n(del.length)} delivered</b>${ret.length?` and ${n(ret.length)} came back`:''}${cod?`, bringing in <b>${rp(cod)}</b> of COD`:''}.`);
    if(fl.length)L.push(`${plural(fl.length,'delivery','deliveries')} failed, so ${fl.length===1?'it needs':'they need'} an answer today.`);
    const best=COURIERS.map(c=>[c,del.filter(s=>s.k===c.k).length]).sort((x,y)=>y[1]-x[1])[0];if(best&&best[1]>1)L.push(`${best[0].n} delivered the most for you (${n(best[1])}).`)}
  if(has('pay')&&PS.mode!=='new'){const ok=PAY.filter(p=>p.status==='succeeded'),y=ok.filter(p=>inY(p.created)),p=ok.filter(p=>inP(p.created));
    L.push(y.length?`You were paid <b>${rp(sum(y,x=>x.amount))}</b> in ${plural(y.length,'transaction')}${cmp(y.length,p.length)}.`:'No payments came in yesterday.')}
  return L}
function briefHtml(){if(PS.mode==='new'&&!SH.length)return'';const T=todoList(),Y=yesterdayLines(),d=dayAt(1);
  return`<div class="brief"><section class="card br-t"><div class="br-h"><h2 class="sec">Today</h2><span class="src">${plural(T.length,'thing','things')} to do</span></div>
    ${T.length?`<ul class="br-l">${T.map(t=>`<li><button data-goto="${t[4]}"${t[4]==='monitoring'?` data-mtab="${t[5]||'summary'}"`:''}><span class="br-i ${t[0]}">${ic(t[1],15)}</span><span class="br-x"><b>${t[2]}</b><span>${t[3]}</span></span>${ic('chev',14)}</button></li>`).join('')}</ul>`:`<p class="br-ok">${ic('check',15,2.4)}Nothing needs you today.</p>`}</section>
  <section class="card br-y"><div class="br-h"><h2 class="sec">Yesterday</h2><span class="src">${fday(d)}</span></div>${Y.map(l=>`<p>${l}</p>`).join('')}</section></div>`}
const _renderHomeExtra=renderHomeExtra;
renderHomeExtra=function(){_renderHomeExtra();document.getElementById('home-brief').innerHTML=briefHtml()};
document.addEventListener('click',e=>{const b=e.target.closest('[data-mtab]');if(b){MS.tab=b.dataset.mtab;track('home_todo_clicked',{tab:b.dataset.mtab})}},true);
