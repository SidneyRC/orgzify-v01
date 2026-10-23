// THIS FILE GOES IN: lib/shareActions.ts (NEW FILE)
// The actions behind the Share popup buttons. Browser-only (call from click handlers).

// Copies text. Falls back to an old method so it also works on non-secure (http) test pages.
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); return true }
  } catch {}
  try {
    const box = document.createElement('textarea')
    box.value = text
    document.body.appendChild(box)
    box.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(box)
    return ok
  } catch { return false }
}

const go = (url: string) => window.open(url, '_blank', 'noopener')

export const openWhatsApp = (text: string) => go('https://wa.me/?text=' + encodeURIComponent(text))
export const openFacebook = (link: string) => go('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(link))
export const openX = (text: string) => go('https://twitter.com/intent/tweet?text=' + encodeURIComponent(text))

// The phone's own share sheet (lists the installed apps). Only works on secure (https) pages.
export const canNativeShare = () => typeof navigator !== 'undefined' && !!navigator.share && window.isSecureContext
export async function nativeShare(title: string, text: string) {
  try { await navigator.share({ title, text }) } catch {}
}
