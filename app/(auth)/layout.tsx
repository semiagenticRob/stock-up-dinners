import type { ReactNode } from "react";
import Link from "next/link";
import { Wordmark } from "@/components/marketing/Wordmark";
import "../(marketing)/marketing.css";
import "./auth.css";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth-shell">
      <header className="auth-header">
        <div className="container auth-header__inner">
          <Link href="/" aria-label="Stock Up Dinners home">
            <Wordmark />
          </Link>
        </div>
      </header>
      <main className="auth-main">
        <div className="container auth-container">{children}</div>
      </main>
    </div>
  );
}
