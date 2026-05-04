import type { ReactNode } from "react";

export function Section({
  children,
  tint = false,
  id,
  className,
}: {
  children: ReactNode;
  tint?: boolean;
  id?: string;
  className?: string;
}) {
  const classes = ["section", tint && "section--tint", className]
    .filter(Boolean)
    .join(" ");
  return (
    <section className={classes} id={id}>
      <div className="shell">{children}</div>
    </section>
  );
}
