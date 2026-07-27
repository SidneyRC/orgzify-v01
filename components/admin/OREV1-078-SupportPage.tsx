'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/lib/ThemeContext'
import toast from 'react-hot-toast'
import OREV1079TicketFilters, { TicketFilterValues } from '@/components/admin/OREV1-079-TicketFilters'
import OREV1083SupportTicketList, { TicketRow } from '@/components/admin/OREV1-083-SupportTicketList'
import OREV1080TicketViewModal from '@/components/admin/OREV1-080-TicketViewModal'
import OREV1081TicketEditModal from '@/components/admin/OREV1-081-TicketEditModal'

type Props = { canEdit?: boolean; canDownload?: boolean; canOverwriteEdit?: boolean }

export default function OREV1078SupportPage({ canEdit = true, canDownload = true, canOverwriteEdit = true }: Props) {
  const router = useRouter()
  const { theme } = useTheme()
  const radius = theme?.global_border_radius || '12px'
  const outlineBtn = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }

  const [rows, setRows] = useState<TicketRow[]>([])
  const [total, setTotal] = useState(0)
  const [summary, setSummary] = useState({ total: 0, resolved: 0, open: 0 })
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [filters, setFilters] = useState<TicketFilterValues | null>(null)
  const [page, setPage] = useState(1)
  const limit = 20
  const [viewTarget, setViewTarget] = useState<TicketRow | null>(null)
  const [editTarget, setEditTarget] = useState<TicketRow | null>(null)
  const totalPages = Math.max(1, Math.ceil(total / limit))

  const runSearch = async (f: TicketFilterValues, p = 1) => {
    setLoading(true); setSearched(true); setFilters(f); setPage(p)
    const params = new URLSearchParams({ page: String(p), limit: String(limit) })
    Object.entries(f).forEach(([k, v]) => { if (v) params.set(k, v as string) })
    const res = await fetch(`/admin/ecosystem/support/api?${params}`)
    const json = await res.json()
    if (json.error) { toast.error('Failed to load tickets'); setLoading(false); return }
    setRows(json.data || []); setTotal(json.total || 0); setSummary(json.summary || { total: 0, resolved: 0, open: 0 }); setLoading(false)
  }

  const handleReset = () => { setRows([]); setTotal(0); setSummary({ total: 0, resolved: 0, open: 0 }); setSearched(false); setFilters(null); setPage(1) }

  const handleDownload = () => {
    const csv = ['Process ID,Entity,Category,Sub-category,Country,Reporting Office,Status',
      ...rows.map(r => `${r.entity.process_id || ''},${r.entity.display_name},${r.category},${r.sub_category},${r.entity.country_name || ''},${r.reporting_company?.display_name || ''},${r.status}`)
    ].join('\n')
    const ts = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = `tickets_${ts}.csv`; a.click()
  }

  return (
    <div className="p-4 md:p-6" style={{ backgroundColor: theme?.page_bg || '#f9fafb', minHeight: '100vh' }}>
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <h1 className="text-2xl font-semibold" style={{ color: theme?.color_text_primary || '#111827' }}>Tickets</h1>
        <div className="flex gap-2 shrink-0">
          {canDownload && <button onClick={handleDownload} style={outlineBtn} className="text-sm font-medium px-4 py-2 hover:opacity-90 whitespace-nowrap">↓ Download</button>}
          <button onClick={() => router.push('/admin/ecosystem')} style={outlineBtn} className="text-sm font-medium px-4 py-2 hover:opacity-90">← Back</button>
        </div>
      </div>

      <OREV1079TicketFilters onSearch={f => runSearch(f, 1)} onReset={handleReset} />

      {!searched && <p className="text-center text-sm text-gray-400 py-16">Use the filters above and click Search to view tickets.</p>}

      {searched && (
        <OREV1083SupportTicketList
          rows={rows} loading={loading} page={page} totalPages={totalPages} total={total}
          canEdit={canEdit}
          onView={setViewTarget} onEdit={setEditTarget}
          onPageChange={p => filters && runSearch(filters, p)}
        />
      )}

      {viewTarget && <OREV1080TicketViewModal ticket={viewTarget as any} canEdit={canEdit} onClose={() => setViewTarget(null)} onEdit={() => { setEditTarget(viewTarget); setViewTarget(null) }} />}
      {editTarget && (
        <OREV1081TicketEditModal ticket={editTarget as any} canOverwriteEdit={canOverwriteEdit} onClose={() => setEditTarget(null)}
          onSaved={(newStatus) => { setRows(prev => prev.map(r => r.id === editTarget.id ? { ...r, status: newStatus } : r)); setEditTarget(null) }} />
      )}
    </div>
  )
}
