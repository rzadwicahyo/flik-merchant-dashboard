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
const HS={days:30,m:'ships'};
function multiArea(el,rows,fmt){const W=el.clientWidth,Hh=el.clientHeight;if(!W)return;
  const L=48,R=10,T=10,B=24,iw=W-L-R,ih=Hh-T-B,n=rows.length;
  const nice=v=>{if(v<=0)return 4;const p=Math.pow(10,Math.floor(Math.log10(v)));for(const m of[1,1.2,1.5,2,2.5,3,4,5,6,8,10])if(m*p>=v)return m*p;return 10*p};
  const max=nice(Math.max(...rows.flatMap(r=>SER.map(o=>r[o[0]])))),X=i=>L+(n===1?iw/2:i*iw/(n-1)),Y=v=>T+ih-v/max*ih;
  let g='';for(let i=0;i<=3;i++){const v=max*i/3,y=Y(v);g+=`<line class="gl" x1="${L}" x2="${W-R}" y1="${y}" y2="${y}"/><text class="ax" x="${L-6}" y="${y+4}" text-anchor="end">${fmt(v)}</text>`}
  const step=Math.ceil(n/(W<500?4:6));rows.forEach((r,i)=>{if((i%step===0&&n-1-i>=step*.7)||i===n-1)g+=`<text class="ax" x="${X(i)}" y="${Hh-6}" text-anchor="${i===0?'start':i===n-1?'end':'middle'}">${r.l}</text>`});
  const smooth=pts=>pts.map((p,i)=>{if(!i)return`M${p[0].toFixed(1)},${p[1].toFixed(1)}`;const p0=pts[i-2]||pts[i-1],p1=pts[i-1],p3=pts[i+1]||p;const c1=[p1[0]+(p[0]-p0[0])/6,Math.min(T+ih,p1[1]+(p[1]-p0[1])/6)],c2=[p[0]-(p3[0]-p1[0])/6,Math.min(T+ih,p[1]-(p3[1]-p1[1])/6)];return`C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p[0].toFixed(1)},${p[1].toFixed(1)}`}).join(' ');
  const gid='m'+Math.random().toString(36).slice(2,7);
  const areas=SER.map((o,k)=>{const d=smooth(rows.map((r,i)=>[X(i),Y(r[o[0]])]));return{fill:`<path d="${d} L${X(n-1)},${T+ih} L${X(0)},${T+ih} Z" fill="url(#${gid}${k})"/>`,line:`<path d="${d}" fill="none" stroke="${o[2]}" stroke-width="2"/>`}});
  el.innerHTML=`<svg viewBox="0 0 ${W} ${Hh}" role="img" aria-label="COD and non-COD ${HSM[HS.m][0].toLowerCase()}, last ${HS.days} days"><defs>${SER.map((o,k)=>`<linearGradient id="${gid}${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${o[2]}" stop-opacity=".16"/><stop offset="1" stop-color="${o[2]}" stop-opacity="0"/></linearGradient>`).join('')}</defs>${g}
    ${areas.map(a=>a.fill).join('')}${areas.map(a=>a.line).join('')}<line class="cur-line" y1="${T}" y2="${T+ih}" style="display:none"/>${SER.map(o=>`<circle r="4" fill="#fff" stroke="${o[2]}" stroke-width="2" style="display:none"/>`).join('')}
    <rect x="${L}" y="${T}" width="${iw}" height="${ih}" fill="transparent"/></svg><div class="tip"></div>`;
  const svg=el.querySelector('svg'),hit=svg.querySelector('rect:last-of-type'),hl=svg.querySelector('.cur-line'),dots=[...svg.querySelectorAll('circle')],tp=el.querySelector('.tip');
  const mv=e=>{const r=el.getBoundingClientRect(),x=(e.touches?e.touches[0].clientX:e.clientX)-r.left,i=Math.max(0,Math.min(n-1,Math.round((x-L)/(iw/Math.max(1,n-1))))),row=rows[i],px=X(i);
    hl.setAttribute('x1',px);hl.setAttribute('x2',px);hl.style.display='';SER.forEach((o,k)=>{dots[k].setAttribute('cx',px);dots[k].setAttribute('cy',Y(row[o[0]]));dots[k].style.display=''});
    tp.innerHTML=`<b>${row.tl}</b>${SER.map(o=>`<span class="tr"><i style="background:${o[2]}"></i>${o[1]}<em class="num">${HSM[HS.m][2](row[o[0]])}</em></span>`).join('')}`;
    tp.style.display='block';tp.style.left=Math.max(80,Math.min(W-80,px))+'px';tp.style.top=Math.min(...SER.map(o=>Y(row[o[0]])))+'px'};
  hit.addEventListener('mousemove',mv);hit.addEventListener('touchstart',mv,{passive:true});hit.addEventListener('mouseleave',()=>{hl.style.display='none';dots.forEach(d=>d.style.display='none');tp.style.display='none'})}
/* buckets wide enough to smooth out pickup days: daily for 7 days, 3 days for 30, weekly for 90 */
function shipRows(days){const step=days<=7?1:days<=30?3:7,n=Math.ceil(days/step),end=new Date(NOW);end.setHours(24,0,0,0);const out=[];
  for(let i=n-1;i>=0;i--){const d1=new Date(end-i*step*DAY),d0=new Date(d1-step*DAY),l=SH.filter(s=>s.created>=d0&&s.created<d1),r={l:`${d0.getDate()} ${MON[d0.getMonth()]}`,tl:step===1?fday(d0):`${fday(d0)} – ${fday(new Date(d1-DAY))}`};
    SER.forEach(o=>r[o[0]]=HSM[HS.m][1](l.filter(o[3])));out.push(r)}return out}
function renderHomeExtra(){
  const wp=document.getElementById('w-pay'),el=document.getElementById('w-ship');
  wp.hidden=!has('pay');el.hidden=!has('ship');document.querySelector('.home-g').classList.toggle('two',has('pay')&&has('ship'));
  const newPay=PS.mode==='new';wp.querySelector('section.card:not(#w-pay-empty)').hidden=newPay;document.getElementById('w-pay-empty').hidden=!newPay;
  if(!has('ship'))return;
  if(!SH.length){el.innerHTML=`<h2 class="sec">Shipping summary</h2><section class="card w-empty"><span class="qic">${ic('truck',22,1.6)}</span><div><b>Your shipping summary shows up after your first shipment</b><span>COD and non-COD shipments, delivery success and COD value, compared with the period before.</span></div><button class="btn btn-p" data-newshp>Create shipment</button></section>`;return}
  const cut=new Date(NOW-HS.days*DAY),pcut=new Date(NOW-2*HS.days*DAY),all=SH.filter(s=>s.created>=cut),prev=SH.filter(s=>s.created<cut&&s.created>=pcut);
  const sr=l=>{const f=l.filter(s=>['delivered','returned','lost'].includes(s.st));return f.length?pct(f.filter(s=>s.st==='delivered').length,f.length):0};
  const codv=l=>sum(l.filter(s=>s.pay==='cod'&&s.st==='delivered'),s=>s.val);
  const dl=(v,p,pts)=>{if(!prev.length)return'';const d=pts?v-p:p?(v-p)/p*100:0;return`<span class="delta ${d>=0?'up':'down'}" title="Compared with the previous ${HS.days} days">${d>=0?'+':''}${(Math.round(d*10)/10).toLocaleString('id-ID')}${pts?' pts':'%'}</span>`};
  const K=[['Shipments',all.length.toLocaleString('id-ID'),dl(all.length,prev.length)],['Delivery success',fpct(sr(all)),dl(sr(all),sr(prev),1)],['COD collected',compact(codv(all)),dl(codv(all),codv(prev))]];
  const need=SH.filter(s=>rstate(s)==='open'),crit=need.filter(s=>monOf(s)==='problem').length;
  el.innerHTML=`<div class="sec-h"><h2 class="sec">Shipping summary</h2><button class="lnk" data-goto="monitoring">Open Monitoring ${ic('chev',13)}</button></div>
  <section class="card w-card">
    <div class="w-top"><div class="w-k">${K.map(k=>`<div><span>${k[0]}</span><b class="num">${k[1]}</b>${k[2]}</div>`).join('')}</div>
      <div class="w-ctl"><div class="seg sm">${Object.entries(HSM).map(([k,m])=>`<button class="${HS.m===k?'on':''}" data-hsm="${k}">${m[0]}</button>`).join('')}</div><button class="chip set" id="hs-range"><span>Period</span> <span class="val">Last ${HS.days} days</span>${ic('chev',14,2)}</button></div></div>
    <div class="chart sm" id="shipchart"></div>
    <div class="w-stats">${SER.map(o=>`<span><i class="ln2" style="border-color:${o[2]}"></i>${o[1]} <b class="num">${HSM[HS.m][2](HSM[HS.m][1](all.filter(o[3])))}</b></span>`).join('')}<span class="sp"></span><span>Returned <b class="num">${all.filter(s=>s.st==='returned'||s.st==='returning').length.toLocaleString('id-ID')}</b></span></div>
    ${need.length?`<button class="w-flag" data-goto="monitoring">${ic('warn',16)}<span><b>${plural(need.length,'shipment needs','shipments need')} resolving</b>${crit?` · ${crit} critical`:''}</span><span class="sp"></span>Review ${ic('chev',13)}</button>`:''}
  </section>`;
  requestAnimationFrame(drawShipChart)}
function drawShipChart(){const el=document.getElementById('shipchart');if(el)multiArea(el,shipRows(HS.days),HSM[HS.m][3])}
document.addEventListener('click',e=>{
  const m=e.target.closest('[data-hsm]');if(m){HS.m=m.dataset.hsm;renderHomeExtra();return}
  const g=e.target.closest('[data-goto]');if(g){go(g.dataset.goto);return}
  const r=e.target.closest('#hs-range');if(r){e.stopPropagation();if(popFor===r){closePop();return}popFor=r;
    pop.innerHTML=`<h6>Period</h6>${[7,30,90].map(n=>`<button class="opt" data-n="${n}"><span class="rdo${HS.days===n?' on':''}"></span>Last ${n} days</button>`).join('')}`;
    pop.querySelectorAll('[data-n]').forEach(o=>o.onclick=()=>{HS.days=+o.dataset.n;closePop();renderHomeExtra()});placePop(r,true)}});
addEventListener('resize',()=>{if(!document.getElementById('view-home').hidden)drawShipChart()});
