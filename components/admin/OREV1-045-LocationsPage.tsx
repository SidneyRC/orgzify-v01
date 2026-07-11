'use client'
import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { useTheme } from '@/lib/ThemeContext'
import OREV1_045C_LocationsToolbar from '@/components/admin/OREV1-045C-LocationsToolbar'
import OREV1_045A_LocationsTable from '@/components/admin/OREV1-045A-LocationsTable'
import OREV1_045B_LocationsPopup from '@/components/admin/OREV1-045B-LocationsPopup'

interface Location { id: string; name: string; level: string; code: string; timezone: string; is_active: boolean; created_at: string; parent: { name: string } | null; country: { id: string; name: string } | null; country_id: string; parent_id?: string }
interface Filters { country_id: string; level: string; search: string }

export default function OREV1_045_LocationsPage() {
  const router = useRouter()
  const { theme } = useTheme()
  const [data, setData] = useState<Location[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(50)
  const [sortBy, setSortBy] = useState('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [filters, setFilters] = useState<Filters>({ country_id: '', level: '', search: '' })
  const [countries, setCountries] = useState<{ id: string; name: string; timezones?: string[] }[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [popup, setPopup] = useState<Location | null | 'new'>(null)
  const [loading, setLoading] = useState(false)

  const radius = theme?.global_border_radius || '12px'
  const textPrimary = theme?.color_text_primary || '#111827'
  const primaryBtn = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }
  const outlineBtn = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }

  useEffect(() => {
    fetch('/admin/setup/locations/api?distinct_countries=true')
      .then(r => r.json())
      .then(j => setCountries(j.data || []))
  }, [])

  const fetchData = useCallback(async (f: Filters, p: number, l: number, sb: string, sd: string) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(p), limit: String(l), sort_by: sb, sort_dir: sd, ...Object.fromEntries(Object.entries(f).filter(([, v]) => v)) })
    const res = await fetch(`/admin/setup/locations/api?${params}`)
    const json = await res.json()
    setData(json.data || [])
    setTotal(json.total || 0)
    setLoading(false)
  }, [])

  function handleSearch(f: Filters) {
    setFilters(f); setPage(1); setSelected([])
    fetchData(f, 1, limit, sortBy, sortDir)
  }

  function handleSort(col: string) {
    const newDir = sortBy === col && sortDir === 'asc' ? 'desc' : 'asc'
    setSortBy(col); setSortDir(newDir)
    fetchData(filters, page, limit, col, newDir)
  }

  function handlePage(p: number) {
    if (p < 1 || p > totalPages) return
    setPage(p); fetchData(filters, p, limit, sortBy, sortDir)
  }

  function handleRows(rows: number) {
    if (rows < 1) return
    setLimit(rows); setPage(1)
    fetchData(filters, 1, rows, sortBy, sortDir)
  }

  async function handleToggle(id: string, val: boolean) {
    const res = await fetch('/admin/setup/locations/api', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, is_active: val }) })
    const json = await res.json()
    if (json.error) { toast.error('Failed to update'); return }
    setData(d => d.map(r => r.id === id ? { ...r, is_active: val } : r))
    toast.success(val ? 'Activated' : 'Deactivated')
  }

  async function handleBulkToggle(val: boolean) {
    await Promise.all(selected.map(id => fetch('/admin/setup/locations/api', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, is_active: val }) })))
    setData(d => d.map(r => selected.includes(r.id) ? { ...r, is_active: val } : r))
    setSelected([])
    toast.success(`${selected.length} records updated`)
  }

  function handleDownload() {
    const csv = ['Name,Level,Code,Timezone,Parent,Country,Active,Created', ...data.map(r => [r.name, r.level, r.code || '', r.timezone || '', r.parent?.name || '', r.country?.name || '', r.is_active, new Date(r.created_at).toLocaleDateString()].join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const now = new Date(); const ts = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`
    const a = document.createElement('a'); a.href = url; a.download = `locations_${ts}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const totalPages = Math.ceil(total / limit) || 1

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <h1 className="text-xl md:text-2xl font-semibold" style={{ color: textPrimary }}>Locations</h1>
        <div className="flex items-center justify-between md:justify-end gap-2 md:gap-3">
          <button onClick={() => router.push('/admin/table')} style={outlineBtn}
            className="flex-1 md:flex-none whitespace-nowrap text-[11px] md:text-sm font-medium px-2 md:px-5 py-2 md:py-2.5 transition">
            ← Back
          </button>
          <button onClick={handleDownload} style={outlineBtn}
            className="flex-1 md:flex-none whitespace-nowrap text-[11px] md:text-sm font-medium px-2 md:px-5 py-2 md:py-2.5 transition">
            ↓ Download
          </button>
          <button onClick={() => setPopup('new')} style={primaryBtn}
            className="flex-1 md:flex-none whitespace-nowrap text-[11px] md:text-sm font-medium px-2 md:px-5 py-2 md:py-2.5 transition">
            + Add
          </button>
        </div>
      </div>

      <OREV1_045C_LocationsToolbar countries={countries} onSearch={handleSearch} theme={theme} />

      <div className="flex items-center gap-1.5 md:gap-3 text-xs md:text-sm text-gray-500 mb-4 overflow-x-auto whitespace-nowrap">
        <button onClick={() => handlePage(page - 1)} disabled={page === 1}
          className="bg-white border border-gray-200 text-gray-600 text-sm px-4 py-2 rounded-xl hover:bg-gray-50 transition disabled:opacity-40">
          ‹ Prev
        </button>
        <input type="number" min={1} max={totalPages} value={page} onChange={e => handlePage(Number(e.target.value))}
          className="w-14 text-center border border-gray-200 rounded-xl px-2 py-2 text-sm focus:outline-none focus:border-blue-400" />
        <span>of {totalPages}</span>
        <button onClick={() => handlePage(page + 1)} disabled={page === totalPages}
          className="bg-white border border-gray-200 text-gray-600 text-sm px-4 py-2 rounded-xl hover:bg-gray-50 transition disabled:opacity-40">
          Next ›
        </button>
        <span className="text-gray-300">|</span>
        <span className="text-gray-500">Preview</span>
        <input type="number" min={1} value={limit} onChange={e => handleRows(Number(e.target.value))}
          className="w-16 text-center border border-gray-200 rounded-xl px-2 py-2 text-sm focus:outline-none focus:border-blue-400" />
        <span className="text-gray-400">{total} total</span>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400 text-center py-10">Loading...</p>
      ) : (
        <OREV1_045A_LocationsTable data={data} sortBy={sortBy} sortDir={sortDir} onSort={handleSort} onToggle={handleToggle} onEdit={loc => setPopup({ ...loc, country_id: (loc.country as any)?.id || '' })} selected={selected} onSelect={setSelected} onBulkToggle={handleBulkToggle} theme={theme} />
      )}

      {popup && countries.length > 0 && (
        <OREV1_045B_LocationsPopup
          location={popup === 'new' ? null : popup}
          countries={countries}
          onClose={() => setPopup(null)}
          onSaved={() => {
            const isNew = popup === 'new'
            setPopup(null)
            fetchData(filters, page, limit, sortBy, sortDir)
            toast.success(isNew ? 'Location added!' : 'Location updated!')
          }}
          theme={theme}
        />
      )}
    </div>
  )
}