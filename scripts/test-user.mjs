#!/usr/bin/env node
/**
 * Create or reset a disposable test user for the onboarding flow.
 *
 *   node scripts/test-user.mjs              # default email
 *   node scripts/test-user.mjs my@test.dev  # custom email
 *
 * The user is created (if needed) with a confirmed email so no inbox
 * verification is required. Their profile is set to subscription_status
 * 'trialing' so middleware lets them past /pricing, and onboarded_at is
 * cleared so /onboarding renders. Any prior pantry_lots are deleted.
 *
 * Use this between rounds when re-testing the onboarding wizard against
 * the dev server — repeatedly, without going through Stripe checkout
 * each time.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

function loadEnv(path) {
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
  }
}
try { loadEnv(".env.local"); } catch {}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const email = process.argv[2] ?? "tester+onboard@stockupdinners.local";
const password = "testtest123";

const sb = createClient(url, key, { auth: { persistSession: false } });

// Find or create the user.
const { data: list } = await sb.auth.admin.listUsers();
let user = list.users.find((u) => u.email === email);

if (!user) {
  const { data: created, error } = await sb.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) {
    console.error("createUser failed:", error.message);
    process.exit(1);
  }
  user = created.user;
  console.log(`✓ Created user ${email}`);
} else {
  // Reset password in case it drifted, and re-confirm email if needed.
  const { error } = await sb.auth.admin.updateUserById(user.id, {
    password,
    email_confirm: true,
  });
  if (error) {
    console.error("updateUser failed:", error.message);
    process.exit(1);
  }
  console.log(`✓ Reset existing user ${email}`);
}

// Wipe their pantry_lots so onboarding starts from an empty fridge.
const { count: deletedLots } = await sb
  .from("pantry_lots")
  .delete({ count: "exact" })
  .eq("user_id", user.id);
if (deletedLots) console.log(`✓ Deleted ${deletedLots} prior pantry_lot(s)`);

// Reset preferences to defaults.
const { error: prefErr } = await sb
  .from("user_preferences")
  .update({
    dietary_filters: [],
    blocked_meats: [],
    allergens: [],
    blocked_ingredients: [],
    use_soon_threshold_days: 7,
    default_threshold_pct: 15,
  })
  .eq("user_id", user.id);
if (prefErr) console.warn("preferences reset warning:", prefErr.message);

// Mark them as actively trialing and un-onboarded so middleware lets them
// straight through to /onboarding.
const { error: profErr } = await sb
  .from("user_profiles")
  .update({
    subscription_status: "trialing",
    subscription_period_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    onboarded_at: null,
  })
  .eq("user_id", user.id);
if (profErr) {
  console.error("profile update failed:", profErr.message);
  process.exit(1);
}

console.log("\nReady to test onboarding:");
console.log(`  Email:    ${email}`);
console.log(`  Password: ${password}`);
console.log(`  Login at: http://localhost:3000/login`);
console.log(`  Or hit:   http://localhost:3000/onboarding once signed in`);
