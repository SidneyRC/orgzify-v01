'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/lib/ThemeContext'
import toast from 'react-hot-toast'
import OREV1050AAssignRoleFilters from './OREV1-050A-AssignRoleFilters'
import OREV1050BAssignRoleModal from './OREV1-050B-AssignRoleModal'
import OREV1050CAssignRoleTable from './OREV1-050C-AssignRoleTable'
import OREV1050DAssignRolePagination from './OREV1-050D-AssignRolePagination'

type Row = { id: string; person_name: string; email: string; company_id: string; company_name: string; role_id: string; role_name: string; status: string }


type Props = { ownCompanyId?: string | null; backLink?: string; canCreate?: boolean; canEdit?: boolean; canArchive?: boolean; canDownload?: boolean }

export default function OREV1050AssignRolePage({ ownCompanyId = null, backLink = '/admin/setup', canCreate = true, canEdit = true, canArchive = true, canDownload = true }: Props) {
  const router = useRouter()
  const { theme } = useTheme()
  const [rows, setRows] = useState<Row[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [loading, setLoading] = useState(true)
  const [companies, setCompanies] = useState<{ id: string; display_name: string }[]>([])
  const [roles, setRoles] = useState<{ id: string; name: string }[]>([])
  const [companyId, setCompanyId] = useState('')
  const [roleId, setRoleId] = useState('')
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [modalMode, setModalMode] = useState<'create' | 'view' | 'edit' | null>(null)
  const [selected, setSelected] = useState<Row | null>(null)

  const radius = theme?.global_border_radius || '12px'
  const primaryBtn = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }
  const outlineBtn = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }

  const load = async (p = page, c = companyId, r = roleId, s = status, q = appliedSearch) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(p), limit: String(limit) })
    if (c) params.set('company_id', c)
    if (r) params.set('role_id', r)
    if (s) params.set('status', s)
    if (q) params.set('search', q)
    const res = await fetch(`/admin/setup/assign-role/api?${params}`)
    const json = await res.json()
    if (!json.error) { setRows(json.data || []); setTotal(json.total || 0) }
    setLoading(false)
  }

  useEffect(() => {
    load(1)
    fetch('/admin/setup/assign-role/api?type=companies').then(r => r.json()).then(j => setCompanies(j.data || []))
    fetch('/admin/setup/assign-role/api?type=roles').then(r => r.json()).then(j => setRoles(j.data || []))
  }, [])

  useEffect(() => {
    if (!companyId) { fetch('/admin/setup/assign-role/api?type=roles').then(r => r.json()).then(j => setRoles(j.data || [])); return }
    fetch(`/admin/setup/assign-role/api?type=roles&company_id=${companyId}`).then(r => r.json()).then(j => setRoles(j.data || []))
  }, [companyId])

  const runSearch = () => { setAppliedSearch(search); setPage(1); load(1, companyId, roleId, status, search) }
  const runReset = () => { setSearch(''); setAppliedSearch(''); setCompanyId(''); setRoleId(''); setStatus(''); setPage(1); load(1, '', '', '', '') }
  const changePage = (p: number) => { setPage(p); load(p) }

  const toggleActive = async (row: Row) => {
    const newStatus = row.status === 'active' ? 'inactive' : 'active'
    const res = await fetch('/admin/setup/assign-role/api', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: row.id, status: newStatus }) })
    const json = await res.json()
    if (json.error) { toast.error(json.error); return }
    toast.success(newStatus === 'active' ? 'Reactivated.' : 'Deactivated.'); load(page)
  }
  const handleDownload = () => {
    const csv = ['Person,Email,Company,Role,Status', ...rows.map(r => `${r.person_name},${r.email},${r.company_name},${r.role_name},${r.status}`)].join('\n')
    const ts = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = `assigned_roles_${ts}.csv`; a.click()
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <h1 className="text-lg font-semibold" style={{ color: theme?.color_text_primary || '#111827' }}>Assign Roles</h1>
        <div className="flex gap-2 shrink-0">
          {canDownload && (
            <button onClick={handleDownload} style={outlineBtn} className="text-sm font-medium px-4 py-2 hover:opacity-90">↓ Download</button>
          )}
          <button onClick={() => router.push(backLink)} style={outlineBtn} className="text-sm font-medium px-4 py-2 hover:opacity-90">← Back</button>
          {canCreate && (
            <button onClick={() => { setSelected(null); setModalMode('create') }} style={primaryBtn} className="text-sm font-medium px-4 py-2 hover:opacity-90">+ Assign Role</button>
          )}
        </div>
      </div>

      <OREV1050AAssignRoleFilters companies={companies} companyId={companyId} setCompanyId={setCompanyId} roles={roles} roleId={roleId} setRoleId={setRoleId} status={status} setStatus={setStatus} search={search} setSearch={setSearch} onSearch={runSearch} onReset={runReset} canArchive={canArchive} />

      <OREV1050DAssignRolePagination page={page} setPage={changePage} limit={limit} setLimit={l => { setLimit(l); changePage(1) }} total={total} />

<OREV1050CAssignRoleTable rows={rows} loading={loading} theme={theme} onToggle={toggleActive} ownCompanyId={ownCompanyId} canEdit={canEdit}
  onView={r => { setSelected(r); setModalMode('view') }} onEdit={r => { setSelected(r); setModalMode('edit') }} />

      {modalMode && (
        <OREV1050BAssignRoleModal companies={companies} mode={modalMode}
          existing={selected ? { id: selected.id, person_name: selected.person_name, email: selected.email, company_id: selected.company_id, role_id: selected.role_id } : undefined}
          onClose={() => setModalMode(null)} onSaved={() => { setModalMode(null); load(page) }}
          onSwitchToEdit={() => setModalMode('edit')} />
      )}
    </div>
  )
}