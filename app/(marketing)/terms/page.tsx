import type { Metadata } from "next";
import { Section } from "@/components/marketing/Section";

export const metadata: Metadata = {
  title: "Terms of use",
  description: "Terms governing use of the Stock Up Dinners app and content.",
};

const UPDATED = "2026-05-04";

export default function TermsPage() {
  return (
    <Section>
      <p className="eyebrow">Last updated {UPDATED}</p>
      <h1>Terms of use</h1>
      <div className="prose">
        <h3>Acceptable use</h3>
        <p>
          A Stock Up Dinners subscription gives you the right to use the app and follow the recipes
          for personal household use. One account per household.
        </p>

        <h3>Subscription &amp; billing</h3>
        <p>
          Subscriptions renew automatically at the end of each billing period (monthly or annually,
          depending on the plan you chose). You can cancel anytime from the Settings page or via
          the Stripe customer portal — cancellation is effective at the end of your current period.
          Annual plans are eligible for a refund within 14 days of purchase if you have not used the
          app extensively. We do not offer pro-rata refunds for monthly cancellations.
        </p>

        <h3>Content ownership</h3>
        <p>
          The recipes, catalog, copy, and design are the original work of Stock Up Dinners.
          Don&apos;t republish, resell, or redistribute the recipes or app content. Sharing the link
          is great. Copy-pasting the contents to your own site or selling them is not.
        </p>

        <h3>No warranties</h3>
        <p>
          The meal plans are provided as-is. Cook times, pack sizes, and ingredient availability are
          best-efforts but not guaranteed — Costco inventory varies by region. Check ingredient
          labels for allergens. We&apos;re not liable for kitchen mishaps, supply substitutions, or
          picky eaters.
        </p>

        <h3>Changes</h3>
        <p>
          These terms may be updated as the project evolves. Substantive changes will be reflected
          in the &ldquo;last updated&rdquo; date above. We&apos;ll email subscribers when material
          changes happen.
        </p>

        <h3>Contact</h3>
        <p>Questions? Use the support form linked from your account Settings page.</p>
      </div>
    </Section>
  );
}
