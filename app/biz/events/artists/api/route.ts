// THIS FILE GOES IN: app/biz/events/artists/api/route.ts (REPLACES existing file)
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { checkEventAccess } from '@/lib/eventAccess'
import { checkEventEditable, flagPendingEditsIfActive } from '@/lib/eventEditFlag'

const unauth = () => NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
// A refused person is told the event "cannot be found", never "not allowed".
const noEvent = () => NextResponse.json({ error: 'Event not found' }, { status: 404 })
const mayUse = async (req: NextRequest, session: any, eventId: string, mode: 'view' | 'edit') =>
  (await checkEventAccess(req, session, { eventId }, mode)).ok

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return unauth()
  const eventId = req.nextUrl.searchParams.get('event_id')
  const search = req.nextUrl.searchParams.get('search')
  const specialities = req.nextUrl.searchParams.get('specialities')
  const mine = req.nextUrl.searchParams.get('mine')
  if (specialities === 'true') {
    const { data, error } = await supabaseAdmin.from('artist_specialities').select('id, name').eq('status', 'active').order('display_order')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data: data || [] })
  }
  if (mine === 'true') {
    const { data, error } = await supabaseAdmin.from('artists').select('id, name, status, created_at')
      .eq('created_by', session.user_id).in('status', ['pending', 'rejected']).order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data: data || [] })
  }
  if (search !== null) {
    const { data, error } = await supabaseAdmin.from('artists').select('id, name, photo_url')
      .eq('status', 'active').ilike('name', `%${search}%`).order('name').limit(20)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data: data || [] })
  }
  if (!eventId) return NextResponse.json({ error: 'event_id required' }, { status: 400 })
  if (!(await mayUse(req, session, eventId, 'view'))) return noEvent()
  const { data, error } = await supabaseAdmin.from('event_artist_assignments').select('id, artists(id, name, photo_url)').eq('event_id', eventId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data || [] })
}

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return unauth()
  const body = await req.json()
  const { action } = body
  if (action === 'create_artist') {
    const { name, photo_url, speciality_id, new_speciality_name, gender, dob, home_town, country,
      social_facebook_url, social_instagram_url, social_x_url, social_youtube_url, social_website_url } = body
    if (!name || !photo_url) return NextResponse.json({ error: 'Name and photo are required' }, { status: 400 })
    let finalSpecialityId = speciality_id
    if (!finalSpecialityId && new_speciality_name?.trim()) {
      const { data: newSpec, error: specErr } = await supabaseAdmin.from('artist_specialities').insert({ name: new_speciality_name.trim(), created_by: session.user_id }).select().single()
      if (specErr) return NextResponse.json({ error: specErr.message }, { status: 500 })
      finalSpecialityId = newSpec.id
    }
    if (!finalSpecialityId) return NextResponse.json({ error: 'Speciality is required' }, { status: 400 })
    const { data, error } = await supabaseAdmin.from('artists').insert({
      name, photo_url, speciality_id: finalSpecialityId, gender: gender || null, dob: dob || null,
      home_town: home_town || null, country: country || null,
      social_facebook_url: social_facebook_url || null, social_instagram_url: social_instagram_url || null,
      social_x_url: social_x_url || null, social_youtube_url: social_youtube_url || null, social_website_url: social_website_url || null,
      status: 'pending', created_by: session.user_id
    }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  }
  if (action === 'assign') {
    const { event_id, artist_id } = body
    if (!event_id || !artist_id) return NextResponse.json({ error: 'event_id and artist_id required' }, { status: 400 })
    if (!(await mayUse(req, session, event_id, 'edit'))) return noEvent()
    // the artist must be active, or created by this same person (a new artist waiting for approval)
    const { data: ar } = await supabaseAdmin.from('artists').select('status, created_by').eq('id', artist_id).maybeSingle()
    if (!ar || (ar.status !== 'active' && ar.created_by !== session.user_id)) return NextResponse.json({ error: 'Artist not available' }, { status: 400 })
    const editable = await checkEventEditable(event_id)
    if (editable.error) return NextResponse.json({ error: editable.error }, { status: 400 })
    const { data, error } = await supabaseAdmin.from('event_artist_assignments').insert({ event_id, artist_id }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await flagPendingEditsIfActive(event_id, editable.status!)
    return NextResponse.json({ data })
  }
  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

export async function DELETE(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return unauth()
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const { data: row } = await supabaseAdmin.from('event_artist_assignments').select('event_id').eq('id', id).maybeSingle()
  if (!row || !(await mayUse(req, session, row.event_id, 'edit'))) return noEvent()
  const editable = await checkEventEditable(row.event_id)
  if (editable.error) return NextResponse.json({ error: editable.error }, { status: 400 })
  const { error } = await supabaseAdmin.from('event_artist_assignments').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await flagPendingEditsIfActive(row.event_id, editable.status!)
  return NextResponse.json({ data: true })
}
