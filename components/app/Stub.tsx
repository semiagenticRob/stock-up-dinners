import type { ReactNode } from "react";

export function Stub({
  title,
  milestone,
  children,
}: {
  title: string;
  milestone: string;
  children?: ReactNode;
}) {
  return (
    <div className="app-stub">
      <p className="eyebrow">Coming in {milestone}</p>
      <h1>{title}</h1>
      {children}
    </div>
  );
}
