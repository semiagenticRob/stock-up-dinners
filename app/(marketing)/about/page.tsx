import type { Metadata } from "next";
import { Section } from "@/components/marketing/Section";
import { SignupForm } from "@/components/marketing/SignupForm";

export const metadata: Metadata = {
  title: "About",
  description: "Why Stock Up Dinners exists, and who's behind it.",
};

export default function AboutPage() {
  return (
    <Section>
      <p className="eyebrow">About</p>
      <h1>The kitchen runs on Costco. The plan should too.</h1>
      <div className="prose">
        <p>
          Stock Up Dinners started out of the chaos of a busy life: could a family of four eat real,
          varied dinners every weeknight without grocery-shopping more than once every two weeks?
          After two years of iterating on what we cooked, when, and what went in the cart, the
          answer turned out to be yes — but only with a system.
        </p>
        <p>
          That system is built around 75 Costco staples that don&apos;t go bad fast and that combine
          into a wide enough range of dinners to keep the table interesting. Two batch-cook sessions
          every week or two do the heavy lifting; weeknights are reheats.
        </p>
        <p>
          We turned that system into an app. It tracks what&apos;s in your pantry lot by lot, watches
          expiration dates, suggests dinners you can cook tonight from what you already have, and
          quietly maintains your next Costco shopping list as you cook through the week. When you
          actually shop, the live shopping mode lets you tap items in as you walk the aisles.
        </p>
        <p>
          $14.99/month or $124.99/year (about 30% off). 7-day free trial; cancel in one click. Built
          by a husband-and-wife team. No VC, no ads, no algorithm-chasing.
        </p>
      </div>
      <div style={{ marginTop: 40 }}>
        <SignupForm variant="hero" />
      </div>
    </Section>
  );
}
