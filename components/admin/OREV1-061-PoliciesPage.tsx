'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/lib/ThemeContext'
import toast from 'react-hot-toast'

type PolicyRow = {
  id: string; internal_name: string; display_name: string; policy_type: string
  modules: string[]; country_id: string | null; scope: string; document_url: string | null
  status: string; country_master: { id: string; name: string } | null
}

const POLICY_TYPES = ['Terms & Conditions', 'Privacy Policy', 'Refund Policy']
const MODULES = ['Site', 'EntityRegistration', 'Events', 'Academy']

const STATUS_LABELS: Record<string, string> = { active: 'Active', inactive: 'Inactive', archived: 'Archived' }
const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700', inactive: 'bg-gray-100 text-gray-500', archived: 'bg-red-100 text-red-600'
}

const IconEdit = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
const IconDelete = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
const IconView = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
const IconRestore = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>

type Props = { canDelete?: boolean }

export default function OREV1061PoliciesPage({ canDelete = true }: Props) {
  const router = useRouter()
  const { theme } = useTheme()
  const [rows, setRows] = useState<PolicyRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [moduleFilter, setModuleFilter] = useState('')
  const [countryFilter, setCountryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [countries, setCountries] = useState<{ id: string; name: string }[]>([])
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)

  const radius = theme?.global_border_radius || '12px'
  const primaryBtn = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }
  const outlineBtn = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }
  const selectClass = "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white"

  useEffect(() => {
    fetch('/admin/setup/policies/api?type=all_countries').then(r => r.json()).then(j => setCountries(j.data || []))
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (search) params.set('search', search)
    if (typeFilter) params.set('policy_type', typeFilter)
    if (moduleFilter) params.set('module', moduleFilter)
    if (countryFilter) params.set('country', countryFilter)
    if (statusFilter) params.set('status', statusFilter)
    const res = await fetch(`/admin/setup/policies/api?${params}`)
    const json = await res.json()
    if (json.error) { toast.error('Failed to load policies'); setLoading(false); return }
    setRows(json.data || []); setTotal(json.total || 0); setLoading(false)
  }, [page, limit, search, typeFilter, moduleFilter, countryFilter, statusFilter])

  useEffect(() => { fetchData() }, [page, limit, search, typeFilter, moduleFilter, countryFilter, statusFilter])

  const handleSearch = () => { setSearch(searchInput); setPage(1) }
  const handleReset = () => {
    setTypeFilter(''); setModuleFilter(''); setCountryFilter(''); setStatusFilter('')
    setSearchInput(''); setSearch(''); setPage(1)
  }

  const handleArchive = async (r: PolicyRow) => {
    if (!confirm(`Delete "${r.display_name}"? This will move it to Archive.`)) return
    const res = await fetch('/admin/setup/policies/api', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: r.id, action: 'archive' })
    })
    const json = await res.json()
    if (!res.ok) { toast.error(json.error || 'Delete failed'); return }
    toast.success('Policy archived'); fetchData()
  }

  const handleRestore = async (r: PolicyRow) => {
    const res = await fetch('/admin/setup/policies/api', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: r.id, action: 'restore' })
    })
    const json = await res.json()
    if (!res.ok) { toast.error(json.error || 'Restore failed'); return }
    toast.success('Policy restored'); fetchData()
  }

  const totalPages = Math.ceil(total / limit) || 1
  const editLink = (r: PolicyRow) => `/admin/setup/policies/new?id=${r.id}`
  const viewLink = (r: PolicyRow) => `/admin/setup/policies/new?id=${r.id}&mode=view`

  const ActionIcons = ({ r }: { r: PolicyRow }) => (
    <div className="flex gap-3 items-center">
      <button onClick={() => router.push(viewLink(r))} title="View" className="text-gray-400 hover:text-gray-700 transition p-1 rounded-lg hover:bg-gray-100"><IconView /></button>
      {r.status !== 'archived' && (
        <button onClick={() => router.push(editLink(r))} title="Edit" className="text-blue-400 hover:text-blue-700 transition p-1 rounded-lg hover:bg-blue-50"><IconEdit /></button>
      )}
      {r.status === 'archived' && canDelete && (
        <button onClick={() => handleRestore(r)} title="Restore" className="text-green-400 hover:text-green-700 transition p-1 rounded-lg hover:bg-green-50"><IconRestore /></button>
      )}
      {r.status !== 'archived' && canDelete && r.scope === 'unlisted' && r.status === 'inactive' && (
        <button onClick={() => handleArchive(r)} title="Delete" className="text-red-400 hover:text-red-700 transition p-1 rounded-lg hover:bg-red-50"><IconDelete /></button>
      )}
    </div>
  )

  return (
    <div className="p-4 md:p-6" style={{ backgroundColor: theme?.page_bg || '#f9fafb', minHeight: '100vh' }}>
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <h1 className="text-2xl font-semibold" style={{ color: theme?.color_text_primary || '#111827' }}>Policies</h1>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => router.push('/admin/setup')} style={outlineBtn} className="text-sm font-medium px-4 py-2 hover:opacity-90">← Back</button>
          <button onClick={() => router.push('/admin/setup/policies/new')} style={primaryBtn} className="text-sm font-medium px-4 py-2 hover:opacity-90">+ New Policy</button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1) }} className={selectClass}>
          <option value="">All Types</option>
          {POLICY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={moduleFilter} onChange={e => { setModuleFilter(e.target.value); setPage(1) }} className={selectClass}>
          <option value="">All Modules</option>
          {MODULES.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={countryFilter} onChange={e => { setCountryFilter(e.target.value); setPage(1) }} className={selectClass}>
          <option value="">All Countries</option>
          {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }} className={selectClass}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          {canDelete && <option value="archived">Archive</option>}
        </select>
      </div>

      <div className="flex gap-2 mb-5 items-center">
        <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSearch() }}
          placeholder="Search by internal or display name…"
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-400" />
        <button onClick={handleReset} style={outlineBtn} className="text-sm font-medium px-4 py-2 hover:opacity-90">Reset</button>
        <button onClick={handleSearch} style={primaryBtn} className="text-sm font-medium px-4 py-2 hover:opacity-90">Search</button>
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4 flex-wrap">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
          className="bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-xl hover:bg-gray-50 disabled:opacity-40">‹ Prev</button>
        <span>Page {page} of {totalPages}</span>
        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
          className="bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-xl hover:bg-gray-50 disabled:opacity-40">Next ›</button>
        <span className="text-gray-400">{total} total</span>
      </div>

      <div className="hidden md:block bg-white rounded-2xl border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead style={{ backgroundColor: theme?.table_header_bg || '#f9fafb' }}>
            <tr>
              {['Internal Name', 'Display Name', 'Type', 'Modules', 'Country', 'Status', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: theme?.table_header_text || '#6b7280' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7} className="text-center py-12 text-sm text-gray-400">Loading…</td></tr>}
            {!loading && rows.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-sm text-gray-400">No policies found.</td></tr>}
            {!loading && rows.map(r => (
              <tr key={r.id} className="border-t border-gray-50 hover:bg-gray-50 transition">
                <td className="px-4 py-3 text-gray-400 text-xs font-mono">{r.internal_name}</td>
                <td className="px-4 py-3 font-medium" style={{ color: theme?.color_text_primary || '#111827' }}>{r.display_name}</td>
                <td className="px-4 py-3 text-gray-500">{r.policy_type}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{(r.modules || []).join(', ')}</td>
                <td className="px-4 py-3 text-gray-400">{r.scope === 'unlisted' ? 'Not Listed' : r.country_master?.name || 'Global'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[r.status]}`}>{STATUS_LABELS[r.status]}</span>
                </td>
                <td className="px-4 py-3"><ActionIcons r={r} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden flex flex-col gap-3">
        {loading && <p className="text-center py-12 text-sm text-gray-400">Loading…</p>}
        {!loading && rows.length === 0 && <p className="text-center py-12 text-sm text-gray-400">No policies found.</p>}
        {!loading && rows.map(r => (
          <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col gap-3 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate" style={{ color: theme?.color_text_primary || '#111827' }}>{r.display_name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{r.internal_name}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${STATUS_COLORS[r.status]}`}>{STATUS_LABELS[r.status]}</span>
            </div>
            <div className="rounded-xl bg-gray-50 px-3 py-1">
              <div className="flex justify-between py-1.5 text-xs"><span className="text-gray-400">Type</span><span className="text-gray-700 font-medium">{r.policy_type}</span></div>
              <div className="flex justify-between py-1.5 text-xs"><span className="text-gray-400">Modules</span><span className="text-gray-700 font-medium">{(r.modules || []).join(', ')}</span></div>
              <div className="flex justify-between py-1.5 text-xs"><span className="text-gray-400">Country</span><span className="text-gray-700 font-medium">{r.scope === 'unlisted' ? 'Not Listed' : r.country_master?.name || 'Global'}</span></div>
            </div>
            <div className="flex items-center justify-end pt-1"><ActionIcons r={r} /></div>
          </div>
        ))}
      </div>
    </div>
  )
}