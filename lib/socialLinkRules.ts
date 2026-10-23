// THIS FILE GOES IN: lib/socialLinkRules.ts (NEW FILE)
// Rules for the event Social Media Links. Used by the Media step screen AND the server.
// To allow another type later: add its name to LINK_PLATFORMS. To change the limit: change MAX_LINKS.
import { youtubeId } from '@/lib/youtubeId'

export const LINK_PLATFORMS = ['YouTube']
export const MAX_LINKS = 5
export const isAllowedPlatform = (p: string) => LINK_PLATFORMS.includes(p)

export function socialLinkProblem(platform: string, url: string, allowedCount: number): string | null {
  if (!isAllowedPlatform(platform)) return 'This link type is not allowed.'
  if (allowedCount >= MAX_LINKS) return 'Maximum ' + MAX_LINKS + ' links reached.'
  if (platform === 'YouTube' && !youtubeId(url)) return 'Please paste a YouTube video link.'
  return null
}
