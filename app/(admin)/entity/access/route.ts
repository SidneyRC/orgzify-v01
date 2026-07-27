// THIS FILE GOES IN: app/(admin)/entity/access/route.ts (REPLACES existing file)
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getActiveEntityContext } from '@/lib/activeCompanyContext'

// Checks if the Reporting Office's active plan grants access to a given module.
async function checkModuleAccess(reportingCompanyId: string | null, moduleName: string): Promise<boolean> {
  if (!reportingCompanyId) return false
  const today = new Date().toISOString().slice(0, 10)

  const { data: assignment } = await supabaseAdmin
    .from('plan_assignments')
    .select('plan_id')
    .eq('orgzify_company_id', reportingCompanyId)
    .eq('assigned_to_type', 'company')
    .eq('status', 'active')
    .lte('start_date', today)
    .or(`end_date.is.null,end_date.gte.${today}`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!assignment?.plan_id) return false

  const { data: page } = await supabaseAdmin
    .from('plan_page_access')
    .select('id')
    .eq('plan_id', assignment.plan_id)
    .eq('module', moduleName)
    .eq('can_view', true)
    .limit(1)
    .maybeSingle()
  return !!page
}

export async function GET(req: NextRequest) {
  const cookieStore = await cookies()
  const { session, entityId } = await getActiveEntityContext(cookieStore)

  if (!session) return NextResponse.json({ allowed: false, reason: 'no_session' })
  if (!entityId) return NextResponse.json({ allowed: false, reason: 'not_found' }, { status: 404 })

  const { data: entity } = await supabaseAdmin
    .from('entities')
    .select('id, display_name, status, user_id, reporting_company_id, process_id')
    .eq('id', entityId)
    .maybeSingle()
  if (!entity) return NextResponse.json({ allowed: false, reason: 'not_found' }, { status: 404 })

  const { data: userRow } = await supabaseAdmin
    .from('users').select('is_super_admin').eq('id', session.user_id).maybeSingle()

  const isOwner = entity.user_id === session.user_id
  const isSuperAdmin = userRow?.is_super_admin === true
  if (!isOwner && !isSuperAdmin) return NextResponse.json({ allowed: false, reason: 'wrong_user' })

  let moduleAccess = { pages: false, academy: false, events: false }
  if (entity.status === 'active') {
    moduleAccess = {
      pages: await checkModuleAccess(entity.reporting_company_id, 'pages'),
      academy: await checkModuleAccess(entity.reporting_company_id, 'academy'),
      events: await checkModuleAccess(entity.reporting_company_id, 'events'),
    }
  }

  let reason: string | null = null
  if (['rejected', 'suspended', 'blocked'].includes(entity.status)) {
    const { data: note } = await supabaseAdmin
      .from('entity_review_notes')
      .select('note, entity_status_reasons(reason_label)')
      .eq('entity_id', entity.id)
      .in('action_type', ['reject', 'suspend', 'block'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (note) {
      const reasonRow = Array.isArray(note.entity_status_reasons) ? note.entity_status_reasons[0] : note.entity_status_reasons
      const label = (reasonRow as any)?.reason_label
      reason = label && note.note ? `${label} — ${note.note}` : (label || note.note || null)
    }
  }

  return NextResponse.json({
    allowed: true,
    status: entity.status,
    entity_name: entity.display_name,
    entity_id: entity.id,
    process_id: entity.process_id,
    module_access: moduleAccess,
    reason,
  })
}
