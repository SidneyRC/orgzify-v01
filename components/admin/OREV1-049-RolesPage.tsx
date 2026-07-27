'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/lib/ThemeContext'
import toast from 'react-hot-toast'
import OREV1049ARoleFormModal from './OREV1-049A-RoleFormModal'
import OREV1049BRolesFilters from './OREV1-049B-RolesFilters'

type RoleRow = { id: string; name: string; status: string; is_default: boolean; company_id: string; company_name: string; modules: string }
const EMPTY_PERMS = { companies: {}, location: {}, assign_roles: {}, geofence: {}, themes: {}, roles: {}, entities: {}, support: {} }

const IconView = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
const IconEdit = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
const IconDelete = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
const IconRestore = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>

const STATUS_COLORS: Record<string, string> = { active: 'bg-green-100 text-green-700', inactive: 'bg-red-100 text-red-600', archived: 'bg-gray-100 text-gray-500' }

type Props = { ownCompanyId?: string | null; backLink?: string; canCreate?: boolean; canEdit?: boolean; canDelete?: boolean; canDownload?: boolean }

export default function OREV1049RolesPage({ ownCompanyId = null, backLink = '/admin/setup', canCreate = true, canEdit = true, canDelete = true, canDownload = true }: Props) {
  const router = useRouter()
  const { theme } = useTheme()
  const [rows, setRows] = useState<RoleRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [filterCompany, setFilterCompany] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [viewOnly, setViewOnly] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [status, setStatus] = useState('active')
  const [companies, setCompanies] = useState<{ id: string; display_name: string }[]>([])
  const [perms, setPerms] = useState<Record<string, Record<string, boolean>>>(EMPTY_PERMS)
  const [saving, setSaving] = useState(false)

  const radius = theme?.global_border_radius || '12px'
  const primaryBtn = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }
  const outlineBtn = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }

  const loadRoles = async (companyF = filterCompany, statusF = filterStatus) => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusF) params.set('status', statusF)
    if (companyF) params.set('company_id', companyF)
    const res = await fetch(`/admin/setup/roles/api?${params.toString()}`)
    const json = await res.json()
    if (!json.error) setRows(json.data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadRoles()
    fetch('/admin/setup/roles/api?type=companies').then(r => r.json()).then(j => setCompanies(j.data || []))
  }, [])

  const runSearch = () => { setAppliedSearch(search); loadRoles(filterCompany, filterStatus) }
  const runReset = () => { setSearch(''); setAppliedSearch(''); setFilterCompany(''); setFilterStatus(''); loadRoles('', '') }

  const togglePerm = (page: string, key: string) => setPerms(p => ({ ...p, [page]: { ...p[page], [key]: !p[page][key] } }))
  const resetForm = () => { setName(''); setCompanyId(''); setStatus('active'); setPerms(EMPTY_PERMS); setEditId(null); setViewOnly(false); setShowForm(false) }
  const openCreate = () => { resetForm(); setShowForm(true) }

  const openEdit = async (roleId: string, readOnly = false) => {
    const res = await fetch(`/admin/setup/roles/api?type=role_detail&role_id=${roleId}`)
    const json = await res.json()
    if (json.error) { toast.error(json.error); return }
    const d = json.data
    setName(d.name); setCompanyId(d.company_id); setStatus(d.status || 'active')
    const loaded: Record<string, Record<string, boolean>> = { companies: {}, location: {}, assign_roles: {}, geofence: {}, themes: {}, roles: {}, entities: {}, support: {} }
    for (const p of d.permissions) { const { module, id, role_id, created_at, updated_at, ...flags } = p; loaded[module] = flags }
    setPerms(loaded); setEditId(roleId); setViewOnly(readOnly); setShowForm(true)
  }

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Please enter a role name.'); return }
    if (!companyId) { toast.error('Please select a company.'); return }
    if (status === 'active') {
      const hasAnyPerm = Object.keys(perms).some(p => Object.values(perms[p]).some(Boolean))
      if (!hasAnyPerm) { toast.error('Please select at least one permission.'); return }
    }
    setSaving(true)
    const res = await fetch('/admin/setup/roles/api', {
      method: editId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editId ? { role_id: editId, name, company_id: companyId, status, permissions: perms } : { name, company_id: companyId, permissions: perms }),
    })
    const json = await res.json(); setSaving(false)
    if (json.error) { toast.error(json.error); return }
    toast.success(editId ? 'Role updated.' : 'Role created.'); resetForm(); loadRoles()
  }

  const handleDelete = async (roleId: string) => {
    if (!window.confirm('Are you sure you want to delete this role?')) return
    const res = await fetch('/admin/setup/roles/api', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role_id: roleId }) })
    const json = await res.json()
    if (json.error) { toast.error(json.error); return }
    toast.success('Role deleted.'); loadRoles()
  }

  const handleRestore = async (roleId: string) => {
    const res = await fetch('/admin/setup/roles/api', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role_id: roleId, restore: true }) })
    const json = await res.json()
    if (json.error) { toast.error(json.error); return }
    toast.success('Role restored.'); loadRoles()
  }

  const filtered = rows.filter(r => (r.name || '').toLowerCase().includes(appliedSearch.toLowerCase()) || (r.company_name || '').toLowerCase().includes(appliedSearch.toLowerCase()))

  const handleDownload = () => {
    const csv = ['Role Name,Company,Modules,Status', ...filtered.map(r => `${r.name},${r.company_name},${r.modules},${r.status}`)].join('\n')
    const ts = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = `roles_${ts}.csv`; a.click()
  }

  const ActionIcons = ({ r }: { r: RoleRow }) => {
    const isOwn = r.company_id === ownCompanyId
    return (
      <div className="flex items-center gap-3">
        <button onClick={() => openEdit(r.id, true)} title="View" className="text-gray-500 hover:text-gray-700"><IconView /></button>
        {!isOwn && canEdit && r.status !== 'archived' && <button onClick={() => openEdit(r.id, false)} title="Edit" className="text-blue-600 hover:text-blue-800"><IconEdit /></button>}
        {!isOwn && r.status !== 'archived' ? (canDelete && !r.is_default && <button onClick={() => handleDelete(r.id)} title="Delete" className="text-red-600 hover:text-red-800"><IconDelete /></button>)
          : (!isOwn && canEdit && <button onClick={() => handleRestore(r.id)} title="Restore" className="text-green-600 hover:text-green-800"><IconRestore /></button>)}
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <h1 className="text-lg font-semibold" style={{ color: theme?.color_text_primary || '#111827' }}>Roles</h1>
        <div className="flex gap-2 shrink-0">
          {canDownload && (
            <button onClick={handleDownload} style={outlineBtn} className="text-sm font-medium px-4 py-2 hover:opacity-90">↓ Download</button>
          )}
          <button onClick={() => router.push(backLink)} style={outlineBtn} className="text-sm font-medium px-4 py-2 hover:opacity-90">← Back</button>
          {canCreate && (
            <button onClick={openCreate} style={primaryBtn} className="text-sm font-medium px-4 py-2 hover:opacity-90">+ Create Role</button>
          )}
        </div>
      </div>

      <OREV1049BRolesFilters companies={companies} companyId={filterCompany} setCompanyId={setFilterCompany} status={filterStatus} setStatus={setFilterStatus} />

      <div className="flex gap-2 mb-5 items-center">
        <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') runSearch() }}
          placeholder="Search by role name or company…" className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-400" />
        <button onClick={runReset} style={outlineBtn} className="text-sm font-medium px-4 py-2 hover:opacity-90">Reset</button>
        <button onClick={runSearch} style={primaryBtn} className="text-sm font-medium px-4 py-2 hover:opacity-90">Search</button>
      </div>

      <div className="hidden md:block bg-white rounded-2xl border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead style={{ backgroundColor: theme?.table_header_bg || '#f9fafb' }}>
            <tr>{['Role Name', 'Company', 'Modules', 'Status', 'Actions'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: theme?.table_header_text || '#6b7280' }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="text-center py-12 text-sm text-gray-400">Loading…</td></tr>}
            {!loading && filtered.length === 0 && <tr><td colSpan={5} className="text-center py-12 text-sm text-gray-400">No roles found.</td></tr>}
            {!loading && filtered.map(r => (
              <tr key={r.id} className="border-t border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium" style={{ color: theme?.color_text_primary || '#111827' }}>{r.name}</td>
                <td className="px-4 py-3 text-gray-500">{r.company_name}</td>
                <td className="px-4 py-3 text-gray-500">{r.modules}</td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${STATUS_COLORS[r.status] || 'bg-gray-100 text-gray-500'}`}>{r.status || '—'}</span></td>
                <td className="px-4 py-3"><ActionIcons r={r} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden flex flex-col gap-3">
        {loading && <p className="text-center py-12 text-sm text-gray-400">Loading…</p>}
        {!loading && filtered.length === 0 && <p className="text-center py-12 text-sm text-gray-400">No roles found.</p>}
        {!loading && filtered.map(r => (
          <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col gap-3 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate" style={{ color: theme?.color_text_primary || '#111827' }}>{r.name}</p>
                <p className="text-xs text-gray-400 mt-0.5 truncate">{r.company_name}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 capitalize ${STATUS_COLORS[r.status] || 'bg-gray-100 text-gray-500'}`}>{r.status || '—'}</span>
            </div>
            <div className="rounded-xl bg-gray-50 px-3 py-2">
              <p className="text-xs text-gray-400">Modules</p>
              <p className="text-xs text-gray-700 font-medium mt-0.5">{r.modules}</p>
            </div>
            <div className="flex justify-end pt-1"><ActionIcons r={r} /></div>
          </div>
        ))}
      </div>

      {showForm && (
        <OREV1049ARoleFormModal
          isEdit={!!editId} readOnly={viewOnly} name={name} setName={setName} companyId={companyId} setCompanyId={setCompanyId}
          status={status} setStatus={setStatus} companies={companies} perms={perms} togglePerm={togglePerm}
          saving={saving} onCancel={resetForm} onSave={handleSave} onSwitchToEdit={() => setViewOnly(false)}
        />
      )}
    </div>
  )
}
