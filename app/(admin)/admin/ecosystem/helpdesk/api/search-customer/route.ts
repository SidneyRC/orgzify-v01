// GOES IN: app/(admin)/admin/ecosystem/helpdesk/api/search-customer/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { baseSearchUsers } from '@/lib/helpDeskSearchBase'

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const q = new URL(req.url).searchParams.get('q')?.trim() || ''
  if (q.length < 2) return NextResponse.json({ data: [] })

  const base = await baseSearchUsers(q)
  const results = base.map(b => ({
    id: b.profile_id || b.user_id, display_name: b.full_name, email: b.email, mobile: b.mobile, zy_id: b.zy_id, account_status: b.account_status
  }))

  return NextResponse.json({ data: results.slice(0, 10) })
}
