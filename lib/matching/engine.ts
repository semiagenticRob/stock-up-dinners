/**
 * Recipe matching engine (spec § 6.1).
 *
 * Pure function. Given a pantry snapshot, the recipe + ingredient catalog,
 * the user's preferences, and recent suggestions, returns a sorted list of
 * recipe matches each annotated with a tier and per-ingredient status.
 *
 * Tiers (in display order):
 *   1. cookable + uses_perishable — every required ingredient satisfied
 *      DIRECT or ASSUMED, AND at least one ingredient draws on a soon-expiring
 *      lot. Sorted by earliest-expiring ingredient ASC.
 *   2. cookable — every required ingredient satisfied DIRECT or ASSUMED.
 *      Sorted by least-recently-suggested first.
 *   3. substitutable — ≥1 ingredient SUBSTITUTED, none MISSING.
 *      Sorted by least-recently-suggested first.
 *   4. almost — exactly one non-optional ingredient MISSING.
 *      Sorted alphabetically (placeholder; spec § 6.1 step 4d).
 *
 * Variety pass: within each tier, demote any recipe suggested in the last
 * 48 hours to the bottom of that tier.
 *
 * Cap: 30 results.
 */

import type {
  Ingredient,
  PantryLot,
  Recipe,
  SubstitutionGroup,
  UserPreferences,
} from "@/lib/types";

export interface MatchInput {
  pantry: PantryLot[];
  recipes: Recipe[];
  ingredients: Ingredient[];
  substitutionGroups: SubstitutionGroup[];
  preferences: UserPreferences;
  /** recipe_id → most-recent suggested_at timestamp */
  recentlySuggested: Map<string, Date>;
  /** Override "now" for deterministic testing. */
  now?: Date;
}

export type IngredientStatus = "ASSUMED" | "DIRECT" | "SUBSTITUTED" | "MISSING";

export interface IngredientMatchStatus {
  recipe_ingredient_id: string;
  /** The recipe's required ingredient ID (NOT the substitute). */
  ingredient_id: string;
  status: IngredientStatus;
  substituted_with_ingredient_id?: string;
  /** Earliest expiring lot for the ingredient that satisfied this requirement, if any. */
  earliest_expiring_used?: Date | null;
}

export type Tier = "cookable" | "substitutable" | "almost";

export interface RecipeMatch {
  recipe: Recipe;
  tier: Tier;
  uses_perishable: boolean;
  /** Earliest expiry across all ingredients that this recipe will use. */
  earliest_expiring_used: Date | null;
  ingredient_status: IngredientMatchStatus[];
}

const RESULT_CAP = 30;
const VARIETY_DEMOTE_HOURS = 48;
const MS_PER_HOUR = 60 * 60 * 1000;
const MS_PER_DAY = 24 * MS_PER_HOUR;

export function matchRecipes(input: MatchInput): RecipeMatch[] {
  const now = input.now ?? new Date();
  const useSoonMs = input.preferences.use_soon_threshold_days * MS_PER_DAY;

  const ingById = new Map(input.ingredients.map((i) => [i.id, i]));
  const groupMembers = new Map(
    input.substitutionGroups.map((g) => [g.id, new Set(g.member_ingredient_ids)]),
  );

  // --- Pantry projection: ingredient_id → { total_remaining, earliest_expires_on } ---
  const pantryByIngredient = new Map<
    string,
    { total: number; earliest: Date | null }
  >();
  for (const lot of input.pantry) {
    if (lot.is_depleted || lot.quantity_remaining <= 0) continue;
    const cur = pantryByIngredient.get(lot.ingredient_id) ?? {
      total: 0,
      earliest: null,
    };
    cur.total += lot.quantity_remaining;
    if (lot.expires_on) {
      cur.earliest =
        cur.earliest == null || lot.expires_on < cur.earliest ? lot.expires_on : cur.earliest;
    }
    pantryByIngredient.set(lot.ingredient_id, cur);
  }

  const matches: RecipeMatch[] = [];

  for (const recipe of input.recipes) {
    if (!recipe.is_active) continue;

    // Filter: hard exclusions before doing any work.
    if (violatesPreferences(recipe, ingById, input.preferences)) continue;

    const statuses: IngredientMatchStatus[] = [];
    let missingCount = 0;
    let substitutedCount = 0;
    let earliestUsed: Date | null = null;

    for (const ri of recipe.ingredients) {
      const recipeIng = ingById.get(ri.ingredient_id);
      // If we don't know about an ingredient referenced by the recipe, treat
      // as MISSING so the user is never surprised.
      if (!recipeIng) {
        if (!ri.is_optional) missingCount++;
        statuses.push({
          recipe_ingredient_id: ri.id,
          ingredient_id: ri.ingredient_id,
          status: "MISSING",
        });
        continue;
      }

      if (recipeIng.is_assumed_staple) {
        statuses.push({
          recipe_ingredient_id: ri.id,
          ingredient_id: ri.ingredient_id,
          status: "ASSUMED",
        });
        continue;
      }

      // DIRECT match check.
      const direct = pantryByIngredient.get(ri.ingredient_id);
      if (direct && direct.total >= ri.quantity) {
        statuses.push({
          recipe_ingredient_id: ri.id,
          ingredient_id: ri.ingredient_id,
          status: "DIRECT",
          earliest_expiring_used: direct.earliest,
        });
        if (
          direct.earliest &&
          (earliestUsed == null || direct.earliest < earliestUsed)
        ) {
          earliestUsed = direct.earliest;
        }
        continue;
      }

      // SUBSTITUTED match check (only if recipe allows + ingredient has a group).
      let substitute: { ingredient_id: string; earliest: Date | null } | null = null;
      if (ri.allow_substitution && recipeIng.substitution_group_id) {
        const peers = groupMembers.get(recipeIng.substitution_group_id) ?? new Set<string>();
        // Pick the peer with most total — biased toward "use what you've got most of".
        let bestPeer: { id: string; total: number; earliest: Date | null } | null = null;
        for (const peerId of peers) {
          if (peerId === ri.ingredient_id) continue;
          const peerStock = pantryByIngredient.get(peerId);
          if (!peerStock || peerStock.total < ri.quantity) continue;
          if (bestPeer == null || peerStock.total > bestPeer.total) {
            bestPeer = { id: peerId, total: peerStock.total, earliest: peerStock.earliest };
          }
        }
        if (bestPeer) {
          substitute = { ingredient_id: bestPeer.id, earliest: bestPeer.earliest };
        }
      }

      if (substitute) {
        substitutedCount++;
        statuses.push({
          recipe_ingredient_id: ri.id,
          ingredient_id: ri.ingredient_id,
          status: "SUBSTITUTED",
          substituted_with_ingredient_id: substitute.ingredient_id,
          earliest_expiring_used: substitute.earliest,
        });
        if (
          substitute.earliest &&
          (earliestUsed == null || substitute.earliest < earliestUsed)
        ) {
          earliestUsed = substitute.earliest;
        }
        continue;
      }

      // MISSING.
      if (!ri.is_optional) missingCount++;
      statuses.push({
        recipe_ingredient_id: ri.id,
        ingredient_id: ri.ingredient_id,
        status: "MISSING",
      });
    }

    // Tier the recipe.
    let tier: Tier;
    if (missingCount > 1) {
      continue; // exclude — too many missing
    } else if (missingCount === 1) {
      tier = "almost";
    } else if (substitutedCount > 0) {
      tier = "substitutable";
    } else {
      tier = "cookable";
    }

    const usesPerishable =
      tier !== "almost" &&
      earliestUsed != null &&
      earliestUsed.getTime() - now.getTime() <= useSoonMs;

    matches.push({
      recipe,
      tier,
      uses_perishable: usesPerishable,
      earliest_expiring_used: earliestUsed,
      ingredient_status: statuses,
    });
  }

  // Sort in tier display order, with variety demotion within each tier.
  matches.sort((a, b) => {
    const tierOrder = (m: RecipeMatch) => {
      if (m.tier === "cookable" && m.uses_perishable) return 0;
      if (m.tier === "cookable") return 1;
      if (m.tier === "substitutable") return 2;
      return 3; // almost
    };
    const aTier = tierOrder(a);
    const bTier = tierOrder(b);
    if (aTier !== bTier) return aTier - bTier;

    // Within tier: variety demote (recently suggested → bottom).
    const aRecent = isRecentlySuggested(input.recentlySuggested.get(a.recipe.id), now);
    const bRecent = isRecentlySuggested(input.recentlySuggested.get(b.recipe.id), now);
    if (aRecent !== bRecent) return aRecent ? 1 : -1;

    // Tier-specific tiebreakers.
    if (aTier === 0) {
      // perishable cookable: earliest-expiring first
      const aT = a.earliest_expiring_used?.getTime() ?? Number.POSITIVE_INFINITY;
      const bT = b.earliest_expiring_used?.getTime() ?? Number.POSITIVE_INFINITY;
      if (aT !== bT) return aT - bT;
    }
    if (a.tier === "almost") {
      return a.recipe.slug.localeCompare(b.recipe.slug);
    }
    // cookable / substitutable: least-recently-suggested first.
    const aSugg = input.recentlySuggested.get(a.recipe.id)?.getTime() ?? 0;
    const bSugg = input.recentlySuggested.get(b.recipe.id)?.getTime() ?? 0;
    return aSugg - bSugg;
  });

  return matches.slice(0, RESULT_CAP);
}

function isRecentlySuggested(at: Date | undefined, now: Date): boolean {
  if (!at) return false;
  return now.getTime() - at.getTime() < VARIETY_DEMOTE_HOURS * MS_PER_HOUR;
}

function violatesPreferences(
  recipe: Recipe,
  ingById: Map<string, Ingredient>,
  prefs: UserPreferences,
): boolean {
  // Blocked meats (recipe-level fast path)
  if (prefs.blocked_meats.length > 0) {
    for (const m of recipe.meat_types) {
      if (prefs.blocked_meats.includes(m)) return true;
    }
  }
  // Per-ingredient checks
  for (const ri of recipe.ingredients) {
    const ing = ingById.get(ri.ingredient_id);
    if (!ing) continue;
    if (prefs.blocked_ingredients.includes(ing.id)) return true;
    for (const a of ing.allergen_tags) {
      if (prefs.allergens.includes(a)) return true;
    }
    // Dietary filter is a positive predicate: every ingredient must satisfy it.
    for (const required of prefs.dietary_filters) {
      if (!ing.dietary_tags.includes(required)) return true;
    }
  }
  return false;
}
