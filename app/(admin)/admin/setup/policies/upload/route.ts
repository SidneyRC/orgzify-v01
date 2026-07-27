import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getSession } from '@/lib/auth'

const ALLOWED_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
}

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const internal_name = formData.get('internal_name') as string
  if (!file || !internal_name) return NextResponse.json({ error: 'Missing file or name' }, { status: 400 })

  const ext = ALLOWED_TYPES[file.type]
  if (!ext) return NextResponse.json({ error: 'Only PDF or Word documents (.pdf, .doc, .docx) are allowed' }, { status: 400 })

  const safeName = internal_name.replace(/[^a-zA-Z0-9_-]/g, '_')
  const path = `${safeName}_${Date.now()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await supabaseAdmin.storage
    .from('policy-documents')
    .upload(path, buffer, { contentType: file.type, upsert: true })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: urlData } = supabaseAdmin.storage.from('policy-documents').getPublicUrl(path)
  return NextResponse.json({ url: urlData.publicUrl })
}
