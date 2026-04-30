type Size = "sm" | "md";

export function Wordmark({ size = "md" }: { size?: Size }) {
  const dim = size === "sm" ? "14px" : "18px";
  const fontSize = size === "sm" ? "13px" : "14px";
  return (
    <span className="wordmark" style={{ fontSize }}>
      <span className="wordmark__mark" style={{ width: dim, height: dim }} />
      STOCK UP DINNERS
    </span>
  );
}
