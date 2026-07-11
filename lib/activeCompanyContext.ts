// THIS FILE GOES IN: lib/activeCompanyContext.ts
// Shared helper for all Setup pages (server components).
// Reads ONLY from cookies — login token + active company context.
// Slug is looked up from the database purely for building the Back link;
// it is never read as an input and never used to decide access.

import { jwtVerify } from 'jose'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!)

type CookieStore = { get(name: string): { value: string } | undefined }
type Session = { user_id: string; is_super_admin?: boolean }

export type ActiveCompanyContext = {
  session: Session | null
  companyId: string | null   // null = Super Admin / no active company
  slug: string | null
}

export async function getActiveCompanyContext(cookieStore: CookieStore): Promise<ActiveCompanyContext> {
  const token = cookieStore.get('orgzify_token')?.value
  if (!token) return { session: null, companyId: null, slug: null }

  let session: Session
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    session = payload as Session
  } catch {
    return { session: null, companyId: null, slug: null }
  }

  const rawContext = decodeURIComponent(cookieStore.get('orgzify_context')?.value || '')
  const [ctxType, ctxId] = rawContext.split(':')
  if (ctxType !== 'company' || !ctxId) return { session, companyId: null, slug: null }

  const { data: company } = await supabaseAdmin
    .from('companies').select('id, slug').eq('process_id', ctxId).maybeSingle()
  if (!company) return { session, companyId: null, slug: null }

  return { session, companyId: company.id, slug: company.slug }
}

// Same cookie-only resolution, for use inside API routes (NextRequest.cookies).
export async function getActiveCompanyId(cookieStore: CookieStore): Promise<string | null> {
  const { companyId } = await getActiveCompanyContext(cookieStore)
  return companyId
}
