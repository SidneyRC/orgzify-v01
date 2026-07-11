'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/lib/ThemeContext'
import toast from 'react-hot-toast'

type CompanyRow = {
  id: string; legal_name: string; display_name: string; slug: string
  company_type: string; branch_type: string; company_status: string
  country: string; parent: { display_name: string } | null
  process_id: string | null; company_code?: string
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
  draft: 'Draft', pending: 'Pending', active: 'Active', inactive: 'Inactive', rejected: 'Rejected'
}
const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-500',
  pending: 'bg-yellow-100 text-yellow-700',
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-red-100 text-red-600',
  rejected: 'bg-red-200 text-red-800'
}

// SVG Icons
const IconEdit = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
const IconDelete = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
const IconAccept = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
const IconReject = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
const IconPause = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
const IconPlay = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
const IconView = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
const IconAccess = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>

// TODO: replace with real roles_rights table check once Roles & Rights module is built
const canImpersonate = (_companyId: string) => true // Super Admin only, for now

type Props = { ownCompanyId?: string | null; backLink?: string; canCreate?: boolean; canEdit?: boolean; canDelete?: boolean; canDownload?: boolean }

export default function OREV1047CompaniesPage({ ownCompanyId = null, backLink = '/admin/setup', canCreate = true, canEdit = true, canDelete = true, canDownload = true }: Props) {
  const router = useRouter()
  const { theme } = useTheme()
  const [rows, setRows] = useState<CompanyRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [countryFilter, setCountryFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [branchFilter, setBranchFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [countries, setCountries] = useState<{ id: string; name: string }[]>([])
  const [allCompanies, setAllCompanies] = useState<{ id: string; display_name: string }[]>([])
  const [parentFilter, setParentFilter] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)

  const radius = theme?.global_border_radius || '12px'
  const primaryBtn = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }
  const outlineBtn = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }
  const selectClass = "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white"

  useEffect(() => {
    fetch('/admin/setup/companies/api?type=all_countries').then(r => r.json()).then(j => setCountries(j.data || []))
    fetch('/admin/setup/companies/api?type=active_companies').then(r => r.json()).then(j => setAllCompanies(j.data || []))
    loadDrafts()
  }, [])

  const loadDrafts = async () => {
    setLoading(true)
    const draftParams = new URLSearchParams({ status: 'draft', page: '1', limit: '20' })
    const res = await fetch(`/admin/setup/companies/api?${draftParams}`)
    const json = await res.json()
    if (!json.error) { setRows(json.data || []); setTotal(json.total || 0) }
    setLoading(false)
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (search) params.set('search', search)
    if (countryFilter) params.set('country', countryFilter)
    if (typeFilter) params.set('company_type', typeFilter)
    if (branchFilter) params.set('branch_type', branchFilter)
    if (parentFilter) params.set('parent_id', parentFilter)
    if (statusFilter) params.set('status', statusFilter)
    const res = await fetch(`/admin/setup/companies/api?${params}`)
    const json = await res.json()
    if (json.error) { toast.error('Failed to load companies'); setLoading(false); return }
    setRows(json.data || []); setTotal(json.total || 0); setLoading(false)
  }, [page, limit, search, countryFilter, typeFilter, branchFilter, statusFilter])

  useEffect(() => { if (searched) fetchData() }, [page, limit])

  const handleSearch = async () => {
    setSearch(searchInput); setPage(1); setSearched(true); setLoading(true)
    const params = new URLSearchParams({ page: '1', limit: String(limit) })
    if (searchInput) params.set('search', searchInput)
    if (countryFilter) params.set('country', countryFilter)
    if (typeFilter) params.set('company_type', typeFilter)
    if (branchFilter) params.set('branch_type', branchFilter)
    if (parentFilter) params.set('parent_id', parentFilter)
    if (statusFilter) params.set('status', statusFilter)
    const res = await fetch(`/admin/setup/companies/api?${params}`)
    const json = await res.json()
    if (json.error) { toast.error('Failed to load companies'); setLoading(false); return }
    setRows(json.data || []); setTotal(json.total || 0); setLoading(false)
  }

  const handleReset = () => {
    setCountryFilter(''); setTypeFilter(''); setBranchFilter(''); setParentFilter('')
    setStatusFilter(''); setSearchInput(''); setSearch(''); setSearched(false)
    setRows([]); setTotal(0); loadDrafts()
  }

  const handleDelete = async (r: CompanyRow) => {
    if (!confirm(`Delete "${r.display_name}"? This cannot be undone.`)) return
    const res = await fetch('/admin/setup/companies/api', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: r.id })
    })
    if (!res.ok) { toast.error('Delete failed'); return }
    toast.success('Company deleted')
    setRows(prev => prev.filter(c => c.id !== r.id))
  }

  const handleStatusChange = async (r: CompanyRow, next: string) => {
    const prev = r.company_status
    setRows(rows => rows.map(x => x.id === r.id ? { ...x, company_status: next } : x))
    const res = await fetch('/admin/setup/companies/api', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: r.id, company_status: next, previous_status: r.company_status })
    })
    if (!res.ok) {
      setRows(rows => rows.map(x => x.id === r.id ? { ...x, company_status: prev } : x))
      toast.error('Status update failed'); return
    }
    const messages: Record<string, string> = {
      active: 'Company activated — SPOC will be notified.',
      inactive: 'Company deactivated — SPOC notified.',
      rejected: 'Company application rejected.',
      pending: 'Company returned to pending review.'
    }
    toast.success(messages[next] || 'Status updated.')
  }

  const handleDownload = () => {
    const csv = ['Process ID,Company Name,Legal Name,Company Code,Type,Branch Type,Parent,Status',
      ...rows.map(r => `${r.process_id || ''},${r.display_name},${r.legal_name},${r.company_code || ''},${r.company_type},${r.branch_type},${r.parent?.display_name || ''},${r.company_status}`)
    ].join('\n')
    const ts = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = `companies_${ts}.csv`; a.click()
  }

  const totalPages = Math.ceil(total / limit) || 1

  const editLink = (r: CompanyRow) => `/admin/setup/companies/new?ref=${r.process_id}`
  const viewLink = (r: CompanyRow) => `/admin/setup/companies/new?ref=${r.process_id}&mode=view`
  const accessLink = (r: CompanyRow) => `/company/${r.slug}/dashboard`

  // Approval column — icon only with tooltip. Blocked entirely on your own company row.
  const ApprovalAction = ({ r }: { r: CompanyRow }) => {
    if (r.id === ownCompanyId) return <span className="text-gray-300 text-xs">—</span>
    if (!canEdit) return <span className="text-gray-300 text-xs">—</span>
    const s = r.company_status
    if (s === 'pending') return (
      <div className="flex gap-3 items-center">
        <button onClick={() => handleStatusChange(r, 'active')} title="Accept"
          className="text-green-500 hover:text-green-700 transition p-1 rounded-lg hover:bg-green-50">
          <IconAccept />
        </button>
        <button onClick={() => handleStatusChange(r, 'rejected')} title="Reject"
          className="text-red-500 hover:text-red-700 transition p-1 rounded-lg hover:bg-red-50">
          <IconReject />
        </button>
      </div>
    )
    if (s === 'active') return (
      <button onClick={() => handleStatusChange(r, 'inactive')} title="Deactivate"
        className="text-gray-400 hover:text-orange-500 transition p-1 rounded-lg hover:bg-orange-50">
        <IconPause />
      </button>
    )
    if (s === 'inactive') return (
      <button onClick={() => handleStatusChange(r, 'active')} title="Reactivate"
        className="text-gray-400 hover:text-green-500 transition p-1 rounded-lg hover:bg-green-50">
        <IconPlay />
      </button>
    )
    return <span className="text-gray-300 text-xs">—</span>
  }

  // Actions column — view + edit + access + delete icons
  const ActionIcons = ({ r }: { r: CompanyRow }) => {
    const isDraftOrPending = r.company_status === 'draft' || r.company_status === 'pending'
    const isOwn = r.id === ownCompanyId
    return (
      <div className="flex gap-3 items-center">
        {!isDraftOrPending && (
          <button onClick={() => router.push(viewLink(r))} title="View"
            className="text-gray-400 hover:text-gray-700 transition p-1 rounded-lg hover:bg-gray-100">
            <IconView />
          </button>
        )}
        {!isOwn && canEdit && (
          <button onClick={() => router.push(editLink(r))} title="Edit"
            className="text-blue-400 hover:text-blue-700 transition p-1 rounded-lg hover:bg-blue-50">
            <IconEdit />
          </button>
        )}
        {!isDraftOrPending && canImpersonate(r.id) && (
          <button onClick={() => router.push(accessLink(r))} title="Access (Login as)"
            className="text-purple-400 hover:text-purple-700 transition p-1 rounded-lg hover:bg-purple-50">
            <IconAccess />
          </button>
        )}
        {!isOwn && canDelete && (
          <button onClick={() => handleDelete(r)} title="Delete"
            className="text-red-400 hover:text-red-700 transition p-1 rounded-lg hover:bg-red-50">
            <IconDelete />
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6" style={{ backgroundColor: theme?.page_bg || '#f9fafb', minHeight: '100vh' }}>

      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: theme?.color_text_primary || '#111827' }}>Companies</h1>
          <p className="text-xs text-orange-500 mt-0.5">Incomplete drafts are permanently deleted after 15 days</p>
        </div>
        <div className="flex gap-2 shrink-0">
          {canDownload && (
            <button onClick={handleDownload} style={outlineBtn} className="text-sm font-medium px-4 py-2 hover:opacity-90 whitespace-nowrap">↓ Download</button>
          )}
          <button onClick={() => router.push(backLink)} style={outlineBtn} className="text-sm font-medium px-4 py-2 hover:opacity-90 whitespace-nowrap">← Back</button>
          {canCreate && (
            <button onClick={() => router.push('/admin/setup/companies/new')} style={primaryBtn} className="text-sm font-medium px-4 py-2 hover:opacity-90 whitespace-nowrap">+ New Company</button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-3">
        <select value={countryFilter} onChange={e => { setCountryFilter(e.target.value); setPage(1) }} className={selectClass}>
          <option value="">All Countries</option>
          {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1) }} className={selectClass}>
          <option value="">All Types</option>
          <option value="Owned">Owned</option>
          <option value="Franchise">Franchise</option>
        </select>
        <select value={branchFilter} onChange={e => { setBranchFilter(e.target.value); setPage(1) }} className={selectClass}>
          <option value="">All Branch Types</option>
          {['Registered Office','Country Office','Regional Office','Branch','Franchise Office'].map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <select value={parentFilter} onChange={e => { setParentFilter(e.target.value); setPage(1) }} className={selectClass}>
          <option value="">All Parents</option>
          {allCompanies.map(c => <option key={c.id} value={c.id}>{c.display_name}</option>)}
        </select>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }} className={selectClass}>
          <option value="">All Statuses</option>
          {['draft','pending','active','inactive','rejected'].map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
      </div>

      {/* Search */}
      <div className="flex gap-2 mb-5 items-center">
        <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSearch() }}
          placeholder="Search by name or slug…"
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-400" />
        <button onClick={handleReset} style={outlineBtn} className="text-sm font-medium px-4 py-2 transition hover:opacity-90">Reset</button>
        <button onClick={handleSearch} style={primaryBtn} className="text-sm font-medium px-4 py-2 transition hover:opacity-90">Search</button>
      </div>

      {/* Pagination */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4 flex-wrap">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
          className="bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-xl hover:bg-gray-50 disabled:opacity-40">‹ Prev</button>
        <input type="number" min={1} max={totalPages} value={page} onChange={e => setPage(Math.min(totalPages, Math.max(1, Number(e.target.value))))}
          className="w-12 text-center border border-gray-200 rounded-xl px-2 py-1.5 text-sm focus:outline-none" />
        <span>of {totalPages}</span>
        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
          className="bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-xl hover:bg-gray-50 disabled:opacity-40">Next ›</button>
        <span className="text-gray-300">|</span>
        <input type="number" min={1} value={limit} onChange={e => { setLimit(Number(e.target.value)); setPage(1) }}
          className="w-14 text-center border border-gray-200 rounded-xl px-2 py-1.5 text-sm focus:outline-none" />
        <span className="text-gray-400">{total} total</span>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-2xl border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead style={{ backgroundColor: theme?.table_header_bg || '#f9fafb' }}>
            <tr>
              {['Process ID','Company Name','Legal Name','Code','Type','Branch','Parent','Status','Approval','Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: theme?.table_header_text || '#6b7280' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={10} className="text-center py-12 text-sm text-gray-400">Loading…</td></tr>}
            {!loading && rows.length === 0 && <tr><td colSpan={10} className="text-center py-12 text-sm text-gray-400">No companies found.</td></tr>}
            {!loading && rows.map(r => (
              <tr key={r.id} className="border-t border-gray-50 hover:bg-gray-50 transition">
                <td className="px-4 py-3 text-gray-400 text-xs font-mono">{r.process_id || '—'}</td>
                <td className="px-4 py-3 font-medium" style={{ color: theme?.color_text_primary || '#111827' }}>{r.display_name}</td>
                <td className="px-4 py-3 text-gray-500">{r.legal_name}</td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{r.company_code || '—'}</td>
                <td className="px-4 py-3 text-gray-500 capitalize">{r.company_type}</td>
                <td className="px-4 py-3 text-gray-500">{r.branch_type}</td>
                <td className="px-4 py-3 text-gray-400">{r.parent?.display_name || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[r.company_status] || 'bg-gray-100 text-gray-500'}`}>
                    {STATUS_LABELS[r.company_status] || r.company_status}
                  </span>
                </td>
                <td className="px-4 py-3" onClick={e => e.stopPropagation()}><ApprovalAction r={r} /></td>
                <td className="px-4 py-3" onClick={e => e.stopPropagation()}><ActionIcons r={r} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden flex flex-col gap-3">
        {loading && <p className="text-center py-12 text-sm text-gray-400">Loading…</p>}
        {!loading && rows.length === 0 && <p className="text-center py-12 text-sm text-gray-400">No companies found.</p>}
        {!loading && rows.map(r => (
          <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col gap-3 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate" style={{ color: theme?.color_text_primary || '#111827' }}>{r.display_name}</p>
                {r.process_id && <p className="text-xs text-gray-400 font-mono mt-0.5">{r.process_id}</p>}
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${STATUS_COLORS[r.company_status] || 'bg-gray-100 text-gray-500'}`}>
                {STATUS_LABELS[r.company_status] || r.company_status}
              </span>
            </div>
            <div className="rounded-xl bg-gray-50 px-3 py-1">
              <InfoRow label="Legal Name" value={r.legal_name} />
              <InfoRow label="Code" value={r.company_code || '—'} />
              <InfoRow label="Type" value={r.company_type} />
              <InfoRow label="Branch Type" value={r.branch_type} />
              {r.parent && <InfoRow label="Parent" value={r.parent.display_name} />}
            </div>
            <div className="flex items-center justify-between pt-1" onClick={e => e.stopPropagation()}>
              <ApprovalAction r={r} />
              <ActionIcons r={r} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
