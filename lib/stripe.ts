import Stripe from "stripe";

let cached: Stripe | null = null;

export function getStripe(): Stripe {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Missing STRIPE_SECRET_KEY");
  cached = new Stripe(key, { apiVersion: "2025-02-24.acacia" });
  return cached;
}

export const STRIPE_PRICE_MONTHLY = () => requireEnv("STRIPE_PRICE_MONTHLY");
export const STRIPE_PRICE_ANNUAL = () => requireEnv("STRIPE_PRICE_ANNUAL");
export const STRIPE_WEBHOOK_SECRET = () => requireEnv("STRIPE_WEBHOOK_SECRET");

function requireEnv(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env var: ${key}`);
  return v;
}
