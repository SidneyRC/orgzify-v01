// THIS FILE GOES IN: app/biz/events/sponsors/upload-logo/api/route.ts (REPLACES existing file)
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import sharp from 'sharp'

const MAX_LOGO_SIZE = 2 * 1024 * 1024
const BUCKET = 'sponsor-logos'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req)
    if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Missing file' }, { status: 400 })
    if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    if (file.size > MAX_LOGO_SIZE) return NextResponse.json({ error: 'Logo must be under 2MB' }, { status: 400 })

    const inputBuffer = Buffer.from(await file.arrayBuffer())
    const buffer = await sharp(inputBuffer).resize(600, 600, { fit: 'cover', position: 'center' }).webp({ quality: 85 }).toBuffer()

    const fileName = `${crypto.randomUUID()}.webp`
    const { error: uploadError } = await supabaseAdmin.storage.from(BUCKET).upload(fileName, buffer, { contentType: 'image/webp', upsert: false })
    if (uploadError) {
      console.error('SPONSOR LOGO UPLOAD (organiser) - storage error:', uploadError)
      return NextResponse.json({ error: `Storage upload failed: ${uploadError.message}` }, { status: 500 })
    }

    const { data: urlData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(fileName)
    return NextResponse.json({ data: { logo_url: urlData.publicUrl } })
  } catch (err: any) {
    console.error('SPONSOR LOGO UPLOAD (organiser) - caught exception:', err?.name, err?.message, err?.stack)
    return NextResponse.json({ error: `Server error: ${err?.message || 'unknown'}` }, { status: 500 })
  }
}
