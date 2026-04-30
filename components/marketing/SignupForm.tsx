type Variant = "hero" | "closing";

const SUBSCRIBE_URL = "https://stockupdinners.beehiiv.com/subscribe";

export function SignupForm({
  variant = "hero",
  helper = "Free PDF + printable shopping list. No spam — unsubscribe anytime.",
  buttonLabel = "Get the free plan",
}: {
  variant?: Variant;
  helper?: string;
  buttonLabel?: string;
}) {
  const ctaId = variant === "hero" ? "signup" : `signup-${variant}`;
  return (
    <div className="signup" id={ctaId}>
      <a href={SUBSCRIBE_URL} className="btn signup__btn" data-signup-link>
        {buttonLabel}
      </a>
      <p className="helper signup__helper">{helper}</p>
    </div>
  );
}
