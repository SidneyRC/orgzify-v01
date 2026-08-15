// GOES IN: app/(admin)/admin/ecosystem/helpdesk/api/search-staff/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getSession } from '@/lib/auth'

const STAFF_FIELDS = 'id, name, email, mobile, staff_enrollment_number, status, user_id'

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const q = new URL(req.url).searchParams.get('q')?.trim() || ''
  if (q.length < 2) return NextResponse.json({ data: [] })

  const { data: zyMatches } = await supabaseAdmin.from('users').select('id').ilike('zy_id', `%${q}%`)
  const zyUserIds = (zyMatches || []).map((u: any) => u.id)

  const { data: companyMatches } = await supabaseAdmin.from('companies').select('id').ilike('display_name', `%${q}%`)
  const companyIds = (companyMatches || []).map((c: any) => c.id)

  const orParts = [`name.ilike.%${q}%`, `email.ilike.%${q}%`, `mobile.ilike.%${q}%`, `staff_enrollment_number.ilike.%${q}%`]
  const { data: direct } = await supabaseAdmin.from('admin_staff').select(STAFF_FIELDS).or(orParts.join(','))

  let byZy: any[] = []
  if (zyUserIds.length) {
    const { data } = await supabaseAdmin.from('admin_staff').select(STAFF_FIELDS).in('user_id', zyUserIds)
    byZy = data || []
  }
  let byCompany: any[] = []
  if (companyIds.length) {
    const { data } = await supabaseAdmin.from('admin_staff').select(STAFF_FIELDS)
      .or(`recruiting_office_id.in.(${companyIds.join(',')}),reporting_office_id.in.(${companyIds.join(',')})`)
    byCompany = data || []
  }

  const all = [...(direct || []), ...byZy, ...byCompany]
  const unique = Array.from(new Map(all.map(s => [s.id, s])).values())

  const results = unique.map(s => ({
    id: s.id, display_name: s.name, email: s.email, mobile: s.mobile, process_id: s.staff_enrollment_number, status: s.status
  }))
  return NextResponse.json({ data: results.slice(0, 10) })
}
