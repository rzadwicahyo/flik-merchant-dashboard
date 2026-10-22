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

You can also open a state directly: `?merchant=new`, `?products=ship`, `?products=payship` or `?products=all`.

## What's in v3

| Area | What to try |
| --- | --- |
| Home | Up to two widgets: Payments first, then Shipping. Each has a trend line against the previous period. Quick access lives in the **+** menu. |
| Shipping › Shipment | A new merchant sees the explainer and setup checklist. An active shipper goes straight to Create shipment, with the sidebar still visible. |
| Manual entry | Product quantity, pickup warehouse and COD or non-COD per shipment, and an address pin on a map preview. |
| Bulk upload | Upload either example file. Your own file goes through column matching; then **Fix with AI** cleans duplicates, missing fields, swapped fields, phone formats and weights, and fills kelurahan and postcode. Each shopper gets a score (Beta). |
| Courier | FLIK recommends the courier with the best delivery rate in the shoppers' kecamatan, falling back to the city. Picking a courier with red-zone parcels offers a split. |
| Payment | Published rate − FLIK discount + 3% COD fee + platform fee. Non-COD is paid now from the balance; COD is deducted on delivery or return. |
| Shipping › Monitoring | Batches, a Needs resolving queue sorted by severity (Open, Acknowledged, Resolved), health, courier performance by city or service, all shipments, and tickets (through Qontak). Every section exports. |
| Shipping › Check rate | Any warehouse to any destination: published and discounted rate, delivery success, and red zones. |
| Analytics › Shipping | Trends, COD against non-COD, return reasons, the courier scorecard, top destinations and COD by shopper score. |
| Pickup addresses | In the account menu (top left). |
| Template | `assets/templates/Template_FLIK_Shipping.xlsx` now has **Metode Pembayaran** and **Jumlah Produk**. |

## Defaults chosen for the prototype

- Platform fee: Rp1.000 per shipment.
- The bulk upload uses two built-in example files instead of reading a real spreadsheet.
- The map is a built-in preview. A Google Maps key slot is reserved in `config.js`.
- Shopper score and area success rates are example data. Legal still has to confirm the use of phone history.

## How the code is laid out

- `index.html` is Raam's dashboard, copied unchanged by `tools/vendor.mjs` apart from the title, logo paths and the script tags below.
- `app/*.js` load after it, in order: `api.js` (data adapter), `core.js` (navigation, prototype bar, shared helpers), `data.js` (example data and rules), then one file per area, and `boot.js` (router and start-up). `app/app.css` holds the added styles.
- `config.js` is public settings. Never put a secret in it.
- `scripts/serve.mjs` is the local server and API proxy, with no dependencies.
