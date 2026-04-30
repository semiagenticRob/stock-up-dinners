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
          answer turned out to be yes, but only with a system.
        </p>
        <p>
          The pantry system is built around 75 Costco staples that don&apos;t go bad fast and that
          combine into a wide enough range of dinners to keep the table interesting. Two batch-cook
          sessions every week or two do the heavy lifting; weeknights are reheats. The free
          14-dinner plan is the first cycle of that system, exactly the way it runs in our kitchen.
        </p>
        <p>
          The full six-week pantry tracker (with three more bi-weekly plans, pantry-drawdown logic,
          and a rolling weekly rhythm) is available at $14.99/mo for anyone who wants to commit to
          the whole thing. There&apos;s also a companion app in the works that turns the system into
          something you can tap your way through instead of printing.
        </p>
        <p>
          Built by a husband and wife team. No VC, no ads, no algorithm-chasing. The newsletter is
          the product distribution channel — sign up below if you want the free plan.
        </p>
      </div>
      <div style={{ marginTop: 40 }}>
        <SignupForm variant="hero" />
      </div>
    </Section>
  );
}
