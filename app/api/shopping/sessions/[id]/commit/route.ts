/**
 * POST /api/shopping/sessions/:id/commit
 *
 * Calls the commit_shopping_session() RPC, which atomically:
 *   - inserts a pantry_lots row for each session_item (with shelf-life-derived
 *     expires_on)
 *   - marks the session committed_at = now()
 *
 * Returns the count of pantry lots created.
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

  const { data: count, error } = await supabase.rpc("commit_shopping_session", {
    p_session_id: id,
  });
  if (error) {
    console.error("commit_shopping_session rpc failed", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ lots_created: count });
}
