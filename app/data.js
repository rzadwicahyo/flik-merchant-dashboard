/* ===== Example data and the smart courier engine =====
 * Everything here is made up and seeded, so it is the same on every load. In production these
 * answers come from FLIK's API (see app/api.js and docs/API.md).
 */

/* --- Destinations: Raam's address list plus a few outside Java --- */
ADDR_DB.push(['Pandang','Panakkukang','Kota Makassar','Sulawesi Selatan','90231'],['Darat','Medan Baru','Kota Medan','Sumatera Utara','20153'],['Airlangga','Gubeng','Kota Surabaya','Jawa Timur','60286'],
  ['Sidokare','Sidoarjo','Kabupaten Sidoarjo','Jawa Timur','61214'],['Cisauk','Cisauk','Kabupaten Tangerang','Banten','15341'],['Braga','Sumur Bandung','Kota Bandung','Jawa Barat','40111'],['Kuta','Kuta','Kabupaten Badung','Bali','80361']);
const AREA=ADDR_DB.map(a=>({kel:a[0],kec:a[1],city:a[2],prov:a[3],zip:a[4]}));
const areaTx=a=>`${a.kel}, ${a.kec}, ${a.city}`;
const ISLAND={'DKI Jakarta':'jawa','Jawa Barat':'jawa','Jawa Tengah':'jawa','DI Yogyakarta':'jawa','Jawa Timur':'jawa','Banten':'jawa','Bali':'bali','Sumatera Utara':'sumatera','Sulawesi Selatan':'sulawesi'};
const whArea=w=>({kel:'',kec:w.dist,city:w.city,prov:w.prov,zip:w.zip});
const whByCode=c=>WH.find(w=>w.code===c)||WH_ALL.find(w=>w.code===c);

/* --- Rates: FLIK's discounted price per kg is SERVICES[4]; the published price is the courier's own --- */
const PUBX={'anteraja|Regular':12500,'sicepat|Regular':8000,'sicepat|GOKIL':40000,'jne|YES':21000,'spx|Standard':8500,'spx|Sameday':25000,'jnt|EZ':10500};
const pubKg=sv=>sv[5]||PUBX[sv[0]+'|'+sv[1]]||sv[4];
function zoneMul(o,d){if(o.city===d.city)return .7;if(o.prov===d.prov)return .85;const a=ISLAND[o.prov],b=ISLAND[d.prov];if(a===b)return 1;
  const far={bali:1.35,sumatera:1.7,sulawesi:2};return far[a==='jawa'?b:a]||1.8}
const r100=n=>Math.round(n/100)*100;
/* price of one parcel: published, discounted (what FLIK charges) */
function rateOf(svIdx,origin,dest,kg){const sv=SERVICES[svIdx],m=zoneMul(origin,dest),k=Math.max(1,Math.ceil(kg||1));
  const pub=r100(pubKg(sv)*m)*k,net=r100(sv[4]*m)*k;return{pub,net,disc:pub-net,eta:etaOf(sv,m)}}
function etaOf(sv,m){if(m<1.3||/Same/i.test(sv[3]))return sv[3];const n=sv[3].match(/\d+/g);if(!n)return sv[3];const add=m>=1.6?2:1;return n.length>1?`${+n[0]+add}–${+n[1]+add} days`:`${+n[0]+add} days`}
/* Sameday only runs inside a province */
const reach=(i,o,d)=>!/Same/i.test(SERVICES[i][3])||zoneMul(o,d)<=.85;
const etaMax=sv=>{const n=String(sv[3]).match(/\d+/g);return n?+n[n.length-1]:1};

/* --- Delivery success by area: kecamatan when there are enough shipments, otherwise the city --- */
const SR_BASE={jne:93,jnt:92,spx:91,ninja:90,lion:89,sicepat:91,anteraja:90};
const SR_CITY={'Kota Bandung':{jne:4,spx:-5},'Jakarta Selatan':{spx:5,jnt:2,anteraja:2},'Kota Surabaya':{jnt:4,ninja:-5},'Kota Denpasar':{spx:-11,ninja:-8,jne:3},'Kabupaten Badung':{spx:-9,jne:2},
  'Kota Medan':{jnt:4,spx:-10,anteraja:-7},'Kota Yogyakarta':{sicepat:4,ninja:-5},'Kota Semarang':{jne:2,lion:2},'Kota Malang':{anteraja:-7,jne:2},'Kota Tangerang':{jnt:-6,spx:2},'Kota Makassar':{jne:4,spx:-5,jnt:-3,ninja:-6},'Kabupaten Sidoarjo':{jnt:3},'Kabupaten Tangerang':{spx:1}};
const clampSr=v=>Math.max(68,Math.min(98.6,v));
function srOf(k,a){const c=clampSr(SR_BASE[k]+((SR_CITY[a.city]||{})[k]||0)+((hsh(a.city+k)%30)/10-1.5));
  const n=hsh(a.kec+'|'+k)%260;if(n<45)return{sr:Math.round(c*10)/10,level:'city',n:900+hsh(a.city+k)%2400};
  return{sr:Math.round(clampSr(c+(hsh(a.kec+k)%80)/10-4)*10)/10,level:'kecamatan',n}}
/* --- Red zones: 'cod' means the courier won't take COD there, 'all' means it doesn't deliver there --- */
const RZ={spx:{'Denpasar Barat':'cod','Kuta':'cod','Medan Petisah':'all','Medan Baru':'cod'},jnt:{'Cipondoh':'cod'},ninja:{'Denpasar Barat':'cod','Gedongtengen':'cod','Panakkukang':'cod'},anteraja:{'Medan Petisah':'cod','Klojen':'cod'},sicepat:{'Gayungan':'cod'},lion:{'Panakkukang':'all'},jne:{}};
const rzOf=(k,a)=>(RZ[k]||{})[a.kec]||null;
const rzBlocks=(k,a,pay)=>{const z=rzOf(k,a);return z==='all'||(z==='cod'&&pay==='cod')};
const RZ_TX={cod:'Red zone for COD',all:'Not delivered'};

/* --- Shopper score: phone delivery history across FLIK plus the area's success rate. Higher is safer.
   Example data only; Legal still has to confirm how phone history may be used. --- */
function phist(p){const h=hsh(normPhone(p));if(h%13===0)return{fails:0,deliveries:0,isNew:true};return{fails:h%23===0?3:h%11===0?2:h%6===0?1:0,deliveries:1+h%9,isNew:false}}
/* inputs: the phone's COD history across FLIK, the area's COD delivery rate, order value and how complete the address is */
function shopperScore(p,a,o={}){const h=phist(p),asr=sum(COURIERS,c=>srOf(c.k,a).sr)/COURIERS.length,ok=VERIFIED.has(normPhone(p));
  const ph=h.isNew?80:Math.max(10,100-h.fails*26),val=+String(o.val||0).replace(/\D/g,''),st=String(o.street||'');
  const vPen=val>3000000?10:val>1500000?5:0,aPen=o.street!=null&&!/\d/.test(st)?8:0;
  const s=Math.max(1,Math.min(99,Math.round(.6*ph+.4*asr)-vPen-aPen+(ok?28:0)));
  const band=s>=80?['Safe','ok']:s>=60?['Watch','warn']:['Risky','bad'];
  const f=[['Phone history',h.isNew?'New to FLIK: no history yet':h.fails?`${h.fails} of ${h.deliveries+h.fails} COD parcels to this number came back`:`${h.deliveries} of ${h.deliveries} delivered`,h.fails>=2?'bad':h.fails?'warn':'ok'],
    ['Area',`${Math.round(asr)} in 100 COD parcels to ${a.kec} arrive`,asr<85?'warn':'ok']];
  if(o.val!=null)f.push(['Order value',vPen?`${rp(val)} is high for COD`:'Usual for COD',vPen?'warn':'ok']);
  if(o.street!=null)f.push(['Address',aPen?'No house number':'Complete',aPen?'warn':'ok']);
  if(ok)f.unshift(['WhatsApp','Shopper confirmed this order','ok']);
  const why=f.filter(x=>x[2]!=='ok'||x[0]==='WhatsApp').map(x=>x[1]).join('. ')||f[0][1];
  return{score:s,band:band[0],cls:band[1],why,f,fails:h.fails,verified:ok}}
const scorePill=sc=>`<span class="st ${sc.cls} sm" title="${esc(sc.why)}">${sc.score} · ${sc.band}</span>`;

/* --- Courier recommendation for a set of parcels: best delivery rate where they go, no red zones --- */
function recommend(ships,group='reg'){const out=[];
  SERVICES.forEach((sv,i)=>{if(sv[2]!==group||!svcOn(sv[0],sv[1])||ships.some(s=>!reach(i,s.origin,s.area)))return;
    const srs=ships.map(s=>srOf(sv[0],s.area)),red=ships.filter(s=>rzBlocks(sv[0],s.area,s.pay));
    out.push({i,k:sv[0],sr:Math.round(sum(srs,x=>x.sr)/Math.max(1,srs.length)*10)/10,city:srs.filter(x=>x.level==='city').length,red,
      net:sum(ships,s=>rateOf(i,s.origin,s.area,s.kg).net),pub:sum(ships,s=>rateOf(i,s.origin,s.area,s.kg).pub)})});
  const clean=out.filter(o=>!o.red.length),pool=clean.length?clean:out;
  const best=pool.slice().sort((a,b)=>b.sr-a.sr||a.net-b.net)[0],cheap=out.slice().sort((a,b)=>a.net-b.net)[0];
  return{list:out,best:best&&best.i,cheap:cheap&&cheap.i}}
/* for one parcel the chosen courier can't take: the best courier in the same group that can */
function bestFor(s,group,prefer){const ok=SERVICES.map((sv,i)=>[sv,i]).filter(([sv,i])=>sv[2]===group&&svcOn(sv[0],sv[1])&&(!s.origin||reach(i,s.origin,s.area))&&!rzBlocks(sv[0],s.area,s.pay));
  if(prefer!=null&&ok.some(([,i])=>i===prefer))return prefer;ok.sort((a,b)=>srOf(b[0][0],s.area).sr-srOf(a[0][0],s.area).sr);return ok.length?ok[0][1]:null}

/* ===== Shipments of the active merchant ===== */
const SST3={pickup:['Awaiting pickup','gr'],picked:['Picked up','gr'],transit:['In transit','gr'],ofd:['Out for delivery','pu'],delivered:['Delivered','ok'],failed:['Delivery failed','warn'],returning:['Returning','warn'],returned:['Returned','gr'],lost:['Lost or damaged','bad']};
const MON3={ontrack:['On track','pu'],delayed:['Delayed','warn'],risk:['At risk','or'],problem:['Problem','bad'],safe:['Safe','ok']};
const SEV3={problem:['Critical','bad',0],risk:['High','or',1],delayed:['Medium','warn',2]};
const stPill3=s=>`<span class="st ${SST3[s][1]} sm">${SST3[s][0]}</span>`;
const monPill=m=>`<span class="st ${MON3[m][1]} sm">${MON3[m][0]}</span>`;
const sevPill3=m=>SEV3[m]?`<span class="st ${SEV3[m][1]} sm">${SEV3[m][0]}</span>`:'';
const SH=[],BATCH=[],TK=[],CL=[],PEND=[],VERIFIED=new Set();
const FN=['Rina','Budi','Sari','Andi','Dewi','Fajar','Maya','Rizky','Putri','Agus','Nadia','Yoga','Intan','Bayu','Citra','Dimas','Eka','Gita','Hendra','Indah','Joko','Kartika','Lukman','Mega'],LN=['Putri','Santoso','Wulandari','Pratama','Lestari','Nugroho','Sari','Ramadhan','Ayu','Setiawan','Rahma','Saputra','Permata','Hidayat','Kusuma','Wijaya'];
const PRODUCTS=[['Linen shirt · White',289000,.4],['Canvas tote bag',149000,.3],['Wide-leg trousers',219000,.5],['Basic tee · Black',99000,.2],['Voile scarf · Floral',125000,.1],['Leather sneakers',459000,1.2],['Batik dress · Indigo',375000,.5]];
const STREETS=['Jl. Melati','Jl. Kenanga','Jl. Mawar','Jl. Anggrek','Jl. Cempaka','Jl. Flamboyan','Jl. Merdeka','Jl. Sudirman','Jl. Diponegoro','Jl. Gajah Mada'];
const AWBP={spx:'SPXID0',jnt:'JP',jne:'JNE0',ninja:'NLIDAP',lion:'99LP',sicepat:'0045',anteraja:'1000'};
let awbSeq=0;const mkAwb=k=>AWBP[k]+String(4100000000+(++awbSeq)*7919);
const ageOf=s=>(NOW-s.created)/DAY;
/* monitoring status from the shipment status and how long it has been quiet */
function monOf(s){const q=(NOW-s.upd)/HOUR;
  if(s.st==='delivered'||s.st==='returned')return'safe';
  if(s.st==='lost'||(s.st==='failed'&&s.tries>=2))return'problem';
  if(s.st==='failed'||s.st==='returning')return'risk';
  if(s.st==='pickup')return ageOf(s)>1.2?'delayed':'ontrack';
  if(q>=96)return'risk';if(q>=48||ageOf(s)>etaMax(SERVICES[s.svc])+1)return'delayed';return'ontrack'}
/* what the issue is and what to do about it */
function issueOf(s){const m=monOf(s);if(m==='safe'||m==='ontrack')return null;
  if(s.st==='lost')return{t:'Lost or damaged',act:'claim',next:'File a claim with the courier. FLIK handles it.'};
  if(s.st==='failed')return{t:s.tries>=2?`Delivery failed ${s.tries} times`:'Delivery attempt failed',act:'customer',next:'Confirm the address and a good time with the shopper.'};
  if(s.st==='returning')return{t:'Returning to you',act:'customer',next:'Contact the shopper to save the order.'};
  if(s.st==='pickup')return{t:'Pickup missed',act:'support',next:'Ask FLIK support to reschedule the pickup.'};
  const q=(NOW-s.upd)/HOUR;return q>=96?{t:`No update for ${Math.floor(q/24)} days`,act:'support',next:'Ask FLIK support to chase the courier.'}:{t:q>=48?'No update for 48 hours':'Past the delivery estimate',act:'support',next:'Ask FLIK support to follow up with the courier.'}}
/* Open → Acknowledged (an action was taken) → Resolved (the monitoring status is Safe again) */
const rstate=s=>{const m=monOf(s);if(s.tk&&m!=='safe')return'ack';if((s.tk||s.had)&&m==='safe')return'resolved';return m==='delayed'||m==='risk'||m==='problem'?'open':null};

function genActive(){const R=mkRng(4242),pk=a=>a[Math.floor(R()*a.length)];SH.length=0;BATCH.length=0;TK.length=0;CL.length=0;PEND.length=0;VERIFIED.clear();awbSeq=0;clSeq=0;
  const codes=['JKT-01','JKT-01','BDG-01','SBY-01'],mix=['spx','spx','jnt','jnt','jne','jne','ninja','ninja','sicepat','lion','anteraja'];
  const regOf=k=>SERVICES.findIndex(v=>v[0]===k&&v[2]==='reg');
  const dests=AREA.map((a,i)=>[a,i<14?3:1]).flatMap(([a,w])=>Array(w).fill(a));
  let bseq=0;
  for(let b=0;b<64;b++){
    const created=new Date(NOW-(b*2.85+R()*1.2)*DAY-R()*6*HOUR),k=pk(mix),svc=regOf(k),wh=pk(codes),n=b%4===0?30+Math.floor(R()*46):4+Math.floor(R()*23);
    const id=`B-${String(created.getFullYear()).slice(2)}${String(created.getMonth()+1).padStart(2,'0')}${String(created.getDate()).padStart(2,'0')}-${String(++bseq).padStart(3,'0')}`;
    BATCH.push({id,created,k,svc,wh});
    for(let j=0;j<n;j++){const a=pk(dests),p=pk(PRODUCTS),qty=1+Math.floor(R()*3),pay=R()<.8?'cod':'non',kg=Math.max(.1,Math.round(p[2]*qty*10)/10);
      const s={id:'S'+(SH.length+1),batch:id,created:new Date(created.getTime()+j*60000),svc,k,wh,area:a,street:`${pk(STREETS)} No. ${1+Math.floor(R()*120)}`,
        name:pk(FN)+' '+pk(LN),phone:'628'+(1+Math.floor(R()*8))+String(Math.floor(1e8+R()*8.9e8)),items:p[0],qty,kg,pay,val:p[1]*qty,tries:0,tk:null,had:null};
      const r=rateOf(svc,whArea(whByCode(wh)),a,kg);s.pub=r.pub;s.cost=r.net;s.codFee=pay==='cod'?Math.round(s.val*.03):0;
      const age=ageOf(s),eta=etaMax(SERVICES[svc]),sr=srOf(k,a).sr-(pay==='cod'?2+phist(s.phone).fails*13:0),x=R();
      if(age<.35){s.st='pickup';s.upd=s.created}
      else if(age<1){s.st='picked';s.upd=new Date(s.created.getTime()+.3*DAY)}
      else if(age<eta+.5){s.st=x<.75?'transit':'ofd';s.upd=new Date(NOW-R()*20*HOUR)}
      else if(age<eta+5&&x>sr/100){s.st=x>.995?'lost':R()<.75?'failed':'returning';s.tries=s.st==='failed'?(R()<.6?1:2):2;s.upd=new Date(NOW-(2+R()*30)*HOUR)}
      else if(x>sr/100){s.st=x>.997?'lost':'returned';s.tries=2;s.upd=new Date(s.created.getTime()+(eta+3+R()*3)*DAY)}
      else{s.st='delivered';s.upd=new Date(s.created.getTime()+(Math.max(1,eta-1)+R()*1.6)*DAY)}
      if(s.upd>NOW)s.upd=new Date(NOW-HOUR*(1+R()*3));
      s.awb=s.st==='pickup'&&R()<.3?null:mkAwb(k);SH.push(s)}}
  /* a few quiet parcels, so Monitoring has delays to show */
  SH.filter(s=>s.st==='transit').slice(0,22).forEach((s,i)=>{s.upd=new Date(NOW-(i%3===0?4.3:2.2+(i%4)*.3)*DAY)});
  SH.filter(s=>s.st==='pickup').slice(0,2).forEach(s=>{s.created=new Date(NOW-1.6*DAY);s.upd=s.created});
  /* some issues already handled: tickets in progress, and earlier delays that ended well */
  const iss=SH.filter(s=>issueOf(s));iss.filter((s,i)=>i%4===1).forEach((s,i)=>{const t=addTicket(s,issueOf(s).act,'Merchant',new Date(NOW-(3+i*5)*HOUR));
    if(i%2===0){t.st='progress';t.log.unshift(['FLIK support picked it up',new Date(t.created.getTime()+30*60000),'progress']);agentSay(t,'flik',`Hi, Dewi from FLIK support. I have asked ${cName(s.k)} for an update on this parcel.`,new Date(t.created.getTime()+30*60000))}});
  SH.filter(s=>s.st==='delivered'||s.st==='returned').filter((s,i)=>i%41===3).slice(0,14).forEach((s,i)=>{s.had={t:i%3?'No update for 48 hours':'Delivery attempt failed',act:i%3?'support':'customer'};
    const t=addTicket(s,s.had.act,'Merchant',new Date(s.upd.getTime()-2*DAY));t.st='resolved';
    t.log.unshift([s.st==='delivered'?'Delivered. Ticket closed':'Returned to sender. Ticket closed',s.upd,'resolved'],[t.type==='customer'?'Shopper replied on WhatsApp and confirmed the address':'FLIK support is chasing '+cName(s.k),new Date(t.created.getTime()+4*HOUR),'progress']);
    const t1=new Date(t.created.getTime()+25*60000),t2=new Date(t.created.getTime()+4*HOUR);
    agentSay(t,'flik',t.type==='customer'?'Hi! The shopper replied on WhatsApp and confirmed the address. I have passed it to the courier.':`Hi, Dewi here from FLIK support. I have asked ${cName(s.k)} to check this parcel and will update you here.`,t1);
    agentSay(t,'3pl',s.st==='delivered'?'Our hub found the parcel. It is out for delivery today.':'The shopper refused the parcel at the door, so we are sending it back to the warehouse.',t2);
    agentSay(t,'sys',s.st==='delivered'?'Delivered. Ticket closed':'Returned to sender. Ticket closed',s.upd)});
  /* a few fresh failed deliveries, so the failed-delivery queue has both kinds */
  SH.filter(s=>s.st==='delivered'&&!s.tk&&!s.had&&ageOf(s)>2&&ageOf(s)<8).slice(0,5).forEach((s,j)=>{s.st='failed';s.tries=j<3?1:2;s.upd=new Date(NOW-(3+j*4)*HOUR)});
  SH.sort((a,b)=>b.created-a.created);seedClaims();seedPend(R,pk)}

/* ===== Tickets: claims, follow-ups with FLIK support, contacting the shopper (WhatsApp through Qontak) ===== */
const TKT={claim:['Claim','File a claim','FLIK claims team'],support:['Follow-up','Contact support','FLIK support'],customer:['Contact shopper','Contact customer','WhatsApp via Qontak']};
const TKST={open:['Open','warn'],progress:['In progress','pu'],resolved:['Resolved','ok']};
let tkSeq=4180;
function addTicket(s,type,by='Merchant',at=NOW,note=''){const t={id:'TK-'+(++tkSeq),type,sid:s.id,awb:s.awb,created:at,st:type==='customer'?'progress':'open',ch:TKT[type][2],note,
  log:[[type==='customer'?'WhatsApp sent to the shopper through Qontak':type==='claim'?'Claim filed with '+cName(s.k):'Sent to FLIK support',at,type==='customer'?'progress':'open']]};
  /* the ticket is a conversation: the merchant on one side, FLIK support and the courier's team on the other (they reply from FLIK's ticketing platform) */
  t.chat=[{from:'me',text:note||(type==='claim'?'I want to file a claim for this parcel.':type==='support'?'Can you check on this parcel?'+(issueOf(s)?' '+issueOf(s).t+'.':''):'Please help me reach the shopper about this parcel.'),at}];
  if(type==='customer')t.chat.push({from:'sys',text:'WhatsApp sent to '+s.name.split(' ')[0]+' through Qontak',at});
  TK.unshift(t);s.tk=t.id;return t}
const AGENT={flik:['Dewi','FLIK support'],k:k=>[({jne:'Rudi',jnt:'Hendra',spx:'Wulan',ninja:'Sinta',lion:'Arif',sicepat:'Yudi',anteraja:'Lina'})[k]||'Agent',cName(k)+' team']};
function agentSay(t,who,text,at=NOW){t.chat.push({from:who,text,at});return t}

/* ===== Orders waiting for a Risky COD shopper (WhatsApp from FLIK's Qontak number) =====
 * When a Risky shopper is found, the merchant picks per order: confirm on WhatsApp, send a payment link (the order becomes
 * non-COD), remove it, or ship it anyway. Shoppers without WhatsApp skip the check: the merchant ships or removes them.
 * An order sent a check waits as its own batch (one warehouse, one courier service, one order). When the shopper confirms
 * or pays, FLIK books it automatically with the courier the merchant chose. BATAL or no answer in 24 hours cancels it, free.
 */
const DRK={wa:['Confirm on WhatsApp','chat2'],pay:['Payment link','wallet']};
const DRST={sent:[p=>p.kind==='pay'?'Waiting for payment':'Waiting for confirmation','warn'],booked:[p=>p.kind==='pay'?'Paid · shipped':'Confirmed · shipped','ok'],shipped:[()=>'Shipped without waiting','pu'],declined:[()=>'Shopper declined','bad'],expired:[()=>'No answer · cancelled','gr'],cancelled:[()=>'Cancelled by you','gr']};
const drLab=p=>DRST[p.st][0](p);
const WA_HOURS=24;let pendSeq=0;
const MERCHANT='Aruna Studio';
/* the merchant edits the wording; {{…}} are filled per order. WhatsApp (Meta) approves each wording before its first use */
const TPL_VARS=[['merchant_name','Store name'],['customer_name','Shopper name'],['product_name','Product'],['amount','Amount'],['full_address','Full address'],['payment_link','Payment link']];
const TPL_DEF={wa:'Halo {{customer_name}}, {{merchant_name}} sedang mengirim {{product_name}} ({{amount}}, bayar di tempat) ke {{full_address}}. Apakah Anda akan menerimanya? Balas YA untuk konfirmasi atau BATAL jika tidak jadi.',
  pay:'Halo {{customer_name}}, {{merchant_name}} sedang mengirim {{product_name}} ke {{full_address}}. Bayar {{amount}} sekarang di {{payment_link}} agar tidak perlu bayar di tempat. Link berlaku 24 jam.'};
const TPL={wa:TPL_DEF.wa,pay:TPL_DEF.pay};
const TPL_NEED={wa:['merchant_name','product_name','full_address'],pay:['merchant_name','amount','payment_link']};
const fullAddr=s=>`${s.addr.street}, ${s.addr.area.kel}, ${s.addr.area.kec}, ${s.addr.area.city}`;
const payLink=id=>'flik.id/p/'+(hsh(id||'x')%0xfffff).toString(36);
function fillTpl(t,s,id){const v={merchant_name:MERCHANT,customer_name:s.name.split(' ')[0],product_name:s.items,amount:rp(+String(s.val).replace(/\D/g,'')||0),full_address:fullAddr(s),payment_link:payLink(id)};
  return t.replace(/\{\{(\w+)\}\}/g,(m,k)=>k in v?v[k]:m)}
const waText=p=>fillTpl(p.tpl||TPL[p.kind],p.ship,p.id);
/* shoppers whose number isn't on WhatsApp skip the check (example data) */
const hasWa=p=>hsh(normPhone(p))%5!==0;
const draftId=at=>`W-${String(at.getFullYear()).slice(2)}${String(at.getMonth()+1).padStart(2,'0')}${String(at.getDate()).padStart(2,'0')}-${String(5100+(++pendSeq)).slice(1)}`;
function addPend(ship,kind,svc,at=NOW){const p={id:draftId(at),ship:{...ship,addr:{...ship.addr},open:false},kind,svc,tpl:TPL[kind],sent:at,exp:new Date(at.getTime()+WA_HOURS*HOUR),st:'sent',
  log:[[kind==='pay'?'Payment link sent on WhatsApp from FLIK':'Confirmation sent on WhatsApp from FLIK',at],[`Waiting as its own batch: ${cName(SERVICES[svc][0])} ${SERVICES[svc][1]} from ${ship.wh}`,at]]};PEND.unshift(p);return p}
/* book the waiting order with the courier the merchant chose; the batch keeps the waiting ID */
function sendPend(p,at=NOW,anyway=false){const s=p.ship,svc=p.svc,k=SERVICES[svc][0],b={id:p.id,created:at,k,svc,wh:s.wh,auto:!anyway};BATCH.unshift(b);
  const q={area:s.addr.area,kg:Math.max(1,Math.ceil(+s.kg||1)),val:+String(s.val).replace(/\D/g,'')},r=rateOf(svc,whArea(whByCode(s.wh)),q.area,q.kg);
  const sh={id:'S'+(SH.length+1),batch:p.id,created:at,svc,k,wh:s.wh,area:q.area,street:s.addr.street,name:s.name,phone:normPhone(s.phone),items:s.items,qty:+s.qty,kg:q.kg,pay:s.pay,val:q.val,pub:r.pub,cost:r.net,codFee:s.pay==='cod'?Math.round(q.val*CODFEE):0,tries:0,st:'pickup',upd:at,awb:mkAwb(k),tk:null,had:null};
  SH.unshift(sh);p.st=anyway?'shipped':'booked';p.sid=sh.id;p.awb=sh.awb;p.log.unshift([(anyway?'You shipped it without waiting':'Booked automatically into the next pickup')+` · ${cName(k)} ${SERVICES[svc][1]} · ${sh.awb}`,at]);return sh}
/* the shopper confirmed (score goes up) or paid (the order becomes non-COD): FLIK books it straight away */
function confirmPend(p,at=NOW){VERIFIED.add(normPhone(p.ship.phone));
  if(p.kind==='pay'){p.ship.pay='non';p.log.unshift([`Shopper paid ${rp(+String(p.ship.val).replace(/\D/g,''))}. The order is now non-COD; shipping is charged from your balance`,at])}
  else p.log.unshift(['Shopper replied YA. Phone confirmed, score raised',at]);return sendPend(p,at)}
function riskyPhone(seed){for(let i=0;i<5000;i++){const ph='628'+(1+(seed+i)%8)+String(100000000+((seed*7919+i*104729)%899999999));const h=hsh(normPhone(ph));if(h%13!==0&&h%23===0&&h%5!==0)return ph}return'6281200000000'}
function seedPend(R,pk){pendSeq=0;
  const mk=(i)=>{const p=pk(PRODUCTS),a=AREA[(i*5+3)%AREA.length];return{phone:riskyPhone(i*31+7),name:pk(FN)+' '+pk(LN),addr:{street:`${pk(STREETS)} No. ${1+Math.floor(R()*120)}`,area:a},wh:i%2?'BDG-01':'JKT-01',pay:'cod',items:p[0],qty:1,kg:String(Math.max(.1,p[2])),l:'',w:'',h:'',val:String(p[1])}};
  const svc=SERVICES.findIndex(v=>v[0]==='jnt'&&v[2]==='reg');
  [[30,'wa','expired'],[20,'wa','booked'],[9,'wa','declined'],[6,'pay','booked'],[3.2,'pay','sent'],[1.4,'wa','sent'],[.6,'wa','sent']].forEach(([h,kind,st],i)=>{const p=addPend(mk(i),kind,svc,new Date(NOW-h*HOUR));
    if(st==='booked')confirmPend(p,new Date(p.sent.getTime()+1.5*HOUR));
    else if(st==='declined'){p.st='declined';p.log.unshift(['Shopper replied BATAL. Order cancelled, nothing charged',new Date(p.sent.getTime()+40*60000)])}
    else if(st==='expired'){p.st='expired';p.log.unshift([`No answer in ${WA_HOURS} hours. Order cancelled, nothing charged`,p.exp])}})}

/* ===== Claims: what the merchant is owed by the courier ===== */
const CLCAT={lost:['Lost or damaged','Courier pays the goods value'],ret:['Returned without confirmation','The courier returned it without asking you first; shipping both ways is refunded'],
  sla:['Over SLA','Delivered later than the courier promised; shipping is refunded. AnterAja only for now']};
const CLST={submitted:['Submitted','warn'],review:['In review','pu'],approved:['Approved','ok'],paid:['Paid out','ok'],rejected:['Rejected','bad']};
const CL_FLOW=['submitted','review','approved','paid'];
const slaOver=s=>s.k==='anteraja'&&s.st==='delivered'&&(s.upd-s.created)/DAY>etaMax(SERVICES[s.svc])+1;
const clAmount=(s,cat)=>cat==='lost'?s.val:cat==='ret'?s.cost*2:s.cost;
let clSeq=0;
function addClaim(s,cat,at=NOW,st='submitted',by='Merchant'){
  const c={id:'CL-'+String(24100+(++clSeq)),sid:s.id,awb:s.awb,k:s.k,cat,st,filed:at,amount:clAmount(s,cat),by,log:[['Claim filed by '+by.toLowerCase(),at,'submitted']]};
  /* walk the claim through its steps up to its status, a day or two apart */
  const stop=st==='rejected'?1:CL_FLOW.indexOf(st);let t=at.getTime();
  for(let i=1;i<=stop;i++){t+=(1+hsh(c.id+i)%2)*DAY;if(t>NOW.getTime())break;c.log.unshift([({review:cName(s.k)+' is reviewing the claim',approved:'Approved by '+cName(s.k),paid:'Paid out to your FLIK balance'})[CL_FLOW[i]],new Date(t),CL_FLOW[i]])}
  if(st==='rejected'){t+=2*DAY;c.log.unshift([cName(s.k)+' rejected it: the photo does not show the damage',new Date(Math.min(t,NOW.getTime()-HOUR)),'rejected'])}
  c.st=c.log[0][2];CL.unshift(c);return c}
function seedClaims(){
  /* AnterAja is the only courier with an SLA FLIK can claim on today: make a few of its parcels late */
  SH.filter(s=>s.k==='anteraja'&&s.st==='delivered').filter((s,i)=>i%2===0).slice(0,12).forEach(s=>{const late=new Date(s.created.getTime()+(etaMax(SERVICES[s.svc])+2.5)*DAY);if(late<NOW)s.upd=late});
  /* a claim older than ten days has been settled one way or the other */
  const pick=(l,f,cat)=>l.forEach((s,i)=>{let st=f(i,s);const at=new Date(s.upd.getTime()+6*HOUR);if((NOW-at)/DAY>10&&st!=='rejected')st='paid';addClaim(s,cat,at,st)});
  pick(SH.filter(s=>s.st==='lost').slice(1),i=>['review','approved','submitted','paid'][i%4],'lost');
  pick(SH.filter(s=>s.st==='delivered'&&hsh(s.id)%53===0).slice(0,5),i=>['paid','rejected','review','approved','paid'][i%5],'lost');
  pick(SH.filter(s=>s.st==='returned'&&hsh(s.id)%4===0).slice(0,9),i=>['paid','approved','review','submitted','paid','rejected','approved','paid','review'][i%9],'ret');
  pick(SH.filter(slaOver).slice(1),i=>['paid','approved','review','submitted','paid','approved','paid','submitted'][i%8],'sla');
  CL.sort((a,b)=>b.filed-a.filed)}

/* ===== Example answers for FLIK.api (app/api.js) ===== */
FLIK.mock('merchant',()=>({id:FLIK.config.merchantId,name:'Aruna Studio',products:FLAGS[PS.flags].w,verified:PS.verified}));
FLIK.mock('pickupAddresses',()=>WH.filter(w=>w.active));
FLIK.mock('rates',q=>{const o=whArea(whByCode(q.from)),d=q.to;return SERVICES.map((sv,i)=>({i,courier:sv[0],service:sv[1],group:sv[2],...rateOf(i,o,d,q.kg),...srOf(sv[0],d),redZone:rzOf(sv[0],d)})).filter(r=>svcOn(r.courier,r.service)&&reach(r.i,o,d))});
FLIK.mock('recommend',q=>recommend(q.ships,q.group));
FLIK.mock('shopperScore',q=>shopperScore(q.phone,q.area));
FLIK.mock('tracking',awbs=>awbs.map(a=>SH.find(s=>s.awb===a)||null));
FLIK.mock('createShipments',q=>({batches:q.batches.map(b=>({id:b.ref,awbs:b.shipments.map(()=>null)}))}));
FLIK.mock('createTicket',q=>({id:'TK-'+(tkSeq+1),status:'open'}));
FLIK.mock('geocode',q=>{const t=String(q.query||'').toLowerCase();return AREA.filter(a=>[a.kel,a.kec,a.city,a.zip].join(' ').toLowerCase().includes(t)).slice(0,8)});
FLIK.mock('shipments',()=>SH);
FLIK.mock('verifyShopper',q=>({id:q.draft,status:'sent',kind:q.kind,channel:'whatsapp',provider:'qontak',expires_in_hours:WA_HOURS,payment_url:q.kind==='payment_link'?'https://flik.id/p/…':null}));
