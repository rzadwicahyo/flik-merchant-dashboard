# PROTOTYPE tickets: Growth Engine v2 + Studio

> **PROTOTYPE doc set** for `rzadwicahyo/flik-merchant-dashboard`. Front-end only, example data. Read `CONTEXT.md` and `BUILD_SPEC.md` first. Production tickets live outside this repo; do not work from them here.

How to use: work top to bottom inside a lane; tick `[x]` when the PR is merged. One story per PR unless a task says otherwise. Branch `proto/<id>-<slug>`. Every PR: `npm test` green, new screens added to `tools/smoke.mjs`, screenshots in the description.

Lanes run in parallel after P0 is merged: **A** Studio · **B** Competitors · **C** Growth Engine · **D** Content (data and copy) · **QA** Reza.

Plan (5 working days, 2–4 Claude sessions in parallel, two review windows a day):

| Day | A Studio | B Competitors | C Growth Engine | D Content |
| --- | --- | --- | --- | --- |
| 1 | P0 (one session) → S1 | | | D1 sample products, scenes |
| 2 | S2, S3 | B1 | C1 | D2 copy, templates |
| 3 | S4, S5 | B2 | C2 | D3 competitors, ideas |
| 4 | S6 polish | B3 | C3, C4 | review with Yoga |
| 5 | QA fixes | QA fixes | C5, QA fixes | Guide + README |

---

## P0. Foundation (one session, merge before anything else)

**Story P0.1** As the team, we have the doc set inside the repo so every session reads it.
- [x] Add `docs/prototype/CONTEXT.md`, `BUILD_SPEC.md`, `TICKETS.md`, `README.md` (this set)
- [x] Add root `CLAUDE.md` with the pointer from CONTEXT section 12
- [x] README: new row "Growth Engine v2 + Studio (v4.0, in progress)" linking to the docs

**Story P0.2** As a developer, I have the shared pieces every lane needs.
- [x] Create `app/ge-i18n.js`, `app/ge-data.js`, `app/ge-core.js`, `app/studio.js`, `app/compete.js`, `app/growth.js` (empty renderers) and add script tags in the CONTEXT section 7 order
- [x] `GS` account state + `?account=anon|lead|new|active|top`, default `active`
- [x] `geT(key)` with `id`/`en`, language switch state
- [x] `LIMITS` object + `useLimit(name)` returning `{ok, left, message}` and firing `limit_reached`
- [x] `mockLLM(case, input)` → Promise with canned answers, 1.2 s delay, logs to the API drawer, counts `llmFallbacksPerDay`
- [x] `ledgerDebit(amount, label)` and `paymentLinkSheet(amount, label)` → Promise resolved on **Mark as paid**
- [x] `waSend(template, lang, vars, image)` → Outbox
- [x] Prototype bar: Account switch, Language, Outbox, Ledger, Limits editor, Skip 7 days, End campaign, Cashier app (empty handlers allowed)
- [x] Sidebar: Marketing › Growth Engine, Studio, Competitors; routes from BUILD_SPEC section 1 in `boot.js` with empty views
- [x] Remove `app/crm.js` and its script tag; note in README that v3.12 is replaced
- [x] Smoke test: every new route × account state loads without errors

---

## Lane A: Studio

**Story S1** As a stranger, I land on a page that makes me want to try it. *(BUILD_SPEC 3.1)*
- [ ] Full-screen `#studio` page (no sidebar), FLIK logo, language switch, Sign in
- [ ] Hero, upload box, sample row (from D1), category, vibe, product name, logo upload
- [ ] Before/after examples, How it works, footer
- [ ] Works at 390 px width

**Story S2** As a user, I get 4 good-looking previews in under 10 seconds. *(3.2, 3.4)*
- [ ] Staged progress with the agreed words; previews appear one by one
- [ ] Scene selection by category + vibe tags; vibe match score; < 20% → `mockLLM('vibe')` with AI tag
- [ ] Composer: layer JSON → canvas; product box, contact shadow, safe zones, auto text colour for 4.5:1 contrast
- [ ] 4 variations differ in scene or layout
- [ ] Watermark drawn into the 540 px canvas before display; no clean image in the DOM
- [ ] Upload path: accept any image, oval mask, "Prototype: real cut-out runs on FLIK's servers" note
- [ ] `studio_previews_shown {ms}` event

**Story S3** As a user, I can make the design mine. *(3.3)*
- [ ] Editor layout: tiles left, big preview centre, tabs right (Scene, Text, Format, Brand, Cut-out)
- [ ] Text: edit, cycle phrase-bank options, tone, ID/EN, promo badge
- [ ] Copy "doesn't fit" → `mockLLM('copy')` 3 options
- [ ] Formats 1:1, 4:5, 9:16, marketplace white re-layout the same layers
- [ ] Brand: logo on/off and position, brand colour
- [ ] **Show me 4 more** with counter from `LIMITS.regenPerDesign`; at the limit, explain what's next

**Story S4** As a stranger, I sign up only when I want to download. *(3.5)*
- [ ] Sign-up sheet on Download / Use; design visible behind
- [ ] Fields, validation (`phoneOk`), optional consent, Fill with example data
- [ ] OTP in fake phone preview; `123456`; wrong code and resend states
- [ ] Existing owner phone → "Sign in instead" → switches to Active merchant
- [ ] Account → Lead; events `signup_*`, `otp_*`

**Story S5** As a user, I export the files I need and pay the way I want. *(3.6)*
- [ ] Export sheet: clean full preview, format checkboxes
- [ ] Real downloads: PNG 1080, cut-out PNG, SVG from layers; PSD shows the production toast
- [ ] Free quota counter; lead price from `LIMITS.leadExportPrice` (Rp0 → free; > 0 → payment link)
- [ ] Merchant over quota: FLIK balance (ledger) or Other methods (payment link → Mark as paid)
- [ ] Free re-download of paid exports; events `export_paid`, `export_downloaded`

**Story S6** As a lead or merchant, Studio lives in my dashboard too.
- [ ] `#marketing/studio`: same editor + "Your designs" grid (saved variations, re-download)
- [ ] Merchant: saved logo and brand colour reused; **Use in a campaign** opens Growth Engine idea picker
- [ ] Lead home card: "See what your competitor posts" → Competitors

---

## Lane B: Competitor monitoring

**Story B1** As a lead, I get a free one-time look at one competitor. *(BUILD_SPEC 4.1)*
- [ ] Instagram handle input only; fixture lookup with 0.8 s load
- [ ] Snapshot card: profile, 9-post grid, detected promos, posting times, themes
- [ ] One-time: saved snapshot with date replaces the input
- [ ] Become a FLIK merchant CTA (`merchant_cta_clicked`)

**Story B2** As a merchant, I track up to 3 competitors every week. *(4.2)*
- [ ] Add competitor: Instagram + optional website; limit from `LIMITS.competitors`
- [ ] Website check: Shopify / WooCommerce / unsupported; marketplace URLs → friendly refusal
- [ ] Tabs per competitor: Posts, Products and prices, Activity timeline
- [ ] Skip 7 days adds new activity; "weekly · Mon 07:00" line

**Story B3** As a merchant, a competitor move becomes an idea, and failures never look broken.
- [ ] Friendly states: private/personal account, website unreachable, unsupported site
- [ ] Unclassified post → `mockLLM('classify')` with AI tag
- [ ] **Get an idea** on activity → creates a competitor-reaction idea in Growth Engine

---

## Lane C: Growth Engine

**Story C1** As a merchant, I see ideas for this week that make sense for my store. *(BUILD_SPEC 5.1)*
- [ ] Landing: week header, store pulse strip, idea cards (type, source chips, why, channels, voucher, expected range)
- [ ] Ideas from D3 for active; reduced set for new; upsell card for lead
- [ ] Not now (dismiss with reason: not relevant, already did it, later)
- [ ] Port v1's segments-by-phone and holdout wording from `crm.js`

**Story C2** As a merchant, I review and adjust an idea before anything runs. *(5.2 steps 1–2)*
- [ ] Full-screen 3-step flow; step 1 Review with data and links
- [ ] Channels toggle; offline poster only when Offline is on
- [ ] Voucher editor (%, Rp, max, min order, validity, quota) with merchant-voucher line
- [ ] Creative: pick a saved Studio design or Make one in Studio (round trip)
- [ ] WhatsApp template picker (matching templates only), ID/EN, locked text outside variables, bubble preview with image
- [ ] Own context → `mockLLM('context')`, counted by `LIMITS.ownContextPerWeek`
- [ ] Holdout slider with tooltip

**Story C3** As a merchant, I execute in one tap and pay for WhatsApp the way I want. *(5.2 step 3)*
- [ ] Summary: reach per channel, schedule, cost, voucher cap
- [ ] Pay: balance (ledger) or payment link
- [ ] Outbox bubbles, frequency cap and opt-out exclusions shown in counts
- [ ] Downloads: IG post kit (PNG + caption .txt), offline poster PNG with claim QR (drawn QR is fine)
- [ ] Campaign created as Running; `campaign_executed`

**Story C4** As a merchant, I see what each campaign brought in. *(5.3)*
- [ ] Campaigns list (Running, Scheduled, Ended) with 2 seeded ended campaigns
- [ ] Result screen: funnel, voucher redemptions, holdout comparison, cost, ROI, by channel
- [ ] Download CSV while running (no shopper phones)
- [ ] End campaign → owner `campaign_report` in Outbox

**Story C5** As a shopper and a cashier, the offline voucher works. *(5.4, 5.5)*
- [ ] `#claim/<code>` phone card: offer, phone, consent, Save voucher
- [ ] Cashier app preview: phone lookup → Redeem → counts in the result
- [ ] Settings: frequency cap, default holdout, language, owner WhatsApp (read-only), quiet hours

---

## Lane D: Content (example data and copy, with Reza; Yoga reviews via Reza)

**Story D1** As a user, samples and scenes look professional.
- [ ] 8 sample products as transparent inline SVG: linen shirt, batik dress, tote bag, sneakers (fashion); iced coffee cup, cookie jar (F&B); serum bottle, lip tint (beauty)
- [ ] ~12 drawn scenes with metadata: category fit, style tags, palette, light side, surface line, safe zones
- [ ] 3 before/after pairs for the public page

**Story D2** As a user, copy sounds natural in Bahasa and English.
- [ ] Phrase bank: headline/sub/CTA × 3 tones × 2 languages × 4 categories (about 15 each)
- [ ] Vibe dictionary: ID + EN synonyms → style tags (minimalis, hangat, mewah, ceria, lebaran, natal, earthy…)
- [ ] 14 WhatsApp template texts × 2 languages (BUILD_SPEC section 7)
- [ ] `mockLLM` canned answers for vibe, copy, context, classify

**Story D3** As AG, the demo data tells a believable story.
- [ ] 4 fictional competitors with posts, products, prices and activity (BUILD_SPEC 4.3)
- [ ] Big-date calendar Oct–Mar (Sumpah Pemuda, 11.11, Hari Guru, 12.12, Hari Ibu, Natal, Tahun Baru, Imlek, Ramadan start)
- [ ] 5 ideas for active, 3 for new, with numbers consistent with Aruna Studio's example orders
- [ ] Example balance Rp1.250.000 and 3 past ledger lines
- [ ] 2 ended campaigns with results

---

## QA (Reza)

- [ ] Demo script (BUILD_SPEC section 2) runs start to finish on the live GitHub Pages link, desktop
- [ ] Public Studio page and sign-up on a phone (390 px)
- [ ] No clean image before export: right-click save on a preview gives the watermarked one
- [ ] Every limit can be hit and explains what happens next
- [ ] Every AI fallback shows the AI tag and appears in the API drawer
- [ ] No vendor names visible to merchants (Qontak, Claude, Meta, rembg)
- [ ] No marketplace or TikTok data anywhere; marketplace link is refused kindly
- [ ] ID and EN complete on every new screen
- [ ] Shipping screens unchanged (smoke test + a quick click-through)
- [ ] `npm run bundle` single file works offline
- [ ] Guide updated with the demo script; README row v4.0 complete
- [ ] Feedback from AG captured in `docs/prototype/FEEDBACK.md` for the production build
