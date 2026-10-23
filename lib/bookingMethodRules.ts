// THIS FILE GOES IN: lib/bookingMethodRules.ts (REPLACES existing file)
// Booking Method rules shared by the screen (OREV1-113) and the server (bookingmethod/api/route.ts).
// External URL alone, Own Payment Gateway alone, or any mix of UPI / QR / Bank.

// Returns a short message when the enabled options break the rule, else an empty string.
export function bookingOptionsProblem(f: any): string {
  if (!f) return ''
  const others = [f.upi_enabled, f.qr_enabled, f.bank_enabled].filter(Boolean).length
  if (f.pg_enabled && (f.url_enabled || others > 0)) return 'Own Payment Gateway cannot be used with other options.'
  if (f.url_enabled && others > 0) return 'External URL cannot be used with UPI, QR or Bank. Switch one side off.'
  return ''
}

// Called when someone taps an option's switch. Returns a warning when it may NOT be switched on
// (nothing changes), else an empty string. Switching an option off is always allowed.
export function bookingToggleBlock(f: any, key: string): string {
  if (f[key]) return ''
  const others = !!(f.upi_enabled || f.qr_enabled || f.bank_enabled)
  if (key === 'pg_enabled') return f.url_enabled || others ? 'Own Payment Gateway cannot be used with other options. Switch them off first.' : ''
  if (key === 'url_enabled') {
    if (f.pg_enabled) return 'Switch off Own Payment Gateway first to use External URL.'
    return others ? 'External URL cannot be used with UPI, QR or Bank. Switch them off first.' : ''
  }
  if (f.pg_enabled) return 'Switch off Own Payment Gateway first to use this option.'
  return f.url_enabled ? 'UPI, QR and Bank cannot be used with External URL. Switch External URL off first.' : ''
}

// A booking link must be a real web address (https:// or http://, with a website name).
export function isWebUrl(u: any): boolean {
  try {
    const x = new URL(String(u || '').trim())
    return (x.protocol === 'https:' || x.protocol === 'http:') && x.hostname.includes('.')
  } catch { return false }
}

// Checks the links typed in External URL. Empty links are caught by the "missing link" rules, not here.
// urls = the per-session links (used only when "different link per session" is on).
export function bookingUrlFormatProblem(f: any, urls: any[]): string {
  if (!f?.url_enabled) return ''
  const list = f.url_mode === 'per_slot' ? urls || [] : [f.external_url]
  return list.some(u => String(u || '').trim() && !isWebUrl(u)) ? 'Booking URL must start with https:// (or http://)' : ''
}
