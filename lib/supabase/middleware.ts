/**
 * Supabase session refresh + auth gating used by middleware.ts.
 *
 * - Refreshes the user's session cookies on every request.
 * - Redirects unauthenticated users away from /(app)/* routes.
 * - Redirects users without an active subscription away from /(app)/* into /pricing.
 *
 * Marketing pages (/, /about, /pricing, /privacy, /terms) and auth
 * pages (/login, /signup, /forgot-password) are always public.
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = [
  "/onboarding",
  "/pantry",
  "/recipes",
  "/shopping-list",
  "/shopping",
  "/scan",
  "/settings",
];

const AUTH_ROUTES = ["/login", "/signup", "/forgot-password"];

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: getUser() refreshes the session on every call.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
  const isAuthPage = AUTH_ROUTES.includes(path);

  if (isProtected && !user) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/login";
    redirect.searchParams.set("next", path);
    return NextResponse.redirect(redirect);
  }

  if (isAuthPage && user) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/recipes";
    return NextResponse.redirect(redirect);
  }

  // Subscription gating for protected routes.
  // Subscription is required BEFORE onboarding (per project memory:
  // subscription-before-onboarding overrides the spec's preferences-before-paywall).
  if (isProtected && user) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("subscription_status, onboarded_at")
      .eq("user_id", user.id)
      .single();

    const status = profile?.subscription_status;
    if (!status || !ACTIVE_SUBSCRIPTION_STATUSES.has(status)) {
      const redirect = request.nextUrl.clone();
      redirect.pathname = "/pricing";
      return NextResponse.redirect(redirect);
    }

    // Onboarding required after subscription, before any other gated route.
    if (
      profile?.onboarded_at == null &&
      path !== "/onboarding" &&
      !path.startsWith("/onboarding/")
    ) {
      const redirect = request.nextUrl.clone();
      redirect.pathname = "/onboarding";
      return NextResponse.redirect(redirect);
    }
  }

  return response;
}

function requireEnv(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env var: ${key}`);
  return v;
}
