> **SUPERSEDED 2026-04-30.** This spec described a React Native pantry tracker
> with full / low / out quantity levels and a free-with-paid-upsell model. It has
> been replaced by the ATAT v1.0 specification at
> `docs/specs/2026-04-30-v2-web-rebuild-spec.md`, which targets a Next.js 14 web
> PWA with lot-based pantry tracking, FIFO consumption, expiration awareness, and
> a paid-from-day-one Stripe subscription. Preserved here as historical reference
> only — do not build from this document.

---

2026-04-29

Status: #superseded (was #building)

Tags: [[stock-up-dinners]] [[product-spec]] [[pantry-tracker]] [[core-feature]]

# Stock Up Dinners — Pantry Tracker: Product Spec

---

## Core Concept

The pantry tracker is the unlock for everything. Without knowing what the user has at home, the app is just another recipe browser — and there are thousands of those. With it, we can tell them what to cook *tonight* using what they already bought at Costco last weekend, and we can tell them exactly what to put back on the list before the next run. That's genuinely useful in a way that no amount of meal planning UI ever will be.

The product was being designed around meal planning: pick meals, build a list, shop. That flow puts planning friction up front and gives users nothing until they complete it. Flip it. Start with what they have. Let the app surface what they can make now, and generate the shopping list as a byproduct of what's running low. Pantry-first turns the app from a planning tool into a kitchen co-pilot.

---

## MVP Feature Set (v1)

Keep it simple. The goal is to prove the loop works: seed pantry → cook → deplete → get suggestions → restock.

### Pantry Items

- Each item has: `name`, `quantity_level` (low / medium / full), `category` (produce, protein, pantry staple, dairy, frozen, etc.), `added_at`, `updated_at`
- No barcodes. No unit tracking. No expiry dates. Quantity levels are enough to drive the shopping list.
- Users can manually add items. The real unlock is seeding from the Costco staples list (see below).

### Seeding from Costco Staples

- On first open, prompt: "Seed your pantry from your Costco staples." Show the existing staples list from the repo.
- User taps each item to mark it as `full`, `medium`, or `low` (or skip). One screen, fast.
- This gets a real pantry populated in under 2 minutes. No manual typing. This is the magic of the onboarding.

### Quantity Tracking

- Three states: **Full** (bought recently, well-stocked), **Low** (running out, buy soon), **Out** (depleted, buy now)
- Users can update via a quick tap — no modal, no form. Tap → cycle through states.
- "Mark as used" action on pantry items decrements by one level (full → low → out)

### Depletion

- After cooking, user can tap a recipe (or manually select items) to mark what was used
- Batch depletion preferred over item-by-item — don't make it tedious
- Items at "out" show prominently on the pantry screen and auto-populate the shopping list

---

## How Pantry Unlocks Everything Else

### Shopping List Generation

No more manually building a list. The list is generated from what's low or out in the pantry. User reviews, edits if needed, and goes. This alone saves 10 minutes before every Costco run and removes the cognitive load of trying to remember what you're out of.

"What do I need?" becomes a single tap.

### Recipe Matching (Cook What You Have)

With pantry state known, we can score recipes by how many ingredients the user already has. Surface the ones they can make right now at the top. This is the daily utility hook — open the app when you don't know what to make for dinner, and it tells you.

In v1, recipe matching can be simple: show recipes where 80%+ of ingredients are marked full or medium in the pantry. No AI needed initially.

### Path to Paid Tier

Free: pantry tracking, basic shopping list, basic recipe matching.

Paid unlock: pantry persistence across devices, smart restock alerts ("You cook this recipe every week — you're going to run out of olive oil in 3 days"), predictive shopping list based on cooking patterns, Costco price tracking.

The pantry is the data moat. The longer a user tracks, the smarter the suggestions get. That's the retention hook and the upgrade hook.

---

## UX Flow

```
1. ONBOARD
   App opens → "What do you usually have at home?"
   → Show Costco staples list
   → User marks each as Full / Low / Out (or skips)
   → Pantry is seeded

2. COOK
   User browses "Cook Tonight" — recipes ranked by pantry match
   → Selects a recipe → Sees what they have / what they're missing
   → Cooks

3. DEPLETE
   After cooking → "Mark items used"
   → Batch-select ingredients from that recipe
   → Quantities update automatically

4. GET SUGGESTIONS
   Next time → Cook Tonight re-ranks based on updated pantry
   → Items going low appear in a "Running Low" section on home screen

5. RESTOCK
   "Shopping List" tab shows everything that's Low or Out
   → One tap to generate the Costco run list
   → User can add extra items manually
   → Take the list to Costco
```

---

## Implementation Notes

### Supabase Tables

```sql
-- Core pantry items master list (global / seeded from staples)
CREATE TABLE pantry_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  category    text NOT NULL, -- 'produce' | 'protein' | 'pantry_staple' | 'dairy' | 'frozen' | 'other'
  is_staple   boolean DEFAULT false, -- seeded from Costco staples list
  created_at  timestamptz DEFAULT now()
);

-- Per-user pantry state
CREATE TABLE user_pantry (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pantry_item_id  uuid NOT NULL REFERENCES pantry_items(id) ON DELETE CASCADE,
  quantity_level  text NOT NULL DEFAULT 'full', -- 'full' | 'low' | 'out'
  updated_at      timestamptz DEFAULT now(),
  UNIQUE (user_id, pantry_item_id)
);

-- Index for fast pantry lookups per user
CREATE INDEX idx_user_pantry_user_id ON user_pantry(user_id);
CREATE INDEX idx_user_pantry_quantity ON user_pantry(user_id, quantity_level);
```

### React Native / Expo Screens

| Screen | Purpose |
|---|---|
| `PantryOnboardScreen` | First-run seed flow — shows staples list, user marks levels |
| `PantryHomeScreen` | Current pantry state — grouped by category, filter by level |
| `PantryItemDetailScreen` | Tap item to update quantity, view history (v2 feature) |
| `CookTonightScreen` | Recipe list sorted by pantry match %, tap to see detail |
| `MarkUsedScreen` | Post-cooking depletion — batch-select ingredients |
| `ShoppingListScreen` | Auto-generated from low/out items + manual add |

### Expo / RN Approach

- Expo SDK (managed workflow) — keep it simple, no custom native modules needed in v1
- Local state via Zustand or React Query for pantry cache — don't hit Supabase on every render
- Optimistic updates on quantity changes — feel instant, sync in background
- Supabase Realtime not needed in v1 — single-user pantry, no live collaboration
- Offline-first consideration: cache pantry state locally (AsyncStorage or MMKV), sync on reconnect. Costco is a concrete building — connectivity is not guaranteed.

---

## What NOT to Build in v1

Keep scope tight. These are explicitly out:

- **Barcode scanning** — adds hardware complexity, requires a product database, solves a problem users don't have yet. Users know what they bought at Costco.
- **Recipe database** — start with a curated short list (10-15 Costco-friendly recipes). Building a full recipe DB is a different product.
- **Social features** — sharing pantries, shared household lists, family accounts. Single-user first.
- **Expiry date tracking** — useful eventually, not the core problem. Adds data entry friction.
- **Unit-level quantity tracking** — "2.5 lbs of chicken" is overkill. Full/Low/Out is enough to drive behavior.
- **AI-generated meal plans** — tempting, but unproven. Get the pantry loop right first.
- **Push notifications** — no alerts, no reminders in v1. Ship the core, see what users actually want.

The v1 goal is: prove the pantry loop works and that users will maintain it. Everything else is a distraction until that's validated.

---

## Open Questions

- Do we pre-populate `pantry_items` from the existing Costco staples list in the repo, or let it grow user-contributed? Start pre-populated.
- Quantity: 3 levels (full/low/out) or 5 (full/good/low/almost out/out)? 3. Don't overthink it.
- Recipe matching threshold: 80%? 70%? Test with real data. Default to 70% to surface more options.
- Should "Mark as Used" be recipe-linked or freeform? Both — recipe-linked for common case, freeform for when they just used stuff without cooking a named recipe.
