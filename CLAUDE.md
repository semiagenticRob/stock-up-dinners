# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

Stock Up Dinners is mid-pivot from an Expo / React Native + Astro static site to a **Next.js 14 web PWA** with paid Stripe subscription, lot-based pantry tracking, FIFO consumption, and (post-launch) receipt OCR.

Authoritative product spec: **`docs/specs/2026-04-30-v2-web-rebuild-spec.md`** (ATAT v1.0, "Approved for build"). Read it before making non-trivial product or architecture decisions. The build plan that operationalizes the spec lives at `~/.claude/plans/lazy-watching-stallman.md` (outside the repo).

## Branches

- `main` — last v1 commit is tagged `v1-rn-archive`. Through the cutover at the end of the rebuild, `main` is otherwise *frozen* — the GitHub Pages Astro deploy that used to live there has been removed on the rebuild branch only, and **`main` should not receive new commits during the rebuild**. The marketing site at stockupdinners.com is currently dark or running off the v1 tag's last successful deploy until the new Next.js marketing pages ship.
- `v2-nextjs-rebuild` — the active development branch. All new work happens here. Merges to `main` only at cutover (Phase 6 in the plan).

## Repo state during the rebuild

Right now (Phase 1 of the plan complete) the repo is in a **transitional state** — there is no Next.js scaffold yet. Current top-level layout:

```
/stock-up-dinners
├── content/           # Versioned catalog (JSON, source of truth for the v2 product)
│   ├── ingredients.json         # 75 Costco staples, extracted from v1 SQL seeds
│   ├── recipes.json             # 14 cycle-1 dinners (need to grow to 48)
│   ├── skus.json                # empty stub — Phase 2 content work
│   ├── substitution_groups.json # empty stub — Phase 2 content work
│   └── starter-pack.json        # empty stub — Phase 2 content work
├── docs/
│   ├── specs/         # Authoritative specs (the ATAT v1.0 spec lives here)
│   ├── archive/       # Pre-pivot specs/plans, kept for reference, not authoritative
│   ├── marketing/     # Landing copy, FLUX image prompts, channel-specific posts
│   ├── launch/        # Beehiiv setup, free PDF content, paid-plan recipe drafts
│   ├── design/        # Brand brief (canva-brand-brief.md), .pen files
│   └── assets/        # Source/working photography (33 files)
├── lib/
│   └── utm.ts         # Salvaged UTM-extraction logic, framework-agnostic
├── public/            # Production static assets ready for the Next.js scaffold
│   ├── images/        # 4 hero shots + 8 numbered meal thumbnails
│   ├── og-default.png
│   ├── favicon.svg
│   └── robots.txt
├── tests/
│   ├── unit/          # utm.test.ts (passes as-is)
│   └── e2e/           # smoke + signup specs from the Astro era; need rewriting
├── _legacy/           # Reference-only material from v1 — don't import from here
│   ├── marketing-copy/      # 6 .astro pages whose copy ports verbatim
│   ├── components/          # 10 .astro components to port to React
│   ├── layouts/             # PageShell.astro (UTM-injection pattern)
│   ├── styles/global.css    # Design tokens to lift into Tailwind config
│   ├── scripts/analytics.ts # GA4 wiring to re-implement
│   ├── utils-rn/            # Old unit-conversion helpers + tests
│   ├── constants-rn/        # Category labels, color tokens
│   └── config/              # Old playwright.config.ts
├── scripts/
│   └── extract-seed-to-content.mjs   # One-shot v1 SQL → v2 JSON converter
├── supabase/seed/     # v1 SQL seeds, still here as the original source of truth
├── PLAN.md            # v1 launch plan + 75-item Costco list. Mostly historical now;
│                      #   the staple list is preserved as the constraint set
└── CLAUDE.md          # this file
```

There is **no `package.json`, `node_modules`, or build tooling at the root yet** — that all comes back when the Next.js scaffold lands in Phase 3 (`npx create-next-app@latest .`). Phase 2 (content curation) and Phase 3 (scaffolding) can run in parallel.

## What we're building toward

After Phase 3 completes, the repo structure will match the spec's §3:

```
/stock-up-dinners
├── app/                    # Next.js App Router
│   ├── (marketing)/        # / , /about , /pricing , /privacy , /terms , /thanks
│   ├── (auth)/             # /login , /signup , /forgot-password
│   ├── (app)/              # subscription-gated: /pantry , /recipes , /shopping ,
│   │                       #   /shopping-list , /scan , /settings , /onboarding
│   └── api/                # route handlers (zod-validated)
├── components/             # shadcn/ui + feature components
├── lib/
│   ├── matching/engine.ts          # recipe matcher (spec §6.1)
│   ├── pantry/decrement.ts         # FIFO consumption (spec §6.2)
│   ├── shopping-list/compute.ts    # par + threshold (spec §6.3)
│   ├── supabase/                   # @supabase/ssr clients
│   └── utm.ts                      # already in place
├── supabase/migrations/    # 0001_v2_initial.sql replaces v1 entirely
├── content/                # JSON catalog → seeded into Postgres via scripts/seed.ts
├── tests/
└── middleware.ts           # auth + subscription gating for (app)/*
```

When this scaffold exists, **CLAUDE.md should be rewritten again** to describe the live architecture rather than the transitional state.

## Conventions (forward-looking, from the spec)

- All money in cents (integer).
- All timestamps UTC `timestamptz`.
- All weights in grams (integer); display layer converts to lbs/oz.
- All volumes in milliliters (integer); display layer converts to cups/tsp/tbsp.
- All counts as integers.
- IDs are UUIDs (Supabase default).
- Server-side authorization on every mutation; never trust client claims.
- Every API request body validated with `zod`; every response typed end-to-end.

## Working-tree hygiene

- **Stage explicitly by path**, not `git add -A` / `git add .`. The repo currently mixes salvaged content, archived references, and (soon) live application code; over-broad staging will pull in working artifacts.
- **Conventional-commit prefixes:** `feat:`, `fix:`, `chore:`, `docs:`, `content:`, `refactor:`. No `(web)` scope anymore — that was a v1 affordance for the two-project layout.
- **Author identity:** commits in this repo must be authored as `semiagenticrob <rbrt.s.wrrn@gmail.com>`. Use `git -c user.name='semiagenticrob' -c user.email='rbrt.s.wrrn@gmail.com' commit ...` rather than relying on shell config.
- **Loose screenshots/PNGs at the repo root** are working artifacts — move them under `docs/assets/screenshots/` or delete them. Never ship them from there into `public/images/`.

## Catalog data

The v2 source of truth is `content/*.json`. The `_v1_legacy` field on each ingredient and recipe ingredient preserves the original v1 SQL row data so that Phase 2 curation work has full context:

- For ingredients: `package_size`, `package_unit`, `is_perishable`, `shopping_aisle`, original `notes`.
- For recipe ingredients: original `quantity_per_serving` and `default_unit` before unit conversion.

These fields exist for human curation only — the seed script in Phase 3 will read the canonical fields and ignore `_v1_legacy`.

To re-derive the JSON from the original SQL (e.g. if a transformation rule needs adjusting), run:

```bash
node scripts/extract-seed-to-content.mjs
```

The script is idempotent and overwrites `content/*.json` from `supabase/seed/*.sql`.

## Phase 2 curation needs

The catalog isn't ready for the matching engine until these gaps are filled (owner: solo founder; not a contractor task):

- **Allergen + dietary tags** on ingredients (`allergen_tags: []`, `dietary_tags: []`).
- **`default_par`** on ingredients (canonical-unit quantities for shopping-list threshold math).
- **`is_assumed_staple`** flagging on salt, pepper, oils, garlic powder.
- **`shelf_life_{pantry,fridge,freezer}_days`** values where the v1 data only had one column.
- **Substitution groups** in `content/substitution_groups.json` + `substitution_group_slug` references on ingredients.
- **`allow_substitution: false`** on recipe ingredients where the recipe truly needs the exact ingredient (e.g. salmon dishes shouldn't accept tuna).
- **`display_quantity`** strings on recipe ingredients (e.g. `"1.5 lb"` for the 680g chicken breast quantity).
- **`hero_image_url`** on recipes, linking to `public/images/meals/NN-*.jpg`.
- **75–100 SKU entries** in `content/skus.json` with `receipt_aliases` harvested from a real Costco receipt.
- **Starter pack** — greedy set-cover analysis to pick the 25–30 SKUs that unlock the most recipes.

Recipe count needs to grow from 14 to 48; sources for the additional 34 are `docs/launch/paid-pdf-plan2.md` (14 ready) + `docs/launch/paid-pdf-plan3.md` (partial) + new curation.

## Out of scope for v1

The spec defers these explicitly. Don't volunteer to build them:

- Native iOS/Android apps.
- Household / multi-user shared pantries.
- User-submitted recipes.
- Predictive consumption modeling.
- Crowdsourced SKU catalog expansion.
- Social features.
- Receipt OCR is **deferred to v1.1** (post-launch) per build-plan scope decisions, even though it's in the spec.
