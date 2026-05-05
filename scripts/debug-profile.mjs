#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

function loadEnv(path) {
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
  }
}
try { loadEnv(".env.local"); } catch {}

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const { data: users } = await sb.auth.admin.listUsers();
console.log("Users:", users.users.map(u => ({ id: u.id, email: u.email, created: u.created_at })));

const { data: profiles, error } = await sb
  .from("user_profiles")
  .select("user_id, stripe_customer_id, subscription_status, subscription_period_end, onboarded_at, created_at, updated_at");
if (error) { console.error(error); process.exit(1); }
console.log("\nProfiles:");
for (const p of profiles) console.log(p);
