// THIS FILE GOES IN: lib/liveTileLabels.ts (NEW file)
// Fills in display-only tile labels (sponsor type, artist speciality) for approved copies saved before
// those details existed. Read live, so no re-approval is needed. Copies that already carry them are untouched.
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { artistsWithSpeciality } from '@/lib/artistRoles'

async function sponsorsWithType(eventId: string, sponsors: any[]) {
  if (!sponsors.some((s: any) => s.sponsor_type === undefined)) return sponsors
  const { data } = await supabaseAdmin.from('event_sponsors').select('sponsor_id, sponsor_type').eq('event_id', eventId)
  const queue: Record<string, string[]> = {}
  for (const r of data || []) { if (!queue[r.sponsor_id]) queue[r.sponsor_id] = []; queue[r.sponsor_id].push(r.sponsor_type) }
  return sponsors.map((s: any) => s.sponsor_type === undefined ? { ...s, sponsor_type: (queue[s.id] || []).shift() || '' } : s)
}

async function artistsWithRole(artists: any[]) {
  if (!artists.some((a: any) => a.speciality_name === undefined)) return artists
  const { data } = await supabaseAdmin.from('artists').select('id, speciality_id').in('id', artists.map((a: any) => a.id).filter(Boolean))
  const withIds = artists.map((a: any) => ({ ...a, speciality_id: (data || []).find((r: any) => r.id === a.id)?.speciality_id }))
  return artistsWithSpeciality(withIds)
}

export async function withLiveTileLabels(eventId: string, snapshot: any) {
  const [sponsors, artists] = await Promise.all([sponsorsWithType(eventId, snapshot.sponsors || []), artistsWithRole(snapshot.artists || [])])
  return { sponsors, artists }
}
