// GOES IN: app/admin/setup/countries-test/api/route.ts
// TEMPORARY TEST FILE — delete after we confirm the API key works
import { NextResponse } from 'next/server'

export async function GET() {
  const apiKey = process.env.RESTCOUNTRIES_API_KEY

  if (!apiKey) {
    return NextResponse.json({ ok: false, error: 'RESTCOUNTRIES_API_KEY is missing from environment variables.' }, { status: 500 })
  }

  try {
    const res = await fetch('https://api.restcountries.com/countries/v5?limit=3', {
      headers: { Authorization: `Bearer ${apiKey}` },
    })

    const body = await res.json()

    if (!res.ok) {
      return NextResponse.json({ ok: false, status: res.status, error: body?.errors?.[0]?.message || 'Unknown error from restcountries.com' }, { status: res.status })
    }

    return NextResponse.json({ ok: true, meta: body?.data?.meta, sample: body?.data?.objects })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
