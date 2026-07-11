'use client'
import { useTheme } from '@/lib/ThemeContext'
import type { PincodeRow } from '@/components/admin/OREV1-046-PincodesPage'

type Props = {
  rows: PincodeRow[]
  loading: boolean
  onEdit: (row: PincodeRow) => void
  onToggle: (id: string, field: 'is_active' | 'is_verified', value: boolean) => void
}

export default function OREV1046ATable({ rows, loading, onEdit, onToggle }: Props) {
  const { theme } = useTheme()

  const thStyle = { backgroundColor: theme?.table_header_bg || '#f9fafb', color: theme?.table_header_text || '#9ca3af', borderBottom: `1px solid ${theme?.table_border || '#f3f4f6'}` }
  const tdStyle = { borderBottom: `1px solid ${theme?.table_border || '#f3f4f6'}`, color: theme?.table_cell_text || '#6b7280' }
  const radius = theme?.global_border_radius || '12px'
  const textPrimary = theme?.color_text_primary || '#111827'
  const textMuted = theme?.color_text_muted || '#9ca3af'

  if (loading) return <p className="text-sm text-center py-10" style={{ color: textMuted }}>Loading...</p>
  if (!rows.length) return null

  const fields = (row: PincodeRow): [string, string][] => [
    ['Area', row.area || '—'],
    ['City', row.city?.name || '—'],
    ['District', row.district?.name || '—'],
    ['State', row.state?.name || '—'],
    ['Country', row.country?.name || '—'],
    ['Source', row.source],
  ]

  return (
    <>
      <div className="hidden md:block overflow-x-auto" style={{ backgroundColor: theme?.color_surface || '#fff', border: `1px solid ${theme?.table_border || '#f3f4f6'}`, borderRadius: radius }}>
        <table className="w-full text-sm">
          <thead>
            <tr>
              {['Pincode', 'Area', 'City', 'District', 'State', 'Country', 'Source', 'Verified', 'Active', 'Action'].map(h => (
                <th key={h} className="text-left px-3 py-3 text-xs font-semibold uppercase tracking-wide" style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.id} style={{ backgroundColor: theme?.color_surface || '#fff' }} className="transition-colors hover:opacity-80">
                <td className="px-3 py-3 font-mono font-medium" style={{ ...tdStyle, color: textPrimary }}>{row.pincode}</td>
                <td className="px-3 py-3" style={tdStyle}>{row.area || '—'}</td>
                <td className="px-3 py-3" style={tdStyle}>{row.city?.name || '—'}</td>
                <td className="px-3 py-3" style={tdStyle}>{row.district?.name || '—'}</td>
                <td className="px-3 py-3" style={tdStyle}>{row.state?.name || '—'}</td>
                <td className="px-3 py-3" style={tdStyle}>{row.country?.name || '—'}</td>
                <td className="px-3 py-3 capitalize" style={tdStyle}>{row.source}</td>
                <td className="px-3 py-3" style={tdStyle}>
                  <button onClick={() => onToggle(row.id, 'is_verified', !row.is_verified)} className="text-xs px-2 py-0.5 rounded-full border"
                    style={{ backgroundColor: row.is_verified ? theme?.badge_success_bg || '#dcfce7' : theme?.badge_warning_bg || '#fef9c3', color: row.is_verified ? theme?.badge_success_text || '#16a34a' : theme?.badge_warning_text || '#ca8a04', borderColor: row.is_verified ? '#86efac' : '#fde047' }}>
                    {row.is_verified ? 'Verified' : 'Unverified'}
                  </button>
                </td>
                <td className="px-3 py-3" style={tdStyle}>
                  <button onClick={() => onToggle(row.id, 'is_active', !row.is_active)} className="w-10 h-5 rounded-full transition-colors relative"
                    style={{ backgroundColor: row.is_active ? theme?.toggle_on || '#22c55e' : theme?.toggle_off || '#d1d5db' }}>
                    <span className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all" style={{ left: row.is_active ? '22px' : '2px' }} />
                  </button>
                </td>
                <td className="px-3 py-3" style={tdStyle}>
                  <button onClick={() => onEdit(row)} title="Edit" className="text-blue-600 hover:text-blue-800 p-1.5 rounded-lg hover:bg-blue-50">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden flex flex-col gap-3">
        {rows.map(row => (
          <div key={row.id} className="p-4" style={{ backgroundColor: theme?.color_surface || '#fff', border: `1px solid ${theme?.table_border || '#f3f4f6'}`, borderRadius: radius }}>
            <div className="flex items-start justify-between mb-2">
              <span className="font-mono font-semibold" style={{ color: textPrimary }}>{row.pincode}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${row.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {row.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="rounded-xl bg-gray-50 px-3 py-2 flex flex-col gap-1 mb-3">
              {fields(row).map(([label, value]) => (
                <div key={label} className="flex justify-between text-xs gap-2">
                  <span style={{ color: textMuted }} className="shrink-0">{label}</span>
                  <span style={{ color: textPrimary }} className="text-right">{value}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 pt-2">
              <button onClick={() => onToggle(row.id, 'is_verified', !row.is_verified)} className="text-xs px-2 py-0.5 rounded-full border"
                style={{ backgroundColor: row.is_verified ? theme?.badge_success_bg : theme?.badge_warning_bg, color: row.is_verified ? theme?.badge_success_text : theme?.badge_warning_text, borderColor: row.is_verified ? '#86efac' : '#fde047' }}>
                {row.is_verified ? 'Verified' : 'Unverified'}
              </button>
              <div className="flex items-center gap-2">
                <button onClick={() => onToggle(row.id, 'is_active', !row.is_active)} className="w-9 h-5 rounded-full relative transition-colors"
                  style={{ backgroundColor: row.is_active ? theme?.toggle_on || '#22c55e' : theme?.toggle_off || '#d1d5db' }}>
                  <span className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all" style={{ left: row.is_active ? '18px' : '2px' }} />
                </button>
                <button onClick={() => onEdit(row)} title="Edit" className="text-blue-600 hover:text-blue-800 p-1.5 rounded-lg hover:bg-blue-50">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}