// GOES IN: app/(admin)/admin/ecosystem/helpdesk/api/statuses/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { data } = await supabaseAdmin.from('help_desk_ticket_status_master')
    .select('code, label').eq('is_active', true).order('sort_order')

  return NextResponse.json({ data: data || [] })
}