/**
 * POST /api/cook-events/:id/revert
 *
 * Calls the revert_cook_event() RPC, which atomically:
 *   - re-credits each consumed lot's quantity_remaining
 *   - clears is_depleted on previously-depleted lots
 *   - sets reverted_at on the cook event
 *
 * Idempotent: a second revert call on the same event raises on the SQL side.
 */

import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { error } = await supabase.rpc("revert_cook_event", { p_cook_event_id: id });
  if (error) {
    console.error("revert_cook_event rpc failed", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
