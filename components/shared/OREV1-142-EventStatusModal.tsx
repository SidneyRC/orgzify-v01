// THIS FILE GOES IN: components/shared/OREV1-142-EventStatusModal.tsx (NEW FILE)
'use client'
import { useState } from 'react'
import { useTheme } from '@/lib/ThemeContext'

type Props = {
  eventId: string
  published: boolean
  bookingOpen: boolean
  onClose: () => void
  onUpdated: (fields: { published: boolean; booking_open: boolean }) => void
}

export default function OREV1142EventStatusModal({ eventId, published, bookingOpen, onClose, onUpdated }: Props) {
  const { theme } = useTheme()
  const radius = theme?.global_border_radius || '12px'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const run = async (mode: string) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/biz/events/api', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: eventId, action: 'toggle_publish', mode })
      })
      const j = await res.json()
      if (!res.ok) { setError(j.error || 'Something went wrong'); setLoading(false); return }
      onUpdated({ published: j.data.published, booking_open: j.data.booking_open })
      onClose()
    } catch {
      setError('Something went wrong')
      setLoading(false)
    }
  }

  const btnStyle = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }
  const outlineStyle = { border: `1px solid ${theme?.btn_outline_border || '#d1d5db'}`, color: theme?.btn_outline_text || '#374151', borderRadius: radius }
  const disabledStyle = { backgroundColor: theme?.btn_disabled_bg || '#f3f4f6', color: theme?.btn_disabled_text || '#9ca3af', borderRadius: radius }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: theme?.modal_overlay || 'rgba(0,0,0,0.45)' }}>
      <div className="w-full max-w-sm p-5" style={{ backgroundColor: theme?.modal_bg || '#fff', borderRadius: radius }}>
        <button onClick={onClose} className="text-xs float-right" style={{ color: theme?.color_text_muted || '#9ca3af' }}>✕</button>
        <p className="text-sm font-semibold mb-3" style={{ color: theme?.color_text_primary || '#111827' }}>Change Status</p>

        {error && <p className="text-xs mb-2" style={{ color: theme?.badge_error_text || '#b91c1c' }}>{error}</p>}

        <div className="flex flex-col gap-2 mt-1">
                    {!published && (
            <>
              <button disabled={loading} onClick={() => run('publish')} className="w-full py-2.5 text-sm font-medium" style={btnStyle}>Publish</button>
              {!bookingOpen && (
                <button disabled={loading} onClick={() => run('publish_and_book')} className="w-full py-2.5 text-sm font-medium" style={btnStyle}>Publish and enable booking</button>
              )}
            </>
          )}

          {published && (
            <>
              <button disabled={loading} onClick={() => run('unlist')} className="w-full py-2.5 text-sm font-medium" style={outlineStyle}>Unlist</button>
              {bookingOpen ? (
                <button disabled={loading} onClick={() => run('pause_booking')} className="w-full py-2.5 text-sm font-medium" style={outlineStyle}>Pause booking</button>
              ) : (
                <button disabled={loading} onClick={() => run('resume_booking')} className="w-full py-2.5 text-sm font-medium" style={btnStyle}>Resume booking</button>
              )}
              <button disabled className="w-full py-2.5 text-sm font-medium cursor-not-allowed" style={disabledStyle}>Cancel Event (Coming Soon)</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}