# FLIK Merchant Dashboard: Shipping prototype

A clickable prototype of FLIK Shipping Phase 1 inside the FLIK merchant dashboard. It is built on Raam's design system and reference dashboard ([raam-flik/flik-design-system](https://github.com/raam-flik/flik-design-system)). Everything in it is example data: no real merchants, shoppers or shipments.

**Open it:** the live link is `https://rzadwicahyo.github.io/flik-merchant-dashboard/` once GitHub Pages is on. You can also download `index.html` and open it in any browser.

## How to use it

The dark bar at the bottom of the screen is for the prototype only, not part of the product.

- **New merchant / Active merchant** switches between a merchant who has never shipped and one with a year of shipments.
- **Events** lists every tracking event the screens fired, with its properties.
- **Guide** is a short list of things to try.

## What to try

| Area | Where | What it shows |
| --- | --- | --- |
| Setup checklist | Home | One checklist at a time for the product you last opened (Shipping, Payments, Funding). Close it with X, then bring it back from Help › Setup guide. |
| Shipping summary | Home, Active merchant | Shipment orders or GMV, COD against non-COD, delivered and return rate, for any period up to 12 months. |
| Explainer | Shipping › Shipments, New merchant | "Ship now, pay after delivery" and how FLIK Shipping works. |
| Create shipment | Shipments › Create shipment › Bulk upload › Your own order export | AI column matching, fixing rows on screen, payment method and pickup address per row, and courier coverage notes. |
| Courier choice | Next step, pick SPX | 3 of 7 rows aren't covered, so FLIK suggests splitting into 4 batches, each on the cheapest courier that covers it. |
| Payment | Last step | Non-COD shipping paid now; COD shipping and fee deducted on delivery. |
| Needs action and alerts | Shipments and the bell, Active merchant | Problems by severity, suggested next steps, alert email previews. |
| Tracking | Shipping › Tracking | Up to 10 tracking numbers at once, with proof of delivery. |
| Red Zone | Shipping › Red Zone | Search a postcode, kelurahan or kecamatan to see each courier's COD and non-COD status (try 80113). |
| Analytics | Analytics › Shipping | Rates, courier performance and the full report download. |

Downloads, emails and courier data are simulated.

## Building it

`index.html` is generated, so don't edit it by hand. The sources in `src/` are applied on top of Raam's reference dashboard:

```sh
git clone https://github.com/raam-flik/flik-design-system ../flik-design-system
cd src && python3 build.py   # writes ../index.html
```

Set `DS=/path/to/flik-design-system` if the design system is cloned somewhere else. Courier logos come from the design system's `assets/Logos/courier` and are embedded in the page.
