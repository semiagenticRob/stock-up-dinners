import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { Section } from "@/components/marketing/Section";
import "../../(marketing)/marketing.css";

export const metadata: Metadata = {
  title: "Welcome aboard",
  description: "Your Stock Up Dinners subscription is active.",
  robots: { index: false, follow: false },
};

export default function BillingSuccessPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Section>
          <p className="eyebrow">You&apos;re in</p>
          <h1>Welcome aboard.</h1>
          <p className="lede">
            Your subscription is active. The 7-day free trial starts now — you can cancel anytime
            from <Link href="/settings">settings</Link>.
          </p>
          <p style={{ marginTop: 32 }}>
            <Link href="/onboarding" className="btn">
              Open your kitchen
            </Link>
          </p>
        </Section>
      </main>
      <Footer />
    </>
  );
}
