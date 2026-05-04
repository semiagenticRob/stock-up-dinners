const FAQS = [
  {
    q: "Do I have to shop at Costco?",
    a: "The app is built around 75 Costco staples — pack sizes, quantities, and price expectations all assume Costco. You can substitute equivalents from any warehouse club or large grocery store, but the shopping list won't map 1:1.",
  },
  {
    q: "Will the recipes work for picky kids?",
    a: "Most of them, yes. The catalog leans on familiar shapes like burrito bowls, pasta, stir-fry, chili, all with simple seasonings you can dress up or down. Recipes flag which ingredients are easy to swap or skip when you've got a picky eater at the table.",
  },
  {
    q: "How long does each cook day take?",
    a: "Cook Day 1 is roughly 3–4 hours of active time on a Sunday afternoon, batching 7 meals. Cook Day 2 is a 60–90 minute mid-week mini, batching the next 7. Reheats are 5–15 minutes on weeknights. You can also cook meals à la carte, with each meal taking ~20 to 45 minutes in total.",
  },
  {
    q: "What if I'm cooking for 2 instead of 4?",
    a: "Tap the servings stepper on any recipe and the app scales the ingredient quantities — and the pantry drawdown — automatically. Costco pack sizes are generous, so condiments and produce often stay at full quantity even when you halve proteins and starches.",
  },
  {
    q: "How does pricing work?",
    a: "$14.99/month or $124.99/year (about $10.42/mo equivalent — saves you 30%). 7-day free trial on either plan; no card needed for the trial. Cancel anytime from your account in one click.",
  },
  {
    q: "Can I cancel?",
    a: "Yes, in one click from the Settings page. We use Stripe for billing, so you can also manage everything from your Stripe customer portal. Cancellation is effective at the end of your current period — no surprise charges.",
  },
];

export function FAQ() {
  return (
    <div className="faq">
      {FAQS.map((f) => (
        <details key={f.q} className="faq__row">
          <summary className="faq__q">
            <span>{f.q}</span>
            <span className="faq__chev" aria-hidden="true">
              +
            </span>
          </summary>
          <div className="faq__a">{f.a}</div>
        </details>
      ))}
    </div>
  );
}
