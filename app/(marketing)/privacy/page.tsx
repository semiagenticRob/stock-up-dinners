import type { Metadata } from "next";
import { Section } from "@/components/marketing/Section";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How Stock Up Dinners handles your data.",
};

const UPDATED = "2026-05-04";

export default function PrivacyPage() {
  return (
    <Section>
      <p className="eyebrow">Last updated {UPDATED}</p>
      <h1>Privacy policy</h1>
      <div className="prose">
        <h3>What we collect</h3>
        <p>
          When you sign up for an account we collect your email address. While you use the app we
          store the data you put into it: pantry items, recipes you cook, shopping sessions,
          dietary preferences. Payment processing happens through Stripe (see below); we never see
          your card number.
        </p>

        <h3>Where it lives</h3>
        <p>
          Account data is stored in{" "}
          <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">
            Supabase
          </a>{" "}
          (Postgres on AWS). Subscription billing is handled by{" "}
          <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">
            Stripe
          </a>
          . We use Stripe&apos;s hosted checkout and customer portal, so your card details never
          touch our servers.
        </p>

        <h3>Analytics</h3>
        <p>
          We use Google Analytics to measure traffic and conversion. GA4 sets cookies that may
          identify your browser; it does not collect personally identifying information like your
          email address.
        </p>

        <h3>Sharing</h3>
        <p>
          We don&apos;t sell, rent, or share your data with third parties. Supabase and Stripe
          process it on our behalf as our infrastructure providers; that&apos;s the only sharing
          that happens.
        </p>

        <h3>Cancellation &amp; deletion</h3>
        <p>
          You can cancel your subscription anytime from the Settings page in the app or via the
          Stripe customer portal. To request full deletion of your account and associated data,
          contact us through the support form (linked from your account Settings page) and
          we&apos;ll handle it within 7 days.
        </p>

        <h3>Contact</h3>
        <p>
          Questions? Use the support form linked from your account Settings page.
        </p>
      </div>
    </Section>
  );
}
