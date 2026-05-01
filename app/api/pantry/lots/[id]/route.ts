/**
 * PATCH /api/pantry/lots/:id — edit quantity/expiration/storage/notes.
 * DELETE /api/pantry/lots/:id — remove the lot entirely.
 *
 * RLS isolates by user_id; passing another user's id will silently match no
 * rows, which Supabase reports as a not-found.
 */

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { deleteLot, updateLot } from "@/lib/db/pantry";

const PatchBody = z.object({
  quantity_remaining: z.number().int().nonnegative().optional(),
  expires_on: z.string().nullable().optional(),
  storage_state: z.enum(["pantry", "refrigerated", "frozen"]).optional(),
  notes: z.string().nullable().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const parsed = PatchBody.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", issues: parsed.error.issues }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const patch: Parameters<typeof updateLot>[2] = {};
  if (parsed.data.quantity_remaining !== undefined) {
    patch.quantity_remaining = parsed.data.quantity_remaining;
  }
  if (parsed.data.expires_on !== undefined) {
    patch.expires_on =
      parsed.data.expires_on === null ? null : new Date(parsed.data.expires_on);
  }
  if (parsed.data.storage_state !== undefined) {
    patch.storage_state = parsed.data.storage_state;
  }
  if (parsed.data.notes !== undefined) patch.notes = parsed.data.notes;

  try {
    const lot = await updateLot(supabase, id, patch);
    return NextResponse.json({ lot });
  } catch (err) {
    console.error("updateLot failed", err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  try {
    await deleteLot(supabase, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("deleteLot failed", err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
