/* ===== Create shipment: Raam's v4 flow, connected to the prototype =====
 * The flow itself is Raam's (index.html). This file:
 *  - keeps one balance (BAL and PS.bal) and sends booked orders to Monitoring and waiting orders to "Waiting for the shopper"
 *  - adds the 24 Oct decisions: one batch = one warehouse + one courier service; an order to a number without WhatsApp
 *    skips the check and the merchant ships or removes it; the message comes from FLIK's WhatsApp on behalf of the store,
 *    in wording the merchant can edit; the score also counts the order value and the address; orders a courier can't take
 *    start on the courier that delivers best there, not the cheapest
 */

/* --- opening and closing --- */
const _openShip=openShip,_closeShip=closeShip;
openShip=function(){BAL=PS.bal;_openShip();document.body.classList.add('inflow');track('shipment_create_opened',{merchant:PS.mode})};
closeShip=function(){_closeShip();document.body.classList.remove('inflow')};
/* topupModal (app/shipment.js) already adds to the balance */
shipTopup=function(){topupModal('Top up balance',{amt:topupAmt(),onPaid:a=>{drawSx();toast(`${rp(a)} added to your balance. You can pay now.`)}})};
/* the done screen's links go to Monitoring, where shipments and waiting orders live in this prototype */
sx.addEventListener('click',e=>{const t=e.target.closest('[data-view-shp],[data-view-hold]');if(!t)return;e.stopPropagation();MS.tab='summary';go('monitoring')},true);

/* --- Raam's order (addr.city is "kel, kec, city, prov") to the prototype's order --- */
function toOurs(s){const p=(s.addr.city||'').split(', '),z=s.addr.zip;
  const area=AREA.find(a=>a.zip===z&&a.kel===p[0])||AREA.find(a=>a.zip===z)||{kel:p[0]||'',kec:p[1]||'',city:p[2]||'',prov:p[3]||'',zip:z};
  return{phone:s.phone,name:s.name,addr:{street:s.addr.street,area,pin:null},wh:s.whk&&whByCode(s.whk)?s.whk:defWh(),pay:isCod(s)?'cod':'non',items:s.items,qty:s.qty||1,kg:s.kg,l:s.l,w:s.w,h:s.h,val:codVal(s)}}

/* --- booking: Raam's flow sets X.done; the first draw after that books into Monitoring --- */
const _drawSx=drawSx;
drawSx=function(){if(X&&X.done&&!X.done.synced){X.done.synced=true;if(!X.done.heldOnly)booked()}_drawSx()};
function booked(){const d=X.done,G=groups(),at=new Date(NOW.getTime()+60000);
  G.forEach((g,j)=>{const id=d.rows[j].id,k=SERVICES[g.v][0],w=toOurs(X.ships[g.ships[0]]).wh;BATCH.unshift({id,created:at,k,svc:g.v,wh:w});
    g.ships.forEach(i=>{const s=toOurs(X.ships[i]),q=parcel(s),r=rateOf(g.v,q.origin,q.area,q.kg);
      SH.unshift({id:'S'+(SH.length+1),batch:id,created:at,svc:g.v,k,wh:s.wh,area:q.area,street:s.addr.street,name:s.name,phone:normPhone(s.phone),items:s.items,qty:+s.qty,kg:q.kg,pay:s.pay,val:q.val,pub:r.pub,cost:r.net,codFee:s.pay==='cod'?Math.round(q.val*CODFEE):0,tries:0,st:'pickup',upd:at,awb:mkAwb(k),tk:null,had:null})})});
  /* the request FLIK's API would take: one batch per pickup (warehouse + courier service) */
  FLIK.api.createShipments({pickup:{date:DAYS[X.day].toISOString().slice(0,10),slot:SLOTS[X.slot]},batches:G.map((g,j)=>({ref:d.rows[j].id,warehouse:toOurs(X.ships[g.ships[0]]).wh,courier:SERVICES[g.v][0],service:SERVICES[g.v][1],
    shipments:g.ships.map(i=>{const s=toOurs(X.ships[i]),a=s.addr.area;return{recipient:{name:s.name,phone:normPhone(s.phone),street:s.addr.street,kelurahan:a.kel,kecamatan:a.kec,city:a.city,province:a.prov,postcode:a.zip},
      items:s.items,qty:+s.qty,weight_kg:kgOf(X.ships[i]),dims_cm:[+s.l||0,+s.w||0,+s.h||0],payment:s.pay==='cod'?'COD':'NON_COD',cod_amount:s.pay==='cod'?s.val:0,item_value:s.val}})}))});
  setBal(BAL);ckDone('created');ckDone('paid');
  /* the first transaction tags the merchant: a new merchant becomes a Shipping merchant */
  if(!has('ship')){PS.flags=PS.mode==='new'?'ship':'payship';syncBar();track('merchant_tagged',{products:FLAGS[PS.flags].w.join('+')})}
  track('shipment_booked',{waiting_for_shopper:d.held?d.held.n:0,shipments:d.n,batches:d.nb,cod:d.c.nCod,non_cod:d.c.nNon,paid_now:d.paid,other_couriers:Object.keys(X.alt||{}).length})}

/* --- waiting orders: each one is its own batch in "Waiting for the shopper", booked automatically when the shopper answers --- */
const _makeHeld=makeHeld;
makeHeld=function(sv){const H=(X.held||[]).slice(),halt={...(X.halt||{})},main=SERVICES.indexOf(sv),r=_makeHeld(sv);if(!r)return r;
  H.forEach((h,k)=>{const svc=halt[k]!=null?halt[k]:main,s=toOurs(h.s),p=addPend(s,h.kind,svc);r.list[k].id=p.id;
    FLIK.api.verifyShopper({ref:p.id,kind:h.kind==='pay'?'payment_link':'confirmation',phone:normPhone(s.phone),amount:s.val,warehouse:s.wh,courier:SERVICES[svc][0],service:SERVICES[svc][1],template:p.tpl,expires_h:WA_HOURS});
    if(!k)simShopper(p)});
  if(r.list.length===1)r.id=r.list[0].id;return r};
/* prototype: the first shopper answers a few seconds later, so the automatic booking can be seen */
function simShopper(p){setTimeout(()=>{if(p.st!=='sent')return;const sh=confirmPend(p);track(p.kind==='pay'?'shopper_paid':'shopper_confirmed',{});track('waiting_order_booked',{courier:sh.k});
  toast(`${p.ship.name.split(' ')[0]} ${p.kind==='pay'?'paid':'confirmed'} on WhatsApp. ${sh.awb} booked automatically`);if(!document.getElementById('view-mon').hidden)renderMon()},12000)}

/* --- shopper score: Raam's phone history (60%) and area (40%), minus the order value and an address without a house number --- */
health=function(s){const z=s.addr&&s.addr.zip,ar=areaRate(z),hi=phoneHist(s.phone),ps=hi?Math.round(100*(hi.tot-hi.fail)/hi.tot):85,v=codVal(s),noNo=!!(s.addr&&s.addr.street!=null&&!/\d/.test(s.addr.street));
  const sc=Math.max(0,Math.round(.6*ps+.4*ar)-(v>3e6?10:v>1.5e6?5:0)-(noNo?8:0));
  const area=s.addr?(s.addr.city.split(', ').slice(-2,-1)[0]||s.addr.city):'this area',why=[];
  why.push(hi?hi.fail?`${hi.fail} of ${hi.tot} past deliveries to this number failed`:`${hi.tot} past deliveries to this number, all delivered`:'No delivery history for this number yet');
  why.push(`${ar}% of deliveries in ${area} succeed`);
  if(v>1.5e6)why.push(`High order value (${rp(v)}) fails more often`);
  if(noNo)why.push('The address has no house number');
  return{sc,band:sc>=80?'ok':sc>=60?'warn':'bad',why}};

/* --- risky check: Raam's dialog, plus no-WhatsApp orders and the FLIK sender with editable wording --- */
const fillR=(t,s)=>{const v={merchant_name:MERCHANT,customer_name:(s.name||'there').split(' ')[0],product_name:`${s.items}${(s.qty||1)>1?` ×${s.qty}`:''}`,amount:rp(codVal(s)||0),full_address:s.addr?`${s.addr.street}, ${s.addr.city}`:'',payment_link:payLink('preview')};
  return t.replace(/\{\{(\w+)\}\}/g,(m,k)=>k in v?v[k]:m)};
waPreview=function(kind,s,t){return`<div class="wa-b"><div class="wa-h"><span class="wa-av">F</span><b>FLIK</b><span class="wa-v">${ic('check',11,2.6)}</span><span class="wa-by">on behalf of ${MERCHANT}</span></div><p>${esc(fillR(t||TPL[kind],s))}</p><span class="wa-t">10:47</span>
  <div class="wa-btns">${kind==='pay'?`<span>${ic('ext',14,2)}Bayar sekarang</span>`:'<span>YA</span><span>BATAL</span>'}</div></div>`};
riskyModal=function(L,go){const fmt=x=>x.toLocaleString('id-ID'),act={},wa=s=>waOn()&&hasWa(s.phone);let pv='wa',ed=false,draft=TPL.wa;
  L.forEach(([s,i])=>act[i]=X.bulk&&X.bulk[i]&&X.bulk[i].rkShip?'ship':wa(s)?'wa':'');
  track('risky_shoppers_found',{orders:L.length,of:X.ships.length,no_whatsapp:L.filter(([s])=>!hasWa(s.phone)).length});
  const opts=s=>Object.keys(RK_ACT).filter(k=>(k!=='pay'||isCod(s))&&(wa(s)||k==='ship'||k==='remove'||k==='later'));
  const left=()=>Math.max(0,WA_CAP-PS.waUsed);
  const draw=()=>{const cnt={ship:0,remove:0,wa:0,pay:0,later:0,'':0};L.forEach(([s,i])=>cnt[act[i]]++);const now=X.ships.length-cnt.remove-cnt.wa-cnt.pay-cnt.later-cnt[''],open=cnt[''],sample=(L.find(([s,i])=>act[i]===pv)||L.find(([s])=>wa(s))||L[0])[0];
    const miss=TPL_NEED[pv].filter(v=>!(ed?draft:TPL[pv]).includes('{{'+v+'}}')),keep=modal.querySelector('.sp-wrap')?.scrollTop||0;
    const over=cnt.wa+cnt.pay>left();
    modal.innerHTML=`<div class="mh"><h3>${fmt(L.length)} COD ${L.length===1?'order needs':'orders need'} a check before shipping</h3><button class="ib" data-mclose aria-label="Close">${ic('x',18)}</button></div>
    <div class="mb">${waOn()?'':`<div class="sx-note rk-vip">${ic('chat',16)}<span>${waPaused()?`<b>WhatsApp checks are paused.</b> More than ${Math.round(WA_PAUSE*100)}% of your shoppers said they didn't order. Ship, remove or decide later for now.`:`<b>WhatsApp checks are for VIP merchants.</b> ${rp(VIP_FEE)} more platform fee on every shipment, and a COD reserve of ${rp(COD_RESERVE.vip)} instead of ${rp(COD_RESERVE.std)}. Without it, ship, remove or decide later.`}</span>${waPaused()?'':'<button class="btn btn-o" data-vipon>Become VIP</button>'}</div>`}<p class="bk-mp">These numbers have failed deliveries before, or go to areas where fewer COD parcels are accepted. A COD parcel that comes back costs you shipping both ways. Choose what happens to each order. Orders you ask to confirm or pay wait for the shopper on WhatsApp. Each one is its own batch and ships as soon as that shopper replies. Decide later keeps the order in Monitoring without sending anything.${waOn()&&L.some(([s])=>!wa(s))?' A number that isn\'t on WhatsApp can\'t be asked, so choose to ship or remove that order.':''}</p>
    <div class="rk-grid"><div class="rk-main"><div class="tbl-wrap sp-wrap"><table class="sp-tbl rk2"><thead><tr class="rk-allrow"><td colspan="3"><b>All ${fmt(L.length)} orders</b><span class="src">Apply one action to every order in this list</span></td><td class="sel"><div class="sp-sw"><select id="rk-all" aria-label="Action for all orders">${(()=>{const same=L.every(([s,i])=>act[i]===act[L[0][1]])?act[L[0][1]]:'';return`${same?'':'<option value="" hidden selected>Mixed actions</option>'}${Object.keys(RK_ACT).map(k=>`<option value="${k}" ${same===k?'selected':''}>${RK_ACT[k]}</option>`).join('')}`})()}</select></div></td></tr><tr><th>Shopper</th><th>Health score</th><th>Payment</th><th>Action</th></tr></thead><tbody>${L.map(([s,i,h])=>`<tr><td><b>${s.name}</b><span class="src">+62 ${s.phone}</span>${hasWa(s.phone)?'':'<span class="st gr rk-nowa">No WhatsApp</span>'}</td><td><span class="rk-sc ${h.band}" tabindex="0" data-tip="${h.why.join('. ')}."><b class="num">${h.sc}</b>${HB[h.band]}</span></td><td>${isCod(s)?`<span class="st pu">COD</span><span class="src num">${rp(codVal(s))}</span>`:'<span class="st gr">Non-COD</span>'}</td><td class="sel"><div class="sp-sw${act[i]?'':' need'}"><select data-rka="${i}" aria-label="Action for ${s.name}">${act[i]?'':'<option value="" selected>Choose an action</option>'}${opts(s).map(k=>`<option value="${k}" ${act[i]===k?'selected':''}>${RK_ACT[k]}</option>`).join('')}</select></div></td></tr>`).join('')}</tbody></table></div>
</div>
    <aside class="rk-pv"><div class="rk-pv-h"><b>What the shopper gets on WhatsApp</b><div class="seg" role="tablist"><button role="tab" class="${pv==='wa'?'on':''}" data-rkpv="wa">Confirmation</button><button role="tab" class="${pv==='pay'?'on':''}" data-rkpv="pay">Payment link</button></div></div>${waPreview(pv,sample,ed?draft:null)}
      ${ed?`<textarea id="rk-tpl" class="rk-tpl" rows="5" aria-label="Message wording">${esc(draft)}</textarea><div class="tpl-v">${TPL_VARS.filter(v=>pv==='pay'||v[0]!=='payment_link').map(v=>`<button class="chip" data-tv="${v[0]}">${v[1]}</button>`).join('')}</div>
        ${miss.length?`<p class="sx-note warn">${ic('warn',13)}<span>Keep ${miss.map(v=>'{{'+v+'}}').join(', ')} in the message.</span></p>`:''}<div class="sx-row rk-tpl-f"><button class="lnk" data-tpl="reset">Use FLIK's wording</button><span class="sp"></span><button class="btn btn-o" data-tpl="cancel">Cancel</button><button class="btn btn-p" data-tpl="save" ${miss.length?'disabled':''}>Save wording</button></div>`
        :`<button class="lnk rk-edit" data-tpl="edit">${ic('edit',13)}Edit the wording</button>`}
      <p class="hint">Sent from FLIK's WhatsApp number, on behalf of your store. You'll see replies in Monitoring. New wording is checked by WhatsApp before its first use; until then FLIK's wording is sent.${waOn()?` ${fmt(PS.waUsed)} of ${WA_CAP} checks used today.`:''}</p></aside></div></div>
    <div class="mf"><button class="btn btn-o" data-mclose>Cancel</button><span class="sp"></span>${open?`<span class="src rk-open">Choose an action for ${fmt(open)} ${open===1?'order':'orders'}${waOn()?' without WhatsApp':''}</span>`:''}${over?`<span class="src rk-open">${fmt(left())} WhatsApp ${left()===1?'check':'checks'} left today</span>`:''}<button class="btn btn-p" id="rk-go" ${!open&&!over&&(now||cnt.wa||cnt.pay||cnt.later)?'':'disabled'}>${now?`Continue with ${fmt(now)} ${now===1?'order':'orders'}`:cnt.wa||cnt.pay?`Send ${fmt(cnt.wa+cnt.pay)} on WhatsApp and finish`:cnt.later?'Save for later and finish':'No orders left to ship'}</button></div>`;
    modal.querySelector('.sp-wrap').scrollTop=keep;
    const vb=modal.querySelector('[data-vipon]');if(vb)vb.onclick=()=>{PS.vip=true;track('vip_turned_on',{from:'risky'});toast('You are a VIP merchant now. WhatsApp checks are on');L.forEach(([s,i])=>{if(!act[i]&&wa(s))act[i]='wa'});draw()};
    modal.querySelectorAll('[data-rka]').forEach(el=>el.onchange=()=>{act[el.dataset.rka]=el.value;if(el.value==='wa'||el.value==='pay'){pv=el.value;ed=false;draft=TPL[pv]}draw()});
    document.getElementById('rk-all').onchange=e=>{const v=e.target.value;if(!v)return;L.forEach(([s,i])=>{if(opts(s).includes(v))act[i]=v;else if(v==='pay'&&wa(s))act[i]='wa'});if(v==='wa'||v==='pay'){pv=v;ed=false;draft=TPL[pv]}draw()};
    modal.querySelectorAll('[data-rkpv]').forEach(b=>b.onclick=()=>{pv=b.dataset.rkpv;ed=false;draft=TPL[pv];draw()});
    const ta=document.getElementById('rk-tpl');if(ta)ta.oninput=()=>{draft=ta.value;const m=TPL_NEED[pv].filter(v=>!draft.includes('{{'+v+'}}')),sv=modal.querySelector('[data-tpl="save"]');if(sv)sv.disabled=!!m.length;modal.querySelector('.wa-b p').textContent=fillR(draft,sample)};
    modal.querySelectorAll('[data-tv]').forEach(b=>b.onclick=()=>{const t=document.getElementById('rk-tpl'),v='{{'+b.dataset.tv+'}}',a=t.selectionStart||t.value.length;draft=t.value.slice(0,a)+v+t.value.slice(a);draw()});
    modal.querySelectorAll('[data-tpl]').forEach(b=>b.onclick=()=>{const a=b.dataset.tpl;if(a==='edit'){ed=true;draft=TPL[pv]}else if(a==='cancel'){ed=false}else if(a==='reset'){draft=TPL_DEF[pv]}else if(a==='save'){TPL[pv]=draft;ed=false;track('whatsapp_wording_saved',{kind:pv,custom:draft!==TPL_DEF[pv]});toast('Wording saved. WhatsApp checks it before its first use')}draw()});
    document.getElementById('rk-go').onclick=()=>{const rm=new Set(),held=[],park=[];L.forEach(([s,i])=>{track('risky_choice',{choice:act[i],whatsapp:wa(s)});if(X.bulk&&X.bulk[i])X.bulk[i].rkShip=act[i]==='ship';if(act[i]==='remove')rm.add(i);if(act[i]==='later'){rm.add(i);park.push(s)}if(act[i]==='wa'||act[i]==='pay'){rm.add(i);held.push({s,kind:act[i]})}});
      track('risky_resolved',{confirm:cnt.wa,payment_link:cnt.pay,removed:cnt.remove,shipped_anyway:cnt.ship,decide_later:cnt.later});
      PS.waUsed+=cnt.wa+cnt.pay;X.later=(X.later||[]).concat(park);park.forEach(s=>addPend(toOurs(s),'later',laterSvc(s)));
      X.held=(X.held||[]).concat(held);X.halt={};X.ships=X.ships.filter((s,i)=>!rm.has(i));if(X.bulk){X.bulk=X.bulk.filter((r,i)=>!rm.has(i));X.bulk.forEach((r,i)=>r.i=i)}
      X.alt={};X.rkDone=true;closeModal();
      if(!X.ships.length){if(X.held.length){finishHeldOnly();toast(`${fmt(held.length)} ${held.length===1?'order':'orders'} sent to the shopper on WhatsApp`)}else{closeShip();MS.tab='summary';go('monitoring');toast(`${fmt(park.length)} ${park.length===1?'order':'orders'} saved in Monitoring to decide later`)}return}go();
      const nr=[...rm].length-held.length-park.length;toast([held.length?`${fmt(held.length)} ${held.length===1?'order waits':'orders wait'} for the shopper`:'',park.length?`${fmt(park.length)} to decide later in Monitoring`:'',nr?`${fmt(nr)} removed`:''].filter(Boolean).join(' · ')||'Shipping all orders')}};
  modal.classList.add('wide');draw();mscrim.classList.add('open')};

/* --- courier step: orders the chosen courier can't take start on the courier that delivers best there --- */
const rateAt=(j,s)=>{const v=SERVICES[j];return Math.min(99.5,Math.max(55,areaRate(s.addr&&s.addr.zip)+(CR_Q[v[0]]||0)+(v[2]==='exp'?1:v[2]==='cargo'?-1.5:0)))};
/* same service type first (Regular stays Regular), then the best delivery rate there, then the price */
const bestOpts=s=>{const g=SERVICES[X.svc][2];return altOpts(s).sort((a,b)=>(SERVICES[b][2]===g)-(SERVICES[a][2]===g)||rateAt(b,s)-rateAt(a,s)||SERVICES[a][4]-SERVICES[b][4])};
autoAlt=function(){if(X.svc==null)return;X.alt=X.alt||{};X.halt=X.halt||{};
  X.ships.forEach((s,i)=>{if(whyBlocked(X.svc,s)&&!altOpts(s).includes(X.alt[i])){const o=bestOpts(s);if(o.length)X.alt[i]=o[0];else delete X.alt[i]}});
  (X.held||[]).forEach((h,k)=>{const s=heldShip(h);if(whyBlocked(X.svc,s)&&!altOpts(s).includes(X.halt[k])){const o=bestOpts(s);if(o.length)X.halt[k]=o[0];else delete X.halt[k]}})};
const pct1=x=>x.toLocaleString('id-ID',{minimumFractionDigits:1,maximumFractionDigits:1})+'%';
/* Raam's side panel; batches are counted per warehouse and courier service */
crSide=function(ST,rec){const f=x=>x.toLocaleString('id-ID'),N=X.ships.length,held=X.held||[];
  if(X.svc==null)return`<div class="cr-side-c"><div class="cr-sum-h"><b>Batches</b></div><p class="cr-sum-empty">Choose a courier. You'll see here how your ${f(N)} ${N===1?'shipment':'shipments'} split into batches, and any order that courier can't take.</p></div>`;
  const v=X.svc,by=new Map();X.ships.forEach((s,i)=>{const c=svcFor(i),e=by.get(c)||{n:0,p:0,w:new Set()};e.n++;e.p+=SERVICES[c][4]*kgOf(s);e.w.add(whOf(s).k);by.set(c,e)});
  const cs=[...by.keys()].sort((a,b)=>a===v?-1:b===v?1:by.get(b).n-by.get(a).n),tot=[...by.values()].reduce((a,e)=>a+e.p,0),K=nBatches();
  const hBy=new Map();held.forEach((h,k)=>{const c=heldSvc(k);hBy.set(c,(hBy.get(c)||0)+1)});
  const bRow=c=>{const e=by.get(c),nw=e.w.size;return`<div class="cr-sum-r">${cLogo(SERVICES[c][0])}<div><b>${svName(c)}</b><span>${f(e.n)} ${e.n===1?'shipment':'shipments'}${nw>1?` from ${nw} warehouses`:''}${c!==v?` · ${svName(v)} can't take them`:''}</span></div><span class="cr-b">${nw} ${nw===1?'batch':'batches'}</span></div>`};
  const hRows=[...hBy].map(([c,n])=>`<div class="cr-sum-r"><span class="cr-ic">${ic('chat',16)}</span><div><b>${f(n)} waiting ${n===1?'order':'orders'}</b><span>${svName(c)} · ${n===1?'ships':'each ships'} as soon as ${n===1?'the':'that'} shopper replies</span></div><span class="cr-b">${f(n)} ${n===1?'batch':'batches'}</span></div>`).join('');
  const better=rec!=null&&rec!==v&&ST[rec].rate>ST[v].rate?(()=>{const d=svcPrice(SERVICES[rec])-svcPrice(SERVICES[v]);return`<div class="cr-sum-tip">${ic('bolt',15)}<span><b>${svName(rec)}</b> delivers more of its parcels where your orders are going (${pct1(ST[rec].rate)} against ${pct1(ST[v].rate)})${d>0?` for ${rp(d)} more`:d<0?` and costs ${rp(-d)} less`:''}.</span><button class="lnk" data-svc="${rec}">Switch</button></div>`})():'';
  const B=blockedList(),moved=B.reduce((a,[s,key])=>{const c=altOf(key);return a+(c!=null?SERVICES[c][4]*kgOf(s):0)},0);
  const row=([s,key,kind])=>{const o=bestOpts(s),c=altOf(key);return`<div class="cr-ro"><div class="cr-ro-h"><div><b>${s.name}</b><span>${s.addr.city} ${s.addr.zip}</span></div><button class="ib sp-x tt" data-tt="Remove order" data-altrm="${key}" aria-label="Remove ${s.name}'s order">${ic('trash',16)}</button></div>
    <div class="cr-ro-tags">${whyBlocked(v,s)==='cod'?'<span class="st bad">Red zone for COD</span>':'<span class="st warn">Out of coverage</span>'}${isCod(s)?'<span class="st pu">COD</span>':'<span class="st gr">Non-COD</span>'}${kind?`<span class="cr-wait">${ic('chat',13)}Waits on WhatsApp</span>`:''}</div>
    ${o.length?`<span class="sp-sw"><select data-alti="${key}" aria-label="Courier for ${s.name}">${c==null?'<option value="">Choose a courier</option>':''}${o.map((j,k)=>`<option value="${j}" ${c===j?'selected':''}>${svName(j)} · ${rp(SERVICES[j][4]*kgOf(s))} · ${pct1(rateAt(j,s))} delivered${k===0?' · Recommended':''}</option>`).join('')}</select></span>`:'<p class="cr-none">No courier delivers here. Remove this order to continue.</p>'}</div>`};
  return`<div class="cr-side-c"><div class="cr-sum-h"><b>${f(K)} ${K===1?'batch':'batches'}</b><span class="num">${rp(tot)}</span></div>
    <p class="cr-side-sub">One batch is one warehouse with one courier service. Each order waiting for a shopper is a batch of its own. The courier gives each parcel its AWB when you book.</p>
    ${cs.map(bRow).join('')}${hRows}${better}</div>
    ${B.length?`<div class="cr-side-c"><div class="cr-sum-h"><b>${f(B.length)} ${B.length===1?"order can't":"orders can't"} go with ${svName(v)}</b></div>
    <p class="cr-side-sub">We picked the courier that delivers the most parcels to each of these addresses. Change any of them; each extra courier is one more batch.</p>
    <p class="sp-cover">${ic('check',14,2.4)}Every courier in these lists delivers to that address${B.some(([s])=>isCod(s))?', with no red zone for COD':''}.</p>
    <div class="cr-ro-list">${B.map(row).join('')}</div>
    <div class="cr-side-f"><span>${rp(moved)} for ${B.length===1?'this order':`these ${f(B.length)}`}</span><button class="btn btn-o" data-altrmall>Remove ${f(B.length)} ${B.length===1?'order':'orders'}</button></div></div>`:''}`};
/* pickup and summary: one row per courier service, with a batch for each warehouse in it */
pkGroups=function(cost){const by=new Map();groups().forEach(g=>{if(!by.has(g.v))by.set(g.v,[]);by.get(g.v).push(g)});
  return[...by].map(([v,gs])=>{const n=gs.reduce((a,g)=>a+g.ships.length,0),p=gs.reduce((a,g)=>a+gCost(g),0),open=X.pkOpen&&X.pkOpen[v];
    return`<div class="sx-ship pk-g${open?' open':''}"><button class="sx-sh" data-pkg="${v}" aria-expanded="${!!open}">${cLogo(SERVICES[v][0])}<span class="pk-t"><b>${svName(v)}</b><span>${gs.length} ${gs.length===1?'batch':'batches'} · ${parcels(n)} · ${gs.length===1?gs[0].w.n:`one from each of ${gs.length} warehouses`}</span></span>${cost?`<b class="num pk-p">${rp(p)}</b>`:''}<span class="chev">${ic('chev',16)}</span></button>
    <div class="sx-sb">${gs.map(g=>`<div class="pk-w"><div><b>${g.w.n}</b><span>${g.w.a}</span></div><span class="num">${parcels(g.ships.length)}</span>${cost?`<b class="num">${rp(gCost(g))}</b>`:''}</div>`).join('')}</div></div>`}).join('')};

/* ===== AG, 25 Oct ===== */

/* --- manual entry fills itself: the phone looks up the Customers list, the product looks up the Product catalog --- */
/* size and weight per catalog product (example data; the catalog will carry them) */
const PDIM={'Linen shirt · White':[30,25,4,.4],'Canvas tote bag':[40,35,3,.3],'Wide-leg trousers':[35,28,5,.5],'Basic tee · Black':[28,22,3,.2],'Voile scarf · Floral':[20,20,2,.1],'Leather sneakers':[33,22,12,1.2],'Batik dress · Indigo':[35,28,5,.5],'Gift wrapping':[10,10,2,.05]};
const digits=v=>String(v||'').replace(/\D/g,'').replace(/^(62|0)/,'');
const fmtPh=d=>d.replace(/^(\d{3})(\d{4})(\d+)$/,'$1-$2-$3');
/* the customer's last address (example data: the Customers list will keep it) */
const custAddr=c=>{const a=AREA[hsh(c.name)%AREA.length];return{street:`${STREETS[hsh(c.phone)%STREETS.length]} No. ${1+hsh(c.name+c.phone)%120}`,city:`${a.kec}, ${a.city}`,zip:a.zip}};
function acHtml(i,k,q){q=q.trim();if(!q)return'';
  if(k==='phone'){const d=digits(q),L=d.length<3&&!/[a-z]/i.test(q)?[]:ICUST.filter(c=>d.length>=3?digits(c.phone).includes(d):c.name.toLowerCase().includes(q.toLowerCase())).slice(0,5);
    return L.length?`<div class="ac-dd" role="listbox"><h6>${ic('user',13)}From your Customers</h6>${L.map(c=>{const a=custAddr(c);return`<button class="opt" data-acc="${i}" data-ph="${digits(c.phone)}"><b>${esc(c.name)}</b><span>+62 ${fmtPh(digits(c.phone))} · ${esc(a.city)}</span></button>`}).join('')}</div>`:''}
  const L=CATALOG.filter(p=>p[0].toLowerCase().includes(q.toLowerCase())&&p[0]!==q).slice(0,5);
  return L.length?`<div class="ac-dd" role="listbox"><h6>${ic('tag',13)}From your Product catalog</h6>${L.map(p=>{const d=PDIM[p[0]]||[0,0,0,.5];return`<button class="opt" data-acp="${i}" data-pn="${esc(p[0])}"><b>${esc(p[0])}</b><span>${rp(p[1])} · ${d[0]}×${d[1]}×${d[2]} cm · ${d[3]} kg</span></button>`}).join('')}</div>`:''}
sxBody.addEventListener('input',e=>{const t=e.target;if(t.dataset.si==null||!['phone','items'].includes(t.dataset.k))return;
  const box=t.closest('.sx-f');box.querySelector('.ac-dd')?.remove();box.classList.add('ac');box.insertAdjacentHTML('beforeend',acHtml(+t.dataset.si,t.dataset.k,t.value))});
sxBody.addEventListener('focusout',e=>{const box=e.target.closest&&e.target.closest('.sx-f.ac');if(box)setTimeout(()=>box.querySelector('.ac-dd')?.remove(),150)});
sxBody.addEventListener('mousedown',e=>{const b=e.target.closest('[data-acc],[data-acp]');if(!b)return;e.preventDefault();e.stopPropagation();
  if(b.dataset.acc!=null){const s=X.ships[+b.dataset.acc],c=ICUST.find(x=>digits(x.phone)===b.dataset.ph);s.phone=fmtPh(b.dataset.ph);s.name=c.name;s.addr=custAddr(c);track('customer_autofilled',{});toast(`${c.name.split(' ')[0]}'s name and last address filled in from Customers`)}
  else{const s=X.ships[+b.dataset.acp],p=CATALOG.find(x=>x[0]===b.dataset.pn),d=PDIM[p[0]]||[0,0,0,.5];s.items=p[0];[s.l,s.w,s.h]=d.slice(0,3).map(String);s.kg=String(Math.round(d[3]*(s.qty||1)*100)/100);if(!s.cod)s.cod=(p[1]*(s.qty||1)).toLocaleString('id-ID');track('product_autofilled',{});toast('Size, weight and price filled in from Product catalog')}
  drawSx()},true);

/* --- how the orders split into batches, and why: one warehouse and one courier service per batch; each waiting order is its own --- */
function splitHtml(){const G=groups(),held=X.held||[],by=new Map(),f=x=>x.toLocaleString('id-ID');G.forEach(g=>{if(!by.has(g.v))by.set(g.v,[]);by.get(g.v).push(g)});
  const K=G.length+held.length,park=(X.later||[]).length,L=[];
  [...by].sort((a,b)=>a[0]===X.svc?-1:b[0]===X.svc?1:0).forEach(([v,gs])=>{const n=gs.reduce((a,g)=>a+g.ships.length,0),why=v!==X.svc&&X.svc!=null?` ${svName(X.svc)} can't deliver to ${n===1?'this address':'these addresses'}, so ${n===1?'it goes':'they go'} with ${svName(v)}.`:'';
    L.push([gs.length,`<b>${svName(v)}</b> · ${f(n)} ${n===1?'order':'orders'}`,gs.length>1?`${gs.length} batches because they ship from ${gs.length} warehouses: ${gs.map(g=>`${g.w.n} (${f(g.ships.length)})`).join(', ')}. A courier picks up one warehouse at a time.${why}`:`1 batch from ${gs[0].w.n}.${why}`,cLogo(SERVICES[v][0])])});
  if(held.length)L.push([held.length,`<b>${f(held.length)} risky ${held.length===1?'shopper':'shoppers'}</b> waiting on WhatsApp`,`${held.length===1?'This order is its own batch':'Each of these orders is its own batch'}, so it ships the moment that shopper confirms.`,`<span class="cr-ic">${ic('chat',15)}</span>`]);
  return`<div class="split"><div class="split-h"><b>${f(K)} ${K===1?'batch':'batches'}</b><span>${L.map(l=>f(l[0])).join(' + ')}${L.length>1?` = ${f(K)}`:''}</span></div>
    <p>One batch is one warehouse with one courier service.</p>
    ${L.map(l=>`<div class="split-r">${l[3]}<div><span>${l[1]}</span><small>${l[2]}</small></div><em class="num">${f(l[0])}</em></div>`).join('')}
    ${park?`<div class="split-r muted"><span class="cr-ic">${ic('clock',15)}</span><div><span><b>${f(park)}</b> ${park===1?'order':'orders'} to decide later</span><small>Not in any batch. ${park===1?'It waits':'They wait'} in Monitoring for you to ship or cancel.</small></div><em class="num">0</em></div>`:''}</div>`}
/* the side panel on the courier step leads with the split */
const _crSide=crSide;
crSide=function(ST,rec){const h=_crSide(ST,rec);if(X.svc==null)return h;
  const d=document.createElement('div');d.innerHTML=h;const first=d.querySelector('.cr-side-c');const tip=first.querySelector('.cr-sum-tip');first.innerHTML=splitHtml()+(tip?tip.outerHTML:'');return d.innerHTML};

/* --- the final file: the orders exactly as they will be sent, after every fix, in FLIK's template --- */
const FINAL_HEAD=['Order','Status','Batch plan','Warehouse','Recipient name','Phone','Street','Kecamatan, city','Postcode','Product','Qty','Length (cm)','Width (cm)','Height (cm)','Weight (kg)','Payment','COD amount / item value','Courier','Service'];
function finalRows(){const rows=[],G=groups(),bOf=new Map();G.forEach((g,j)=>g.ships.forEach(i=>bOf.set(i,j+1)));
  const r=(s,st,b,v)=>[s.ref||'',st,b,whOf(s).k,s.name,'+62 '+s.phone,s.addr?s.addr.street:'',s.addr?s.addr.city:'',s.addr?s.addr.zip:'',s.items,s.qty||1,s.l||'',s.w||'',s.h||'',kgOf(s),isCod(s)?'COD':'Non-COD',codVal(s)||'',v==null?'':cName(SERVICES[v][0]),v==null?'':SERVICES[v][1]];
  X.ships.forEach((s,i)=>rows.push(r(s,'Ships now',`Batch ${bOf.get(i)} of ${G.length}`,svcFor(i))));
  (X.held||[]).forEach((h,k)=>rows.push(r(h.s,h.kind==='pay'?'Waits for payment on WhatsApp':'Waits for WhatsApp confirmation','Own batch',heldSvc(k))));
  (X.later||[]).forEach(s=>rows.push(r(s,'Decide later','Not booked',null)));
  rows.forEach((x,i)=>{if(!x[0])x[0]=i+1});return rows}
DL['sx-final']=()=>['flik-final-orders',FINAL_HEAD,finalRows()];
const finalCard=()=>`<section class="sx-card fin"><span class="ic">${ic('sheet',18)}</span><div><b>Final file</b><span>Your orders exactly as they will be sent: every fix applied, the courier and batch for each, and orders that wait or that you'll decide later. Keep this one, not the file you uploaded.</span></div>${dlBtn('sx-final','Download final file')}</section>`;

/* steps 2 and 3 show the split under the lead; Summary and the done screen offer the final file */
const _drawSx2=drawSx;
drawSx=function(){_drawSx2();if(!X)return;const lead=sxBody.querySelector('.sx-main > .sx-lead');
  if(!X.done&&(X.step===2||X.step===3)&&lead)lead.insertAdjacentHTML('afterend',splitHtml());
  if(!X.done&&X.step===3&&lead)sxBody.querySelector('.split').insertAdjacentHTML('afterend',finalCard());
  if(X.done&&!X.done.heldOnly){const m=sxBody.querySelector('.sx-done');if(m)m.insertAdjacentHTML('beforeend',finalCard())}};

/* --- risky shoppers: "Decide later" parks the order in Monitoring without sending anything --- */
RK_ACT.later='Decide later';
/* the courier a parked order would use: the regular service that delivers best to that address */
const laterSvc=s=>{const o=toOurs(s),q=parcel(o);const v=bestFor({area:q.area,pay:q.pay,origin:q.origin},'reg');return v==null?SERVICES.findIndex(x=>x[2]==='reg'):v};

/* --- WhatsApp: VIP only, with limits so FLIK's shared number isn't abused; Delivery Boost after a failed attempt (defaults, 25 Oct) --- */
const VIP_FEE=500,COD_RESERVE={vip:10000000,std:2000000},WA_CAP=50,WA_PAUSE=.2,BOOST={pct:.02,min:2000};
const waNo=()=>{const L=PEND.filter(p=>p.kind!=='later'&&p.st!=='sent');return{n:L.length,no:L.filter(p=>p.st==='declined').length}};
const waPaused=()=>{const r=waNo();return r.n>=5&&r.no/r.n>WA_PAUSE};
const waOn=()=>!!PS.vip&&!waPaused();
const boostFee=s=>Math.max(BOOST.min,Math.round(s.val*BOOST.pct));
const _setMode=setMode;setMode=function(m){PS.vip=m!=='new';PS.boost=m!=='new';PS.waUsed=m==='new'?0:12;_setMode(m)};
function waSettings(){const r=waNo();modal.classList.add('nw');
  const draw=()=>{modal.innerHTML=`<div class="mh"><h3>WhatsApp to shoppers</h3><button class="ib" data-mclose aria-label="Close">${ic('x',18)}</button></div>
  <div class="mb"><div class="ws-r"><div><b>Confirm risky shoppers (VIP)</b><span>Ask a Risky COD shopper to confirm or pay before you ship. ${rp(VIP_FEE)} more platform fee on every shipment. Your COD reserve goes up from ${rp(COD_RESERVE.std)} to ${rp(COD_RESERVE.vip)}.</span></div><button class="sw${PS.vip?' on':''}" data-ws="vip" role="switch" aria-checked="${!!PS.vip}" aria-label="VIP"></button></div>
    <div class="ws-r"><div><b>Delivery Boost</b><span>When a delivery fails, FLIK messages the shopper on WhatsApp to agree a time before the next attempt. ${Math.round(BOOST.pct*100)}% of the COD amount, at least ${rp(BOOST.min)}, charged only when the parcel is then delivered.</span></div><button class="sw${PS.boost?' on':''}" data-ws="boost" role="switch" aria-checked="${!!PS.boost}" aria-label="Delivery Boost"></button></div>
    <div class="ws-lim"><b>Limits</b><ul><li>Only orders scored Risky can get a check.</li><li>${WA_CAP} checks a day. ${PS.vip?`${PS.waUsed} used today.`:''}</li><li>One resend per order.</li><li>Checks pause if more than ${Math.round(WA_PAUSE*100)}% of your shoppers say they didn't order. Now: ${r.no} of ${r.n}${r.n?` (${Math.round(r.no/r.n*100)}%)`:''}.</li></ul></div></div>
  <div class="mf"><button class="btn btn-p" data-mclose>Done</button></div>`;
  modal.querySelectorAll('[data-ws]').forEach(b=>b.onclick=()=>{const k=b.dataset.ws;PS[k]=!PS[k];track(k==='vip'?'vip_toggled':'delivery_boost_toggled',{on:PS[k]});draw();if(!document.getElementById('view-mon').hidden)renderMon()})};
  draw();mscrim.classList.add('open')}
document.addEventListener('click',e=>{if(e.target.closest('[data-wset]')){e.stopPropagation();waSettings()}});
