import Link from "next/link";
import { Wordmark } from "./Wordmark";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="shell footer__inner">
        <Wordmark size="sm" />
        <nav className="footer__nav" aria-label="Footer">
          <Link href="/about">About</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </nav>
      </div>
      <div className="shell footer__legal">© {year} Stock Up Dinners.</div>
    </footer>
  );
}
