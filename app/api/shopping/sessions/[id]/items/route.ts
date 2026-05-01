/**
 * POST /api/shopping/sessions/:id/items — add an item to the session.
 *
 * Body: { ingredient_id, source_sku_id?, quantity }
 *
 * Quantity is in the ingredient's canonical_unit. The client computes the
 * total (e.g. 1 pack × 2948g for a SKU = 2948g, 2 packs = 5896g).
 *
 * If an item with the same ingredient_id + source_sku_id already exists in
 * this session, the quantity is incremented rather than creating a duplicate.
 */

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const Body = z.object({
  ingredient_id: z.string().uuid(),
  source_sku_id: z.string().uuid().nullable().optional(),
  quantity: z.number().int().positive(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: sessionId } = await params;
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

  const skuId = parsed.data.source_sku_id ?? null;

  // Look for an existing matching row.
  let existingQ = supabase
    .from("shopping_session_items")
    .select("id, quantity")
    .eq("session_id", sessionId)
    .eq("ingredient_id", parsed.data.ingredient_id);
  existingQ = skuId == null ? existingQ.is("source_sku_id", null) : existingQ.eq("source_sku_id", skuId);

  const { data: existing } = await existingQ.maybeSingle();
  if (existing) {
    const { data, error } = await supabase
      .from("shopping_session_items")
      .update({ quantity: existing.quantity + parsed.data.quantity })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ item: data });
  }

  const { data, error } = await supabase
    .from("shopping_session_items")
    .insert({
      session_id: sessionId,
      ingredient_id: parsed.data.ingredient_id,
      source_sku_id: skuId,
      quantity: parsed.data.quantity,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}
