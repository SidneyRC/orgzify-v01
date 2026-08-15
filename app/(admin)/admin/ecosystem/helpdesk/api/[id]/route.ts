// GOES IN: app/(admin)/admin/ecosystem/helpdesk/api/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getSession } from '@/lib/auth'
import { getActiveCompanyId } from '@/lib/activeCompanyContext'
import { getHelpDeskAccess, isPairAllowed } from '@/lib/helpDeskAccess'
import { resolveReference } from '@/lib/helpDeskResolveReference'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { data: ticket } = await supabaseAdmin.from('help_desk_tickets').select('*').eq('id', id).maybeSingle()
  if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })

  const activeCompanyId = await getActiveCompanyId(req.cookies)
  const access = await getHelpDeskAccess(session, activeCompanyId)
  if (!isPairAllowed(access, ticket.sub_category_id, ticket.status_code)) {
    return NextResponse.json({ error: 'Not authorised for this ticket' }, { status: 403 })
  }

  const [{ data: category }, { data: subCategory }, { data: statusRow }, refInfo] = await Promise.all([
    supabaseAdmin.from('categories').select('name').eq('id', ticket.category_id).maybeSingle(),
    supabaseAdmin.from('categories').select('name').eq('id', ticket.sub_category_id).maybeSingle(),
    supabaseAdmin.from('help_desk_ticket_status_master').select('label').eq('code', ticket.status_code).maybeSingle(),
    resolveReference(ticket.reference_type, ticket.reference_id),
  ])

  const { data: activity } = await supabaseAdmin.from('help_desk_ticket_activity')
    .select('id, activity_type, message, field_changed, old_value, new_value, visibility, is_edited, created_by, created_at')
    .eq('ticket_id', ticket.id).order('created_at')

  const authorIds = [...new Set((activity || []).map((a: any) => a.created_by).filter(Boolean))]
  const [{ data: staffAuthors }, { data: profileAuthors }] = await Promise.all([
    authorIds.length ? supabaseAdmin.from('admin_staff').select('user_id, name, staff_enrollment_number').in('user_id', authorIds) : { data: [] },
    authorIds.length ? supabaseAdmin.from('profiles').select('user_id, full_name').in('user_id', authorIds) : { data: [] },
  ])
  const staffMap = Object.fromEntries((staffAuthors || []).map((s: any) => [s.user_id, `${s.staff_enrollment_number || '—'} · ${s.name}`]))
  const profileMap = Object.fromEntries((profileAuthors || []).map((p: any) => [p.user_id, p.full_name]))
  const activityWithAuthors = (activity || []).map((a: any) => ({ ...a, author_label: staffMap[a.created_by] || profileMap[a.created_by] || '—' }))

  const { data: attachments } = await supabaseAdmin.from('help_desk_ticket_attachments')
    .select('id, file_url, file_name, visibility, created_at').eq('ticket_id', ticket.id).eq('is_removed', false).order('created_at')

  return NextResponse.json({
    ticket: {
      ...ticket, category_name: category?.name || '—', sub_category_name: subCategory?.name || '—',
      status_label: statusRow?.label || ticket.status_code, reference_label: refInfo.label, open_url: refInfo.openUrl
    },
    activity: activity || [], attachments: attachments || []
  })
}
