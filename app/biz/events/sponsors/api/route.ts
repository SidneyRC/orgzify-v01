// THIS FILE GOES IN: app/biz/events/sponsors/api/route.ts (NEW FILE - THIS WAS MISSING)
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(req: NextRequest) {
  const eventId = req.nextUrl.searchParams.get('event_id')
  const search = req.nextUrl.searchParams.get('search')
  const mine = req.nextUrl.searchParams.get('mine')

  if (mine === 'true') {
    const session = await getSession(req)
    if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    const { data, error } = await supabaseAdmin.from('sponsors').select('id, name, status, created_at')
      .eq('created_by', session.user_id).in('status', ['pending', 'rejected']).order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data: data || [] })
  }

  if (search !== null) {
    const { data, error } = await supabaseAdmin
      .from('sponsors')
      .select('id, name, logo_url')
      .eq('status', 'approved')
      .eq('is_enabled', true)
      .ilike('name', `%${search}%`)
      .order('name')
      .limit(20)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data: data || [] })
  }

  if (!eventId) return NextResponse.json({ error: 'event_id required' }, { status: 400 })
  const { data, error } = await supabaseAdmin
    .from('event_sponsors')
    .select('id, sponsor_type, sponsors(id, name, logo_url)')
    .eq('event_id', eventId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data || [] })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { action } = body

  if (action === 'create_sponsor') {
    const session = await getSession(req)
    if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    const { name, logo_url } = body
    if (!name || !logo_url) return NextResponse.json({ error: 'Name and logo are required' }, { status: 400 })
    const { data, error } = await supabaseAdmin
      .from('sponsors')
      .insert({ name, logo_url, status: 'pending', is_enabled: true, created_by: session.user_id })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  }

  if (action === 'assign') {
    const { event_id, sponsor_id, sponsor_type } = body
    if (!event_id || !sponsor_id || !sponsor_type) return NextResponse.json({ error: 'event_id, sponsor_id, sponsor_type required' }, { status: 400 })
    const { data, error } = await supabaseAdmin
      .from('event_sponsors')
      .insert({ event_id, sponsor_id, sponsor_type })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const { error } = await supabaseAdmin.from('event_sponsors').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: true })
}
