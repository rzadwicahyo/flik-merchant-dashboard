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
