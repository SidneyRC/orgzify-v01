import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getActiveCompanyContext } from '@/lib/activeCompanyContext'
import { getCompanyRights } from '@/lib/getCompanyRights'

const DEFAULT_THEME_ID = '5ad85f55-6fab-4db2-a8e3-b1507a39de86'

export async function GET(req: NextRequest) {
  const cookieStore = await cookies()
  const { session, companyId } = await getActiveCompanyContext(cookieStore)

  if (!session) return NextResponse.json({ allowed: false, reason: 'no_session' })
  if (!companyId) return NextResponse.json({ allowed: false, reason: 'not_found' }, { status: 404 })

  const { data: company } = await supabaseAdmin
    .from('companies').select('id, display_name, theme_id, process_id').eq('id', companyId).maybeSingle()
  if (!company) return NextResponse.json({ allowed: false, reason: 'not_found' }, { status: 404 })

  const themeIdToUse = company.theme_id || DEFAULT_THEME_ID
  const { data: theme } = await supabaseAdmin
    .from('company_themes').select('page_bg, btn_bg, btn_text, color_text_primary, color_text_muted, global_border_radius')
    .eq('id', themeIdToUse).maybeSingle()

  const { data: roleRow } = await supabaseAdmin
    .from('user_roles').select('role_id, admin_roles(name)')
    .eq('user_id', session.user_id).eq('company_id', company.id).eq('is_active', true).maybeSingle()

  if (!roleRow) return NextResponse.json({ allowed: false, reason: 'wrong_user' })

  const rights = await getCompanyRights(session.user_id, company.id)
  const roleName = Array.isArray(roleRow.admin_roles) ? roleRow.admin_roles[0]?.name : (roleRow.admin_roles as any)?.name

  return NextResponse.json({ allowed: true, role: roleName ?? 'Company Admin', company_name: company.display_name, company_id: company.id, theme, rights })
}