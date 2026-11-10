# Smart courier service

FLIK's smart courier service: turns a merchant's order file into bookable rows and courier picks. Its only caller is the merchant dashboard BE, on FLIK's internal network, with a service token.

Specs: the service build spec and the engine spec (stage rules) in the FLIK Shipping project.

## Stages

| Stage | Module | What it does |
| --- | --- | --- |
| 1 | `src/domain/map.ts`, `normalise.ts` | Map any file's columns onto FLIK's template: saved mapping, known export, synonyms, value patterns, then the LLM (off by default) |
| 2 | `src/domain/address.ts`, `validate.ts` | Swapped area fields, approximate spelling, postcode lookup, warehouse, phone, house number, weight, COD amount, duplicates; dropdown options; fix all |
| 3 | `src/domain/score.ts` | Health score from shopper and address history, pulled toward the area rate (prior weight 3, 60/40). COD orders below Safe go to the Risky COD dialog |
| 5 | `src/domain/redzone.ts` | Courier COD and coverage red zones by postcode or kecamatan; soft zones from history only warn |
| 4 | `src/domain/rank.ts` | Delivery rate per service (kecamatan, then city, then global), the recommendation, per-order courier, one batch per service with a pickup per warehouse |
| All | `src/domain/finalfile.ts` | The final CSV and the differences from the uploaded file |

Every stage is a pure function over its input and a `RefData` snapshot, so the tests need no database. No stage after 2 calls an LLM; `src/domain/llm.ts` is the only door to one, and it redacts phone numbers, times out after 3 seconds and caps calls per request.

## API (internal)

`POST /internal/v1/map`, `/validate`, `/options`, `/fix-all`, `/shopper-score`, `/recommendations`, `/final-file`; `GET /internal/v1/health`. Up to 500 rows per request.

## Run

```
npm ci
npm test            # unit and API tests
npm run coverage    # with the 90% line threshold on src/domain
npm run build && SMART_COURIER_TOKEN=… PHONE_HASH_SALT=… npm start
```

## Not built yet

- PostgreSQL tables and the daily refresh job (rates, COD history by hashed phone and address, red zones from courier lists)
- Loading the address dictionary
- A real LLM provider behind `LlmAdapter` (waits on Legal)
