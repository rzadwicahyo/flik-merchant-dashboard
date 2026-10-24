/* ===== Shipping › Analytics: how the merchant's shipments perform, to learn from (Monitoring is for action) ===== */
document.querySelector('.main').insertAdjacentHTML('beforeend','<main class="content" id="view-ana" hidden></main>');
const AN={per:'month',m:'ships'};
const ANP=[['month','This month'],['lmonth','Last month'],['30','Last 30 days'],['90','Last 90 days'],['180','Last 180 days']],anTx=k=>ANP.find(p=>p[0]===k)[1];
const RREASON=['Shopper refused the parcel','Shopper not at home','Phone unreachable','Address not found','Shopper cancelled the order'];
const reasonOf=s=>RREASON[[0,0,0,1,1,1,2,2,3,4][hsh(s.id)%10]];
const ANM={ships:['Shipments',l=>l.length,v=>plural(Math.round(v),'shipment'),v=>Math.round(v)],sr:['Delivery success',l=>srL(l)||0,v=>fpct(v),v=>Math.round(v)+'%'],cost:['Avg shipping cost',l=>l.length?sum(l,s=>s.cost)/l.length:0,v=>rp(Math.round(v)),v=>compact(Math.round(v))]};
function anStats(l){const f=finL(l),d=l.filter(s=>s.st==='delivered');
  return{n:l.length,fin:f.length,sr:f.length?pct(d.length,f.length):0,ret:f.length?pct(l.filter(s=>s.st==='returned').length,f.length):0,days:d.length?sum(d,s=>(s.upd-s.created)/DAY)/d.length:0,cost:l.length?sum(l,s=>s.cost)/l.length:0,save:sum(l,s=>s.pub-s.cost),codv:sum(l.filter(s=>s.pay==='cod'&&s.st==='delivered'),s=>s.val)}}
/* success, returns and days; "Not delivered yet" until a parcel in the group has finished */
const anCells=(st,b)=>st.fin?`<td><span class="srb"><i style="width:${st.sr}%"></i></span>${b?'<b class="num">':'<span class="num">'}${fpct(st.sr)}${b?'</b>':'</span>'}</td><td class="r num">${fpct(st.ret)}</td><td class="r num">${(Math.round(st.days*10)/10).toLocaleString('id-ID')}</td>`:`<td class="src">Not delivered yet</td><td class="r num inv-sub">—</td><td class="r num inv-sub">—</td>`;
function renderAna(){const el=document.getElementById('view-ana');
  if(!SH.length){el.innerHTML=`<h1>Shipping analytics</h1><section class="card w-empty"><span class="qic">${ic('chart',22,1.6)}</span><div><b>Insights show up after your first shipments</b><span>Delivery success by courier and area, why parcels come back, and what you saved.</span></div><button class="btn btn-p" data-newshp>Create shipment</button></section>`;return}
  const R=perRange(AN.per),L=SH.filter(s=>inR(s.created,R.d0,R.d1)),PV=SH.filter(s=>inR(s.created,R.p0,R.p1)),a=anStats(L),b=anStats(PV);
  const dl=(v,p,pts,inv)=>{if(!PV.length)return'';const d=pts?v-p:p?(v-p)/p*100:0,good=inv?d<=0:d>=0;return`<span class="delta ${good?'up':'down'}">${d>=0?'+':''}${(Math.round(d*10)/10).toLocaleString('id-ID')}${pts?' pts':'%'}</span>`};
  const T=[['Shipments',a.n.toLocaleString('id-ID'),dl(a.n,b.n)],['Delivery success',fpct(a.sr),dl(a.sr,b.sr,1)],['Return rate',fpct(a.ret),dl(a.ret,b.ret,1,1)],['Days to deliver',(Math.round(a.days*10)/10).toLocaleString('id-ID'),dl(a.days,b.days,0,1)],['Avg shipping cost',rp(Math.round(a.cost)),dl(a.cost,b.cost,0,1)],['Saved with FLIK rates',compact(a.save),'']];
  const cod=anStats(L.filter(s=>s.pay==='cod')),non=anStats(L.filter(s=>s.pay==='non'));
  const rets=L.filter(s=>s.st==='returned'||s.st==='returning'),rr=Object.entries(by(rets,reasonOf)).sort((x,y)=>y[1].length-x[1].length);
  const cities=Object.entries(by(L,s=>s.area.city)).map(([c,l])=>[c,l,anStats(l)]).sort((x,y)=>y[1].length-x[1].length).slice(0,8);
  const cour=COURIERS.map(c=>[c,L.filter(s=>s.k===c.k)]).filter(x=>x[1].length).map(([c,l])=>[c,l,anStats(l)]).sort((x,y)=>y[2].sr-x[2].sr);
  /* warehouse × courier: how each courier performs from each pickup warehouse */
  const whc=Object.entries(by(L,s=>s.wh)).map(([w,l])=>[w,l,anStats(l),Object.entries(by(l,s=>s.k)).map(([k,m])=>[k,m,anStats(m)]).sort((x,y)=>y[1].length-x[1].length)]).sort((x,y)=>y[1].length-x[1].length);
  const whN=w=>(whByCode(w)||{n:w}).n;
  const bands=[['Safe','ok'],['Watch','warn'],['Risky','bad']].map(([bn,cl])=>{const l=L.filter(s=>s.pay==='cod'&&shopperScore(s.phone,s.area).band===bn);return[bn,cl,l,anStats(l)]});
  /* insights, computed from the same shipments */
  const ins=[];
  const tops=cities.slice(0,6).map(([c,l])=>{const used=Object.entries(by(l,s=>s.k)).sort((x,y)=>y[1].length-x[1].length)[0];const area=l[0].area;const bestK=COURIERS.slice().sort((x,y)=>srOf(y.k,area).sr-srOf(x.k,area).sr)[0];return{c,l,used,bestK,area}}).filter(x=>x.used[0]!==x.bestK.k&&srOf(x.bestK.k,x.area).sr-srL(x.used[1])>=3&&x.used[1].length>=5).sort((x,y)=>y.l.length-x.l.length);
  if(tops[0]){const t=tops[0];ins.push(['route',`Use ${cName(t.bestK.k)} for ${t.c}`,`${cName(t.used[0])} delivered ${fpct(srL(t.used[1])||0)} of your ${t.used[1].length} parcels there. ${cName(t.bestK.k)} delivers ${fpct(srOf(t.bestK.k,t.area).sr)} in ${t.c} across FLIK. The courier step recommends it automatically.`])}
  if(cod.n&&non.n)ins.push(['coins','COD comes back more often',`${fpct(cod.ret)} of COD parcels were returned, against ${fpct(non.ret)} for non-COD. Each return costs you the shipping there and back.`]);
  const rk=bands[2],sf=bands[0];if(rk[2].length>=5)ins.push(['shield','Shopper score predicts returns',`COD shoppers scored Risky were returned ${fpct(rk[3].ret)} of the time, against ${fpct(sf[3].ret)} for Safe ones. Ask Risky shoppers to pay first, or confirm on WhatsApp before you ship.`]);
  if(rr[0])ins.push(['chat2',`${rr[0][0]}: the top return reason`,`${fpct(pct(rr[0][1].length,rets.length))} of returns. A WhatsApp confirmation before delivery, through Qontak, saves many of them.`]);
  DL['ana-report']=()=>['flik-shipping-report',SHIP_HEAD.concat(['Return reason','Shopper score']),L.map(s=>shipRow(s).concat([s.st==='returned'||s.st==='returning'?reasonOf(s):'',shopperScore(s.phone,s.area).score]))];
  DL['ana-courier']=()=>['flik-courier-scorecard',['Courier','Shipments','Share %','Delivery success %','Return rate %','Avg days','Avg cost'],cour.map(([c,l,s])=>[c.n,l.length,pct(l.length,L.length),s.sr,s.ret,Math.round(s.days*10)/10,Math.round(s.cost)])];
  DL['ana-whc']=()=>['flik-warehouse-courier',['Warehouse','Courier','Shipments','Delivery success %','Return rate %','Avg days','Avg cost'],whc.flatMap(([w,l,ws,cs])=>cs.map(([k,m,st])=>[whN(w),cName(k),m.length,st.sr,st.ret,Math.round(st.days*10)/10,Math.round(st.cost)]))];
  DL['ana-city']=()=>['flik-destinations',['City','Shipments','Delivery success %','Return rate %','Avg days'],cities.map(([c,l,s])=>[c,l.length,s.sr,s.ret,Math.round(s.days*10)/10])];
  DL['ana-reasons']=()=>['flik-return-reasons',['Reason','Returns','Share %'],rr.map(([r,l])=>[r,l.length,pct(l.length,rets.length)])];
  const wh=(t,dl,extra='')=>`<div class="an-h"><h3>${t}</h3><div class="sec-a">${extra}${dl?dlBtn(dl):''}</div></div>`;
  el.innerHTML=`<div class="ph"><h1>Shipping analytics</h1><div class="ph-acts">${dlBtn('ana-report','Download full report')}</div></div>
  <div class="filters"><div class="seg">${ANP.map(([k,t])=>`<button class="${AN.per===k?'on':''}" data-and="${k}">${t}</button>`).join('')}</div><span class="src">Compared with ${R.prevTx}. For what needs action today, open <button class="lnk" data-goto="monitoring">Monitoring</button>.</span></div>
  <div class="kp sm">${T.map(t=>`<div class="kp-t"><span>${t[0]}</span><b class="num">${t[1]}</b><small>${t[2]||'&nbsp;'}</small></div>`).join('')}</div>
  <div class="an-g">
    <section class="an-w s2">${wh('Trend','',`<div class="seg sm">${Object.entries(ANM).map(([k,m])=>`<button class="${AN.m===k?'on':''}" data-anm="${k}">${m[0]}</button>`).join('')}</div>`)}
      <div class="chart" id="anchart"></div><div class="w-leg an-leg"><i class="ln"></i>This period <i class="ln dash"></i>Previous period</div></section>
    <section class="an-w">${wh('What to learn','')}${ins.length?`<div class="ins-l">${ins.map(i=>`<div class="ins-i"><span class="qic">${ic(i[0],15,1.6)}</span><div><b>${i[1]}</b><p>${i[2]}</p></div></div>`).join('')}</div>`:'<p class="sec-sub">Nothing stands out in this period.</p>'}</section>
    <section class="an-w">${wh('COD and non-COD','')}<table class="mt cmp"><thead><tr><th></th><th class="r"><i class="sw" style="background:#6A4BFF"></i>COD</th><th class="r"><i class="sw" style="background:#14A38B"></i>Non-COD</th></tr></thead><tbody>
      <tr class="nohover"><td>Shipments</td><td class="r num">${cod.n.toLocaleString('id-ID')}</td><td class="r num">${non.n.toLocaleString('id-ID')}</td></tr>
      <tr class="nohover"><td>Delivery success</td><td class="r num">${fpct(cod.sr)}</td><td class="r num">${fpct(non.sr)}</td></tr>
      <tr class="nohover"><td>Return rate</td><td class="r num">${fpct(cod.ret)}</td><td class="r num">${fpct(non.ret)}</td></tr>
      <tr class="nohover"><td>Days to deliver</td><td class="r num">${(Math.round(cod.days*10)/10).toLocaleString('id-ID')}</td><td class="r num">${(Math.round(non.days*10)/10).toLocaleString('id-ID')}</td></tr>
      <tr class="nohover"><td>Collected</td><td class="r num">${compact(cod.codv)}</td><td class="r num inv-sub">Paid up front</td></tr></tbody></table></section>
    <section class="an-w">${wh('Why parcels come back','ana-reasons')}${rr.length?rr.map(([r,l])=>`<div class="hbar"><span>${r}</span><div><i style="width:${pct(l.length,rr[0][1].length)}%"></i></div><b class="num">${l.length}</b><span class="src">${fpct(pct(l.length,rets.length))}</span></div>`).join(''):'<p class="sec-sub">No returns in this period.</p>'}<p class="sec-sub" style="margin-top:6px">${plural(rets.length,'return')}, from the courier's last tracking update.</p></section>
    <section class="an-w">${wh('COD by shopper score','')}<table class="mt cmp"><thead><tr><th>Score</th><th class="r">Parcels</th><th class="r">Success</th><th class="r">Returns</th></tr></thead><tbody>${bands.map(([bn,cl,l,s])=>`<tr class="nohover"><td><span class="st ${cl} sm">${bn}</span></td><td class="r num">${l.length}</td><td class="r num">${l.length?fpct(s.sr):'—'}</td><td class="r num">${l.length?fpct(s.ret):'—'}</td></tr>`).join('')}</tbody></table><p class="sec-sub" style="margin-top:6px">Beta, example data. Legal to confirm the use of phone history.</p></section>
    <section class="an-w s2">${wh('Courier scorecard','ana-courier')}<div class="tbl-wrap"><table class="mt cmp"><thead><tr><th>Courier</th><th class="r">Shipments</th><th>Delivery success</th><th class="r">Returns</th><th class="r">Days</th><th class="r">Avg cost</th></tr></thead><tbody>
      ${cour.map(([c,l,s])=>`<tr class="nohover"><td><div class="sx-cl">${cLogo(c.k)}<span>${c.n}</span></div></td><td class="r num" title="${fpct(pct(l.length,L.length))} of your shipments">${l.length}</td><td><span class="srb"><i style="width:${s.sr}%"></i></span><b class="num">${fpct(s.sr)}</b></td><td class="r num">${fpct(s.ret)}</td><td class="r num">${(Math.round(s.days*10)/10).toLocaleString('id-ID')}</td><td class="r num">${rp(Math.round(s.cost))}</td></tr>`).join('')}</tbody></table></div></section>
    <section class="an-w s2">${wh('Warehouse and courier','ana-whc')}<p class="sec-sub" style="margin:-4px 0 10px">How each courier performs from each of your pickup warehouses. A low rate from one warehouse only points to that courier's local pickup and sorting, not the courier everywhere.</p><div class="tbl-wrap"><table class="mt cmp whc"><thead><tr><th>Warehouse · courier</th><th class="r">Shipments</th><th>Delivery success</th><th class="r">Returns</th><th class="r">Days</th><th class="r">Avg cost</th></tr></thead><tbody>
      ${whc.map(([w,l,ws,cs])=>`<tr class="nohover whc-h"><td><b>${esc(whN(w))}</b><span class="src"> ${esc(w)}</span></td><td class="r num"><b>${l.length}</b></td>${anCells(ws,1)}<td class="r num">${rp(Math.round(ws.cost))}</td></tr>
        ${cs.map(([k,m,st])=>`<tr class="nohover"><td><div class="sx-cl whc-c">${cLogo(k)}<span>${cName(k)}</span></div></td><td class="r num">${m.length}</td>${anCells(st)}<td class="r num">${rp(Math.round(st.cost))}</td></tr>`).join('')}`).join('')}</tbody></table></div></section>
    <section class="an-w">${wh('Top destinations','ana-city')}<table class="mt cmp"><thead><tr><th>City</th><th class="r">Parcels</th><th class="r">Success</th><th class="r">Returns</th></tr></thead><tbody>${cities.slice(0,7).map(([c,l,s])=>`<tr class="nohover"><td>${esc(c.replace(/^Kota |^Kabupaten /,''))}</td><td class="r num">${l.length}</td><td class="r num">${fpct(s.sr)}</td><td class="r num">${fpct(s.ret)}</td></tr>`).join('')}</tbody></table></section>
  </div>`;
  requestAnimationFrame(drawAnChart);track('analytics_viewed',{period:AN.per})}
/* delivery success always runs from 0 to 100%, so a small dip doesn't look like a fall */
function drawAnChart(){const el=document.getElementById('anchart');if(!el)return;const M=ANM[AN.m],R=perRange(AN.per);
  /* a bucket with no finished parcel has no delivery rate: it carries the last known rate instead of dropping to 0 */
  const val=(a,b)=>{const l=SH.filter(s=>inR(s.created,a,b));return AN.m==='sr'&&!finL(l).length?null:M[1](l)};
  const fill=A=>{let last=A.find(v=>v!=null)??0;return A.map(v=>v==null?last:(last=v))};
  const cv=fill(R.B.map(b=>val(b.a,b.b))),pv=fill(R.B.map((b,i)=>i<R.pn?val(b.pa,b.pb):null));
  const cur=R.B.map((b,i)=>({l:b.l,tl:b.tl,v:cv[i]})),prev=pv.map(v=>({v}));
  areaChart(el,cur,prev,{ax:M[3],min:0,max:AN.m==='sr'?100:0,aria:`${M[0]}, ${anTx(AN.per).toLowerCase()}`},M[2])}
document.getElementById('view-ana').addEventListener('click',e=>{const t=e.target.closest('button');if(!t)return;
  if(t.dataset.and){AN.per=t.dataset.and;renderAna()}if(t.dataset.anm){AN.m=t.dataset.anm;renderAna()}});
addEventListener('resize',()=>{if(!document.getElementById('view-ana').hidden)drawAnChart()});
