// THIS FILE GOES IN: app/biz/events/media/api/route.ts (REPLACES existing file)
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { checkEventAccess } from '@/lib/eventAccess'
import { checkEventEditable, flagPendingEditsIfActive } from '@/lib/eventEditFlag'
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

// A refused person is told the event "cannot be found", never "not allowed".
const noEvent = () => NextResponse.json({ error: 'Event not found' }, { status: 404 })
const mayUse = async (req: NextRequest, session: any, eventId: string | null, mode: 'view' | 'edit') =>
  (await checkEventAccess(req, session, { eventId: eventId || undefined }, mode)).ok

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const eventId = req.nextUrl.searchParams.get('event_id')
  if (!eventId) return NextResponse.json({ error: 'Missing event_id' }, { status: 400 })
  if (!(await mayUse(req, session, eventId, 'view'))) return noEvent()

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
  if (!(await mayUse(req, session, eventId, 'edit'))) return noEvent()
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
  await flagPendingEditsIfActive(eventId, editable.status!)
  return NextResponse.json({ data })
}

export async function PATCH(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const body = await req.json()
  const { action, id } = body

  if (action === 'reorder') {
    const { items } = body as { items: { id: string; sort_order: number }[] }
    if (!Array.isArray(items) || !items.length || !items.every(i => i && typeof i.id === 'string' && Number.isInteger(i.sort_order))) return NextResponse.json({ error: 'Missing items' }, { status: 400 })
    const ids = [...new Set(items.map(i => i.id))]
    const { data: rows } = await supabaseAdmin.from('event_media').select('id, event_id').in('id', ids)
    const owners = [...new Set((rows || []).map((r: any) => r.event_id))] as string[]
    // every picture must exist and belong to ONE event
    if ((rows || []).length !== ids.length || owners.length !== 1) return noEvent()
    if (!(await mayUse(req, session, owners[0], 'edit'))) return noEvent()
    const editable = await checkEventEditable(owners[0])
    if (editable.error) return NextResponse.json({ error: editable.error }, { status: 400 })
    for (const item of items) {
      await supabaseAdmin.from('event_media').update({ sort_order: item.sort_order }).eq('id', item.id)
    }
    await flagPendingEditsIfActive(owners[0], editable.status!)
    return NextResponse.json({ success: true })
  }

  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const { data: row } = await supabaseAdmin.from('event_media').select('event_id, section, media_type').eq('id', id).maybeSingle()
  if (!row || !(await mayUse(req, session, row.event_id, 'edit'))) return noEvent()

  if (action === 'set_default') {
    if (row.section !== 'banner') return NextResponse.json({ error: 'Not a banner item' }, { status: 400 })
    if (row.media_type !== 'image') return NextResponse.json({ error: 'Default banner must be an image' }, { status: 400 })
    const editable = await checkEventEditable(row.event_id)
    if (editable.error) return NextResponse.json({ error: editable.error }, { status: 400 })
    await supabaseAdmin.from('event_media').update({ is_default_banner: false }).eq('event_id', row.event_id).eq('section', 'banner').eq('is_default_banner', true)
    const { data, error } = await supabaseAdmin.from('event_media').update({ is_default_banner: true }).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  }

  if (action === 'update_caption') {
    const editable = await checkEventEditable(row.event_id)
    if (editable.error) return NextResponse.json({ error: editable.error }, { status: 400 })
    const { data, error } = await supabaseAdmin.from('event_media').update({ caption: body.caption || null }).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await flagPendingEditsIfActive(row.event_id, editable.status!)
    return NextResponse.json({ data })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

export async function DELETE(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { data: row } = await supabaseAdmin.from('event_media').select('file_url, event_id').eq('id', id).maybeSingle()
  if (!row || !(await mayUse(req, session, row.event_id, 'edit'))) return noEvent()
  const editable = await checkEventEditable(row.event_id)
  if (editable.error) return NextResponse.json({ error: editable.error }, { status: 400 })

  const path = extractPath(row.file_url)
  if (path) await supabaseAdmin.storage.from(BUCKET).remove([path])

  const { error } = await supabaseAdmin.from('event_media').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await flagPendingEditsIfActive(row.event_id, editable.status!)
  return NextResponse.json({ success: true })
}
