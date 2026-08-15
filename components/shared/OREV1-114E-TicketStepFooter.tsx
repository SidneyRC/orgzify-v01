// THIS FILE GOES IN: components/shared/OREV1-114E-TicketStepFooter.tsx (NEW FILE)
'use client'

type Props = { canContinue: boolean; onBack: () => void; onClose: () => void; onContinue: () => void; theme: any }

export default function OREV1114ETicketStepFooter({ canContinue, onBack, onClose, onContinue, theme }: Props) {
  const radius = theme?.global_border_radius || '12px'
  const outline = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }
  const primary = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius, opacity: canContinue ? 1 : 0.5 }

  return (
    <>
      <div className="hidden sm:flex sm:justify-end sm:gap-2 mt-4">
        <button onClick={onBack} style={outline} className="px-4 py-2 text-sm">← Back</button>
        <button onClick={onClose} style={outline} className="px-4 py-2 text-sm">✕ Close</button>
        <button disabled={!canContinue} onClick={onContinue} style={primary} className="px-4 py-2 text-sm">Next: Review →</button>
      </div>
      <div className="flex gap-1.5 sm:hidden mt-4">
        <button onClick={onBack} style={outline} className="flex-1 py-2 text-sm">← Back</button>
        <button onClick={onClose} style={outline} className="flex-1 py-2 text-sm">✕ Close</button>
        <button disabled={!canContinue} onClick={onContinue} style={primary} className="flex-1 py-2 text-sm">Next →</button>
      </div>
    </>
  )
}
