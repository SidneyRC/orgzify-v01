// THIS FILE GOES IN: components/shared/OREV1-115F-ReviewSubmitConfirm.tsx (REPLACES existing file)
'use client'
type Props = { submitting: boolean; onConfirm: () => void; onCancel: () => void; theme: any }

export default function OREV1115FReviewSubmitConfirm({ submitting, onConfirm, onCancel, theme }: Props) {
  const radius = theme?.global_border_radius || '12px'
  const outline = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }
  const primary = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-sm w-full flex flex-col gap-3" style={{ borderRadius: radius }}>
        <p className="text-sm font-semibold text-gray-700">Ready to submit your event?</p>
        <p className="text-xs" style={{ color: theme?.color_text_muted || '#9ca3af' }}>
          Our team will review it and get back to you within 48 hours. Your event will be locked from editing until then.
        </p>
        <div className="flex justify-end gap-2 mt-2">
          <button onClick={onCancel} disabled={submitting} style={outline} className="px-4 py-2 text-sm">Cancel</button>
          <button onClick={onConfirm} disabled={submitting} style={primary} className="px-5 py-2 text-sm font-medium">{submitting ? 'Submitting…' : 'OK, Submit'}</button>
        </div>
      </div>
    </div>
  )
}