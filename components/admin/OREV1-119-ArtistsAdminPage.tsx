// THIS FILE GOES IN: components/admin/OREV1-119-ArtistsAdminPage.tsx (NEW FILE)
'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/lib/ThemeContext'
import toast from 'react-hot-toast'
import RejectReasonModal from '@/components/admin/OREV1-077-RejectReasonModal'
import OREV1119BArtistsTable from '@/components/admin/OREV1-119B-ArtistsTable'
import OREV1119CArtistsMobileCards from '@/components/admin/OREV1-119C-ArtistsMobileCards'
import OREV1119DAdminAddArtistModal from '@/components/admin/OREV1-119D-AdminAddArtistModal'
import OREV1119EArtistsToolbar from '@/components/admin/OREV1-119E-ArtistsToolbar'

type ArtistRow = { id: string; name: string; photo_url: string | null; speciality_name: string; status: string; is_enabled: boolean; created_at: string }
const API = '/admin/artists/api'
const STATUS_LABELS: Record<string, string> = { pending: 'Pending', active: 'Approved', rejected: 'Rejected' }
const STATUS_COLORS: Record<string, string> = { pending: 'bg-yellow-100 text-yellow-700', active: 'bg-green-100 text-green-700', rejected: 'bg-red-200 text-red-800' }

export default function OREV1119ArtistsAdminPage({ backLink = '/admin/ecosystem' }: { backLink?: string }) {
  const router = useRouter()
  const { theme } = useTheme()
  const [rows, setRows] = useState<ArtistRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('pending')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [reasonTarget, setReasonTarget] = useState<ArtistRow | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editTarget, setEditTarget] = useState<ArtistRow | null>(null)

  const fetchData = useCallback(async (pageOverride?: number) => {
    setLoading(true)
    const p = pageOverride ?? page
    const params = new URLSearchParams({ page: String(p), limit: String(limit) })
    if (search) params.set('search', search)
    if (statusFilter) params.set('status', statusFilter)
    const res = await fetch(`${API}?${params}`)
    const json = await res.json()
    if (json.error) { toast.error('Failed to load artists'); setLoading(false); return }
    setRows(json.data || []); setTotal(json.total || 0); setLoading(false)
  }, [page, limit, search, statusFilter])
  useEffect(() => { fetchData() }, [page, limit])

  const handleSearch = () => { setSearch(searchInput); setPage(1); fetchData(1) }
  const handleReset = () => { setSearchInput(''); setSearch(''); setStatusFilter(''); setPage(1); fetchData(1) }
  const handleApprove = async (r: ArtistRow) => {
    const res = await fetch(API, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: r.id, status: 'active' }) })
    if (!res.ok) { toast.error('Failed'); return }
    toast.success('Artist approved'); setRows(rows => rows.map(x => x.id === r.id ? { ...x, status: 'active' } : x))
  }
  const handleReject = async (reasonId: string | null, note: string) => {
    if (!reasonTarget) return
    const res = await fetch(API, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: reasonTarget.id, status: 'rejected', reason_id: reasonId, reason_note: note }) })
    if (!res.ok) { toast.error('Failed'); setReasonTarget(null); return }
    toast.success('Artist rejected'); setRows(rows => rows.map(x => x.id === reasonTarget.id ? { ...x, status: 'rejected' } : x)); setReasonTarget(null)
  }
  const handleToggleEnabled = async (r: ArtistRow) => {
    const res = await fetch(API, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: r.id, is_enabled: !r.is_enabled }) })
    if (!res.ok) { toast.error('Failed'); return }
    setRows(rows => rows.map(x => x.id === r.id ? { ...x, is_enabled: !x.is_enabled } : x))
  }
  const handleDelete = async (r: ArtistRow) => {
    if (!confirm(`Permanently delete "${r.name}"? This cannot be undone.`)) return
    const res = await fetch(`${API}?id=${r.id}`, { method: 'DELETE' })
    const json = await res.json()
    if (!res.ok) { toast.error(json.error || 'Failed'); return }
    toast.success('Artist deleted'); setRows(rows => rows.filter(x => x.id !== r.id)); setTotal(t => t - 1)
  }
  const handleDownload = () => {
    const header = 'Name,Speciality,Status,Enabled,Created\n'
    const csv = rows.map(r => `"${r.name}","${r.speciality_name}",${r.status},${r.is_enabled ? 'Yes' : 'No'},${new Date(r.created_at).toLocaleDateString()}`).join('\n')
    const blob = new Blob([header + csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'artists.csv'; a.click(); URL.revokeObjectURL(url)
  }
  const totalPages = Math.ceil(total / limit) || 1
  return (
    <div className="p-4 md:p-6" style={{ backgroundColor: theme?.page_bg || '#f9fafb', minHeight: '100vh' }}>
      <OREV1119EArtistsToolbar theme={theme} statusFilter={statusFilter} setStatusFilter={v => { setStatusFilter(v); setPage(1) }} searchInput={searchInput} setSearchInput={setSearchInput} page={page} setPage={setPage} limit={limit} setLimit={v => { setLimit(v); setPage(1) }} total={total} totalPages={totalPages} STATUS_LABELS={STATUS_LABELS} onSearch={handleSearch} onReset={handleReset} onDownload={handleDownload} onAdd={() => setShowAddModal(true)} onBack={() => router.push(backLink)} />
      <OREV1119BArtistsTable rows={rows} loading={loading} theme={theme} STATUS_LABELS={STATUS_LABELS} STATUS_COLORS={STATUS_COLORS} onApprove={handleApprove} onReject={setReasonTarget} onEdit={setEditTarget} onToggleEnabled={handleToggleEnabled} onDelete={handleDelete} />
      <OREV1119CArtistsMobileCards rows={rows} loading={loading} theme={theme} STATUS_LABELS={STATUS_LABELS} STATUS_COLORS={STATUS_COLORS} onApprove={handleApprove} onReject={setReasonTarget} onEdit={setEditTarget} onToggleEnabled={handleToggleEnabled} onDelete={handleDelete} />
      {reasonTarget && <RejectReasonModal entityName={reasonTarget.name} statusCode="rejected" apiBase={API} onCancel={() => setReasonTarget(null)} onConfirm={handleReject} />}
      {showAddModal && <OREV1119DAdminAddArtistModal theme={theme} onClose={() => setShowAddModal(false)} onCreated={() => { setShowAddModal(false); fetchData() }} />}
      {editTarget && <OREV1119DAdminAddArtistModal theme={theme} artist={editTarget} onClose={() => setEditTarget(null)} onCreated={() => { setEditTarget(null); fetchData() }} />}
    </div>
  )
}
