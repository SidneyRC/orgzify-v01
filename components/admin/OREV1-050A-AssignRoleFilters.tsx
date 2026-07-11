'use client'
import { useTheme } from '@/lib/ThemeContext'

type Props = {
  companies: { id: string; display_name: string }[]
  companyId: string; setCompanyId: (v: string) => void
  roles: { id: string; name: string }[]
  roleId: string; setRoleId: (v: string) => void
  status: string; setStatus: (v: string) => void
  search: string; setSearch: (v: string) => void
  onSearch: () => void
  onReset: () => void
  canArchive?: boolean
}
const selectClass = "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white"

export default function OREV1050AAssignRoleFilters({ companies, companyId, setCompanyId, roles, roleId, setRoleId, status, setStatus, search, setSearch, onSearch, onReset, canArchive = true }: Props) {
  const { theme } = useTheme()
  const radius = theme?.global_border_radius || '12px'
  const inputStyle = { backgroundColor: theme?.input_bg || '#fff', border: `1px solid ${theme?.input_border || '#e5e7eb'}`, borderRadius: radius }
  const primaryBtn = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }
  const outlineBtn = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
        <select value={companyId} onChange={e => setCompanyId(e.target.value)} className={selectClass}>
          <option value="">All Companies</option>
          {companies.map(c => <option key={c.id} value={c.id}>{c.display_name}</option>)}
        </select>
        <select value={roleId} onChange={e => setRoleId(e.target.value)} className={selectClass}>
          <option value="">All Roles</option>
          {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
<select value={status} onChange={e => setStatus(e.target.value)} className={selectClass}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          {canArchive && <option value="archived">Archived</option>}
        </select>
      </div>
      <div className="flex gap-2 mb-5 items-center">
        <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') onSearch() }}
          placeholder="Search by person, email, or company…" className="flex-1 h-10 px-3 text-sm focus:outline-none" style={inputStyle} />
        <button onClick={onReset} style={outlineBtn} className="text-sm font-medium px-4 py-2 hover:opacity-90">Reset</button>
        <button onClick={onSearch} style={primaryBtn} className="text-sm font-medium px-4 py-2 hover:opacity-90">Search</button>
      </div>
    </>
  )
}