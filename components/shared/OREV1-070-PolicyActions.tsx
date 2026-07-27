'use client'

type Props = { theme?: any; refId?: string }

export default function OREV1070PolicyActions({ theme, refId }: Props) {
  const radius = theme?.global_border_radius || '12px'
  const primaryBtn = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }
  const outlineBtn = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }

  return (
    <div className="border-t px-6 py-4 flex justify-end gap-3 shrink-0" style={{ borderColor: theme?.color_border || '#e5e7eb' }}>
      {refId && (
        <a href={`/biz/register?ref=${refId}`} style={outlineBtn} className="text-sm font-medium px-5 py-2.5 hover:opacity-90 transition whitespace-nowrap">
          ← Back to Registration
        </a>
      )}
      <button onClick={() => window.close()} style={primaryBtn} className="text-sm font-medium px-5 py-2.5 hover:opacity-90 transition whitespace-nowrap">
        ✕ Close
      </button>
    </div>
  )
}