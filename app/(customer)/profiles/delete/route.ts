// app/(customer)/profiles/delete/route.ts
// POST /profiles/delete
// If profile belongs to someone else → remove my access only
// If profile is mine → clear all links + soft delete

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const { profile_id } = await req.json();
  if (!profile_id) return NextResponse.json({ error: 'profile_id required' }, { status: 400 });

  // 1. Load the profile
  const { data: profile, error: profErr } = await supabaseAdmin
    .from('profiles')
    .select('id, relationship, profile_status, spouse_profile_id, user_id, is_shared')
    .eq('id', profile_id)
    .single();

  if (profErr || !profile) {
    return NextResponse.json({ error: 'Profile not found.' }, { status: 404 });
  }

  // 2. If profile belongs to someone else → remove my access only
  if (profile.user_id !== session.user_id) {
    await supabaseAdmin
      .from('profile_access')
      .update({ status: 'removed', updated_at: new Date().toISOString() })
      .eq('profile_id', profile_id)
      .eq('granted_by_user_id', session.user_id);

    return NextResponse.json({ success: true, action: 'access_removed' });
  }

  // 3. Block Self profile deletion
  if (profile.relationship.toLowerCase() === 'self') {
    return NextResponse.json({ error: 'Cannot delete your main profile.' }, { status: 400 });
  }

  // 4. If spouse_profile_id is set → clear both sides
  if (profile.spouse_profile_id) {
    await supabaseAdmin
      .from('profiles')
      .update({ spouse_profile_id: null, is_shared: false, updated_at: new Date().toISOString() })
      .eq('id', profile.spouse_profile_id);

    // Also mark invite as unlinked
    await supabaseAdmin
      .from('invites')
      .update({ status: 'unlinked' })
      .eq('type', 'spouse')
      .eq('status', 'accepted')
      .or(`from_user_id.eq.${session.user_id},to_email.eq.${session.user_id}`);
  }

  // 5. Clear all profile_access records for this profile
  await supabaseAdmin
    .from('profile_access')
    .update({ status: 'removed', updated_at: new Date().toISOString() })
    .eq('profile_id', profile_id);

  // 6. Soft delete — clear is_shared + mark deleted
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      spouse_profile_id: null,
      is_shared:         false,
      profile_status:    'deleted',
      updated_at:        new Date().toISOString(),
    })
    .eq('id', profile_id);

  if (error) return NextResponse.json({ error: 'Failed to delete profile.' }, { status: 500 });

  return NextResponse.json({ success: true, action: 'deleted' });
}
