import type { Metadata } from "next";
import Link from "next/link";
import { Section } from "@/components/marketing/Section";

export const metadata: Metadata = {
  title: "Check your email",
  description: "The Stock Up Dinners free 14-dinner meal plan is on its way.",
  robots: { index: false, follow: false },
};

export default function ThanksPage() {
  return (
    <Section>
      <p className="eyebrow">Almost there</p>
      <h1>Check your email.</h1>
      <p className="lede">
        The PDF is on its way and should arrive within a minute. If you don&apos;t see it, check
        spam or promotions.
      </p>
      <p className="lede" style={{ marginTop: 32 }}>
        <Link
          href="/"
          style={{
            color: "var(--c-ink)",
            borderBottom: "1.5px solid var(--c-accent)",
            textDecoration: "none",
            paddingBottom: 1,
          }}
        >
          ← Back to the home page
        </Link>
      </p>
    </Section>
  );
}
