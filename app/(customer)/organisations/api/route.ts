// app/(customer)/organisations/api/route.ts
// GET  /organisations/api?type=school  — fetch organisations by type
// POST /organisations/api              — save new organisation entry

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const type = req.nextUrl.searchParams.get('type');
  if (!type) return NextResponse.json({ error: 'Missing type' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('organisations')
    .select('id, name')
    .eq('type', type)
    .order('name', { ascending: true });

  if (error) return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });

  return NextResponse.json({ organisations: data ?? [] });
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const { name, type } = await req.json();
  if (!name?.trim() || !type) return NextResponse.json({ error: 'Missing name or type' }, { status: 400 });

  // Check if already exists — avoid duplicates
  const { data: existing } = await supabaseAdmin
    .from('organisations')
    .select('id')
    .eq('name', name.trim())
    .eq('type', type)
    .maybeSingle();

  if (existing) return NextResponse.json({ success: true, duplicate: true });

  const { error } = await supabaseAdmin
    .from('organisations')
    .insert({
      name:             name.trim(),
      type,
      added_by_user_id: session.user_id,
    });

  if (error) return NextResponse.json({ error: 'Failed to save' }, { status: 500 });

  return NextResponse.json({ success: true });
}
