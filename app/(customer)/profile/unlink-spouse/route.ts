// app/(customer)/profile/unlink-spouse/route.ts
// POST /profile/unlink-spouse
// Clears spouse_profile_id on both profiles, sets is_shared=false on both
// Clears anniversary_date on recipient only, updates invite status to unlinked

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  // Load sender's Self profile
  const { data: senderProfile, error: senderErr } = await supabaseAdmin
    .from('profiles')
    .select('id, spouse_profile_id, anniversary_date')
    .eq('user_id', session.user_id)
    .eq('relationship', 'Self')
    .single();

  if (senderErr || !senderProfile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  if (!senderProfile.spouse_profile_id) {
    return NextResponse.json({ error: 'No spouse currently linked' }, { status: 400 });
  }

  const recipientProfileId = senderProfile.spouse_profile_id;

  // Clear sender — remove spouse link + is_shared
  await supabaseAdmin
    .from('profiles')
    .update({ spouse_profile_id: null })
    .eq('id', senderProfile.id);

  // Clear recipient — remove spouse link + is_shared + clear anniversary_date
  await supabaseAdmin
    .from('profiles')
    .update({ spouse_profile_id: null, anniversary_date: null })
    .eq('id', recipientProfileId);

  // Mark invite as unlinked
  await supabaseAdmin
    .from('invites')
    .update({ status: 'unlinked' })
    .eq('from_user_id', session.user_id)
    .eq('type', 'spouse')
    .eq('status', 'accepted');

  return NextResponse.json({ success: true });
}
