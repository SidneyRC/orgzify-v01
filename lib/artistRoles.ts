// THIS FILE GOES IN: lib/artistRoles.ts (NEW file)
// Adds each artist's speciality (Comedian, Musician...) to an event's artists as speciality_name.
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function artistsWithSpeciality(artists: any[]) {
  const ids = Array.from(new Set(artists.map((a: any) => a.speciality_id).filter(Boolean)))
  if (ids.length === 0) return artists
  const { data } = await supabaseAdmin.from('artist_specialities').select('id, name').in('id', ids)
  const names: Record<string, string> = {}
  for (const r of data || []) names[r.id] = r.name
  return artists.map((a: any) => ({ ...a, speciality_name: names[a.speciality_id] || '' }))
}
