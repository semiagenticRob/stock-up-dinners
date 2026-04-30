const FAQS = [
  {
    q: "Do I have to shop at Costco?",
    a: "The plan is built around 75 Costco staples — pack sizes, quantities, and price expectations all assume Costco. You can substitute equivalents from any warehouse club or large grocery store, but the shopping list won't map 1:1.",
  },
  {
    q: "Will the recipes work for picky kids?",
    a: "Most of them, yes. The plan leans on familiar shapes like burrito bowls, pasta, stir-fry, chili, all with simple seasonings you can dress up or down. The PDF includes notes on ingredients to swap or skip when you've got a picky eater at the table.",
  },
  {
    q: "How long does each cook day take?",
    a: "Cook Day 1 is roughly 3–4 hours of active time on a Sunday afternoon, batching 7 meals. Cook Day 2 is a 60–90 minute mid-week mini, batching the next 7. Reheats are 5–15 minutes on weeknights. You can also cook meals à la carte, with each meal taking ~20 to 45 minutes in total.",
  },
  {
    q: "What if I'm cooking for 2 instead of 4?",
    a: "Halve the protein and starch quantities; produce and condiments are usually fine to keep at full quantity since Costco pack sizes are generous. The free plan doesn't include scaled-down lists — that's for paid subscribers to the full pantry tracking system.",
  },
  {
    q: "Is there a paid version?",
    a: "Yes — a full pantry tracking system at $14.99/mo with the full 6-week plan (the free 14 dinners plus three more bi-weekly plans = 26 dinners total, with rolling weekly rhythm and pantry-drawdown logic). You'll hear about it in the welcome email sequence.",
  },
  {
    q: "Will you spam me?",
    a: "No. The welcome sequence is three emails over a week, then occasional updates when new bi-weekly plans drop. Unsubscribe with one click any time.",
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
