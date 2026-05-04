/**
 * GET  /api/preferences   — load the authenticated user's preferences row.
 * PATCH /api/preferences  — partial update; only the supplied fields are written.
 *
 * The `handle_new_user` Postgres trigger guarantees a row exists, so PATCH
 * always lands on an existing row; no upsert needed.
 */

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadPreferences } from "@/lib/db/preferences";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const preferences = await loadPreferences(supabase);
  return NextResponse.json({ preferences });
}

const PatchBody = z
  .object({
    dietary_filters: z.array(z.string()).optional(),
    blocked_meats: z.array(z.string()).optional(),
    allergens: z.array(z.string()).optional(),
    blocked_ingredients: z.array(z.string().uuid()).optional(),
    use_soon_threshold_days: z.number().int().min(1).max(14).optional(),
    default_threshold_pct: z.number().int().min(1).max(100).optional(),
  })
  .strict();

export async function PATCH(request: NextRequest) {
  const parsed = PatchBody.safeParse(await request.json().catch(() => ({})));
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

  const update = parsed.data;
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Empty update" }, { status: 400 });
  }
  const { error } = await supabase
    .from("user_preferences")
    .update(update)
    .eq("user_id", user.id);
  if (error) {
    console.error("preferences update failed", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
