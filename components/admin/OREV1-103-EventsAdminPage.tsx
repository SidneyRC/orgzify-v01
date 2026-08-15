// THIS FILE GOES IN: components/admin/OREV1-103-EventsAdminPage.tsx (NEW FILE)
'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/lib/ThemeContext'
import toast from 'react-hot-toast'
import RejectReasonModal from '@/components/admin/OREV1-077-RejectReasonModal'

type EventRow = {
  id: string; process_id: string; slug: string; name: string; status: string
  under_review: boolean; booking_open: boolean; entity_slug: string
}

const STATUS_LABELS: Record<string, string> = { draft: 'Draft', pending: 'Pending', active: 'Active', rejected: 'Rejected' }
const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-500', pending: 'bg-yellow-100 text-yellow-700',
  active: 'bg-green-100 text-green-700', rejected: 'bg-red-200 text-red-800'
}

const IconView = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
const IconAccept = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
const IconReject = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-2 py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400 shrink-0 w-24">{label}</span>
      <span className="text-xs text-gray-700 font-medium text-right">{value || '—'}</span>
    </div>
  )
}

type Props = { backLink?: string; canApprove?: boolean }
const API = '/biz/events/api'

export default function OREV1103EventsAdminPage({ backLink = '/admin/ecosystem', canApprove = true }: Props) {
  const router = useRouter()
  const { theme } = useTheme()
  const [rows, setRows] = useState<EventRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [rejectTarget, setRejectTarget] = useState<EventRow | null>(null)

  const radius = theme?.global_border_radius || '12px'
  const primaryBtn = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }
  const outlineBtn = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }
  const selectClass = "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white"

  const fetchData = useCallback(async (pageOverride?: number) => {
    setLoading(true)
    const p = pageOverride ?? page
    const params = new URLSearchParams({ type: 'admin_list', page: String(p), limit: String(limit) })
    if (search) params.set('search', search)
    if (statusFilter) params.set('status', statusFilter)
    const res = await fetch(`${API}?${params}`)
    const json = await res.json()
    if (json.error) { toast.error('Failed to load events'); setLoading(false); return }
    setRows(json.data || []); setTotal(json.total || 0); setLoading(false)
  }, [page, limit, search, statusFilter])

  useEffect(() => { fetchData() }, [page, limit])
  const handleSearch = () => { setSearch(searchInput); setPage(1); fetchData(1) }
  const handleReset = () => { setSearchInput(''); setSearch(''); setStatusFilter(''); setPage(1); fetchData(1) }

  const handleApprove = async (r: EventRow) => {
    const res = await fetch(API, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: r.id, action: 'approve' }) })
    const json = await res.json()
    if (!res.ok) { toast.error(json.error || 'Approve failed'); return }
    toast.success('Event approved.'); fetchData()
  }

  const handleReject = async (r: EventRow, reasonId: string | null, note: string) => {
    const res = await fetch(API, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: r.id, action: 'reject', reason_id: reasonId, reason_note: note }) })
    const json = await res.json()
    if (!res.ok) { toast.error(json.error || 'Reject failed'); return }
    toast.success('Event rejected.'); setRejectTarget(null); fetchData()
  }

  const totalPages = Math.ceil(total / limit) || 1
  const viewLink = (r: EventRow) => `/biz/${r.entity_slug}/events/create?ref=${r.process_id}`

  const ApprovalAction = ({ r }: { r: EventRow }) => {
    if (!canApprove) return <span className="text-gray-300 text-xs">—</span>
    if (r.status === 'pending' || (r.status === 'active' && r.under_review)) return (
      <div className="flex gap-3 items-center">
        <button onClick={() => handleApprove(r)} title="Approve" className="text-green-500 hover:text-green-700 transition p-1 rounded-lg hover:bg-green-50"><IconAccept /></button>
        <button onClick={() => setRejectTarget(r)} title="Reject" className="text-red-500 hover:text-red-700 transition p-1 rounded-lg hover:bg-red-50"><IconReject /></button>
      </div>
    )
    return <span className="text-gray-300 text-xs">—</span>
  }

  return (
    <div className="p-4 md:p-6" style={{ backgroundColor: theme?.page_bg || '#f9fafb', minHeight: '100vh' }}>
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <h1 className="text-2xl font-semibold" style={{ color: theme?.color_text_primary || '#111827' }}>Events</h1>
        <button onClick={() => router.push(backLink)} style={outlineBtn} className="text-sm font-medium px-4 py-2 hover:opacity-90 whitespace-nowrap">← Back</button>
      </div>

      <div className="grid grid-cols-1 gap-2 mb-3">
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }} className={selectClass}>
          <option value="">All Statuses</option>
          {['draft', 'pending', 'active', 'rejected'].map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
      </div>

      <div className="flex gap-2 mb-5 items-center">
        <input value={searchInput} onChange={e => setSearchInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleSearch() }}
          placeholder="Search by name or process ID…" className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-400" />
        <button onClick={handleReset} style={outlineBtn} className="text-sm font-medium px-4 py-2 transition hover:opacity-90">Reset</button>
        <button onClick={handleSearch} style={primaryBtn} className="text-sm font-medium px-4 py-2 transition hover:opacity-90">Search</button>
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4 flex-wrap">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-xl hover:bg-gray-50 disabled:opacity-40">‹ Prev</button>
        <input type="number" min={1} max={totalPages} value={page} onChange={e => setPage(Math.min(totalPages, Math.max(1, Number(e.target.value))))} className="w-12 text-center border border-gray-200 rounded-xl px-2 py-1.5 text-sm focus:outline-none" />
        <span>of {totalPages}</span>
        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-xl hover:bg-gray-50 disabled:opacity-40">Next ›</button>
        <span className="text-gray-300">|</span>
        <input type="number" min={1} value={limit} onChange={e => { setLimit(Number(e.target.value)); setPage(1) }} className="w-14 text-center border border-gray-200 rounded-xl px-2 py-1.5 text-sm focus:outline-none" />
        <span className="text-gray-400">{total} total</span>
      </div>

      <div className="hidden md:block bg-white rounded-2xl border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead style={{ backgroundColor: theme?.table_header_bg || '#f9fafb' }}>
            <tr>{['Process ID', 'Name', 'Status', 'Approval', 'Actions'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: theme?.table_header_text || '#6b7280' }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="text-center py-12 text-sm text-gray-400">Loading…</td></tr>}
            {!loading && rows.length === 0 && <tr><td colSpan={5} className="text-center py-12 text-sm text-gray-400">No events found.</td></tr>}
            {!loading && rows.map(r => (
              <tr key={r.id} className="border-t border-gray-50 hover:bg-gray-50 transition">
                <td className="px-4 py-3 text-gray-400 text-xs font-mono">{r.process_id}</td>
                <td className="px-4 py-3 font-medium" style={{ color: theme?.color_text_primary || '#111827' }}>{r.name}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[r.status] || 'bg-gray-100 text-gray-500'}`}>{STATUS_LABELS[r.status] || r.status}</span>
                  {r.under_review && <span className="ml-1.5 text-xs px-2 py-1 rounded-full font-medium bg-blue-100 text-blue-600">Correction Pending</span>}
                </td>
                <td className="px-4 py-3"><ApprovalAction r={r} /></td>
                <td className="px-4 py-3">
                  <button onClick={() => router.push(viewLink(r))} title="View" className="text-gray-400 hover:text-gray-700 transition p-1 rounded-lg hover:bg-gray-100"><IconView /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden flex flex-col gap-3">
        {loading && <p className="text-center py-12 text-sm text-gray-400">Loading…</p>}
        {!loading && rows.length === 0 && <p className="text-center py-12 text-sm text-gray-400">No events found.</p>}
        {!loading && rows.map(r => (
          <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col gap-3 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate" style={{ color: theme?.color_text_primary || '#111827' }}>{r.name}</p>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{r.process_id}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${STATUS_COLORS[r.status] || 'bg-gray-100 text-gray-500'}`}>{STATUS_LABELS[r.status] || r.status}</span>
            </div>
            {r.under_review && (
              <div className="rounded-xl bg-gray-50 px-3 py-1"><InfoRow label="Correction" value="Pending review" /></div>
            )}
            <div className="flex items-center justify-between pt-1">
              <ApprovalAction r={r} />
              <button onClick={() => router.push(viewLink(r))} title="View" className="text-gray-400 hover:text-gray-700 transition p-1 rounded-lg hover:bg-gray-100"><IconView /></button>
            </div>
          </div>
        ))}
      </div>

      {rejectTarget && (
        <RejectReasonModal
          entityName={rejectTarget.name} statusCode="rejected" apiBase={API}
          onCancel={() => setRejectTarget(null)}
          onConfirm={(reasonId, note) => handleReject(rejectTarget, reasonId, note)}
        />
      )}
    </div>
  )
}
