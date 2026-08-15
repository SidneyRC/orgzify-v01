// GOES IN: components/admin/OREV1-082-HelpDeskPage.tsx
'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { useTheme } from '@/lib/ThemeContext'
import OREV1080RaiseTicketModal from '@/components/admin/OREV1-080-RaiseTicketModal'
import OREV1083HelpDeskTicketList, { TicketRow } from '@/components/admin/OREV1-083-HelpDeskTicketList'
import OREV1084TicketDetailModal from '@/components/admin/OREV1-084-TicketDetailModal'
import OREV1088TicketViewModal from '@/components/admin/OREV1-088-TicketViewModal'

type Props = { canCreate?: boolean; canEdit?: boolean; canViewAuditTrail?: boolean; canOverwriteEdit?: boolean }

export default function OREV1082HelpDeskPage({ canCreate = true, canEdit = true, canViewAuditTrail = true, canOverwriteEdit = true }: Props) {
  const router = useRouter()
  const { theme } = useTheme()
  const radius = theme?.global_border_radius || '12px'
  const primaryBtn = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }
  const outlineBtn = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }
  const fieldStyle = "h-10 px-3 text-sm border border-gray-200 rounded-xl w-full"

  const [rows, setRows] = useState<TicketRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [search, setSearch] = useState('')
  const [refType, setRefType] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [subCategoryId, setSubCategoryId] = useState('')
  const [status, setStatus] = useState('')
  const [countryId, setCountryId] = useState('')
  const [officeSearch, setOfficeSearch] = useState('')
  const [showRaise, setShowRaise] = useState(false)
  const [viewTarget, setViewTarget] = useState<TicketRow | null>(null)
  const [editTarget, setEditTarget] = useState<TicketRow | null>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [subCategories, setSubCategories] = useState<any[]>([])
  const [statuses, setStatuses] = useState<any[]>([])
  const [countries, setCountries] = useState<any[]>([])
  const totalPages = Math.max(1, Math.ceil(total / limit))

  useEffect(() => {
    fetch('/admin/ecosystem/helpdesk/api/categories').then(r => r.json()).then(j => { setCategories(j.categories || []); setSubCategories(j.subCategories || []) })
    fetch('/admin/ecosystem/helpdesk/api/statuses').then(r => r.json()).then(j => setStatuses(j.data || []))
    fetch('/admin/ecosystem/helpdesk/api/countries').then(r => r.json()).then(j => setCountries(j.data || []))
  }, [])

  const filteredSubs = categoryId ? subCategories.filter((s: any) => s.parent_id === categoryId) : []

  const runSearch = async (p = 1, l = limit) => {
    setLoading(true); setSearched(true); setPage(p); setLimit(l)
    const params = new URLSearchParams({ page: String(p), limit: String(l) })
    if (search) params.set('search', search)
    if (refType) params.set('reference_type', refType)
    if (categoryId) params.set('category_id', categoryId)
    if (subCategoryId) params.set('sub_category_id', subCategoryId)
    if (status) params.set('status_code', status)
    if (countryId) params.set('country_id', countryId)
    if (officeSearch) params.set('reporting_office_search', officeSearch)
    const res = await fetch(`/admin/ecosystem/helpdesk/api?${params}`)
    const json = await res.json()
    console.log('HELPDESK DEBUG', json)
    setRows(json.data || []); setTotal(json.total || 0); setLoading(false)
  }

  const handleReset = () => {
    setSearch(''); setRefType(''); setCategoryId(''); setSubCategoryId(''); setStatus(''); setCountryId(''); setOfficeSearch('')
    setRows([]); setTotal(0); setSearched(false); setPage(1)
  }

  const handleDownload = () => {
    const csv = ['Ticket Number,Type,Name,Category,Sub-category,Reporting Office,Country,Status,Follow-up,Created',
      ...rows.map(r => `${r.ticket_number},${r.reference_type},${r.entity_company_name || ''},${r.category_name},${r.sub_category_name},${r.reporting_office_name},${r.country_name},${r.status_code},${r.next_followup_date || ''},${r.created_at}`)
    ].join('\n')
    const ts = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = `helpdesk_tickets_${ts}.csv`; a.click()
  }

  const handleReopen = async (r: TicketRow) => {
    if (!confirm(`Reopen ticket ${r.ticket_number}?`)) return
    const res = await fetch('/admin/ecosystem/helpdesk/api', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticket_id: r.id, action: 'change_status', new_status: 'reopened' })
    })
    if (!res.ok) { const j = await res.json(); toast.error(j.error || 'Failed to reopen'); return }
    toast.success('Ticket reopened'); runSearch(page, limit)
  }

  return (
    <div className="p-4 md:p-6" style={{ backgroundColor: theme?.page_bg || '#f9fafb', minHeight: '100vh' }}>
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <h1 className="text-2xl font-semibold" style={{ color: theme?.color_text_primary || '#111827' }}>Help Desk</h1>
        <div className="grid grid-cols-3 md:flex gap-2 w-full md:w-auto">
          <button onClick={handleDownload} style={outlineBtn} className="text-xs md:text-sm font-medium px-2 md:px-4 py-2 whitespace-nowrap">↓ Download</button>
          <button onClick={() => router.push('/admin/ecosystem')} style={outlineBtn} className="text-xs md:text-sm font-medium px-2 md:px-4 py-2 whitespace-nowrap">← Back</button>
          {canCreate && <button onClick={() => setShowRaise(true)} style={primaryBtn} className="text-xs md:text-sm font-medium px-2 md:px-4 py-2 whitespace-nowrap">＋ Raise Ticket</button>}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-3">
        <select value={refType} onChange={e => setRefType(e.target.value)} className={fieldStyle}>
          <option value="">All Types</option>
          <option value="entity">Entity</option><option value="staff">Staff</option><option value="customer">Customer</option>
        </select>
        <select value={categoryId} onChange={e => { setCategoryId(e.target.value); setSubCategoryId('') }} className={fieldStyle}>
          <option value="">All Categories</option>
          {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={subCategoryId} onChange={e => setSubCategoryId(e.target.value)} disabled={!categoryId} className={`${fieldStyle} disabled:opacity-50`}>
          <option value="">All Sub-categories</option>
          {filteredSubs.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)} className={fieldStyle}>
          <option value="">All Status</option>
          {statuses.map((s: any) => <option key={s.code} value={s.code}>{s.label}</option>)}
        </select>
        <select value={countryId} onChange={e => setCountryId(e.target.value)} className={fieldStyle}>
          <option value="">All Countries</option>
          {countries.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input value={officeSearch} onChange={e => setOfficeSearch(e.target.value)} placeholder="Search Reporting Office…" className={fieldStyle} />
      </div>

      <div className="flex flex-col md:flex-row gap-2 mb-5">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search ticket number…" className={`${fieldStyle} md:flex-1`} />
        <div className="grid grid-cols-2 md:flex gap-2">
          <button onClick={handleReset} className="h-10 px-4 text-sm border border-gray-200 rounded-xl whitespace-nowrap">Reset</button>
          <button onClick={() => runSearch(1)} style={primaryBtn} className="h-10 px-4 text-sm whitespace-nowrap">Search</button>
        </div>
      </div>

      {!searched && <p className="text-center text-sm text-gray-400 py-16">Use the filters above and click Search to view tickets.</p>}
      {searched && (
        <OREV1083HelpDeskTicketList rows={rows} loading={loading} page={page} totalPages={totalPages} total={total} limit={limit}
          onPageChange={p => runSearch(p, limit)} onLimitChange={l => runSearch(1, l)} onView={setViewTarget} onEdit={setEditTarget} onReopen={handleReopen} />
      )}

      {showRaise && <OREV1080RaiseTicketModal onClose={() => setShowRaise(false)} onCreated={(t) => { setShowRaise(false); setViewTarget(t) }} />}
      {viewTarget && (
        <OREV1088TicketViewModal ticketId={viewTarget.id} canViewAuditTrail={canViewAuditTrail} canEdit={canEdit} canOverwriteEdit={canOverwriteEdit}
          onClose={() => setViewTarget(null)} onEdit={() => { setEditTarget(viewTarget); setViewTarget(null) }}
          onReopen={() => { setViewTarget(null); handleReopen(viewTarget) }} />
      )}
      {editTarget && (
        <OREV1084TicketDetailModal ticketId={editTarget.id} canViewAuditTrail={canViewAuditTrail} canOverwriteEdit={canOverwriteEdit}
          onClose={() => setEditTarget(null)} onSaved={(id) => { setEditTarget(null); setViewTarget({ id } as TicketRow); runSearch(page, limit) }} />
      )}
    </div>
  )
}
