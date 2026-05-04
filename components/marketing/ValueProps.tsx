const PROPS = [
  {
    num: "01",
    title: "1 consolidated Costco list",
    body: "Deduplicated, quantified for a family of four, organized by warehouse aisle. Walk in, walk out, done.",
  },
  {
    num: "02",
    title: "Confidence every night, zero mid-week panic.",
    body: "Always know what's for dinner. Stock Up Dinners surfaces what you can cook tonight from what's already in your pantry — quick a la carte sessions, not weekend marathons.",
  },
  {
    num: "03",
    title: "14 dinners and growing.",
    body: "Family-of-four portions cooked fresh each night — burrito bowls, bolognese, curry, salmon — none on repeat. The catalog grows weekly.",
  },
];

export function ValueProps() {
  return (
    <div className="vp-grid">
      {PROPS.map((p) => (
        <div key={p.num} className="vp-card">
          <div className="vp-card__num">{p.num}</div>
          <h4>{p.title}</h4>
          <p>{p.body}</p>
        </div>
      ))}
    </div>
  );
}
