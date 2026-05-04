import type { Metadata } from "next";
import { Section } from "@/components/marketing/Section";
import { StartTrialButton } from "@/components/marketing/StartTrialButton";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Stock Up Dinners subscription pricing — $14.99/mo or $124.99/yr. 7-day free trial.",
};

export default function PricingPage() {
  return (
    <Section>
      <p className="eyebrow">Pricing</p>
      <h1>One subscription. Every meal you cook.</h1>
      <p className="lede">
        Both plans include a 7-day free trial. Cancel anytime from your account.
      </p>

      <div className="pricing-grid">
        <div className="pricing-card">
          <p className="pricing-card__eyebrow">Monthly</p>
          <p className="pricing-card__price">
            $14.99
            <span className="pricing-card__price-period">/mo</span>
          </p>
          <ul>
            <li>Pantry tracker with expiration awareness</li>
            <li>14 Costco-anchored recipes (and growing)</li>
            <li>Auto-generated shopping lists</li>
            <li>Live shopping mode for in-store</li>
            <li>Substitution-aware recipe suggestions</li>
            <li>Cancel anytime</li>
          </ul>
          <StartTrialButton plan="monthly" />
        </div>

        <div className="pricing-card pricing-card--featured">
          <p className="pricing-card__eyebrow">Annual</p>
          <p className="pricing-card__price">
            $124.99
            <span className="pricing-card__price-period">/yr</span>
          </p>
          <p className="pricing-card__save">Save 30% vs monthly · ≈ $10.42/mo</p>
          <ul>
            <li>Everything in monthly</li>
            <li>Roughly four months free</li>
            <li>Locked-in price for the year</li>
            <li>Cancel anytime; refund within 14 days</li>
          </ul>
          <StartTrialButton plan="annual" />
        </div>
      </div>
    </Section>
  );
}
