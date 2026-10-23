// THIS FILE GOES IN: lib/googleNext.ts (NEW FILE)
// Remembers "where to send the person back to" while they visit Google and return.
// The address is kept in a short-lived cookie and must pass the Orgzify-only safety check.
import { safeNext } from '@/lib/safeNext'

export const GOOGLE_NEXT_COOKIE = 'orgzify_google_next'

export function readGoogleNext(raw: string | undefined): string | null {
  if (!raw) return null
  let value = raw
  try { value = decodeURIComponent(raw) } catch {}
  return safeNext(value)
}
