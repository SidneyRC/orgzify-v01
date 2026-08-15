// THIS FILE GOES IN: app/biz/events/media/api/route.ts (REPLACES existing file)
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import sharp from 'sharp'

const MAX_VIDEO_SIZE = 100 * 1024 * 1024
const MAX_BANNER_IMAGE_SIZE = 2 * 1024 * 1024
const MAX_BANNERS = 5
const BUCKET = 'event-media'

function extractPath(fileUrl: string) {
  const marker = `${BUCKET}/`
  const idx = fileUrl.indexOf(marker)
  return idx === -1 ? null : fileUrl.slice(idx + marker.length)
}

async function checkEventEditable(eventId: string) {
  const { data: event } = await supabaseAdmin.from('events').select('status').eq('id', eventId).maybeSingle()
  if (!event) return { error: 'Event not found' }
  if (event.status === 'pending') return { error: "This event is awaiting Admin review and can't be edited right now." }
  return { status: event.status }
}

async function flagUnderReviewIfActive(eventId: string, status: string) {
  if (status === 'active') await supabaseAdmin.from('events').update({ under_review: true }).eq('id', eventId)
}

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const eventId = req.nextUrl.searchParams.get('event_id')
  if (!eventId) return NextResponse.json({ error: 'Missing event_id' }, { status: 400 })

  const { data, error } = await supabaseAdmin.from('event_media')
    .select('*').eq('event_id', eventId).order('sort_order')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data || [] })
}

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const eventId = formData.get('event_id') as string | null
  const section = formData.get('section') as string | null
  const caption = (formData.get('caption') as string | null) || null
  const consentGiven = formData.get('consent_given') === 'true'
  const isDefaultBanner = formData.get('is_default_banner') === 'true'
  const orientation = (formData.get('orientation') as string | null) || 'horizontal'

  if (!file || !eventId || !section) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  if (!['banner', 'gallery'].includes(section)) return NextResponse.json({ error: 'Invalid section' }, { status: 400 })
  if (!consentGiven) return NextResponse.json({ error: 'Usage consent is required before upload' }, { status: 400 })

  const editable = await checkEventEditable(eventId)
  if (editable.error) return NextResponse.json({ error: editable.error }, { status: 400 })

  const isVideo = file.type.startsWith('video/')
  const isImage = file.type.startsWith('image/')
  if (!isVideo && !isImage) return NextResponse.json({ error: 'File must be an image or video' }, { status: 400 })
  if (isVideo && file.size > MAX_VIDEO_SIZE) return NextResponse.json({ error: 'Video must be under 100MB' }, { status: 400 })
  if (section === 'banner' && isImage && file.size > MAX_BANNER_IMAGE_SIZE) return NextResponse.json({ error: 'Banner image must be under 2MB' }, { status: 400 })

  if (section === 'banner') {
    const { count } = await supabaseAdmin.from('event_media').select('id', { count: 'exact', head: true }).eq('event_id', eventId).eq('section', 'banner')
    if ((count || 0) >= MAX_BANNERS) return NextResponse.json({ error: `Maximum ${MAX_BANNERS} banners allowed` }, { status: 400 })
  }

  let buffer: Buffer
  let ext: string
  let contentType: string
  let width: number | null = null
  let height: number | null = null

  if (isImage) {
    const inputBuffer = Buffer.from(await file.arrayBuffer())
    if (section === 'banner') {
      buffer = await sharp(inputBuffer).resize(1600, 800, { fit: 'cover', position: 'center' }).webp({ quality: 85 }).toBuffer()
    } else if (orientation === 'vertical') {
      buffer = await sharp(inputBuffer).resize(800, 1200, { fit: 'cover', position: 'center' }).webp({ quality: 85 }).toBuffer()
    } else {
      buffer = await sharp(inputBuffer).resize(1600, 800, { fit: 'cover', position: 'center' }).webp({ quality: 85 }).toBuffer()
    }
    const meta = await sharp(buffer).metadata()
    width = meta.width ?? null
    height = meta.height ?? null
    ext = 'webp'; contentType = 'image/webp'
  } else {
    buffer = Buffer.from(await file.arrayBuffer())
    ext = file.name.split('.').pop() || 'mp4'
    contentType = file.type
  }

  const fileName = `${eventId}/${section}/${crypto.randomUUID()}.${ext}`
  const { error: uploadError } = await supabaseAdmin.storage.from(BUCKET).upload(fileName, buffer, { contentType, upsert: false })
  if (uploadError) return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 })

  const { data: urlData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(fileName)

  if (section === 'banner' && isDefaultBanner) {
    if (!isImage) return NextResponse.json({ error: 'Default banner must be an image' }, { status: 400 })
    await supabaseAdmin.from('event_media').update({ is_default_banner: false }).eq('event_id', eventId).eq('section', 'banner').eq('is_default_banner', true)
  }

  const { data: maxRow } = await supabaseAdmin.from('event_media').select('sort_order').eq('event_id', eventId).eq('section', section).order('sort_order', { ascending: false }).limit(1).maybeSingle()
  const sortOrder = (maxRow?.sort_order ?? -1) + 1

  const { data, error } = await supabaseAdmin.from('event_media').insert({
    event_id: eventId, section, media_type: isVideo ? 'video' : 'image', file_url: urlData.publicUrl,
    is_default_banner: section === 'banner' && isDefaultBanner, caption, sort_order: sortOrder, width, height,
    consent_given: true, consent_by: session.user_id, consent_at: new Date().toISOString()
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await flagUnderReviewIfActive(eventId, editable.status!)
  return NextResponse.json({ data })
}

export async function PATCH(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const body = await req.json()
  const { action, id } = body
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  if (action === 'set_default') {
    const { data: row } = await supabaseAdmin.from('event_media').select('event_id, section, media_type').eq('id', id).maybeSingle()
    if (!row || row.section !== 'banner') return NextResponse.json({ error: 'Not a banner item' }, { status: 400 })
    if (row.media_type !== 'image') return NextResponse.json({ error: 'Default banner must be an image' }, { status: 400 })
    const editable = await checkEventEditable(row.event_id)
    if (editable.error) return NextResponse.json({ error: editable.error }, { status: 400 })
    await supabaseAdmin.from('event_media').update({ is_default_banner: false }).eq('event_id', row.event_id).eq('section', 'banner').eq('is_default_banner', true)
    const { data, error } = await supabaseAdmin.from('event_media').update({ is_default_banner: true }).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await flagUnderReviewIfActive(row.event_id, editable.status!)
    return NextResponse.json({ data })
  }

  if (action === 'update_caption') {
    const { data: row } = await supabaseAdmin.from('event_media').select('event_id').eq('id', id).maybeSingle()
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const editable = await checkEventEditable(row.event_id)
    if (editable.error) return NextResponse.json({ error: editable.error }, { status: 400 })
    const { data, error } = await supabaseAdmin.from('event_media').update({ caption: body.caption || null }).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await flagUnderReviewIfActive(row.event_id, editable.status!)
    return NextResponse.json({ data })
  }

  if (action === 'reorder') {
    const { items } = body as { items: { id: string; sort_order: number }[] }
    if (!Array.isArray(items) || !items.length) return NextResponse.json({ error: 'Missing items' }, { status: 400 })
    const { data: firstRow } = await supabaseAdmin.from('event_media').select('event_id').eq('id', items[0].id).maybeSingle()
    if (!firstRow) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const editable = await checkEventEditable(firstRow.event_id)
    if (editable.error) return NextResponse.json({ error: editable.error }, { status: 400 })
    for (const item of items) {
      await supabaseAdmin.from('event_media').update({ sort_order: item.sort_order }).eq('id', item.id)
    }
    await flagUnderReviewIfActive(firstRow.event_id, editable.status!)
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

export async function DELETE(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { data: row } = await supabaseAdmin.from('event_media').select('file_url, event_id').eq('id', id).maybeSingle()
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const editable = await checkEventEditable(row.event_id)
  if (editable.error) return NextResponse.json({ error: editable.error }, { status: 400 })

  const path = extractPath(row.file_url)
  if (path) await supabaseAdmin.storage.from(BUCKET).remove([path])

  const { error } = await supabaseAdmin.from('event_media').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await flagUnderReviewIfActive(row.event_id, editable.status!)
  return NextResponse.json({ success: true })
}
