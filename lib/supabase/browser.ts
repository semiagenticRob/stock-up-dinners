/**
 * Supabase browser client. Use in Client Components ("use client").
 * Reads the same session cookies as the server client.
 *
 * Important: env reads here MUST use literal `process.env.NEXT_PUBLIC_*`
 * references — Next bakes those into the client bundle at build time. A
 * dynamic `process.env[someVariable]` lookup leaves the value as `undefined`
 * in the bundle and the client throws at runtime.
 */

import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url) throw new Error("Missing env var: NEXT_PUBLIC_SUPABASE_URL");
  if (!anonKey) throw new Error("Missing env var: NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return createBrowserClient(url, anonKey);
}
