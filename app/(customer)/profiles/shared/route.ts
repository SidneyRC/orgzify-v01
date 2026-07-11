// app/(customer)/profiles/shared/route.ts
// GET /profiles/shared
// Returns all profiles that other users have shared with the logged-in user

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  // 1. Find all active access entries where this user is the recipient
  const { data: entries, error } = await supabaseAdmin
    .from('profile_access')
    .select('id, profile_id, can_edit, can_share')
    .eq('granted_to_id', session.user_id)
    .eq('granted_to_type', 'user')
    .eq('status', 'active');

  if (error) return NextResponse.json({ error: 'Failed to load shared profiles' }, { status: 500 });
  if (!entries || entries.length === 0) return NextResponse.json({ profiles: [] });

  // 2. Fetch profile details for each
  const profiles = await Promise.all(entries.map(async (e) => {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, photo_url, city, current_status, relationship')
      .eq('id', e.profile_id)
      .eq('profile_status', 'active')
      .maybeSingle();

    if (!profile) return null;

    return {
  access_id:      e.id,
  profile_id:     profile.id,
  full_name:      profile.full_name,
  photo_url:      profile.photo_url,
  city:           profile.city,
  current_status: profile.current_status,
  relationship:   profile.relationship,
  can_edit:       e.can_edit,
  can_share:      e.can_share,
  };
  }));

  // 3. Filter out any nulls (deleted profiles)
  const valid = profiles.filter(Boolean);

  return NextResponse.json({ profiles: valid });
}
