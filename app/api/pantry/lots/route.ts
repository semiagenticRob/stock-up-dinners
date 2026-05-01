/**
 * POST /api/pantry/lots — create a new pantry lot for the authenticated user.
 */

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { insertLot } from "@/lib/db/pantry";
import type { IngredientRow } from "@/lib/db/mappers";
import { toIngredient } from "@/lib/db/mappers";

const Body = z.object({
  ingredient_id: z.string().uuid(),
  source_sku_id: z.string().uuid().optional().nullable(),
  quantity_initial: z.number().int().positive(),
  quantity_remaining: z.number().int().nonnegative().optional(),
  acquired_on: z.string(), // YYYY-MM-DD or ISO
  storage_state: z.enum(["pantry", "refrigerated", "frozen"]),
  expires_on: z.string().nullable().optional(), // YYYY-MM-DD; if undefined → compute
  notes: z.string().nullable().optional(),
});

export async function POST(request: NextRequest) {
  const parsed = Body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", issues: parsed.error.issues }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: ingRow, error: ingErr } = await supabase
    .from("ingredients")
    .select("*")
    .eq("id", parsed.data.ingredient_id)
    .single();
  if (ingErr || !ingRow) {
    return NextResponse.json({ error: "Unknown ingredient" }, { status: 400 });
  }
  const ingredient = toIngredient(ingRow as IngredientRow);

  const acquired_on = new Date(parsed.data.acquired_on);
  if (Number.isNaN(acquired_on.getTime())) {
    return NextResponse.json({ error: "Invalid acquired_on" }, { status: 400 });
  }
  let expires_on: Date | null | undefined = undefined;
  if (parsed.data.expires_on === null) {
    expires_on = null;
  } else if (typeof parsed.data.expires_on === "string") {
    const d = new Date(parsed.data.expires_on);
    if (Number.isNaN(d.getTime())) {
      return NextResponse.json({ error: "Invalid expires_on" }, { status: 400 });
    }
    expires_on = d;
  }

  try {
    const lot = await insertLot(supabase, user.id, ingredient, {
      ingredient_id: parsed.data.ingredient_id,
      source_sku_id: parsed.data.source_sku_id ?? null,
      quantity_initial: parsed.data.quantity_initial,
      quantity_remaining: parsed.data.quantity_remaining,
      acquired_on,
      storage_state: parsed.data.storage_state,
      ...(expires_on !== undefined ? { expires_on } : {}),
      notes: parsed.data.notes ?? null,
    });
    return NextResponse.json({ lot });
  } catch (err) {
    console.error("insertLot failed", err);
    return NextResponse.json({ error: "Insert failed" }, { status: 500 });
  }
}
