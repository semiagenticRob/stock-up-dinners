/**
 * POST /api/onboarding/complete
 *
 * Atomically finalize onboarding:
 *   - upsert user_preferences
 *   - insert any seed pantry_lots
 *   - mark user_profiles.onboarded_at = now()
 *
 * Best-effort atomicity at the application layer — if any step fails the
 * caller should retry. The most-load-bearing step (onboarded_at) runs last,
 * so a failure midway leaves the user on /onboarding.
 */

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { insertLot } from "@/lib/db/pantry";
import { toIngredient, type IngredientRow } from "@/lib/db/mappers";

const Body = z.object({
  preferences: z.object({
    dietary_filters: z.array(z.string()).default([]),
    blocked_meats: z.array(z.string()).default([]),
    allergens: z.array(z.string()).default([]),
    blocked_ingredients: z.array(z.string().uuid()).default([]),
    use_soon_threshold_days: z.number().int().min(1).max(14).optional(),
    default_threshold_pct: z.number().int().min(1).max(100).optional(),
  }),
  pantry_seed: z
    .array(
      z.object({
        ingredient_id: z.string().uuid(),
        quantity_initial: z.number().int().positive(),
        storage_state: z.enum(["pantry", "refrigerated", "frozen"]).optional(),
      }),
    )
    .default([]),
});

export async function POST(request: NextRequest) {
  const parsed = Body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  // 1. Upsert preferences (handle_new_user trigger guarantees the row exists,
  //    so update suffices).
  const prefUpdate: Record<string, unknown> = { ...parsed.data.preferences };
  const { error: prefErr } = await supabase
    .from("user_preferences")
    .update(prefUpdate)
    .eq("user_id", user.id);
  if (prefErr) {
    console.error("preferences update failed", prefErr);
    return NextResponse.json({ error: "Could not save preferences" }, { status: 500 });
  }

  // 2. Pantry seed inserts. Today's acquired_on; storage state defaults to
  //    the ingredient's default_storage if not specified.
  if (parsed.data.pantry_seed.length > 0) {
    const ingIds = parsed.data.pantry_seed.map((s) => s.ingredient_id);
    const { data: ingRows, error: ingErr } = await supabase
      .from("ingredients")
      .select("*")
      .in("id", ingIds);
    if (ingErr) throw ingErr;
    const ingById = new Map(
      ((ingRows ?? []) as IngredientRow[]).map((r) => [r.id, toIngredient(r)] as const),
    );

    const today = new Date();
    for (const seed of parsed.data.pantry_seed) {
      const ing = ingById.get(seed.ingredient_id);
      if (!ing) continue; // skip unknown ingredients silently
      try {
        await insertLot(supabase, user.id, ing, {
          ingredient_id: seed.ingredient_id,
          quantity_initial: seed.quantity_initial,
          acquired_on: today,
          storage_state: seed.storage_state ?? ing.default_storage,
        });
      } catch (err) {
        console.error("seed insert failed for", seed.ingredient_id, err);
        // Continue; partial seeds are better than none. The user can add
        // missing ones from /pantry/add.
      }
    }
  }

  // 3. Mark onboarded_at last so a mid-flow failure leaves the user on /onboarding.
  const { error: profErr } = await supabase
    .from("user_profiles")
    .update({ onboarded_at: new Date().toISOString() })
    .eq("user_id", user.id);
  if (profErr) {
    console.error("profile update failed", profErr);
    return NextResponse.json({ error: "Could not finalize onboarding" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
