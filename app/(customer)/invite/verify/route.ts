// app/(customer)/invite/verify/route.ts
// GET /invite/verify?token=xxx
// Reads invite token from DB — returns invite details or error

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  }

  // 1. Find invite by token
  const { data: invite, error } = await supabaseAdmin
    .from('invites')
    .select('id, type, from_user_id, to_email, status, expires_at, metadata')
    .eq('token', token)
    .single();

  if (error || !invite) {
    return NextResponse.json({ error: 'Invalid invite' }, { status: 404 });
  }

  // 2. Check if expired
  if (new Date(invite.expires_at) < new Date()) {
    await supabaseAdmin
      .from('invites')
      .update({ status: 'expired' })
      .eq('token', token);
    return NextResponse.json({ error: 'Invite expired', expired: true }, { status: 410 });
  }

  // 3. Check if already used
  if (invite.status !== 'pending') {
    return NextResponse.json({ error: `Invite already ${invite.status}` }, { status: 409 });
  }

  // 4. Get sender name
  const { data: senderProfile } = await supabaseAdmin
    .from('profiles')
    .select('full_name')
    .eq('user_id', invite.from_user_id)
    .eq('relationship', 'Self')
    .single();

  const fullName = senderProfile?.full_name ?? '';
  const parts = fullName.split(' ');
  const fromName = parts.find((p: string) => !p.endsWith('.')) ?? parts[0] ?? 'Someone';

  // 5. Check if recipient is registered
  const { data: existingUser } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', invite.to_email)
    .single();

  const session = await getSession(req);
  let isCorrectUser = null;
if (session) {
  if (!existingUser) {
    // Recipient not registered but someone is logged in — wrong user
    isCorrectUser = false;
  } else {
    isCorrectUser = session.user_id === existingUser.id;
  }
}

  return NextResponse.json({
    type: invite.type,
    fromName,
    toEmail: invite.to_email,
    isRegistered: !!existingUser,
    isCorrectUser,
    metadata: invite.metadata,
  });
}
