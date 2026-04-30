import type { Metadata } from "next";
import { Section } from "@/components/marketing/Section";

export const metadata: Metadata = {
  title: "Terms of use",
  description: "Terms governing use of the Stock Up Dinners site and content.",
};

const UPDATED = "2026-04-28";

export default function TermsPage() {
  return (
    <Section>
      <p className="eyebrow">Last updated {UPDATED}</p>
      <h1>Terms of use</h1>
      <div className="prose">
        <h3>Acceptable use</h3>
        <p>
          You&apos;re welcome to use this site, sign up for the newsletter, download the free PDF,
          and follow the recipes for personal household use.
        </p>

        <h3>Content ownership</h3>
        <p>
          The recipes, meal plans, copy, and design on this site are the original work of Stock Up
          Dinners. Don&apos;t republish, resell, or redistribute the PDFs or page content. Sharing
          the link is great. Copy-pasting the contents to your own site or selling them is not.
        </p>

        <h3>No warranties</h3>
        <p>
          The meal plans are provided as-is. Cost estimates, cook times, and ingredient availability
          are best-efforts but not guaranteed — Costco inventory varies by region. Check ingredient
          labels for allergens. We&apos;re not liable for kitchen mishaps, supply substitutions, or
          picky eaters.
        </p>

        <h3>Changes</h3>
        <p>
          These terms may be updated as the project evolves. Substantive changes will be reflected
          in the &ldquo;last updated&rdquo; date above.
        </p>

        <h3>Contact</h3>
        <p>Questions?</p>
      </div>
    </Section>
  );
}
