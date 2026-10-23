# FLIK API hook-up

The prototype runs on example data. It is wired so FLIK's API can replace that data one call at a time, without changing the screens.

## How a call travels

```
screen ──► FLIK.api.rates(q)            app/api.js
              │
              ├─ mode 'mock' ──► example answer registered in app/data.js (FLIK.mock)
              │
              └─ mode 'api'  ──► POST /api/v1/shipping/rates           (browser, no key)
                                   │
                                   ▼
                                scripts/serve.mjs adds  Authorization: Bearer $FLIK_API_KEY
                                   │
                                   ▼
                                $FLIK_API_BASE/v1/shipping/rates       (FLIK)
```

- The secret key lives only in `.env` on the machine running `npm start`. It is never in the page, in `config.js` or in git.
- Every request also carries `x-merchant-id` from `config.js`.
- If the API call fails, the screen falls back to the example answer, and the **API** drawer in the prototype bar shows which source answered each call.
- GitHub Pages and the single-file build have no server, so they always use example data.

## Switching on

1. `cp .env.example .env`, then set `FLIK_API_BASE` (the host, without `/v1`) and `FLIK_API_KEY`.
2. In `config.js`, set `mode: 'api'`.
3. `npm start` and open http://localhost:5173. `GET /__flik/status` returns `{"api":true}` when the server has both values.

## Endpoints

Paths are relative to `FLIK_API_BASE`. Field names follow the example answers in `app/data.js`; they are a proposal for FLIK's engineering team to confirm, not an agreed contract.

| Call | Method and path | Used by | Request | Response |
| --- | --- | --- | --- | --- |
| `merchant` | `GET /v1/merchant` | Start-up | none | `{id, name, products, verified}` |
| `pickupAddresses` | `GET /v1/shipping/pickup-addresses` | Pickup addresses | none | `[{code, n, street, dist, city, prov, zip, pic, days, active}]` |
| `rates` | `POST /v1/shipping/rates` | Check rate | `{from: warehouseCode, to: area, kg}` | `[{courier, service, group, pub, net, disc, eta, sr, level, n, redZone}]` |
| `recommend` | `POST /v1/shipping/recommendations` | Create shipment, Courier step (local logic today) | `{ships: [{area, pay, kg, origin}], group}` | `{list: [{i, k, sr, net, pub, red}], best, cheap}` |
| `shopperScore` | `POST /v1/shipping/shopper-score` | Create shipment (local logic today) | `{phone, area}` | `{score, band, why}` |
| `validateRows` | `POST /v1/shipping/bulk/validate` | Bulk upload (local logic today) | `{rows: [...], mapping}` | `{rows: [{status, issues, suggestions}]}` |
| `createShipments` | `POST /v1/shipping/shipments` | Create shipment, Pay and book | see below | `{batches: [{id, awbs}]}` |
| `shipments` | `GET /v1/shipping/shipments?from=&to=&status=` | Monitoring (local data today) | query string | `[shipment]` |
| `tracking` | `GET /v1/shipping/tracking?awb=A,B` | Monitoring drawer (local data today) | AWB list | `[{awb, status, events}]` |
| `createTicket` | `POST /v1/support/tickets` | Monitoring, Take action | `{awb, type: claim\|support\|customer, reason, note}` | `{id, status}` |
| `verifyShopper` | `POST /v1/shipping/shopper-verifications` | Create shipment, held Risky parcels | `{batch, shipment, phone, channel: "whatsapp", expires_h: 24}` | `{id, status: sent}` |
| `ticketMessages` (proposed) | `GET/POST /v1/support/tickets/{id}/messages` | Ticket chat | `{text, files}` | `[{from: merchant\|flik\|courier\|system, name, text, at}]` |
| `geocode` | `POST /v1/maps/geocode` | Address search, Check rate | `{query}` | `[{kel, kec, city, prov, zip, lat, lng}]` |

`area` objects are `{kel, kec, city, prov, zip}`. Money is in rupiah, as integers. Rates are per parcel: `pub` is the courier's published price, `net` is what FLIK charges, `disc = pub − net`.

### createShipments request

One batch per pickup, meaning one warehouse with one courier service.

```json
{
  "pickup": { "date": "2026-10-23", "slot": "09:00–12:00" },
  "batches": [{
    "ref": "B-261022-065",
    "warehouse": "JKT-01",
    "courier": "jne",
    "service": "Regular",
    "shipments": [{
      "recipient": { "name": "…", "phone": "628…", "street": "…", "kelurahan": "…", "kecamatan": "…",
                     "city": "…", "province": "…", "postcode": "…", "pin": { "lat": -6.9, "lng": 107.6 } },
      "items": "Linen shirt · White", "qty": 2, "weight_kg": 1, "dims_cm": [0, 0, 0],
      "payment": "COD", "cod_amount": 578000, "item_value": 578000
    }]
  }]
}
```

### Payment rules the screens apply

- Shipping charged = published rate − FLIK discount.
- COD fee = 3% of the COD amount, for every courier.
- Platform fee = Rp1.000 per shipment (a prototype default to confirm).
- Non-COD: shipping and platform fee are paid from the FLIK balance when booking.
- COD: shipping, COD fee and platform fee are deducted from the COD when the parcel is delivered, or from the balance if it is returned.

### WhatsApp check for Risky shoppers

1. The merchant books; parcels held for a check are sent to `verifyShopper`, not to `createShipments`.
2. FLIK sends the WhatsApp message (through Qontak) and waits up to 24 hours.
3. On **YA**, FLIK's server marks the phone verified (shopper score +28) and creates the shipment itself in the next pickup, then sends a `shipment.created` webhook. The screen does not need to be open.
4. On **BATAL** or no reply, the parcel is cancelled and nothing is charged.

### Claim rules the screens apply

- Lost or damaged: courier reported it lost or damaged, damage reported within 2 days of delivery, or no tracking update for 7 days.
- Returned without confirmation: the parcel came back and no ticket asked to return it.
- Over SLA: delivered later than promised. AnterAja only for now.
- One open claim per shipment.

## Open items

- Shopper score uses a phone number's delivery history. Legal has to confirm this before it uses real data.
- The Google Maps key in `config.js` is reserved. The prototype shows a built-in map preview.
- Tickets are meant to go through Qontak (FLIK already uses it) or FLIK's own ticketing tool. `createTicket` is the single place to connect either.
- WhatsApp checks to shoppers need the consent wording confirmed by legal.
