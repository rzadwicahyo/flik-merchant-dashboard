/* ===== Home: one widget per product the merchant uses (Payments first, then Shipping) ===== */
(()=>{const home=document.getElementById('view-home'),secs=[...home.querySelectorAll('h2.sec')];
  secs[0].remove();document.getElementById('qa').remove();           // Quick access lives in the + menu now
  const pay=document.createElement('div');pay.id='w-pay';secs[1].textContent='Payments summary';
  secs[1].insertAdjacentElement('beforebegin',pay);pay.append(secs[1],home.querySelector('section.card'));
  home.querySelector('h1').insertAdjacentHTML('afterend','<div id="home-extra"></div>');
  home.insertAdjacentHTML('beforeend','<div id="w-ship"></div>')})();

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
const SHM={ships:['Shipments',l=>l.length,v=>plural(Math.round(v),'shipment'),v=>Math.round(v)],cod:['COD value',l=>sum(l.filter(s=>s.pay==='cod'),s=>s.val),v=>rp(v),v=>compact(v)],
  sr:['Delivery success',l=>{const f=l.filter(s=>s.st==='delivered'||s.st==='returned'||s.st==='lost');return f.length?pct(sum(f,s=>s.st==='delivered'?1:0),f.length):0},v=>fpct(v),v=>Math.round(v)+'%']};
const HS={m:'ships',days:30};
function shipSeries(days,offset,m){return bucketsOf(days,offset).map(b=>{const l=SH.filter(s=>s.created>=b.d0&&s.created<b.d1);return{...b,v:SHM[m][1](l)}})}
function renderHomeExtra(){
  document.getElementById('home-extra').innerHTML=SH.length?'':ckHtml('home');
  document.getElementById('w-pay').hidden=!has('pay');
  const el=document.getElementById('w-ship');
  if(!SH.length){el.innerHTML=`<h2 class="sec">Shipping summary</h2><section class="card w-empty"><span class="qic">${ic('truck',22,1.6)}</span><div><b>Your shipping summary shows up after your first shipment</b><span>Shipments, COD value and delivery success, compared with the period before.</span></div><button class="btn btn-p" data-newshp>Create shipment</button></section>`;return}
  const all=SH.filter(s=>s.created>=new Date(NOW-HS.days*DAY)),prev=SH.filter(s=>s.created<new Date(NOW-HS.days*DAY)&&s.created>=new Date(NOW-2*HS.days*DAY));
  const M=SHM[HS.m],v=M[1](all),pv=M[1](prev),d=HS.m==='sr'?v-pv:pv?(v-pv)/pv*100:0;
  const need=SH.filter(s=>rstate(s)==='open'),crit=need.filter(s=>monOf(s)==='problem').length;
  const del=all.filter(s=>s.st==='delivered').length,ret=all.filter(s=>s.st==='returned'||s.st==='returning').length,prog=all.filter(s=>['pickup','picked','transit','ofd','failed'].includes(s.st)).length;
  el.innerHTML=`<div class="sec-h"><h2 class="sec">Shipping summary</h2><button class="lnk" data-goto="monitoring">Open Monitoring ${ic('chev',13)}</button></div>
  <section class="card">
    ${need.length?`<button class="w-flag" data-goto="monitoring">${ic('warn',17)}<span><b>${plural(need.length,'shipment needs','shipments need')} resolving</b>${crit?` · ${crit} critical`:''}</span><span class="sp"></span>Review ${ic('chev',13)}</button>`:''}
    <div class="kpi-row"><div class="kpi"><div class="kpi-v"><b class="num">${M[2](v).replace(/ shipments?$/,'')}</b>${pv?`<span class="delta ${d>=0?'up':'down'}" title="Compared with the previous ${HS.days} days">${d>=0?'+':''}${(Math.round(d*10)/10).toLocaleString('id-ID')}${HS.m==='sr'?' pts':'%'}</span>`:''}</div><span class="kpi-l">${M[0]} · last ${HS.days} days</span></div>
      <div class="kpi-ctl"><button class="chip set" id="hs-range"><span>Period</span> <span class="val">Last ${HS.days} days</span>${ic('chev',14,2)}</button>
      <div class="seg" role="tablist">${Object.entries(SHM).map(([k,m])=>`<button class="${HS.m===k?'on':''}" data-hsm="${k}">${m[0]}</button>`).join('')}</div></div></div>
    <div class="chart" id="shipchart"></div>
    <div class="w-stats"><span><i class="dt ok"></i>Delivered <b class="num">${del.toLocaleString('id-ID')}</b></span><span><i class="dt gr"></i>On the way <b class="num">${prog.toLocaleString('id-ID')}</b></span><span><i class="dt warn"></i>Returned <b class="num">${ret.toLocaleString('id-ID')}</b></span><span class="sp"></span><span class="w-leg"><i class="ln"></i>This period <i class="ln dash"></i>Previous period</span></div>
  </section>`;
  requestAnimationFrame(drawShipChart)}
function drawShipChart(){const el=document.getElementById('shipchart');if(!el)return;const M=SHM[HS.m];
  areaChart(el,shipSeries(HS.days,0,HS.m),shipSeries(HS.days,HS.days,HS.m),{ax:M[3],min:HS.m==='sr'?60:0,max:HS.m==='sr'?100:0,aria:`${M[0]}, last ${HS.days} days`},M[2])}
document.addEventListener('click',e=>{
  const m=e.target.closest('[data-hsm]');if(m){HS.m=m.dataset.hsm;renderHomeExtra();return}
  const g=e.target.closest('[data-goto]');if(g){go(g.dataset.goto);return}
  const r=e.target.closest('#hs-range');if(r){e.stopPropagation();if(popFor===r){closePop();return}popFor=r;
    pop.innerHTML=`<h6>Period</h6>${[7,30,90].map(n=>`<button class="opt" data-n="${n}"><span class="rdo${HS.days===n?' on':''}"></span>Last ${n} days</button>`).join('')}`;
    pop.querySelectorAll('[data-n]').forEach(o=>o.onclick=()=>{HS.days=+o.dataset.n;closePop();renderHomeExtra()});placePop(r,true)}});
addEventListener('resize',()=>{if(!document.getElementById('view-home').hidden)drawShipChart()});
