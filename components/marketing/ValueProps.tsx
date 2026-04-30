const PROPS = [
  {
    num: "01",
    title: "1 consolidated Costco list",
    body: "Deduplicated, quantified for a family of four, organized by warehouse aisle. Walk in, walk out, done.",
  },
  {
    num: "02",
    title: "2 Cooks, 0 Midweek Panic.",
    body: "A weekend batch or a midweek mini cook session. Storage and reheat instructions for every meal, so dinner is fast after a busy weekday.",
  },
  {
    num: "03",
    title: "14 dinners, ready to go",
    body: "Family-of-four portions, mapped across two weeks. Delicious staples like burrito bowls, bolognese, or curry, not protein-and-rice on repeat.",
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
