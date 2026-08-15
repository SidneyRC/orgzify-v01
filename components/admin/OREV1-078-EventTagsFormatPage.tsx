// GOES IN: components/admin/OREV1-078-EventTagsFormatPage.tsx
'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/lib/ThemeContext'
import toast from 'react-hot-toast'
import OREV1078ATagFormModal from '@/components/admin/OREV1-078A-TagFormModal'

const IconEdit = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
const IconDelete = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
const IconView = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
const IconRestore = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
const IconHardDelete = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16M9.5 3.5l5 5m0-5l-5 5" /></svg>

const STATUS_COLORS: Record<string, string> = { archived: 'bg-gray-200 text-gray-500' }

type TagRow = { id: string; name: string; status: string }
type Props = { canCreate?: boolean; canEdit?: boolean; canDelete?: boolean; canViewArchived?: boolean; canRestore?: boolean; canDownload?: boolean; canHardDelete?: boolean }

export default function OREV1078EventTagsFormatPage({ canCreate = true, canEdit = true, canDelete = true, canViewArchived = true, canRestore = true, canDownload = true, canHardDelete = false }: Props) {
  const router = useRouter()
  const { theme } = useTheme()
  const [rows, setRows] = useState<TagRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [viewOnly, setViewOnly] = useState(false)

  const radius = theme?.global_border_radius || '12px'
  const primaryBtn = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }
  const outlineBtn = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }
  const totalPages = Math.max(1, Math.ceil(total / limit))

  const fetchData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (search) params.set('search', search)
    if (statusFilter) params.set('status', statusFilter)
    const res = await fetch(`/admin/master/event-tags-format/api?${params}`)
    const json = await res.json()
    if (json.error) { toast.error('Failed to load tags'); setLoading(false); return }
    setRows(json.data || []); setTotal(json.total || 0); setLoading(false)
  }, [page, limit, search, statusFilter])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSearch = () => { setSearch(searchInput); setPage(1) }
  const handleReset = () => { setSearchInput(''); setSearch(''); setStatusFilter(''); setPage(1) }

  const handleToggleActive = async (row: TagRow) => {
    const nextStatus = row.status === 'active' ? 'inactive' : 'active'
    setRows(rows => rows.map(x => x.id === row.id ? { ...x, status: nextStatus } : x))
    const res = await fetch('/admin/master/event-tags-format/api', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: row.id, status: nextStatus }) })
    if (!res.ok) { setRows(rows => rows.map(x => x.id === row.id ? { ...x, status: row.status } : x)); toast.error('Update failed') }
  }
  const handleDelete = async (row: TagRow) => {
    if (!confirm('Move this tag to Archived?')) return
    const res = await fetch(`/admin/master/event-tags-format/api?id=${row.id}`, { method: 'DELETE' })
    const json = await res.json()
    if (json.error) { toast.error(json.error); return }
    toast.success('Tag archived.'); fetchData()
  }
  const handleRestore = async (row: TagRow) => {
    const res = await fetch('/admin/master/event-tags-format/api', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: row.id, action: 'restore' }) })
    const json = await res.json()
    if (json.error) { toast.error(json.error); return }
    toast.success('Restored — now Inactive.'); fetchData()
  }
  const handleHardDelete = async (row: TagRow) => {
    if (!confirm('Permanently delete this tag? This CANNOT be undone.')) return
    const res = await fetch(`/admin/master/event-tags-format/api?id=${row.id}&hard=true`, { method: 'DELETE' })
    const json = await res.json()
    if (json.error) { toast.error(json.error); return }
    toast.success('Permanently deleted.'); fetchData()
  }
  const handleDownload = () => window.open(`/admin/master/event-tags-format/api?limit=1000&format=csv`, '_blank')
  const goBack = () => router.push('/admin/master')
  const openView = (r: TagRow) => { setEditing(r); setViewOnly(true); setModalOpen(true) }
  const openEdit = (r: TagRow) => { setEditing(r); setViewOnly(false); setModalOpen(true) }
  const openAdd = () => { setEditing(null); setViewOnly(false); setModalOpen(true) }

  return (
    <div className="p-6 pr-8" style={{ backgroundColor: theme?.page_bg }}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-semibold" style={{ color: theme?.color_text_primary || '#111827' }}>Event Tags Format</h1>
        <div className="flex gap-2">
          {canDownload && <button onClick={handleDownload} style={outlineBtn} className="text-sm font-medium px-4 py-2">↓ Download</button>}
          <button onClick={goBack} style={outlineBtn} className="text-sm font-medium px-4 py-2">← Back</button>
          {canCreate && <button onClick={openAdd} style={primaryBtn} className="text-sm font-medium px-4 py-2">+ Add</button>}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white">
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          {canViewArchived && <option value="archived">Archived</option>}
        </select>
      </div>

      <div className="flex flex-col md:flex-row gap-2 mb-5">
        <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSearch() }} placeholder="Search by name…"
          className="w-full md:flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm" />
        <div className="flex gap-2">
          <button onClick={handleReset} style={outlineBtn} className="flex-1 md:flex-none text-sm font-medium px-4 py-2">Reset</button>
          <button onClick={handleSearch} style={primaryBtn} className="flex-1 md:flex-none text-sm font-medium px-4 py-2">Search</button>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="bg-white border border-gray-200 px-3 py-1.5 rounded-xl disabled:opacity-40">‹ Prev</button>
        <span>Page {page} of {totalPages}</span>
        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="bg-white border border-gray-200 px-3 py-1.5 rounded-xl disabled:opacity-40">Next ›</button>
        <span className="text-gray-400 ml-2">{total} total</span>
      </div>

      <div className="hidden md:block bg-white rounded-2xl border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead style={{ backgroundColor: theme?.table_header_bg || '#f9fafb' }}>
            <tr>{['Name', 'Status', 'Actions'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: theme?.table_header_text || '#6b7280' }}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={3} className="text-center py-12 text-sm text-gray-400">Loading…</td></tr>}
            {!loading && rows.length === 0 && <tr><td colSpan={3} className="text-center py-12 text-sm text-gray-400">No tags found.</td></tr>}
            {!loading && rows.map(r => (
              <tr key={r.id} className="border-t border-gray-50">
                <td className="px-4 py-3 font-medium">{r.name}</td>
                <td className="px-4 py-3"><StatusCell r={r} /></td>
                <td className="px-4 py-3"><ActionIcons r={r} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden flex flex-col gap-3">
        {!loading && rows.map(r => (
          <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <p className="font-semibold text-sm">{r.name}</p>
              <StatusCell r={r} />
            </div>
            <ActionIcons r={r} />
          </div>
        ))}
      </div>

      {modalOpen && <OREV1078ATagFormModal editing={editing} readOnly={viewOnly} onClose={() => setModalOpen(false)} onSaved={() => { setModalOpen(false); fetchData() }} />}
    </div>
  )

  function StatusCell({ r }: { r: TagRow }) {
    if (r.status === 'archived') return <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS.archived}`}>Archived</span>
    const active = r.status === 'active'
    return (
      <button onClick={() => canEdit && handleToggleActive(r)} disabled={!canEdit}
        className={`inline-block ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`} title={active ? 'Active — click to deactivate' : 'Inactive — click to activate'}>
        <span className={`w-9 h-5 rounded-full relative transition-colors block ${active ? 'bg-emerald-500' : 'bg-gray-300'}`}>
          <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${active ? 'translate-x-4' : ''}`} />
        </span>
      </button>
    )
  }

  function ActionIcons({ r }: { r: TagRow }) {
    if (r.status === 'archived') {
      return (
        <div className="flex gap-3 items-center">
          {canRestore && <button onClick={() => handleRestore(r)} title="Restore" className="text-green-500 hover:text-green-700 transition p-1 rounded-lg hover:bg-green-50"><IconRestore /></button>}
          {canHardDelete && <button onClick={() => handleHardDelete(r)} title="Permanently Delete" className="text-red-600 hover:text-red-800 transition p-1 rounded-lg hover:bg-red-50"><IconHardDelete /></button>}
          {!canRestore && !canHardDelete && <span className="text-gray-300 text-xs">—</span>}
        </div>
      )
    }
    return (
      <div className="flex gap-3 items-center">
        <button onClick={() => openView(r)} title="View" className="text-gray-400 hover:text-gray-700 transition p-1 rounded-lg hover:bg-gray-100"><IconView /></button>
        {canEdit && <button onClick={() => openEdit(r)} title="Edit" className="text-blue-400 hover:text-blue-700 transition p-1 rounded-lg hover:bg-blue-50"><IconEdit /></button>}
        {canDelete && <button onClick={() => handleDelete(r)} title="Delete" className="text-red-400 hover:text-red-700 transition p-1 rounded-lg hover:bg-red-50"><IconDelete /></button>}
      </div>
    )
  }
}
