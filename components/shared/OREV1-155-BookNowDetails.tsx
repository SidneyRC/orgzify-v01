// THIS FILE GOES IN: components/shared/OREV1-155-BookNowDetails.tsx (REPLACES the file saved earlier today)
'use client'
import { useState, useEffect } from 'react'
import { copyText } from '@/lib/shareActions'

function CopyRow({ label, value, theme }: { label: string; value: string; theme: any }) {
  const [done, setDone] = useState(false)
  const link = theme?.link_color || '#2563eb'
  const copy = async () => { if (await copyText(value)) { setDone(true); setTimeout(() => setDone(false), 1500) } }
  return (
    <div className="flex items-center justify-between gap-3 py-2" style={{ borderTop: '1px solid ' + (theme?.divider_color || '#e5e7eb') }}>
      <div className="min-w-0">
        <p className="text-sm" style={{ color: theme?.color_text_muted || '#9ca3af' }}>{label}</p>
        <p className="text-base font-semibold break-all" style={{ color: theme?.color_text_primary || '#111827' }}>{value}</p>
      </div>
      <button onClick={copy} aria-label="Copy" className="w-9 h-9 shrink-0 flex items-center justify-center outline-none!" style={{ border: '1px solid ' + link, borderRadius: theme?.global_border_radius || '12px' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={link} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {done ? <path d="M20 6L9 17l-5-5" /> : <><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></>}
        </svg>
      </button>
    </div>
  )
}

// Details of one option (UPI, QR code or Bank transfer) inside the Book Now popup.
export default function OREV1155BookNowDetails({ method, payment, theme }: { method: string; payment: any; theme: any }) {
  const [isPhone, setIsPhone] = useState(false)
  useEffect(() => { setIsPhone(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) }, [])
  const openUpi = (u: any) => { window.location.href = 'upi://pay?pa=' + u.upi_id + '&pn=' + encodeURIComponent(u.display_name || '') + '&cu=INR' }
  const bank: [string, string][] = [['Account name', payment.bank_account_name], ['Account number', payment.bank_account_number], ['Bank', payment.bank_name], ['IFSC / SWIFT', payment.bank_ifsc_swift]]
  return (
    <div className="flex flex-col gap-2">
      {method === 'upi' && (payment.upi || []).map((u: any) => (
        <div key={u.upi_id} className="flex flex-col gap-2">
          <CopyRow label={u.display_name || 'UPI ID'} value={u.upi_id} theme={theme} />
          {isPhone && <button onClick={() => openUpi(u)} className="w-full py-2 text-base font-semibold outline-none!" style={{ backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: theme?.global_border_radius || '12px' }}>Open UPI app</button>}
        </div>
      ))}
      {method === 'qr' && <><img src={payment.qr_image_url} alt="QR code" className="w-full" />{payment.qr_display_name && <p className="text-base font-semibold text-center break-all" style={{ color: theme?.color_text_primary || '#111827' }}>{payment.qr_display_name}</p>}</>}
      {method === 'bank' && <div>{bank.filter(r => r[1]).map(r => <CopyRow key={r[0]} label={r[0]} value={r[1]} theme={theme} />)}</div>}
    </div>
  )
}
