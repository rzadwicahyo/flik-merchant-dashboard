/* ===== Growth Engine v2 + Studio: example data and constants =====
 * Everything here is made up. Lane D (docs/prototype/TICKETS.md) fills in sample products, scenes,
 * phrase banks, competitors, ideas and template texts. Numbers marked "example" are for AG to react to.
 */

/* Limits per account status (BUILD_SPEC section 6). Editable live from the prototype bar. */
const GE_LIMITS={
  regenPerDesign:{anon:1,lead:1,new:2,active:3,top:5},
  designsPerDay:{anon:3,lead:5,new:10,active:20,top:40},
  freeExportsPerMonth:{anon:0,lead:3,new:10,active:20,top:40},
  llmFallbacksPerDay:{anon:2,lead:3,new:10,active:20,top:40},
  ownContextPerWeek:{anon:0,lead:0,new:3,active:5,top:10},
  competitors:{anon:0,lead:1,new:3,active:3,top:3},
  leadExportPrice:0,   // Rp, FLIK config; 0 = free for now
  exportPrice:2000,    // Rp per export over the free quota (example)
  waCost:500           // Rp per WhatsApp marketing message (example)
};
const GE_LIMITS_DEFAULT=JSON.parse(JSON.stringify(GE_LIMITS));
const GE_ACCOUNTS=['anon','lead','new','active','top'];

/* The merchant owner gets OTPs, notifications and reports */
const GE_OWNER={name:'Dewi',phone:'6281200000007',store:'Aruna Studio',category:'fashion'};

/* Balance and past ledger lines (example) */
const GE_BALANCE=1250000;
const GE_LEDGER_SEED=[
  {d:2,label:'Top up',amount:500000},
  {d:9,label:'Shipping, batch BT-0412',amount:-184000},
  {d:16,label:'Payment disbursement',amount:2140000}];

/* WhatsApp templates: 12 marketing + 2 utility, each in Bahasa and English. Lane D (D2) writes the full texts. */
const GE_WA={
  new_arrival:{cat:'marketing'},promo_discount:{cat:'marketing'},flash_sale:{cat:'marketing'},big_date:{cat:'marketing'},
  bundle_offer:{cat:'marketing'},restock:{cat:'marketing'},best_seller:{cat:'marketing'},second_purchase:{cat:'marketing'},
  win_back:{cat:'marketing'},vip_early_access:{cat:'marketing'},checkout_reminder:{cat:'marketing'},event_invite:{cat:'marketing'},
  otp_login:{cat:'utility',noImage:true,
    id:'{{1}} adalah kode verifikasi FLIK kamu. Jangan berikan kode ini ke siapa pun. Berlaku 5 menit.',
    en:'{{1}} is your FLIK verification code. Don\'t share it with anyone. Valid for 5 minutes.'},
  campaign_report:{cat:'utility',
    id:'Halo {{1}}, kampanye "{{2}}" sudah selesai. Penjualan dari kampanye: {{3}}. Tambahan dibanding grup pembanding: {{4}}. Lihat detailnya: {{5}}',
    en:'Hi {{1}}, your campaign "{{2}}" has ended. Sales from the campaign: {{3}}. Extra against the holdout group: {{4}}. See the details: {{5}}'}
};

/* Canned answers for the AI fallback (mockLLM). Lane D (D2) adds the full set. */
const GE_LLM={
  vibe:q=>({tags:['warm','earthy','festive'],note:`Matched “${q&&q.vibe||'your vibe'}” to warm, earthy, festive scenes`}),
  copy:q=>({options:['Adem seharian, gaya tetap rapi','Linen premium untuk hari yang panjang','Santai tapi tetap standout']}),
  context:q=>({caption:'Koleksi batik baru sudah datang. Pakai voucher ini sebelum 11.11 berakhir.',tweak:'Add the batik collection to the poster and the WhatsApp header'}),
  classify:q=>({type:'promo',confidence:.82})
};

/* ===================== Studio content (lane D, D1 + D2) ===================== */

/* Sample products, drawn as transparent SVG (already "cut out"). 400 × 400, product sits on y≈380. */
const ST_PRODUCTS=[
 {id:'linen-shirt',cat:'fashion',name:{id:'Kemeja Linen',en:'Linen Shirt'},svg:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><defs><linearGradient id="a" x1="0" x2="1"><stop offset="0" stop-color="#e9dcc6"/><stop offset=".55" stop-color="#f6eddd"/><stop offset="1" stop-color="#d8c7aa"/></linearGradient></defs><path d="M142 40l-62 30-56 88 44 30 34-44v236h196V144l34 44 44-30-56-88-62-30c-8 22-30 36-58 36s-50-14-58-36z" fill="url(#a)" stroke="#b9a582" stroke-width="3" stroke-linejoin="round"/><path d="M142 40c8 22 30 36 58 36s50-14 58-36l-18-8c-6 14-22 24-40 24s-34-10-40-24z" fill="#efe3cf" stroke="#b9a582" stroke-width="3"/><path d="M200 76v304" stroke="#c8b590" stroke-width="3"/><g fill="#fff" stroke="#b9a582" stroke-width="2"><circle cx="210" cy="120" r="5"/><circle cx="210" cy="175" r="5"/><circle cx="210" cy="230" r="5"/><circle cx="210" cy="285" r="5"/><circle cx="210" cy="340" r="5"/></g><path d="M240 120h40v34h-40z" fill="none" stroke="#c8b590" stroke-width="3"/><path d="M118 150c10 60 6 150 0 226M282 150c-10 60-6 150 0 226" stroke="#d8c7aa" stroke-width="4" fill="none" opacity=".6"/></svg>`},
 {id:'batik-dress',cat:'fashion',name:{id:'Dress Batik',en:'Batik Dress'},svg:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><defs><pattern id="p" width="36" height="36" patternUnits="userSpaceOnUse"><rect width="36" height="36" fill="#7a3b1d"/><circle cx="18" cy="18" r="9" fill="none" stroke="#e8b35a" stroke-width="3"/><circle cx="18" cy="18" r="3" fill="#e8b35a"/><path d="M0 0l8 8M36 0l-8 8M0 36l8-8M36 36l-8-8" stroke="#c97b3a" stroke-width="3"/></pattern></defs><path d="M160 30h80l6 40c26 14 34 40 30 70l-10 40 66 196H68l66-196-10-40c-4-30 4-56 30-70z" fill="url(#p)" stroke="#4e230f" stroke-width="3" stroke-linejoin="round"/><path d="M160 30c10 18 70 18 80 0" fill="none" stroke="#4e230f" stroke-width="3"/><path d="M134 180h132" stroke="#2c1308" stroke-width="10"/><path d="M134 180l-66 196" stroke="#4e230f" stroke-width="2" opacity=".4"/></svg>`},
 {id:'tote-bag',cat:'fashion',name:{id:'Tote Bag Kanvas',en:'Canvas Tote'},svg:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><path d="M140 150c0-90 120-90 120 0" fill="none" stroke="#8a6a44" stroke-width="14" stroke-linecap="round"/><path d="M80 140h240l-14 240H94z" fill="#efe6d4" stroke="#b6a37f" stroke-width="3" stroke-linejoin="round"/><path d="M80 140h240l-2 30H82z" fill="#e2d5bc"/><rect x="150" y="230" width="100" height="70" rx="6" fill="#2f4f3a"/><text x="200" y="274" font-family="Georgia,serif" font-size="26" fill="#efe6d4" text-anchor="middle">aruna</text><path d="M94 380h212" stroke="#b6a37f" stroke-width="3"/></svg>`},
 {id:'sneakers',cat:'fashion',name:{id:'Sneakers Putih',en:'White Sneakers'},svg:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><path d="M40 300c0-40 20-70 40-90l50-40c20 10 40 20 70 20l40 40c40 10 90 20 110 40 14 14 14 30 10 40H40z" fill="#fbfbfa" stroke="#9aa0a6" stroke-width="3" stroke-linejoin="round"/><path d="M36 310h332v26c0 10-8 16-18 16H54c-10 0-18-6-18-16z" fill="#e6e2da" stroke="#9aa0a6" stroke-width="3"/><path d="M36 322h332" stroke="#c9c3b8" stroke-width="3"/><path d="M150 180l20 22M170 172l20 22M190 168l18 24M208 170l16 24" stroke="#8a9096" stroke-width="5" stroke-linecap="round"/><path d="M240 230c40 6 80 20 100 40" fill="none" stroke="#2f6f5e" stroke-width="12" stroke-linecap="round"/><path d="M80 210c10 30 10 60 4 90" fill="none" stroke="#d7d3cc" stroke-width="4"/></svg>`},
 {id:'iced-coffee',cat:'fnb',name:{id:'Es Kopi Susu',en:'Iced Coffee Latte'},svg:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><defs><linearGradient id="c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3e6d3"/><stop offset=".45" stop-color="#c79a6b"/><stop offset="1" stop-color="#6b3f22"/></linearGradient></defs><path d="M214 20l-10 120" stroke="#2f6f5e" stroke-width="12" stroke-linecap="round"/><path d="M118 110h164l-20 270H138z" fill="url(#c)" stroke="#c9b9a6" stroke-width="3" stroke-linejoin="round"/><path d="M110 96h180v20H110z" fill="#f4f1ec" stroke="#c9b9a6" stroke-width="3"/><g fill="#fff" opacity=".55"><rect x="150" y="150" width="34" height="30" rx="6"/><rect x="200" y="170" width="34" height="30" rx="6"/><rect x="168" y="200" width="34" height="30" rx="6"/></g><path d="M134 130l14 240" stroke="#fff" stroke-width="8" opacity=".35"/><circle cx="200" cy="300" r="34" fill="#f4f1ec" opacity=".85"/><text x="200" y="308" font-family="Georgia,serif" font-size="20" fill="#6b3f22" text-anchor="middle">kopi</text></svg>`},
 {id:'cookie-jar',cat:'fnb',name:{id:'Kue Kering Nastar',en:'Pineapple Tarts'},svg:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect x="96" y="70" width="208" height="40" rx="10" fill="#c0392b" stroke="#8e2a20" stroke-width="3"/><path d="M104 110h192c14 0 22 10 22 24v220c0 14-10 26-26 26H108c-16 0-26-12-26-26V134c0-14 8-24 22-24z" fill="#f6efe2" fill-opacity=".55" stroke="#c9bba6" stroke-width="3"/><g stroke="#b06a2c" stroke-width="2"><circle cx="140" cy="330" r="26" fill="#e6a24a"/><circle cx="200" cy="336" r="26" fill="#eab055"/><circle cx="260" cy="330" r="26" fill="#e6a24a"/><circle cx="170" cy="284" r="26" fill="#eab055"/><circle cx="232" cy="286" r="26" fill="#e6a24a"/><circle cx="140" cy="238" r="26" fill="#e6a24a"/><circle cx="200" cy="240" r="26" fill="#eab055"/><circle cx="262" cy="238" r="26" fill="#e6a24a"/></g><g fill="#a0521d"><circle cx="140" cy="326" r="5"/><circle cx="200" cy="332" r="5"/><circle cx="260" cy="326" r="5"/><circle cx="170" cy="280" r="5"/><circle cx="232" cy="282" r="5"/><circle cx="140" cy="234" r="5"/><circle cx="200" cy="236" r="5"/><circle cx="262" cy="234" r="5"/></g><path d="M100 140c-4 60-4 160 0 210" stroke="#fff" stroke-width="10" opacity=".5" fill="none"/><rect x="150" y="150" width="100" height="44" rx="6" fill="#fff" stroke="#c0392b" stroke-width="2"/><text x="200" y="179" font-family="Georgia,serif" font-size="20" fill="#c0392b" text-anchor="middle">nastar</text></svg>`},
 {id:'serum-bottle',cat:'beauty',name:{id:'Serum Wajah',en:'Face Serum'},svg:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#8a4b16"/><stop offset=".45" stop-color="#d48a3c"/><stop offset="1" stop-color="#7a3f10"/></linearGradient></defs><rect x="176" y="20" width="48" height="70" rx="22" fill="#2d2d2d"/><rect x="164" y="84" width="72" height="44" rx="6" fill="#d9c7a3" stroke="#a8946c" stroke-width="2"/><path d="M146 128h108c14 0 24 10 24 24v204c0 14-10 24-24 24H146c-14 0-24-10-24-24V152c0-14 10-24 24-24z" fill="url(#g)"/><path d="M142 150c-4 60-4 150 0 200" stroke="#fff" stroke-width="10" opacity=".35" fill="none"/><rect x="138" y="210" width="124" height="96" rx="6" fill="#f6efe2"/><text x="200" y="248" font-family="Georgia,serif" font-size="22" fill="#5a3412" text-anchor="middle">glow</text><text x="200" y="276" font-family="Arial,sans-serif" font-size="12" fill="#5a3412" text-anchor="middle" letter-spacing="2">VITAMIN C 10%</text></svg>`},
 {id:'lip-tint',cat:'beauty',name:{id:'Lip Tint',en:'Lip Tint'},svg:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><defs><linearGradient id="l" x1="0" x2="1"><stop offset="0" stop-color="#a3123a"/><stop offset=".5" stop-color="#e0436a"/><stop offset="1" stop-color="#8f0f32"/></linearGradient></defs><g transform="rotate(-12 200 220)"><rect x="160" y="40" width="80" height="150" rx="14" fill="#1f1f1f"/><rect x="170" y="56" width="10" height="120" rx="5" fill="#fff" opacity=".18"/><rect x="152" y="184" width="96" height="16" rx="4" fill="#c9a96a"/><path d="M158 200h84l-6 180h-72z" fill="url(#l)"/><path d="M168 214l-2 150" stroke="#fff" stroke-width="7" opacity=".35"/><text x="200" y="300" font-family="Georgia,serif" font-size="20" fill="#fff" text-anchor="middle" transform="rotate(-90 200 300)">rosé tint</text></g></svg>`}
];

/* Scenes: drawn backdrops with metadata. light = side the light comes from; ink = text colour that passes 4.5:1. */
const ST_SCENES=[
 {id:'marble-warm',n:'Warm marble',cats:['fashion','beauty','fnb','general'],tags:['minimal','elegant','warm','clean','premium'],pal:'warm',bg:['#efe6dc','#e2d3c2'],surf:{y:.74,c:['#f6f2ec','#e9e2d8'],tex:'marble'},light:'left',ink:'#2b2118',acc:'#9c5a2e'},
 {id:'linen-sand',n:'Linen and sand',cats:['fashion','general','home'],tags:['earthy','natural','warm','casual','calm'],pal:'sand',bg:['#ece2d1','#dccbb0'],surf:{y:.76,c:['#d4bf9b','#c3ab83'],tex:'linen'},light:'right',ink:'#3a2c1c',acc:'#7c5a34'},
 {id:'oak-table',n:'Oak table',cats:['fnb','home','general'],tags:['natural','cozy','rustic','warm','homemade'],pal:'wood',bg:['#f4ede3','#e6dac8'],surf:{y:.72,c:['#c08f5f','#a7774a'],tex:'wood'},light:'left',ink:'#3b2716',acc:'#a7774a',props:['leaf']},
 {id:'pastel-pink',n:'Pastel pink podium',cats:['beauty','fashion','fnb'],tags:['cute','playful','feminine','fresh','soft'],pal:'pink',bg:['#fbe6ea','#f5cdd7'],podium:'#f9dbe2',surf:{y:.8,c:['#f3c4cf','#eab3c0'],tex:'none'},light:'right',ink:'#5a1f33',acc:'#d64f78',props:['arch']},
 {id:'mint-fresh',n:'Mint fresh',cats:['beauty','fnb','general'],tags:['fresh','clean','playful','cool','healthy'],pal:'mint',bg:['#e4f5ef','#cbe9de'],podium:'#d8f0e7',surf:{y:.8,c:['#bfe3d5','#a8d8c6'],tex:'none'},light:'left',ink:'#163d33',acc:'#1f8a6c',props:['circle']},
 {id:'studio-white',n:'Studio white',cats:['fashion','beauty','fnb','general','home'],tags:['minimal','clean','modern','simple','bright'],pal:'white',bg:['#ffffff','#eef0f3'],surf:{y:.78,c:['#f4f5f7','#e6e8ec'],tex:'none'},light:'left',ink:'#1d2430',acc:'#5b4bdb'},
 {id:'terracotta-sun',n:'Terracotta sun',cats:['fashion','fnb','home','general'],tags:['earthy','warm','bold','summer','tropical'],pal:'terracotta',bg:['#f3cdae','#e7a983'],surf:{y:.76,c:['#c9764d','#b4643c'],tex:'none'},light:'right',ink:'#3b1a0b',acc:'#8f3d17',props:['sun']},
 {id:'night-navy',n:'Night spotlight',cats:['beauty','fashion','general'],tags:['luxury','elegant','bold','night','premium','dark'],pal:'navy',bg:['#24304d','#121a2c'],surf:{y:.78,c:['#2d3a5c','#222c47'],tex:'none'},light:'left',ink:'#ffffff',acc:'#e3b65c',props:['spot']},
 {id:'window-light',n:'Morning window',cats:['fnb','home','fashion','general'],tags:['cozy','warm','morning','natural','calm','soft'],pal:'cream',bg:['#f7f2e8','#ebe2d0'],surf:{y:.75,c:['#e3d6bd','#d6c6a6'],tex:'linen'},light:'right',ink:'#33291b',acc:'#8a6a3a',props:['window']},
 {id:'festive-red',n:'Festive red',cats:['fnb','fashion','beauty','general'],tags:['festive','imlek','natal','celebration','bold','sale','harbolnas'],pal:'red',bg:['#b8262f','#8a1820'],surf:{y:.78,c:['#9e1f27','#7d151c'],tex:'none'},light:'left',ink:'#ffffff',acc:'#f2c14e',props:['confetti']},
 {id:'lebaran-green',n:'Lebaran green',cats:['fnb','fashion','general','home'],tags:['festive','lebaran','ramadan','warm','family','celebration'],pal:'green',bg:['#e9f2e4','#cfe3c5'],surf:{y:.78,c:['#b7d3a8','#a2c592'],tex:'none'},light:'right',ink:'#1e3a1a',acc:'#c99a2e',props:['ketupat']},
 {id:'concrete-urban',n:'Urban concrete',cats:['fashion','general'],tags:['urban','modern','street','bold','cool'],pal:'grey',bg:['#dcdde0','#c3c5c9'],surf:{y:.77,c:['#acafb4','#9a9da3'],tex:'none'},light:'left',ink:'#17191c',acc:'#e0442f',props:['stripe']}
];

/* Vibe words (Bahasa + English) → scene style tags */
const ST_VIBE={
 minimalis:['minimal','clean'],minimal:['minimal','clean'],simple:['simple','minimal'],sederhana:['simple','minimal'],bersih:['clean'],clean:['clean'],
 hangat:['warm','cozy'],warm:['warm'],cozy:['cozy','warm'],nyaman:['cozy','calm'],earthy:['earthy','natural'],natural:['natural'],alami:['natural','earthy'],
 mewah:['luxury','premium','elegant'],luxury:['luxury','premium'],elegan:['elegant'],elegant:['elegant'],premium:['premium','luxury'],
 ceria:['playful','fresh'],playful:['playful'],lucu:['cute','playful'],cute:['cute'],fresh:['fresh'],segar:['fresh','healthy'],
 lebaran:['lebaran','festive'],ramadan:['ramadan','festive'],imlek:['imlek','festive'],natal:['natal','festive'],christmas:['natal','festive'],festive:['festive'],meriah:['festive','celebration'],
 sale:['sale','bold'],diskon:['sale','bold'],promo:['sale','bold'],harbolnas:['harbolnas','sale'],'11.11':['harbolnas','sale'],'12.12':['harbolnas','sale'],
 modern:['modern'],urban:['urban','street'],street:['street','urban'],kece:['bold','modern'],bold:['bold'],berani:['bold'],
 feel:[],nuansa:[],vibe:[],dan:[],and:[],with:[],dengan:[],yang:[],
 pagi:['morning'],morning:['morning'],malam:['night','dark'],night:['night'],gelap:['dark'],dark:['dark'],
 tropis:['tropical','summer'],tropical:['tropical'],summer:['summer'],pantai:['summer','tropical'],
 lembut:['soft'],soft:['soft'],pastel:['soft','cute'],feminin:['feminine'],feminine:['feminine'],
 rumahan:['homemade','cozy'],homemade:['homemade'],keluarga:['family'],family:['family'],tenang:['calm'],calm:['calm'],
 sehat:['healthy','fresh'],healthy:['healthy'],kalem:['calm','soft'],rustic:['rustic'],kayu:['rustic','natural']
};

/* Copy: headline, sub ({name} = product name) and CTA by category × tone × language */
const ST_COPY={
 fashion:{
  casual:{id:{h:['Adem seharian','Gaya santai, tetap rapi','Siap nemenin harimu','Outfit andalan minggu ini'],s:['{name} yang nyaman dipakai dari pagi sampai malam','{name}, bahan premium, potongan pas'],c:['Pesan sekarang','Cek ukurannya','Order di sini']},
          en:{h:['Cool all day','Easy style, still sharp','Your new everyday favourite','This week\'s go-to outfit'],s:['{name} that feels good from morning to night','{name}, premium fabric, a better fit'],c:['Shop now','Find your size','Order here']}},
  formal:{id:{h:['Elegan di setiap momen','Kualitas yang terasa','Koleksi pilihan'],s:['{name} dengan jahitan rapi dan bahan terbaik','Dirancang untuk tampil percaya diri: {name}'],c:['Lihat koleksi','Pesan sekarang','Hubungi kami']},
          en:{h:['Elegant for every moment','Quality you can feel','The curated collection'],s:['{name} with neat stitching and the finest fabric','Designed for confidence: {name}'],c:['View collection','Order now','Contact us']}},
  playful:{id:{h:['Auto dipuji!','Gas checkout!','Lemari kamu butuh ini','Siap OOTD?'],s:['{name} yang bikin mood naik','{name}: nyaman, kece, anti ribet'],c:['Sikat sekarang','Ambil punyamu','Klik dan pesan']},
           en:{h:['Compliments guaranteed!','Add to cart, now!','Your closet needs this','OOTD ready?'],s:['{name} that lifts your mood','{name}: comfy, cool, no fuss'],c:['Grab yours','Get it now','Tap to order']}}},
 fnb:{
  casual:{id:{h:['Teman ngopi sore','Enaknya bikin nagih','Fresh tiap hari','Waktunya ngemil'],s:['{name} dibuat fresh setiap pagi','{name}, resep rumahan yang pas di lidah'],c:['Pesan sekarang','Order via WhatsApp','Coba hari ini']},
          en:{h:['Your afternoon treat','Dangerously good','Fresh every day','Snack time'],s:['{name}, made fresh every morning','{name}, a homemade recipe done right'],c:['Order now','Order on WhatsApp','Try it today']}},
  formal:{id:{h:['Cita rasa yang terjaga','Dibuat dengan bahan pilihan','Hidangan istimewa'],s:['{name} dari bahan berkualitas, tanpa pengawet','Sajian terbaik untuk tamu Anda: {name}'],c:['Pesan sekarang','Lihat menu','Reservasi']},
          en:{h:['Consistent taste, every time','Made with selected ingredients','A special treat'],s:['{name} from quality ingredients, no preservatives','The best for your guests: {name}'],c:['Order now','See the menu','Reserve']}},
  playful:{id:{h:['Awas ketagihan!','Satu nggak cukup','Mood booster resmi','Laper? Sini!'],s:['{name}: sekali gigit langsung jatuh cinta','{name} yang bikin hari makin manis'],c:['Gas pesan','Jajan sekarang','Klik dulu']},
           en:{h:['Warning: addictive!','One is never enough','Official mood booster','Hungry? Over here!'],s:['{name}: one bite and you\'re hooked','{name} to make your day sweeter'],c:['Order now','Treat yourself','Tap here']}}},
 beauty:{
  casual:{id:{h:['Glowing tiap hari','Kulit happy, kamu happy','Rutinitas jadi simpel'],s:['{name} yang ringan dan cepat meresap','{name} untuk kulit lembap seharian'],c:['Beli sekarang','Cek detailnya','Order di sini']},
          en:{h:['Glow every day','Happy skin, happy you','Your routine, simplified'],s:['{name}, light and fast-absorbing','{name} for skin that stays soft all day'],c:['Shop now','See details','Order here']}},
  formal:{id:{h:['Perawatan yang terbukti','Cantik dengan percaya diri','Formula pilihan'],s:['{name} dengan bahan aktif yang teruji','Diformulasikan untuk hasil nyata: {name}'],c:['Beli sekarang','Konsultasi gratis','Lihat produk']},
          en:{h:['Care that works','Beauty with confidence','A trusted formula'],s:['{name} with tested active ingredients','Formulated for real results: {name}'],c:['Shop now','Free consultation','View product']}},
  playful:{id:{h:['Glow up dimulai!','Bye kulit kusam','Wajib di pouch kamu'],s:['{name}: kecil tapi ngefek banget','{name} yang bikin pede tanpa filter'],c:['Ambil sekarang','Check out yuk','Klik dan glowing']},
           en:{h:['Glow up starts now!','Bye-bye dull skin','A must for your pouch'],s:['{name}: small but mighty','{name} for no-filter confidence'],c:['Grab it now','Check it out','Tap to glow']}}},
 general:{
  casual:{id:{h:['Favorit pelanggan','Baru datang!','Pilihan minggu ini'],s:['{name} yang siap kamu bawa pulang','{name}, kualitas terjaga, harga bersahabat'],c:['Pesan sekarang','Lihat detail','Order di sini']},
          en:{h:['A customer favourite','Just arrived!','This week\'s pick'],s:['{name}, ready to take home','{name}, quality you can count on'],c:['Order now','See details','Order here']}},
  formal:{id:{h:['Kualitas terbaik','Pilihan terpercaya','Koleksi terbaru'],s:['{name} untuk kebutuhan Anda','Dibuat dengan standar tinggi: {name}'],c:['Pesan sekarang','Hubungi kami','Lihat produk']},
          en:{h:['Best quality','A trusted choice','The latest collection'],s:['{name} for your needs','Made to a high standard: {name}'],c:['Order now','Contact us','View product']}},
  playful:{id:{h:['Jangan sampai kehabisan!','Ini dia yang ditunggu','Sikat sebelum habis'],s:['{name} yang bikin senyum','{name}: dijamin nggak nyesel'],c:['Gas pesan','Ambil sekarang','Klik dulu']},
           en:{h:['Don\'t miss out!','The one you\'ve been waiting for','Get it before it\'s gone'],s:['{name} that makes you smile','{name}: no regrets'],c:['Order now','Grab yours','Tap here']}}}
};
const ST_BADGES={id:['','-20%','Baru','Best seller','Gratis ongkir'],en:['','-20%','New','Best seller','Free shipping']};
const ST_CATS=[['fashion',{id:'Fashion',en:'Fashion'}],['fnb',{id:'Makanan & minuman',en:'Food & drink'}],['beauty',{id:'Kecantikan',en:'Beauty'}],['home',{id:'Rumah & dekor',en:'Home & decor'}],['other',{id:'Lainnya',en:'Other'}]];
const ST_FORMATS=[['1:1','1:1 Feed',1],['4:5','4:5 Feed',1.25],['9:16','9:16 Story',16/9],['white','1:1 Marketplace white',1]];
/* Example lead for ?account=lead without signing up */
const ST_LEAD_EXAMPLE={name:'Rina Wulandari',brand:'Dapur Rina',phone:'6281355500123',cat:'fnb',link:'instagram.com/dapur.rina',consent:true};
