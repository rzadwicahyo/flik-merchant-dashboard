/* ===== Bulk upload with the smart courier engine =====
 * 1. Template reader: maps the merchant's own columns to FLIK's template; the merchant confirms.
 *    Missing mandatory columns stay blank; kelurahan and postcode are filled where the engine can.
 * 2. Error suggestions: duplicates, missing fields, swapped fields, phone format, weight, address typos.
 * 3. Fix all with AI (Raam's flow from prototype v4), then the merchant fills what AI can't guess.
 * 4. Shopper score per row (risk checker).
 * The table, AI animation and styles are Raam's; the row rules are new.
 */
const BK_COLS=[['wh','Warehouse'],['name','Customer name'],['phone','Phone'],['street','Full address'],['prov','Province'],['city','City or regency'],['kec','Kecamatan'],['kel','Kelurahan'],['zip','Postcode'],['items','Product'],['qty','Qty'],['kg','Weight (kg)'],['pay','Payment'],['val','COD / value']];
const BK_LBL={zip:'Postcode',kel:'Kelurahan',kec:'Kecamatan',city:'City',prov:'Province',wh:'Warehouse',phone:'Phone',name:'Name',kg:'Weight',pay:'Payment',val:'COD amount',qty:'Quantity',items:'Product',_rm:'Row'};
const ADDRK=['prov','city','kec','kel','zip'];
/* FLIK's template (Template_FLIK_Shipping.xlsx) and an example of a merchant's own marketplace export */
const TPL_FLIK=['Kode Warehouse','Nama Pelanggan','No HP Pelanggan','Alamat: Lengkap','Alamat: Provinsi','Alamat: Kota','Alamat: Kecamatan','Alamat: Kelurahan','Alamat: Kode Pos','Alamat: Catatan Kurir','Metode Pembayaran','Total Nilai Barang / Total Nilai COD','Panjang Barang (cm)','Lebar Barang (cm)','Tinggi Barang (cm)','Berat (kg)','Nama Produk','Jumlah Produk'];
const OWN_MAP=[['No. Pesanan','INV/20261012/MPL/3381',null,'Kept as your order reference'],['Nama Penerima','Rina Putri','name','High'],['No. Telepon','0812-7781-2093','phone','High','Converted to 62…'],['Alamat Pengiriman','Jl. Melati No. 12','street','High'],
  ['Kecamatan','Coblong','kec','High'],['Kota/Kabupaten','Kota Bandung','city','High'],['Provinsi','Jawa Barat','prov','High'],['Produk','Linen shirt · White','items','High'],['Qty','2','qty','High'],['Berat (gram)','800','kg','Medium','Converted from grams to kg'],
  ['Pembayaran','COD','pay','High'],['Total Pembayaran','578.000','val','High'],['Gudang','JKT-01','wh','Medium','Matched to your warehouse codes'],['Catatan','Titip di satpam',null,'Sent to the courier as a note']];
const OWN_MISSING=[['kel','Kelurahan','Filled from the kecamatan and street'],['zip','Postcode','Filled from the kelurahan']];
/* issues planted in the example file: [row, fields as uploaded, AI fix or null (the merchant decides), message] */
const BK_ISS=[
  [2,{zip:'40153'},{zip:'40135'},'Postcode 40153 doesn’t match Dago. AI suggests 40135.',0],
  [9,{phone:'0812-3456-7781'},{phone:'6281234567781'},'Phone should start with 62. AI suggests 6281234567781.'],
  [17,{kel:'Sosromendran'},{kel:'Sosromenduran'},'Kelurahan “Sosromendran” not found. AI suggests Sosromenduran.',4],
  [33,{name:'6281377781234',phone:'Dewi Lestari'},{name:'Dewi Lestari',phone:'6281377781234'},'Name and phone look swapped. AI suggests switching them.'],
  [41,{kec:'Wonokrmo'},{kec:'Wonokromo'},'Kecamatan “Wonokrmo” not found. AI suggests Wonokromo.',9],
  [61,{kg:'450'},{kg:'0.45'},'450 kg for one basic tee looks like grams. AI suggests 0.45 kg.'],
  [88,{city:'Kota Semarng'},{city:'Kota Semarang'},'City “Kota Semarng” not found. AI suggests Kota Semarang.',3],
  [130,{prov:'Jawa Tmur'},{prov:'Jawa Timur'},'Province “Jawa Tmur” not found. AI suggests Jawa Timur.',10],
  [151,{phone:''},null,'Phone is empty. The courier needs it to deliver.'],
  [205,{wh:'JKT01'},{wh:'JKT-01'},'Warehouse “JKT01” doesn’t exist. AI suggests JKT-01.',7],
  [222,{_dup:221},{_rm:'1'},'Same shopper, address and product as row 222. AI suggests removing the duplicate.'],
  [258,{wh:'BDG1',prov:'Jabar'},{wh:'BDG-01',prov:'Jawa Barat'},'“BDG1” and “Jabar” not found. AI suggests BDG-01 and Jawa Barat.',1],
  [290,{pay:'Transfer'},{pay:'Non-COD'},'“Transfer” isn’t a payment method. Paid by transfer means Non-COD.'],
  [317,{wh:''},null,'Warehouse is empty. Choose where this order ships from.',5],
  [333,{val:''},null,'COD amount is empty. The courier needs it to collect.'],
  [376,{kel:'',zip:''},null,'Kelurahan and postcode are empty, and AI found more than one match. Choose them for Tebet.',8],
  [445,{wh:'',kel:'',zip:''},null,'Warehouse, kelurahan and postcode are empty. Choose all three.',6]];
const BK_AREAS=[0,1,2,3,4,5,6,7,8,9,10,11,12,13];
function makeRows(src){const R=mkRng(11),pk=a=>a[Math.floor(R()*a.length)],rows=[];
  for(let i=0;i<500;i++){const a=AREA[pk(BK_AREAS)],p=pk(PRODUCTS),q=1+Math.floor(R()*3);
    rows.push({i,name:pk(FN)+' '+pk(LN),phone:'628'+(1+Math.floor(R()*8))+String(Math.floor(1e8+R()*8.9e8)),street:`${pk(STREETS)} No. ${1+Math.floor(R()*120)}`,kel:a.kel,kec:a.kec,city:a.city,prov:a.prov,zip:a.zip,
      items:p[0],qty:String(q),kg:String(Math.max(.1,Math.round(p[2]*q*10)/10)),pay:R()<.78?'COD':'Non-COD',val:String(p[1]*q),wh:pk(['JKT-01','JKT-01','BDG-01','SBY-01']),bad:{}})}
  /* rows that land in a courier's red zone, so the courier step has something to split */
  [12,57,98,143,188,233,301,350,402,466,488].forEach((n,j)=>{const a=AREA.find(x=>x.kec===(j%3?'Denpasar Barat':'Medan Baru'))||AREA[11];Object.assign(rows[n],{kel:a.kel,kec:a.kec,city:a.city,prov:a.prov,zip:a.zip,pay:'COD'})});
  [19,77,160,240,380].forEach(n=>{const a=AREA.find(x=>x.kec==='Medan Petisah');Object.assign(rows[n],{kel:a.kel,kec:a.kec,city:a.city,prov:a.prov,zip:a.zip})});
  BK_ISS.forEach(([n,bad,fix,msg,ai])=>{const r=rows[n];if(ai!=null){const a=AREA[ai];Object.assign(r,{kel:a.kel,kec:a.kec,city:a.city,prov:a.prov,zip:a.zip})}
    if(bad._dup!=null){const o=rows[bad._dup];Object.assign(r,{name:o.name,phone:o.phone,street:o.street,kel:o.kel,kec:o.kec,city:o.city,prov:o.prov,zip:o.zip,items:o.items,qty:o.qty,kg:o.kg,pay:o.pay,val:o.val,wh:o.wh});r.dup=bad._dup;r.bad={_rm:''}}
    else{Object.assign(r,bad);r.bad=bad}
    r.flag=true;r.msg=msg;if(fix)r.fix={...fix};else r.need=Object.keys(bad)});
  if(src==='own')rows.forEach(r=>{if(!r.need||!r.need.includes('kel')){r.ai=['kel','zip'].filter(k=>!(r.fix&&k in r.fix));r.aiTx='kelurahan and postcode filled by AI';r.mapped=true}});
  return rows}
/* field rules */
function bkOk(r,k){const v=String(r[k]??'').trim();
  if(ADDRK.includes(k)||k==='wh')return bOpts(r,k).includes(r[k]);
  if(k==='phone')return phoneOk(v);if(k==='name')return!!v&&!/\d{5}/.test(v);if(k==='kg')return+v>0&&+v<=50;if(k==='qty')return+v>=1;
  if(k==='pay')return v==='COD'||v==='Non-COD';if(k==='val')return r.pay!=='COD'||+v.replace(/\D/g,'')>0;if(k==='_rm')return true;return!!v}
const bkSt=r=>r.removed?'rm':r.fix?'sug':r.need&&r.need.some(k=>!bkOk(r,k))?'err':'ok';
function bkCounts(){const B=X.bk;let ok=0,sug=0,err=0,flag=0,rm=0,risky=0;for(const r of B.rows){if(r.flag)flag++;const s=bkSt(r);s==='ok'?ok++:s==='sug'?sug++:s==='err'?err++:rm++;if(s!=='rm'&&r.pay==='COD'&&bkScore(r).cls==='bad')risky++}return{ok,sug,err,flag,rm,risky,left:sug+err}}
const bkArea=r=>({kel:r.kel,kec:r.kec,city:r.city,prov:r.prov,zip:r.zip});
function bkScore(r){const key=r.phone+'|'+r.kec;if(r._sk!==key){r._sk=key;r._sc=shopperScore(r.phone,bkArea(r))}return r._sc}
const bkCls=(r,k)=>r.fix&&k in r.fix?'sug':r.need&&r.need.includes(k)&&!bkOk(r,k)?'err':r.ai&&r.ai.includes(k)?'auto':'';
function bkApply(r){r.ai=(r.ai||[]).filter(k=>!(k in r.fix)).concat(Object.keys(r.fix).filter(k=>k!=='_rm'));
  if(r.fix._rm){r.removed=true;r.aiTx='duplicate removed by AI'}else{r.aiTx=Object.keys(r.fix).map(k=>`${BK_LBL[k]} ${r.bad[k]||'(empty)'} → ${r.fix[k]}`).join(', ');Object.assign(r,r.fix)}r.fix=null}
function bkCheck(r){
  if(r.removed)return`<div class="is-sm gr">${ic('trash',13)}Removed</div><div class="is ok full"><span class="msg">Duplicate of row ${r.dup+1}</span><button class="btn btn-o" data-bkundo="${r.i}">Undo</button></div>`;
  if(r.fix)return`<div class="is-sm sug">${ic('bolt',13)}AI suggestion</div><div class="is sug full"><span class="msg" title="${esc(r.msg)}">${ic('bolt',13)}${esc(r.msg)}</span><button class="btn btn-o" data-bkacc="${r.i}">Accept</button></div>`;
  if(bkSt(r)==='err')return`<div class="is-sm err">${ic('warn',13)}Needs your input</div><div class="is err full"><span class="msg" title="${esc(r.msg)}">${esc(r.msg)}</span></div>`;
  const note=r.flag&&r.aiTx?`Fixed by AI: ${r.aiTx}`:r.need||r.you?'Chosen by you':r.mapped?'Kelurahan and postcode filled by AI':'';
  return`<div class="is-sm ok">${ic('check',13,2.4)}Ready</div>${note?`<div class="is ok full"><span class="msg" title="${esc(note)}"><b>${ic('check',13,2.4)}Ready</b> · ${esc(note)}</span></div>`:''}`}
function bkCell(r,k,lab){const cls=bkCls(r,k),need=r.need&&r.need.includes(k),sel=ADDRK.includes(k)||k==='wh'||k==='pay';
  if(sel&&(k in r.bad)){const o=k==='pay'?['COD','Non-COD']:bOpts(r,k),cur=o.includes(r[k]),sg=r.fix&&r.fix[k];
    return`<td data-c="${k}" class="${cls} sel"><select data-bkr="${r.i}" data-bkk="${k}" aria-label="Row ${r.i+1} ${lab}">${cur?'':`<option value="${esc(r[k])}" selected>${esc(r[k])||'Choose'}</option>`}${o.map(v=>`<option value="${esc(v)}" ${r[k]===v?'selected':''}>${esc(v)}${sg===v?' · AI suggestion':''}</option>`).join('')}</select></td>`}
  const v=k==='val'&&r.val?Number(String(r.val).replace(/\D/g,'')).toLocaleString('id-ID'):r[k];
  return`<td data-c="${k}" class="${cls}"><input data-bkr="${r.i}" data-bkk="${k}" value="${esc(v)}" ${need?'placeholder="Required"':''} ${['zip','val','qty','kg','phone'].includes(k)?'inputmode="numeric"':''} aria-label="Row ${r.i+1} ${lab}"></td>`}
const bkTx=(r,k)=>`<td data-c="${k}" class="tx${k==='val'||k==='kg'||k==='qty'?' num':''}${r.ai&&r.ai.includes(k)?' autotx':''}">${k==='val'?(r.pay==='COD'?rp(+r.val):`<span class="inv-sub">${rp(+r.val)}</span>`):esc(r[k])}</td>`;
const bkScoreTd=r=>{const s=bkScore(r);return`<td class="tx sc">${r.removed?'':scorePill(s)}</td>`};
const bkTr=(r,check)=>`<tr data-bkr="${r.i}" class="${r.removed?'rmv':''}"><td class="rn">${r.i+1}</td>${BK_COLS.map(([k,l])=>check&&r.flag&&!r.removed&&k!=='_rm'?bkCell(r,k,l):bkTx(r,k)).join('')}${bkScoreTd(r)}${check?`<td class="iss" tabindex="0">${bkCheck(r)}</td>`:''}</tr>`;
function bkTable(rows,check){return`<div class="tbl-wrap bk${X.bk.fix?' busy':''}"><table><thead><tr><th></th>${BK_COLS.map(c=>`<th>${c[1]}</th>`).join('')}<th title="Shopper score: phone delivery history across FLIK and the area's success rate. Higher is safer.">Shopper score <span class="st pu sm">Beta</span></th>${check?'<th class="iss">Check</th>':''}</tr></thead><tbody>${rows.map(r=>bkTr(r,check)).join('')}</tbody></table></div>`}
function bkPick(el){const r=X.bk.rows[el.dataset.bkr],k=el.dataset.bkk;r[k]=el.value;if(r.fix&&k in r.fix){delete r.fix[k];r.you=true;if(!Object.keys(r.fix).length)r.fix=null}
  if(k==='kel'&&'zip' in r.bad&&!(r.fix&&r.fix.zip)){const z=bOpts(r,'zip');if(z.length===1)r.zip=z[0]}}
const BKPG=50;
const bkPager=n=>`<div class="foot"><span>Showing <b>${X.bk.pg*BKPG+1}–${Math.min(n,X.bk.pg*BKPG+BKPG)}</b> of <b>${n}</b></span><div class="pager"><button class="btn btn-o" data-bkpg="-1" ${X.bk.pg?'':'disabled'}>Previous</button><button class="btn btn-o" data-bkpg="1" ${(X.bk.pg+1)*BKPG<n?'':'disabled'}>Next</button></div></div>`;
function bkSumHtml(){const c=bkCounts(),B=X.bk;
  return`<span class="st ok">${c.ok} ready</span>${c.sug?`<span class="st pu">${c.sug} AI ${c.sug===1?'suggestion':'suggestions'}</span>`:''}${c.err?`<span class="st bad">${c.err} need your input</span>`:''}${c.rm?`<span class="st gr">${c.rm} removed</span>`:''}<span class="sp"></span>
  <div class="seg" role="tablist" aria-label="Rows"><button class="${B.bv==='issues'?'on':''}" data-bkv="issues" ${B.fix?'disabled':''}>Flagged · ${c.flag}</button><button class="${B.bv==='risky'?'on':''}" data-bkv="risky" ${B.fix?'disabled':''} title="COD shoppers with a low shopper score">Risky COD · ${c.risky}</button><button class="${B.bv==='all'?'on':''}" data-bkv="all" ${B.fix?'disabled':''}>All rows · ${B.rows.length}</button></div>
  ${B.fix?`<button class="btn btn-p ai-busy" disabled>${aiDots}Fixing ${Math.min(B.fix.done+1,B.fix.n)} of ${B.fix.n}</button>`:c.sug?`<button class="btn btn-p" data-bkfix>${ic('bolt',15)}Fix all with AI</button>`:''}`}
const bkView=()=>{const B=X.bk;return B.bv==='issues'?B.rows.filter(r=>r.flag):B.bv==='risky'?B.rows.filter(r=>!r.removed&&r.pay==='COD'&&bkScore(r).cls==='bad'):B.rows};

/* ---- the Details step for Bulk upload ---- */
function bulkHtml(){const B=X.bk;
  if(!B||B.stage==='drop')return`<div class="sx-drop"><span class="ic">${ic('upload',20)}</span><b>Upload your order file</b>CSV or Excel, up to 500 orders. Use FLIK's template, or your own export from a marketplace: the template reader matches the columns for you. Each row has its own warehouse and payment method.
    <div class="sx-row" style="justify-content:center;margin-top:16px"><a class="btn btn-o" href="assets/templates/Template_FLIK_Shipping.xlsx" download data-tpl>${ic('export',15)}Download template</a><button class="btn btn-p" data-bkup>Upload file</button></div></div>`;
  if(B.stage==='map')return mapHtml();
  const c=bkCounts(),rows=bkView(),paged=B.bv==='all'?rows.slice(B.pg*BKPG,B.pg*BKPG+BKPG):rows;
  const whs=[...new Set(B.rows.filter(r=>!r.removed).map(r=>r.wh).filter(c=>whCodes().includes(c)))];
  return`<p class="bk-file">${ic('sheet',15)}<span><b>${B.file}</b> · ${B.rows.length} rows from ${plural(whs.length,'warehouse')} (${whs.join(', ')})${B.src==='own'?' · columns matched to FLIK’s template':''}</span><button class="lnk" data-bkreset>Replace file</button></p>
  ${c.left?`<p class="sx-lead" style="margin:0 0 14px">${c.flag} rows need a look. AI can fix the typos and swapped fields; empty cells need you. There's no need to upload again.</p>`:`<div class="sx-note ok">${ic('check',16,2.4)}<span>All ${B.rows.length-c.rm} orders are ready to ship. Check the list, then continue.</span></div>`}
  ${c.risky&&!c.left?`<div class="sx-note warn">${ic('warn',16)}<span><b>${plural(c.risky,'COD shopper')} with a low shopper score.</b> Their phones have failed COD deliveries before. You can still ship them, ask them to pay first, or remove them in Risky COD.</span></div>`:''}
  ${B.fix?`<div class="bk-ai" id="bk-ai" role="status" aria-live="polite"><span class="bk-ai-ic">${ic('bolt',16)}</span><div><b>AI is fixing your rows</b><span id="bk-ai-tx">${B.fix.tx}</span></div><span class="bk-ai-n" id="bk-ai-n">${B.fix.done}/${B.fix.n}</span><div class="bk-ai-bar"><i id="bk-ai-fill"></i></div></div>`:''}
  <div class="bk-sum" id="bk-sum">${bkSumHtml()}</div>${rows.length?bkTable(paged,true):`<div class="empty"><b>Nothing here</b>No rows in this view.</div>`}${B.bv==='all'?bkPager(rows.length):''}`}
function mapHtml(){const B=X.bk;
  return`<p class="bk-file">${ic('sheet',15)}<span><b>${B.file}</b> · 500 rows · 14 columns</span><button class="lnk" data-bkreset>Replace file</button></p>
  <div class="map-h"><span class="bk-ai-ic">${ic('sparkle',16)}</span><div><b>We matched your columns to FLIK's template</b><span>Check the matches, change any that are wrong, then confirm. Next time this file format is matched automatically.</span></div></div>
  <div class="tbl-wrap map-t"><table><thead><tr><th>Your column</th><th>Example from your file</th><th>FLIK field</th><th>Match</th></tr></thead><tbody>
  ${OWN_MAP.map((m,i)=>`<tr><td><b>${m[0]}</b></td><td class="mono">${esc(m[1])}</td><td><select data-map="${i}" aria-label="FLIK field for ${m[0]}"><option value="">Don't import</option>${BK_COLS.map(([k,l])=>`<option value="${k}" ${B.map[i]===k?'selected':''}>${l}</option>`).join('')}</select>${m[4]?`<span class="map-n">${m[4]}</span>`:''}${!m[2]?`<span class="map-n">${m[3]}</span>`:''}</td><td>${m[2]?`<span class="st ${m[3]==='High'?'ok':'warn'} sm">${m[3]}</span>`:'<span class="st gr sm">Optional</span>'}</td></tr>`).join('')}
  ${OWN_MISSING.map(m=>`<tr class="miss"><td><span class="inv-sub">Not in your file</span></td><td></td><td><b>${m[1]}</b> <span class="st warn sm">Required</span><span class="map-n">${ic('sparkle',12)}Left blank, then ${m[2].toLowerCase()} by AI where it can</span></td><td><span class="st pu sm">AI fills</span></td></tr>`).join('')}
  </tbody></table></div>
  <div class="sx-row" style="justify-content:flex-end;margin-top:14px"><label class="map-save"><input type="checkbox" checked> Save as my template</label><button class="btn btn-p" data-bkmap>${ic('check',15,2.2)}Confirm columns</button></div>`}
/* the merchant picks an example file (the prototype doesn't read real spreadsheets yet) */
function bkUploadModal(){
  modal.innerHTML=`<div class="mh"><h3>Upload order file</h3><button class="ib" data-mclose aria-label="Close">${ic('x',18)}</button></div>
  <div class="mb"><p class="bk-mp">In this prototype, pick one of two example files of 500 orders.</p><div class="sx-wl">
  <button class="opt" data-bkex="flik"><span class="ic">${ic('sheet',18)}</span><div><b>Template_FLIK_Shipping.xlsx</b><span>FLIK's template, filled in. Columns match one to one.</span></div></button>
  <button class="opt" data-bkex="own"><span class="ic">${ic('sheet',18)}</span><div><b>pesanan-oktober.xlsx</b><span>Your own marketplace export. The template reader matches the columns and fills kelurahan and postcode.</span></div></button></div></div>`;
  mscrim.classList.add('open');modal.querySelectorAll('[data-bkex]').forEach(b=>b.onclick=()=>{closeModal();bkLoad(b.dataset.bkex)})}
function bkLoad(src){X.bk={stage:src==='own'?'map':'rows',src,file:src==='own'?'pesanan-oktober.xlsx':'Template_FLIK_Shipping.xlsx',map:OWN_MAP.map(m=>m[2]),rows:null,bv:'issues',pg:0,fix:null};
  track('bulk_file_uploaded',{source:src==='own'?'own_format':'flik_template',rows:500});
  if(src!=='own'){X.bk.rows=makeRows('flik');toast(`500 rows read, ${BK_ISS.length} to check`)}drawSx()}
function bkConfirmMap(){const B=X.bk;B.rows=makeRows('own');B.stage='rows';
  track('bulk_columns_confirmed',{changed:B.map.filter((k,i)=>k!==OWN_MAP[i][2]).length});toast(`Columns confirmed. AI filled kelurahan and postcode on ${B.rows.filter(r=>r.mapped).length} rows`);drawSx()}
function bkRefresh(i,whole){const r=X.bk.rows[i],tr=sxBody.querySelector(`tr[data-bkr="${i}"]`);
  if(tr&&whole)tr.outerHTML=bkTr(r,true);else if(tr){tr.querySelector('.iss').innerHTML=bkCheck(r);tr.querySelectorAll('td[data-c]').forEach(td=>td.className=bkCls(r,td.dataset.c)+(td.querySelector('select')?' sel':''));const sc=tr.querySelector('td.sc');if(sc)sc.outerHTML=bkScoreTd(r)}
  const s=document.getElementById('bk-sum');if(s)s.innerHTML=bkSumHtml();sxSync()}
function bkFixConfirm(){const rows=X.bk.rows.filter(r=>r.fix),n=rows.length,left=bkCounts().err,rw=n===1?'row':'rows';
  modal.innerHTML=`<div class="mh"><h3>Fix ${n} ${rw} with AI?</h3><button class="ib" data-mclose aria-label="Close">${ic('x',18)}</button></div>
  <div class="mb"><p class="bk-mp">AI fixes each flagged row with its suggestion, using FLIK's address data, your warehouses and the rest of your file. You can still change any cell afterwards.</p>
  <dl class="sum-kv bk-mlist">${rows.map(r=>`<dt>Row ${r.i+1}</dt><dd>${r.fix._rm?`<b>Remove</b> (duplicate of row ${r.dup+1})`:Object.keys(r.fix).map(k=>`${BK_LBL[k]} ${esc(r.bad[k]||'(empty)')} → <b>${esc(r.fix[k])}</b>`).join('<br>')}</dd>`).join('')}</dl>
  ${left?`<p class="bk-mp">${left} ${left===1?'row has':'rows have'} empty cells. AI can't guess those, so you'll choose them yourself.</p>`:''}</div>
  <div class="mf"><button class="btn btn-o" data-mclose>Cancel</button><button class="btn btn-p" id="bk-go">${ic('bolt',15)}Fix ${n} ${rw}</button></div>`;
  mscrim.classList.add('open');document.getElementById('bk-go').onclick=()=>{closeModal();bkFixRun()};setTimeout(()=>document.getElementById('bk-go').focus(),0)}
function bkFixRun(){const B=X.bk,rows=B.rows.filter(r=>r.fix),n=rows.length;let k=0;
  B.bv='issues';B.fix={done:0,n,tx:`Reading ${n} suggestions…`};drawSx();track('bulk_fix_all',{rows:n});
  const g=id=>document.getElementById(id);
  const upd=()=>{const f=B.fix;if(!g('bk-ai'))return;g('bk-ai-tx').textContent=f.tx;g('bk-ai-n').textContent=`${f.done}/${f.n}`;g('bk-ai-fill').style.width=`${f.done/f.n*100}%`;g('bk-sum').innerHTML=bkSumHtml()};
  const finish=()=>{if(!B.fix)return;B.fix=null;if(bkDoneCheck())return;drawSx();const left=bkCounts().err;toast(`AI fixed ${n} ${n===1?'row':'rows'}. ${left} still ${left===1?'needs':'need'} your input.`)};
  const step=()=>{if(!B.fix||!g('bk-ai'))return;if(k>=n){B.fix.tx='All suggestions applied';upd();setTimeout(finish,500);return}
    const r=rows[k],tr=sxBody.querySelector(`tr[data-bkr="${r.i}"]`);
    B.fix.tx=r.fix._rm?`Removing the duplicate in row ${r.i+1}`:`Fixing the ${Object.keys(r.fix).map(f=>BK_LBL[f].toLowerCase()).join(' and ')} in row ${r.i+1}`;upd();
    if(tr){tr.classList.add('aiw');tr.querySelectorAll('td.sug').forEach(td=>td.insertAdjacentHTML('beforeend','<svg class="ai-trace" aria-hidden="true"><rect pathLength="100" rx="6"/></svg>'));tr.querySelector('.iss').innerHTML=`<div class="is-sm sug">${aiDots}Fixing</div>`;tr.scrollIntoView({block:'nearest'})}
    setTimeout(()=>{if(!B.fix)return;bkApply(r);B.fix.done++;const t2=sxBody.querySelector(`tr[data-bkr="${r.i}"]`);
      if(t2){t2.outerHTML=bkTr(r,true);sxBody.querySelector(`tr[data-bkr="${r.i}"]`).classList.add('aidone')}k++;upd();setTimeout(step,120)},620)};
  setTimeout(step,600)}
function bkDoneCheck(){if(!bkCounts().left){const B=X.bk;B.bv='all';B.pg=0;drawSx();toast(`All ${B.rows.filter(r=>!r.removed).length} orders are ready`);track('bulk_rows_ready',{rows:B.rows.filter(r=>!r.removed).length});return true}return false}
const bkShip=r=>({phone:r.phone,name:r.name,addr:{street:r.street,area:bkArea(r)},wh:r.wh,pay:r.pay==='COD'?'cod':'non',items:r.items,qty:+r.qty||1,kg:r.kg,l:'',w:'',h:'',val:String(r.val).replace(/\D/g,''),row:r.i});
/* events from the bulk table; returns true when handled */
function bkClick(t){const d=t.dataset,B=X.bk;
  if('bkup' in d){bkUploadModal();return true}
  if('tpl' in d){track('template_downloaded',{});toast('Template_FLIK_Shipping.xlsx downloaded');return false}
  if('bkreset' in d){X.bk=null;drawSx();return true}
  if('bkmap' in d){bkConfirmMap();return true}
  if(d.bkacc!=null){bkApply(B.rows[d.bkacc]);if(!bkDoneCheck())bkRefresh(+d.bkacc,true);return true}
  if(d.bkundo!=null){const r=B.rows[d.bkundo];r.removed=false;r.fix={_rm:'1'};r.aiTx='';bkRefresh(+d.bkundo,true);return true}
  if('bkfix' in d){bkFixConfirm();return true}
  if(d.bkv){B.bv=d.bkv;B.pg=0;drawSx();return true}
  if(d.bkpg){B.pg+=+d.bkpg;drawSx();(sxBody.querySelector('.bk')||sxBody).scrollIntoView({block:'start'});return true}
  return false}
function bkInput(t){if(t.dataset.bkr==null||t.tagName==='SELECT')return false;const r=X.bk.rows[t.dataset.bkr],k=t.dataset.bkk;let v=t.value.trim();if(k==='val')v=v.replace(/\D/g,'');r[k]=v;if(r.fix&&k in r.fix){delete r.fix[k];r.you=true;if(!Object.keys(r.fix).length)r.fix=null}bkRefresh(+t.dataset.bkr);return true}
function bkChange(t){if(t.dataset.map!=null){X.bk.map[+t.dataset.map]=t.value;return true}
  if(t.dataset.bkr==null)return false;if(t.tagName==='SELECT')bkPick(t);const i=+t.dataset.bkr,sel=t.tagName==='SELECT';setTimeout(()=>{if(!bkDoneCheck())bkRefresh(i,sel)},0);return true}
