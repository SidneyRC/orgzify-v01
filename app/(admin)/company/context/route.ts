// THIS FILE GOES IN: app/(admin)/company/context/route.ts (NEW FILE)
// Reads the active context cookie and returns company name/role/rights/slug
// so the shell/sidebar can display the right thing — no URL/slug needed.

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getSession } from '@/lib/auth'
import { getCompanyRights } from '@/lib/getCompanyRights'

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ type: null })

  const raw = decodeURIComponent(req.cookies.get('orgzify_context')?.value || '')
  const [type, id] = raw.split(':')

  if (type === 'company' && id) {
    const { data: company } = await supabaseAdmin.from('companies').select('id, display_name, slug').eq('process_id', id).maybeSingle()
    if (!company) return NextResponse.json({ type: null })

    const { data: roleRow } = await supabaseAdmin
      .from('user_roles').select('role_id, admin_roles(name)')
      .eq('user_id', session.user_id).eq('company_id', company.id).eq('is_active', true).maybeSingle()
    if (!roleRow) return NextResponse.json({ type: null })

    const rights = await getCompanyRights(session.user_id, company.id)
    const roleName = Array.isArray(roleRow.admin_roles) ? roleRow.admin_roles[0]?.name : (roleRow.admin_roles as any)?.name

    return NextResponse.json({ type: 'company', company_name: company.display_name, slug: company.slug, role: roleName ?? 'Company Admin', rights })
  }

  return NextResponse.json({ type: type || null })
}
