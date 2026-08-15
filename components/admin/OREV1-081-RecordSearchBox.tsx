// GOES IN: components/admin/OREV1-081-RecordSearchBox.tsx
'use client'
import { useState } from 'react'
import { useTheme } from '@/lib/ThemeContext'

type SearchResult = { id: string; line1: string; line2: string; line3: string }
type Props = { referenceType: string; onSelect: (r: { id: string; label: string } | null) => void }

const ENDPOINTS: { [key: string]: string } = { entity: 'search-entity', staff: 'search-staff', customer: 'search-customer' }

function mapResult(referenceType: string, r: any): SearchResult {
  if (referenceType === 'entity') return { id: r.id, line1: r.display_name || r.legal_name, line2: `${r.entity_unique_id || '—'} · ${r.status || '—'}`, line3: r.owner_email || '' }
  if (referenceType === 'staff') return { id: r.id, line1: r.display_name, line2: `${r.process_id || '—'} · ${r.status || '—'}`, line3: r.email || '' }
  return { id: r.id, line1: r.display_name, line2: `${r.zy_id || '—'} · ${r.account_status || '—'}`, line3: r.email || '' }
}

export default function OREV1081RecordSearchBox({ referenceType, onSelect }: Props) {
  const { theme } = useTheme()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selected, setSelected] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(false)

  const endpoint = ENDPOINTS[referenceType]
  if (!endpoint) return null

  const runSearch = async () => {
    setSelected(null); onSelect(null)
    if (query.trim().length < 2) { setResults([]); return }
    setLoading(true)
    const res = await fetch(`/admin/ecosystem/helpdesk/api/${endpoint}?q=${encodeURIComponent(query.trim())}`)
    const json = await res.json()
    setResults((json.data || []).map((r: any) => mapResult(referenceType, r))); setLoading(false)
  }

  const pick = (r: SearchResult) => { setSelected(r); setQuery(r.line1); setResults([]); onSelect({ id: r.id, label: r.line1 }) }

  return (
    <div className="flex flex-col gap-1 relative">
      <label className="text-xs text-gray-500">Search {referenceType}</label>
      <input
        value={query}
        onChange={e => { setQuery(e.target.value); if (selected) { setSelected(null); onSelect(null) } }}
        onBlur={runSearch}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); runSearch() } }}
        placeholder="Type name, email, or phone, then Tab/Enter…"
        className="h-10 px-3 text-sm border border-gray-200 rounded-xl focus:outline-none"
        style={{ borderRadius: theme?.global_border_radius || '12px' }}
      />
      {loading && <p className="text-xs text-gray-400">Searching…</p>}
      {results.length > 0 && (
        <div className="absolute top-16 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-56 overflow-y-auto">
          {results.map(r => (
            <button key={r.id} onMouseDown={() => pick(r)} className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-50 last:border-0">
              <p className="text-sm font-medium text-gray-700">{r.line1}</p>
              <p className="text-xs text-gray-500">{r.line2}</p>
              <p className="text-xs text-gray-400">{r.line3}</p>
            </button>
          ))}
        </div>
      )}
      {selected && <p className="text-xs text-green-600">Selected: {selected.line1}</p>}
    </div>
  )
}
