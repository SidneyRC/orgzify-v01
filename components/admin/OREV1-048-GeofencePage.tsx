'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/lib/ThemeContext'
import toast from 'react-hot-toast'

type CompanyRow = {
  id: string; legal_name: string; display_name: string
  company_type: string; branch_type: string; company_status: string
  parent: { display_name: string } | null
  process_id: string | null; company_code?: string; is_assigned: boolean
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-2 py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400 shrink-0 w-28">{label}</span>
      <span className="text-xs text-gray-700 font-medium text-right">{value || '—'}</span>
    </div>
  )
}

const IconMap = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>

type Props = { isSuperAdmin?: boolean; canEdit?: boolean; canDownload?: boolean; canViewArchived?: boolean; ownCompanyId?: string | null; backLink?: string }

export default function OREV1048GeofencePage({ isSuperAdmin = true, canEdit = true, canDownload = true, canViewArchived = true, ownCompanyId = null, backLink = '/admin/setup' }: Props) {
  const router = useRouter()
  const { theme } = useTheme()
  const [rows, setRows] = useState<CompanyRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(!isSuperAdmin)
  const [searchInput, setSearchInput] = useState('')
  const [countryFilter, setCountryFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [branchFilter, setBranchFilter] = useState('')
  const [parentFilter, setParentFilter] = useState('')
  const [assignedStatus, setAssignedStatus] = useState('')
  const [companyStatusFilter, setCompanyStatusFilter] = useState('active')
  const [countries, setCountries] = useState<{ id: string; name: string }[]>([])
  const [allCompanies, setAllCompanies] = useState<{ id: string; display_name: string }[]>([])
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [downloadMode, setDownloadMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const radius = theme?.global_border_radius || '12px'
  const primaryBtn = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }
  const outlineBtn = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }
  const selectClass = "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white"
  const totalPages = Math.max(1, Math.ceil(total / limit))

  const loadDropdowns = useCallback(() => {
    if (countries.length) return
    fetch('/admin/setup/geofence/api?type=all_countries').then(r => r.json()).then(j => setCountries(j.data || []))
    fetch('/admin/setup/geofence/api?type=active_companies').then(r => r.json()).then(j => setAllCompanies(j.data || []))
  }, [countries.length])

  useState(() => { loadDropdowns() })

  const fetchData = useCallback(async (p = page) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(p), limit: String(limit) })
    if (searchInput) params.set('search', searchInput)
    if (countryFilter) params.set('country', countryFilter)
    if (typeFilter) params.set('company_type', typeFilter)
    if (branchFilter) params.set('branch_type', branchFilter)
    if (parentFilter) params.set('parent_id', parentFilter)
    if (assignedStatus) params.set('assigned_status', assignedStatus)
    params.set('company_status', companyStatusFilter)
    const res = await fetch(`/admin/setup/geofence/api?${params}`)
    const json = await res.json()
    if (json.error) { toast.error('Failed to load companies'); setLoading(false); return }
    setRows(json.data || []); setTotal(json.total || 0); setLoading(false)
  }, [page, limit, searchInput, countryFilter, typeFilter, branchFilter, parentFilter, assignedStatus, companyStatusFilter])

  const handleSearch = () => { setHasSearched(true); setPage(1); fetchData(1) }
  const handleReset = () => {
    setSearchInput(''); setCountryFilter(''); setTypeFilter(''); setBranchFilter(''); setParentFilter(''); setAssignedStatus(''); setPage(1)
    if (isSuperAdmin) { setRows([]); setTotal(0); setHasSearched(false) }
    else fetchData(1)
  }
  const goToPage = (p: number) => { setPage(p); fetchData(p) }

  const toggleDownloadMode = () => { setDownloadMode(d => !d); setSelectedIds([]) }
  const toggleSelect = (id: string) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const handleBulkDownload = () => {
    if (!selectedIds.length) return toast.error('Select at least one company')
    window.open(`/admin/setup/geofence/api?type=download&company_ids=${selectedIds.join(',')}`, '_blank')
    setDownloadMode(false); setSelectedIds([])
  }

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Geofence</h1>
          <p className="text-xs text-gray-400 mt-0.5">Assign territory coverage to branches</p>
        </div>
<div className="grid grid-cols-2 md:flex gap-2 md:gap-2 w-full md:w-auto" style={downloadMode && selectedIds.length > 0 ? { gridTemplateColumns: 'repeat(3, 1fr)' } : {}}>
          {canDownload && (
            <button onClick={toggleDownloadMode} style={outlineBtn} className="text-sm font-medium px-4 py-2 hover:opacity-90 whitespace-nowrap">
              {downloadMode ? 'Cancel' : 'Download'}
            </button>
          )}
          <button onClick={() => router.push(backLink)} style={outlineBtn} className="text-sm font-medium px-4 py-2 hover:opacity-90 whitespace-nowrap">← Back</button>
          {downloadMode && selectedIds.length > 0 && (
            <button onClick={handleBulkDownload} style={primaryBtn} className="text-sm font-medium px-4 py-2 hover:opacity-90 whitespace-nowrap">Download Now ({selectedIds.length})</button>
          )}
        </div>
      </div>

      {/* Filters — apply only on Search click */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-3">
        <select value={countryFilter} onChange={e => setCountryFilter(e.target.value)} className={selectClass}>
          <option value="">All Countries</option>
          {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className={selectClass}>
          <option value="">All Types</option>
          <option value="Owned">Owned</option>
          <option value="Franchise">Franchise</option>
        </select>
        <select value={branchFilter} onChange={e => setBranchFilter(e.target.value)} className={selectClass}>
          <option value="">All Branch Types</option>
          {['Registered Office', 'Country Office', 'Regional Office', 'Branch', 'Franchise Office'].map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <select value={parentFilter} onChange={e => setParentFilter(e.target.value)} className={selectClass}>
          <option value="">All Parents</option>
          {allCompanies.map(c => <option key={c.id} value={c.id}>{c.display_name}</option>)}
        </select>
        <select value={assignedStatus} onChange={e => setAssignedStatus(e.target.value)} className={selectClass}>
          <option value="">All — Assigned Status</option>
          <option value="yes">Assigned</option>
          <option value="no">Not Assigned</option>
        </select>
        {canViewArchived && (
          <select value={companyStatusFilter} onChange={e => setCompanyStatusFilter(e.target.value)} className={selectClass}>
            <option value="active">Active Companies</option>
            <option value="archived">Archived Companies</option>
            <option value="all">All Statuses</option>
          </select>
        )}
      </div>

      {/* Search */}
      <div className="flex gap-2 mb-5 items-center">
        <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSearch() }}
          placeholder="Search by name or code…"
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-400 min-w-0" />
        <button onClick={handleReset} style={outlineBtn} className="text-sm font-medium px-4 py-2 hover:opacity-90 shrink-0">Reset</button>
        <button onClick={handleSearch} style={primaryBtn} className="text-sm font-medium px-4 py-2 hover:opacity-90 shrink-0">Search</button>
      </div>

      {!hasSearched && (
        <div className="text-center py-16 text-sm text-gray-400 bg-white rounded-2xl border border-gray-100">
          Use the filters and search above to find companies.
        </div>
      )}

      {hasSearched && (
        <>
          {/* Pagination */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4 flex-wrap">
            <button onClick={() => goToPage(Math.max(1, page - 1))} disabled={page === 1} className="bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-xl hover:bg-gray-50 disabled:opacity-40">‹ Prev</button>
            <input type="number" min={1} max={totalPages} value={page} onChange={e => goToPage(Math.min(totalPages, Math.max(1, Number(e.target.value))))} className="w-12 text-center border border-gray-200 rounded-xl px-2 py-1.5 text-sm focus:outline-none" />
            <span>of {totalPages}</span>
            <button onClick={() => goToPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-xl hover:bg-gray-50 disabled:opacity-40">Next ›</button>
            <span className="text-gray-300">|</span>
            <input type="number" min={1} value={limit} onChange={e => { setLimit(Number(e.target.value)); goToPage(1) }} className="w-14 text-center border border-gray-200 rounded-xl px-2 py-1.5 text-sm focus:outline-none" />
            <span className="text-gray-400">{total} total</span>
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-2xl border border-gray-100 overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ backgroundColor: theme?.table_header_bg || '#f9fafb' }}>
                <tr>
                  {downloadMode && <th className="px-4 py-3 w-8"></th>}
                  {['Company Name', 'Legal Name', 'Code', 'Type', 'Branch', 'Parent', 'Coverage', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: theme?.table_header_text || '#6b7280' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={9} className="text-center py-12 text-sm text-gray-400">Loading…</td></tr>}
                {!loading && rows.length === 0 && <tr><td colSpan={9} className="text-center py-12 text-sm text-gray-400">No companies found.</td></tr>}
                {!loading && rows.map(r => (
                  <tr key={r.id} className="border-t border-gray-50 hover:bg-gray-50 transition">
                    {downloadMode && (
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={selectedIds.includes(r.id)} onChange={() => toggleSelect(r.id)} className="accent-blue-600" />
                      </td>
                    )}
                    <td className="px-4 py-3 font-medium text-gray-800">
                      <div className="flex items-center gap-1.5">
                        {r.display_name}
                        {r.company_status === 'archived' && <span className="text-xs px-1.5 py-0.5 rounded-full font-medium bg-gray-100 text-gray-500">Archived</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{r.legal_name}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{r.company_code || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 capitalize">{r.company_type}</td>
                    <td className="px-4 py-3 text-gray-500">{r.branch_type}</td>
                    <td className="px-4 py-3 text-gray-400">{r.parent?.display_name || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${r.is_assigned ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                        {r.is_assigned ? 'Assigned' : 'Not assigned'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {canEdit && r.id !== ownCompanyId && r.company_status !== 'archived' && (
                        <button onClick={() => router.push(`/admin/setup/geofence/assign?company_id=${r.id}&name=${encodeURIComponent(r.display_name)}`)} className="text-blue-600 hover:text-blue-800 transition" title="Assign territory"><IconMap /></button>
                      )}
                    </td>
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
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    {downloadMode && <input type="checkbox" checked={selectedIds.includes(r.id)} onChange={() => toggleSelect(r.id)} className="accent-blue-600 mt-1" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-sm text-gray-800">{r.display_name}</p>
                        {r.company_status === 'archived' && <span className="text-xs px-1.5 py-0.5 rounded-full font-medium bg-gray-100 text-gray-500 shrink-0">Archived</span>}
                      </div>
                      {r.process_id && <p className="text-xs text-gray-400 font-mono mt-0.5">{r.process_id}</p>}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${r.is_assigned ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                    {r.is_assigned ? 'Assigned' : 'Not assigned'}
                  </span>
                </div>
                <div className="rounded-xl bg-gray-50 px-3 py-1">
                  <InfoRow label="Legal Name" value={r.legal_name} />
                  <InfoRow label="Code" value={r.company_code || '—'} />
                  <InfoRow label="Type" value={r.company_type} />
                  <InfoRow label="Branch Type" value={r.branch_type} />
                  {r.parent && <InfoRow label="Parent" value={r.parent.display_name} />}
                </div>
                {canEdit && r.id !== ownCompanyId && r.company_status !== 'archived' && (
                  <div className="flex items-center justify-end pt-1">
                    <button onClick={() => router.push(`/admin/setup/geofence/assign?company_id=${r.id}&name=${encodeURIComponent(r.display_name)}`)} style={primaryBtn} className="text-xs font-medium px-3 py-1.5 hover:opacity-90">Assign Territory</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
