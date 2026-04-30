# Stock Up Dinners — Technical Specification (v1)

**Document version:** 1.0
**Status:** Approved for build
**Audience:** Solo founder + contracted developer
**Target launch scope:** Web-only responsive PWA, single-user accounts, paid subscription

> **Repo note (2026-04-30):** This is the canonical spec for the v2 rebuild. It supersedes `docs/archive/2026-pre-pivot/pantry-tracker-spec.md` (the earlier RN-based pantry tracker concept) and any v1-era plans referenced in `PLAN.md` or `docs/superpowers/`. The build plan that operationalizes this spec lives in `~/.claude/plans/lazy-watching-stallman.md` and is summarized in `CLAUDE.md`.

---

## Table of Contents

1. [Product Summary](#1-product-summary)
2. [Scope: v1 vs. v2](#2-scope-v1-vs-v2)
3. [Tech Stack](#3-tech-stack)
4. [Domain Model & Data Architecture](#4-domain-model--data-architecture)
5. [Database Schema (Postgres / Supabase)](#5-database-schema-postgres--supabase)
6. [Core Algorithms](#6-core-algorithms)
7. [API Surface](#7-api-surface)
8. [Page-by-Page UX Specification](#8-page-by-page-ux-specification)
9. [Onboarding Flow](#9-onboarding-flow)
10. [Authentication & Subscription](#10-authentication--subscription)
11. [Receipt OCR Pipeline](#11-receipt-ocr-pipeline)
12. [Content Curation Requirements](#12-content-curation-requirements)
13. [Build Order & Milestones](#13-build-order--milestones)
14. [Operational Concerns](#14-operational-concerns)
15. [Open Questions for Future Iterations](#15-open-questions-for-future-iterations)

---

## 1. Product Summary

**Stock Up Dinners** is a paid, subscription-based web application for Costco members that helps them turn their Costco purchases into cooked meals at home, while reducing food waste.

The product solves three pains:

1. **"What can I cook with what I have?"** — Recipe suggestions are filtered to what's currently in the user's pantry.
2. **"I forgot what's about to go bad."** — Perishability tracking surfaces meals that use up soon-to-expire ingredients.
3. **"What do I need to buy at Costco?"** — Auto-generated shopping lists based on actual usage and threshold rules.

The user's mental model: *"I shop at Costco. I tell the app what I bought. The app tells me what to cook tonight, and what to buy next time."*

### Core value loop

```
Buy at Costco → Log purchase → Pantry updates → App suggests meals
       ↑                                                    ↓
Shopping list (auto)  ←  Pantry depletes  ←  Cook meal (auto-decrement)
```

### Differentiator

Unlike generic recipe apps, Stock Up Dinners is **opinionated and constrained**: it works because it ships with a tightly curated catalog of ~75–100 Costco staple SKUs and 48 recipes that those staples can produce. New users are told, in effect: *"Buy these things, and you can cook these meals. We'll keep track of the rest."*

---

## 2. Scope: v1 vs. v2

### v1 — Launch Scope

| Category | In Scope |
|---|---|
| Platform | Responsive web app (PWA), works on desktop and mobile browsers |
| Users | Single-user accounts only |
| Auth | Email/password + Google OAuth via Supabase Auth |
| Billing | Stripe subscription (monthly + annual), via Stripe Checkout & Customer Portal |
| Pantry input | (1) Live shopping mode, (2) Receipt scan w/ manual review, (3) Manual add |
| Catalog | ~75–100 curated Costco staple SKUs, mapped to ingredients |
| Recipes | 48 curated recipes, all cookable from the staple catalog |
| Substitutions | Curated equivalence groups (e.g., ground beef ↔ turkey ↔ bison) |
| Recommendations | Tiered: 100% cookable + uses perishable → 100% cookable → cookable with substitutions → almost there |
| Pantry tracking | Lot-based (each purchase is its own lot with its own expiration) |
| Decrement | Auto on "I cooked this" (FIFO across lots), with manual override |
| Shopping list | Auto-generated when any ingredient drops below threshold (default 15% of par, user-overridable per ingredient) |
| Perishability | 3-day "use soon" warning |
| Dietary filters | Allergies, dietary preferences (vegetarian, pescatarian, etc.), ingredient blocks |
| Variety | Minimal: simple "recently suggested" deprioritization |

### v2 — Explicitly Deferred

- Native mobile apps (iOS / Android)
- Household / multi-user shared pantries
- User-submitted recipes
- Sophisticated cooking-history tracking and rotation algorithms
- Predictive consumption modeling (explicitly not desired)
- Crowdsourced SKU catalog expansion
- Social features, sharing, rating

---

## 3. Tech Stack

### Application

| Layer | Choice | Rationale |
|---|---|---|
| Framework | Next.js 14+ (App Router) | One codebase, SSR for marketing, API routes for backend, huge contractor pool |
| Language | TypeScript (strict mode) | Catches bugs early, critical for solo operator inheriting code |
| UI components | shadcn/ui + Tailwind CSS | Owned components, no lock-in, accessible defaults |
| Forms | react-hook-form + zod | Type-safe form validation |
| State (server) | TanStack Query (React Query) | Caching, optimistic updates, the standard |
| State (client) | Zustand for any cross-page UI state | Minimal, hooks-based |

### Infrastructure

| Layer | Choice | Cost (launch → scale) |
|---|---|---|
| Hosting | Vercel | $0 (Hobby) → $20/mo (Pro) |
| Database & Auth & Storage | Supabase (Postgres) | $0 → $25/mo |
| Payments | Stripe (already owned) | 2.9% + $0.30 per txn |
| OCR | Google Cloud Vision API | ~$1.50 / 1000 images |
| Transactional email | Resend | $0 (3k/mo free) |
| Product analytics | PostHog Cloud | $0 (1M events/mo free) |
| Error monitoring | Sentry | $0 (5k events/mo free) |
| Domain | (any registrar) | ~$15/yr |

**Estimated cost at launch:** ~$0–15/mo. **At ~500 paying users:** ~$50–75/mo. Scales sub-linearly with revenue.

### Repository structure

```
/stock-up-dinners
├── /app                    # Next.js App Router
│   ├── /(marketing)        # Public landing, pricing
│   ├── /(auth)             # Login, signup, password reset
│   ├── /(app)              # Authenticated app
│   │   ├── /onboarding
│   │   ├── /pantry
│   │   ├── /recipes
│   │   ├── /shopping-list
│   │   ├── /shopping       # Live shopping mode
│   │   ├── /scan           # Receipt scan flow
│   │   ├── /settings
│   └── /api                # Route handlers
├── /components             # Shared UI
├── /lib                    # Pure logic (algorithms, types, utils)
│   ├── /matching           # Recipe matching engine
│   ├── /shopping-list      # Threshold + restock logic
│   ├── /pantry             # Decrement, lot management
│   └── /supabase           # Client initialization
├── /db
│   ├── /migrations         # SQL migrations (timestamped)
│   └── /seed               # Seed scripts for SKUs + recipes
├── /content                # Source-of-truth catalog (versioned)
│   ├── skus.json
│   ├── ingredients.json
│   ├── substitutions.json
│   └── recipes.json
└── /tests
```

### Conventions

- All money in cents (integer).
- All timestamps in UTC, stored as `timestamptz`.
- All weights in grams (integer); display can convert to lbs/oz.
- All volumes in milliliters (integer); display can convert to cups/tsp/tbsp.
- All counts as integers.
- IDs are UUIDs (Supabase default).
- Server-side authorization on every mutation; never trust client claims.

---

## 4. Domain Model & Data Architecture

### Core entities

```
User ──< PantryLot >── Ingredient
  │                        │
  │                        └──< RecipeIngredient >── Recipe
  │
  ├──< CookEvent ──< CookEventLotConsumption >── PantryLot
  │
  ├──< UserPreferences (1:1) >── DietaryFilter, IngredientBlock, AllergenBlock
  │
  └── StripeCustomer (1:1)

CostcoSKU ──< SKUIngredientMapping >── Ingredient
                                          │
                                          └──< IngredientSubstitutionGroup >── Ingredient
```

### Key concepts

#### Ingredient
The atomic unit of the pantry. Every recipe ingredient and every pantry lot is denominated in an ingredient. Examples: `chicken_breast_boneless_skinless`, `egg_large`, `rice_jasmine`.

Each ingredient has a canonical unit (`grams`, `milliliters`, or `count`) and a perishability profile (shelf life when fresh, when frozen, when refrigerated after opening).

#### CostcoSKU
A specific Costco product. Has a name, the abbreviated receipt name(s) Costco prints, a category, and a mapping to one or more ingredients with quantities.

Example: SKU "KS Organic Chicken Breast 6.5 lb pack" → 2,948 grams of `chicken_breast_boneless_skinless`.

A SKU can map to multiple ingredients (e.g., a rotisserie chicken yields both meat and a carcass; we'll keep this simple in v1 and just map to one primary ingredient unless there's a clear case for multi-mapping).

#### PantryLot
A specific purchase of an ingredient that exists in the user's pantry. Each lot has:
- Original quantity purchased
- Remaining quantity
- Acquired-on date
- Expiration date (computed from acquired-on + ingredient's shelf life)
- Storage state: `pantry`, `refrigerated`, or `frozen`
- Source SKU (nullable — for non-Costco manual entries)

**Why lots, not totals?** Two reasons: (1) accurate perishability tracking — different packs expire on different dates, and (2) honest inventory math — when a user buys chicken on Oct 28 and Nov 3, those are different lots with different expirations.

#### CookEvent + CookEventLotConsumption
When a user marks a recipe as cooked, we record a `CookEvent` and a row in `CookEventLotConsumption` for each lot we drew from. This is what enables manual reversal ("I didn't actually cook that"), accurate decrement, and future analytics.

Decrement rule: **FIFO by expiration date** (oldest-expiring lot first). If a lot is fully consumed, mark it depleted.

#### Substitution Group
A named set of ingredients that are interchangeable in recipes. Example: `ground_meat_red` contains `ground_beef`, `ground_turkey`, `ground_bison`. When a recipe calls for `ground_beef`, the matching engine considers any other ingredient in the group as a valid substitute (with a "this is a substitution" flag in the result).

A recipe can opt out of substitution for a specific ingredient (e.g., a chicken curry needs chicken, not turkey).

---

## 5. Database Schema (Postgres / Supabase)

All tables have:
- `id uuid primary key default gen_random_uuid()`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()` (with trigger)

User-owned tables have:
- `user_id uuid not null references auth.users(id) on delete cascade`
- Row Level Security (RLS) policies restricting to `auth.uid() = user_id`

### Catalog tables (read-only for users; admin-managed)

#### `ingredients`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| slug | text unique | e.g., `chicken_breast_boneless_skinless` |
| display_name | text | "Chicken Breast (Boneless, Skinless)" |
| canonical_unit | enum | `grams` \| `milliliters` \| `count` |
| category | text | `protein`, `produce`, `dairy`, etc. |
| shelf_life_pantry_days | int nullable | NULL if not pantry-stable |
| shelf_life_fridge_days | int nullable | |
| shelf_life_freezer_days | int nullable | |
| default_storage | enum | `pantry` \| `refrigerated` \| `frozen` |
| is_assumed_staple | bool | TRUE for salt, pepper, oil — assumed always present |
| substitution_group_id | uuid nullable | FK → substitution_groups |
| allergen_tags | text[] | `dairy`, `gluten`, `nuts`, `shellfish`, `egg`, `soy` |
| dietary_tags | text[] | `vegetarian`, `vegan`, `pescatarian`, etc. (positive: this ingredient IS vegetarian) |
| meat_type | text nullable | `pork`, `beef`, `chicken`, `seafood`, `lamb`, `turkey` |

#### `substitution_groups`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| slug | text unique | e.g., `ground_meat_red` |
| display_name | text | "Ground Red Meat" |

#### `costco_skus`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| sku_code | text nullable | Costco's item number if known |
| display_name | text | "Kirkland Signature Organic Chicken Breast, 6.5 lb" |
| receipt_aliases | text[] | All known abbreviated receipt names: `["KS ORG CHKN BRST", "KS ORGANIC CHICKEN"]` |
| category | text | |
| is_active | bool | Soft-disable if Costco discontinues |

#### `sku_ingredient_mappings`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| sku_id | uuid | FK → costco_skus |
| ingredient_id | uuid | FK → ingredients |
| quantity | int | In ingredient's canonical unit |

A SKU can have multiple mappings (multi-ingredient products), though v1 will mostly be 1:1.

#### `recipes`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| slug | text unique | |
| title | text | |
| description | text | |
| servings | int | |
| prep_minutes | int | |
| cook_minutes | int | |
| instructions | jsonb | Array of step objects: `[{step: 1, text: "..."}, ...]` |
| hero_image_url | text nullable | |
| dietary_tags | text[] | `vegetarian`, `gluten_free`, etc. |
| meat_types | text[] | All meats appearing (for filter exclusion) |
| is_active | bool | |

#### `recipe_ingredients`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| recipe_id | uuid | FK → recipes |
| ingredient_id | uuid | FK → ingredients |
| quantity | int | In ingredient's canonical unit |
| display_quantity | text | "1 lb" or "2 cups" — for human display |
| allow_substitution | bool default true | If FALSE, recipe REQUIRES this exact ingredient |
| is_optional | bool default false | |

### User-owned tables

#### `user_profiles`
| Column | Type | Notes |
|---|---|---|
| user_id | uuid | PK, FK → auth.users |
| display_name | text | |
| onboarded_at | timestamptz nullable | NULL until onboarding complete |
| stripe_customer_id | text | |
| subscription_status | enum | `none` \| `trialing` \| `active` \| `past_due` \| `canceled` |
| subscription_period_end | timestamptz nullable | |

#### `user_preferences`
| Column | Type | Notes |
|---|---|---|
| user_id | uuid | PK, FK |
| dietary_filters | text[] | `vegetarian`, `pescatarian`, etc. — recipes must satisfy all |
| blocked_ingredients | uuid[] | Ingredient IDs to never suggest |
| blocked_meats | text[] | `pork`, `beef`, etc. — convenience over individual blocks |
| allergens | text[] | `dairy`, `gluten`, `nuts`, `shellfish`, `egg`, `soy` |
| use_soon_threshold_days | int default 3 | |
| default_threshold_pct | int default 15 | Below this % of par → restock |

#### `pantry_lots`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK |
| ingredient_id | uuid | FK |
| source_sku_id | uuid nullable | FK → costco_skus |
| quantity_initial | int | In canonical unit |
| quantity_remaining | int | |
| acquired_on | date | |
| storage_state | enum | `pantry` \| `refrigerated` \| `frozen` |
| expires_on | date | Computed at insert; user-editable |
| is_depleted | bool default false | TRUE when quantity_remaining = 0 |
| notes | text nullable | User-entered |

**Indexes:** `(user_id, ingredient_id, is_depleted)`, `(user_id, expires_on) WHERE is_depleted = false`.

#### `pantry_par_overrides`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK |
| ingredient_id | uuid | FK |
| par_quantity | int nullable | User's desired stock level (canonical unit) |
| threshold_pct | int nullable | User's per-ingredient threshold override |

UNIQUE (user_id, ingredient_id).

#### `cook_events`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK |
| recipe_id | uuid nullable | FK; NULL if user logged a custom cook |
| servings_cooked | int | Default = recipe.servings |
| cooked_at | timestamptz | |
| reverted_at | timestamptz nullable | If set, this event is undone |

#### `cook_event_consumptions`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| cook_event_id | uuid | FK |
| pantry_lot_id | uuid | FK |
| ingredient_id | uuid | FK |
| quantity_consumed | int | Canonical unit |
| was_substitution | bool | TRUE if this lot's ingredient differs from the recipe's required ingredient |
| recipe_ingredient_id | uuid nullable | The recipe row this satisfied |

#### `recipe_suggestions_log`
Used for the lightweight variety mechanic.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK |
| recipe_id | uuid | FK |
| suggested_at | timestamptz | |
| suggestion_tier | text | `perishable_priority`, `cookable`, `substitutable`, `almost` |

#### `receipt_scans`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK |
| image_url | text | Supabase storage path |
| status | enum | `uploaded`, `processing`, `awaiting_review`, `committed`, `failed` |
| ocr_raw_text | text nullable | |
| parsed_items | jsonb nullable | `[{raw_line, matched_sku_id, confidence, quantity}, ...]` |
| committed_at | timestamptz nullable | |

### RLS policies (concept)

For every user-owned table:

```sql
alter table <table> enable row level security;

create policy "users see own rows"
  on <table> for select
  using (auth.uid() = user_id);

create policy "users insert own rows"
  on <table> for insert
  with check (auth.uid() = user_id);

create policy "users update own rows"
  on <table> for update
  using (auth.uid() = user_id);

create policy "users delete own rows"
  on <table> for delete
  using (auth.uid() = user_id);
```

Catalog tables (`ingredients`, `recipes`, etc.) are readable by `authenticated` role and writable only via service-role (admin scripts).

---

## 6. Core Algorithms

### 6.1 Recipe Matching Engine

**Input:**
- User's current pantry lots (filtered: `is_depleted = false`)
- User's preferences (dietary filters, blocked ingredients, blocked meats, allergens)
- All active recipes

**Output:** A list of recipes, each tagged with a tier and a "uses_perishable" flag.

**Algorithm:**

```
1. Build a map: ingredient_id → total available quantity (sum of remaining across lots).
   Also: ingredient_id → earliest expiring lot's expires_on date.

2. Apply ingredient substitution expansion:
   For each ingredient in the pantry, if it belongs to a substitution_group,
   note that any recipe needing another ingredient in the same group can be
   satisfied (subject to the recipe's allow_substitution flag).

3. For each recipe:
   a. Filter check: skip if recipe violates dietary filters, blocked meats,
      blocked ingredients, or allergens.
   b. For each recipe_ingredient (non-optional):
      - Mark as "ASSUMED" if ingredient.is_assumed_staple
      - Mark as "DIRECT" if pantry has enough of this exact ingredient
      - Mark as "SUBSTITUTED" if pantry has enough of a substitution-group
        peer AND recipe_ingredient.allow_substitution = true
      - Mark as "MISSING" otherwise
   c. Tier the recipe:
      - If any non-optional ingredient is MISSING and missing count > 1 → exclude
        from primary results (still available in "Almost There" if missing count = 1)
      - If all are DIRECT or ASSUMED → tier = "cookable"
      - If at least one is SUBSTITUTED, none MISSING → tier = "substitutable"
      - If exactly one non-optional is MISSING → tier = "almost"
   d. Set uses_perishable = TRUE if any DIRECT or SUBSTITUTED match draws from
      a lot expiring within use_soon_threshold_days.

4. Sort results into display order:
   Tier 1: cookable + uses_perishable (sorted by earliest-expiring lot ASC)
   Tier 2: cookable (sorted by recently-suggested-at DESC, i.e., least recently shown first)
   Tier 3: substitutable (same sort)
   Tier 4: almost (sorted by which missing ingredient is "easiest" — TBD; for v1, alphabetical)

5. Variety pass (light v1 implementation):
   Within each tier, demote any recipe suggested in the last 48 hours (move to
   the bottom of its tier).

6. Cap at 30 results to keep the page snappy.
```

**Performance:** With 48 recipes and ~75 SKUs/ingredients, this entire computation runs in milliseconds. Compute server-side on demand; no caching needed in v1.

### 6.2 Pantry Decrement (FIFO)

**Triggered when:** User taps "I cooked this" on a recipe.

**Algorithm:**

```
For each recipe_ingredient (excluding ASSUMED staples):
  1. Determine the actual ingredient to draw from. By default, use the
     recipe's ingredient. If the user picked a substitute at cook time,
     use that one.
  2. amount_needed = recipe_ingredient.quantity * (servings_cooked / recipe.servings)
  3. Fetch all non-depleted lots for this ingredient, sorted by expires_on ASC,
     then acquired_on ASC (tiebreaker).
  4. Walk the lots, drawing amount_needed:
     For each lot:
       - draw = min(lot.quantity_remaining, amount_still_needed)
       - lot.quantity_remaining -= draw
       - if lot.quantity_remaining == 0: lot.is_depleted = true
       - record CookEventLotConsumption(lot, ingredient, draw, was_substitution)
       - amount_still_needed -= draw
       - if amount_still_needed == 0: break
  5. If amount_still_needed > 0 after exhausting lots:
     - Decrement what's available
     - Surface a warning: "We tracked X of Y; you may have used something
       not in your pantry — adjust if needed."
```

This entire operation runs in a single Postgres transaction.

**Reversal:** A user can undo a cook event. Set `cook_events.reverted_at = now()`, then for each consumption row, add quantity back to the lot (un-deplete if needed). Wrap in a transaction.

### 6.3 Shopping List Generation

**Triggered when:** User opens the Shopping List page (computed live, not stored).

**Algorithm:**

```
For each ingredient that the user has ever stocked OR that appears in any
non-blocked recipe:

  1. Determine the user's par level for this ingredient:
     - If pantry_par_overrides has a row, use that par_quantity
     - Else, use a system-default par level from ingredients.default_par
       (added to ingredients table; a curated value)

  2. Determine the threshold percentage:
     - If pantry_par_overrides.threshold_pct, use that
     - Else, use user_preferences.default_threshold_pct (default 15)

  3. current_quantity = sum of quantity_remaining across all non-depleted lots

  4. If current_quantity / par_quantity < threshold_pct / 100:
     - Add to shopping list with suggested_quantity = par_quantity - current_quantity
     - Map back to the cheapest/most-recent SKU that contains this ingredient

  5. Group results by Costco aisle/category for in-store flow.
```

The shopping list is **always available, always live**, and can be marked off as the user shops (which feeds the live shopping mode).

### 6.4 Starter Pack (New User)

A static list, defined in `/content/starter-pack.json`: ~25–30 of the staple SKUs that together unlock the largest number of recipes. After onboarding, the user can simply tap to add all of them to a "first shopping trip" list.

Pseudocode for selecting it (one-time, manual analysis at content-curation time, not runtime):
- Greedy set cover: find the smallest set of SKUs that covers ingredients used in the most recipes.
- The output is committed to the repo — no runtime computation.

---

## 7. API Surface

All routes live under `/api`. All authenticated routes verify the Supabase session and use RLS for data isolation.

### Auth & Subscription

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/callback` | Supabase auth handler |
| POST | `/api/billing/create-checkout` | Returns Stripe Checkout URL |
| POST | `/api/billing/create-portal` | Returns Stripe Customer Portal URL |
| POST | `/api/billing/webhook` | Stripe webhook → updates subscription_status |

### Pantry

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/pantry` | List all non-depleted lots, grouped by ingredient |
| POST | `/api/pantry/lots` | Add a lot (manual or from shopping/scan) |
| PATCH | `/api/pantry/lots/:id` | Edit quantity/expiration/storage |
| DELETE | `/api/pantry/lots/:id` | Remove a lot |
| POST | `/api/pantry/bulk-add` | Add multiple lots in one call (used by shopping mode commit and receipt commit) |

### Recipes

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/recipes/suggestions` | Run matching engine, return tiered list |
| GET | `/api/recipes/:id` | Recipe detail with cookability analysis for THIS user |
| POST | `/api/recipes/:id/cook` | Log a cook event; body: `{servings, substitutions: [{recipe_ingredient_id, ingredient_id_used}]}` |
| POST | `/api/cook-events/:id/revert` | Undo a cook event |

### Shopping

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/shopping-list` | Compute and return the live list |
| POST | `/api/shopping/sessions` | Start a live shopping session |
| POST | `/api/shopping/sessions/:id/items` | Add an item to the in-progress session (debounced from client) |
| POST | `/api/shopping/sessions/:id/commit` | Convert session → pantry lots |

### Receipt scan

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/scan/upload` | Returns a presigned upload URL |
| POST | `/api/scan/:id/process` | Trigger OCR + parse (server-side; can be sync since it's <5s) |
| GET | `/api/scan/:id` | Poll status; returns parsed_items when ready |
| POST | `/api/scan/:id/commit` | User-confirmed items → pantry lots |

### Settings

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/preferences` | |
| PATCH | `/api/preferences` | |
| GET | `/api/par-overrides` | |
| PUT | `/api/par-overrides/:ingredient_id` | Upsert a par/threshold override |
| DELETE | `/api/par-overrides/:ingredient_id` | |

### Validation

Every request body validated with `zod`. Every response typed end-to-end. Use `tRPC` if the team prefers it — but plain Next.js route handlers + zod are simpler and equally type-safe with shared schemas.

---

## 8. Page-by-Page UX Specification

### 8.1 Marketing / Public

#### `/` — Landing
Hero: "Cook more of what you bought at Costco." Sub-hero explaining the value loop. Pricing section. Sample-recipes carousel. CTA to sign up.

#### `/pricing`
Two cards: Monthly and Annual (annual ~20% discount). CTA opens Stripe Checkout (after sign-up).

#### `/login`, `/signup`, `/forgot-password`
Supabase Auth UI with email/password and Google. After signup, redirect to `/onboarding` if `onboarded_at IS NULL`, else to `/recipes`.

### 8.2 Authenticated app

All authenticated pages share a top nav with: **Recipes · Pantry · Shopping List · Settings**, plus a quick-action button to start Live Shopping or Scan Receipt.

#### `/onboarding`
See Section 9 below.

#### `/recipes` — Home / Suggestions

Default landing for authenticated users.

**Layout:**

- **"Use these soon"** — section at top if there are perishable-driven cookable recipes. Each card shows the perishable ingredient and days remaining.
- **"Cook tonight"** — main cookable list (Tier 2).
- **"Cook with substitutions"** — collapsed by default, Tier 3.
- **"Almost there — one item away"** — collapsed by default, Tier 4. Each card has an "Add missing item to shopping list" button.

**Recipe card:**
- Hero image (or placeholder)
- Title
- Time (prep + cook)
- Servings
- A small badge: "Uses your chicken (expires Fri)" if applicable
- Tap → recipe detail

#### `/recipes/:slug` — Recipe Detail

- Hero image
- Title, description, servings, time
- **Ingredients** — list with each line showing:
  - Required quantity
  - Status: ✅ in pantry | 🔄 substituting [name] | ❌ missing | ⭐ assumed staple
  - For substitutions: a dropdown lets user pick which substitute they're using
- **Instructions** — numbered steps
- **"I cooked this" button (primary)** — opens a confirmation modal:
  - Servings input (defaults to recipe.servings)
  - Substitution confirmations
  - "Cook" button → POST to `/api/recipes/:id/cook` → success toast → redirect to `/recipes`

#### `/pantry` — Pantry View

**Layout:**

- Filter bar: search + filter by category (protein, produce, dairy, etc.) + filter by storage state.
- Sort: "Expiring soonest" (default), "Recently added", "Alphabetical".
- **"Use these soon" banner** at top if any lots expire within `use_soon_threshold_days`.
- List, grouped by ingredient. Each ingredient shows:
  - Ingredient name + total quantity (e.g., "Chicken Breast — 4.2 lbs total")
  - Expandable to show individual lots:
    - Quantity remaining
    - Acquired date
    - Expires date (color-coded: red <3 days, yellow <7, normal otherwise)
    - Storage state (chip)
    - Edit / Delete actions

**Add buttons:** floating action button → menu with [+ Live Shopping] [+ Scan Receipt] [+ Manual Add].

#### `/pantry/add` — Manual Add

Form:
- Search by ingredient OR by SKU (typeahead)
- Quantity + unit (the unit is fixed by ingredient, but display can show user-friendly units)
- Acquired date (default today)
- Storage state (default = ingredient's default)
- Expiration date (auto-computed; user-editable)
- Save → POST → toast → back to pantry.

#### `/shopping-list` — Shopping List

**Layout:**

- Header: "Your shopping list — auto-updated"
- Grouped by Costco aisle/category (Produce, Refrigerated, Frozen, Pantry, Meat & Seafood)
- Each item shows:
  - Item name (the SKU display name)
  - "Why" (e.g., "Below threshold (3 lbs / 20 lbs)" or "Just one missing for [Recipe Name]")
  - Checkbox to mark off (visual only; doesn't add to pantry — that's what shopping mode is for)
- Top action: "Start Live Shopping with this list" → starts a shopping session prepopulated with the list.
- "Print / share" button (mailto with rendered text body).

#### `/shopping` — Live Shopping Mode

The user is at Costco. This page is mobile-optimized.

**Layout:**

- Big search bar: "What did you grab?"
- Quick-tap grid of the user's most-bought / on-list staples (configurable in settings)
- A running list of this session's items at the bottom, with quantity steppers
- Each tap adds the item with default quantity (1 of that SKU); user can adjust
- Bottom button: "Done — add all to pantry" → batch POST to `/api/shopping/sessions/:id/commit`

**Behavior:**
- Auto-saves session every 30 seconds (in case of phone closing, browser crashes)
- If user has an open shopping session, opening `/shopping` resumes it
- Items committed create one pantry lot per SKU per session

#### `/scan` — Receipt Scan

- Step 1: Upload photo (camera or file picker)
- Step 2: Loading state ("Reading your receipt…")
- Step 3: Review screen
  - Lists each parsed line: matched SKU (or "no match"), quantity, confidence
  - Each row is editable — user can change matched SKU, edit quantity, or delete the row
  - Add manual rows for items the OCR missed
  - "Add all to pantry" button → batch commit
- Step 4: Success → redirect to pantry.

#### `/settings`

Tabs:

- **Profile** — display name, email change, password reset
- **Subscription** — current plan, renewal date, "Manage in Stripe Portal" button
- **Diet & Preferences**
  - Dietary filter chips (multi-select): Vegetarian, Pescatarian, etc.
  - Blocked meats checkboxes
  - Allergens chips (multi-select)
  - "Block specific ingredients" — typeahead multi-select
  - Use-soon threshold slider (1–7 days)
- **Pantry Defaults** — par levels & thresholds
  - Default threshold % (slider, default 15)
  - List of ingredients with per-ingredient par + threshold overrides
- **Quick-tap Layout** (advanced) — choose which staples appear in Live Shopping quick-tap grid

### 8.3 Empty / loading / error states

- All list pages show empty states with a clear CTA when nothing is there.
- All async actions show optimistic UI where safe (especially pantry edits).
- Network errors surface via toast; never block the UI on transient failures.

---

## 9. Onboarding Flow

Triggered after first successful sign-up; gates access to the main app.

### Step 1: Welcome
"Hi! Stock Up Dinners works best when we know a few things about you."

### Step 2: Diet & Allergies
- Dietary filters (multi-select)
- Allergens (multi-select)
- Blocked meats (checkboxes)

### Step 3: "Have you been to Costco recently?"
Two paths:

- **"Yes, I have stuff at home"** → Step 4a
- **"No, I'm starting fresh"** → Step 4b

### Step 4a: Quick pantry seed
- Show the staple SKU list grouped by category
- User taps each item they currently have and enters approximate quantity
- "Done" → seeds pantry lots dated today

### Step 4b: Starter pack shopping list
- Show the curated Starter Pack: "Buy these next time you're at Costco and you'll be able to make 30+ of our recipes."
- "Save as my shopping list" → user heads to Costco. On their next visit, Live Shopping mode is preloaded.

### Step 5: Subscription (gated paywall)
- "Start your free trial" or "Subscribe monthly / annually"
- Stripe Checkout
- On success webhook: `subscription_status = active` (or `trialing`); `onboarded_at = now()`; redirect to `/recipes`.

**Note:** Pantry seed and preferences are saved before the paywall, so even if they bail at checkout, their work isn't lost.

---

## 10. Authentication & Subscription

### Auth (Supabase)

- Supabase Auth handles email/password, magic links (optional), and Google OAuth.
- Session stored in HTTP-only cookies (Supabase SSR helpers).
- Middleware (`middleware.ts`) protects `/(app)/*` routes; redirects to `/login` when no session.
- `/(app)/*` routes additionally check `subscription_status IN ('active', 'trialing')`; if not, redirect to `/pricing`.

### Subscription (Stripe)

**Setup:**
- One Stripe Product: "Stock Up Dinners Subscription"
- Two prices: Monthly, Annual
- 7-day free trial enabled on both prices
- Customer Portal enabled with: cancel, resume, update payment method, change plan

**Flow:**
1. User clicks "Subscribe" → `POST /api/billing/create-checkout` returns Stripe Checkout URL with `client_reference_id = user.id`.
2. User completes checkout → Stripe redirects to `/billing/success`.
3. Stripe sends webhook `checkout.session.completed` → server verifies signature → updates `user_profiles.stripe_customer_id` and `subscription_status`.
4. Stripe sends ongoing webhooks: `customer.subscription.updated`, `.deleted`, `invoice.payment_failed` → server updates status accordingly.

**Webhook handler must be idempotent** (Stripe retries on failure). Use `stripe-signature` verification and process events by `id`, ignoring duplicates.

**Cancellation:** User clicks "Manage" → opens Stripe Customer Portal. Cancellation flows through webhook back to our DB.

---

## 11. Receipt OCR Pipeline

Receipt scanning is **explicitly not a hero feature**. The shopping list + live shopping mode are the primary input methods. Scan exists as a convenience for users who'd rather upload after the fact.

### Pipeline

```
1. User uploads image → presigned upload to Supabase Storage
2. Server creates receipt_scans row (status=processing)
3. Server calls Google Vision API (DOCUMENT_TEXT_DETECTION)
4. Server runs the parse function:
   a. Split OCR text into lines.
   b. Filter to lines that look like items (regex: starts with item code or ALL-CAPS abbreviation).
   c. For each candidate line:
      - Fuzzy-match against the receipt_aliases of all costco_skus
      - Use Levenshtein distance + token overlap; threshold = 0.7 confidence
      - Extract quantity (default 1, parse if explicit)
   d. Build parsed_items array with confidence scores.
5. Server sets status=awaiting_review, returns to client.
6. User reviews, edits, deletes, adds — confirms.
7. On commit, server creates pantry_lots for each confirmed line.
```

### Failure modes

- **Image too blurry:** OCR returns mostly garbage → status=failed, prompt user to retake or use manual entry.
- **No matches found:** All confidences below threshold → status=awaiting_review with empty matches; user enters manually.
- **Low confidence matches:** UI shows them but flagged with an icon; user must explicitly confirm.

### Cost containment

- Soft rate limit: max 10 scans per user per day in v1 (config flag).
- Image size limit: 5MB; resize client-side to max 2000px on long edge before upload.

---

## 12. Content Curation Requirements

This is **not a build task** but a content task. It must happen **before or in parallel with** development.

### Deliverables

1. **`ingredients.json`** — ~120–150 ingredients (the 75–100 SKUs map to these, plus assumed staples like salt, oil, pepper). For each: slug, display name, canonical unit, category, shelf life (pantry/fridge/freezer/days), default storage, allergen tags, dietary tags, meat type, default par level.

2. **`substitution_groups.json`** — ~10–20 groups. Examples: ground red meat, ground white meat, leafy greens, hard cheeses, cooking oils.

3. **`skus.json`** — 75–100 Costco staples. For each: display name, receipt aliases (you'll need to gather actual receipt strings — buy a few items and check), category, mapping to ingredient(s) with quantities.

4. **`recipes.json`** — 48 recipes. For each: title, description, servings, prep/cook time, ingredients (with quantities, substitution flags), instructions, dietary tags. Each recipe must use only ingredients available from the SKU catalog (or assumed staples).

5. **`starter-pack.json`** — 25–30 SKUs from the catalog that maximize recipe coverage.

### Curation process recommendation

- Build the recipes first (or in lockstep with the SKU list).
- For each recipe, ensure every ingredient is either an assumed staple, in the SKU catalog, or substitutable to something in the catalog.
- This is iterative — if a recipe needs a one-off ingredient, either find a recipe that doesn't need it, or expand the catalog (sparingly).
- For receipt aliases: your contractor or you should buy ~$200 of staples once, save the receipt, and harvest the abbreviations directly. There's no shortcut here.

### Storage

The content lives in version-controlled JSON files in the repo. A seed script reads them and upserts into Postgres. Updating a recipe = edit JSON, run seed script, commit. No CMS in v1.

---

## 13. Build Order & Milestones

A solo contractor can execute this in roughly the following order. Estimates assume one full-time mid-senior developer and exclude content curation (which runs in parallel and is your job).

### Milestone 1 — Foundation (Week 1)
- Repo setup, Next.js app, Tailwind, shadcn/ui
- Supabase project, schemas migrated
- Auth flow (sign up, login, password reset, Google OAuth)
- Marketing pages (`/`, `/pricing`)
- Stripe integration: products, checkout, webhook, customer portal
- Subscription gating middleware
- Deploy to Vercel; CI green; staging environment

**Exit criteria:** A user can sign up, subscribe, and log in. Nothing else works yet.

### Milestone 2 — Catalog & Pantry (Weeks 2–3)
- Seed scripts for ingredients, SKUs, substitution groups, recipes
- Pantry data model + CRUD APIs
- `/pantry` view with lots list, expiration coloring
- `/pantry/add` manual add form
- Settings: preferences, allergens, dietary filters

**Exit criteria:** A user can manually populate their pantry and see it organized.

### Milestone 3 — Recipes & Cooking (Weeks 4–5)
- Recipe matching engine in `/lib/matching`
- `/recipes` suggestions page with tiers
- `/recipes/:slug` detail page
- "I cooked this" flow with substitutions
- FIFO decrement implementation
- Cook event logging + reversal

**Exit criteria:** End-to-end loop works: pantry → suggestions → cook → pantry decrements.

### Milestone 4 — Shopping (Weeks 6–7)
- Par level system + `pantry_par_overrides`
- Shopping list computation
- `/shopping-list` view
- Live shopping mode (`/shopping`) with session model
- Quick-tap layout settings
- Starter pack flow in onboarding

**Exit criteria:** A user can plan a Costco run, shop with the live mode, and see their pantry update.

### Milestone 5 — Receipt Scan (Week 8)
- Google Cloud Vision integration
- Upload + parse pipeline
- Review UI
- Commit to pantry

**Exit criteria:** A user can scan a receipt and end up with reasonably accurate pantry lots after review.

### Milestone 6 — Polish & Launch (Weeks 9–10)
- Empty states, loading states, error states everywhere
- PostHog analytics events on key actions (signup, first pantry add, first cook event, first scan, churn signals)
- Sentry error monitoring wired up
- Email notifications via Resend (welcome, payment failed, trial ending)
- PWA manifest + service worker for "add to home screen" + offline-tolerant pantry view
- QA pass, accessibility pass, performance pass
- Production launch

**Total estimate: ~10 weeks for a solo mid-senior contractor.** Compress to 6–8 weeks if highly experienced with this exact stack; expand to 12–14 if junior or part-time.

---

## 14. Operational Concerns

### Environments

- **Production:** `stockupdinners.com` (Vercel), Supabase prod project, Stripe live mode
- **Preview:** Vercel auto-creates per-PR previews using a shared Supabase staging project and Stripe test mode
- **Local:** `.env.local` with Supabase local emulator (or staging) and Stripe test mode

### Secrets management

- All secrets in Vercel env vars (production) and `.env.local` (development); never committed
- Stripe webhook signing secret, Supabase service-role key, Google Vision service account JSON, Resend API key, Sentry DSN, PostHog key

### Testing strategy

- **Unit tests** (Vitest) for the matching engine, decrement logic, shopping list logic, and threshold math — these are the algorithmically rich parts
- **Integration tests** for API routes via `next-test-api-route-handler`
- **E2E** with Playwright for the critical flows: signup → subscribe → seed pantry → cook recipe → see decrement
- Aim for ~70% coverage on `/lib`; lower for UI

### Monitoring & alerts

- Sentry alerts on error spikes
- PostHog cohorts for activation (did user reach first cook event?), retention (cook events per week), churn signal (no logins in 14 days while subscribed)
- Stripe dashboard for billing events
- Supabase dashboard for slow queries; index reviews monthly in early days

### Backups

- Supabase auto-backs up Postgres daily on paid tier
- For free tier: weekly manual `pg_dump` to a private S3-compatible bucket (or upgrade to paid before launch — recommended)

### Compliance & legal

- Privacy policy and terms of service required before payment processing (template-acceptable for v1)
- Stripe handles PCI compliance — never touch card data directly
- GDPR/CCPA: provide a data export and account deletion path in Settings → Profile

### Performance budget

- Pantry page < 2s first contentful paint on mid-tier mobile
- Recipe matching API < 300ms p95
- Live shopping add-item action < 200ms perceived latency (optimistic UI)

### Accessibility

- shadcn/ui components are accessible by default; preserve that
- All interactive elements keyboard-navigable
- Color is never the only signal (e.g., expiration uses both color and text)
- Screen-reader pass before launch

### Rate limiting

- Use Vercel's edge rate limiting on auth endpoints (10 req/min/IP)
- Receipt scan endpoint: 10/day/user (configurable)

---

## 15. Open Questions for Future Iterations

These are deferred but worth tracking:

1. **Multi-ingredient SKUs.** Some Costco items (rotisserie chicken) yield multiple usable ingredients. v1 maps to one primary; v2 may want richer modeling.

2. **Variable-quantity SKUs.** Produce sold by weight varies pack-to-pack. v1 uses the labeled/expected quantity; v2 could let users edit at intake.

3. **Recipe scaling beyond integer servings.** The decrement math handles it, but the UI in v1 only supports integer servings.

4. **Sub-pantry locations.** "Garage freezer" vs. "kitchen freezer" — not modeled in v1.

5. **Recurring meal plans.** Some users will want "I cook 5 dinners a week from this list." v2 territory.

6. **Cost tracking.** Showing $/serving or weekly grocery spend — we have the data via SKUs, but UX is v2.

7. **Costco-specific seasonal items.** These rotate; the catalog excludes them in v1 by design.

8. **Receipt OCR catalog expansion.** When users scan items not in our catalog, log them for future curation.

9. **Notifications.** Push notifications for "X expires tomorrow" — requires native app or web push setup; v2.

10. **Export / API.** Some users will want to export their pantry. v2.

---

## Appendix A — Glossary

- **Lot:** A specific purchase of an ingredient, with its own quantity, acquisition date, and expiration. Pantry tracking is lot-based, not totals-based.
- **Par level:** The desired stock quantity for an ingredient. When current falls below `par × threshold%`, the item enters the shopping list.
- **Threshold:** The percentage of par at which restock is suggested. Default 15%.
- **Substitution group:** A set of interchangeable ingredients (e.g., ground beef ↔ turkey ↔ bison).
- **Assumed staple:** An ingredient considered always-present (salt, pepper, olive oil) and not tracked in the pantry.
- **Tier:** Recipe match category — `cookable`, `substitutable`, or `almost`.
- **Use-soon:** A perishable ingredient within `use_soon_threshold_days` of expiring (default 3).
- **Lot consumption:** A row recording that a specific cook event drew a specific quantity from a specific lot.

## Appendix B — Sample Data Shapes

**Ingredient (JSON seed):**
```json
{
  "slug": "chicken_breast_boneless_skinless",
  "display_name": "Chicken Breast (Boneless, Skinless)",
  "canonical_unit": "grams",
  "category": "protein",
  "shelf_life_pantry_days": null,
  "shelf_life_fridge_days": 4,
  "shelf_life_freezer_days": 270,
  "default_storage": "refrigerated",
  "default_par": 1800,
  "is_assumed_staple": false,
  "substitution_group_slug": null,
  "allergen_tags": [],
  "dietary_tags": ["pescatarian_excluded", "vegetarian_excluded"],
  "meat_type": "chicken"
}
```

**SKU (JSON seed):**
```json
{
  "display_name": "Kirkland Signature Organic Chicken Breast, 6.5 lb",
  "receipt_aliases": ["KS ORG CHKN BRST", "KS ORGANIC CHICKEN BREAST"],
  "category": "refrigerated",
  "mappings": [
    { "ingredient_slug": "chicken_breast_boneless_skinless", "quantity": 2948 }
  ]
}
```

**Recipe (JSON seed):**
```json
{
  "slug": "weeknight_chicken_stir_fry",
  "title": "Weeknight Chicken Stir Fry",
  "description": "30-minute one-pan dinner.",
  "servings": 4,
  "prep_minutes": 10,
  "cook_minutes": 20,
  "dietary_tags": [],
  "meat_types": ["chicken"],
  "ingredients": [
    {
      "ingredient_slug": "chicken_breast_boneless_skinless",
      "quantity": 680,
      "display_quantity": "1.5 lb",
      "allow_substitution": false,
      "is_optional": false
    },
    {
      "ingredient_slug": "rice_jasmine",
      "quantity": 400,
      "display_quantity": "2 cups (uncooked)",
      "allow_substitution": true,
      "is_optional": false
    }
  ],
  "instructions": [
    { "step": 1, "text": "Cook the rice per package directions." },
    { "step": 2, "text": "Slice chicken into bite-size pieces." }
  ]
}
```

---

**End of specification.**
