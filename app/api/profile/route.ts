/**
 * PATCH /api/profile — update display_name on the user_profiles row.
 *
 * Email change is handled directly via supabase.auth.updateUser({ email })
 * from the client (triggers a confirmation email). Password change is
 * triggered via supabase.auth.resetPasswordForEmail in the client too —
 * those calls don't need a server route, the browser client speaks to
 * Supabase Auth directly with the user's session.
 */

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const PatchBody = z
  .object({
    display_name: z.string().trim().min(1).max(120).nullable(),
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

  const { error } = await supabase
    .from("user_profiles")
    .update({ display_name: parsed.data.display_name })
    .eq("user_id", user.id);
  if (error) {
    console.error("profile update failed", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
