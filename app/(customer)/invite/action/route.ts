// app/(customer)/invite/action/route.ts
// POST /invite/action
// Processes accept or decline — updates invites + relevant tables
// On accept (spouse): links both profiles, copies anniversary_date, sets is_shared on both
// On accept (profile_share): writes to profile_access table
// On accept/decline: sends notification email to original sender

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sendInviteNotification } from '@/lib/sendInvite';

export async function POST(req: NextRequest) {
  // 1. Auth check
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  const { token, action } = await req.json();

  if (!token || !['accept', 'decline'].includes(action)) {
    return NextResponse.json({ error: 'Missing token or invalid action' }, { status: 400 });
  }

  // 2. Load invite
  const { data: invite, error } = await supabaseAdmin
    .from('invites')
    .select('id, type, from_user_id, to_email, status, expires_at, metadata, company_id')
    .eq('token', token)
    .single();

  if (error || !invite) {
    return NextResponse.json({ error: 'Invalid invite' }, { status: 404 });
  }

  // 3. Validate invite is still usable
  if (invite.status !== 'pending') {
    return NextResponse.json({ error: `Invite already ${invite.status}` }, { status: 409 });
  }
  if (new Date(invite.expires_at) < new Date()) {
    await supabaseAdmin.from('invites').update({ status: 'expired' }).eq('token', token);
    return NextResponse.json({ error: 'Invite expired' }, { status: 410 });
  }

  // 4. Verify the logged-in user matches the invite recipient
  const { data: recipientUser } = await supabaseAdmin
    .from('users')
    .select('id, email')
    .eq('id', session.user_id)
    .eq('email', invite.to_email)
    .single();

  if (!recipientUser) {
    return NextResponse.json({ error: 'wrong_user', code: 'WRONG_USER' }, { status: 403 });
  }

  // 5. Load sender details for notification email
  const { data: senderUser } = await supabaseAdmin
    .from('users')
    .select('email')
    .eq('id', invite.from_user_id)
    .single();

  const { data: senderProfile } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, anniversary_date, spouse_profile_id')
    .eq('user_id', invite.from_user_id)
    .eq('relationship', 'Self')
    .single();

  const senderFullName  = senderProfile?.full_name ?? '';
  const senderParts     = senderFullName.split(' ');
  const senderFirstName = senderParts.find((p: string) => !p.endsWith('.')) ?? senderParts[0] ?? 'Someone';

  // 6. Load recipient profile
  const { data: recipientProfile } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, spouse_profile_id')
    .eq('user_id', session.user_id)
    .eq('relationship', 'Self')
    .single();

  const recipientFullName  = recipientProfile?.full_name ?? '';
  const recipientParts     = recipientFullName.split(' ');
  const recipientFirstName = recipientParts.find((p: string) => !p.endsWith('.')) ?? recipientParts[0] ?? 'Someone';

  // 7. Process decline
  if (action === 'decline') {
    await supabaseAdmin
      .from('invites')
      .update({ status: 'declined', accepted_at: new Date().toISOString() })
      .eq('token', token);

    if (senderUser?.email) {
      await sendInviteNotification({
        to: senderUser.email,
        toName: senderFirstName,
        recipientName: recipientFirstName,
        type: invite.type,
        action: 'declined',
      });
    }

    return NextResponse.json({ success: true, action: 'declined' });
  }

  // 8. Process accept — handle by type

  // ── Spouse ─────────────────────────────────────────────────────────────────
  if (invite.type === 'spouse') {
    if (!recipientProfile || !senderProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (senderProfile.spouse_profile_id) {
      return NextResponse.json({
        error: 'The sender already has a spouse linked. Remove existing connection first.',
        code: 'SENDER_ALREADY_LINKED',
      }, { status: 409 });
    }
    if (recipientProfile.spouse_profile_id) {
      return NextResponse.json({
        error: 'You already have a spouse linked. Remove existing connection first.',
        code: 'RECIPIENT_ALREADY_LINKED',
      }, { status: 409 });
    }

    const anniversaryDate = senderProfile.anniversary_date ?? invite.metadata?.anniversary_date ?? null;

    await supabaseAdmin
      .from('profiles')
      .update({ spouse_profile_id: senderProfile.id, anniversary_date: anniversaryDate, is_shared: true })
      .eq('id', recipientProfile.id);

    await supabaseAdmin
      .from('profiles')
      .update({ spouse_profile_id: recipientProfile.id, is_shared: true })
      .eq('id', senderProfile.id);
  }

  // ── Profile Share ──────────────────────────────────────────────────────────
  if (invite.type === 'profile_share') {
    const { profile_id, can_view, can_edit, can_enroll, can_share } = invite.metadata ?? {};

    if (!profile_id) {
      return NextResponse.json({ error: 'Missing profile_id in invite metadata' }, { status: 400 });
    }

    // Check if access record already exists — avoid duplicates
    const { data: existing } = await supabaseAdmin
      .from('profile_access')
      .select('id')
      .eq('profile_id', profile_id)
      .eq('granted_to_id', session.user_id)
      .eq('granted_to_type', 'user')
      .maybeSingle();

    if (!existing) {
      await supabaseAdmin.from('profile_access').insert({
        profile_id,
        granted_by_user_id: invite.from_user_id,
        granted_to_id:      session.user_id,
        granted_to_type:    'user',
        can_view:           can_view   ?? true,
        can_edit:           can_edit   ?? false,
        can_enroll:         can_enroll ?? false,
        can_share:          can_share  ?? false,
        status:             'active',
      });
    }
  }

// ── Profile Transfer ───────────────────────────────────────────────────────
  if (invite.type === 'profile_transfer') {
    const { profile_id } = invite.metadata ?? {};
    if (!profile_id) {
      return NextResponse.json({ error: 'Missing profile_id in invite metadata' }, { status: 400 });
    }

    await supabaseAdmin.from('profile_transfers').insert({
      profile_id,
      from_user_id: invite.from_user_id,
      to_user_id:   session.user_id,
      status:       'accepted',
      requested_at: new Date().toISOString(),
      responded_at: new Date().toISOString(),
      expires_at:   invite.expires_at,
      created_by:   invite.from_user_id,
    });
  }

  // ── Company Admin Invite ───────────────────────────────────────────────────
if (invite.type === 'company_admin_invite') {
    const company_id = invite.company_id;
    if (!company_id) {

      return NextResponse.json({ error: 'Missing company_id in invite metadata' }, { status: 400 });
    }

    const { data: existing } = await supabaseAdmin
      .from('user_roles')
      .select('id')
      .eq('user_id', session.user_id)
      .eq('company_id', company_id)
      .maybeSingle();

if (!existing) {
      await supabaseAdmin.from('user_roles').insert({
        user_id:    session.user_id,
        company_id,
        role_id:    'f8b0dce1-1d12-4c1b-b52c-10d4ed473f62',
        is_active:  true,
        assigned_by: invite.from_user_id,
        created_by: invite.from_user_id,
        created_at: new Date().toISOString(),
      });
    }
  }

  // 9. Mark invite as accepted
  await supabaseAdmin
    .from('invites')
    .update({ status: 'accepted', accepted_at: new Date().toISOString() })
    .eq('token', token);

  // 10. Notify sender
  if (senderUser?.email) {
    await sendInviteNotification({
      to: senderUser.email,
      toName: senderFirstName,
      recipientName: recipientFirstName,
      type: invite.type,
      action: 'accepted',
    });
  }

  return NextResponse.json({ success: true, action: 'accepted' });
}
