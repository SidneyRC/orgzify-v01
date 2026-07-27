'use client'
import { useTheme } from '@/lib/ThemeContext'

type Props = {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function OREV1059ConfirmModal({
  open, title, message, confirmLabel = 'Yes, leave', cancelLabel = 'Cancel', onConfirm, onCancel
}: Props) {
  const { theme } = useTheme()
  const radius = theme?.global_border_radius || '12px'
  const primaryBtn = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }
  const outlineBtn = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
      <div className="w-full max-w-sm bg-white p-6" style={{ borderRadius: radius }}>
        <h3 className="text-sm font-semibold mb-2" style={{ color: theme?.color_text_primary || '#111827' }}>{title}</h3>
        <p className="text-sm mb-6" style={{ color: theme?.color_text_muted || '#6b7280' }}>{message}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} style={outlineBtn} className="text-sm font-medium px-4 py-2.5 hover:opacity-90 transition whitespace-nowrap">{cancelLabel}</button>
          <button onClick={onConfirm} style={primaryBtn} className="text-sm font-medium px-4 py-2.5 hover:opacity-90 transition whitespace-nowrap">{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
