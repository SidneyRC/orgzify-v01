// app/(customer)/invite/send/route.ts
// POST /invite/send
// Checks if recipient is registered → saves invite token → sends correct email
// Server-side only

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sendInvite, InviteType } from '@/lib/sendInvite';
import crypto from 'crypto';

const BASE_URL    = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://orgzify.com';
const EXPIRES_DAYS = 7;

export async function POST(req: NextRequest) {
  // 1. Auth check
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  // 2. Parse body
  const { toEmail, toName, type, metadata } = await req.json();

  if (!toEmail || !type) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const validTypes: InviteType[] = ['spouse', 'profile_transfer', 'profile_share'];
  if (!validTypes.includes(type)) {
    return NextResponse.json({ error: 'Invalid invite type' }, { status: 400 });
  }

  // 3. Get sender profile
  const { data: senderProfile } = await supabaseAdmin
    .from('profiles')
    .select('full_name, spouse_profile_id')
    .eq('id', session.profile_id)
    .single();

  const fullName  = senderProfile?.full_name ?? '';
  const parts     = fullName.split(' ');
  const fromName  = parts.find((p: string) => !p.endsWith('.')) ?? parts[0] ?? 'Someone';

  // 4. Spouse-specific checks
  if (type === 'spouse') {
    // Block if sender already has a linked spouse
    if (senderProfile?.spouse_profile_id) {
      return NextResponse.json({
        error: 'You already have a spouse linked. Remove existing connection first.',
        code: 'SENDER_ALREADY_LINKED',
      }, { status: 409 });
    }

    // Check if recipient is registered and already has a linked spouse
    const { data: recipientUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', toEmail.toLowerCase().trim())
      .maybeSingle();

    if (recipientUser) {
      const { data: recipientProfile } = await supabaseAdmin
        .from('profiles')
        .select('spouse_profile_id')
        .eq('user_id', recipientUser.id)
        .eq('relationship', 'Self')
        .single();

      if (recipientProfile?.spouse_profile_id) {
        return NextResponse.json({
          error: 'This person already has a spouse linked on Orgzify.',
          code: 'RECIPIENT_ALREADY_LINKED',
        }, { status: 409 });
      }
    }
  }

  // 5. Check if recipient is registered
  const { data: existingUser } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', toEmail.toLowerCase().trim())
    .maybeSingle();

  const isRegistered = !!existingUser;

  // 6. Check for existing pending invite of same type to same email
const profileId = metadata?.profile_id ?? null;
let inviteQuery = supabaseAdmin
  .from('invites')
  .select('id')
  .eq('to_email', toEmail.toLowerCase().trim())
  .eq('type', type)
  .eq('from_user_id', session.user_id)
  .eq('status', 'pending')
  .gt('expires_at', new Date().toISOString());

if (profileId) inviteQuery = inviteQuery.eq('metadata->>profile_id', profileId);

const { data: existingInvite } = await inviteQuery.maybeSingle();

  if (existingInvite) {
    return NextResponse.json({ error: 'An active invite already exists for this email' }, { status: 409 });
  }

  // 7. Generate token and links
  const token      = crypto.randomBytes(32).toString('hex');
  const expiresAt  = new Date(Date.now() + EXPIRES_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const acceptLink       = `${BASE_URL}/invite/${token}?action=accept`;
  const declineLink      = `${BASE_URL}/invite/${token}?action=decline`;
  const registerOnlyLink = `${BASE_URL}/invite/${token}?action=accept&acceptShare=false`;

  // 8. Save invite to DB
  const { error: insertError } = await supabaseAdmin
    .from('invites')
    .insert({
      token,
      type,
      from_user_id: session.user_id,
      to_email:     toEmail.toLowerCase().trim(),
      status:       'pending',
      expires_at:   expiresAt,
      metadata:     metadata ?? {},
    });

  if (insertError) {
    console.error('[invite/send] DB insert failed:', insertError);
    return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 });
  }

  // 9. Send email
  const sent = await sendInvite({
    to:       toEmail.toLowerCase().trim(),
    toName:   toName || toEmail,
    fromName,
    type,
    isRegistered,
    acceptLink,
    declineLink,
    registerOnlyLink,
  });

  if (!sent) {
    return NextResponse.json({ error: 'Invite saved but email failed to send' }, { status: 500 });
  }

  return NextResponse.json({ success: true, isRegistered });
}
