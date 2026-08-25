// app/event/event-interest/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req)
    if (!session) {
      return NextResponse.json({ error: 'not_logged_in' }, { status: 401 })
    }

    const { event_id } = await req.json()
    if (!event_id) {
      return NextResponse.json({ error: 'event_id is required' }, { status: 400 })
    }

    const { data: existing } = await supabaseAdmin
      .from('event_interests')
      .select('id')
      .eq('event_id', event_id)
      .eq('user_id', session.user_id)
      .maybeSingle()

    let interested: boolean

    if (existing) {
      await supabaseAdmin.from('event_interests').delete().eq('id', existing.id)
      interested = false
    } else {
      const { error: insertErr } = await supabaseAdmin
        .from('event_interests')
        .insert({ event_id, user_id: session.user_id })
      if (insertErr) {
        console.error('event_interests insert error:', insertErr.message)
        return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
      }
      interested = true
    }

    const { count } = await supabaseAdmin
      .from('event_interests')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', event_id)

    return NextResponse.json({ interested, count: count || 0 })
  } catch (err) {
    console.error('event-interest error:', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}