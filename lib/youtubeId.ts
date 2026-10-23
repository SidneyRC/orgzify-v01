// THIS FILE GOES IN: lib/youtubeId.ts (NEW FILE)
// Turns a pasted YouTube link into the video code (null if it is not a video link).
// Same code that used to live in OREV1-152; moved here so the server can use it too.
export function youtubeId(link: string | null | undefined): string | null {
  const raw = String(link || '').trim()
  if (!raw) return null
  try {
    const u = new URL(/^https?:\/\//i.test(raw) ? raw : 'https://' + raw)
    const host = u.hostname.replace(/^(www|m)\./, '')
    let id: string | null = null
    if (host === 'youtu.be') id = u.pathname.slice(1).split('/')[0]
    else if (host === 'youtube.com') {
      const m = u.pathname.match(/^\/(shorts|embed|live)\/([^/]+)/)
      id = u.pathname === '/watch' ? u.searchParams.get('v') : m ? m[2] : null
    }
    return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null
  } catch { return null }
}
