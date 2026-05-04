#!/usr/bin/env node
// One-shot cleanup for the live-shopping quantity=1 bug. Lists every
// pantry_lot with quantity_initial = 1 (the unambiguous fingerprint of the
// silent fallback) and deletes them when --execute is passed. Skips lots
// that already have cook_event_consumptions (FK is ON DELETE RESTRICT).

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

const execute = process.argv.includes("--execute");
const sb = createClient(url, key, { auth: { persistSession: false } });

const { data: lots, error } = await sb
  .from("pantry_lots")
  .select("id, user_id, ingredient_id, quantity_initial, quantity_remaining, acquired_on, ingredients(slug, display_name)")
  .eq("quantity_initial", 1)
  .order("acquired_on", { ascending: false });

if (error) { console.error(error); process.exit(1); }

if (lots.length === 0) {
  console.log("No phantom 1g lots found. Nothing to do.");
  process.exit(0);
}

console.log(`Found ${lots.length} phantom lot(s) with quantity_initial = 1:\n`);
for (const l of lots) {
  console.log(`  ${l.id}  ${l.acquired_on}  ${l.ingredients?.slug ?? "?"}  (remaining ${l.quantity_remaining})`);
}

if (!execute) {
  console.log("\nDry run. Re-run with --execute to delete.");
  process.exit(0);
}

const ids = lots.map((l) => l.id);
const { error: delErr, count } = await sb
  .from("pantry_lots")
  .delete({ count: "exact" })
  .in("id", ids);

if (delErr) {
  console.error("Delete failed:", delErr.message);
  console.error("Likely cause: a cook_event_consumption references one of these lots (ON DELETE RESTRICT).");
  process.exit(1);
}

console.log(`\nDeleted ${count} lot(s).`);
