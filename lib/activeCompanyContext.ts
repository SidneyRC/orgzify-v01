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
  companyId: string | null
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

export async function getActiveCompanyId(cookieStore: CookieStore): Promise<string | null> {
  const { companyId } = await getActiveCompanyContext(cookieStore)
  return companyId
}

export type ActiveEntityContext = {
  session: Session | null
  entityId: string | null
  processId: string | null
  status: string | null
  reportingCompanyId: string | null
}

export async function getActiveEntityContext(cookieStore: CookieStore): Promise<ActiveEntityContext> {
  const token = cookieStore.get('orgzify_token')?.value
  if (!token) return { session: null, entityId: null, processId: null, status: null, reportingCompanyId: null }

  let session: Session
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    session = payload as Session
  } catch {
    return { session: null, entityId: null, processId: null, status: null, reportingCompanyId: null }
  }

  const rawContext = decodeURIComponent(cookieStore.get('orgzify_context')?.value || '')
  const [ctxType, ctxId] = rawContext.split(':')
  if (ctxType !== 'entity' || !ctxId) return { session, entityId: null, processId: null, status: null, reportingCompanyId: null }

  const { data: entity } = await supabaseAdmin
    .from('entities').select('id, status, reporting_company_id').eq('process_id', ctxId).maybeSingle()
  if (!entity) return { session, entityId: null, processId: null, status: null, reportingCompanyId: null }

  return { session, entityId: entity.id, processId: ctxId, status: entity.status, reportingCompanyId: entity.reporting_company_id }
}
