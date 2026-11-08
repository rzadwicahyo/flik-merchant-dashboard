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
  waCost:500,          // Rp per WhatsApp marketing message (example)
  llmPrice:5000,       // Rp per AI design set, when the merchant doesn't take the FLIK watermark (example)
  matchMin:60,         // %: below this template match, Studio offers the AI
  cpAutoDay:1,         // day of the month when FLIK reads every competitor again for free, 07:00 (0 = no scheduled read)
  cpRefreshPrice:5000  // Rp per "Refresh now" (all competitors + My Brand, every channel); 0 = free (example)
};
const GE_LIMITS_DEFAULT=JSON.parse(JSON.stringify(GE_LIMITS));
const GE_ACCOUNTS=['anon','lead','new','active','top'];

/* The merchant owner gets OTPs, notifications and reports */
const GE_OWNER={name:'Dewi',phone:'6281200000007',store:'Aruna Studio',category:'fashion'};

/* Balance and past ledger lines (example) */
const GE_BALANCE=typeof BAL==='number'?BAL:1250000;   // the same balance as the dashboard header
const GE_LEDGER_SEED=[
  {d:2,label:'Top up',amount:500000},
  {d:9,label:'Shipping, batch BT-0412',amount:-184000},
  {d:16,label:'Payment disbursement',amount:2140000}];

/* WhatsApp templates: 12 marketing + 2 utility, each in Bahasa and English. Lane D (D2) writes the full texts. */
const GE_WA={
  new_arrival:{cat:'marketing',kind:'new',
    id:'Halo {{1}}, koleksi baru dari {{2}} sudah datang! {{3}}. Lihat duluan sebelum kehabisan: {{5}}',
    en:'Hi {{1}}, new arrivals at {{2}} are here! {{3}}. Have a look before they sell out: {{5}}'},
  promo_discount:{cat:'marketing',kind:'promo',
    id:'Halo {{1}}, ada promo dari {{2}}: {{3}}. Berlaku sampai {{4}}. Pakai di sini: {{5}}',
    en:'Hi {{1}}, a treat from {{2}}: {{3}}. Valid until {{4}}. Use it here: {{5}}'},
  flash_sale:{cat:'marketing',kind:'promo',
    id:'Flash sale {{2}} cuma sampai {{4}}! {{1}}, dapatkan {{3}} sebelum habis: {{5}}',
    en:'{{2}} flash sale, only until {{4}}! {{1}}, get {{3}} before it\'s gone: {{5}}'},
  big_date:{cat:'marketing',kind:'date',
    id:'Halo {{1}}, {{2}} punya hadiah spesial buat kamu: {{3}}. Berlaku sampai {{4}}. Klaim di sini: {{5}}',
    en:'Hi {{1}}, {{2}} has something special for you: {{3}}. Valid until {{4}}. Claim it here: {{5}}'},
  bundle_offer:{cat:'marketing',kind:'promo',
    id:'Halo {{1}}, belanja lebih hemat di {{2}}: {{3}}. Sampai {{4}}. Pilih paketmu: {{5}}',
    en:'Hi {{1}}, save more at {{2}}: {{3}}. Until {{4}}. Pick your bundle: {{5}}'},
  restock:{cat:'marketing',kind:'new',
    id:'Kabar baik, {{1}}! {{3}} sudah tersedia lagi di {{2}}. Stok terbatas: {{5}}',
    en:'Good news, {{1}}! {{3}} is back in stock at {{2}}. Limited stock: {{5}}'},
  best_seller:{cat:'marketing',kind:'new',
    id:'Halo {{1}}, ini favorit pelanggan {{2}} bulan ini: {{3}}. Lihat di sini: {{5}}',
    en:'Hi {{1}}, this month\'s favourite at {{2}}: {{3}}. See it here: {{5}}'},
  second_purchase:{cat:'marketing',kind:'store',
    id:'Halo {{1}}, terima kasih sudah belanja di {{2}}! Ini {{3}} untuk belanja berikutnya, berlaku sampai {{4}}: {{5}}',
    en:'Hi {{1}}, thanks for shopping at {{2}}! Here\'s {{3}} for your next order, valid until {{4}}: {{5}}'},
  win_back:{cat:'marketing',kind:'store',
    id:'Halo {{1}}, kami kangen kamu di {{2}}! Yuk belanja lagi dengan {{3}}, sampai {{4}}: {{5}}',
    en:'Hi {{1}}, we miss you at {{2}}! Come back with {{3}}, until {{4}}: {{5}}'},
  vip_early_access:{cat:'marketing',kind:'date',
    id:'Halo {{1}}, kamu pelanggan istimewa {{2}}. Akses lebih dulu buat kamu: {{3}}, sampai {{4}}. Belanja duluan: {{5}}',
    en:'Hi {{1}}, you\'re one of {{2}}\'s favourite customers. Early access for you: {{3}}, until {{4}}. Shop first: {{5}}'},
  checkout_reminder:{cat:'marketing',kind:'store',
    id:'Halo {{1}}, pesananmu di {{2}} belum selesai. Selesaikan dengan {{3}} sampai {{4}}: {{5}}',
    en:'Hi {{1}}, your order at {{2}} isn\'t finished yet. Complete it with {{3}} until {{4}}: {{5}}'},
  event_invite:{cat:'marketing',kind:'date',
    id:'Halo {{1}}, {{2}} mengundangmu: {{3}}, {{4}}. Simpan tempatmu: {{5}}',
    en:'Hi {{1}}, {{2}} invites you: {{3}}, {{4}}. Save your spot: {{5}}'},
  otp_login:{cat:'utility',noImage:true,
    id:'{{1}} adalah kode verifikasi FLIK kamu. Jangan berikan kode ini ke siapa pun. Berlaku 5 menit.',
    en:'{{1}} is your FLIK verification code. Don\'t share it with anyone. Valid for 5 minutes.'},
  campaign_report:{cat:'utility',
    id:'Halo {{1}}, kampanye "{{2}}" sudah selesai. Penjualan dari kampanye: {{3}}. Tambahan dibanding grup pembanding: {{4}}. Lihat detailnya: {{5}}',
    en:'Hi {{1}}, your campaign "{{2}}" has ended. Sales from the campaign: {{3}}. Extra against the holdout group: {{4}}. See the details: {{5}}'}
};
/* every marketing template: {{1}} shopper's first name, {{2}} store, {{3}} offer or product, {{4}} valid until, {{5}} link */
const GE_WA_FOOT={id:'Balas STOP untuk berhenti',en:'Reply STOP to opt out'};
const GE_WA_BTN={id:['Pakai voucher','STOP'],en:['Use voucher','STOP']};

/* Canned answers for the AI fallback (mockLLM). Lane D (D2) adds the full set. */
const GE_LLM={
  vibe:q=>({tags:['warm','earthy','festive'],note:`Matched “${q&&q.vibe||'your vibe'}” to warm, earthy, festive scenes`}),
  copy:q=>({options:['Adem seharian, gaya tetap rapi','Linen premium untuk hari yang panjang','Santai tapi tetap standout']}),
  /* own context: rewrites the captions with what the owner typed, and suggests one tweak */
  context:q=>{const t=String(q&&q.text||'').trim(),l=q&&q.lang==='en';
    return{caption:l?`${t?t.charAt(0).toUpperCase()+t.slice(1)+'. ':''}Use your voucher before ${q&&q.until||'it ends'}, while stock lasts.`
                    :`${t?t.charAt(0).toUpperCase()+t.slice(1)+'. ':''}Pakai vouchermu sebelum ${q&&q.until||'berakhir'}, selama stok masih ada.`,
      tweak:l?'Put the new product in the Studio image and the WhatsApp header':'Tampilkan produk baru di gambar Studio dan header WhatsApp'}},
  /* a competitor post the rules couldn't place */
  classify:q=>{const c=String(q&&q.caption||'').toLowerCase();
    return{type:/%|diskon|sale|potong|hemat/.test(c)?'promo':/baru|new|launch|rilis/.test(c)?'new':/giveaway|hadiah|menang/.test(c)?'giveaway':'ugc',confidence:.82}}
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

/* ===================== Competitors, store, calendar, ideas (lane D, D3) ===================== */

/* The merchant's saved brand (S6): logo and colour come back in every Studio design */
const GE_BRAND={colour:'#8a5a3b',logo:'data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="260" height="100" viewBox="0 0 260 100"><circle cx="50" cy="50" r="42" fill="#8a5a3b"/><path d="M28 66 50 28l22 38" fill="none" stroke="#f6eddd" stroke-width="8" stroke-linejoin="round"/><path d="M37 54h26" stroke="#f6eddd" stroke-width="7"/><text x="104" y="62" font-family="Georgia,serif" font-size="38" fill="#8a5a3b">aruna</text></svg>')};

/* Fictional competitors (BUILD_SPEC 4.3). Posts: [days ago, type|null, product, background, tag, caption id, caption en, hour, likes].
 * Activity: [day (negative = before the demo date; positive = appears after "Skip 7 days"), kind, text id, text en]. */
const CP_FIX={
  'kain.kita.id':{name:'Kain Kita',cat:'fashion',followers:48200,site:'kainkita.example',platform:'shopify',fb:'facebook.com/kainkita',
    bio:{id:'Kemeja linen & batik harian · Jakarta',en:'Everyday linen & batik · Jakarta'},
    posts:[[1,'promo','linen-shirt','#e8d6c0','-20%','Diskon 20% semua kemeja linen sampai 20 Okt!','20% off every linen shirt until 20 Oct!',20,1840],
      [2,'promo','linen-shirt','#d9e3d1','-20%','Hari ke-2 sale linen. Warna sage tinggal sedikit.','Linen sale day 2. Sage is almost gone.',19,960],
      [4,'new','batik-dress','#f1e2cf','Baru','Koleksi baru: Outer Tenun, tenun asli Lombok.','New in: the Tenun outer, woven in Lombok.',20,1210],
      [5,'ugc','linen-shirt','#e5ddd3','','Repost dari @rara.ootd, makasih sudah tag kami!','Reposted from @rara.ootd, thanks for the tag!',21,640],
      [7,'new','tote-bag','#efe6d4','Baru','Tote kanvas natural, muat laptop 14 inci.','Natural canvas tote, fits a 14-inch laptop.',19,720],
      [9,'giveaway','batik-dress','#f3e3d3','Giveaway','Giveaway 3 dress batik! Follow, like, tag 2 teman.','Giveaway: 3 batik dresses! Follow, like, tag 2 friends.',20,4310],
      [12,null,'linen-shirt','#e9e1d6','','Pagi yang adem di studio kami.','A cool morning in our studio.',8,410],
      [15,'promo','batik-dress','#ecd9c6','-15%','Payday deal: batik parang 15% off.','Payday deal: 15% off Parang batik.',20,1120],
      [19,'ugc','tote-bag','#e6e0d2','','Kata pelanggan: "adem dan nggak kusut".','Customers say: "cool and doesn\'t crease".',21,530]],
    products:[['Kemeja Linen Putih',219000,259000,true,'price'],['Kemeja Linen Sage',219000,259000,true,'price'],['Dress Batik Parang',349000,429000,true,''],
      ['Celana Kulot Linen',199000,249000,true,''],['Tote Kanvas Natural',129000,0,true,''],['Outer Tenun Lombok',389000,0,true,'new'],['Scarf Voile Bunga',119000,0,false,'new'],['Kemeja Batik Pria',299000,0,true,'new']],
    activity:[[-2,'promo','Mulai sale 20% untuk kemeja linen','Started a 20% sale on linen shirts'],
      [-2,'price','Harga Kemeja Linen Putih Rp259.000 → Rp219.000','Price of Kemeja Linen Putih Rp259.000 → Rp219.000'],
      [-4,'new','3 produk baru: Outer Tenun, Scarf Voile Bunga, Kemeja Batik Pria','3 new products: Outer Tenun, Scarf Voile Bunga, Kemeja Batik Pria'],
      [-9,'post','Giveaway dengan 4.310 likes, postingan terbesar bulan ini','Giveaway with 4,310 likes, their biggest post this month'],
      [3,'promo','Umumkan pre-sale 11.11: diskon 25% mulai 9 Nov','Announced an 11.11 pre-sale: 25% off from 9 Nov'],
      [5,'price','Dress Batik Parang kembali ke Rp429.000 (sale selesai)','Dress Batik Parang back to Rp429.000 (sale ended)']]},
  'lunaloom.co':{name:'Luna Loom',cat:'fashion',followers:21900,site:'lunaloom.example',platform:'woocommerce',fb:'facebook.com/lunaloom.co',fbVia:'fallback',
    bio:{id:'Basic wanita yang nyaman · Bandung',en:'Comfortable women\'s basics · Bandung'},
    posts:[[0,'new','batik-dress','#e7e3ef','Reels','Styling 1 celana, 3 gaya. Reels malam ini!','1 pair of pants, 3 looks. Tonight\'s reel!',20,880],
      [1,'promo','tote-bag','#ede4dc','Turun harga','Harga turun untuk 4 favorit kamu.','Lower prices on 4 of your favourites.',20,1020],
      [2,'ugc','linen-shirt','#e3e8ee','','Foto dari pelanggan di Lembang.','A customer photo from Lembang.',20,470],
      [3,'new','batik-dress','#efe1e6','Reels','Reels: cara mix & match cardigan rajut.','Reel: how to mix and match the knit cardigan.',20,1390],
      [4,null,'tote-bag','#e9e6df','','Behind the scenes packing pesanan hari ini.','Behind the scenes: packing today\'s orders.',21,350],
      [6,'new','linen-shirt','#e5ece6','Restock','Luna Wide Pants sudah restock semua ukuran.','Luna Wide Pants restocked in every size.',20,760],
      [8,'promo','batik-dress','#f0e5da','-10%','10% untuk pembelian pertama.','10% off your first order.',20,640],
      [11,'ugc','linen-shirt','#e6e3ea','','Review jujur dari @dinda.k','An honest review from @dinda.k',20,420],
      [14,'new','tote-bag','#ebe7dd','Baru','Midi skirt plisket, 5 warna.','Pleated midi skirt in 5 colours.',20,910]],
    products:[['Luna Wide Pants',199000,239000,true,'price'],['Loom Basic Tee',89000,109000,true,'price'],['Midi Skirt Plisket',219000,259000,true,'price'],
      ['Cardigan Rajut',249000,299000,true,'price'],['Linen Set Kencana',459000,0,false,''],['Kemeja Oversize',189000,0,true,'']],
    activity:[[-1,'price','Turunkan harga 4 produk, sampai 17%','Dropped prices on 4 items, by up to 17%'],
      [-3,'post','Posting reels setiap malam pukul 20:00','Posts a reel every night at 20:00'],
      [-6,'new','Restock Luna Wide Pants','Restocked Luna Wide Pants'],
      [4,'promo','Mulai gratis ongkir untuk belanja di atas Rp300.000','Started free shipping over Rp300.000']]},
  'sare.basic':{name:'Sare Basic',cat:'fashion',followers:12400,site:'sare-basic.example',platform:'custom',
    bio:{id:'Kaos & kemeja basic lokal',en:'Local basic tees and shirts'},
    posts:[[2,'new','linen-shirt','#e4e7ea','Baru','2 warna baru: navy dan olive.','2 new colours: navy and olive.',12,390],
      [5,'new','tote-bag','#ece6dc','Baru','Tote kecil untuk sehari-hari.','A small everyday tote.',12,280],
      [9,'ugc','linen-shirt','#e7e4df','','Dipakai ke kantor, tetap rapi.','Worn to the office, still sharp.',13,240],
      [13,'promo','linen-shirt','#e9e0d4','-10%','Diskon 10% akhir bulan.','10% off at the end of the month.',12,310]],
    products:[['Kaos Basic Navy',99000,0,true,'new'],['Kaos Basic Olive',99000,0,true,'new'],['Kemeja Oxford Putih',229000,259000,true,'price'],['Tote Mini',79000,0,true,'']],
    activity:[[-5,'new','2 produk baru di Instagram','2 new products on Instagram'],[2,'promo','Giveaway bareng brand partner','A giveaway with a partner brand']]},
  'private.label':{private:true,name:'Private Label',cat:'fashion'},
  /* the merchant's own brand, read the same way as a competitor (account sync comes later) */
  'aruna.studio':{own:true,name:'Aruna Studio',cat:'fashion',followers:18400,site:'aruna.flik.id',platform:'flik',fb:'facebook.com/aruna.studio',
    bio:{id:'Kemeja linen & batik untuk kerja dan akhir pekan · Bandung',en:'Linen & batik for work and weekends · Bandung'},
    posts:[[1,'new','linen-shirt','#efe6d4','Baru','Kemeja linen warna baru: sage dan pasir.','New linen shirt colours: sage and sand.',12,310],
      [3,'ugc','batik-dress','#f1e2cf','','Terima kasih @mira.ootd sudah pakai dress batik kami!','Thanks @mira.ootd for wearing our batik dress!',13,240],
      [6,'promo','tote-bag','#e6e0d2','-10%','Gajian: diskon 10% tote kanvas.','Payday: 10% off canvas totes.',12,280],
      [9,'new','batik-dress','#ecd9c6','Baru','Dress batik indigo, stok terbatas.','Indigo batik dress, limited stock.',11,350],
      [13,null,'linen-shirt','#e9e1d6','','Proses menjahit di workshop kami.','Sewing at our workshop.',12,190],
      [16,'ugc','linen-shirt','#e5ddd3','','Review pelanggan: adem dipakai seharian.','A customer review: cool all day.',13,170],
      [20,'promo','linen-shirt','#e8d6c0','-15%','Diskon 15% kemeja linen akhir pekan ini.','15% off linen shirts this weekend.',12,420],
      [24,'new','tote-bag','#efe6d4','Baru','Tote kanvas, muat laptop.','Canvas tote, fits a laptop.',12,200],
      [28,'ugc','batik-dress','#f3e3d3','','Dipakai ke kondangan, cantik!','Worn to a wedding, lovely!',13,260]],
    products:[['Linen shirt · White',289000,0,true,''],['Batik dress · Indigo',375000,0,true,''],['Wide-leg trousers',219000,0,true,''],['Canvas tote bag',149000,0,true,''],
      ['Basic tee · Black',99000,0,true,''],['Voile scarf · Floral',125000,0,false,''],['Leather sneakers',459000,0,true,'']],
    activity:[[-1,'new','Posting warna baru kemeja linen','Posted new linen shirt colours']]}};
/* Facebook and Meta ads per account (public page + Meta Ad Library; both need a Meta app token, so example data).
 * fb: followers, posts in 30 days, average reactions per post, top post [caption id, caption en, reactions].
 * ads: [days running, format, text id, text en, new this week] */
const CP_CH={
  'aruna.studio':{fb:{followers:9200,posts30:10,avg:46,top:['Dress batik indigo, stok terbatas.','Indigo batik dress, limited stock.',140]},ads:[[12,'image','Kemeja linen untuk kerja','Linen shirts for work',false]]},
  'kain.kita.id':{fb:{followers:31500,posts30:22,avg:310,top:['Giveaway 3 dress batik!','Giveaway: 3 batik dresses!',2140]},
    ads:[[3,'carousel','Sale 20% kemeja linen, sampai 20 Okt','20% off linen shirts, until 20 Oct',true],[3,'video','Cara styling kemeja linen untuk kerja','How to style a linen shirt for work',true],
      [21,'image','Outer tenun asli Lombok','Handwoven Lombok outers',false],[38,'video','Kenapa linen kami adem','Why our linen stays cool',false],[45,'image','Gratis ongkir se-Jawa','Free shipping across Java',false]]},
  'lunaloom.co':{fb:{followers:12800,posts30:16,avg:120,top:['1 celana, 3 gaya','1 pair of pants, 3 looks',620]},
    ads:[[1,'video','Reels: 1 celana 3 gaya','Reel: 1 pair of pants, 3 looks',true],[9,'image','Harga turun untuk 4 favorit','Lower prices on 4 favourites',false],[16,'carousel','Midi skirt plisket 5 warna','Pleated midi skirt in 5 colours',false]]},
  'sare.basic':{fb:{followers:4100,posts30:6,avg:35,top:['2 warna baru: navy dan olive.','2 new colours: navy and olive.',90]},ads:[]},
  'private.label':{fb:{followers:2600,posts30:4,avg:18,top:['Koleksi musim hujan','Rainy season collection',60]},ads:[[6,'image','Koleksi musim hujan','Rainy season collection',true]]}
};
/* Action plan categories. Every suggestion (rules first, the AI only rewords) must be one of these, so it is always
 * something FLIK can do, or a clearly-marked suggestion. kind: campaign (opens Campaign), content (opens Studio), tip (suggestion only). */
const GE_ACTIONS={
  answer_promo:{kind:'campaign',n:{id:'Jawab promo kompetitor',en:'Answer a competitor promo'}},
  protect_price:{kind:'campaign',n:{id:'Cashback, bukan potong harga',en:'Cashback instead of a price cut'}},
  win_back:{kind:'campaign',n:{id:'Ajak kembali pelanggan yang pergi',en:'Win back shoppers who left'}},
  early_access:{kind:'campaign',n:{id:'Akses awal sebelum tanggal besar',en:'Early access before a big date'}},
  new_arrival_wa:{kind:'campaign',n:{id:'Kabari pelanggan setia soal produk baru',en:'Tell loyal shoppers about new products'}},
  match_content:{kind:'content',n:{id:'Tiru format konten terbaik mereka',en:'Match their best-performing content'}},
  ad_creative:{kind:'content',n:{id:'Buat materi iklan',en:'Make an ad creative'}},
  new_product_post:{kind:'content',n:{id:'Tampilkan produk baru',en:'Show your new products'}},
  posting_time:{kind:'content',n:{id:'Ubah waktu dan frekuensi posting',en:'Change when and how often you post'}},
  price_gap:{kind:'tip',n:{id:'Tinjau selisih harga',en:'Review the price gap'}},
  range_gap:{kind:'tip',n:{id:'Tinjau produk yang belum kamu punya',en:'Review products you don\'t have'}},
  ad_spend:{kind:'tip',n:{id:'Pertimbangkan anggaran iklan',en:'Consider an ad budget'}}
};
const CP_MARKET=/(^|\.)(shopee|tokopedia|lazada|tiktok|bukalapak|blibli|zalora)\./i;

/* Big dates, Oct to Mar (commercial and cultural moments). National public holidays come live from the public
 * holiday calendar when it answers; the ones marked fb are only used if it doesn't. */
const GE_DATES=[
  ['2026-10-28','culture','Hari Sumpah Pemuda','Youth Pledge Day'],['2026-11-11','shop','11.11','11.11'],
  ['2026-11-25','culture','Hari Guru','Teachers\' Day'],['2026-12-12','shop','12.12 Harbolnas','12.12 national online shopping day'],
  ['2026-12-22','culture','Hari Ibu','Mother\'s Day'],['2026-12-25','holiday','Hari Raya Natal','Christmas Day',1],
  ['2027-01-01','holiday','Tahun Baru Masehi','New Year\'s Day',1],['2027-02-06','holiday','Tahun Baru Imlek','Chinese New Year',1],
  ['2027-02-08','culture','Awal Ramadan (perkiraan)','Ramadan starts (approx.)'],['2027-02-14','shop','Hari Valentine','Valentine\'s Day'],
  ['2027-03-10','holiday','Idul Fitri (perkiraan)','Eid al-Fitr (approx.)',1],
  ...['2026-10-25','2026-11-25','2026-12-25','2027-01-25','2027-02-25','2027-03-25'].map(d=>[d,'payday','Gajian','Payday'])];

/* The merchant's shoppers, keyed by phone number (online + offline merged). Ported from v1 (crm.js). */
const GE_SEG=[
  {k:'new',n:{id:'Baru belanja sekali',en:'One-time shoppers'},rule:{id:'1 pesanan, 14–60 hari lalu',en:'1 order, 14 to 60 days ago'},on:1640,off:920},
  {k:'repeat',n:{id:'Pelanggan berulang',en:'Repeat'},rule:{id:'2+ pesanan dalam 90 hari',en:'2 or more orders in 90 days'},on:410,off:262},
  {k:'vip',n:{id:'VIP',en:'VIP'},rule:{id:'5% teratas berdasarkan belanja, 180 hari',en:'Top 5% by spend in 180 days'},on:118,off:71},
  {k:'risk',n:{id:'Berisiko pergi',en:'At risk'},rule:{id:'Pelanggan berulang, tidak belanja 45–90 hari',en:'Repeat shopper, no order in 45 to 90 days'},on:384,off:207},
  {k:'lapsed',n:{id:'Sudah lama tidak belanja',en:'Lapsed'},rule:{id:'Tidak belanja lebih dari 90 hari',en:'No order in more than 90 days'},on:690,off:452},
  {k:'checkout',n:{id:'Checkout belum dibayar',en:'Checkout not paid'},rule:{id:'Mulai checkout, belum bayar dalam 7 hari',en:'Started checkout, not paid in 7 days'},on:136,off:0}];
const GE_SCALE={new:.03,active:1,top:3.2};
const GE_AOV=285000;          // example average order value
const GE_FEE=1.5;             // % FLIK campaign fee on attributed sales only (example)
const GE_PULSE={
  new:{orders:9,prev:4,repeat:null,peers:14.2,top:'Canvas tote bag',off:22},
  active:{orders:86,prev:74,repeat:10.8,peers:14.2,top:'Linen shirt · White',off:37},
  top:{orders:268,prev:241,repeat:18.4,peers:14.2,top:'Batik dress · Indigo',off:41}};

/* Ideas for this week (BUILD_SPEC 5.1). src: date | competitor | store. ch: wa, ig, tt, off. */
const GE_IDEAS=[
  {id:'i-1111',type:'campaign',src:['date','store'],date:'2026-11-11',segs:['repeat','vip'],ch:['wa','ig','off'],
    title:{id:'Akses awal 11.11 untuk pelanggan berulang dan VIP',en:'11.11 early access for repeat and VIP shoppers'},
    why:{id:'11.11 tinggal 4 minggu lagi. Pelanggan berulang dan VIP-mu membawa 61% penjualan; beri mereka akses lebih dulu sebelum ramai.',en:'11.11 is 4 weeks away. Your repeat and VIP shoppers bring 61% of your sales; give them first access before the rush.'},
    voucher:{kind:'pct',v:10,max:10000,min:150000,days:28,quota:300},tpl:'vip_early_access',tpls:['vip_early_access','big_date','promo_discount','flash_sale'],
    offer:{id:'diskon {v} (maks {max}) akses awal 11.11',en:'{v} off (up to {max}) 11.11 early access'},
    product:'linen-shirt',scene:'festive-red',exp:[4e6,7e6],conv:.05},
  {id:'i-kk-sale',type:'campaign',src:['competitor','store'],cmp:'kain.kita.id',act:0,segs:['risk'],ch:['wa','ig'],
    title:{id:'Jawab sale 20% Kain Kita dengan paket 2 kemeja',en:'Answer Kain Kita\'s 20% sale with a 2-shirt bundle'},
    why:{id:'Kain Kita memotong harga kemeja linen 20% sejak 12 Okt. Kemeja linen adalah produk terlarismu, dan 591 pelanggan berisiko pergi mungkin membandingkan. Jawab dengan nilai: beli 2 hemat Rp50.000, bukan diskon lebih dalam.',
      en:'Kain Kita cut linen shirt prices by 20% on 12 Oct. Linen shirts are your best seller, and 591 at-risk shoppers may compare. Answer with value: buy 2 and save Rp50.000, not a deeper discount.'},
    voucher:{kind:'amt',v:50000,max:50000,min:450000,days:10,quota:150},tpl:'bundle_offer',tpls:['bundle_offer','promo_discount','flash_sale'],
    offer:{id:'hemat {v} untuk 2 kemeja linen',en:'{v} off 2 linen shirts'},
    product:'linen-shirt',scene:'linen-sand',exp:[2e6,4e6],conv:.05},
  {id:'i-second',type:'campaign',src:['store'],segs:['new'],ch:['wa'],
    title:{id:'Pembelian kedua untuk pelanggan yang baru belanja sekali',en:'Second purchase for one-time shoppers'},
    why:{id:'{n} pelanggan baru belanja sekali, 14–60 hari lalu. Sebagian besar pelangganmu tidak kembali setelah pesanan pertama. Terakhir kali (Agustus) hasilnya 2,2× grup pembanding.',
      en:'{n} shoppers bought once, 14 to 60 days ago. Most of your shoppers never come back after the first order. Last time (August) it beat the holdout 2.2×.'},
    voucher:{kind:'pct',v:15,max:30000,min:150000,days:14,quota:400},tpl:'second_purchase',tpls:['second_purchase','win_back','promo_discount'],
    offer:{id:'diskon {v} (maks {max})',en:'{v} off (up to {max})'},
    product:'tote-bag',scene:'oak-table',exp:[5e6,9e6],conv:.035,past:'C-1042'},
  {id:'i-sumpah',type:'post',src:['date'],date:'2026-10-28',ch:['ig','tt'],
    title:{id:'Hari Sumpah Pemuda (28 Okt): post OOTD batik',en:'Youth Pledge Day (28 Oct): batik OOTD post'},
    why:{id:'Postingan bertema budaya lokal mendapat 1,8× lebih banyak interaksi di toko fashion FLIK yang mirip. Dress batik ada di pesanan terbarumu.',en:'Local-culture posts get 1.8× more engagement at similar FLIK fashion stores. The batik dress is in your recent orders.'},
    caption:{id:'Satu nusa, satu bangsa, satu gaya. Rayakan Sumpah Pemuda dengan batik favoritmu. #SumpahPemuda #OOTDbatik',en:'One land, one nation, one style. Celebrate Youth Pledge Day in your favourite batik. #SumpahPemuda #OOTDbatik'},
    product:'batik-dress',scene:'terracotta-sun',exp:[.8e6,1.6e6]},
  {id:'i-best',type:'post',src:['store'],ch:['ig'],
    title:{id:'Terlaris bulan ini: carousel kemeja linen',en:'Best seller this month: linen shirt carousel'},
    why:{id:'Kemeja Linen Putih ada di 38% pesananmu bulan ini (dari pesanan terbarumu). Tunjukkan kenapa orang suka.',en:'Linen shirt · White is in 38% of your orders this month (from your recent orders). Show why people love it.'},
    caption:{id:'Terlaris bulan ini: Kemeja Linen Putih. Adem, nggak gampang kusut, cocok buat kerja dan jalan. Cek ukuranmu sebelum kehabisan.',en:'This month\'s best seller: the white linen shirt. Cool, doesn\'t crease easily, works for the office and the weekend. Grab your size before it\'s gone.'},
    product:'linen-shirt',scene:'window-light',exp:[1e6,2e6]}];
const GE_IDEAS_FOR={new:['i-1111','i-kk-sale','i-sumpah'],active:GE_IDEAS.map(i=>i.id),top:GE_IDEAS.map(i=>i.id)};

/* Two ended campaigns from the v1 history, with results (D3) */
const GE_CAMP_SEED=[
  {id:'C-1042',idea:'i-second',name:{id:'Pembelian kedua · Agustus',en:'Second purchase · August'},tpl:'second_purchase',segs:['new'],ch:['wa'],start:-62,days:14,
    voucher:{kind:'pct',v:15,max:30000,min:150000,days:14,quota:400},res:{sent:2310,delivered:2228,read:1890,clicked:412,claimed:0,redeemed:97,sales:27.6e6,hold:257,holdRed:5,holdSales:1.45e6,cost:1155000,vcost:2.6e6,on:61,cashier:36,claim:0}},
  {id:'C-0987',idea:null,name:{id:'Ajak kembali · September',en:'Win back · September'},tpl:'win_back',segs:['risk'],ch:['wa','off'],start:-34,days:14,
    voucher:{kind:'pct',v:10,max:25000,min:150000,days:14,quota:200},res:{sent:540,delivered:521,read:418,clicked:88,claimed:23,redeemed:26,sales:8.1e6,hold:60,holdRed:1,holdSales:.31e6,cost:270000,vcost:.62e6,on:14,cashier:9,claim:3}}];

/* Example shoppers who appear in the Outbox (fictional names, fictional numbers) */
const GE_SHOPPERS=['Sari','Budi','Maya','Andi','Putri','Fajar','Nadia','Bayu'].map((n,i)=>({n,phone:'62813000001'+String(10+i)}));
/* Shoppers for "Selected shoppers" (fictional names and numbers) */
const GE_SHOPLIST=(()=>{const R=mkRng(777),segs=['new','repeat','vip','risk','lapsed'],out=[];
  for(let i=0;i<36;i++){const sg=segs[Math.floor(R()*segs.length)];out.push({id:'S'+(1000+i),n:FN[Math.floor(R()*FN.length)]+' '+LN[Math.floor(R()*LN.length)],phone:'6281300'+String(200000+i*137).slice(0,6),seg:sg,
    orders:sg==='new'?1:sg==='vip'?6+Math.floor(R()*8):2+Math.floor(R()*4),spent:Math.round((sg==='vip'?3e6:sg==='new'?2.8e5:9e5)*(0.6+R())/1000)*1000,last:Math.floor(sg==='lapsed'?95+R()*80:sg==='risk'?46+R()*40:R()*40),off:R()<.37})}
  return out})();
