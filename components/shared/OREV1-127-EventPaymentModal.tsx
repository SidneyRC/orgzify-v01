// THIS FILE GOES IN: components/shared/OREV1-127-EventPaymentModal.tsx (REPLACES existing file)
'use client'
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useTheme } from '@/lib/ThemeContext'
import OREV1154BookNowOptionList, { OPTION_LABELS } from '@/components/shared/OREV1-154-BookNowOptionList'
import OREV1155BookNowDetails from '@/components/shared/OREV1-155-BookNowDetails'
import OREV1156BookNowSessionLinks from '@/components/shared/OREV1-156-BookNowSessionLinks'
import OREV1158RegisterAttendanceLink from '@/components/shared/OREV1-158-RegisterAttendanceLink'

const post = (url: string, body: any) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

// The Book Now popup. It saves the Processing ID as soon as it opens, then records the option the visitor opens.
// "Already paid? Register your Attendance" sits below the options when UPI / QR / Bank is available (built later).
export default function OREV1127EventPaymentModal({ event, payment, selectedSlotId, onClose }: { event: any; payment: any; selectedSlotId?: string; onClose: () => void }) {
  const { theme } = useTheme()
  const radius = theme?.global_border_radius || '12px'
  const muted = { color: theme?.color_text_muted || '#9ca3af' }

  const methods = (!payment ? [] : payment.pg_enabled
    ? ['pg']
    : [payment.url_enabled && 'url', payment.upi_enabled && 'upi', payment.qr_enabled && 'qr', payment.bank_enabled && 'bank'].filter(Boolean)) as string[]

  const [method, setMethod] = useState('')
  const [pid, setPid] = useState('')
  const [details, setDetails] = useState<any>(null); const [failed, setFailed] = useState(false)
  const started = useRef(false)

  useEffect(() => {
    if (started.current || methods.length === 0) return
    started.current = true
    post('/event/booking-start', { event_id: event.id, slot_id: selectedSlotId || '', option: methods.length === 1 ? methods[0] : null })
      .then(r => r.json()).then(d => { if (d.id) setPid(d.id) }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!methods.some(m => ['upi', 'qr', 'bank'].includes(m))) return
    fetch('/event/booking-details?event_id=' + encodeURIComponent(event.id)).then(r => r.ok ? r.json() : Promise.reject()).then(setDetails).catch(() => setFailed(true))
  }, [])

  useEffect(() => {
    if (!pid || !method || methods.length < 2) return
    post('/event/booking-choose', { process_id: pid, option: method }).catch(() => {})
  }, [pid, method])

  const body = (m: string) => m === 'url' ? <OREV1156BookNowSessionLinks event={event} theme={theme} pid={pid} slotId={selectedSlotId || ''} />
    : m === 'pg' ? <p className="text-base mt-4 text-center" style={muted}>Payment gateway coming soon.</p>
    : failed ? <p className="text-base mt-4 text-center" style={muted}>Could not load the details. Please try again.</p>
    : !details ? <p className="text-base mt-4 text-center" style={muted}>Loading...</p>
    : <OREV1155BookNowDetails method={m} payment={{ ...payment, ...details }} theme={theme} />

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center z-[100] px-4" style={{ backgroundColor: theme?.modal_overlay || 'rgba(0,0,0,0.45)' }}>
      <div className="w-full max-w-sm p-5 max-h-[90vh] overflow-y-auto" style={{ backgroundColor: theme?.modal_bg || '#fff', borderRadius: radius }}>
        <div className="flex justify-end"><button onClick={onClose} className="text-sm outline-none!" style={muted}>✕</button></div>

        {methods.length === 0 && <p className="text-base mt-4 text-center" style={muted}>Payment isn't set up for this event yet.</p>}
        {methods.length === 1 && <>
          {['upi', 'qr', 'bank'].includes(methods[0]) && <p className="text-lg font-semibold mb-1" style={{ color: theme?.color_text_primary || '#111827' }}>{OPTION_LABELS[methods[0]]}</p>}
          {body(methods[0])}
        </>}
        {methods.length > 1 && <OREV1154BookNowOptionList methods={methods} open={method} onToggle={m => setMethod(method === m ? '' : m)} theme={theme} renderDetails={body} />}

        {methods.some(m => ['upi', 'qr', 'bank'].includes(m)) && <div className="mt-4"><OREV1158RegisterAttendanceLink theme={theme} /></div>}
      </div>
    </div>,
    document.body
  )
}
