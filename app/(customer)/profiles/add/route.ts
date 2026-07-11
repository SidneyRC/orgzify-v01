import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getSession } from '@/lib/auth';

// POST — Add a new family profile
export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const {
    relationship, full_name, dob, gender, current_status,
    city, pincode, mobile, whatsapp_number,
  } = await req.json();

  if (!full_name?.trim())   return NextResponse.json({ error: 'Full Name is required.' }, { status: 400 });
  if (!dob)                 return NextResponse.json({ error: 'Date of Birth is required.' }, { status: 400 });
  if (!gender)              return NextResponse.json({ error: 'Gender is required.' }, { status: 400 });
  if (!city?.trim())        return NextResponse.json({ error: 'City is required.' }, { status: 400 });
  if (!relationship)        return NextResponse.json({ error: 'Relationship is required.' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .insert({
      user_id: session.user_id,
      relationship: relationship.toLowerCase(),
      full_name: full_name.trim(),
      dob,
      gender,
      current_status: current_status || null,
      city: city.trim(),
      pincode: pincode || null,
      mobile: mobile || null,
      whatsapp_number: whatsapp_number || null,
      profile_status: 'active',
      created_by: session.user_id,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Add profile error:', error.message);
    return NextResponse.json({ error: 'Failed to save profile.' }, { status: 500 });
  }

  return NextResponse.json({ success: true, profile_id: data.id });
}
