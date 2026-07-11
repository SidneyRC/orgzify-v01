// app/(customer)/profiles/update/route.ts
// POST /profiles/update
// Updates a sub-profile — enforces relationship rules server-side

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const {
    profile_id, relationship, full_name, dob, gender,
    current_status, city, pincode, mobile, whatsapp_number,
  } = await req.json();

  if (!profile_id) return NextResponse.json({ error: 'profile_id required' }, { status: 400 });

  // Verify ownership + not Self
let { data: profile, error: profErr } = await supabaseAdmin
    .from('profiles')
    .select('id, relationship, spouse_profile_id')
    .eq('id', profile_id)
    .eq('user_id', session.user_id)
    .single();

  if (profErr || !profile) {
    const { data: access } = await supabaseAdmin
      .from('profile_access')
      .select('id, can_edit')
      .eq('profile_id', profile_id)
      .eq('granted_to_id', session.user_id)
      .eq('status', 'active')
      .maybeSingle();

    if (!access?.can_edit) {
      return NextResponse.json({ error: 'Profile not found or access denied' }, { status: 403 });
    }

    const { data: sharedProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, relationship, spouse_profile_id')
      .eq('id', profile_id)
      .single();

    if (!sharedProfile) {
      return NextResponse.json({ error: 'Profile not found or access denied' }, { status: 403 });
    }

    profile = sharedProfile;
  }

  if (profile.relationship.toLowerCase() === 'self') {
    return NextResponse.json({ error: 'Cannot edit Self profile here.' }, { status: 400 });
  }

  // ── Relationship change rules ──────────────────────────────────────────────
  if (relationship && relationship.toLowerCase() !== profile.relationship.toLowerCase()) {

    // Cannot change TO Self ever
    if (relationship.toLowerCase() === 'self') {
      return NextResponse.json({ error: 'Cannot change relationship to Self.' }, { status: 400 });
    }

    // Cannot change TO Spouse if user already has a linked spouse (and this isn't it)
    if (relationship.toLowerCase() === 'spouse') {
      const { data: selfProfile } = await supabaseAdmin
        .from('profiles')
        .select('spouse_profile_id')
        .eq('user_id', session.user_id)
        .eq('relationship', 'Self')
        .single();

      if (selfProfile?.spouse_profile_id && selfProfile.spouse_profile_id !== profile_id) {
        return NextResponse.json({
          error: 'You already have a linked spouse. Remove existing connection first.',
        }, { status: 409 });
      }
    }

    // Cannot change FROM linked Spouse to something else
    if (profile.relationship.toLowerCase() === 'spouse' && profile.spouse_profile_id) {
      return NextResponse.json({
        error: 'Cannot change relationship of a linked spouse. Remove connection first.',
      }, { status: 409 });
    }
  }

  // ── Save update ────────────────────────────────────────────────────────────
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      relationship:    relationship ?? profile.relationship,
      full_name,
      dob,
      gender,
      current_status:  current_status || null,
      city,
      pincode:         pincode || null,
      mobile:          mobile  || null,
      whatsapp_number: whatsapp_number || null,
      updated_at:      new Date().toISOString(),
    })
    .eq('id', profile_id);

  if (error) return NextResponse.json({ error: 'Failed to save profile.' }, { status: 500 });

  return NextResponse.json({ success: true });
}
