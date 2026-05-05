import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Section } from "@/components/marketing/Section";
import { Hero } from "@/components/marketing/Hero";
import { ValueProps } from "@/components/marketing/ValueProps";
import { FAQ } from "@/components/marketing/FAQ";
import { SignupForm } from "@/components/marketing/SignupForm";

export const metadata: Metadata = {
  title: "How busy Costco members always know what to cook tonight",
  description:
    "Always know what to cook. Stock Up Dinners is a pantry-aware subscription site for Costco members — tell it what you bought, it tells you what's for dinner tonight. 14 recipes and growing, live shopping mode, FIFO pantry tracking. $14.99/mo, 7-day free trial.",
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
        <h2>Always know what to cook.</h2>
        <p className="lede">
          One Costco trip. A pantry that tracks itself. Cook a quick, fresh dinner every
          night — without the 4:50PM scramble.
        </p>
        <ValueProps />
      </Section>

      <Section>
        <p className="eyebrow">Inside the subscription</p>
        <h2>A pantry system, not just recipes.</h2>
        <div className="inside-row">
          <div className="inside-media">
            <Image
              src="/images/salmon-bowl.jpg"
              alt="Salmon over rice — one of the dinners Stock Up Dinners suggests from what's in your pantry."
              width={1024}
              height={1024}
            />
          </div>
          <div className="inside-meta">
            <h3>What you actually get</h3>
            <ul>
              <li>
                <strong>Pantry tracker with expiration awareness.</strong> Lot-by-lot, so a pack
                bought today and a pack bought last week each track their own use-by date.
              </li>
              <li>
                <strong>Costco-anchored recipes.</strong> Every recipe cookable from a tightly
                curated catalog of warehouse staples — no mystery one-off ingredients.
              </li>
              <li>
                <strong>Cook-tonight suggestions.</strong> The site surfaces what you can make right
                now, prioritizing items that are about to expire.
              </li>
              <li>
                <strong>Auto-updating shopping list.</strong> When something drops below threshold,
                it lands on the list. No more &ldquo;what was I out of again?&rdquo;
              </li>
              <li>
                <strong>Live shopping mode.</strong> Tap items into your pantry as you walk Costco;
                everything syncs the moment you check out.
              </li>
              <li>
                <strong>Smart substitutions.</strong> Out of ground beef? Turkey works for chili —
                and the swap is tracked so your inventory stays honest.
              </li>
            </ul>
          </div>
        </div>
      </Section>

      <Section>
        <p className="eyebrow">See it in action</p>
        <h2>Three screens you&apos;ll touch every week.</h2>
        <p className="lede">
          Pantry → recipes → shopping. The whole loop, end to end.
        </p>

        <div className="showcase">
          <div className="showcase-row">
            <div className="showcase-row__media">
              <Image
                src="/images/product-pantry.jpg"
                alt="The pantry view: tiles of every ingredient on hand, grouped by category, with a 'use these soon' banner highlighting items about to expire."
                width={1400}
                height={1416}
              />
            </div>
            <div className="showcase-row__copy">
              <h3>Lot-by-lot pantry, with expiration awareness.</h3>
              <p>
                Every pack gets its own use-by date. The pantry knows the difference between
                ground beef bought today and ground beef bought last week — and surfaces what&apos;s
                about to expire in a banner at the top, so nothing gets forgotten in the back of
                the fridge.
              </p>
            </div>
          </div>

          <div className="showcase-row showcase-row--reverse">
            <div className="showcase-row__media">
              <Image
                src="/images/product-recipes.jpg"
                alt="The 'What to cook tonight?' page: a grid of dinners cookable right now from the pantry, with red 'cook by tomorrow' tags on items using ingredients about to expire."
                width={1400}
                height={1206}
              />
            </div>
            <div className="showcase-row__copy">
              <h3>The site tells you what to cook tonight.</h3>
              <p>
                Recipes you can make right now from what&apos;s already on hand, prioritized by
                what&apos;s about to expire. No more 4:50PM scramble through the fridge — just open
                the page and pick.
              </p>
            </div>
          </div>

          <div className="showcase-row">
            <div className="showcase-row__media showcase-row__media--portrait">
              <Image
                src="/images/product-shopping.jpg"
                alt="Live shopping mode: a checklist of items grouped by Costco section (refrigerated, frozen, pantry), with checkboxes to tick off as you grab each one."
                width={1400}
                height={1628}
              />
            </div>
            <div className="showcase-row__copy">
              <h3>Walk Costco. Tap as you grab. Pantry updates.</h3>
              <p>
                Your shopping list auto-builds from items dropping below threshold. Open live
                shopping mode at the warehouse and check items off as you put them in the cart —
                pantry refreshes the moment you submit.
              </p>
            </div>
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
                Our kitchen runs on warehouse-club staples, and the real win was knowing exactly
                what we had on hand at any moment. Stock Up Dinners isn&apos;t an app — it&apos;s a
                subscription site that turns your Costco trip into a week of dinners you cook a la
                carte each night.
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
