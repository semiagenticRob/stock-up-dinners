import Link from "next/link";

type Variant = "hero" | "closing";

export function SignupForm({
  variant = "hero",
  helper = "7-day free trial. Cancel anytime from your account.",
  buttonLabel = "Start free trial",
}: {
  variant?: Variant;
  helper?: string;
  buttonLabel?: string;
}) {
  const ctaId = variant === "hero" ? "signup" : `signup-${variant}`;
  return (
    <div className="signup" id={ctaId}>
      <Link href="/signup" className="btn signup__btn">
        {buttonLabel}
      </Link>
      <p className="helper signup__helper">{helper}</p>
    </div>
  );
}
