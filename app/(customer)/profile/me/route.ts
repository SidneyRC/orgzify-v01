import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json(null, { status: 401 });

  // Get user info (zy_id)
  const { data: user } = await supabase
    .from('users')
    .select('zy_id, email')
    .eq('id', session.user_id)
    .single();

  // Get default profile (full name)
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, is_complete, photo_url')
    .eq('id', session.profile_id)
    .single();

  // Get academies
  const { data: academies } = await supabase
    .from('academies')
    .select('id, name, slug, status')
    .eq('owner_user_id', session.user_id);

  // Get organisations
  const { data: organisations } = await supabase
    .from('organisations')
    .select('id, name, slug, status')
    .eq('owner_user_id', session.user_id);

  return NextResponse.json({
    zy_id: user?.zy_id,
    full_name: profile?.full_name,
    is_complete: profile?.is_complete,
    academies: academies || [],
    organisations: organisations || [],
email: user?.email,
avatar: profile?.photo_url || null,
  });
}
