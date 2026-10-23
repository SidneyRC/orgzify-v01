// THIS FILE GOES IN: components/admin/OREV1-143-EventCategoriesPage.tsx (NEW FILE)
'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/lib/ThemeContext'
import { Download, ArrowLeft, Plus, Filter } from 'lucide-react'
import toast from 'react-hot-toast'
import EventCategoryFilterPanel, { EventCategoryFilters, EMPTY_FILTERS } from '@/components/admin/OREV1-143A-EventCategoryFilterPanel'
import EventCategoryFormModal from '@/components/admin/OREV1-143B-EventCategoryFormModal'

type Row = { id: string; name: string; level: number; status: string; parent_id: string | null; parent: { name: string } | null; display_order: number }

const STATUS_LABELS: Record<string, string> = { active: 'Active', inactive: 'Inactive', archived: 'Archived' }
const STATUS_COLORS: Record<string, string> = { active: 'bg-green-100 text-green-700', inactive: 'bg-gray-100 text-gray-500', archived: 'bg-gray-200 text-gray-500' }
const IconView = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
const IconEdit = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
const IconDelete = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
const IconRestore = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>

const API = '/admin/master/event-categories/api'
type Props = { backLink?: string }

export default function OREV1143EventCategoriesPage({ backLink = '/admin/master' }: Props) {
  const router = useRouter()
  const { theme } = useTheme()
  const [rows, setRows] = useState<Row[]>([])
  const [l1Options, setL1Options] = useState<{ id: string; name: string }[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [applied, setApplied] = useState<EventCategoryFilters>(EMPTY_FILTERS)
  const [draft, setDraft] = useState<EventCategoryFilters>(EMPTY_FILTERS)
  const [panelOpen, setPanelOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [viewOnly, setViewOnly] = useState(false)

  const radius = theme?.global_border_radius || '12px'
  const primaryBtn = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }
  const outlineBtn = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }
  const hasActiveFilters = Object.values(applied).some(v => v !== '')
  const totalPages = Math.max(1, Math.ceil(total / limit))

  const fetchData = useCallback(async (pageOverride?: number, filtersOverride?: EventCategoryFilters) => {
    setLoading(true)
    const p = pageOverride ?? page
    const f = filtersOverride ?? applied
    const params = new URLSearchParams({ page: String(p), limit: String(limit) })
    if (f.search) params.set('search', f.search)
    if (f.level) params.set('level', f.level)
    if (f.status) params.set('status', f.status)
    const res = await fetch(`${API}?${params}`)
    const json = await res.json()
    if (json.error) { toast.error('Failed to load categories'); setLoading(false); return }
    setRows(json.data || []); setTotal(json.total || 0); setLoading(false)
  }, [page, limit, applied])

  const fetchL1Options = useCallback(async () => {
    const res = await fetch(`${API}?level=1&status=active&limit=200`)
    const json = await res.json()
    setL1Options((json.data || []).map((c: any) => ({ id: c.id, name: c.name })))
  }, [])

  useEffect(() => { fetchData() }, [page, limit])
  useEffect(() => { fetchL1Options() }, [fetchL1Options])

  const handleApply = () => { setApplied(draft); setPanelOpen(false); setPage(1); fetchData(1, draft) }
  const handleCancel = () => { setDraft(applied); setPanelOpen(false) }
  const handleReset = () => { setDraft(EMPTY_FILTERS); setApplied(EMPTY_FILTERS); setPanelOpen(false); setPage(1); fetchData(1, EMPTY_FILTERS) }
  const openPanel = () => { setDraft(applied); setPanelOpen(true) }
  const handleDownload = () => window.open(`${API}?limit=1000&format=csv`, '_blank')

  const handleDelete = async (r: Row) => {
    if (!confirm('Move this category to Archived?')) return
    const res = await fetch(`${API}?id=${r.id}`, { method: 'DELETE' })
    const json = await res.json()
    if (json.error) { toast.error(json.error); return }
    toast.success('Category archived.'); fetchData()
  }
  const handleRestore = async (r: Row) => {
    const res = await fetch(API, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: r.id, action: 'restore' }) })
    const json = await res.json()
    if (json.error) { toast.error(json.error); return }
    toast.success('Restored — now Inactive.'); fetchData()
  }
  const openView = (r: Row) => { setEditing(r); setViewOnly(true); setModalOpen(true) }
  const openEdit = (r: Row) => { setEditing(r); setViewOnly(false); setModalOpen(true) }
  const openAdd = () => { setEditing(null); setViewOnly(false); setModalOpen(true) }

  const FunnelBtn = ({ iconOnly }: { iconOnly?: boolean }) => (
    <button onClick={openPanel} title="Filters" style={outlineBtn} className={`relative hover:opacity-90 transition ${iconOnly ? 'w-9 h-9 flex items-center justify-center' : 'text-sm font-medium px-4 py-2 flex items-center gap-1.5'}`}>
      <Filter size={16} />{!iconOnly && 'Filters'}
      {hasActiveFilters && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />}
    </button>
  )

  const Actions = ({ r }: { r: Row }) => r.status === 'archived' ? (
    <div className="flex gap-3 items-center">
      <button onClick={() => handleRestore(r)} title="Restore" className="text-green-500 hover:text-green-700 transition p-1 rounded-lg hover:bg-green-50"><IconRestore /></button>
    </div>
  ) : (
    <div className="flex gap-3 items-center">
      <button onClick={() => openView(r)} title="View" className="text-gray-400 hover:text-gray-700 transition p-1 rounded-lg hover:bg-gray-100"><IconView /></button>
      <button onClick={() => openEdit(r)} title="Edit" className="text-blue-400 hover:text-blue-700 transition p-1 rounded-lg hover:bg-blue-50"><IconEdit /></button>
      <button onClick={() => handleDelete(r)} title="Delete" className="text-red-400 hover:text-red-700 transition p-1 rounded-lg hover:bg-red-50"><IconDelete /></button>
    </div>
  )

  return (
    <div className="p-4 md:p-6" style={{ backgroundColor: theme?.page_bg || '#f9fafb', minHeight: '100vh' }}>
      <h1 className="text-2xl font-semibold mb-3 md:mb-0" style={{ color: theme?.color_text_primary || '#111827' }}>Event Categories</h1>

      <div className="hidden md:flex items-center justify-end gap-2 mb-5 -mt-9">
        <button onClick={() => router.push(backLink)} style={outlineBtn} className="text-sm font-medium px-4 py-2 hover:opacity-90">← Back</button>
        <button onClick={handleDownload} style={outlineBtn} className="text-sm font-medium px-4 py-2 hover:opacity-90">↓ Download</button>
        <button onClick={openAdd} style={primaryBtn} className="text-sm font-medium px-4 py-2 hover:opacity-90">+ Add</button>
        <FunnelBtn />
      </div>
      <div className="flex md:hidden items-center gap-2 mb-5">
        <button onClick={() => router.push(backLink)} title="Back" style={outlineBtn} className="w-9 h-9 flex items-center justify-center"><ArrowLeft size={16} /></button>
        <button onClick={handleDownload} title="Download" style={outlineBtn} className="w-9 h-9 flex items-center justify-center"><Download size={16} /></button>
        <button onClick={openAdd} title="Add" style={primaryBtn} className="w-9 h-9 flex items-center justify-center"><Plus size={16} /></button>
        <FunnelBtn iconOnly />
      </div>

      <EventCategoryFilterPanel open={panelOpen} draft={draft} onDraftChange={setDraft} onApply={handleApply} onCancel={handleCancel} onReset={handleReset} />

      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="bg-white border border-gray-200 px-3 py-1.5 rounded-xl disabled:opacity-40">‹ Prev</button>
        <span>Page {page} of {totalPages}</span>
        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="bg-white border border-gray-200 px-3 py-1.5 rounded-xl disabled:opacity-40">Next ›</button>
        <span className="text-gray-400 ml-2">{total} total</span>
      </div>

      <div className="hidden md:block bg-white rounded-2xl border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead style={{ backgroundColor: theme?.table_header_bg || '#f9fafb' }}>
            <tr>{['Name', 'Level', 'Parent', 'Status', 'Actions'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: theme?.table_header_text || '#6b7280' }}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="text-center py-12 text-sm text-gray-400">Loading…</td></tr>}
            {!loading && rows.length === 0 && <tr><td colSpan={5} className="text-center py-12 text-sm text-gray-400">No categories found.</td></tr>}
            {!loading && rows.map(r => (
              <tr key={r.id} className="border-t border-gray-50">
                <td className="px-4 py-3 font-medium">{r.name}</td>
                <td className="px-4 py-3 text-gray-500">{r.level === 1 ? 'Category' : 'Sub-Category'}</td>
                <td className="px-4 py-3 text-gray-400">{r.parent?.name || '—'}</td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[r.status]}`}>{STATUS_LABELS[r.status]}</span></td>
                <td className="px-4 py-3"><Actions r={r} /></td>
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
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[r.status]}`}>{STATUS_LABELS[r.status]}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500"><span>Level</span><span>{r.level === 1 ? 'Category' : 'Sub-Category'}</span></div>
            <Actions r={r} />
          </div>
        ))}
      </div>

      {modalOpen && <EventCategoryFormModal editing={editing} l1Options={l1Options} readOnly={viewOnly} onClose={() => setModalOpen(false)} onSaved={() => { setModalOpen(false); fetchData(); fetchL1Options() }} />}
    </div>
  )
}
