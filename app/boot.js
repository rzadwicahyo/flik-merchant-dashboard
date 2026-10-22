/* ===== Router (replaces Raam's show) and start-up ===== */
document.getElementById('view-trk').hidden=document.getElementById('view-cou').hidden=true;
function show(){const h=location.hash.replace(/^#/,'');let view=null;
  if(h==='invoices/create'){view='inv';openEditor()}else if(!ie.hidden)closeEditor();
  if(h==='shipments/create'){view='shp';if(sx.hidden)openShip()}else if(!sx.hidden)closeShip();
  if(h==='warehouses/new'){view='wh';openWh()}else if(!wx.hidden&&!whEdit)closeWh();
  if(h==='merchant-cash-advance/apply'){view='mca';openMca()}else if(!mx.hidden)closeMca();
  if(!view)view=Object.keys(VIEWS).find(k=>VIEWS[k][0]===h)||(h==='tracking'?'mon':'home');
  /* an active shipper goes straight to Create shipment; the list lives in Monitoring */
  if(view==='shp'&&h!=='shipments/create'&&SH.length){location.replace('#shipments/create');return}
  renderNav();
  Object.keys(VIEWS).forEach(k=>{const el=document.getElementById('view-'+k);if(el)el.hidden=k!==view});
  document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('on',b.dataset.view===view));
  document.title=VIEWS[view][1]+' | FLIK Dashboard';
  if(view==='home'){renderHomeExtra();if(has('pay'))drawChart()}
  if(view==='shp'&&sx.hidden)renderShp();
  if(view==='mon')renderMon();
  if(view==='cr')renderCr();
  if(view==='ana')renderAna();
  if(view==='mca')renderMca();
  if(view==='bal')renderBal();
  if(view==='cus')renderCus();
  if(view==='prd')renderPrd();
  if(view==='wh')renderWh();
  if(view==='inv')renderInv();
  ['shp','mon','cr','ana','inv'].forEach(v=>{if(view===v)openGrp(v)});
  closeDetail();setSide(false);if(sx.hidden)scrollTo(0,0);
  track('page_viewed',{page:VIEWS[view][0]})}
(async()=>{
  const q=new URLSearchParams(location.search);
  if(FLAGS[q.get('products')])PS.flags=q.get('products');
  try{await FLIK.api.merchant()}catch(e){}
  setMode(q.get('merchant')==='new'?'new':'active');
})();
