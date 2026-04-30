import Image from "next/image";

type Meal = { ix: string; name: string; img: string };

const DEFAULT_MEALS: Meal[] = [
  { ix: "01", name: "Chicken Burrito Bowls", img: "/images/meals/01-chicken-burrito-bowls.jpg" },
  { ix: "02", name: "Beef Bolognese",        img: "/images/meals/02-beef-bolognese.jpg" },
  { ix: "03", name: "Teriyaki Salmon",       img: "/images/meals/03-teriyaki-salmon.jpg" },
  { ix: "04", name: "Veggie Stir-Fry",       img: "/images/meals/04-veggie-stir-fry.jpg" },
  { ix: "05", name: "Turkey Chili",          img: "/images/meals/05-turkey-chili.jpg" },
  { ix: "06", name: "Coconut Shrimp",        img: "/images/meals/06-coconut-shrimp.jpg" },
  { ix: "07", name: "Baked Penne",           img: "/images/meals/07-baked-penne.jpg" },
  { ix: "08", name: "Chicken Tikka",         img: "/images/meals/08-chicken-tikka.jpg" },
];

export function MealGridPreview({
  meals = DEFAULT_MEALS,
  cols = 4,
}: {
  meals?: Meal[];
  cols?: number;
}) {
  return (
    <ul className="meal-grid" style={{ ["--cols" as string]: cols }}>
      {meals.map((m) => (
        <li key={m.ix} className="meal-grid__cell">
          <Image
            className="meal-grid__thumb"
            src={m.img}
            alt=""
            width={96}
            height={96}
          />
          <div className="meal-grid__meta">
            <span className="meal-grid__ix">{m.ix}</span>
            <span className="meal-grid__name">{m.name}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
