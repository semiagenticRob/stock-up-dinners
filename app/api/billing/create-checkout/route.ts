/**
 * POST /api/billing/create-checkout
 * Body: { plan: "monthly" | "annual" }
 *
 * Returns a Stripe Checkout URL for the authenticated user.
 * Creates a Stripe customer on first call and persists it on user_profiles.
 */

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getStripe, STRIPE_PRICE_ANNUAL, STRIPE_PRICE_MONTHLY } from "@/lib/stripe";

const Body = z.object({ plan: z.enum(["monthly", "annual"]) });

export async function POST(request: NextRequest) {
  const parsed = Body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .single();

  const stripe = getStripe();
  let customerId = profile?.stripe_customer_id ?? null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
    await supabase
      .from("user_profiles")
      .update({ stripe_customer_id: customerId })
      .eq("user_id", user.id);
  }

  const priceId = parsed.data.plan === "monthly" ? STRIPE_PRICE_MONTHLY() : STRIPE_PRICE_ANNUAL();
  const origin = request.nextUrl.origin;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: user.id,
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: { trial_period_days: 7 },
    success_url: `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/pricing?cancelled=1`,
    allow_promotion_codes: true,
  });

  if (!session.url) {
    return NextResponse.json({ error: "Stripe did not return a URL" }, { status: 502 });
  }
  return NextResponse.json({ url: session.url });
}
