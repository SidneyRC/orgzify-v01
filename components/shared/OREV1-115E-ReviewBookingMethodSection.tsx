// THIS FILE GOES IN: components/shared/OREV1-115E-ReviewBookingMethodSection.tsx (REPLACES existing file)
'use client'
import { useState, useEffect } from 'react'
import OREV1115AReviewSectionHeader from '@/components/shared/OREV1-115A-ReviewSectionHeader'

type Props = { eventId: string; onEdit: () => void; theme: any }

function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }
function fmtTime(t: string) { const [h, m] = t.split(':'); const hr = parseInt(h, 10); const ap = hr >= 12 ? 'PM' : 'AM'; return `${hr % 12 === 0 ? 12 : hr % 12}:${m} ${ap}` }

function Row({ label, value, theme }: { label: string; value: string; theme: any }) {
  if (!value) return null
  return (
    <div className="grid grid-cols-[140px_1fr] gap-4 py-2 px-3 text-sm max-w-xl">
      <span style={{ color: theme?.color_text_muted || '#9ca3af' }}>{label}</span>
      <span style={{ color: theme?.color_text_primary || '#111827' }}>{value}</span>
    </div>
  )
}

export default function OREV1115EReviewBookingMethodSection({ eventId, onEdit, theme }: Props) {
  const [method, setMethod] = useState<any>(null)
  const [upi, setUpi] = useState<any[]>([])
  const [venues, setVenues] = useState<any[]>([])
  useEffect(() => {
    fetch(`/biz/events/eventvenue/bookingmethod/api?event_id=${eventId}`).then(r => r.json())
      .then(j => { setMethod(j.data); setUpi(j.upi || []); setVenues(j.venues || []) })
  }, [eventId])
  const headText = { color: theme?.color_text_primary || '#111827' }
  const mutedText = { color: theme?.color_text_muted || '#9ca3af' }

  if (!method) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <OREV1115AReviewSectionHeader title="Booking Method" onEdit={onEdit} theme={theme} />
        <p className="text-xs text-red-500 px-3 py-3">⚠ Not set up yet</p>
      </div>
    )
  }

  const perSlotRows: { key: string; label: string; url: string }[] = []
  venues.forEach((v: any) => {
    (v.event_venue_dates || []).forEach((d: any) => {
      (d.event_venue_times || []).forEach((t: any) => {
        perSlotRows.push({
          key: t.id,
          label: `${v.venues?.external_name || 'Venue'} · ${fmtDate(d.event_date)} · ${fmtTime(t.start_time)}`,
          url: t.event_venue_time_urls?.booking_url || ''
        })
      })
    })
  })

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <OREV1115AReviewSectionHeader title="Booking Method" onEdit={onEdit} theme={theme} />

      {method.qr_enabled && (
        <div className="border-t border-gray-50">
          <p className="text-xs font-semibold px-3 pt-3" style={headText}>QR Code</p>
          {method.qr_image_url && <img src={method.qr_image_url} alt="QR" className="w-16 h-16 object-contain rounded-lg mx-3 mt-2" />}
          {method.qr_display_name && <Row label="Display name" value={method.qr_display_name} theme={theme} />}
        </div>
      )}

      {method.upi_enabled && upi.length > 0 && (
        <div className="border-t border-gray-50">
          <p className="text-xs font-semibold px-3 pt-3" style={headText}>UPI</p>
          {upi.map((u: any, i: number) => (
            <div key={i} className="border-b border-gray-50 last:border-0 pb-1 mb-1">
              <Row label="Display name" value={u.display_name} theme={theme} />
              <Row label="Provider" value={u.provider} theme={theme} />
              <Row label="UPI ID" value={u.upi_id} theme={theme} />
            </div>
          ))}
        </div>
      )}

      {method.bank_enabled && (
        <div className="border-t border-gray-50">
          <p className="text-xs font-semibold px-3 pt-3" style={headText}>Bank Details</p>
          <Row label="Account name" value={method.bank_account_name} theme={theme} />
          <Row label="Account number" value={method.bank_account_number} theme={theme} />
          <Row label="Bank" value={method.bank_name} theme={theme} />
          <Row label="Branch" value={method.bank_branch_name} theme={theme} />
          <Row label="IFSC / SWIFT" value={method.bank_ifsc_swift} theme={theme} />
        </div>
      )}

      {method.url_enabled && (
        <div className="border-t border-gray-50">
          <p className="text-xs font-semibold px-3 pt-3" style={headText}>External URL</p>
          {method.url_mode === 'per_slot' ? (
            <div className="px-3 py-2 flex flex-col gap-2">
              {perSlotRows.map(row => (
                <div key={row.key} className="text-xs">
                  <span style={mutedText}>{row.label}:</span>{' '}
                  {row.url ? <span style={headText}>{row.url}</span> : <span className="text-red-500">Not set</span>}
                </div>
              ))}
            </div>
          ) : (
            <Row label="Booking URL" value={method.external_url} theme={theme} />
          )}
        </div>
      )}
    </div>
  )
}