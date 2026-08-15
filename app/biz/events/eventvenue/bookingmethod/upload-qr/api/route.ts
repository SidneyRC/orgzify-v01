// THIS FILE GOES IN: app/biz/events/eventvenue/bookingmethod/upload-qr/api/route.ts (NEW FILE)
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import sharp from 'sharp'

export async function POST(req: NextRequest) {
  const form = await req.formData()
  const file = form.get('file') as File | null
  const eventId = form.get('event_id') as string
  if (!file || !eventId) return NextResponse.json({ error: 'file and event_id required' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  const webp = await sharp(buffer).resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 82, effort: 6 }).toBuffer()

  const path = `booking-qr/${eventId}-${Date.now()}.webp`
  const { error } = await supabaseAdmin.storage.from('event-media').upload(path, webp, { contentType: 'image/webp', upsert: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: pub } = supabaseAdmin.storage.from('event-media').getPublicUrl(path)
  return NextResponse.json({ url: pub.publicUrl })
}