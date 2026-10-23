// THIS FILE GOES IN: components/shared/OREV1-159-SponsorDuplicateWarning.tsx (NEW file)
'use client'
type Warning = { name: string; logo_url: string | null; type?: string }
export default function OREV1159SponsorDuplicateWarning({ warning, theme, onClose }: { warning: Warning | null; theme: any; onClose: () => void }) {
  if (!warning) return null
  const radius = theme?.global_border_radius || '12px'
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-5 w-full max-w-sm text-center" onClick={e => e.stopPropagation()}>
        {warning.logo_url ? <img src={warning.logo_url} className="w-16 h-16 rounded-full object-cover mx-auto mb-3" /> : <span className="w-16 h-16 rounded-full bg-gray-100 mx-auto mb-3 flex items-center justify-center text-lg text-gray-400">{warning.name[0]}</span>}
        <p className="text-sm font-semibold text-gray-700 mb-3">{warning.name} — already added{warning.type ? ' as ' + warning.type : ' to this event'}.</p>
        <button type="button" onClick={onClose} style={{ backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }} className="px-6 py-2 text-sm">OK</button>
      </div>
    </div>
  )
}
