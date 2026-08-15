'use client'
import { useState, useEffect } from 'react'
import { useTheme } from '@/lib/ThemeContext'
import toast from 'react-hot-toast'
import OREV1113BBookingQRUPI from '@/components/shared/OREV1-113B-BookingMethodQRUPI'
import OREV1113CBookingBankURL from '@/components/shared/OREV1-113C-BookingMethodBankURL'

type Props = { eventId: string; locked: boolean; onContinue: () => void; onBack: () => void; onClose: () => void }

export default function OREV1113EventStepBookingMethod({ eventId, locked, onContinue, onBack, onClose }: Props) {
  const { theme } = useTheme()
  const radius = theme?.global_border_radius || '12px'
  const primaryBtn = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }
  const outlineBtn = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fields, setFields] = useState<any>({ qr_enabled: false, upi_enabled: false, bank_enabled: false, url_enabled: false, pg_enabled: false })
  const [upi, setUpi] = useState<any[]>([])
  const [venues, setVenues] = useState<any[]>([])
  const [timeUrls, setTimeUrls] = useState<Record<string, string>>({})

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/biz/events/eventvenue/bookingmethod/api?event_id=${eventId}`)
      const j = await res.json()
      if (j.data) setFields(j.data)
      setUpi(j.upi || [])
      setVenues(j.venues || [])
      const urls: Record<string, string> = {}
      ;(j.venues || []).forEach((v: any) => v.event_venue_dates?.forEach((d: any) => d.event_venue_times?.forEach((t: any) => {
        urls[t.id] = t.event_venue_time_urls?.[0]?.booking_url || ''
      })))
      setTimeUrls(urls)
      setLoading(false)
    }
    load()
  }, [eventId])

  const toggle = (key: string) => { if (!locked) setFields((f: any) => ({ ...f, [key]: !f[key] })) }

  const canContinue = () => {
    if (fields.pg_enabled) return true
    if (fields.url_enabled) {
      if (fields.url_mode === 'per_slot') {
        const slots = venues.flatMap(v => v.event_venue_dates?.flatMap((d: any) => d.event_venue_times || []) || [])
        if (slots.length === 0 || slots.some((t: any) => !timeUrls[t.id])) return false
      } else if (!fields.external_url) return false
    }
    if (fields.qr_enabled && (!fields.qr_image_url || !fields.qr_display_name)) return false
    if (fields.upi_enabled && (upi.length === 0 || upi.some(u => !u.upi_id || !u.display_name || !u.provider))) return false
    if (fields.bank_enabled && (!fields.bank_account_name || !fields.bank_account_number || !fields.bank_name || !fields.bank_ifsc_swift)) return false
    return fields.qr_enabled || fields.upi_enabled || fields.bank_enabled || fields.url_enabled
  }

  const handleContinue = async () => {
    setSaving(true)
    const payload = Object.entries(timeUrls).filter(([, v]) => v).map(([id, url]) => ({ event_venue_time_id: id, booking_url: url }))
    const res = await fetch('/biz/events/eventvenue/bookingmethod/api', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event_id: eventId, fields, upi, timeUrls: payload }) })
    setSaving(false)
    if (!res.ok) { toast.error('Failed to save Booking Method'); return }
    toast.success('Booking Method saved')
    onContinue()
  }

  if (loading) return <p className="text-sm text-gray-400">Loading…</p>

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="text-lg font-semibold" style={{ color: theme?.color_text_primary || '#111827' }}>Booking Method</h2>
        <p className="text-xs mt-0.5" style={{ color: theme?.color_text_muted || '#9ca3af' }}>Choose how customers will book tickets for this event</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden opacity-60">
        <div className="px-6 py-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-700">Orgzify Payment Gateway <span className="text-xs font-normal text-gray-400 ml-1">(Coming Soon)</span></p>
          <span className="relative inline-flex h-6 w-11 items-center rounded-full shrink-0" style={{ backgroundColor: theme?.toggle_off || '#e5e7eb' }}><span className="inline-block h-4 w-4 translate-x-1 rounded-full bg-white" /></span>
        </div>
      </div>

      <OREV1113CBookingBankURL mode="url" fields={fields} setFields={setFields} venues={venues} timeUrls={timeUrls} setTimeUrls={setTimeUrls} locked={locked} onToggle={() => toggle('url_enabled')} theme={theme} />
      <OREV1113BBookingQRUPI mode="qr" fields={fields} setFields={setFields} upi={upi} setUpi={setUpi} eventId={eventId} locked={locked} onToggle={() => toggle('qr_enabled')} theme={theme} />
      <OREV1113BBookingQRUPI mode="upi" fields={fields} setFields={setFields} upi={upi} setUpi={setUpi} eventId={eventId} locked={locked} onToggle={() => toggle('upi_enabled')} theme={theme} />
      <OREV1113CBookingBankURL mode="bank" fields={fields} setFields={setFields} venues={venues} timeUrls={timeUrls} setTimeUrls={setTimeUrls} locked={locked} onToggle={() => toggle('bank_enabled')} theme={theme} />

      <div className="pt-2">
        <div className="hidden sm:flex sm:justify-end sm:gap-2">
          <button onClick={onBack} style={outlineBtn} className="text-sm font-medium px-4 py-2.5 hover:opacity-90 transition whitespace-nowrap">← Back</button>
          <button onClick={onClose} style={outlineBtn} className="text-sm font-medium px-4 py-2.5 hover:opacity-90 transition whitespace-nowrap">✕ Close</button>
          <button onClick={handleContinue} disabled={!canContinue() || saving} style={primaryBtn} className="text-sm font-medium px-4 py-2.5 hover:opacity-90 transition disabled:opacity-50 whitespace-nowrap">{saving ? 'Saving…' : 'Next: Tickets →'}</button>
        </div>
        <div className="flex gap-1.5 sm:hidden">
          <button onClick={onBack} style={outlineBtn} className="flex-1 text-xs font-medium py-2 px-1 hover:opacity-90 transition whitespace-nowrap">← Back</button>
          <button onClick={onClose} style={outlineBtn} className="flex-1 text-xs font-medium py-2 px-1 hover:opacity-90 transition whitespace-nowrap">✕ Close</button>
          <button onClick={handleContinue} disabled={!canContinue() || saving} style={primaryBtn} className="flex-1 text-xs font-medium py-2 px-1 hover:opacity-90 transition disabled:opacity-50 whitespace-nowrap">{saving ? '…' : 'Next →'}</button>
        </div>
      </div>
    </div>
  )
}