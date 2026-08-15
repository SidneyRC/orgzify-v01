// THIS FILE GOES IN: components/admin/OREV1-115C-SponsorsMobileCards.tsx (NEW FILE)
'use client'
import { useState, useEffect } from 'react'
type SponsorRow = { id: string; name: string; logo_url: string | null; status: string; is_enabled: boolean; created_at: string }
type Props = { rows: SponsorRow[]; loading: boolean; theme: any; STATUS_LABELS: Record<string, string>; STATUS_COLORS: Record<string, string>; onApprove: (r: SponsorRow) => void; onReject: (r: SponsorRow) => void; onEdit: (r: SponsorRow) => void; onToggleEnabled: (r: SponsorRow) => void }

const IconAccept = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
const IconReject = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
const IconEdit = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>

function EnableToggle({ r, onToggle, theme }: { r: SponsorRow; onToggle: (r: SponsorRow) => void; theme: any }) {
  if (r.status !== 'approved') return null
  return (
    <button onClick={() => onToggle(r)} className="relative inline-flex h-5 w-9 items-center rounded-full transition shrink-0" style={{ backgroundColor: r.is_enabled ? (theme?.toggle_on || '#22c55e') : (theme?.toggle_off || '#e5e7eb') }}>
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition ${r.is_enabled ? 'translate-x-5' : 'translate-x-1'}`} />
    </button>
  )
}

export default function OREV1115CSponsorsMobileCards({ rows, loading, theme, STATUS_LABELS, STATUS_COLORS, onApprove, onReject, onEdit, onToggleEnabled }: Props) {
  const [zoomedUrl, setZoomedUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!zoomedUrl) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setZoomedUrl(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [zoomedUrl])
  return (
    <div className="md:hidden flex flex-col gap-3">
      {loading && <p className="text-center py-12 text-sm text-gray-400">Loading…</p>}
      {!loading && rows.length === 0 && <p className="text-center py-12 text-sm text-gray-400">No sponsors found.</p>}
      {!loading && rows.map(r => (
        <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col gap-3 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {r.logo_url ? <img src={r.logo_url} onClick={() => setZoomedUrl(r.logo_url)} className="w-12 h-12 rounded-lg object-cover cursor-zoom-in shrink-0" /> : <span className="w-12 h-12 rounded-lg bg-gray-100 inline-block shrink-0" />}
              <p className="font-semibold text-sm truncate" style={{ color: theme?.color_text_primary || '#111827' }}>{r.name}</p>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${STATUS_COLORS[r.status] || 'bg-gray-100 text-gray-500'}`}>{STATUS_LABELS[r.status] || r.status}</span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t">
            <button onClick={() => onEdit(r)} title="Edit" className="text-blue-400 hover:text-blue-700 transition p-1 rounded-lg hover:bg-blue-50"><IconEdit /></button>
            <div className="flex items-center gap-3">
              <EnableToggle r={r} onToggle={onToggleEnabled} theme={theme} />
              {r.status === 'pending' && (
                <>
                  <button onClick={() => onApprove(r)} title="Approve" className="text-green-500 hover:text-green-700 transition p-1 rounded-lg hover:bg-green-50"><IconAccept /></button>
                  <button onClick={() => onReject(r)} title="Reject" className="text-red-500 hover:text-red-700 transition p-1 rounded-lg hover:bg-red-50"><IconReject /></button>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
      {zoomedUrl && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setZoomedUrl(null)}>
          <img src={zoomedUrl} className="max-w-[90vw] max-h-[80vh] rounded-2xl object-contain bg-white" />
        </div>
      )}
    </div>
  )
}
