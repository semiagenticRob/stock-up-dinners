import Link from "next/link";
import { Wordmark } from "./Wordmark";

export function Header() {
  return (
    <header className="header">
      <div className="container header__inner">
        <Link href="/" aria-label="Stock Up Dinners home" className="header__brand">
          <Wordmark />
        </Link>
        <a
          href="https://stockupdinners.beehiiv.com/subscribe"
          className="header__cta"
          data-signup-link
        >
          Get the free plan →
        </a>
      </div>
    </header>
  );
}
