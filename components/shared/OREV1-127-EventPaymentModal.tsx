// THIS FILE GOES IN: components/shared/OREV1-127-EventPaymentModal.tsx (REPLACES existing file)
'use client'
import { useState } from 'react'
import { useTheme } from '@/lib/ThemeContext'

export default function OREV1127EventPaymentModal({ payment, onClose }: { payment: any; onClose: () => void }) {
  const { theme } = useTheme()
  const radius = theme?.global_border_radius || '12px'

  const methods = !payment ? [] : payment.pg_enabled
    ? ['pg']
    : [payment.upi_enabled && 'upi', payment.qr_enabled && 'qr', payment.bank_enabled && 'bank', payment.url_enabled && 'url'].filter(Boolean)

  const [method, setMethod] = useState(methods.length === 1 ? methods[0] : '')

  const payViaUpi = () => {
    const upi = payment.upi[0]
    window.location.href = `upi://pay?pa=${upi.upi_id}&pn=${encodeURIComponent(upi.display_name)}&cu=INR`
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: theme?.modal_overlay || 'rgba(0,0,0,0.45)' }}>
      <div className="w-full max-w-sm p-5" style={{ backgroundColor: theme?.modal_bg || '#fff', borderRadius: radius }}>
        <button onClick={onClose} className="text-xs float-right" style={{ color: theme?.color_text_muted || '#9ca3af' }}>✕</button>

        {methods.length === 0 && (
          <p className="text-sm mt-4 text-center" style={{ color: theme?.color_text_muted || '#9ca3af' }}>Payment isn't set up for this event yet.</p>
        )}

        {!method && methods.length > 1 && (
          <div className="flex flex-col gap-2 mt-2">
            <p className="text-sm font-semibold mb-1" style={{ color: theme?.color_text_primary || '#111827' }}>Choose payment method</p>
            {methods.map(m => <button key={m} onClick={() => setMethod(m)} className="text-left px-3 py-2 text-sm capitalize" style={{ borderRadius: '8px', border: `1px solid ${theme?.input_border || '#e5e7eb'}` }}>{m}</button>)}
          </div>
        )}

        {method === 'pg' && (
          <p className="text-sm mt-4 text-center" style={{ color: theme?.color_text_muted || '#9ca3af' }}>Payment gateway coming soon.</p>
        )}

        {method === 'upi' && (
          <div className="flex flex-col gap-3 mt-2">
            <p className="text-sm font-semibold" style={{ color: theme?.color_text_primary || '#111827' }}>Pay via UPI</p>
            <button onClick={payViaUpi} className="w-full py-2.5 text-sm font-medium" style={{ backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }}>Open UPI app</button>
            <p className="text-xs text-center" style={{ color: theme?.color_text_muted || '#9ca3af' }}>Or pay to: {payment.upi[0]?.upi_id}</p>
          </div>
        )}
        {method === 'qr' && <img src={payment.qr_image_url} alt="QR code" className="w-full mt-2" />}
        {method === 'bank' && (
          <div className="flex flex-col gap-1 mt-2 text-xs" style={{ color: theme?.color_text_secondary || '#4b5563' }}>
            <p>{payment.bank_account_name}</p>
            <p>A/C: {payment.bank_account_number}</p>
            <p>{payment.bank_name} · {payment.bank_ifsc_swift}</p>
          </div>
        )}
        {method === 'url' && (
          <div className="flex flex-col gap-3 mt-2">
            <p className="text-sm font-semibold" style={{ color: theme?.color_text_primary || '#111827' }}>Continue to payment</p>
            <a href={payment.external_url} target="_blank" rel="noopener noreferrer" className="w-full text-center py-2.5 text-sm font-medium" style={{ backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }}>Continue</a>
          </div>
        )}
      </div>
    </div>
  )
}
