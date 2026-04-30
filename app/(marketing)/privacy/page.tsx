import type { Metadata } from "next";
import { Section } from "@/components/marketing/Section";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How Stock Up Dinners handles your data.",
};

const UPDATED = "2026-04-28";

export default function PrivacyPage() {
  return (
    <Section>
      <p className="eyebrow">Last updated {UPDATED}</p>
      <h1>Privacy policy</h1>
      <div className="prose">
        <h3>What we collect</h3>
        <p>
          When you sign up for the free meal plan, we collect your email address and any UTM
          parameters present in the URL at the time of sign-up (so we can understand which channels
          work). That&apos;s it — no name, no phone, no payment info, no demographic data.
        </p>

        <h3>Where it lives</h3>
        <p>
          Email addresses are stored in{" "}
          <a href="https://www.beehiiv.com/privacy" target="_blank" rel="noopener noreferrer">
            Beehiiv
          </a>
          , our newsletter platform. Beehiiv hosts the welcome sequence and any future newsletter
          content.
        </p>

        <h3>Analytics</h3>
        <p>
          We use Google Analytics to measure traffic, signup conversion, and channel attribution.
          GA4 sets cookies that may identify your browser; it does not collect personally
          identifying information like your email address.
        </p>

        <h3>Sharing</h3>
        <p>
          We don&apos;t sell, rent, or share your email with third parties. Beehiiv processes it on
          our behalf as our email service provider; that&apos;s the only sharing that happens.
        </p>

        <h3>Unsubscribing &amp; deletion</h3>
        <p>
          Every email we send includes a one-click unsubscribe. Unsubscribing removes you from the
          active list. To request full deletion of your record from Beehiiv, reply to any newsletter
          email and we&apos;ll handle it within 7 days.
        </p>

        <h3>Contact</h3>
        <p>Questions?</p>
      </div>
    </Section>
  );
}
