// GOES IN: lib/helpDeskSearchBase.ts
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export type BaseSearchResult = { user_id: string; profile_id: string | null; full_name: string; email: string; mobile: string; zy_id: string; account_status: string }

export async function baseSearchUsers(q: string): Promise<BaseSearchResult[]> {
  const { data: userMatches } = await supabaseAdmin.from('users')
    .select('id, email, zy_id, account_status').or(`zy_id.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`)
  const { data: profileMatches } = await supabaseAdmin.from('profiles')
    .select('user_id').or(`email.ilike.%${q}%,mobile.ilike.%${q}%`)

  const matchedIds = new Set([
    ...(userMatches || []).map((u: any) => u.id),
    ...(profileMatches || []).map((p: any) => p.user_id).filter(Boolean),
  ])
  if (matchedIds.size === 0) return []
  const idList = [...matchedIds]

  const { data: profiles } = await supabaseAdmin.from('profiles')
    .select('id, user_id, full_name, email, mobile').in('user_id', idList)
  const { data: users } = await supabaseAdmin.from('users').select('id, email, zy_id, account_status').in('id', idList)
  const userMap = Object.fromEntries((users || []).map((u: any) => [u.id, u]))

  const profileUserIds = new Set((profiles || []).map((p: any) => p.user_id))
  const fromProfiles = (profiles || []).map((p: any) => ({
    user_id: p.user_id, profile_id: p.id, full_name: p.full_name || '—',
    email: p.email || userMap[p.user_id]?.email || '', mobile: p.mobile || '',
    zy_id: userMap[p.user_id]?.zy_id || '', account_status: userMap[p.user_id]?.account_status || ''
  }))
  const missingProfile = idList.filter(id => !profileUserIds.has(id)).map(id => ({
    user_id: id, profile_id: null, full_name: '—', email: userMap[id]?.email || '', mobile: '',
    zy_id: userMap[id]?.zy_id || '', account_status: userMap[id]?.account_status || ''
  }))

  return [...fromProfiles, ...missingProfile]
}
