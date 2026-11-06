# PROTOTYPE build spec: Growth Engine v2 + Studio

> **PROTOTYPE doc set** for `rzadwicahyo/flik-merchant-dashboard`. Front-end only, example data. Read `CONTEXT.md` first. The production build has its own docs outside this repo; do not use them here.

Version: v4.0 prototype · 5 Nov 2026 · Owner: Reza

## 1. Screens and routes

| Hash | Screen | Who | File |
| --- | --- | --- | --- |
| `#studio` | Public Studio page (full screen, no sidebar, FLIK logo top-left, language switch, "Sign in") | anon, lead | `studio.js` |
| `#studio/edit` | Studio editor (full screen) | all | `studio.js` |
| `#marketing/studio` | Studio inside the dashboard (sidebar: Marketing › Studio). Same editor, plus "Your designs" | lead, merchants | `studio.js` |
| `#marketing/competitors` | Competitor monitoring | lead (snapshot), merchants (full) | `compete.js` |
| `#marketing/growth` | Growth Engine: ideas for this week | merchants (lead sees upsell) | `growth.js` |
| `#marketing/growth/idea/<id>` | Idea detail: review, adjust, execute (full screen like create shipment) | merchants | `growth.js` |
| `#marketing/growth/campaign/<id>` | Campaign result | merchants | `growth.js` |
| `#claim/<code>` | Shopper claim page from the offline poster QR (phone-sized card) | public | `growth.js` |

Sidebar: Marketing gets **Growth Engine**, **Studio**, **Competitors** at the top (in that order), above the existing items. `?account=anon` opens `#studio` by default; `?account=lead` opens `#marketing/studio`.

## 2. Demo script for AG (must work start to finish, about 8 minutes)

1. Open `?account=anon#studio`. Pick the sample "Linen shirt" (or upload any photo). Type vibe "earthy, lebaran feel". Four watermarked previews appear in under 10 s.
2. Tap a preview. Change headline tone to Playful, switch copy to English, swap to 4:5. Tap **Show me 4 more** (regenerate 1 of 1 for leads). Tap **Download**.
3. Sign-up sheet: fill with example data, OTP `123456`. Account becomes Lead. Export sheet shows "Free for now", download PNG, cut-out PNG, SVG.
4. Lead lands on Marketing › Studio with a card "See what your competitor posts". Add `@kain.kita.id` (fictional). One-time snapshot appears. The card "Get weekly tracking of 3 competitors and campaign ideas: become a FLIK merchant".
5. Switch prototype bar to **Active merchant**. Open Growth Engine. Three to five ideas for this week: one big-date post (11.11), one competitor reaction (a competitor started a 20% sale), one store-performance campaign (second purchase).
6. Open the 11.11 campaign idea. Adjust: voucher 10% max Rp10.000 → 5%; channels WhatsApp + Instagram + Offline; type own context "we have a new batik collection". Copy updates (AI tag shown). Image comes from Studio.
7. **Execute**: summary of reach, holdout 10%, cost (WhatsApp sends paid from balance). Pay with FLIK balance → ledger line. Outbox shows the WhatsApp message with image header. Instagram post kit downloads. Offline poster downloads with a claim QR.
8. Prototype bar **Skip 7 days**. Campaign shows sales from voucher redemptions vs holdout. **Download CSV**. **End campaign** → Outbox shows the owner's WhatsApp report.

## 3. Studio

### 3.1 Public Studio page `#studio`
- Hero: "Foto produk jadi siap jual dalam 10 detik" / "Product photos ready to sell in 10 seconds". Sub: free to try, no sign-up until you download.
- Upload box (drag, click, or camera on phone) + "or try a sample" row of 8 sample products.
- Optional fields before designing: **Category** (F&B, Fashion, Beauty, Home, Other; required, merchant picks it), **Vibe** (free text, placeholder "e.g. minimalist, warm, festive"), **Product name** (optional, used in copy), **Logo** (optional upload; merchants reuse the saved logo).
- Button **Design it**. Trust line: "We never use your photos for anything else."
- Below the fold: 3 example before/after pairs (drawn), "How it works" in 3 steps, footer "by FLIK".

### 3.2 Designing (progress)
Staged progress (CONTEXT section 9) with the words "Uploading", "Cutting out your product", "Matching scene and light", "Writing the copy". Previews pop in one by one.

### 3.3 Editor `#studio/edit`
- Left: 4 preview tiles (540 px canvas each, watermarked). Selected tile is large in the centre.
- Right panel, tabs:
  - **Scene**: 6 scene thumbnails filtered by category + vibe tags; "match: 78%" small text (prototype only, for AG).
  - **Text**: headline, sub, CTA (each editable, with ↻ to cycle phrase-bank options); tone Casual / Formal / Playful; language ID / EN; promo badge (none, "-20%", "Baru", "Best seller", custom).
  - **Format**: 1:1 Feed, 4:5 Feed, 9:16 Story, 1:1 Marketplace white.
  - **Brand**: logo on/off, position, brand colour (picked from logo or set).
  - **Cut-out**: Erase / Restore brush (prototype: toggles a slightly tighter mask and shows a toast).
- Top bar: **Show me 4 more** (with counter "1 left"), **Download**, **Use in a campaign** (merchants only).
- If vibe matched < 20% of the dictionary, show "AI" tag on the scene tab and log `llm.fallback {case:'vibe'}`. Example vibe that triggers it: "cyberpunk nenek".
- Copy "doesn't fit" button under the headline → `mockLLM('copy')` returns 3 alternatives with the AI tag.

### 3.4 Composer (real, in the browser)
Layer JSON per variation, the single source for preview and export:

```json
{"w":1080,"h":1080,"format":"1:1","scene":"marble-warm",
 "layers":[
  {"type":"scene","id":"marble-warm"},
  {"type":"shadow","x":540,"y":820,"rx":260,"ry":40,"blur":30,"opacity":0.35},
  {"type":"product","id":"linen-shirt","x":540,"y":560,"scale":0.68,"tint":0.06},
  {"type":"text","role":"headline","text":"Adem seharian","x":80,"y":120,"size":72,"weight":700,"color":"#2b2118"},
  {"type":"text","role":"sub","text":"Linen premium, potongan santai","x":80,"y":200,"size":34,"color":"#5a4a3a"},
  {"type":"badge","text":"Baru","x":900,"y":110,"bg":"#c2410c","color":"#fff"},
  {"type":"logo","x":80,"y":980,"h":60},
  {"type":"cta","text":"Pesan sekarang","x":80,"y":900}
 ]}
```
Rules: product box 60–75% of the shorter side; contact shadow under the product from the scene's light side; text only inside the layout's safe zones; contrast at least 4.5:1 (pick dark or light text automatically); 4 variations must differ in scene or layout (no two with the same palette).

Preview: render at 540 px, then draw the watermark: "FLIK Studio · preview" tiled diagonally every 140 px at 18% opacity, plus a small "Download to remove watermark" strip. Do this before the canvas is shown or turned into an `<img>`.

### 3.5 Sign-up gate (anon → lead)
Opens on Download or Use. Sheet over the editor; the design stays visible behind it.
- Fields: Full name, Brand name, WhatsApp number (+62), Category (prefilled from Studio), Instagram or website link (optional), checkbox "FLIK may contact me on WhatsApp about my account and offers" (optional: sign-up works without it, but FLIK's follow-up messages to the lead need it).
- **Fill with example data** link (prototype only), like the existing verification modal.
- **Send code** → fake phone preview shows the OTP message from FLIK. Code `123456`. Wrong code: "That code doesn't match. Try again or resend in 30 s."
- Success: account becomes Lead, toast "Welcome, Rina. Your design is ready to download", export sheet opens.
- If the phone matches an existing merchant owner in the example data (`0812-0000-0007`), show "This number already has a FLIK account. Sign in instead" and switch to Active merchant.

### 3.6 Export and payment
Export sheet: the clean full-size preview (first time it appears), formats with checkboxes: PNG (1080 px), Cut-out PNG, SVG, PSD (layered, "in production build" toast). Then:
- **Within free quota**: "Free: 3 of 10 exports left this month" → Download.
- **Lead**: price from `LIMITS.leadExportPrice` (Rp0 now) → "Free for now" → Download. If AG sets it to Rp2.000 in the Limits editor, the lead gets a payment link instead.
- **Merchant over quota**: price `LIMITS.exportPrice` (Rp2.000 example). Method picker: **FLIK balance** (shows balance; direct debit, ledger line "Studio export · Rp2.000") or **Other methods** (QRIS, VA, e-wallet, card → FLIK payment link sheet → **Mark as paid** → download).
- Re-download of an export already paid is free for 30 days ("Downloaded before · free").
- Downloads: real files named `aruna-studio-linen-shirt-1x1.png` etc.

## 4. Competitor monitoring `#marketing/competitors`

### 4.1 Lead: one-time snapshot
- Input "Competitor's Instagram" (handle). Instagram only. Website and marketplace inputs are not shown.
- Result card: profile (name, followers, posts last 30 days), last 9 posts grid (drawn thumbnails with captions), detected: "2 promos in 30 days (discount 15–20%)", "posts most at 19:00–21:00", "top themes: new arrival, OOTD".
- Footer: "This is a one-time snapshot. FLIK merchants get 3 competitors tracked weekly, website prices and campaign ideas." CTA **Become a FLIK merchant** (toast: "Opens merchant sign-up").
- Used once: the input is replaced by the saved snapshot with its date.

### 4.2 Merchant: full view
- Up to 3 competitors (limit from `LIMITS`), each with Instagram handle and optional website.
- Website check on add: detects Shopify / WooCommerce / unsupported (fixtures for the fictional shops; a real domain is read live, see CONTEXT 2.3). Marketplace URL (shopee, tokopedia, lazada, tiktok, bukalapak) → "We can't read marketplaces. Add their Instagram or own website instead."
- Per competitor tabs: **Posts** (grid, with tags promo / new arrival / UGC / giveaway), **Products and prices** (from website: name, price, compare-at price, in stock, changed this week), **Activity** (timeline: "Started 20% sale on 12 Oct", "Price of Kemeja Linen Rp259.000 → Rp219.000", "3 new products").
- Last refreshed "weekly · Mon 07:00". Prototype bar **Skip 7 days** adds new activity.
- Friendly states: Instagram account is private or personal ("We can only read business or creator accounts"), website unreachable ("Their site didn't answer. We'll try again next week."), unclassified post with AI tag (`mockLLM('classify')`).
- Each activity item has **Get an idea** → creates a competitor-reaction idea in Growth Engine.

### 4.3 Fixture competitors (fictional)
| Handle | Website | Platform | Behaviour |
| --- | --- | --- | --- |
| `@kain.kita.id` | kainkita.example | Shopify | Running a 20% sale since 12 Oct; 3 new arrivals |
| `@lunaloom.co` | lunaloom.example | WooCommerce | Price drops on 4 items; posts reels nightly |
| `@sare.basic` | sare-basic.example | unsupported (custom) | Website shows "not supported", Instagram works |
| `@private.label` | none | none | Private account → friendly state |

## 5. Growth Engine `#marketing/growth`

### 5.1 Ideas for this week (landing)
- Header: "Ideas for this week · 14–20 Oct". Language switch. **Settings** link.
- Strip: store pulse (orders 7 days vs previous, repeat rate, top product from recent orders, offline share).
- Idea cards (3–5), each: type badge (**Post** or **Campaign**), source chips (Big date / Competitor / Your store), one-line why, channels icons, voucher if any, expected result range ("Rp4–7 jt extra sales, from similar FLIK stores"), buttons **Review** and **Not now**.
- Example ideas for Aruna Studio (active):
  1. Campaign · Big date · **11.11 early access** for repeat + VIP shoppers. WA + IG + Offline. Voucher 10% max Rp10.000. 
  2. Campaign · Competitor · **Answer Kain Kita's 20% sale** with a "bundle 2 shirts" offer for at-risk shoppers. WA + IG.
  3. Campaign · Your store · **Second purchase** for 1,640 one-time shoppers (from v1). WA.
  4. Post · Big date · **Hari Sumpah Pemuda (28 Oct)** batik OOTD post. IG + TikTok (post kit only; FLIK doesn't post to TikTok).
  5. Post · Your store · **Best seller this month: Linen shirt** carousel. IG.
- New merchant (`?account=new`): fewer store ideas, "We'll learn from your orders as they come in".
- Lead: upsell card, no ideas.

### 5.2 Idea detail `#marketing/growth/idea/<id>` (full screen, 3 steps)
**1 · Review**: why this idea (data behind it, with links to the competitor activity or the segment), audience (segment, size, online/offline split, excluded: opted-out, messaged in last 7 days, holdout), channels.

**2 · Adjust**
- Channels: WhatsApp, Instagram, TikTok (post kit only), Offline. Removing Offline removes the poster.
- Voucher (optional, merchant-funded): type % or Rp, value, max discount, min order, validity, quota. Default from the idea; e.g. 10% max Rp10.000 → change to 5%. Line: "Merchant voucher: deducted from your disbursement when used."
- Creative: image from Studio (pick a saved design or **Make one in Studio**, which opens the editor and returns), caption per channel.
- WhatsApp: template picker limited to the matching approved templates (section 7), language ID/EN, variables filled from the idea, preview bubble with image header. Text outside variables is locked ("FLIK's approved template").
- Own context box: "Tell us anything about this campaign" → `mockLLM('context')` rewrites captions and suggests a tweak, with AI tag, counted ("2 of 5 this week").
- Holdout: 10% default (0–30%), with "Why holdout?" tooltip.

**3 · Execute**
- Summary: reach per channel, send time (now or schedule), cost: WhatsApp sends × Rp`LIMITS.waCost` (example Rp500 per message), voucher budget cap, FLIK fee note.
- Pay WhatsApp sends: FLIK balance (ledger) or other method (payment link). Instagram/TikTok/offline: no cost.
- On execute: Outbox gets the WhatsApp messages (show 5 sample bubbles + "and 1,203 more"); downloads: IG post kit (PNG + caption .txt), offline poster PNG (A5, design + voucher + claim QR + "Show this at the cashier"); campaign created with status Running.

### 5.3 Campaigns list and result `#marketing/growth/campaign/<id>`
- List: Running, Scheduled, Ended. Seed 2 ended campaigns (from v1's history) and 0 running.
- Result: sent, delivered, read, clicked, claimed, redeemed (by voucher ID), attributed sales, holdout comparison ("Shoppers who got the message bought 2.3× more than the holdout: Rp6,2 jt extra sales"), cost, ROI; breakdown by channel (online voucher, cashier redemptions, claim page).
- **Download CSV** while running (columns: date, channel, sent, delivered, read, clicked, claimed, redeemed, sales, voucher cost; no shopper phones).
- **End campaign** (prototype bar or button) → status Ended → Outbox gets the owner report: template `campaign_report` with image header (a small results card) and the 4 key numbers.

### 5.4 Claim page `#claim/<code>`
Phone-sized card: store logo, offer, "Enter your WhatsApp number to save this voucher", consent checkbox, **Save voucher** → "Show your number at the cashier". Cashier side (prototype only): a "Cashier app" preview in the prototype bar where you type the phone and see "Voucher found · 5% off · Redeem".

### 5.5 Settings
Frequency cap (1 per 7 days, editable 3–14 days), default holdout, default language, owner WhatsApp for reports (read-only, owner only), quiet hours (21:00–08:00).

## 6. Limits (one object, editable in the prototype bar)

```js
const LIMITS = {
  regenPerDesign: {anon:1, lead:1, new:2, active:3, top:5},
  designsPerDay:  {anon:3, lead:5, new:10, active:20, top:40},
  freeExportsPerMonth: {lead:3, new:10, active:20, top:40},
  llmFallbacksPerDay:  {anon:2, lead:3, new:10, active:20, top:40},
  ownContextPerWeek:   {new:3, active:5, top:10},
  competitors:         {lead:1, new:3, active:3, top:3},
  leadExportPrice: 0,      // Rp, FLIK config; 0 = free for now
  exportPrice: 2000,       // Rp per export over the free quota (example)
  waCost: 500              // Rp per WhatsApp marketing message (example)
};
```
All numbers are examples for AG to react to; mark them "example" in the Limits editor. When a limit is reached, say what happens next, never just "limit reached": e.g. "You've used today's AI help. Rules-based options are still here, and it resets at 00:00."

## 7. WhatsApp templates (12 marketing types + 2 utility, ID and EN)

Marketing (image header, merchant name as sender display "Aruna Studio via FLIK"): `new_arrival`, `promo_discount`, `flash_sale`, `big_date`, `bundle_offer`, `restock`, `best_seller`, `second_purchase`, `win_back`, `vip_early_access`, `checkout_reminder`, `event_invite`.
Utility: `otp_login` (no image), `campaign_report` (owner, image header).
Each template: name, category, language, body with `{{1}}`… variables, footer "Balas STOP untuk berhenti", up to 2 buttons (URL to voucher / claim page, quick reply STOP). Status "Approved" in the prototype. Write all 28 texts in `ge-data.js`.

## 8. Events to track

`studio_viewed`, `studio_sample_picked`, `studio_upload_started`, `studio_previews_shown {ms}`, `studio_regenerate`, `studio_edit {field}`, `studio_download_clicked`, `signup_started`, `otp_sent`, `otp_verified`, `signup_completed`, `export_paid {method}`, `export_downloaded {formats}`, `llm_fallback {case}`, `limit_reached {limit}`, `competitor_added {source}`, `competitor_snapshot_viewed`, `merchant_cta_clicked`, `idea_viewed {source,type}`, `idea_dismissed`, `idea_adjusted {field}`, `campaign_executed {channels}`, `campaign_csv_downloaded`, `campaign_ended`, `voucher_claimed`, `voucher_redeemed`. No shopper names or phone numbers in props.

## 9. Prototype bar additions

- **Account**: Anonymous · Lead · New merchant · Active merchant · Top merchant (replaces "New to Shipping / Active shipper" only while on the new screens; on Shipping screens the old switch stays).
- **Language**: ID / EN.
- **Outbox** (count): WhatsApp messages sent, as bubbles.
- **Ledger**: balance and lines.
- **Limits**: editor for the `LIMITS` object (resets on reload).
- **Skip 7 days**, **End campaign**, **Cashier app**.
- Guide gets a "Growth Engine + Studio" section with the demo script from section 2.

## 10. Out of scope for the prototype

Real cut-out, real APIs (except the free public sources in CONTEXT 2.3: public holidays and a competitor's own Shopify/WooCommerce shop, live with example-data fallback), PSD export, admin pages for staff (manual AI top-up is shown only as a line in the Limits editor: "Top-ups are added by FLIK staff twice a day"), product catalog, referral, TikTok posting, marketplace data, analytics dashboards for FLIK staff.
