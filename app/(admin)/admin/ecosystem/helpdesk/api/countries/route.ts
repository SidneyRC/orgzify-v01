// GOES IN: app/(admin)/admin/ecosystem/helpdesk/api/countries/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { data: addresses } = await supabaseAdmin.from('company_addresses')
    .select('country_id').eq('address_type', 'registered').eq('is_active', true)
  const countryIds = [...new Set((addresses || []).map((a: any) => a.country_id))]
  if (countryIds.length === 0) return NextResponse.json({ data: [] })

  const { data: countries } = await supabaseAdmin.from('country_master')
    .select('id, name').in('id', countryIds).order('name')

  return NextResponse.json({ data: countries || [] })
}
