/**
 * Stripe webhook receiver. Verifies the signature, then maps a small set of
 * events into user_profiles fields:
 *   - subscription_status (none | trialing | active | past_due | canceled)
 *   - subscription_period_end
 *   - stripe_customer_id (idempotent — set on first link)
 *
 * Stripe retries on 5xx; we make every handler idempotent so duplicate
 * deliveries are safe.
 */

import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripe, STRIPE_WEBHOOK_SECRET } from "@/lib/stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const RELEVANT = new Set<Stripe.Event.Type>([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.payment_failed",
]);

export async function POST(request: NextRequest) {
  const sig = request.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const body = await request.text();
  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET());
  } catch (err) {
    console.error("Stripe webhook signature failed:", err);
    return NextResponse.json({ error: "Bad signature" }, { status: 400 });
  }

  if (!RELEVANT.has(event.type)) {
    return NextResponse.json({ received: true, ignored: event.type });
  }

  const supabase = createSupabaseAdminClient();

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;
      const customerId = typeof session.customer === "string" ? session.customer : null;
      if (userId && customerId) {
        await supabase
          .from("user_profiles")
          .update({ stripe_customer_id: customerId })
          .eq("user_id", userId);
      }
      // Subscription status flips will arrive via customer.subscription.* events.
    } else if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
      const status = mapStatus(sub.status);
      const periodEnd = (sub as unknown as { current_period_end?: number }).current_period_end;
      const periodEndIso =
        typeof periodEnd === "number" ? new Date(periodEnd * 1000).toISOString() : null;
      await supabase
        .from("user_profiles")
        .update({
          subscription_status: status,
          subscription_period_end: periodEndIso,
        })
        .eq("stripe_customer_id", customerId);
    } else if (event.type === "invoice.payment_failed") {
      const inv = event.data.object as Stripe.Invoice;
      const customerId = typeof inv.customer === "string" ? inv.customer : inv.customer?.id;
      if (customerId) {
        await supabase
          .from("user_profiles")
          .update({ subscription_status: "past_due" })
          .eq("stripe_customer_id", customerId);
      }
    }
  } catch (err) {
    console.error(`Stripe webhook handler error for ${event.type}:`, err);
    // Return 500 so Stripe retries.
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

function mapStatus(s: Stripe.Subscription.Status): string {
  switch (s) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
      return "canceled";
    default:
      return "none";
  }
}
