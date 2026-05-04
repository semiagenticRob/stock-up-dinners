import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Section } from "@/components/marketing/Section";
import { Hero } from "@/components/marketing/Hero";
import { ValueProps } from "@/components/marketing/ValueProps";
import { FAQ } from "@/components/marketing/FAQ";
import { SignupForm } from "@/components/marketing/SignupForm";

export const metadata: Metadata = {
  title: "Easy Meal Prep for Costco Members",
  description:
    "A pantry-aware meal-planning app for Costco members. Tell it what you bought; it tells you what to cook tonight and what to put back on the list. 48 recipes, live shopping mode, FIFO pantry tracking. $14.99/mo, 7-day free trial.",
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
        <p className="eyebrow">Inside the app</p>
        <h2>A pantry system, not just recipes.</h2>
        <div className="pdf-row">
          <div className="pdf-stack">
            <Image
              className="pdf-photo pdf-photo--solo"
              src="/images/salmon-bowl.jpg"
              alt="A salmon quinoa bowl — one of the 48 recipes the app suggests from your pantry."
              width={1024}
              height={1024}
            />
          </div>
          <div className="pdf-meta">
            <h3>What you actually get</h3>
            <ul>
              <li>
                <strong>Pantry tracker with expiration awareness.</strong> Lot-by-lot, so a pack
                bought today and a pack bought last week each track their own use-by date.
              </li>
              <li>
                <strong>48 Costco-anchored recipes.</strong> Every recipe cookable from a tightly
                curated catalog of warehouse staples — no mystery one-off ingredients.
              </li>
              <li>
                <strong>Cook-tonight suggestions.</strong> The app surfaces what you can make right
                now, prioritizing items that are about to expire.
              </li>
              <li>
                <strong>Auto-updating shopping list.</strong> When something drops below threshold,
                it lands on the list. No more &ldquo;what was I out of again?&rdquo;
              </li>
              <li>
                <strong>Live shopping mode.</strong> Scan items into your pantry as you walk Costco;
                everything syncs the moment you check out.
              </li>
              <li>
                <strong>Smart substitutions.</strong> Out of ground beef? The app knows turkey will
                work for chili — and tracks the swap so your inventory stays honest.
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
            <h2>The only solution for a busy family like ours.</h2>
            <div className="why__body">
              <p>We&apos;re busy professionals with kids.</p>
              <p>
                After a long day of meetings, nothing was more stressful than getting home and
                rushing to prep dinner with hungry children prowling the house. Instead of accepting
                the 4:50PM panic, we decided to do something about it.
              </p>
              <p>
                Our kitchen runs on warehouse-club staples, and a real-life week is two cook windows,
                not seven. The app captures that rhythm — and applies it to your kitchen.
              </p>
              <p>
                <Link href="/about" className="why__link">
                  More about the project →
                </Link>
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
          <h2>Start cooking from your pantry.</h2>
          <p className="lede">7-day free trial. Cancel anytime.</p>
          <SignupForm variant="closing" helper="$14.99/mo or $124.99/yr (≈ $10.42/mo). Cancel anytime." />
        </div>
      </Section>
    </>
  );
}
