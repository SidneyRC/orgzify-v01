// THIS FILE GOES IN: components/shared/OREV1-154-BookNowOptionList.tsx (REPLACES the file saved earlier today)
'use client'

export const OPTION_LABELS: Record<string, string> = { url: 'Booking link', upi: 'UPI', qr: 'QR code', bank: 'Bank transfer' }

// Book Now popup when more than one option is on: tap a row and its details open right below it (one at a time).
export default function OREV1154BookNowOptionList({ methods, open, onToggle, theme, renderDetails }: { methods: string[]; open: string; onToggle: (m: string) => void; theme: any; renderDetails: (m: string) => any }) {
  const radius = theme?.global_border_radius || '12px'
  const primary = theme?.color_text_primary || '#111827'
  return (
    <div className="flex flex-col gap-2 mt-2">
      <p className="text-lg font-semibold mb-1" style={{ color: primary }}>How would you like to book?</p>
      {methods.map(m => {
        const isOpen = open === m
        return (
          <div key={m} style={{ borderRadius: radius, border: '1px solid ' + (isOpen ? (theme?.link_color || '#2563eb') : (theme?.input_border || '#e5e7eb')) }}>
            <button onClick={() => onToggle(m)} className={'w-full text-left px-4 py-3 text-base outline-none! ' + (isOpen ? 'font-semibold' : 'font-medium')} style={{ color: primary }}>{OPTION_LABELS[m] || m}</button>
            {isOpen && <div className="px-4 pb-3">{renderDetails(m)}</div>}
          </div>
        )
      })}
    </div>
  )
}
