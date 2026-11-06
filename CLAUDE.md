# CLAUDE.md

This repo is a clickable PROTOTYPE of the FLIK merchant dashboard (front-end only, example data).

- Before any work on Growth Engine v2 or Studio, read `docs/prototype/CONTEXT.md`, `BUILD_SPEC.md` and `TICKETS.md`, in that order.
- Do not use any production docs (Next.js, database, real APIs, real keys) in this repo.
- Do not edit `index.html` by hand (it is vendored from Raam's design system) and do not touch the Shipping files.
- No dependencies, no build step, no secrets in `config.js`. No network calls to real services, except the free, public, keyless sources in `docs/prototype/CONTEXT.md` section 2.3, always with example data as the fallback.
- Run `npm test` before every PR and add new screens to `tools/smoke.mjs`.
