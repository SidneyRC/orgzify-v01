// app/(customer)/invite/pending/route.ts
// GET  /invite/pending?profile_id=xxx — returns pending invites for a profile
// DELETE /invite/pending?id=xxx       — revokes a pending invite
// POST /invite/pending                — resends an invite (cancels old + sends new)

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sendInvite } from '@/lib/sendInvite';
import crypto from 'crypto';

const BASE_URL    = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://orgzify.com';
const EXPIRES_DAYS = 7;

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const profileId = req.nextUrl.searchParams.get('profile_id');
  if (!profileId) return NextResponse.json({ error: 'Missing profile_id' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('invites')
    .select('id, to_email, type, created_at, expires_at, metadata')
    .eq('from_user_id', session.user_id)
    .eq('status', 'pending')
    .eq('metadata->>profile_id', profileId)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: 'Failed to load pending invites' }, { status: 500 });

  return NextResponse.json({ invites: data ?? [] });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const { error } = await supabaseAdmin
    .from('invites')
    .update({ status: 'declined' })
    .eq('id', id)
    .eq('from_user_id', session.user_id);

  if (error) return NextResponse.json({ error: 'Failed to revoke invite' }, { status: 500 });

  return NextResponse.json({ success: true });
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const { inviteId } = await req.json();
  if (!inviteId) return NextResponse.json({ error: 'Missing inviteId' }, { status: 400 });

  // Load original invite
  const { data: original } = await supabaseAdmin
    .from('invites')
    .select('*')
    .eq('id', inviteId)
    .eq('from_user_id', session.user_id)
    .single();

  if (!original) return NextResponse.json({ error: 'Invite not found' }, { status: 404 });

  // Cancel old invite
  await supabaseAdmin
    .from('invites')
    .update({ status: 'declined' })
    .eq('id', inviteId);

  // Check if recipient is registered
  const { data: existingUser } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', original.to_email)
    .maybeSingle();

  const isRegistered = !!existingUser;

  // Get sender name
  const { data: senderProfile } = await supabaseAdmin
    .from('profiles')
    .select('full_name')
    .eq('user_id', session.user_id)
    .eq('relationship', 'Self')
    .single();

  const fullName  = senderProfile?.full_name ?? '';
  const parts     = fullName.split(' ');
  const fromName  = parts.find((p: string) => !p.endsWith('.')) ?? parts[0] ?? 'Someone';

  // Create new invite
  const token     = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + EXPIRES_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const acceptLink       = `${BASE_URL}/invite/${token}?action=accept`;
  const declineLink      = `${BASE_URL}/invite/${token}?action=decline`;
  const registerOnlyLink = `${BASE_URL}/invite/${token}?action=accept&acceptShare=false`;

  await supabaseAdmin.from('invites').insert({
    token,
    type:         original.type,
    from_user_id: session.user_id,
    to_email:     original.to_email,
    status:       'pending',
    expires_at:   expiresAt,
    metadata:     original.metadata ?? {},
  });

  await sendInvite({
    to:              original.to_email,
    toName:          original.to_email,
    fromName,
    type:            original.type,
    isRegistered,
    acceptLink,
    declineLink,
    registerOnlyLink,
  });

  return NextResponse.json({ success: true });
}
