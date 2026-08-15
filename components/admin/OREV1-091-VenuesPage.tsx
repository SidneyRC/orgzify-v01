// GOES IN: components/admin/OREV1-091-VenuesPage.tsx
'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/lib/ThemeContext'
import toast from 'react-hot-toast'
import OREV1097SingleSelectSearch from './OREV1-097-SingleSelectSearch'
import OREV1098VenueReviewModal from './OREV1-098-VenueReviewModal'
import OREV1099VenueActionIcons from './OREV1-099-VenueActionIcons'

type VenueRow = {
  id: string; process_id: string; internal_name: string; external_name: string
  city_name: string | null; visibility: string; status: string
  reporting_label: string // company display_name OR entity display_name, decided by API
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-2 py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400 shrink-0 w-28">{label}</span>
      <span className="text-xs text-gray-700 font-medium text-right">{value || '—'}</span>
    </div>
  )
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending', inactive: 'Inactive', active: 'Active',
  rejected: 'Rejected', suspended: 'Suspended', blocked: 'Blocked', archived: 'Archived'
}
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700', inactive: 'bg-gray-100 text-gray-500', active: 'bg-green-100 text-green-700',
  rejected: 'bg-red-200 text-red-800', suspended: 'bg-red-100 text-red-600', blocked: 'bg-gray-800 text-white', archived: 'bg-gray-200 text-gray-500'
}
const VIS_LABELS: Record<string, string> = { all: 'All', exclusive: 'Exclusive' }

const API = '/admin/master/venue/api'

type Props = { canCreate?: boolean; canEdit?: boolean; canDelete?: boolean; canRestore?: boolean; canHardDelete?: boolean; canActivate?: boolean; canApprove?: boolean; canDownload?: boolean; backLink?: string }

export default function OREV1091VenuesPage({ canCreate = true, canEdit = true, canDelete = true, canRestore = true, canHardDelete = true, canActivate = true, canApprove = true, canDownload = true, backLink = '/admin/master' }: Props) {
  const router = useRouter()
  const { theme } = useTheme()
  const [rows, setRows] = useState<VenueRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [visFilter, setVisFilter] = useState('')
  const [officeFilter, setOfficeFilter] = useState('')
  const [officeLabel, setOfficeLabel] = useState('')
  const [entityFilter, setEntityFilter] = useState('')
  const [entityLabel, setEntityLabel] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [reviewModal, setReviewModal] = useState<{ id: string; action: 'reject' | 'suspend' | 'block' } | null>(null)
  const [reasons, setReasons] = useState<{ id: string; reason_label: string }[]>([])
  const [reasonId, setReasonId] = useState('')
  const [reasonNote, setReasonNote] = useState('')

  const radius = theme?.global_border_radius || '12px'
  const primaryBtn = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }
  const outlineBtn = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }
  const selectClass = "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white"

  const fetchData = useCallback(async (overridePage?: number) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(overridePage || page), limit: String(limit) })
    if (search) params.set('search', search)
    if (statusFilter) params.set('status', statusFilter)
    if (visFilter) params.set('visibility', visFilter)
    if (officeFilter) params.set('company_id', officeFilter)
    if (entityFilter) params.set('entity_id', entityFilter)
    const res = await fetch(`${API}?${params}`)
    const json = await res.json()
    if (json.error) { toast.error('Failed to load venues'); setLoading(false); return }
    setRows(json.data || []); setTotal(json.total || 0); setLoading(false)
  }, [page, limit, search, statusFilter, visFilter, officeFilter, entityFilter])

  useEffect(() => { fetchData() }, [page, limit])

  const handleSearch = () => { setSearch(searchInput); setPage(1); fetchData(1) }
  const handleReset = () => {
    setSearchInput(''); setSearch(''); setStatusFilter(''); setVisFilter('')
    setOfficeFilter(''); setOfficeLabel(''); setEntityFilter(''); setEntityLabel(''); setPage(1)
    fetchData(1)
  }

  const handleDownload = async () => {
    const params = new URLSearchParams({ page: '1', limit: '10000' })
    if (search) params.set('search', search)
    if (statusFilter) params.set('status', statusFilter)
    if (visFilter) params.set('visibility', visFilter)
    if (officeFilter) params.set('company_id', officeFilter)
    if (entityFilter) params.set('entity_id', entityFilter)
    const res = await fetch(`${API}?${params}`)
    const json = await res.json()
    const csvRows = (json.data || []).map((r: VenueRow) => [r.process_id, r.internal_name, r.external_name, r.city_name || '', r.visibility, r.reporting_label || '', r.status].join(','))
    const csv = ['Process ID,Internal Name,External Name,City,Visibility,Reporting Office/Entity,Status', ...csvRows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'venues.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const totalPages = Math.max(1, Math.ceil(total / limit))

  const toggleActive = async (r: VenueRow) => {
    if (r.status !== 'active' && r.status !== 'inactive') return
    const next = r.status === 'active' ? 'inactive' : 'active'
    const res = await fetch(API, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: r.id, status: next }) })
    const json = await res.json()
    if (json.error) { toast.error('Failed to update'); return }
    toast.success(next === 'active' ? 'Venue activated' : 'Venue disabled')
    fetchData()
  }

  const approve = async (r: VenueRow) => {
    if (!confirm('Approve this venue?')) return
    const res = await fetch(API, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: r.id, action: 'approve', expected_status: r.status }) })
    const json = await res.json()
    if (json.error) { toast.error('Failed to approve'); return }
    toast.success('Venue approved'); fetchData()
  }

  const openReviewModal = async (id: string, action: 'reject' | 'suspend' | 'block') => {
    setReviewModal({ id, action }); setReasonId(''); setReasonNote('')
    const res = await fetch(`${API}?type=status_reasons&status_code=${action === 'reject' ? 'rejected' : action === 'suspend' ? 'suspended' : 'blocked'}`)
    const json = await res.json()
    setReasons(json.data || [])
  }

  const submitReview = async () => {
    if (!reviewModal) return
    if (!reasonId && !reasonNote.trim()) { toast.error('A reason is required'); return }
    const res = await fetch(API, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: reviewModal.id, action: reviewModal.action, reason_id: reasonId || null, reason_note: reasonNote || null }) })
    const json = await res.json()
    if (json.error) { toast.error('Action failed'); return }
    toast.success('Done'); setReviewModal(null); fetchData()
  }

  const deleteOrRestore = async (r: VenueRow, action: 'delete' | 'restore' | 'hard_delete') => {
    if (!confirm(action === 'hard_delete' ? 'Permanently delete this venue? This cannot be undone.' : action === 'restore' ? 'Restore this venue?' : 'Delete this venue?')) return
    const method = action === 'hard_delete' ? 'DELETE' : 'PATCH'
    const body = action === 'hard_delete' ? { id: r.id, hard: true } : action === 'restore' ? { id: r.id, action: 'restore' } : { id: r.id, action: 'delete' }
    const res = await fetch(API, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const json = await res.json()
    if (json.error) { toast.error('Action failed'); return }
    toast.success('Done'); fetchData()
  }

  const ActionIcons = ({ r }: { r: VenueRow }) => (
    <OREV1099VenueActionIcons r={r} canEdit={canEdit} canDelete={canDelete} canRestore={canRestore} canHardDelete={canHardDelete} canApprove={canApprove}
      onApprove={approve} onOpenReview={openReviewModal} onDeleteOrRestore={deleteOrRestore} />
  )

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h1 className="text-lg font-semibold" style={{ color: theme?.color_text_primary || '#111827' }}>Venues</h1>
        <div className="flex gap-2">
          {canDownload && <button onClick={handleDownload} style={outlineBtn} className="text-sm font-medium px-4 py-2 hover:opacity-90">⬇ Download</button>}
          <button onClick={() => router.push(backLink)} style={outlineBtn} className="text-sm font-medium px-4 py-2 hover:opacity-90">← Back</button>
          {canCreate && <button onClick={() => router.push('/admin/master/venue/new')} style={primaryBtn} className="text-sm font-medium px-4 py-2 hover:opacity-90">+ Add Venue</button>}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={selectClass}>
          <option value="">All Statuses</option>
          <option value="inactive">Inactive</option>
          <option value="active">Active</option>
          {canApprove && <option value="pending">Pending</option>}
          {canApprove && <option value="rejected">Rejected</option>}
          {canApprove && <option value="suspended">Suspended</option>}
          {canApprove && <option value="blocked">Blocked</option>}
          {canRestore && <option value="archived">Archived</option>}
        </select>
        <select value={visFilter} onChange={e => setVisFilter(e.target.value)} className={selectClass}>
          <option value="">All Visibility</option>
          <option value="all">All (Shared)</option>
          <option value="exclusive">Exclusive</option>
        </select>
        <OREV1097SingleSelectSearch value={officeFilter} label={officeLabel} apiBase={API} apiType="search_offices"
          placeholder="Search Reporting Office…" onChange={(id, label) => { setOfficeFilter(id); setOfficeLabel(label) }} />
        <OREV1097SingleSelectSearch value={entityFilter} label={entityLabel} apiBase={API} apiType="search_entities"
          placeholder="Search Entity…" onChange={(id, label) => { setEntityFilter(id); setEntityLabel(label) }} />
      </div>

      <div className="flex gap-2 mb-5 items-center">
        <input value={searchInput} onChange={e => setSearchInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleSearch() }}
          placeholder="Search by name or process ID…" className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-400" />
        <button onClick={handleReset} style={outlineBtn} className="text-sm font-medium px-4 py-2 hover:opacity-90">Reset</button>
        <button onClick={handleSearch} style={primaryBtn} className="text-sm font-medium px-4 py-2 hover:opacity-90">Search</button>
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4 flex-wrap">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-xl hover:bg-gray-50 disabled:opacity-40">‹ Prev</button>
        <input type="number" min={1} max={totalPages} value={page} onChange={e => setPage(Math.min(totalPages, Math.max(1, Number(e.target.value))))}
          className="w-12 text-center border border-gray-200 rounded-xl px-2 py-1.5 text-sm focus:outline-none" />
        <span>of {totalPages}</span>
        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-xl hover:bg-gray-50 disabled:opacity-40">Next ›</button>
        <span className="text-gray-300">|</span>
        <input type="number" min={1} value={limit} onChange={e => { setLimit(Number(e.target.value)); setPage(1) }} className="w-14 text-center border border-gray-200 rounded-xl px-2 py-1.5 text-sm focus:outline-none" />
        <span className="text-gray-400">{total} total</span>
      </div>

      <div className="hidden md:block bg-white rounded-2xl border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead style={{ backgroundColor: theme?.table_header_bg || '#f9fafb' }}>
            <tr>
              {['Process ID', 'Internal Name', 'External Name', 'City', 'Visibility', 'Reporting Office / Entity', 'Status', 'Active', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: theme?.table_header_text || '#6b7280' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={9} className="text-center py-12 text-sm text-gray-400">Loading…</td></tr>}
            {!loading && rows.length === 0 && <tr><td colSpan={9} className="text-center py-12 text-sm text-gray-400">No venues found.</td></tr>}
            {!loading && rows.map(r => (
              <tr key={r.id} className="border-t border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-400 text-xs font-mono">{r.process_id}</td>
                <td className="px-4 py-3 font-medium" style={{ color: theme?.color_text_primary || '#111827' }}>{r.internal_name}</td>
                <td className="px-4 py-3 text-gray-500">{r.external_name}</td>
                <td className="px-4 py-3 text-gray-500">{r.city_name || '—'}</td>
                <td className="px-4 py-3 text-gray-500">{VIS_LABELS[r.visibility] || r.visibility}</td>
                <td className="px-4 py-3 text-gray-400">{r.reporting_label || '—'}</td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[r.status]}`}>{STATUS_LABELS[r.status]}</span></td>
                <td className="px-4 py-3">
                  {canActivate && (r.status === 'active' || r.status === 'inactive') && (
                    <button onClick={() => toggleActive(r)} className={`w-9 h-5 rounded-full relative transition ${r.status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`}>
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition ${r.status === 'active' ? 'left-4.5' : 'left-0.5'}`} />
                    </button>
                  )}
                </td>
                <td className="px-4 py-3"><ActionIcons r={r} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden flex flex-col gap-3">
        {loading && <p className="text-center py-12 text-sm text-gray-400">Loading…</p>}
        {!loading && rows.length === 0 && <p className="text-center py-12 text-sm text-gray-400">No venues found.</p>}
        {!loading && rows.map(r => (
          <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col gap-3 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate" style={{ color: theme?.color_text_primary || '#111827' }}>{r.internal_name}</p>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{r.process_id}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${STATUS_COLORS[r.status]}`}>{STATUS_LABELS[r.status]}</span>
            </div>
            <div className="rounded-xl bg-gray-50 px-3 py-1">
              <InfoRow label="External Name" value={r.external_name} />
              <InfoRow label="City" value={r.city_name || '—'} />
              <InfoRow label="Visibility" value={VIS_LABELS[r.visibility] || r.visibility} />
              <InfoRow label="Reporting Office/Entity" value={r.reporting_label || '—'} />
            </div>
            <div className="flex items-center justify-between pt-1">
              {canActivate && (r.status === 'active' || r.status === 'inactive') ? (
                <button onClick={() => toggleActive(r)} className={`w-9 h-5 rounded-full relative transition ${r.status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition ${r.status === 'active' ? 'left-4.5' : 'left-0.5'}`} />
                </button>
              ) : <span />}
              <ActionIcons r={r} />
            </div>
          </div>
        ))}
      </div>

      {reviewModal && (
        <OREV1098VenueReviewModal action={reviewModal.action} reasons={reasons} reasonId={reasonId} reasonNote={reasonNote}
          onReasonIdChange={setReasonId} onReasonNoteChange={setReasonNote} onCancel={() => setReviewModal(null)} onSubmit={submitReview} />
      )}
    </div>
  )
}
