# FLIK Merchant Dashboard: Shipping prototype (v3)

A clickable prototype of FLIK Shipping Phase 1 inside the FLIK merchant dashboard, built on Raam's design system and reference dashboard ([raam-flik/flik-design-system](https://github.com/raam-flik/flik-design-system)). Everything in it is example data: no real merchants, shoppers or shipments.

**Live:** https://rzadwicahyo.github.io/flik-merchant-dashboard/

## Run it on your machine

You need Node.js 18 or newer. There is nothing to install.

```bash
git clone https://github.com/rzadwicahyo/flik-merchant-dashboard.git
cd flik-merchant-dashboard
npm start
```

Open http://localhost:5173. Use `PORT=8080 npm start` for another port.

| Command | What it does |
| --- | --- |
| `npm start` | Serves the prototype, and forwards `/api/*` to FLIK's API when `.env` is set (see below). |
| `npm run bundle` | Writes `dist/flik-shipping-prototype.html`, one file that opens by double-click, with no server. |
| `npm test` | Opens every screen in a headless browser and fails on any page error. Needs Playwright: `npm i -D playwright && npx playwright install chromium`. |
| `npm run vendor` | Rebuilds `index.html` from Raam's repo checked out next to this one (`DS=path/to/flik-design-system` to point elsewhere). |

## Connecting FLIK's API

The page asks for data through one adapter (`app/api.js`). By default it answers from the example data. To call FLIK's API instead:

1. `cp .env.example .env`, then fill in `FLIK_API_BASE` and `FLIK_API_KEY`.
2. Set `mode: 'api'` in `config.js`.
3. `npm start`.

The key stays in `.env` on the server; the browser never sees it. Endpoints, payloads and the payment rules are in [docs/API.md](docs/API.md).

## The prototype bar

The dark bar at the bottom is for the prototype only, not part of the product.

- **New to Shipping / Active shipper** switches between a merchant who has never shipped and one with six months of shipments.
- **Products** sets which FLIK products the merchant uses (Shipping only, Payments + Shipping, or all three), which changes the Home widgets and the menu.
- **Guide** lists things to try. **Events** shows every tracking event the screens fired. **API** shows each data call and whether example data or FLIK's API answered it.

You can also open a state directly: `?merchant=new`, `?products=pay`, `?products=ship`, `?products=payship` or `?products=all`.

## What's in v3 (v3.1 to v3.5)

| Area | What to try |
| --- | --- |
| Home | Up to two compact widgets side by side: Payments first, then Shipping. Shipping shows COD and non-COD as two area lines with ±% against the previous period. A merchant counts as Payments until their first transaction tags them. Quick access lives in the **+** menu; the setup checklist lives on Shipment, not Home. |
| Shipping › Shipment | A new merchant sees the explainer and setup checklist. An active shipper goes straight to Create shipment, with the sidebar still visible. |
| Create shipment (v3.5) | Raam's v4 flow from the design system (Details, Courier, Pickup, Summary, Payment), unchanged except for the 24 Oct decisions in `app/flow.js`: **one batch = one warehouse + one courier service**; Risky COD orders open Raam's check (Confirm on WhatsApp, Payment link, Ship anyway, Remove), where a number without WhatsApp has to be shipped or removed; the WhatsApp preview comes from FLIK on behalf of the store, and the wording can be edited with {{variables}}; the score also counts the order value and an address without a house number; orders the chosen courier can't take start on the courier that delivers best there. Booked orders go to Monitoring, and waiting orders to **Waiting for the shopper**, where they are booked automatically when the shopper confirms or pays. |
| AG round (v3.7) | **Home** leads with Today (what to do, with links) and Yesterday (what happened, in words), written from rules. **Monitoring** statuses follow the courier's SLA for the route (Safe, On track, Delayed, At risk, Problem); Needs resolving lists issues with no ticket yet, grouped by status, with SLA and age; every action opens a ticket; Tickets are grouped by status; Claims are the Problem tickets. Risky shoppers who confirm are booked with an AWB; the rest wait until the merchant ships or cancels. **Create shipment**: phone and product autofill from Customers and Product catalog, the batch split is explained, a final file can be downloaded, risky orders can be left to decide later, and suggestions don't say AI. **WhatsApp**: VIP only, 50 checks a day, one resend, a pause above 20% "didn't order", and Delivery Boost after a failed attempt (prices are defaults waiting on Reza). **Analytics**: What to learn is written once a day and marked with a bolt. No Qontak name anywhere a merchant sees. |
| Claims (v3.8) | Claims follow AG's case workspace spec (26 Oct): one claim per AWB, **Lost** or **Damaged** only (return-fee waivers are not claims). The merchant reports the parcel; FLIK files the claim with the courier. Statuses: Collecting evidence, Filed, Accepted or Partly accepted or Rejected, Paid. The claim amount is the lower of the goods value and the courier's cap (10× FLIK's fee by default; the fee itself is never shown). Each courier has its own filing days, so the merchant sees a deadline for the invoice, photos and unboxing video. Plain lines on the claim and the shipment say what's happening; money is credited only after the courier pays. A return stuck in transit past its SLA + 3 days opens a Lost case automatically. |
| Issue types (v3.9) | Every issue has a type as **Group / Type** (AG, 27 Oct), shown in Needs resolving, Tickets, the shipment and the exports, with a filter by group or type. Pickup: Late, Failed. Delivery delayed: No update, Past SLA. Delivery failed: Customer not available, Address problem, Customer rejected, Customer didn't order, Customer asked to reschedule, Courier issue. Return: In progress, Without confirmation, Stuck. Parcel problem: Lost, Damaged. Most come from the courier's status and reason code; Late pickup, No update and Past SLA come from FLIK's clock against the SLA. A ticket keeps the type it was opened with. |
| Tracking (v3.10) | Issue type is also a column in the Summary batch lists, All shipments and the shipment export. Clicking any shipment opens it as a tracking page: progress from Booked to Delivered (or the return path), the courier's estimate, the last update, copy AWB, a tracking link for the shopper and Print label. Proof of delivery, of a failed attempt or of the return shows the courier's photo (an example drawing here), who received it, the time, the distance from the address and the signature. |
| Payment | Published rate − FLIK discount + 3% COD fee + platform fee. Non-COD is paid now from the balance; COD is deducted on delivery or return. |
| Shipping › Monitoring | Batches, a Needs resolving queue sorted by severity (Open, Acknowledged, Resolved), health, courier performance by city or service, and all shipments. **Claims** has a summary and every claim (lost or damaged, returned without confirmation, and over SLA, which is AnterAja only for now) with its status log. **Tickets** open to their details and status log; the link to FLIK's ticketing platform comes later. Every section exports. |
| Failed deliveries (v3.4) | Needs resolving has a failed-delivery queue split into **Needs your input** and **Critical**, with a **Reattempt** action (house number, other phone, ask the shopper on WhatsApp) or return. |
| Tickets as chat (v3.2) | Opening a ticket opens a chat with FLIK support and the courier team, with the status log underneath. FLIK and 3PL teams answer from the ticketing platform. |
| Claim cases (v3.2) | **File a claim** checks what the parcel qualifies for: lost or damaged, returned without confirmation, or over SLA (AnterAja only), with the reason when it doesn't. |
| Date filter (v3.2) | Monitoring can show Today, Yesterday, 7, 30 or 90 days, or all time. |
| Shipping › Check rate | Any warehouse to any destination: published and discounted rate, delivery success, and red zones. |
| Shipping › Analytics | One compact grid: trends, findings, COD against non-COD, return reasons, COD by shopper score, the courier scorecard and top destinations. Payments analytics sits under Payments. |
| Pickup addresses | In the account menu (top left). |
| Template | `assets/templates/Template_FLIK_Shipping.xlsx` now has **Metode Pembayaran** and **Jumlah Produk**. |

## Defaults chosen for the prototype

- Platform fee: Rp1.000 per shipment.
- The bulk upload uses Raam's built-in example file instead of reading a real spreadsheet, so the column matching from v3 is not in this version.
- The map is a built-in preview. A Google Maps key slot is reserved in `config.js`.
- Shopper score and area success rates are example data. Legal still has to confirm the use of phone history.

## How the code is laid out

- `index.html` is Raam's dashboard, copied unchanged by `tools/vendor.mjs` apart from the title, logo paths, the script tags below, and a few patches to the create flow for the 24 Oct decisions (batches per warehouse and courier service, and the wording for "delivered").
- `app/*.js` load after it, in order: `api.js` (data adapter), `core.js` (navigation, prototype bar, shared helpers), `data.js` (example data and rules), then one file per area, and `boot.js` (router and start-up). `app/app.css` holds the added styles.
- `config.js` is public settings. Never put a secret in it.
- `scripts/serve.mjs` is the local server and API proxy, with no dependencies.
