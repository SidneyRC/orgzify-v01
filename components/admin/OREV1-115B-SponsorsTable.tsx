// THIS FILE GOES IN: components/admin/OREV1-115B-SponsorsTable.tsx (NEW FILE)
'use client'
import { useState, useEffect } from 'react'
type SponsorRow = { id: string; name: string; logo_url: string | null; status: string; is_enabled: boolean; created_at: string }
type Props = { rows: SponsorRow[]; loading: boolean; theme: any; STATUS_LABELS: Record<string, string>; STATUS_COLORS: Record<string, string>; onApprove: (r: SponsorRow) => void; onReject: (r: SponsorRow) => void; onEdit: (r: SponsorRow) => void; onToggleEnabled: (r: SponsorRow) => void }

const IconAccept = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
const IconReject = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
const IconEdit = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>

function StatusActions({ r, onApprove, onReject, onEdit }: { r: SponsorRow; onApprove: (r: SponsorRow) => void; onReject: (r: SponsorRow) => void; onEdit: (r: SponsorRow) => void }) {
  return (
    <div className="flex gap-3 items-center">
      <button onClick={() => onEdit(r)} title="Edit" className="text-blue-400 hover:text-blue-700 transition p-1 rounded-lg hover:bg-blue-50"><IconEdit /></button>
      {r.status === 'pending' && (
        <>
          <button onClick={() => onApprove(r)} title="Approve" className="text-green-500 hover:text-green-700 transition p-1 rounded-lg hover:bg-green-50"><IconAccept /></button>
          <button onClick={() => onReject(r)} title="Reject" className="text-red-500 hover:text-red-700 transition p-1 rounded-lg hover:bg-red-50"><IconReject /></button>
        </>
      )}
    </div>
  )
}

function EnableToggle({ r, onToggle, theme }: { r: SponsorRow; onToggle: (r: SponsorRow) => void; theme: any }) {
  if (r.status !== 'approved') return <span className="text-gray-300 text-xs">—</span>
  return (
    <button onClick={() => onToggle(r)} className="relative inline-flex h-5 w-9 items-center rounded-full transition shrink-0" style={{ backgroundColor: r.is_enabled ? (theme?.toggle_on || '#22c55e') : (theme?.toggle_off || '#e5e7eb') }}>
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition ${r.is_enabled ? 'translate-x-5' : 'translate-x-1'}`} />
    </button>
  )
}

export default function OREV1115BSponsorsTable({ rows, loading, theme, STATUS_LABELS, STATUS_COLORS, onApprove, onReject, onEdit, onToggleEnabled }: Props) {
  const [zoomedUrl, setZoomedUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!zoomedUrl) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setZoomedUrl(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [zoomedUrl])
  return (
    <div className="hidden md:block bg-white rounded-2xl border border-gray-100 overflow-x-auto">
      <table className="w-full text-sm">
        <thead style={{ backgroundColor: theme?.table_header_bg || '#f9fafb' }}>
          <tr>{['Logo', 'Name', 'Created', 'Status', 'Enabled', 'Actions'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: theme?.table_header_text || '#6b7280' }}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {loading && <tr><td colSpan={6} className="text-center py-12 text-sm text-gray-400">Loading…</td></tr>}
          {!loading && rows.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-sm text-gray-400">No sponsors found.</td></tr>}
          {!loading && rows.map(r => (
            <tr key={r.id} className="border-t border-gray-50 hover:bg-gray-50 transition">
              <td className="px-4 py-3">{r.logo_url ? <img src={r.logo_url} onClick={() => setZoomedUrl(r.logo_url)} className="w-14 h-14 rounded-lg object-cover cursor-zoom-in hover:opacity-80 transition" /> : <span className="w-14 h-14 rounded-lg bg-gray-100 inline-block" />}</td>
              <td className="px-4 py-3 font-medium" style={{ color: theme?.color_text_primary || '#111827' }}>{r.name}</td>
              <td className="px-4 py-3 text-gray-400 text-xs">{new Date(r.created_at).toLocaleDateString()}</td>
              <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[r.status] || 'bg-gray-100 text-gray-500'}`}>{STATUS_LABELS[r.status] || r.status}</span></td>
              <td className="px-4 py-3"><EnableToggle r={r} onToggle={onToggleEnabled} theme={theme} /></td>
              <td className="px-4 py-3"><StatusActions r={r} onApprove={onApprove} onReject={onReject} onEdit={onEdit} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      {zoomedUrl && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setZoomedUrl(null)}>
          <img src={zoomedUrl} className="max-w-md max-h-[80vh] rounded-2xl object-contain bg-white" />
        </div>
      )}
    </div>
  )
}
