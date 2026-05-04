import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Wordmark } from "@/components/marketing/Wordmark";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import "../(marketing)/marketing.css";
import "./app-shell.css";

// Always render at request time — these routes are session-bound, so there's
// nothing meaningful to prerender at build.
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  // Defense-in-depth — middleware should already gate this, but if a user
  // hits a gated page during a session edge case we want to fail closed.
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="app-shell">
      <header className="app-nav">
        <div className="shell app-nav__inner">
          <Link href="/recipes" aria-label="Stock Up Dinners home">
            <Wordmark />
          </Link>
          <nav className="app-nav__links">
            <Link href="/recipes">Recipes</Link>
            <Link href="/pantry">Pantry</Link>
            <Link href="/shopping-list">Shopping list</Link>
            <Link href="/settings">Settings</Link>
          </nav>
        </div>
      </header>
      <main className="app-main">
        <div className="shell">{children}</div>
      </main>
    </div>
  );
}
