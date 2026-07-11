// OREV1-032 — Spouse Invite API
// Route: POST /profiles/invite
// Saves invite token → sends email via sendInvite

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendInvite } from "@/lib/sendInvite";

export async function POST(req: NextRequest) {
  // ── 1. Auth ────────────────────────────────────────────────────────────────
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  // ── 2. Parse body ──────────────────────────────────────────────────────────
  const { spouse_name, spouse_email, anniversary_date } = await req.json();

  if (!spouse_name?.trim())
    return NextResponse.json({ error: "Spouse name is required" }, { status: 400 });
  if (!spouse_email?.trim())
    return NextResponse.json({ error: "Spouse email is required" }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(spouse_email))
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });

  // ── 3. Get inviter profile name ────────────────────────────────────────────
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name")
    .eq("id", session.profile_id)
    .single();

  if (profileError || !profile)
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  // ── 4. Generate token + expiry ─────────────────────────────────────────────
  const token = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // ── 5. Save to invites table ───────────────────────────────────────────────
  const { error: insertError } = await supabaseAdmin.from("invites").insert({
    token,
    type: "spouse",
    from_user_id: session.user_id,
    to_email: spouse_email.toLowerCase().trim(),
    status: "pending",
    expires_at: expiresAt.toISOString(),
    metadata: {
      spouse_name: spouse_name.trim(),
      anniversary_date: anniversary_date || null,
      inviter_profile_id: profile.id,
      inviter_name: profile.full_name,
    },
  });

  if (insertError) {
    console.error("Invite insert error:", insertError.message);
    return NextResponse.json({ error: "Failed to create invite" }, { status: 500 });
  }

  // ── 6. Send email ──────────────────────────────────────────────────────────
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://orgzify.com";
  const inviteLink = `${baseUrl}/register?invite=${token}`;

 const isRegistered = !!(await supabaseAdmin
  .from('users').select('id').eq('email', spouse_email.toLowerCase().trim()).single()).data;

const acceptLink = `${baseUrl}/invite/${token}?action=accept`;
const declineLink = `${baseUrl}/invite/${token}?action=decline`;
const registerOnlyLink = `${baseUrl}/register?ref=${token}`;

const sent = await sendInvite({
  to: spouse_email.toLowerCase().trim(),
  toName: spouse_name.trim(),
  fromName: profile.full_name,
  type: 'spouse',
  isRegistered,
  acceptLink,
  declineLink,
  registerOnlyLink,
});

  if (!sent) {
    return NextResponse.json({ error: "Invite saved but email failed to send" }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
