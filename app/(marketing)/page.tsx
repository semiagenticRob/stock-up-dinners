import type { Metadata } from "next";
import Image from "next/image";
import { Section } from "@/components/marketing/Section";
import { Hero } from "@/components/marketing/Hero";
import { ValueProps } from "@/components/marketing/ValueProps";
import { PDFCoverMock } from "@/components/marketing/PDFCoverMock";
import { FAQ } from "@/components/marketing/FAQ";
import { SignupForm } from "@/components/marketing/SignupForm";

export const metadata: Metadata = {
  title: "Easy Meal Prep for Costco Members",
  description:
    "A free 14-dinner meal plan for a family of four. Built around 75 Costco staples. One warehouse run, two cook days, fourteen dinners. PDF + printable shopping list.",
  alternates: { canonical: "https://stockupdinners.com" },
};

export default function HomePage() {
  return (
    <>
      <Section>
        <Hero />
      </Section>

      <Section tint>
        <p className="eyebrow">How it works</p>
        <h2>Designed to fit your week, not consume it.</h2>
        <p className="lede">
          No daily cooking. No mid-week grocery runs. One Costco trip, two batch sessions, fourteen
          dinners ready to reheat.
        </p>
        <ValueProps />
      </Section>

      <Section>
        <p className="eyebrow">Inside the free PDF</p>
        <h2>A pantry system, not just recipes.</h2>
        <div className="pdf-row">
          <div className="pdf-stack">
            <PDFCoverMock />
            <Image
              className="pdf-photo"
              src="/images/salmon-bowl.jpg"
              alt=""
              width={1024}
              height={1024}
              aria-hidden="true"
            />
          </div>
          <div className="pdf-meta">
            <h3>What&apos;s actually in the file</h3>
            <ul>
              <li>
                <strong>14 dinners with full recipes.</strong> Ingredients, quantities, instructions,
                storage notes.
              </li>
              <li>
                <strong>Consolidated shopping lists.</strong> Costco organized. Printable. Quantified.
              </li>
              <li>
                <strong>Cook day workflows.</strong> Step-by-step: what goes in the oven first, what&apos;s
                prepped while it&apos;s roasting.
              </li>
              <li>
                <strong>Storage + reheat cheat sheet.</strong> Foil pan vs freezer bag, oven vs
                microwave, exact times.
              </li>
              <li>
                <strong>The 75-staple list.</strong> The Costco shortlist the system runs on.
              </li>
            </ul>
          </div>
        </div>
      </Section>

      <Section tint>
        <div className="why">
          <div className="why__copy">
            <p className="eyebrow" style={{ color: "var(--c-muted)" }}>
              Why we built this
            </p>
            <h2>The Only Solution for a Busy Family Like Us!</h2>
            <div className="why__body">
              <p>We&apos;re busy professionals with kids.</p>
              <p>
                After a long day of meetings, nothing was more stressful than getting home and rushing
                to prep dinner with hungry children prowling the house. Instead of accepting the
                4:50PM panic, we decided to do something about it.
              </p>
              <p>Our kitchen runs on warehouse-club staples and a real-life week is two cook windows, not seven.</p>
              <p>
                Free fourteen-day plan now. The full six-week system, with three more bi-weekly plans,
                lands later.{" "}
                <a href="/about" className="why__link">
                  More about the project →
                </a>
              </p>
            </div>
          </div>
          <div className="why__media">
            <Image
              src="/images/family-story.jpg"
              alt="The family behind Stock Up Dinners — outdoor evening picnic, dinner-on-a-blanket."
              width={1280}
              height={964}
            />
          </div>
        </div>
      </Section>

      <Section>
        <div className="faq-wrap">
          <p className="eyebrow">Common questions</p>
          <h2>FAQ</h2>
          <FAQ />
        </div>
      </Section>

      <Section tint>
        <div className="closing">
          <h2>Get the free 14-dinner plan.</h2>
          <p className="lede">PDF + printable shopping list, in your inbox in under a minute.</p>
          <SignupForm variant="closing" helper="Free PDF + printable shopping list. No spam." />
        </div>
      </Section>
    </>
  );
}
