// THIS FILE GOES IN: lib/findSocialLinkProblem.ts (NEW FILE)
// Server check before a link is saved: counts the event's allowed links, then applies the shared rule.
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { isAllowedPlatform, socialLinkProblem } from '@/lib/socialLinkRules'

export async function findSocialLinkProblem(eventId: string, platform: string, url: string): Promise<string | null> {
  const { data } = await supabaseAdmin.from('event_social_links').select('platform').eq('event_id', eventId)
  const count = (data || []).filter((r: any) => isAllowedPlatform(r.platform)).length
  return socialLinkProblem(platform, url, count)
}
