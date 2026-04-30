/**
 * Supabase server-side client. Use in:
 *   - Server Components (`app/(app)/.../page.tsx`)
 *   - Route handlers (`app/api/.../route.ts`)
 *   - Server Actions
 *
 * Reads the user's session cookies (set by middleware) so RLS policies
 * see the right `auth.uid()`.
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll is called from Server Components which can't write
            // cookies. Middleware handles refresh; ignore here.
          }
        },
      },
    },
  );
}

function requireEnv(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env var: ${key}`);
  return v;
}
