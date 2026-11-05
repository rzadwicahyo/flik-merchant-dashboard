# Growth Engine v2 + Studio: prototype docs

These docs are for building the **clickable prototype** in this repo: front-end only, example data, no real APIs. They are what AG reviews the demo against.

The production build (real services, database, cut-out server) lives in FLIK's repos later and has its **own docs, which are not in this repo**. Never bring them in here.

| Read in this order | What it is |
| --- | --- |
| 1. [CONTEXT.md](CONTEXT.md) | Boundaries, what is real vs simulated, product rules, repo map, conventions, working agreement |
| 2. [BUILD_SPEC.md](BUILD_SPEC.md) | Screen by screen: routes, demo script for AG, Studio, competitors, Growth Engine, limits, templates, events |
| 3. [TICKETS.md](TICKETS.md) | P0 foundation, then lanes A Studio · B Competitors · C Growth Engine · D Content, and the QA checklist |

How to start a Claude session on a ticket:

```
Read CLAUDE.md and docs/prototype/ (CONTEXT, BUILD_SPEC, TICKETS).
Work on ticket <id> only. Branch proto/<id>-<slug>. Run npm test. Open a PR with screenshots.
```

Product source of truth: technical spec v4, https://claude.ai/artifact/Fgc4oSpPb9LhJjio8V4XQt (product rules only; ignore its stack and infrastructure sections here).
