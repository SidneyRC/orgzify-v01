// app/(customer)/profile/access/route.ts
// GET  → fetch profile_access list for a profile (owner only)
// DELETE → remove an access entry by id (owner only)

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// ─── GET /profile/access?profile_id=xxx ───────────────────────────────────────
export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const profileId = req.nextUrl.searchParams.get("profile_id");
  if (!profileId) return NextResponse.json({ error: "profile_id required" }, { status: 400 });

  // Verify requester owns this profile
  const { data: profile, error: profErr } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("id", profileId)
    .eq("user_id", session.user_id)
    .single();

  if (profErr || !profile)
    return NextResponse.json({ error: "Profile not found or access denied" }, { status: 403 });

  // Fetch access entries
  const { data: access, error } = await supabaseAdmin
    .from("profile_access")
    .select("id, granted_to_id, granted_to_type, can_view, can_edit, can_enroll, can_share, status, created_at")
    .eq("profile_id", profileId)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "Failed to load access list" }, { status: 500 });

  // Enrich with names where granted_to_id exists
  const enriched = await Promise.all(
    (access ?? []).map(async (entry) => {
      if (!entry.granted_to_id) return { ...entry, name: null };
      const { data: p } = await supabaseAdmin
        .from("profiles")
        .select("full_name")
        .eq("id", entry.granted_to_id)
        .single();
      return { ...entry, name: p?.full_name ?? null };
    })
  );

  return NextResponse.json({ access: enriched });
}

// ─── DELETE /profile/access?id=xxx ────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const entryId = req.nextUrl.searchParams.get("id");
  if (!entryId) return NextResponse.json({ error: "id required" }, { status: 400 });

  // Verify the entry belongs to a profile owned by this user
  const { data: entry, error: fetchErr } = await supabaseAdmin
    .from("profile_access")
    .select("id, profile_id")
    .eq("id", entryId)
    .single();

  if (fetchErr || !entry)
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });

  const { data: profile, error: profErr } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("id", entry.profile_id)
    .eq("user_id", session.user_id)
    .single();

  if (profErr || !profile)
    return NextResponse.json({ error: "Access denied" }, { status: 403 });

  // Soft delete — set status to removed
  const { error } = await supabaseAdmin
    .from("profile_access")
    .update({ status: "removed", updated_at: new Date().toISOString() })
    .eq("id", entryId);

  if (error) return NextResponse.json({ error: "Failed to remove access" }, { status: 500 });

  return NextResponse.json({ success: true });
}
