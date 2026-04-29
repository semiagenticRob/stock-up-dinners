# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Stock Up Dinners is a Costco-anchored dinner meal-plan product. The repo holds **two independent npm projects** that share a git remote and nothing else:

- **Repo root** — Expo / React Native app (iOS-first), the product.
- **`web/`** — Astro static marketing site at [stockupdinners.com](https://stockupdinners.com), the acquisition funnel.

They do **not** share dependencies, build tooling, backend, or CI workflows. When making changes, stay inside one project at a time and only stage files from that project — see "Working-tree hygiene" below.

`PLAN.md` holds the product plan, launch checklist, and the canonical 75-item Costco staple list that the data model (and meal generation) is constrained to.

---

## React Native app (repo root)

### Commands

```bash
npm start              # Expo dev server
npm run ios            # Run on iOS simulator (dev client)
npm run android
npm run web
npm test               # Jest
npx jest path/to/file  # Single test file
npm run typecheck      # tsc --noEmit
```

`jest.config.js` roots only `utils/` — tests outside `utils/__tests__` will not be discovered. Add new roots to the config before placing tests elsewhere.

Native builds use EAS (`eas.json`): `development`, `development-simulator`, `preview`, `production`. A dev client is required (not Expo Go) because of native modules (WatermelonDB, RevenueCat, SecureStore).

Env vars (`EXPO_PUBLIC_*`, read in `lib/supabase.ts`): `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`. RevenueCat keys are read in `providers/RevenueCatProvider.tsx`.

### Architecture

**Offline-first with bidirectional sync.** The app reads/writes locally against WatermelonDB and syncs to Supabase Postgres in the background. Nothing in the UI should call Supabase directly for user data — go through WatermelonDB via the hooks in `hooks/`.

Layers, top-down:

- `app/` — expo-router file-based routes. Groups: `(auth)` (welcome, paywall), `(onboarding)`, `(tabs)` (index/home, cook, inventory, shopping, settings), plus `meal/[id]`. `app/_layout.tsx` mounts `AuthProvider` → `RevenueCatProvider` and runs the auth-gate redirect. Note `__DEV__` bypasses the auth gate and starts on `(tabs)` — remove before shipping.
- `providers/` — `AuthProvider` (Supabase auth + SecureStore session), `RevenueCatProvider` (entitlement gating for paywall), `DatabaseProvider` (wraps WatermelonDB, triggers `sync()` on auth and on AppState → active).
- `db/` — WatermelonDB. `schema.ts` defines 7 tables split into **seed tables** (`ingredients`, `meals`, `meal_ingredients` — pull-only from server) and **user-owned tables** (`user_inventory`, `shopping_lists`, `shopping_list_items`, `cook_log` — bidirectional). `db/models/` has one class per table. `db/sync.ts` implements the `synchronize()` pull/push.
- `hooks/` — `useIngredients`, `useMeals`, `useInventory`, `useShoppingList`, `useCookLog`. These are the intended data access surface for screens.
- `components/` — currently only platform-split helpers (`useColorScheme`, `useClientOnlyValue`). No shared feature UI lives here yet; screens compose inline.
- `lib/supabase.ts` — single Supabase client using the SecureStore adapter for session persistence.
- `supabase/migrations/001_initial_schema.sql` + `supabase/full_setup.sql` + `supabase/seed/` — server schema and seed data. RLS is on user-owned tables; seed tables are globally readable.

**Sync contract** (`db/sync.ts`) — critical details when changing the schema or adding tables:
- Seed tables are always pulled as `updated` after first sync (no deletes, no pushes).
- User tables are filtered by `user_id` on pull. `shopping_list_items` is filtered indirectly by joining to the user's `shopping_lists`.
- Timestamp columns are **ms numbers in WatermelonDB, ISO strings in Supabase**. `mapSupabaseToWatermelon` / `mapWatermelonToSupabase` handle the conversion for `purchased_at`, `updated_at`, `created_at`, `cooked_at`, `checked_at`. Any new timestamp column must be added to both mappers.
- `meals.instructions` is JSON in Postgres but stored as a stringified column in WatermelonDB — parse at the model/hook layer.
- `migrationsEnabledAtVersion: 1`: bumping `schema.version` requires a migration file and bumping this anchor appropriately.

**Paths.** `@/*` is aliased to repo root (`tsconfig.json`). Prefer it over relative imports.

### Data model invariants

- The Costco staple ingredient list in `PLAN.md` is the **constraint set** for all meal generation — meals may only reference ingredients from that list. Seed data in `supabase/seed/` must stay consistent with it.
- `meals.cycle` + `meals.meal_number` encode position in the 14-dinner bi-weekly plan; `is_active` gates what the app shows.

---

## Marketing site (`web/`)

A separate Astro project — own `package.json`, `node_modules`, lockfile, and CI workflow. Always `cd web` first.

### Commands

```bash
cd web
npm run dev            # Astro dev server on http://localhost:4321
npm run build          # Production build into web/dist/
npm run preview        # Serve the built dist/ locally
npm run typecheck      # astro check (TS + template)
npm run test           # Vitest (utm logic, etc.)
npm run test:e2e       # Playwright (routes, OG, signup redirect)
```

### Deploy contract

`.github/workflows/deploy-web.yml` deploys to GitHub Pages on push to `main` **path-filtered to `web/**`**. Commits touching only RN-app files do not trigger a deploy, and vice versa. The workflow runs `typecheck` + `test` before building, then publishes `web/dist/`.

Build-time env vars are public (baked into the bundle):
- `PUBLIC_GA4_MEASUREMENT_ID` — set as a GitHub repo secret of the same name; the workflow injects it.

Custom domain `stockupdinners.com` is wired via `web/public/CNAME` + DNS A records to GitHub Pages IPs.

### Signup contract

The "Get the free plan" CTA **redirects** the visitor to `https://stockupdinners.beehiiv.com/subscribe`. The site does **not** call Beehiiv's API directly — there is no fetch, no API key, no client-side form submit logic to worry about. UTM parameters present on the inbound URL at click time are appended to the redirect so attribution flows into Beehiiv. The PDF and welcome email sequence are configured inside Beehiiv, not in this repo.

### Brand system

The visual system is "Pragmatic / Tool-Feel" — restraint over flourish. Tokens live as CSS custom properties in `web/src/styles/global.css`:

- `--c-accent` `#DC2626` (crimson) — wordmark mark, eyebrow labels, primary CTA, key link underlines. Used sparingly.
- `--c-ink` `#0F172A`, `--c-body` `#334155`, `--c-muted` `#64748B`, `--c-border` `#E2E8F0`, `--c-bg-tint` `#F8FAFC`.
- Inter (display + body) and JetBrains Mono (indices, eyebrow labels, meal-grid chips) via `@fontsource/*` — no Google Fonts CDN.

The complete spec — type scale, layout primitives, component inventory, homepage structure — lives in `docs/superpowers/specs/2026-04-28-marketing-site-and-acquisition-design.md`.

### Image conventions

Production images live under `web/public/images/`. Source/working images live under `docs/assets/`. Don't ship anything from `docs/assets/` directly — copy into `web/public/images/` (resized to ~1280px max via `sips -Z 1280 -s formatOptions 80`) so the production bundle stays small.

- `web/public/images/meals/NN-slug.jpg` — 256×256 overhead-style meal thumbnails referenced by `MealGridPreview.astro`. Numbering matches the 14-meal cycle in `PLAN.md` (only 01–08 are wired into the homepage grid).
- `web/public/images/{hero-pasta,salmon-bowl,family-story,cook-day}.jpg` — hero/section photography.
- FLUX.1 prompts for all photography (per-meal, lifestyle, Pinterest pins, tile thumbnails) are tracked in `docs/marketing/image-prompts.md`. New imagery should be added there alongside its prompt + seed for series consistency.

---

## Design + content artifacts

- `docs/design/*.pen` — Pencil files used as a co-design surface for the marketing site. Always edit via the Pencil MCP tools (`mcp__pencil__*`), never with Read/Grep — `.pen` is encrypted on disk. Image fills inside `.pen` files reference web-public paths relatively (e.g. `../../web/public/images/meals/01-...jpg`).
- `docs/marketing/` — landing copy, channel-specific posts (Pinterest pins, Reddit launch, Facebook groups), and the FLUX prompt registry.
- `docs/superpowers/specs/` and `docs/superpowers/plans/` — design specs and implementation plans (e.g. the marketing-site spec is the source of truth for the visual system, IA, acceptance criteria).

---

## Working-tree hygiene

Because the repo holds two independent projects, working trees frequently contain mixed RN and web changes. When committing:

- **Stage explicitly by path**, not `git add -A` / `git add .`. A `feat(web): ...` commit must not contain `app/` or `hooks/` files; an RN commit must not contain `web/`.
- The deploy workflow is path-filtered, so a mis-staged RN file inside a web commit silently runs through the marketing-site CI (typecheck/test/build); a mis-staged web file inside an RN commit will not trigger the web deploy you wanted.
- Conventional-commit prefixes follow the project they touch: `feat(web): ...`, `fix(web): ...`, etc. for marketing; bare `feat: ...`, `fix: ...` for the RN app.
