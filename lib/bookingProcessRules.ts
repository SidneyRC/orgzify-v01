// THIS FILE GOES IN: lib/bookingProcessRules.ts (REPLACES the file saved earlier)
// Rules for the Processing ID (the record saved when a logged-in visitor taps Book Now).
// SOURCE (how they book) = chosen_option. STATUS (what happened) = status. The two are separate.

export const DROP_MINUTES = 35         // TEST VALUE. Set back to 30 when testing is finished.
export const DOUBLE_TAP_SECONDS = 10  // same person + same session within this time = the same Processing ID
export const BOOKING_OPTIONS = ['url', 'pg', 'upi', 'qr', 'bank']
export const isBookingOption = (o: any): boolean => BOOKING_OPTIONS.includes(o)

// Status values (plain text). Later stages (PG): Ticket Details, TicketDrop, Pay Now, PayDrop, Paid, Failed, Registered.
export const STATUS_PRE = 'Pre-Booking'      // tapped Book Now, nothing clicked yet
export const STATUS_DROP = 'PreBookDrop'     // Pre-Booking and nothing clicked in time
export const STATUS_CLICKED = 'Clicked'      // clicked an option (UPI / QR / Bank) or went to the link

const SOURCE_LABELS: Record<string, string> = { url: 'External link', pg: 'Internal link', upi: 'UPI', qr: 'QR', bank: 'Bank' }
export const sourceLabel = (o: any): string => SOURCE_LABELS[o] || ''

// UPI, QR and Bank count as Clicked the moment they are opened. A link or PG counts only when the visitor really goes there.
export const isManualOption = (o: any): boolean => o === 'upi' || o === 'qr' || o === 'bank'

// The status to show for one record (right even before the stored status has caught up).
export function processStatus(row: any, now: number = Date.now()): string {
  if (row?.status === STATUS_PRE && new Date(row.drop_after).getTime() < now) return STATUS_DROP
  return row?.status || STATUS_PRE
}

// The booking link of the APPROVED copy (never the draft), or '' when there is none.
export function approvedLinkFor(payment: any, slotId: string): string {
  if (!payment?.url_enabled) return ''
  const u = payment.url_mode === 'per_slot' ? payment.session_urls?.[slotId] : payment.external_url
  const s = String(u || '').trim()
  return s.startsWith('https://') || s.startsWith('http://') ? s : ''
}
