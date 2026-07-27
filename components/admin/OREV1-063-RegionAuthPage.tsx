'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/lib/ThemeContext'
import toast from 'react-hot-toast'
import OREV1059ConfirmModal from '@/components/admin/OREV1-059-ConfirmModal'
import OREV1064RegionAuthForm from '@/components/admin/OREV1-064-RegionAuthForm'
import OREV1065SearchSelect from '@/components/admin/OREV1-065-SearchSelect'
import OREV1066RegionAuthHistory from '@/components/admin/OREV1-066-RegionAuthHistory'

const API = '/admin/setup/company-auth/api'

const IconEdit = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
const IconDelete = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
const IconHistory = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
const IconDownload = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" /></svg>
const IconView = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>

export default function OREV1063RegionAuthPage() {
  const { theme } = useTheme()
  const router = useRouter()
  const radius = theme?.global_border_radius || '12px'
  const primaryBtn = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }
  const outlineBtn = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }

  const [rows, setRows] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [companyOptions, setCompanyOptions] = useState<any[]>([])
  const [moduleOptions, setModuleOptions] = useState<any[]>([])
  const [companyFilter, setCompanyFilter] = useState('')
  const [moduleFilter, setModuleFilter] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editRow, setEditRow] = useState<any>(null)
  const [deleteRow, setDeleteRow] = useState<any>(null)
  const [historyRow, setHistoryRow] = useState<any>(null)
  const [viewRow, setViewRow] = useState<any>(null)

  useEffect(() => {
    fetch(`${API}?type=company_options`).then(r => r.json()).then(j => setCompanyOptions(j.data || []))
    fetch(`${API}?type=module_options`).then(r => r.json()).then(j => setModuleOptions(j.data || []))
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (companyFilter) params.set('company_id', companyFilter)
    if (moduleFilter) params.set('module_code', moduleFilter)
    if (search) params.set('search', search)
    const res = await fetch(`${API}?${params}`)
    const json = await res.json()
    if (json.error) { toast.error('Failed to load'); setLoading(false); return }
    setRows(json.data || []); setTotal(json.total || 0); setLoading(false)
  }, [page, limit, companyFilter, moduleFilter, search])

  useEffect(() => { if (searched) fetchData() }, [page, limit])

  const handleSearch = async () => {
    setSearch(searchInput); setPage(1); setSearched(true); setLoading(true)
    const params = new URLSearchParams({ page: '1', limit: String(limit) })
    if (companyFilter) params.set('company_id', companyFilter)
    if (moduleFilter) params.set('module_code', moduleFilter)
    if (searchInput) params.set('search', searchInput)
    const res = await fetch(`${API}?${params}`)
    const json = await res.json()
    setRows(json.data || []); setTotal(json.total || 0); setLoading(false)
  }

  const handleReset = () => {
    setCompanyFilter(''); setModuleFilter(''); setSearchInput(''); setSearch('')
    setPage(1); setSearched(false); setRows([]); setTotal(0)
  }

  const handleDelete = async () => {
    const res = await fetch(API, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: deleteRow.id, company_id: deleteRow.company_id }) })
    const json = await res.json()
    if (json.error) { toast.error(json.error); setDeleteRow(null); return }
    toast.success('Assignment removed'); setDeleteRow(null); fetchData()
  }

  const handleDownload = async () => {
    const params = new URLSearchParams({ page: '1', limit: '1000' })
    if (companyFilter) params.set('company_id', companyFilter)
    if (moduleFilter) params.set('module_code', moduleFilter)
    if (search) params.set('search', search)
    const res = await fetch(`${API}?${params}`)
    const json = await res.json()
    const csvRows = (json.data || []).map((r: any) => [r.company_name, r.module_name, r.staff_name, r.staff_email, r.staff_mobile])
    const header = ['Company', 'Module', 'Staff Name', 'Email', 'Mobile']
    const csv = [header, ...csvRows].map(row => row.map((v: string) => `"${(v || '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'company-module-authorization.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const totalPages = Math.max(1, Math.ceil(total / limit))
  const companyOpts = companyOptions.map(c => ({ id: c.id, label: c.display_name }))
  const moduleOpts = moduleOptions.map(m => ({ id: m.code, label: m.display_name }))

  return (
    <div className="px-4 md:px-8 py-4 md:py-6" style={{ backgroundColor: theme?.page_bg || '#f9fafb', minHeight: '100vh' }}>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h1 className="text-xl font-semibold w-full sm:w-auto" style={{ color: theme?.color_text_primary || '#111827' }}>Company Module Authorization</h1>
        <div className="flex gap-2 items-center justify-end w-full sm:w-auto">
          <button onClick={handleDownload} style={outlineBtn} className="text-sm font-medium px-4 py-2 hover:opacity-90 transition flex items-center justify-center gap-1.5 h-10"><IconDownload />Download</button>
          <button onClick={() => router.push('/admin/setup')} style={outlineBtn} className="text-sm font-medium px-4 py-2 hover:opacity-90 transition flex items-center justify-center h-10">← Back</button>
          <button onClick={() => { setEditRow(null); setShowForm(true) }} style={primaryBtn} className="text-sm font-medium px-4 py-2 hover:opacity-90 transition flex items-center justify-center h-10">+ Add</button>
        </div>

      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <OREV1065SearchSelect options={companyOpts} value={companyFilter} onChange={setCompanyFilter} placeholder="All Companies" />
        <OREV1065SearchSelect options={moduleOpts} value={moduleFilter} onChange={setModuleFilter} placeholder="All Modules" />
      </div>

      <div className="flex gap-2 mb-5 items-center">
        <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSearch() }}
          placeholder="Search staff name, email or mobile…"
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-400" />
        <button onClick={handleReset} style={outlineBtn} className="text-sm font-medium px-4 py-2 transition hover:opacity-90">Reset</button>
        <button onClick={handleSearch} style={primaryBtn} className="text-sm font-medium px-4 py-2 transition hover:opacity-90">Search</button>
      </div>

      {searched && (
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
      )}

      {!searched ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-sm text-gray-400">Pick a filter or type a search term, then click Search to view assignments.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full hidden md:table">
            <thead style={{ backgroundColor: theme?.table_header_bg || '#f9fafb' }}>
              <tr>
                {['Company', 'Module', 'Staff Name', 'Email', 'Mobile', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: theme?.table_header_text || '#6b7280' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6} className="text-center py-12 text-sm text-gray-400">Loading…</td></tr>}
              {!loading && rows.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-sm text-gray-400">No assignments found</td></tr>}
              {!loading && rows.map(r => (
                <tr key={r.id} className="border-t border-gray-50 hover:bg-gray-50 transition text-sm">
                  <td className="px-4 py-3">{r.company_name}</td>
                  <td className="px-4 py-3">{r.module_name}</td>
                  <td className="px-4 py-3 font-medium" style={{ color: theme?.color_text_primary || '#111827' }}>{r.staff_name}</td>
                  <td className="px-4 py-3 text-gray-500">{r.staff_email}</td>
                  <td className="px-4 py-3 text-gray-500">{r.staff_mobile}</td>
<td className="px-4 py-3">
<div className="flex gap-3 items-center">
                      {r.can_edit ? (
                        <button title="Edit" onClick={() => { setEditRow(r); setShowForm(true) }} className="text-blue-500 hover:opacity-70"><IconEdit /></button>
                      ) : (
                        <button title="View" onClick={() => setViewRow(r)} className="text-gray-400 hover:opacity-70"><IconView /></button>
                      )}
                      <button title="History" onClick={() => setHistoryRow(r)} className="text-gray-500 hover:opacity-70"><IconHistory /></button>
                      {r.can_edit && <button title="Delete" onClick={() => setDeleteRow(r)} className="text-red-500 hover:opacity-70"><IconDelete /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="md:hidden flex flex-col gap-3 p-4">
            {loading && <p className="text-center py-12 text-sm text-gray-400">Loading…</p>}
            {!loading && rows.length === 0 && <p className="text-center py-12 text-sm text-gray-400">No assignments found</p>}
            {!loading && rows.map(r => (
              <div key={r.id} className="border border-gray-100 rounded-xl p-3 flex flex-col gap-1">
                <div className="flex justify-between text-sm"><span className="text-gray-400">Company</span><span>{r.company_name}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-400">Module</span><span>{r.module_name}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-400">Staff</span><span>{r.staff_name}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-400">Email</span><span>{r.staff_email}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-400">Mobile</span><span>{r.staff_mobile}</span></div>
<div className="flex justify-end gap-3 pt-2">
                  {r.can_edit ? (
                    <button title="Edit" onClick={() => { setEditRow(r); setShowForm(true) }} className="text-blue-500"><IconEdit /></button>
                  ) : (
                    <button title="View" onClick={() => setViewRow(r)} className="text-gray-400"><IconView /></button>
                  )}
                  <button title="History" onClick={() => setHistoryRow(r)} className="text-gray-500"><IconHistory /></button>
                  {r.can_edit && <button title="Delete" onClick={() => setDeleteRow(r)} className="text-red-500"><IconDelete /></button>}
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

{showForm && (
        <OREV1064RegionAuthForm
          editRow={editRow} companyOptions={companyOptions} moduleOptions={moduleOptions}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); if (searched) fetchData() }}
        />
      )}

      {viewRow && (
        <OREV1064RegionAuthForm
          editRow={viewRow} companyOptions={companyOptions} moduleOptions={moduleOptions}
          readOnly
          onClose={() => setViewRow(null)}
          onSaved={() => setViewRow(null)}
        />
      )}

      {historyRow && (
        <OREV1066RegionAuthHistory
          companyId={historyRow.company_id} moduleCode={historyRow.module_code}
          companyName={historyRow.company_name} moduleName={historyRow.module_name}
          onClose={() => setHistoryRow(null)}
        />
      )}

      <OREV1059ConfirmModal
        open={!!deleteRow}
        title="Remove this assignment?"
        message="This will end this person's assignment (kept in history) — the module will have no Authorized Person until reassigned."
        onCancel={() => setDeleteRow(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}