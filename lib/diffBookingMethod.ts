// THIS FILE GOES IN: lib/diffBookingMethod.ts (NEW FILE)
// Lists exactly what changed in the Booking Method between the approved copy and the draft.
// Bank details: field NAMES only, never the numbers.
import type { EventChange } from '@/lib/diffEventBundle'

const onOff = (x: any) => (x ? 'On' : 'Off')
const url = (x: any) => String(x || '').trim() || '—'
const BANK_FIELDS: [string, string][] = [['bank_account_name', 'Account name'], ['bank_account_number', 'Account number'], ['bank_name', 'Bank'], ['bank_ifsc_swift', 'IFSC / SWIFT']]

export function diffBookingMethod(oldP: any, newP: any): EventChange[] {
  const o = oldP || {}, n = newP || {}
  const c: EventChange[] = []
  const toggle = (label: string, key: string) => { if (!!o[key] !== !!n[key]) c.push({ label, from: onOff(o[key]), to: onOff(n[key]) }) }
  const list = (label: string, note: string, items: string[]) => {
    if (items.length) c.push({ label, note, detail: items.slice(0, 3).join('; ') + (items.length > 3 ? ` +${items.length - 3} more` : '') })
  }

  toggle('QR code', 'qr_enabled')
  if (o.qr_enabled && n.qr_enabled && (o.qr_image_url || '') !== (n.qr_image_url || '')) c.push({ label: 'QR code', note: 'Image changed' })

  toggle('UPI', 'upi_enabled')
  const upiIds = (p: any) => (p.upi_enabled ? (p.upi || []).map((u: any) => u.upi_id).filter(Boolean) : [])
  list('UPI', 'Added', upiIds(n).filter((i: string) => !upiIds(o).includes(i)))
  list('UPI', 'Removed', upiIds(o).filter((i: string) => !upiIds(n).includes(i)))

  toggle('Bank details', 'bank_enabled')
  if (o.bank_enabled && n.bank_enabled) {
    const names = BANK_FIELDS.filter(([k]) => (o[k] || '') !== (n[k] || '')).map(([, l]) => l)
    if (names.length) c.push({ label: 'Bank details', note: 'Changed', detail: names.join(', ') })
  }

  toggle('External URL', 'url_enabled')
  if (o.url_enabled && n.url_enabled && url(o.external_url) !== url(n.external_url)) c.push({ label: 'Booking URL', from: url(o.external_url), to: url(n.external_url) })
  return c
}
