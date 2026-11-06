/* ===== Studio: product photo → ready-to-post images (BUILD_SPEC section 3) =====
 * S1 public page · S2 designing + composer + watermark · S3 editor · S4 sign-up · S5 export and payment,
 * plus the dashboard Studio (what a lead and a merchant see after signing in).
 * No image generation: a cut-out product (sample SVGs here; rembg in production) + drawn scenes +
 * a deterministic composer. Layer JSON is the single source for previews and every export.
 */

/* ===== State ===== */
const STU={cat:null,vibe:'',name:'',logo:null,product:null,design:null,phase:'idle',stage:0,tab:'scene',busy:false};
GS.designs=[];GS.lead=null;GS.exportsUsed=0;
const stFont=()=>getComputedStyle(document.body).fontFamily||'Inter, Arial, sans-serif';
const stProd=id=>ST_PRODUCTS.find(p=>p.id===id);
const stScene=id=>ST_SCENES.find(s=>s.id===id);
const stFmt=f=>ST_FORMATS.find(x=>x[0]===f)||ST_FORMATS[0];
const stCopyCat=c=>ST_COPY[c]?c:'general';
const stCatName=c=>((ST_CATS.find(x=>x[0]===c)||[0,{en:c,id:c}])[1])[geLang()];

/* Product images load once; an upload becomes its own image */
const ST_IMG={};
const stImgReady=Promise.all(ST_PRODUCTS.map(p=>new Promise(r=>{const i=new Image();i.onload=i.onerror=()=>r();i.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(p.svg);ST_IMG[p.id]=i})));
const stThumbSrc=p=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(p.svg);

/* ===== Choosing scenes: category + vibe tags, then the AI fallback below 20% match ===== */
function stVibeTags(v){const w=String(v||'').toLowerCase().split(/[^a-z0-9.]+/).filter(Boolean);
  const known=w.filter(x=>x in ST_VIBE),tags=[...new Set(known.flatMap(x=>ST_VIBE[x]))];
  return{words:w.length,known:known.length,tags,pct:w.length?Math.round(known.length/w.length*100):100}}
function stRank(cat,tags,seen=[]){const c=['home','other'].includes(cat)?'general':cat;
  return ST_SCENES.map(s=>({s,score:(s.cats.includes(c)?3:0)+(s.cats.includes(cat)?1:0)+tags.filter(t=>s.tags.includes(t)).length*2-(seen.includes(s.id)?20:0)+(hsh(s.id+cat)%7)/10}))
    .sort((a,b)=>b.score-a.score).map(x=>x.s)}
function stPick(n=4){const d=STU.design,ranked=stRank(STU.cat,d.tags,d.seen),out=[],pals=new Set();
  for(const s of ranked){if(out.length>=n)break;if(pals.has(s.pal))continue;pals.add(s.pal);out.push(s)}
  for(const s of ranked){if(out.length>=n)break;if(!out.includes(s))out.push(s)}
  return out}
const ST_LAYOUTS=['left','center','band'];
function stNewVars(){const d=STU.design,scenes=stPick(4),cc=ST_COPY[stCopyCat(STU.cat)][d.tone][d.lang],r=mkRng(hsh(d.id+d.round));
  return scenes.map((s,i)=>({scene:s.id,layout:ST_LAYOUTS[(i+d.round)%3],h:cc.h[(i+d.round)%cc.h.length],s:cc.s[(i+d.round)%cc.s.length],c:cc.c[i%cc.c.length],hi:i+d.round,si:i+d.round,ci:i,badge:d.badge,ai:false,r:r()}))}

/* ===== Composer: variation → layer JSON → canvas or SVG ===== */
function stProductName(){return STU.name||(STU.product&&!STU.product.upload?stProd(STU.product.id).name[STU.design?STU.design.lang:geLang()]:'')||(geLang()==='id'?'Produk ini':'This product')}
function stLayers(v,W){const d=STU.design,f=stFmt(d.format),H=Math.round(W*f[2]),sc=stScene(v.scene),white=d.format==='white',k=W/1080;
  const ink=white?'#1d2430':sc.ink,acc=d.brand||sc.acc,L=[];
  L.push(white?{type:'scene',id:'white'}:{type:'scene',id:sc.id});
  /* product box: 60–75% of the shorter side in a plain shot; smaller when it shares the frame with text. It stands on the surface. */
  const lay=white?'white':v.layout,ps=Math.min(W,H)*({white:.74,left:.54,center:.48,band:.52})[lay]*(d.tight?.97:1);
  const base=lay==='white'?H/2+ps*.5:lay==='band'?H*.64:lay==='center'?H*.95:Math.min(H*.95,H*sc.surf.y+H*.08);
  const px=lay==='left'?W*.68:W/2,py=base-ps;
  const lightDx=(white||sc.light==='left'?1:-1)*ps*.06;
  L.push({type:'shadow',x:px+lightDx,y:base-ps*.03,rx:ps*.36,ry:ps*.05,opacity:white?.18:.32});
  L.push({type:'product',id:STU.product.id,upload:!!STU.product.upload,x:px-ps/2,y:py,w:ps,h:ps,tight:!!d.tight});
  if(!white){const m=W*.075,maxW=v.layout==='center'||v.layout==='band'?W-2*m:W*.44,al=v.layout==='left'?'left':'center',tx=al==='left'?m:W/2;
    const name=stProductName(),hs=W*(f[2]>1.5?.078:.07),ss=W*(f[2]>1.5?.036:.034);
    let y=v.layout==='band'?H*.7:H*(f[2]>1.5?.12:.1);
    if(v.layout==='band')L.push({type:'band',x:0,y:H*.66,w:W,h:H*.34,color:sc.surf.c[1],opacity:.92});
    const hl=stWrap(v.h,hs,700,maxW);L.push({type:'text',role:'headline',lines:hl,x:tx,y:y+hs,size:hs,weight:700,color:ink,align:al});
    y+=hs*1.12*hl.length+hs*.35;
    const sl=stWrap(v.s.replace('{name}',name),ss,400,maxW);L.push({type:'text',role:'sub',lines:sl,x:tx,y:y+ss,size:ss,weight:400,color:ink,align:al,opacity:.86});
    y+=ss*1.3*sl.length+ss*.9;
    const cs=W*.03;L.push({type:'cta',text:v.c,x:tx,y,size:cs,bg:acc,color:stOn(acc),align:al})}
  if(v.badge)L.push({type:'badge',text:v.badge,x:W-W*.13,y:white?W*.13:H*(v.layout==='band'?.1:.5),r:W*.085,bg:acc,color:stOn(acc)});
  if(d.logoOn){const lh=W*.07,pos=d.logoPos,lx=pos.includes('right')?W-W*.075-lh*2.6:W*.075,ly=pos.includes('top')?(white?W*.06:H*.035):H-lh-H*.035;
    if(!(pos==='top-left'&&!white&&v.layout!=='band'))L.push({type:'logo',x:lx,y:ly,h:lh,src:STU.logo,mono:stMono(),color:white?'#1d2430':ink});
    else L.push({type:'logo',x:lx,y:H-lh-H*.035,h:lh,src:STU.logo,mono:stMono(),color:ink})}
  return{w:W,h:H,format:d.format,scene:white?'white':sc.id,layers:L}}
const stMono=()=>{const b=GS.lead?GS.lead.brand:geMerchant()?GE_OWNER.store:(STU.name||'Brand');return b.split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase()};
function stOn(hex){const c=parseInt(hex.slice(1),16),r=c>>16&255,g=c>>8&255,b=c&255;return(r*299+g*587+b*114)/1000>150?'#1d2430':'#ffffff'}
const stMeasure=document.createElement('canvas').getContext('2d');
function stWrap(text,size,weight,maxW){stMeasure.font=`${weight} ${size}px ${stFont()}`;const words=String(text).split(' '),lines=[];let cur='';
  for(const w of words){const t2=cur?cur+' '+w:w;if(stMeasure.measureText(t2).width>maxW&&cur){lines.push(cur);cur=w}else cur=t2}if(cur)lines.push(cur);return lines.slice(0,3)}

/* Scenes are drawn, not photos (production uses licensed stock or own shots) */
function stDrawScene(x,id,W,H){
  if(id==='white'){x.fillStyle='#ffffff';x.fillRect(0,0,W,H);return}
  const s=stScene(id),g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,s.bg[0]);g.addColorStop(1,s.bg[1]);x.fillStyle=g;x.fillRect(0,0,W,H);
  const P2=s.props||[],sy=H*s.surf.y,r=mkRng(hsh(id));
  if(P2.includes('sun')){x.fillStyle='rgba(255,236,200,.55)';x.beginPath();x.arc(W*.72,H*.3,W*.2,0,7);x.fill()}
  if(P2.includes('arch')){x.fillStyle='rgba(255,255,255,.45)';x.beginPath();x.moveTo(W*.3,sy);x.lineTo(W*.3,H*.38);x.arc(W*.5,H*.38,W*.2,Math.PI,0);x.lineTo(W*.7,sy);x.fill()}
  if(P2.includes('circle')){x.fillStyle='rgba(255,255,255,.5)';x.beginPath();x.arc(W*.5,H*.45,W*.3,0,7);x.fill()}
  if(P2.includes('spot')){const sp=x.createRadialGradient(W*.55,sy,0,W*.55,sy,W*.55);sp.addColorStop(0,'rgba(255,240,210,.35)');sp.addColorStop(1,'rgba(255,240,210,0)');x.fillStyle=sp;x.fillRect(0,0,W,H)}
  if(P2.includes('window')){x.fillStyle='rgba(255,255,255,.35)';for(let i=0;i<4;i++){x.save();x.translate(W*(.1+i*.14),0);x.transform(1,0,-.35,1,0,0);x.fillRect(0,H*.05,W*.08,sy-H*.05);x.restore()}}
  if(P2.includes('stripe')){x.fillStyle='rgba(255,255,255,.18)';for(let i=0;i<6;i++)x.fillRect(W*(i*.18),0,W*.06,sy)}
  if(P2.includes('confetti')){for(let i=0;i<40;i++){x.fillStyle=i%2?'rgba(242,193,78,.8)':'rgba(255,255,255,.35)';x.beginPath();x.arc(r()*W,r()*sy*.9,W*(.004+r()*.008),0,7);x.fill()}}
  if(P2.includes('ketupat')){x.strokeStyle='rgba(201,154,46,.55)';x.lineWidth=W*.004;for(let i=0;i<5;i++){const cx=W*(.12+i*.19),cy=H*(.14+(i%2)*.06),d=W*.045;x.beginPath();x.moveTo(cx,cy-d);x.lineTo(cx+d,cy);x.lineTo(cx,cy+d);x.lineTo(cx-d,cy);x.closePath();x.stroke();x.beginPath();x.moveTo(cx,cy+d);x.lineTo(cx,cy+d*2.2);x.stroke()}}
  if(P2.includes('leaf')){x.fillStyle='rgba(74,124,89,.55)';for(let i=0;i<5;i++){x.save();x.translate(W*.1,sy-H*.02);x.rotate(-1.2+i*.32);x.beginPath();x.ellipse(0,-W*.12,W*.03,W*.12,0,0,7);x.fill();x.restore()}}
  const sg=x.createLinearGradient(0,sy,0,H);sg.addColorStop(0,s.surf.c[0]);sg.addColorStop(1,s.surf.c[1]);x.fillStyle=sg;x.fillRect(0,sy,W,H-sy);
  if(s.podium){x.fillStyle=s.podium;x.beginPath();x.ellipse(W/2,sy,W*.3,W*.05,0,0,7);x.fill();x.fillRect(W*.2,sy,W*.6,H*.04);x.beginPath();x.ellipse(W/2,sy+H*.04,W*.3,W*.05,0,0,Math.PI);x.fill()}
  if(s.surf.tex==='marble'){x.strokeStyle='rgba(150,140,130,.25)';x.lineWidth=W*.002;for(let i=0;i<7;i++){x.beginPath();let px=r()*W,py=sy+r()*(H-sy);x.moveTo(px,py);for(let j=0;j<4;j++){px+=W*.08;py+=(r()-.5)*H*.05;x.lineTo(px,py)}x.stroke()}}
  if(s.surf.tex==='wood'){x.strokeStyle='rgba(90,55,25,.18)';x.lineWidth=W*.003;for(let i=0;i<9;i++){const yy=sy+(H-sy)*(i+.5)/9;x.beginPath();x.moveTo(0,yy);x.bezierCurveTo(W*.3,yy+H*.006,W*.6,yy-H*.006,W,yy);x.stroke()}}
  if(s.surf.tex==='linen'){x.fillStyle='rgba(255,255,255,.08)';for(let i=0;i<60;i++)x.fillRect(0,sy+(H-sy)*i/60,W,1)}
  x.fillStyle='rgba(0,0,0,.06)';x.fillRect(0,sy,W,Math.max(1,H*.003))}

let stUploadImg=null;
function stDrawProduct(x,l){const img=l.upload?stUploadImg:ST_IMG[l.id];if(!img)return;
  if(!l.upload){x.drawImage(img,l.x,l.y,l.w,l.h);return}
  /* prototype stand-in for the cut-out: a soft oval mask on the photo */
  const c=document.createElement('canvas');c.width=Math.ceil(l.w);c.height=Math.ceil(l.h);const cx=c.getContext('2d'),ar=img.width/img.height;
  let dw=l.w,dh=l.h;if(ar>1)dh=l.w/ar;else dw=l.h*ar;cx.drawImage(img,(l.w-dw)/2,(l.h-dh)/2,dw,dh);
  cx.globalCompositeOperation='destination-in';const g=cx.createRadialGradient(l.w/2,l.h/2,Math.min(dw,dh)*(l.tight?.3:.34),l.w/2,l.h/2,Math.min(dw,dh)*(l.tight?.44:.5));
  g.addColorStop(0,'#000');g.addColorStop(1,'rgba(0,0,0,0)');cx.fillStyle=g;cx.fillRect(0,0,l.w,l.h);x.drawImage(c,l.x,l.y)}
let stLogoImg=null;
/* S6: a merchant's saved logo and brand colour come back in every design; a stranger or lead never gets them */
const stBrandImg=new Image();stBrandImg.src=GE_BRAND.logo;
function stBrandOn(){if(geMerchant()){if(!STU.logo||STU.logo===GE_BRAND.logo){STU.logo=GE_BRAND.logo;stLogoImg=stBrandImg}}else if(STU.logo===GE_BRAND.logo){STU.logo=null;stLogoImg=null}}
function stDrawLayers(x,J,{watermark=false,only=null}={}){const {w:W,h:H}=J,F=stFont();
  for(const l of J.layers){if(only&&!only.includes(l.type))continue;x.save();
    if(l.type==='scene')stDrawScene(x,l.id,W,H);
    if(l.type==='band'){x.globalAlpha=l.opacity;x.fillStyle=l.color;x.fillRect(l.x,l.y,l.w,l.h)}
    if(l.type==='shadow'){const g=x.createRadialGradient(l.x,l.y,0,l.x,l.y,l.rx);g.addColorStop(0,`rgba(0,0,0,${l.opacity})`);g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.translate(l.x,l.y);x.scale(1,l.ry/l.rx);x.translate(-l.x,-l.y);x.beginPath();x.arc(l.x,l.y,l.rx,0,7);x.fill()}
    if(l.type==='product')stDrawProduct(x,l);
    if(l.type==='text'){x.fillStyle=l.color;x.globalAlpha=l.opacity||1;x.font=`${l.weight} ${l.size}px ${F}`;x.textAlign=l.align;x.textBaseline='alphabetic';
      l.lines.forEach((t2,i)=>x.fillText(t2,l.x,l.y+i*l.size*(l.role==='headline'?1.12:1.3)))}
    if(l.type==='cta'){x.font=`600 ${l.size}px ${F}`;const tw=x.measureText(l.text).width,pw=tw+l.size*1.8,ph=l.size*2.1,bx=l.align==='left'?l.x:l.x-pw/2;
      x.fillStyle=l.bg;stRound(x,bx,l.y,pw,ph,ph/2);x.fill();x.fillStyle=l.color;x.textAlign='center';x.textBaseline='middle';x.fillText(l.text,bx+pw/2,l.y+ph/2+1)}
    if(l.type==='badge'){x.fillStyle=l.bg;x.beginPath();x.arc(l.x,l.y,l.r,0,7);x.fill();x.fillStyle=l.color;x.textAlign='center';x.textBaseline='middle';
      const fs=l.r*(l.text.length>8?.3:l.text.length>4?.38:.5);x.font=`700 ${fs}px ${F}`;const ws=stWrapLines(x,l.text,l.r*1.6);ws.forEach((t2,i)=>x.fillText(t2,l.x,l.y+(i-(ws.length-1)/2)*fs*1.1))}
    if(l.type==='logo'){if(l.src&&stLogoImg){const ar=stLogoImg.width/stLogoImg.height;x.drawImage(stLogoImg,l.x,l.y,l.h*ar,l.h)}
      else{x.strokeStyle=l.color;x.lineWidth=l.h*.06;x.beginPath();x.arc(l.x+l.h/2,l.y+l.h/2,l.h/2-x.lineWidth,0,7);x.stroke();x.fillStyle=l.color;x.font=`700 ${l.h*.36}px ${F}`;x.textAlign='center';x.textBaseline='middle';x.fillText(l.mono,l.x+l.h/2,l.y+l.h/2+1)}}
    x.restore()}
  if(watermark)stWatermark(x,W,H)}
function stWrapLines(x,t2,max){const w=t2.split(' '),out=[];let c='';for(const s of w){const n=c?c+' '+s:s;if(x.measureText(n).width>max&&c){out.push(c);c=s}else c=n}if(c)out.push(c);return out}
function stRound(x,a,b,w,h,r){x.beginPath();x.moveTo(a+r,b);x.arcTo(a+w,b,a+w,b+h,r);x.arcTo(a+w,b+h,a,b+h,r);x.arcTo(a,b+h,a,b,r);x.arcTo(a,b,a+w,b,r);x.closePath()}
/* The watermark is drawn into the pixels before anything is shown: no clean preview exists in the page */
function stWatermark(x,W,H){const F=stFont(),k=W/540;x.save();x.translate(W/2,H/2);x.rotate(-Math.PI/6);x.font=`600 ${15*k}px ${F}`;x.textAlign='center';
  for(let yy=-H;yy<H;yy+=70*k)for(let xx=-W;xx<W;xx+=200*k){x.fillStyle='rgba(255,255,255,.34)';x.fillText('FLIK Studio · preview',xx+((yy/70|0)%2)*100*k,yy);x.fillStyle='rgba(0,0,0,.14)';x.fillText('FLIK Studio · preview',xx+((yy/70|0)%2)*100*k+1,yy+1)}
  x.restore();x.fillStyle='rgba(20,24,33,.62)';x.fillRect(0,H-26*k,W,26*k);x.fillStyle='#fff';x.font=`500 ${11.5*k}px ${F}`;x.textAlign='center';x.textBaseline='middle';
  x.fillText(geLang()==='id'?'Unduh untuk menghapus watermark':'Download to remove the watermark',W/2,H-13*k)}
function stRender(v,W,opt){const J=stLayers(v,W),c=document.createElement('canvas');c.width=J.w;c.height=J.h;stDrawLayers(c.getContext('2d'),J,opt);return{c,J}}
/* previews leave the composer as watermarked JPEGs, like the signed 540 px URLs in production */
const stPreview=(v,W=540)=>stRender(v,W,{watermark:true}).c.toDataURL('image/jpeg',.72);

/* ===== S1 public page ===== */
GX.studio=g=>{const L=geLang();stBrandOn();STU.cat=STU.cat||(GS.lead?GS.lead.cat:null);
  return{html:`<div class="gx-in st-pub">
  <span class="st-eyebrow">${ic('sparkle',13)} FLIK Studio</span>
  <h1>${geT('studio.pub.h')}</h1><p class="st-lead">${geT('studio.pub.sub')}</p>
  <section class="st-start">
    <label class="st-drop" id="st-drop" tabindex="0"><input type="file" accept="image/*" id="st-file" hidden>${ic('upload',26,1.6)}<b>${geT('st.upload')}</b><span>${geT('st.upload.sub')}</span></label>
    <p class="st-or">${geT('st.samples')}</p>
    <div class="st-samples">${ST_PRODUCTS.map(p=>`<button class="st-smp${STU.product&&STU.product.id===p.id?' on':''}" data-smp="${p.id}" title="${esc(p.name[L])}"><img src="${stThumbSrc(p)}" alt="${esc(p.name[L])}"><span>${esc(p.name[L])}</span></button>`).join('')}</div>
    <div class="st-picked" id="st-picked">${stPickedHtml()}</div>
    <div class="st-form">
      <div class="fld"><label for="st-cat">${geT('st.cat')}</label><select id="st-cat"><option value="">${geT('st.cat.pick')}</option>${ST_CATS.map(([k,n])=>`<option value="${k}" ${STU.cat===k?'selected':''}>${n[L]}</option>`).join('')}</select></div>
      <div class="fld"><label for="st-vibe">${geT('st.vibe')} <span class="opt-l">${geT('st.optional')}</span></label><input id="st-vibe" value="${esc(STU.vibe)}" placeholder="${geT('st.vibe.ph')}"></div>
      <div class="fld"><label for="st-name">${geT('st.name')} <span class="opt-l">${geT('st.optional')}</span></label><input id="st-name" value="${esc(STU.name)}" placeholder="${geT('st.name.ph')}"></div>
      <div class="fld"><label>${geT('st.logo')} <span class="opt-l">${geT('st.optional')}</span></label><label class="btn btn-o st-logo-btn"><input type="file" accept="image/*" id="st-logo" hidden>${ic('upload',15)}<span id="st-logo-l">${STU.logo?geT('st.logo.set'):geT('st.logo.add')}</span></label></div>
    </div>
    <button class="btn btn-p st-go" id="st-go">${ic('sparkle',16)}${geT('st.go')}</button>
    <p class="st-trust">${ic('shield',14)}${geT('st.trust')}</p>
  </section>
  <h2 class="st-h2">${geT('st.how')}</h2>
  <div class="st-how">${[1,2,3].map(i=>`<div><span class="n">${i}</span><b>${geT('st.how'+i)}</b><span>${geT('st.how'+i+'.sub')}</span></div>`).join('')}</div>
  <h2 class="st-h2">${geT('st.ba')}</h2>
  <div class="st-ba" id="st-ba"></div>
  <p class="gx-foot">${geT('gx.by')}</p></div>`,after:stPubMount}};
function stPickedHtml(){if(!STU.product)return'';const p=STU.product.upload?null:stProd(STU.product.id);
  return`<span>${ic('check',14,2.4)}${STU.product.upload?geT('st.picked.upload'):geT('st.picked',{name:p.name[geLang()]})}</span>`}
function stPubMount(){track('studio_viewed',{account:GS.account});
  const b=document.getElementById('gx-body');
  b.querySelectorAll('[data-smp]').forEach(el=>el.onclick=()=>{const p=stProd(el.dataset.smp);STU.product={id:p.id};if(!document.getElementById('st-cat').value){STU.cat=p.cat;document.getElementById('st-cat').value=p.cat}
    b.querySelectorAll('[data-smp]').forEach(x=>x.classList.toggle('on',x===el));document.getElementById('st-picked').innerHTML=stPickedHtml();track('studio_sample_picked',{product:p.id})});
  const file=document.getElementById('st-file'),drop=document.getElementById('st-drop');
  drop.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();file.click()}};
  const take=f=>{if(!f)return;const rd=new FileReader();rd.onload=()=>{const i=new Image();i.onload=()=>{stUploadImg=i;STU.product={id:'upload',upload:true};b.querySelectorAll('[data-smp]').forEach(x=>x.classList.remove('on'));document.getElementById('st-picked').innerHTML=stPickedHtml();track('studio_upload_started',{})};i.src=rd.result};rd.readAsDataURL(f)};
  file.onchange=()=>take(file.files[0]);
  drop.ondragover=e=>{e.preventDefault();drop.classList.add('over')};drop.ondragleave=()=>drop.classList.remove('over');drop.ondrop=e=>{e.preventDefault();drop.classList.remove('over');take(e.dataTransfer.files[0])};
  document.getElementById('st-logo').onchange=e=>{const f=e.target.files[0];if(!f)return;const rd=new FileReader();rd.onload=()=>{const i=new Image();i.onload=()=>{stLogoImg=i;STU.logo=rd.result;document.getElementById('st-logo-l').textContent=geT('st.logo.set')};i.src=rd.result};rd.readAsDataURL(f)};
  ['cat','vibe','name'].forEach(k=>{const el=document.getElementById('st-'+k);el.oninput=el.onchange=()=>{STU[k]=el.value||(k==='cat'?null:'')}});
  document.getElementById('st-go').onclick=()=>{
    if(!STU.product){toast(geT('st.need.product'));return}
    if(!STU.cat){toast(geT('st.need.cat'));document.getElementById('st-cat').focus();return}
    stStart()};
  stImgReady.then(stBeforeAfter)}
function stBeforeAfter(){const el=document.getElementById('st-ba');if(!el)return;const keep={design:STU.design,product:STU.product,cat:STU.cat};
  el.innerHTML=[['iced-coffee','oak-table','fnb'],['serum-bottle','pastel-pink','beauty'],['sneakers','concrete-urban','fashion']].map(([pid,sid,cat])=>{
    STU.product={id:pid};STU.cat=cat;STU.design={id:'ba'+pid,format:'1:1',lang:geLang(),tone:'casual',badge:'',logoOn:false,logoPos:'bottom-left',brand:null,round:0,seen:[],tags:[]};
    const cc=ST_COPY[cat].casual[geLang()],v={scene:sid,layout:'left',h:cc.h[0],s:cc.s[0],c:cc.c[0],badge:''};
    const raw=document.createElement('canvas');raw.width=raw.height=300;const x=raw.getContext('2d');x.fillStyle='#b9b2a7';x.fillRect(0,0,300,300);x.fillStyle='#8f877b';x.fillRect(0,200,300,100);x.save();x.translate(150,150);x.rotate(.06);x.drawImage(ST_IMG[pid],-110,-120,220,220);x.restore();x.fillStyle='rgba(255,240,200,.18)';x.fillRect(0,0,300,300);
    return`<div class="st-ba-i"><figure><img src="${raw.toDataURL('image/jpeg',.7)}" alt="Phone photo"><figcaption>${geT('st.before')}</figcaption></figure><span class="arr">${ic('chev',18)}</span><figure><img src="${stPreview(v,300)}" alt="FLIK Studio result"><figcaption>${geT('st.after')}</figcaption></figure></div>`}).join('');
  Object.assign(STU,keep)}

/* ===== S2 designing ===== */
function stStart(){const l=useLimit('designsPerDay');if(!l.ok){toast(l.message);return}
  stBrandOn();const vt=stVibeTags(STU.vibe),merchantLogo=geMerchant();
  STU.design={id:'D'+Date.now().toString(36),format:'1:1',lang:geLang(),tone:'casual',badge:'',logoOn:!!STU.logo||merchantLogo,logoPos:'bottom-left',brand:merchantLogo?GE_BRAND.colour:null,round:0,seen:[],tags:vt.tags,match:vt.pct,vibeAi:false,vars:[],sel:0,tight:false,paid:{}};
  STU.phase='designing';STU.stage=0;STU.tab='scene';STU.t0=performance.now();
  if(location.hash==='#studio/edit')stMountEditor();else go('studio/edit');
  const steps=[600,1800,1200];let i=0;
  const vibeAsk=STU.vibe&&vt.words&&vt.pct<20?mockLLM('vibe',{vibe:STU.vibe}).then(r=>{if(r.ai){STU.design.tags=r.tags;STU.design.vibeAi=true}}):Promise.resolve();
  const next=()=>{STU.stage=++i;stDrawProgress();if(i<steps.length)setTimeout(next,steps[i]);else Promise.all([vibeAsk,stImgReady]).then(stReveal)};
  setTimeout(next,steps[0])}
function stReveal(){const d=STU.design;d.vars=stNewVars();d.seen.push(...d.vars.map(v=>v.scene));d.sel=0;STU.phase='reveal';stDrawProgress();
  d.vars.forEach((v,i)=>setTimeout(()=>{v.shown=true;if(i===3){STU.phase='ready';track('studio_previews_shown',{ms:Math.round(performance.now()-STU.t0),vibeAi:d.vibeAi});stMountEditor()}else stDrawTiles()},300*(i+1)))}

/* ===== S3 editor ===== */
GX.edit=g=>{if(!STU.design&&!STU.busy){STU.busy=true;setTimeout(()=>{STU.busy=false;if(!STU.product)STU.product={id:'linen-shirt'};if(!STU.cat)STU.cat=stProd(STU.product.id||'linen-shirt')?stProd(STU.product.id).cat:'fashion';if(!STU.design)stStart()},0)}
  return{title:geT('studio.edit.h'),actions:`<span id="st-acts"></span>`,html:`<div class="st-ed" id="st-ed"></div>`,after:stMountEditor}};
function stActs(){const el=document.getElementById('st-acts');if(!el)return;const d=STU.design,ready=STU.phase==='ready';
  const left=d?Math.max(0,limitCap('regenPerDesign')-(GS.usage['regenPerDesign:'+d.id]||0)):0;
  el.innerHTML=`<button class="btn btn-o" id="st-more" ${ready?'':'disabled'}>${ic('sparkle',15)}${geT('st.more')} <span class="st-left">${geT('st.left',{n:left})}</span></button>
  ${geMerchant()?`<button class="btn btn-o" id="st-use" ${ready?'':'disabled'}>${ic('rocket',15)}${GS.studioReturn?geT('st.use.back'):geT('st.use')}</button>`:''}
  <button class="btn btn-p" id="st-dl" ${ready?'':'disabled'}>${ic('export',15)}${geT('st.download')}</button>`;
  document.getElementById('st-more').onclick=stMore;document.getElementById('st-dl').onclick=()=>stGate('download');
  const u=document.getElementById('st-use');if(u)u.onclick=()=>stGate('use')}
function stMountEditor(){const ed=document.getElementById('st-ed');if(!ed)return;stActs();
  if(!STU.design){ed.innerHTML='';return}
  ed.innerHTML=`<div class="st-tiles" id="st-tiles"></div><div class="st-stage" id="st-stage"></div><aside class="st-panel" id="st-panel"></aside>`;
  stDrawTiles();if(STU.phase==='ready')stDrawMain();else stDrawProgress();stDrawPanel()}
const ST_STEPS=['st.s1','st.s2','st.s3','st.s4'];
function stDrawProgress(){const s=document.getElementById('st-stage');if(!s)return;if(STU.phase==='ready'){stDrawMain();return}
  s.innerHTML=`<div class="st-prog"><div class="st-prog-img">${STU.product&&!STU.product.upload?`<img src="${stThumbSrc(stProd(STU.product.id))}" alt="">`:''}<i></i></div>
  <ol>${ST_STEPS.map((k,i)=>`<li class="${i<STU.stage?'done':i===STU.stage?'now':''}"><span class="dot">${i<STU.stage?ic('check',12,2.6):''}</span>${geT(k)}${k==='st.s3'&&STU.design&&STU.design.vibeAi&&i<=STU.stage?' '+aiTag():''}</li>`).join('')}</ol></div>`;
  stDrawTiles()}
function stDrawTiles(){const el=document.getElementById('st-tiles');if(!el||!STU.design)return;const d=STU.design;
  el.innerHTML=[0,1,2,3].slice(0,STU.phase==='ready'?d.vars.length:4).map(i=>{const v=d.vars[i];return v&&v.shown?`<button class="st-tile${d.sel===i?' on':''}" data-tile="${i}" aria-label="Option ${i+1}"><img src="${v._prev||(v._prev=stPreview(v,220))}" alt="Option ${i+1}"></button>`:`<div class="st-tile sk"></div>`}).join('');
  el.querySelectorAll('[data-tile]').forEach(b=>b.onclick=()=>{d.sel=+b.dataset.tile;stDrawTiles();stDrawMain();stDrawPanel()})}
function stCur(){return STU.design.vars[STU.design.sel]}
function stRefresh(all){const d=STU.design;(all?d.vars:[stCur()]).forEach(v=>v._prev=null);stDrawTiles();stDrawMain()}
function stDrawMain(){const s=document.getElementById('st-stage');if(!s||STU.phase!=='ready')return;const v=stCur(),d=STU.design;
  s.innerHTML=`<div class="st-main st-f${d.format.replace(':','-')}"><img src="${stPreview(v,540)}" alt="${geT('st.preview')}" draggable="false"></div>
  <p class="st-note">${d.vibeAi?aiTag()+' ':''}${geT('st.note',{scene:stScene(v.scene).n,pct:d.match})}${STU.product.upload?' · '+geT('st.proto.cut'):''}</p>`}
function stDrawPanel(){const p=document.getElementById('st-panel');if(!p||!STU.design)return;const d=STU.design,ready=STU.phase==='ready',v=ready?stCur():null,L=d.lang;
  const tabs=[['scene','st.t.scene'],['text','st.t.text'],['format','st.t.format'],['brand','st.t.brand'],['cut','st.t.cut']];
  let body='';
  if(!ready)body=`<p class="d-sub">${geT('st.wait')}</p>`;
  else if(STU.tab==='scene'){const opts=stRank(STU.cat,d.tags,[]).slice(0,8);
    body=`<p class="d-sub">${geT('st.scene.sub')}</p><div class="st-scenes">${opts.map(s=>`<button class="st-sc${v.scene===s.id?' on':''}" data-sc="${s.id}"><canvas width="96" height="96" data-scc="${s.id}"></canvas><span>${esc(s.n)}</span></button>`).join('')}</div>`}
  else if(STU.tab==='text'){const cc=ST_COPY[stCopyCat(STU.cat)][d.tone][L];
    body=`<div class="fld"><label>${geT('st.tone')}</label><div class="seg st-seg">${['casual','formal','playful'].map(k=>`<button class="${d.tone===k?'on':''}" data-tone="${k}">${geT('st.tone.'+k)}</button>`).join('')}</div></div>
    <div class="fld"><label>${geT('st.copylang')}</label><div class="seg st-seg">${['id','en'].map(k=>`<button class="${L===k?'on':''}" data-clang="${k}">${k==='id'?'Bahasa':'English'}</button>`).join('')}</div></div>
    ${[['h','st.headline'],['s','st.subline'],['c','st.cta']].map(([k,lab])=>`<div class="fld"><label for="st-${k}">${geT(lab)}</label><div class="st-tx"><input id="st-${k}" data-tx="${k}" value="${esc(v[k].replace('{name}',stProductName()))}"><button class="ib" data-cyc="${k}" title="${geT('st.cycle')}" aria-label="${geT('st.cycle')}">${ic('repeat',15)}</button></div></div>`).join('')}
    <button class="lnk st-nofit" data-nofit>${geT('st.nofit')}</button><div id="st-ai"></div>
    <div class="fld"><label for="st-badge">${geT('st.badge')}</label><select id="st-badge">${ST_BADGES[L].map(b=>`<option value="${esc(b)}" ${v.badge===b?'selected':''}>${b||geT('st.none')}</option>`).join('')}</select></div>`}
  else if(STU.tab==='format')body=`<div class="st-fmts">${ST_FORMATS.map(([k,n,r])=>`<button class="st-fmt${d.format===k?' on':''}" data-fmt="${k}"><i style="aspect-ratio:1/${r}"></i><span>${n}</span></button>`).join('')}</div>`;
  else if(STU.tab==='brand')body=`<label class="st-chk"><input type="checkbox" id="st-logo-on" ${d.logoOn?'checked':''}> ${geT('st.logo.show')}</label>
    <p class="d-sub">${STU.logo===GE_BRAND.logo?geT('st.logo.saved'):STU.logo?geT('st.logo.yours'):geT('st.logo.mono')}</p>
    <div class="fld"><label>${geT('st.logo.pos')}</label><div class="st-pos">${['top-left','top-right','bottom-left','bottom-right'].map(k=>`<button class="${d.logoPos===k?'on':''}" data-pos="${k}">${geT('st.pos.'+k)}</button>`).join('')}</div></div>
    <div class="fld"><label>${geT('st.colour')}</label><div class="st-cols">${[null,...(geMerchant()?[GE_BRAND.colour]:[]),'#5b4bdb','#c2410c','#0f766e','#be185d','#1d2430','#ca8a04'].map(c=>`<button class="${d.brand===c?'on':''}" data-col="${c||''}" style="background:${c||'conic-gradient(#e3b65c,#d64f78,#1f8a6c,#e3b65c)'}" aria-label="${c||geT('st.col.auto')}"></button>`).join('')}</div></div>`;
  else if(STU.tab==='cut')body=`<p class="d-sub">${geT('st.cut.sub')}</p><div class="st-cut"><button class="btn btn-o" data-cut="erase">${geT('st.erase')}</button><button class="btn btn-o" data-cut="restore">${geT('st.restore')}</button></div>`;
  p.innerHTML=`<div class="tabs st-tabs" role="tablist">${tabs.map(([k,l])=>`<button class="tab${STU.tab===k?' on':''}" data-stab="${k}" role="tab" aria-selected="${STU.tab===k}">${geT(l)}</button>`).join('')}</div><div class="st-pb">${body}</div>`;
  p.querySelectorAll('canvas[data-scc]').forEach(c=>stDrawScene(c.getContext('2d'),c.dataset.scc,96,96));
  p.onclick=stPanelClick;p.onchange=stPanelChange;p.oninput=e=>{const k=e.target.dataset.tx;if(!k)return;stCur()[k]=e.target.value;stCur()._prev=null;clearTimeout(STU.tt);STU.tt=setTimeout(()=>{stDrawMain();stDrawTiles();track('studio_edit',{field:k})},250)}}
function stPanelClick(e){const b=e.target.closest('button');if(!b)return;const d=STU.design,v=stCur(),D=b.dataset;
  if(D.stab){STU.tab=D.stab;stDrawPanel();return}
  if(D.sc){v.scene=D.sc;if(!d.seen.includes(D.sc))d.seen.push(D.sc);track('studio_edit',{field:'scene'});stRefresh();stDrawPanel();return}
  if(D.tone||D.clang){if(D.tone)d.tone=D.tone;if(D.clang){d.lang=D.clang;const bi=ST_BADGES.id.indexOf(v.badge);d.vars.forEach(x=>{const j=ST_BADGES.id.indexOf(x.badge)>=0?ST_BADGES.id.indexOf(x.badge):ST_BADGES.en.indexOf(x.badge);if(j>0)x.badge=ST_BADGES[d.lang][j]})}
    const cc=ST_COPY[stCopyCat(STU.cat)][d.tone][d.lang];d.vars.forEach(x=>{x.h=cc.h[x.hi%cc.h.length];x.s=cc.s[x.si%cc.s.length];x.c=cc.c[x.ci%cc.c.length];x.ai=false});
    track('studio_edit',{field:D.tone?'tone':'language'});stRefresh(true);stDrawPanel();return}
  if(D.cyc){const cc=ST_COPY[stCopyCat(STU.cat)][d.tone][d.lang],key=D.cyc+'i',arr=cc[D.cyc];v[key]=(v[key]||0)+1;v[D.cyc]=arr[v[key]%arr.length];track('studio_edit',{field:D.cyc});stRefresh();stDrawPanel();return}
  if('nofit' in D){const out=document.getElementById('st-ai');out.innerHTML=`<p class="d-sub">${geT('st.ai.wait')}</p>`;
    mockLLM('copy',{cat:STU.cat,name:stProductName(),lang:d.lang}).then(r=>{if(!r.ai){out.innerHTML=`<p class="d-sub">${esc(r.message)}</p>`;return}
      const opts=d.lang==='en'?['Cool all day, sharp all night','Premium comfort for long days','Easy, light, and made to stand out']:r.options;
      out.innerHTML=`<div class="st-aiopts">${aiTag()}${opts.map((o,i)=>`<button class="st-aio" data-aio="${i}">${esc(o)}</button>`).join('')}</div>`;
      out.querySelectorAll('[data-aio]').forEach(x=>x.onclick=()=>{v.h=opts[+x.dataset.aio];v.ai=true;stRefresh();stDrawPanel()})});return}
  if(D.fmt){d.format=D.fmt;track('studio_edit',{field:'format'});stRefresh(true);stDrawPanel();return}
  if(D.pos){d.logoPos=D.pos;d.logoOn=true;stRefresh(true);stDrawPanel();return}
  if('col' in D){d.brand=D.col||null;stRefresh(true);stDrawPanel();return}
  if(D.cut){d.tight=D.cut==='erase';toast(geT(D.cut==='erase'?'st.erased':'st.restored'));track('studio_edit',{field:'cutout'});stRefresh(true);return}}
function stPanelChange(e){const d=STU.design,v=stCur();
  if(e.target.id==='st-badge'){v.badge=e.target.value;stRefresh();track('studio_edit',{field:'badge'})}
  if(e.target.id==='st-logo-on'){d.logoOn=e.target.checked;stRefresh(true)}}
function stMore(){const d=STU.design,l=useLimit('regenPerDesign',d.id);if(!l.ok){toast(l.message);stActs();return}
  track('studio_regenerate',{left:l.left});d.round++;STU.phase='reveal';STU.t0=performance.now();
  const nv=stNewVars();d.seen.push(...nv.map(v=>v.scene));d.vars=nv;d.sel=0;stActs();
  const s=document.getElementById('st-stage');if(s)s.innerHTML=`<div class="st-prog"><p>${geT('st.s3')}…</p></div>`;stDrawTiles();
  nv.forEach((v,i)=>setTimeout(()=>{v.shown=true;stDrawTiles();if(i===3){STU.phase='ready';stMountEditor()}},250*(i+1)))}

/* ===== S4 sign-up gate (strangers only, after the design is ready) ===== */
function stGate(intent){track('studio_download_clicked',{account:GS.account,intent});
  if(GS.account==='anon'){stSignup(()=>intent==='use'?stUse():stExport());return}
  if(intent==='use')stUse();else stExport()}
function stUse(){if(!geMerchant()){toast(geT('st.use.merchant'));return}const s=stSave();s.merchant=true;track('studio_used_in_campaign',{back:!!GS.studioReturn});
  /* back to the idea that opened Studio, with this design as its image */
  if(GS.studioReturn){const id=GS.studioReturn.idea;GS.studioReturn=null;const d=GE.drafts[id];if(d){d.design=s.key;d.step=2}toast(geT('st.use.ok'));go('marketing/growth/idea/'+id);return}
  geIdeaPicker(s)}
/* "Use in a campaign" from Studio: pick which idea gets this image (campaign and post ideas both take one) */
function geIdeaPicker(s){geInit();const ideas=geIdeaList().filter(i=>!GE.dismissed[i.id]&&!geCampOf(i.id));modal.classList.add('nw');
  modal.innerHTML=`<div class="mh"><h3>${geT('st.pick.h')}</h3><button class="ib" data-mclose aria-label="Close">${ic('x',18)}</button></div>
  <div class="mb"><p class="vf-lead">${geT('st.pick.sub')}</p><div class="st-pick">${ideas.map(i=>`<button class="st-pi" data-pi="${i.id}"><span class="st ${i.type==='post'?'gr':'pu'} sm">${geT('g.type.'+i.type)}</span><b>${esc(geL(i.title))}</b><span>${i.ch.map(k=>geT('g.ch.'+k)).join(' · ')}</span></button>`).join('')||`<p class="d-sub">${geT('g.ideas.none')}</p>`}</div></div>
  <div class="mf"><button class="btn btn-o" data-mclose>${geT('pay.cancel')}</button></div>`;mscrim.classList.add('open');
  modal.querySelectorAll('[data-pi]').forEach(b=>b.onclick=()=>{const id=b.dataset.pi;closeModal();GE.drafts[id]=null;go('marketing/growth/idea/'+id);
    setTimeout(()=>{const d=GE.drafts[id];if(d){d.design=s.key;d.step=2;giDraw(d)}},0)})}
function stSignup(done){const L=geLang(),f={name:'',brand:'',phone:'',cat:STU.cat||'',link:'',consent:false};let step=1,sentAt=0,wrong=false;
  track('signup_started',{});
  const draw=()=>{modal.classList.add('nw');
    modal.innerHTML=step===1?`<div class="mh"><h3>${geT('su.h')}</h3><button class="ib" data-mclose aria-label="Close">${ic('x',18)}</button></div>
    <div class="mb"><p class="vf-lead">${geT('su.sub')}</p>
      <div class="vf-g">
      <div class="fld"><label for="su-name">${geT('su.name')}</label><input id="su-name" data-f="name" value="${esc(f.name)}" autocomplete="name"></div>
      <div class="fld"><label for="su-brand">${geT('su.brand')}</label><input id="su-brand" data-f="brand" value="${esc(f.brand)}"></div>
      <div class="fld"><label for="su-phone">${geT('su.phone')}</label><input id="su-phone" data-f="phone" value="${esc(f.phone)}" inputmode="tel" placeholder="0812 3456 7890"></div>
      <div class="fld"><label for="su-cat">${geT('st.cat')}</label><select id="su-cat" data-f="cat">${ST_CATS.map(([k,n])=>`<option value="${k}" ${f.cat===k?'selected':''}>${n[L]}</option>`).join('')}</select></div>
      <div class="fld" style="grid-column:1/-1"><label for="su-link">${geT('su.link')} <span class="opt-l">${geT('st.optional')}</span></label><input id="su-link" data-f="link" value="${esc(f.link)}" placeholder="instagram.com/brandkamu"></div></div>
      <label class="st-chk"><input type="checkbox" data-f="consent" ${f.consent?'checked':''}> ${geT('su.consent')}</label>
      <button class="lnk" style="justify-self:start;color:var(--primary);font-weight:500;font-size:13px" data-sufill>${geT('su.fill')}</button>
      <p class="st-err" id="su-err" hidden></p></div>
    <div class="mf"><button class="btn btn-o" data-mclose>${geT('pay.cancel')}</button><button class="btn btn-p" id="su-send">${ic('chat2',15)}${geT('su.send')}</button></div>`
    :`<div class="mh"><h3>${geT('su.otp.h')}</h3><button class="ib" data-mclose aria-label="Close">${ic('x',18)}</button></div>
    <div class="mb"><p class="vf-lead">${geT('su.otp.sub',{phone:fphone(f.phone)})}</p>
      <div class="st-phone"><div class="st-ph-top">FLIK ${ic('check',11,2.6)}</div><div class="ge-bub"><p>${esc(GE_WA.otp_login[L].replace('{{1}}','123456'))}</p></div><span class="st-ph-note">${geT('su.otp.proto')}</span></div>
      <div class="fld"><label for="su-code">${geT('su.code')}</label><input id="su-code" inputmode="numeric" maxlength="6" placeholder="••••••" class="st-code" autocomplete="one-time-code"></div>
      ${wrong?`<p class="st-err">${geT('su.wrong')}</p>`:''}
      <button class="lnk" data-resend style="justify-self:start;font-size:13px">${geT('su.resend')}</button></div>
    <div class="mf"><button class="btn btn-o" data-suback>${geT('su.back')}</button><button class="btn btn-p" id="su-ok">${geT('su.verify')}</button></div>`;
    mscrim.classList.add('open');const c=document.getElementById('su-code');if(c)c.focus()};
  draw();
  modal.oninput=modal.onchange=e=>{const k=e.target.dataset.f;if(k)f[k]=e.target.type==='checkbox'?e.target.checked:e.target.value};
  modal.onclick=e=>{const b=e.target.closest('button');if(!b)return;
    if('sufill' in b.dataset){Object.assign(f,{name:'Rina Wulandari',brand:'Dapur Rina',phone:'0813 5550 0123',cat:f.cat||'fnb',link:'instagram.com/dapur.rina',consent:true});draw();return}
    if(b.id==='su-send'){const err=document.getElementById('su-err'),miss=!f.name.trim()||!f.brand.trim()||!f.cat;
      if(miss||!phoneOk(normPhone(f.phone))){err.hidden=false;err.textContent=miss?geT('su.miss'):geT('su.badphone');return}
      if(normPhone(f.phone)===GE_OWNER.phone){err.hidden=false;err.innerHTML=`${geT('su.exists')} <button class="lnk" data-signin style="font-weight:600">${geT('su.signin')}</button>`;return}
      f.phone=normPhone(f.phone);waSend('otp_login',L,['123456'],null,f.phone);sentAt=Date.now();track('otp_sent',{});step=2;wrong=false;draw();return}
    if('signin' in b.dataset){closeModal();GS.account='active';toast(geT('su.signedin'));show();setTimeout(()=>stExport(),300);return}
    if('suback' in b.dataset){step=1;draw();return}
    if('resend' in b.dataset){if(Date.now()-sentAt<30000){toast(geT('su.wait30'));return}waSend('otp_login',L,['123456'],null,f.phone);sentAt=Date.now();toast(geT('su.resent'));return}
    if(b.id==='su-ok'){const code=(document.getElementById('su-code').value||'').replace(/\D/g,'');
      if(code!=='123456'){wrong=true;draw();return}
      track('otp_verified',{});GS.lang=GS.lang||geLang();GS.lead={...f};GS.account='lead';GS.usage={...GS.usage};track('signup_completed',{cat:f.cat,link:!!f.link,consent:f.consent});
      closeModal();toast(geT('su.welcome',{name:f.name.split(' ')[0]}));geSync('stu');stActs();setTimeout(done,250)}}}

/* ===== S5 export and payment ===== */
function stSave(){const d=STU.design,v=stCur(),key=d.id+':'+d.sel;
  let s=GS.designs.find(x=>x.key===key);if(!s){s={key,at:geNow(),product:{...STU.product},cat:STU.cat,name:STU.name,design:JSON.parse(JSON.stringify({...d,vars:[]})),v:JSON.parse(JSON.stringify({...v,_prev:null})),paid:false};GS.designs.unshift(s)}
  s.thumb=stPreview(v,220);return s}
function stExport(){const d=STU.design,saved=stSave(),L=geLang(),lead=GS.account==='lead';
  const quota=limitCap('freeExportsPerMonth'),left=Math.max(0,quota-GS.exportsUsed);
  const price=saved.paid?0:left>0?0:lead?GE_LIMITS.leadExportPrice:GE_LIMITS.exportPrice;
  const why=saved.paid?geT('ex.again'):left>0?geT('ex.free',{n:left,total:quota}):price===0?geT('ex.lead.free'):geT('ex.price',{price:rp(price)});
  const clean=stRender(stCur(),540,{watermark:false}).c.toDataURL('image/jpeg',.9);
  modal.classList.add('lg');
  modal.innerHTML=`<div class="mh"><h3>${geT('ex.h')}</h3><button class="ib" data-mclose aria-label="Close">${ic('x',18)}</button></div>
  <div class="mb st-ex"><div class="st-ex-img"><img src="${clean}" alt="${geT('st.preview')}"></div>
  <div class="st-ex-r"><p class="vf-lead">${geT('ex.sub')}</p>
    <div class="st-fmtl">${[['png','PNG 1080 px',true],['cut','Cut-out PNG',true],['svg','SVG',true],['psd','PSD (layers)',false]].map(([k,n,on])=>`<label class="st-chk"><input type="checkbox" data-ex="${k}" ${on?'checked':''}> ${n}${k==='psd'?` <span class="opt-l">${geT('ex.psd')}</span>`:''}</label>`).join('')}</div>
    <div class="st-price"><b>${price?rp(price):geT('ex.free.h')}</b><span>${why}</span></div>
    ${price&&!lead?`<div class="fld"><label>${geT('ex.method')}</label><div class="st-pm"><label class="st-chk"><input type="radio" name="pm" value="balance" checked> ${geT('ex.balance',{bal:rp(GS.balance)})}</label><label class="st-chk"><input type="radio" name="pm" value="link"> ${geT('ex.other')}</label></div></div>`:''}
    ${price&&lead?`<p class="d-sub">${geT('ex.lead.link')}</p>`:''}</div></div>
  <div class="mf"><button class="btn btn-o" data-mclose>${geT('pay.cancel')}</button><button class="btn btn-p" id="ex-go">${ic('export',15)}${price?geT('ex.pay',{price:rp(price)}):geT('st.download')}</button></div>`;
  mscrim.classList.add('open');
  document.getElementById('ex-go').onclick=()=>{const want=[...modal.querySelectorAll('[data-ex]:checked')].map(i=>i.dataset.ex);if(!want.length){toast(geT('ex.none'));return}
    const pm=(modal.querySelector('[name=pm]:checked')||{}).value||'link';
    const pay=!price?Promise.resolve({free:true}):pm==='balance'&&!lead?ledgerDebit(price,geT('ex.ledger')):paymentLinkSheet(price,geT('ex.ledger'));
    if(price&&pm==='link'||price&&lead)closeModal();
    pay.then(r=>{if(!saved.paid&&left>0)GS.exportsUsed++;saved.paid=true;if(price)track('export_paid',{method:r.ledgerTxnId?'balance':'payment_link',amount:price});
      closeModal();stDownload(want);stAfterExport()}).catch(()=>{})}}
function stFileBase(){const p=STU.product.upload?'product':STU.product.id,b=GS.lead?GS.lead.brand:geMerchant()?GE_OWNER.store:'flik-studio';return(b+'-'+p+'-'+STU.design.format.replace(':','x')).toLowerCase().replace(/[^a-z0-9-]+/g,'-')}
function stDownload(want){const v=stCur(),base=stFileBase(),files=[];
  if(want.includes('png'))files.push([base+'.png',()=>stRender(v,1080,{}).c.toDataURL('image/png')]);
  if(want.includes('cut'))files.push([base+'-cutout.png',()=>{const J=stLayers(v,1080),pl=J.layers.find(l=>l.type==='product'),c=document.createElement('canvas');c.width=Math.ceil(pl.w);c.height=Math.ceil(pl.h);stDrawProduct(c.getContext('2d'),{...pl,x:0,y:0});return c.toDataURL('image/png')}]);
  if(want.includes('svg'))files.push([base+'.svg',()=>URL.createObjectURL(new Blob([stSvg(v)],{type:'image/svg+xml'}))]);
  if(want.includes('psd'))toast(geT('ex.psd.toast'));
  files.forEach(([n,f],i)=>setTimeout(()=>{try{const a=document.createElement('a');a.href=f();a.download=n;document.body.appendChild(a);a.click();a.remove()}catch(e){}},i*350));
  track('export_downloaded',{formats:want.join(','),format:STU.design.format});
  if(files.length)toast(geT('ex.done',{n:files.length}))}
/* SVG export: scene and product as embedded images, every text as live, editable text */
function stSvg(v){const J=stLayers(v,1080),F='Inter, Arial, sans-serif',e=s=>esc(s).replace(/'/g,'&#39;');
  const sc=document.createElement('canvas');sc.width=J.w;sc.height=J.h;stDrawLayers(sc.getContext('2d'),J,{only:['scene','band','shadow']});
  const pl=J.layers.find(l=>l.type==='product'),pc=document.createElement('canvas');pc.width=Math.ceil(pl.w);pc.height=Math.ceil(pl.h);stDrawProduct(pc.getContext('2d'),{...pl,x:0,y:0});
  const parts=[`<image id="scene" href="${sc.toDataURL('image/jpeg',.9)}" x="0" y="0" width="${J.w}" height="${J.h}"/>`,`<image id="product" href="${pc.toDataURL('image/png')}" x="${pl.x}" y="${pl.y}" width="${pl.w}" height="${pl.h}"/>`];
  J.layers.forEach(l=>{const anc=l.align==='left'?'start':'middle';
    if(l.type==='text')parts.push(`<text id="${l.role}" x="${l.x}" y="${l.y}" font-family="${F}" font-size="${l.size}" font-weight="${l.weight}" fill="${l.color}" text-anchor="${anc}"${l.opacity?` opacity="${l.opacity}"`:''}>${l.lines.map((t2,i)=>`<tspan x="${l.x}" dy="${i?l.size*(l.role==='headline'?1.12:1.3):0}">${e(t2)}</tspan>`).join('')}</text>`);
    if(l.type==='cta'){stMeasure.font=`600 ${l.size}px ${stFont()}`;const pw=stMeasure.measureText(l.text).width+l.size*1.8,ph=l.size*2.1,bx=l.align==='left'?l.x:l.x-pw/2;
      parts.push(`<g id="cta"><rect x="${bx}" y="${l.y}" width="${pw}" height="${ph}" rx="${ph/2}" fill="${l.bg}"/><text x="${bx+pw/2}" y="${l.y+ph/2+l.size*.35}" font-family="${F}" font-size="${l.size}" font-weight="600" fill="${l.color}" text-anchor="middle">${e(l.text)}</text></g>`)}
    if(l.type==='badge')parts.push(`<g id="badge"><circle cx="${l.x}" cy="${l.y}" r="${l.r}" fill="${l.bg}"/><text x="${l.x}" y="${l.y+l.r*.12}" font-family="${F}" font-size="${l.r*(l.text.length>8?.3:l.text.length>4?.38:.5)}" font-weight="700" fill="${l.color}" text-anchor="middle">${e(l.text)}</text></g>`);
    if(l.type==='logo')parts.push(l.src?`<image id="logo" href="${l.src}" x="${l.x}" y="${l.y}" height="${l.h}"/>`:`<g id="logo"><circle cx="${l.x+l.h/2}" cy="${l.y+l.h/2}" r="${l.h/2-l.h*.06}" fill="none" stroke="${l.color}" stroke-width="${l.h*.06}"/><text x="${l.x+l.h/2}" y="${l.y+l.h*.62}" font-family="${F}" font-size="${l.h*.36}" font-weight="700" fill="${l.color}" text-anchor="middle">${e(l.mono)}</text></g>`)});
  return`<svg xmlns="http://www.w3.org/2000/svg" width="${J.w}" height="${J.h}" viewBox="0 0 ${J.w} ${J.h}"><!-- FLIK Studio export · layers: scene, product, text (editable), cta, badge, logo -->${parts.join('')}</svg>`}
function stAfterExport(){if(GS.account!=='lead')return;
  modal.classList.add('nw');
  modal.innerHTML=`<div class="mh"><h3>${geT('ex.next.h')}</h3><button class="ib" data-mclose aria-label="Close">${ic('x',18)}</button></div>
  <div class="mb"><p class="vf-lead">${geT('ex.next.sub')}</p></div>
  <div class="mf"><button class="btn btn-o" data-mclose>${geT('ex.next.stay')}</button><button class="btn btn-p" id="ex-dash">${geT('ex.next.go')}</button></div>`;
  mscrim.classList.add('open');document.getElementById('ex-dash').onclick=()=>{closeModal();go('marketing/studio')}}

/* ===== Dashboard Studio: what a lead (and a merchant) sees ===== */
function renderStudio(){const el=document.getElementById('view-stu'),lead=GS.account==='lead';stBrandOn();if(geMerchant())geInit();
  if(lead&&!GS.lead)GS.lead={...ST_LEAD_EXAMPLE};
  if(lead&&!GS.designs.length)stSeedLead();
  const designs=GS.designs,L=geLang();
  const usage=[['st.u.designs',limitLeft('designsPerDay'),limitCap('designsPerDay')],['st.u.exports',Math.max(0,limitCap('freeExportsPerMonth')-GS.exportsUsed),limitCap('freeExportsPerMonth')],['st.u.ai',limitLeft('llmFallbacksPerDay'),limitCap('llmFallbacksPerDay')]];
  el.innerHTML=`<div class="ph"><div><h1>${lead?geT('lead.h',{name:GS.lead.name.split(' ')[0]}):geT('studio.h')}</h1><p class="sec-sub ge-sub">${lead?geT('lead.sub',{brand:esc(GS.lead.brand)}):geT('studio.sub')}</p></div><button class="btn btn-p" data-stnew>${ic('plus',15)}${geT('st.new')}</button></div>
  ${lead?`<div class="st-leadtag"><span class="st pu">${geT('acct.lead')}</span>${geT('lead.tag')}</div>`:''}
  <div class="st-usage">${usage.map(([k,a,b])=>`<section class="card"><span>${geT(k)}</span><b>${a}<small> / ${b}</small></b><i><em style="width:${b?a/b*100:0}%"></em></i></section>`).join('')}</div>
  <div class="sec-h"><div><h2 class="sec">${geT('studio.designs')}</h2><p class="sec-sub">${geT('st.designs.sub')}</p></div></div>
  <div class="st-grid">${designs.length?designs.map((s,i)=>`<section class="card st-card"><img src="${s.thumb||''}" alt="${esc(s.v.h)}"><div><b>${esc(s.v.h.replace('{name}',''))}</b><span>${s.design.format} · ${geFdate(s.at)}${s.paid?' · '+geT('st.downloaded'):''}</span></div><div class="st-card-a"><button class="btn btn-o" data-stopen="${i}">${geT('st.open')}</button><button class="btn btn-o" data-stdl="${i}">${ic('export',14)}</button></div></section>`).join('')
    :`<section class="card w-empty"><span class="qic">${ic('studio',22,1.6)}</span><div><b>${geT('st.empty.h')}</b><span>${geT('st.empty.sub')}</span></div><button class="btn btn-p" data-stnew>${geT('st.new')}</button></section>`}</div>
  ${lead?`<div class="st-two">
    <section class="card st-cta"><span class="qic">${ic('eye',20,1.6)}</span><div><b>${geT('lead.cmp.h')}</b><span>${geT('lead.cmp.sub')}</span></div><a class="btn btn-o" href="#marketing/competitors">${geT('lead.cmp.go')}</a></section>
    <section class="card st-cta st-up"><span class="qic">${ic('rocket',20,1.6)}</span><div><b>${geT('gro.lead.h')}</b><ul>${['lead.b1','lead.b2','lead.b3','lead.b4'].map(k=>`<li>${ic('check',13,2.4)}${geT(k)}</li>`).join('')}</ul></div><button class="btn btn-p" data-gelead>${geT('gro.lead.cta')}</button></section></div>`:''}`;
  el.querySelectorAll('[data-stnew]').forEach(b=>b.onclick=()=>{STU.design=null;STU.product=null;STU.phase='idle';go(GS.account==='anon'?'studio':'studio/new')});
  el.querySelectorAll('[data-stopen]').forEach(b=>b.onclick=()=>stOpenSaved(designs[+b.dataset.stopen]));
  el.querySelectorAll('[data-stdl]').forEach(b=>b.onclick=()=>{stOpenSaved(designs[+b.dataset.stdl],true)});
  const up=el.querySelector('[data-gelead]');if(up)up.onclick=()=>{track('merchant_cta_clicked',{from:'studio'});toast('Opens FLIK merchant sign-up')};
  if(designs.some(s=>!s.thumb))stImgReady.then(()=>{designs.forEach(s=>{if(!s.thumb){const k=stSwap(s);s.thumb=stPreview(s.v,220);stSwap(k)}});if(location.hash==='#marketing/studio')renderStudio()})}
/* temporarily point the composer at a saved design */
function stSwap(s){const keep={product:STU.product,cat:STU.cat,name:STU.name,design:STU.design};STU.product=s.product;STU.cat=s.cat;STU.name=s.name;STU.design=s.design;return{product:keep.product,cat:keep.cat,name:keep.name,design:keep.design,v:null}}
function stOpenSaved(s,dl){STU.product=s.product;STU.cat=s.cat;STU.name=s.name;STU.design={...JSON.parse(JSON.stringify(s.design)),vars:[{...JSON.parse(JSON.stringify(s.v)),shown:true}],sel:0};STU.phase='ready';
  go('studio/edit');if(dl)setTimeout(stExport,300)}
function stSeedLead(){const p='cookie-jar',cc=ST_COPY.fnb.playful.id;
  [['festive-red','center',cc.h[0],'Baru'],['oak-table','left',cc.h[2],'']].forEach(([sc,lay,h,b],i)=>GS.designs.push({key:'seed'+i,at:new Date(NOW-(i+1)*HOUR*3),product:{id:p},cat:'fnb',name:'',paid:i===0,
    design:{id:'seed'+i,format:'1:1',lang:'id',tone:'playful',badge:b,logoOn:true,logoPos:'bottom-left',brand:null,round:0,seen:[],tags:[],match:100,tight:false},
    v:{scene:sc,layout:lay,h,s:cc.s[0],c:cc.c[0],hi:0,si:0,ci:0,badge:b}}));GS.exportsUsed=1}
/* "New design" inside the dashboard opens the same start form, full screen */
GX.new=g=>{const r=GX.studio(g);return{title:geT('st.new'),html:r.html,after:r.after}};
