'use client'
import { useTheme } from '@/lib/ThemeContext'

type Props = {
  companies: { id: string; display_name: string }[]
  companyId: string; setCompanyId: (v: string) => void
  status: string; setStatus: (v: string) => void
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'archived', label: 'Archived' },
]

export default function OREV1049BRolesFilters({ companies, companyId, setCompanyId, status, setStatus }: Props) {
  const { theme } = useTheme()
  const radius = theme?.global_border_radius || '12px'
  const selectStyle = { backgroundColor: theme?.input_bg || '#fff', border: `1px solid ${theme?.input_border || '#e5e7eb'}`, borderRadius: radius }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
      <select value={companyId} onChange={e => setCompanyId(e.target.value)}
        className="h-10 px-3 text-sm focus:outline-none" style={selectStyle}>
        <option value="">All Companies</option>
        {companies.map(c => <option key={c.id} value={c.id}>{c.display_name}</option>)}
      </select>

      <select value={status} onChange={e => setStatus(e.target.value)}
        className="h-10 px-3 text-sm focus:outline-none" style={selectStyle}>
        {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}
