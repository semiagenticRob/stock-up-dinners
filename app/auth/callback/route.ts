/**
 * OAuth + email-confirmation callback. Supabase redirects here after the
 * user clicks a magic link, completes Google sign-in, or follows a password
 * reset link. Exchanges the `?code=` for a session, then bounces to `next`.
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/recipes";

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const back = new URL(url);
      back.pathname = "/login";
      back.searchParams.set("error", error.message);
      return NextResponse.redirect(back);
    }
  }

  const dest = new URL(url);
  dest.pathname = next;
  dest.search = "";
  return NextResponse.redirect(dest);
}
