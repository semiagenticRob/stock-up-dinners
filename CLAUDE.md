# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Stock Up Dinners — Expo/React Native mobile app (iOS-first) for a Costco-anchored dinner meal plan product. See `PLAN.md` for the product plan, launch checklist, and the canonical 75-item Costco staple ingredient list that the data model is built around.

## Commands

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

Env vars (EXPO_PUBLIC_*, read in `lib/supabase.ts`): `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`. RevenueCat keys are read in `providers/RevenueCatProvider.tsx`.

## Architecture

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

## Data model invariants

- The Costco staple ingredient list in `PLAN.md` is the **constraint set** for all meal generation — meals may only reference ingredients from that list. Seed data in `supabase/seed/` must stay consistent with it.
- `meals.cycle` + `meals.meal_number` encode position in the 14-dinner bi-weekly plan; `is_active` gates what the app shows.

## Marketing site

The marketing site (`stockupdinners.com`) lives in `web/` as a separate Astro project with its own `package.json` and CI workflow. It is fully decoupled from the RN app — no shared dependencies, no shared backend. See `web/README.md` for details.
