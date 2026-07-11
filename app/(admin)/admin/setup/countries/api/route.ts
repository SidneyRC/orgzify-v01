import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const SYNC_DUE_DAYS = 30

export async function GET() {
  const { data: countries, error } = await supabaseAdmin.from('country_master').select('*').order('name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: latest } = await supabaseAdmin.from('country_master').select('created_at').order('created_at', { ascending: false }).limit(1).maybeSingle()
  const lastSync = latest?.created_at ? new Date(latest.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : null
  const syncDue = latest?.created_at ? (Date.now() - new Date(latest.created_at).getTime()) > SYNC_DUE_DAYS * 24 * 60 * 60 * 1000 : true

  return NextResponse.json({ countries: countries || [], lastSync, syncDue })
}

export async function POST() {
  try {
    const res = await fetch('https://restcountries.com/v3.1/all')
    if (!res.ok) return NextResponse.json({ error: 'Could not reach restcountries.com. Please try again.' }, { status: 502 })
    const data = await res.json()
    if (!Array.isArray(data)) return NextResponse.json({ error: 'Unexpected response from restcountries.com.' }, { status: 502 })

    const rows = data.map((c: any) => {
      const currencyCode = c.currencies ? Object.keys(c.currencies)[0] : null
      const currency = currencyCode ? c.currencies[currencyCode] : null
      return {
        name: c.name?.common || '', official_name: c.name?.official || '',
        iso2: c.cca2 || '', iso3: c.cca3 || '', numeric_code: c.ccn3 || '',
        phone_code: c.idd?.root ? `${c.idd.root}${c.idd.suffixes?.[0] || ''}` : '',
        currency_code: currencyCode || '', currency_name: currency?.name || '', currency_symbol: currency?.symbol || '',
        capital: c.capital?.[0] || '', region: c.region || '', subregion: c.subregion || '',
        population: c.population || 0, flag_url: c.flags?.png || '', flag_emoji: c.flag || '',
        timezones: c.timezones || [], is_active: true,
      }
    })

    await supabaseAdmin.from('country_master').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    const { error: insertErr } = await supabaseAdmin.from('country_master').insert(rows)
    if (insertErr) return NextResponse.json({ error: 'Could not save countries. Please try again.' }, { status: 500 })

    return NextResponse.json({ success: true, count: rows.length })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}