// THIS FILE GOES IN: components/shared/OREV1-114K-TicketDeleteConfirm.tsx (NEW FILE)
'use client'

type Props = { ticketName: string; slotLabel: string; deleting: boolean; onConfirm: () => void; onCancel: () => void; theme: any }

export default function OREV1114KTicketDeleteConfirm({ ticketName, slotLabel, deleting, onConfirm, onCancel, theme }: Props) {
  const radius = theme?.global_border_radius || '12px'
  const labelStyle = { color: theme?.color_text_muted || '#9ca3af' }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-5">
        <p className="text-sm font-semibold mb-1" style={{ color: theme?.color_text_primary || '#111827' }}>Delete "{ticketName}"?</p>
        <p className="text-xs mb-4" style={labelStyle}>from {slotLabel}? This cannot be undone.</p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} disabled={deleting} style={{ backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }} className="px-4 py-2 text-sm">Cancel</button>
          <button onClick={onConfirm} disabled={deleting} style={{ backgroundColor: '#dc2626', color: '#fff', borderRadius: radius, opacity: deleting ? 0.6 : 1 }} className="px-4 py-2 text-sm">{deleting ? 'Deleting…' : 'Delete'}</button>
        </div>
      </div>
    </div>
  )
}
