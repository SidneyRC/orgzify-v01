// app/(customer)/profiles/api/route.ts
// GET /profiles/api         — all profiles for logged-in user
// GET /profiles/api?id=xxx  — single profile for edit mode
// is_shared driven by live count of active rows in profile_access

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profileId = req.nextUrl.searchParams.get('id');

  // ── Single profile fetch (edit mode) ──────────────────────────────────────
  if (profileId) {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, title, relationship, photo_url, city, pincode, current_status, mobile, whatsapp_number, email, dob, gender, is_shared, parent_profile_id, spouse_profile_id')
      .eq('id', profileId)
      .eq('user_id', session.user_id)
.eq('profile_status', 'active')
.single();

if (error || !data) {
  const { data: access } = await supabaseAdmin
    .from('profile_access')
    .select('id')
    .eq('profile_id', profileId)
    .eq('granted_to_id', session.user_id)
    .eq('status', 'active')
    .maybeSingle();

  if (!access) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  const { data: sharedData, error: sharedError } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, title, relationship, photo_url, city, pincode, current_status, mobile, whatsapp_number, email, dob, gender, is_shared, parent_profile_id, spouse_profile_id')
    .eq('id', profileId)
    .eq('profile_status', 'active')
    .single();

  if (sharedError || !sharedData) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  return NextResponse.json({ profile: sharedData });
}

return NextResponse.json({ profile: data });
}

  // ── All profiles fetch ─────────────────────────────────────────────────────
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, title, relationship, photo_url, city, current_status, parent_profile_id, spouse_profile_id')
    .eq('user_id', session.user_id)
    .eq('profile_status', 'active')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Profiles fetch error:', error.message);
    return NextResponse.json({ error: 'Failed to load profiles.' }, { status: 500 });
  }

  // ── Enrich each profile with live is_shared count ─────────────────────────
  const enriched = await Promise.all((data ?? []).map(async (p) => {
    const { count } = await supabaseAdmin
      .from('profile_access')
      .select('id', { count: 'exact', head: true })
      .eq('profile_id', p.id)
      .eq('status', 'active');

    return { ...p, is_shared: (count ?? 0) > 0 };
  }));

  return NextResponse.json({ profiles: enriched });
}
