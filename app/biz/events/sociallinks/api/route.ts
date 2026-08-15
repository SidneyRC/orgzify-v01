// THIS FILE GOES IN: app/biz/events/sociallinks/api/route.ts (NEW FILE)
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(req: NextRequest) {
  const eventId = req.nextUrl.searchParams.get('event_id')
  if (!eventId) return NextResponse.json({ error: 'event_id required' }, { status: 400 })
  const { data, error } = await supabaseAdmin.from('event_social_links').select('*').eq('event_id', eventId).order('display_order')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data || [] })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { event_id, platform, url } = body
  if (!event_id || !platform || !url) return NextResponse.json({ error: 'event_id, platform, url required' }, { status: 400 })

  const { data: maxRow } = await supabaseAdmin.from('event_social_links').select('display_order').eq('event_id', event_id).order('display_order', { ascending: false }).limit(1).maybeSingle()
  const nextOrder = (maxRow?.display_order ?? -1) + 1

  const { data, error } = await supabaseAdmin.from('event_social_links').insert({ event_id, platform, url, display_order: nextOrder }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const { error } = await supabaseAdmin.from('event_social_links').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: true })
}