/**
 * PUT    /api/par-overrides/:ingredientId  — upsert (par_quantity and/or threshold_pct).
 * DELETE /api/par-overrides/:ingredientId  — remove the override row, reverting to defaults.
 *
 * Body for PUT:
 *   { par_quantity?: number | null, threshold_pct?: number | null }
 *
 * If both fields are null/absent, the row is still created/updated; semantically
 * it's equivalent to "no override" but harmless. The DELETE endpoint is the
 * canonical way to revert.
 */

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const PutBody = z
  .object({
    par_quantity: z.number().int().positive().nullable().optional(),
    threshold_pct: z.number().int().min(1).max(100).nullable().optional(),
  })
  .strict();

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ ingredientId: string }> },
) {
  const { ingredientId } = await params;
  if (!isUuid(ingredientId)) {
    return NextResponse.json({ error: "Invalid ingredient id" }, { status: 400 });
  }
  const parsed = PutBody.safeParse(await request.json().catch(() => ({})));
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

  // Verify the ingredient exists in the catalog (avoids dangling FK errors).
  const { data: ingRow, error: ingErr } = await supabase
    .from("ingredients")
    .select("id")
    .eq("id", ingredientId)
    .single();
  if (ingErr || !ingRow) {
    return NextResponse.json({ error: "Unknown ingredient" }, { status: 400 });
  }

  const row = {
    user_id: user.id,
    ingredient_id: ingredientId,
    par_quantity: parsed.data.par_quantity ?? null,
    threshold_pct: parsed.data.threshold_pct ?? null,
  };
  const { data, error } = await supabase
    .from("pantry_par_overrides")
    .upsert(row, { onConflict: "user_id,ingredient_id" })
    .select()
    .single();
  if (error) {
    console.error("par_override upsert failed", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ override: data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ ingredientId: string }> },
) {
  const { ingredientId } = await params;
  if (!isUuid(ingredientId)) {
    return NextResponse.json({ error: "Invalid ingredient id" }, { status: 400 });
  }
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { error } = await supabase
    .from("pantry_par_overrides")
    .delete()
    .eq("user_id", user.id)
    .eq("ingredient_id", ingredientId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isUuid(s: string): boolean {
  return UUID_RE.test(s);
}
