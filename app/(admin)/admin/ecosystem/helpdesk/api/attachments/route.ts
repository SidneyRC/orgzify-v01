// GOES IN: app/(admin)/admin/ecosystem/helpdesk/api/attachments/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getActiveCompanyId } from '@/lib/activeCompanyContext'
import { getHelpDeskAccess, isPairAllowed } from '@/lib/helpDeskAccess'
import sharp from 'sharp'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const BUCKET = 'helpdesk-attachments'

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const ticketId = formData.get('ticket_id') as string | null
  const visibility = (formData.get('visibility') as string) || 'external'
  if (!file || !ticketId) return NextResponse.json({ error: 'Missing file or ticket_id' }, { status: 400 })

  const { data: ticket } = await supabaseAdmin.from('help_desk_tickets').select('sub_category_id, status_code').eq('id', ticketId).maybeSingle()
  if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
  const activeCompanyId = await getActiveCompanyId(req.cookies)
  const access = await getHelpDeskAccess(session, activeCompanyId)
  if (!isPairAllowed(access, ticket.sub_category_id, ticket.status_code)) return NextResponse.json({ error: 'Not authorised' }, { status: 403 })

  if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'File must be under 5MB' }, { status: 400 })

  let webpBuffer: Buffer
  try {
    const inputBuffer = Buffer.from(await file.arrayBuffer())
    webpBuffer = await sharp(inputBuffer).resize(1600, 1600, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 82, effort: 6 }).toBuffer()
  } catch { return NextResponse.json({ error: 'Failed to process image' }, { status: 500 }) }

  const fileName = `${ticketId}/${Date.now()}.webp`
  const { error: uploadError } = await supabaseAdmin.storage.from(BUCKET).upload(fileName, webpBuffer, { contentType: 'image/webp' })
  if (uploadError) return NextResponse.json({ error: 'Upload failed' }, { status: 500 })

  const { data: pub } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(fileName)
  const { data: row, error } = await supabaseAdmin.from('help_desk_ticket_attachments').insert({
    ticket_id: ticketId, file_url: pub.publicUrl, file_name: file.name, uploaded_by: session.user_id, visibility
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: row })
}

export async function PATCH(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const { attachment_id } = await req.json()
  if (!attachment_id) return NextResponse.json({ error: 'Missing attachment_id' }, { status: 400 })

  await supabaseAdmin.from('help_desk_ticket_attachments').update({
    is_removed: true, removed_by: session.user_id, removed_at: new Date().toISOString()
  }).eq('id', attachment_id)

  return NextResponse.json({ success: true })
}
