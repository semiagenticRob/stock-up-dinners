/**
 * GET /api/par-overrides — list the authenticated user's par/threshold overrides.
 * RLS handles the user filter.
 */

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadParOverrides } from "@/lib/db/shopping";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const overrides = await loadParOverrides(supabase);
  return NextResponse.json({ overrides });
}
