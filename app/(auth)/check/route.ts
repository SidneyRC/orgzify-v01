// app/(auth)/check/route.ts
// GET /check?type=email&value=xxx  → checks if email exists in users table
// GET /check?type=mobile&value=xxx → checks if mobile exists in profiles table

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  const type  = req.nextUrl.searchParams.get('type');
  const value = req.nextUrl.searchParams.get('value')?.toLowerCase().trim();

  if (!type || !value) {
    return NextResponse.json({ error: 'Missing type or value' }, { status: 400 });
  }

  if (type === 'email') {
    const { data } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', value)
      .maybeSingle();
    return NextResponse.json({ exists: !!data });
  }

  if (type === 'mobile') {
    const { data } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('mobile', value)
      .maybeSingle();
    return NextResponse.json({ exists: !!data });
  }

  return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}
