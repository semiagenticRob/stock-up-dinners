/**
 * GET /api/shopping/sessions — return the user's open session (if any), with items.
 * POST /api/shopping/sessions — start a new session, returns its id.
 *
 * Only one open session per user at a time. POST returns the existing open
 * session if one already exists rather than creating a duplicate.
 */

import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(_request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: session, error } = await supabase
    .from("shopping_sessions")
    .select("id, started_at, committed_at")
    .is("committed_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!session) return NextResponse.json({ session: null, items: [] });

  const { data: items } = await supabase
    .from("shopping_session_items")
    .select("id, ingredient_id, source_sku_id, quantity")
    .eq("session_id", session.id)
    .order("created_at", { ascending: true });
  return NextResponse.json({ session, items: items ?? [] });
}

export async function POST(_request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  // Reuse the open session if one exists.
  const { data: existing } = await supabase
    .from("shopping_sessions")
    .select("id")
    .is("committed_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existing) return NextResponse.json({ session_id: existing.id });

  const { data, error } = await supabase
    .from("shopping_sessions")
    .insert({ user_id: user.id })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ session_id: data.id });
}
