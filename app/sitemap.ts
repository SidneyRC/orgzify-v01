// THIS FILE GOES IN: app/sitemap.ts (NEW FILE)
// Makes orgzify.com/sitemap.xml. Built live from the database on every request,
// so it is always current. Lists only events the public page can show
// (approved, published, public, not cancelled). Ended events stay listed.
// Each entry uses the event's named address, the same as the page canonical.
import type { MetadataRoute } from 'next'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const BASE_URL = 'https://www.orgzify.com'
export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const out: MetadataRoute.Sitemap = [{ url: BASE_URL }]
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabaseAdmin
      .from('events')
      .select('slug, process_id, approved_at')
      .eq('status', 'active')
      .eq('published', true)
      .eq('visibility', 'public')
      .or('event_status.is.null,event_status.neq.cancelled')
      .not('approved_at', 'is', null)
      .order('id')
      .range(from, from + 999)
    if (error) { console.error('sitemap:', error.message); break }
    if (!data || data.length === 0) break
    for (const e of data) {
      out.push({ url: BASE_URL + '/event/' + (e.slug || e.process_id), lastModified: e.approved_at })
    }
    if (data.length < 1000) break
  }
  return out
}
