// THIS FILE GOES IN: components/shared/OREV1-114J-TicketSaveConfirmModal.tsx (NEW FILE)
'use client'

type Props = { slotLabels: string[]; saving: boolean; onConfirm: () => void; onCancel: () => void; theme: any }

export default function OREV1114JTicketSaveConfirmModal({ slotLabels, saving, onConfirm, onCancel, theme }: Props) {
  const radius = theme?.global_border_radius || '12px'
  const labelStyle = { color: theme?.color_text_muted || '#9ca3af' }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-5">
        <p className="text-sm font-semibold mb-1" style={{ color: theme?.color_text_primary || '#111827' }}>Confirm ticket update</p>
        <p className="text-xs mb-3" style={labelStyle}>This update will be applied to:</p>
        <div className="rounded-xl border border-gray-100 max-h-40 overflow-y-auto mb-4">
          {slotLabels.length === 0 && <p className="text-xs px-3 py-3" style={labelStyle}>No slots selected</p>}
          {slotLabels.map((label, i) => (
            <p key={i} className="text-xs px-3 py-2 border-b border-gray-50 last:border-0" style={{ color: theme?.color_text_primary || '#374151' }}>{label}</p>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} disabled={saving} style={{ backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }} className="px-4 py-2 text-sm">Cancel</button>
          <button onClick={onConfirm} disabled={saving || slotLabels.length === 0} style={{ backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius, opacity: saving ? 0.6 : 1 }} className="px-4 py-2 text-sm">{saving ? 'Saving…' : 'OK, Save'}</button>
        </div>
      </div>
    </div>
  )
}