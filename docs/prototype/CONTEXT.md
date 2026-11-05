# PROTOTYPE context: Growth Engine v2 + Studio in flik-merchant-dashboard

> **This is the PROTOTYPE doc set.** It is for the clickable mock in `rzadwicahyo/flik-merchant-dashboard` only.
> The production build (FLIK repos, real services, Next.js/Python, database) uses a different doc set that is **not in this repo**. **Never mix the two.** If a production doc and this file disagree, this file wins inside this repo.

`CLAUDE.md` at the repo root points here, so every Claude session loads it.

- Read order for an agent: `CLAUDE.md` → this file → `BUILD_SPEC.md` → `TICKETS.md`. Work one task at a time.
- Product source of truth: Growth Engine v2 + Studio technical spec v4, https://claude.ai/artifact/Fgc4oSpPb9LhJjio8V4XQt. Use it for **product rules only**. Ignore its stack, database and infrastructure sections; they are for production.
- Goal of the prototype: let AG (management) click through the whole story in one sitting and give feedback. Then the feedback goes into the production build in FLIK's repos.
- Last updated: 5 Nov 2026

## 1. What the prototype must show

FLIK is an Indonesian payments company (online checkout, payment links, invoices, order forms, QRIS cashier app, shipping, merchant funding) with about 180 to 200 merchants. The new product helps merchants sell more and brings in new merchants:

- **Studio**: a phone photo of a product becomes professional marketing images with copy. It feels like a gen-AI studio, but phase 1 has no image generation: cut-out + curated scenes + a composer.
- **Competitor monitoring**: what competitors post and sell (Instagram + their own website).
- **Growth Engine**: ideas (a post or a campaign) built from competitors + store performance + big dates; the owner adjusts, executes, and tracks results.

Primary goal: **new merchant acquisition** (a lead uses Studio and a simple competitor check for free, then signs up). Secondary: merchant LTV and FLIK GMV.

The demo story AG must be able to follow (BUILD_SPEC section 2 has the click path):
1. A stranger makes a product image on the public Studio page, sees watermarked previews, signs up to download, and gets a free competitor snapshot.
2. A merchant opens Marketing › Growth Engine, sees ideas for this week, adjusts one, executes it on WhatsApp + Instagram + offline, and later reads the result against the holdout and the owner's WhatsApp report.

## 2. Hard boundaries for this repo

1. **Front-end only.** Plain JavaScript files loaded by `index.html`. No framework, no build step, no npm dependencies, no backend, no database. `npm start` must keep working with nothing installed.
2. **Everything is example data.** No real merchants, shoppers, competitors, phone numbers or Instagram handles. Make up names that are clearly fictional.
3. **No network calls to anything real.** No Claude API, no Meta API, no Qontak, no FLIK API, no Shopify or WooCommerce fetches, no CDN fonts or images. The smoke test blocks outside requests and must pass.
4. **No secrets anywhere.** `config.js` is public. Do not add keys.
5. **Do not touch Shipping.** Leave `shipment.js`, `flow.js`, `monitoring.js`, `checkrate.js`, `analytics.js` and Raam's `index.html` alone. You may change `core.js`, `boot.js`, `data.js`, `home.js` and `app.css` only where a ticket says so.
6. **`app/crm.js` (Growth Engine v1, v3.12) is replaced**, not extended. Keep its good parts (segments by phone, holdout, merchant vs FLIK voucher wording) by porting them; then delete the file and its script tag in the same PR.
7. Must work as one file too: `npm run bundle` inlines everything, so images are inline SVG or generated on a canvas, never separate image files.

## 3. What is real and what is simulated

| Production behaviour | In the prototype |
| --- | --- |
| Background removal (rembg on FLIK servers) | 8 **sample products** drawn as inline SVG with transparent background (already "cut out"). An uploaded photo is accepted, shows the cut-out progress, then uses a soft oval mask on the photo and a note "Prototype: real cut-out runs on FLIK's servers". |
| Scene library (licensed stock photos) | ~12 scenes drawn as SVG/canvas gradients and shapes (marble table, linen, wood, pastel studio, outdoor, festive). No stock photos. |
| Composer (server, layer JSON) | Same layer JSON, rendered in the browser with `<canvas>`. This part is real. |
| Watermarked 540 px previews via signed URLs | Canvas render at 540 px with the tiled FLIK watermark drawn into the pixels before it is shown. No clean image exists in the page until the export step. Right-click "save image" only ever gets the watermarked one. |
| Exports PNG, cut-out PNG, SVG, layered PSD | PNG, cut-out PNG and SVG are real downloads from the canvas/layers. PSD is listed but shows a toast "PSD export is in the production build" (no library allowed). |
| Claude API fallback (vibe < 20% match, copy doesn't fit, own context, unclassified competitor post) | `mockLLM()` returns canned answers after a 1.2 s delay and marks the result with a small "AI" tag. It logs to the API drawer as `llm.fallback` and counts against the limit. |
| WhatsApp OTP (Qontak) | Code is always `123456`. The OTP message appears in a fake phone preview. |
| WhatsApp sends (Qontak, approved templates) | Sends go to an **Outbox** drawer in the prototype bar, rendered as WhatsApp bubbles with the image header. |
| FLIK payment link | A fake payment link sheet with **Mark as paid** that unlocks the export. |
| FLIK ledger (balance debit) | The merchant's example balance goes down and a ledger line appears. |
| Voucher engine | Vouchers live in a JS array; redemptions are generated for the result screen. |
| Orders and shoppers | Example data, seeded and repeatable (use `mkRng`/`hsh` from `core.js`). |
| Instagram Business Discovery, Shopify `/products.json`, WooCommerce Store API | Fixture data per fictional competitor, with a 0.8 s fake load. One fixture fails on purpose to show the friendly fallback state. |
| Nightly jobs (account status, weekly competitor refresh, campaign end) | Buttons in the prototype bar: **Skip 7 days** (moves the demo clock) and **End campaign**. |

## 4. Who sees what

The prototype bar gets an **Account** switch (also `?account=` in the URL):

| `?account=` | Who | Can use |
| --- | --- | --- |
| `anon` | Stranger on the public Studio page | Studio design + watermarked previews. Download/Use opens sign-up. |
| `lead` | Signed up, not a FLIK merchant | Studio (limits for leads) + simplified competitor monitoring: 1 competitor, Instagram only, one-time snapshot. No Growth Engine (shows the "Become a FLIK merchant" card). |
| `new` | FLIK merchant, under 30 days | Everything, with "new" limits. Few orders, so ideas lean on big dates and competitors. |
| `active` (default) | FLIK merchant, Aruna Studio (fashion, online + offline) | Everything. Full competitor monitoring (3 competitors, Instagram + website, weekly), Growth Engine with history. |
| `top` | Top GMV band | Everything, top limits. |

Only the **owner** gets WhatsApp OTPs, notifications and reports. Show the owner as "Dewi (owner)" with a fictional number.

## 5. Product rules (do not break, even in the mock)

1. **No clean image before entitlement.** Only watermarked 540 px previews before export.
2. **Sign-up happens after the design is ready**, on Download or Use: full name, brand name, phone with WhatsApp OTP, category (merchant picks it), optional Instagram or website link, contact consent checkbox.
3. **Rules first, LLM only as fallback** in the four cases in section 3. Every fallback is visible in the API drawer and counted.
4. **No image generation.** Never show "generating with AI" for images. The words on screen are "Designing", "Placing your product", "Matching the light".
5. **Limits are counters per account status** from one `LIMITS` object (BUILD_SPEC section 6). The prototype has a Limits editor in the prototype bar so AG can change values live.
6. **Payment routing:** merchant picks a method. FLIK balance → direct ledger debit. Any other method → FLIK payment link, unlocked when paid. Leads always go to a payment link, but the lead export price is a config value, currently Rp0, so leads download free.
7. **WhatsApp** uses FLIK's pre-approved templates only (12 types × Bahasa/English) with an image header per send. Max 1 marketing message per shopper per 7 days across all campaigns. Respect consent and opt-out.
8. **Competitor sources:** Instagram (Business Discovery) and the competitor's own Shopify or WooCommerce site. **No marketplace scraping (Shopee, Tokopedia, etc.) and no TikTok.** If someone types a marketplace link, say it isn't supported, kindly.
9. **Offline poster only if Offline is a chosen channel.** It carries a normal QR code to a claim page (never a payment QRIS, which can't be printed), and the cashier redeems by the shopper's phone number.
10. **Attribution** by voucher ID, or by holdout group (default 10% gets nothing).
11. **Reports:** CSV download while running; a WhatsApp summary to the owner when the campaign ends. No PDF, no email.
12. **Money words:** "balance", never "credits". Prices as `Rp25.000`. Bahasa Indonesia and English everywhere, switchable.
13. **Never name vendors** a merchant would see: no "Qontak", "Claude", "Meta API", "rembg". Say "FLIK", "WhatsApp", "Instagram".
14. Product catalog is **out of scope** (another team). Products come from the Studio upload; ideas use products seen in orders where they exist and say "from your recent orders".

## 6. Repo map (what exists today)

- `index.html`: Raam's design-system dashboard, vendored by `tools/vendor.mjs`. **Do not edit by hand.** It defines `P` (icons), `ic()`, `NAV`, `VIEWS`, `toast()`, `modal`, `mscrim`, `drawer`, `pop`, `placePop`, `closePop`, `closeModal`, `closeDetail`, `NOW` (demo clock: 14 Oct 2026 16:20), and money/date helpers.
- `config.js`: `window.FLIK_CONFIG = {mode:'mock', apiBase:'/api', googleMapsKey:'', merchantId:'MRC-0007'}`. Leave `mode:'mock'`.
- Script order (end of `index.html`): `config.js`, `app/api.js`, `app/core.js`, `app/data.js`, `app/home.js`, `app/shipment.js`, `app/flow.js`, `app/monitoring.js`, `app/checkrate.js`, `app/analytics.js`, `app/crm.js`, `app/boot.js`.
- `app/api.js`: the data adapter. Screens call `FLIK.api.x()`; `data.js` registers answers with `FLIK.mock('x', fn)`. Every call is logged and shown in the API drawer.
- `app/core.js`: shared helpers (`esc`, `ago`, `normPhone`, `fphone`, `pct`, `sum`, `by`, `plural`, `mkRng`, `hsh`), merchant state `PS`, `track()` events, `dlCsv()` CSV downloads, the prototype bar, sidebar `NAV`, `renderNav`, `go()`.
- `app/boot.js`: the router `show()`: maps the hash to a view id and calls its `renderX()`; reads `?merchant=` and `?products=`.
- New area pattern (copy from `crm.js`): append `<main class="content" id="view-x" hidden></main>` to `.main`, add to `VIEWS`, add to `NAV`, add a `renderX()` call in `show()`.
- Full-screen flows (no sidebar) follow the create-shipment pattern (`#sx` overlay, `openShip`/`closeShip` in `boot.js`).
- `tools/smoke.mjs`: opens each screen headless and fails on page errors. **Add every new screen and account state to its list.**
- `README.md`: version table. Add a row per version (this work is **v4.0** onwards).

## 7. New files this work adds

| File | What it holds |
| --- | --- |
| `app/ge-data.js` | All example data and constants for this work: sample products, scenes, layouts, phrase bank, vibe dictionary, competitors, big-date calendar, WA templates, ideas, limits, ledger, vouchers, outbox. Registers `FLIK.mock(...)` answers. |
| `app/ge-core.js` | Account state `GS`, `LIMITS` + `useLimit()`, `mockLLM()`, `ledgerDebit()`, `paymentLinkSheet()`, `waSend()` + Outbox, `geT()` for i18n, prototype-bar additions. |
| `app/studio.js` | Public Studio page, editor, composer, watermark, sign-up gate, export and payment. |
| `app/compete.js` | Competitor monitoring (lead snapshot + merchant full view). |
| `app/growth.js` | Marketing › Growth Engine v2: ideas, adjust, execute, campaigns, results, reports, settings. Replaces `crm.js`. |
| `app/ge-i18n.js` | `{id:{...}, en:{...}}` strings for every new screen. |
| `docs/prototype/*` | This doc set. |

Load order: `...analytics.js`, `ge-i18n.js`, `ge-data.js`, `ge-core.js`, `studio.js`, `compete.js`, `growth.js`, `boot.js`.

## 8. Coding conventions (match the repo)

- Same style as the existing files: small functions, template strings, `esc()` on every value put in HTML, Raam's classes (`btn btn-p`, `btn btn-o`, `fld`, `mh/mb/mf` modal parts, `ib` icon button, drawer `dh/db`). Use `ic(name, size)` for icons; add new icons to `P` in `ge-core.js`.
- Globals for this work start with `GE`/`ge`/`ST`/`st`/`CP` to avoid clashes with Raam's names.
- `track('event_name', {props})` for every meaningful step (BUILD_SPEC section 8 lists them). No shopper names or phones in props.
- Deterministic: seeded random only. The same URL shows the same screen every time.
- All new user-facing text through `geT('key')`, in `id` and `en`. Default language follows a switch in the prototype bar (default Bahasa Indonesia for Studio's public page, English for the dashboard, like today).
- Accessibility: buttons are `<button>`, images have `alt`, focus is visible, modals close on Escape.
- Desktop 1440 px first; the public Studio page must also work at 390 px phone width.

## 9. Speed feel

Studio must *feel* under 10 seconds from upload to 4 previews. Use staged progress (Upload 0.6 s → Cutting out 1.8 s → Placing 1.2 s → 4 previews appear one by one 0.3 s apart). Never block longer than 5 s in the prototype.

## 10. Working agreement

- One ticket task (or a small group of tasks in one story) per pull request on a branch `proto/<ticket-id>-<slug>`. PR title starts with the ticket id, for example `S2.1 Studio editor`.
- Every PR: `npm test` passes, new screens added to `tools/smoke.mjs`, a screenshot or two in the PR description, README row updated when a version ships.
- Never merge without a human review. Reviewers: Reza (PM and QA, merges), Raam (product design, every UI PR), Rizky (engineering, code structure), Rangga (engineering manager and DevOps, only if hosting or the bundle changes). AG reviews the live demo, not PRs. Yoga (FLIK graphic designer and marketing) gives feedback through Reza.
- If a rule is unclear, write the question in the PR, pick the simplest reading, and keep going.
- GitHub Pages deploys from `main`, so a merge is a release. Keep `main` working.

## 11. Glossary

- **Lead / prospect:** signed up, not a FLIK merchant yet.
- **Variation:** one design option (scene + layout + palette + copy) as layer JSON.
- **Export:** one variation downloaded in all formats; one billing unit.
- **Regenerate:** "Show me 4 more" on the same product; counted per design.
- **Idea:** a recommendation of type `post` or `campaign`.
- **Holdout:** share of a WhatsApp audience (default 10%) that gets nothing, to measure extra sales.
- **Big date:** a calendar moment (11.11, Hari Guru, 12.12, Hari Ibu, Natal, Tahun Baru, Imlek, Ramadan).

## 12. Pointer for `CLAUDE.md` at the repo root

```md
# CLAUDE.md
This repo is a clickable PROTOTYPE (front-end only, example data). Before any work on
Growth Engine v2 or Studio, read docs/prototype/CONTEXT.md, BUILD_SPEC.md and TICKETS.md, in that order.
Do not use any production docs (Next.js, database, real APIs) in this repo.
Do not edit index.html by hand or touch the Shipping files. Run `npm test` before every PR.
```
