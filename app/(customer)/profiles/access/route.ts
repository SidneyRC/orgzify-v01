// app/(customer)/profiles/access/route.ts
// GET    /profiles/access?profile_id=xxx  — list who has access to a profile
// PATCH  /profiles/access                 — update permissions for an access entry
// DELETE /profiles/access?id=xxx          — remove access (owner OR recipient)

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// ── GET — fetch access list for a profile ─────────────────────────────────
export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const profileId = req.nextUrl.searchParams.get('profile_id');
  if (!profileId) return NextResponse.json({ error: 'Missing profile_id' }, { status: 400 });

  // Verify caller owns this profile
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('id', profileId)
    .eq('user_id', session.user_id)
    .maybeSingle();

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  // Fetch active access entries
  const { data: entries, error } = await supabaseAdmin
    .from('profile_access')
    .select('id, granted_to_id, granted_to_type, can_view, can_edit, can_enroll, can_share, status')
    .eq('profile_id', profileId)
    .eq('status', 'active');

  if (error) return NextResponse.json({ error: 'Failed to load access list' }, { status: 500 });

  // Enrich with user names and emails
  const enriched = await Promise.all((entries ?? []).map(async (e) => {
    if (e.granted_to_type !== 'user' || !e.granted_to_id) return { ...e, name: null, email: null };
    const { data: user } = await supabaseAdmin
      .from('users').select('email').eq('id', e.granted_to_id).maybeSingle();
    const { data: prof } = await supabaseAdmin
      .from('profiles').select('full_name').eq('user_id', e.granted_to_id)
      .eq('relationship', 'Self').maybeSingle();
    return { ...e, name: prof?.full_name ?? null, email: user?.email ?? null };
  }));

  return NextResponse.json({ access: enriched });
}

// ── PATCH — update permissions ────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const { id, can_view, can_edit, can_enroll, can_share } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  // Verify caller owns the profile this access belongs to
  const { data: entry } = await supabaseAdmin
    .from('profile_access').select('profile_id').eq('id', id).maybeSingle();
  if (!entry) return NextResponse.json({ error: 'Access entry not found' }, { status: 404 });

  const { data: profile } = await supabaseAdmin
    .from('profiles').select('id').eq('id', entry.profile_id)
    .eq('user_id', session.user_id).maybeSingle();
  if (!profile) return NextResponse.json({ error: 'Not authorised' }, { status: 403 });

  const { error } = await supabaseAdmin
    .from('profile_access')
    .update({ can_view, can_edit, can_enroll, can_share, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return NextResponse.json({ error: 'Failed to update permissions' }, { status: 500 });
  return NextResponse.json({ success: true });
}

// ── DELETE — remove access (owner OR recipient) ───────────────────────────
export async function DELETE(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  // Load the access entry
  const { data: entry } = await supabaseAdmin
    .from('profile_access')
    .select('profile_id, granted_to_id')
    .eq('id', id)
    .maybeSingle();

  if (!entry) return NextResponse.json({ error: 'Access entry not found' }, { status: 404 });

  // Allow if caller is the profile owner OR the recipient
  const { data: isOwner } = await supabaseAdmin
    .from('profiles').select('id').eq('id', entry.profile_id)
    .eq('user_id', session.user_id).maybeSingle();

  const isRecipient = entry.granted_to_id === session.user_id;

  if (!isOwner && !isRecipient) {
    return NextResponse.json({ error: 'Not authorised' }, { status: 403 });
  }

  const { error } = await supabaseAdmin
    .from('profile_access')
    .update({ status: 'removed', updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return NextResponse.json({ error: 'Failed to remove access' }, { status: 500 });
  return NextResponse.json({ success: true });
}
