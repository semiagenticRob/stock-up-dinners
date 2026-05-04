import Link from "next/link";
import { Wordmark } from "./Wordmark";

export function Header() {
  return (
    <header className="header">
      <div className="shell header__inner">
        <Link href="/" aria-label="Stock Up Dinners home" className="header__brand">
          <Wordmark />
        </Link>
        <Link href="/signup" className="header__cta">
          Start free trial →
        </Link>
      </div>
    </header>
  );
}
