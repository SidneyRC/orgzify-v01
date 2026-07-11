'use client'

interface Location {
  id: string; name: string; level: string; code: string; timezone: string
  is_active: boolean; created_at: string
  parent: { name: string } | null
  country: { id: string; name: string } | null
}

interface Props {
  data: Location[]
  sortBy: string; sortDir: 'asc' | 'desc'
  onSort: (col: string) => void
  onToggle: (id: string, val: boolean) => void
  onEdit: (loc: Location) => void
  selected: string[]
  onSelect: (ids: string[]) => void
  onBulkToggle: (val: boolean) => void
  theme?: any
}

const LEVEL_STYLE: Record<string, string> = {
  state: 'bg-blue-50 text-blue-800',
  district: 'bg-amber-50 text-amber-800',
  city: 'bg-green-50 text-green-800',
}

export default function OREV1_045A_LocationsTable({ data, sortBy, sortDir, onSort, onToggle, onEdit, selected, onSelect, onBulkToggle, theme }: Props) {
  const allSelected = data.length > 0 && selected.length === data.length
  const textPrimary = theme?.color_text_primary || '#111827'
  const textMuted = theme?.color_text_muted || '#6b7280'
  const headerBg = theme?.table_header_bg || '#f9fafb'
  const headerText = theme?.table_header_text || '#9ca3af'

  function toggleAll() { onSelect(allSelected ? [] : data.map(d => d.id)) }
  function toggleOne(id: string) { onSelect(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id]) }

  function Th({ col, label }: { col: string; label: string }) {
    const arrow = sortBy === col ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''
    return (
      <th onClick={() => onSort(col)} style={{ color: headerText }} className="text-left px-3 py-3 text-xs font-semibold uppercase tracking-wide cursor-pointer select-none whitespace-nowrap">
        {label}{arrow}
      </th>
    )
  }

  const fields = (loc: Location): [string, string][] => [
    ['Code', loc.code || '—'],
    ['Parent', loc.parent?.name || '—'],
    ['Country', loc.country?.name || '—'],
    ['Timezone', loc.timezone || '—'],
    ['Created', new Date(loc.created_at).toLocaleDateString()],
  ]

  if (data.length === 0) return (
    <div className="text-center py-16">
      <p className="text-gray-400 text-sm">No results found.</p>
      <p className="text-gray-400 text-xs mt-1">Select filters and click Search to load data.</p>
    </div>
  )

  return (
    <div>
      {selected.length > 0 && (
        <div className="flex items-center gap-3 mb-3 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2">
          <span>{selected.length} selected</span>
          <button onClick={() => onBulkToggle(true)} className="text-green-700 hover:underline">Set active</button>
          <button onClick={() => onBulkToggle(false)} className="text-red-700 hover:underline">Set inactive</button>
          <button onClick={() => onSelect([])} className="ml-auto text-gray-400 hover:text-gray-600">Clear</button>
        </div>
      )}

      <div className="hidden md:block bg-white border border-gray-100 rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead style={{ backgroundColor: headerBg }} className="border-b border-gray-100">
            <tr>
              <th className="px-3 py-3 w-10"><input type="checkbox" checked={allSelected} onChange={toggleAll} /></th>
              <Th col="name" label="Name" />
              <Th col="level" label="Level" />
              <Th col="code" label="Code" />
              <th style={{ color: headerText }} className="text-left px-3 py-3 text-xs font-semibold uppercase tracking-wide">Parent</th>
              <th style={{ color: headerText }} className="text-left px-3 py-3 text-xs font-semibold uppercase tracking-wide">Country</th>
              <Th col="timezone" label="Timezone" />
              <Th col="created_at" label="Created" />
              <th style={{ color: headerText }} className="text-left px-3 py-3 text-xs font-semibold uppercase tracking-wide">Active</th>
              <th style={{ color: headerText }} className="text-left px-3 py-3 text-xs font-semibold uppercase tracking-wide">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.map(loc => (
              <tr key={loc.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-3 py-3"><input type="checkbox" checked={selected.includes(loc.id)} onChange={() => toggleOne(loc.id)} /></td>
                <td style={{ color: textPrimary }} className="px-3 py-3 font-medium whitespace-nowrap">{loc.name}</td>
                <td className="px-3 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${LEVEL_STYLE[loc.level] || ''}`}>{loc.level}</span>
                </td>
                <td style={{ color: textMuted }} className="px-3 py-3">{loc.code || '—'}</td>
                <td style={{ color: textMuted }} className="px-3 py-3 whitespace-nowrap">{loc.parent?.name || '—'}</td>
                <td style={{ color: textMuted }} className="px-3 py-3 whitespace-nowrap">{loc.country?.name || '—'}</td>
                <td style={{ color: textMuted }} className="px-3 py-3 whitespace-nowrap">{loc.timezone || '—'}</td>
                <td style={{ color: textMuted }} className="px-3 py-3 whitespace-nowrap">{new Date(loc.created_at).toLocaleDateString()}</td>
                <td className="px-3 py-3">
                  <button onClick={() => onToggle(loc.id, !loc.is_active)}
                    className={`w-9 h-5 rounded-full relative transition-colors ${loc.is_active ? 'bg-green-500' : 'bg-gray-200'}`}
                    aria-label={loc.is_active ? 'Deactivate' : 'Activate'}>
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${loc.is_active ? 'left-4' : 'left-0.5'}`} />
                  </button>
                </td>
                <td className="px-3 py-3">
                  <button onClick={() => onEdit(loc)} title="Edit" className="text-blue-600 hover:text-blue-800 p-1.5 rounded-lg hover:bg-blue-50">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden flex flex-col gap-3">
        {data.map(loc => (
          <div key={loc.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div>
                <p style={{ color: textPrimary }} className="font-semibold">{loc.name}</p>
                <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${LEVEL_STYLE[loc.level] || ''}`}>{loc.level}</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${loc.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {loc.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="rounded-xl bg-gray-50 px-3 py-2 flex flex-col gap-1">
              {fields(loc).map(([label, value]) => (
                <div key={label} className="flex justify-between text-xs gap-2">
                  <span style={{ color: textMuted }} className="shrink-0">{label}</span>
                  <span style={{ color: textPrimary }} className="text-right">{value}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-2">
              <button onClick={() => onToggle(loc.id, !loc.is_active)}
                className={`w-9 h-5 rounded-full relative transition-colors ${loc.is_active ? 'bg-green-500' : 'bg-gray-200'}`}
                aria-label={loc.is_active ? 'Deactivate' : 'Activate'}>
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${loc.is_active ? 'left-4' : 'left-0.5'}`} />
              </button>
              <button onClick={() => onEdit(loc)} title="Edit" className="text-blue-600 hover:text-blue-800 p-1.5 rounded-lg hover:bg-blue-50">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}