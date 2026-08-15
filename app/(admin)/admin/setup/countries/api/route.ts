// GOES IN: app/(admin)/admin/setup/countries/api/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getActiveCompanyContext } from '@/lib/activeCompanyContext'
import { getFullCompanyRights } from '@/lib/getCompanyRights'
import { mapApiCountryToRow, hasChanges } from '@/lib/countriesSyncHelpers'

const SYNC_DUE_DAYS = 30
const SYNC_KEY = 'countries'

async function checkRight(right: 'can_view' | 'can_sync') {
  const cookieStore = await cookies()
  const { session, companyId } = await getActiveCompanyContext(cookieStore)
  if (!session) return false
  if (session.is_super_admin) return true
  if (!companyId) return false
  const rights = await getFullCompanyRights(session.user_id, companyId)
  return !!(rights.countries as any)?.[right]
}

export async function GET() {
  if (!(await checkRight('can_view'))) return NextResponse.json({ error: 'Access denied.' }, { status: 403 })

  const { data: countries, error } = await supabaseAdmin.from('country_master').select('*').order('name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: lock } = await supabaseAdmin.from('sync_locks').select('started_at').eq('sync_key', SYNC_KEY).maybeSingle()
  const lastSync = lock?.started_at ? new Date(lock.started_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : null
  const syncDue = lock?.started_at ? (Date.now() - new Date(lock.started_at).getTime()) > SYNC_DUE_DAYS * 24 * 60 * 60 * 1000 : true

  return NextResponse.json({ countries: countries || [], lastSync, syncDue })
}

export async function POST() {
  if (!(await checkRight('can_sync'))) return NextResponse.json({ error: 'Access denied.' }, { status: 403 })

  const { data: lock } = await supabaseAdmin.from('sync_locks').select('is_running').eq('sync_key', SYNC_KEY).maybeSingle()
  if (lock?.is_running) return NextResponse.json({ error: 'A sync is already in progress. Please wait for it to finish.' }, { status: 409 })

  await supabaseAdmin.from('sync_locks').update({ is_running: true, started_at: new Date().toISOString() }).eq('sync_key', SYNC_KEY)

  try {
    const apiKey = process.env.RESTCOUNTRIES_API_KEY
    if (!apiKey) throw new Error('RESTCOUNTRIES_API_KEY is missing from environment variables.')

    let offset = 0
    let all: any[] = []
    while (true) {
      const res = await fetch(`https://api.restcountries.com/countries/v5?limit=100&offset=${offset}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body?.errors?.[0]?.message || 'Could not reach the countries API.')
      all = all.concat(body?.data?.objects || [])
      if (!body?.data?.meta?.more) break
      offset += 100
    }

    const { data: existingRows } = await supabaseAdmin.from('country_master').select('*')
    const existingByIso2 = new Map((existingRows || []).map((r: any) => [r.iso2, r]))

    const now = new Date().toISOString()
    const toInsert: any[] = []
    const toUpdate: any[] = []
    const toTouchIds: string[] = []

    for (const c of all) {
      const row = mapApiCountryToRow(c)
      if (!row.iso2) continue
      const existing = existingByIso2.get(row.iso2)

      if (!existing) {
        toInsert.push({ ...row, is_active: true, last_synced_at: now })
      } else if (hasChanges(existing, row)) {
        toUpdate.push({ ...row, id: existing.id, last_synced_at: now })
      } else {
        toTouchIds.push(existing.id)
      }
    }

    // 3 bulk database calls total instead of ~250 one-at-a-time calls — much faster.
    if (toInsert.length) await supabaseAdmin.from('country_master').insert(toInsert)
    if (toUpdate.length) await supabaseAdmin.from('country_master').upsert(toUpdate, { onConflict: 'id' })
    if (toTouchIds.length) await supabaseAdmin.from('country_master').update({ last_synced_at: now }).in('id', toTouchIds)

    return NextResponse.json({ success: true, inserted: toInsert.length, updated: toUpdate.length, skipped: toTouchIds.length, total: all.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  } finally {
    await supabaseAdmin.from('sync_locks').update({ is_running: false }).eq('sync_key', SYNC_KEY)
  }
}
