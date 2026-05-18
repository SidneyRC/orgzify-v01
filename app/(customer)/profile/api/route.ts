import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin';
import { getSession } from '@/lib/auth';

// GET — Load profile data
export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.profile_id)
    .single();

  if (error) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  return NextResponse.json({ profile: data });
}

// PUT — Save profile data
export async function PUT(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const {
    full_name, mobile, whatsapp, whatsapp_number,
    dob, gender, current_status, current_status_detail,
    city, pincode, anniversary_date, area_of_interest, about,
  } = await req.json();

  // WhatsApp logic — if same as mobile, copy mobile number
  const wa_number = whatsapp ? mobile : whatsapp_number;

  // Check mandatory fields for profile completion
  const is_complete = !!(
    full_name && mobile && dob && gender &&
    current_status && city && area_of_interest?.length > 0
  );

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name,
      mobile,
      whatsapp_number: wa_number,
      dob,
      gender,
      current_status,
      current_status_detail,
      city,
      pincode,
      anniversary_date: anniversary_date || null,
      area_of_interest: JSON.stringify(area_of_interest),
      about,
      is_complete,
      updated_at: new Date().toISOString(),
    })
    .eq('id', session.profile_id);

  if (error) {
    console.error('Profile update error:', error.message);
    return NextResponse.json({ error: 'Failed to save profile.' }, { status: 500 });
  }

  return NextResponse.json({ success: true, is_complete });
}
