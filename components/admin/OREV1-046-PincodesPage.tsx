'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/lib/ThemeContext'
import toast from 'react-hot-toast'
import OREV1046CToolbar from '@/components/admin/OREV1-046C-PincodesToolbar'
import OREV1046ATable from '@/components/admin/OREV1-046A-PincodesTable'
import OREV1046BPopup from '@/components/admin/OREV1-046B-PincodesPopup'

export type PincodeRow = {
  id: string; pincode: string; area: string; source: string
  is_verified: boolean; is_active: boolean; created_at: string
  country: { id: string; name: string } | null
  state: { id: string; name: string } | null
  district: { id: string; name: string } | null
  city: { id: string; name: string } | null
}

export default function OREV1046PincodesPage() {
  const router = useRouter()
  const { theme } = useTheme()
  const [rows, setRows] = useState<PincodeRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(50)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [countries, setCountries] = useState<{ id: string; name: string }[]>([])
  const [filters, setFilters] = useState({ country_id: '', state_id: '', district_id: '', city_id: '', search: '' })
  const [popup, setPopup] = useState<PincodeRow | null | 'new'>(null)

  const radius = theme?.global_border_radius || '12px'
  const outlineBtn = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }
  const primaryBtn = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#ffffff', borderRadius: radius }

  useEffect(() => {
    fetch('/admin/setup/pincodes/api?type=countries').then(r => r.json()).then(j => setCountries(j.data || []))
  }, [])

  const fetchData = useCallback(async () => {
    const hasFilter = filters.country_id || filters.state_id || filters.district_id || filters.city_id || filters.search
    if (!hasFilter) { setRows([]); setTotal(0); setSearched(false); return }
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(limit), ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) })
    const res = await fetch(`/admin/setup/pincodes/api?${params}`)
    const json = await res.json()
    if (json.error) { toast.error('Failed to load pincodes'); setLoading(false); return }
    setRows(json.data || []); setTotal(json.total || 0); setLoading(false); setSearched(true)
  }, [page, limit, filters])

  useEffect(() => { fetchData() }, [fetchData])

  const handleDownload = () => {
    const csv = ['Pincode,Area,City,District,State,Country,Source,Verified,Active',
      ...rows.map(r => `${r.pincode},${r.area},${r.city?.name || ''},${r.district?.name || ''},${r.state?.name || ''},${r.country?.name || ''},${r.source},${r.is_verified},${r.is_active}`)
    ].join('\n')
    const now = new Date(); const ts = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = `pincodes_${ts}.csv`; a.click()
  }

  const handleToggle = async (id: string, field: 'is_active' | 'is_verified', value: boolean) => {
    const res = await fetch('/admin/setup/pincodes/api', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, [field]: value }) })
    if (!res.ok) { toast.error('Update failed'); return }
    toast.success('Updated successfully'); fetchData()
  }

  function handlePage(p: number) {
    const totalPages = Math.ceil(total / limit) || 1
    if (p < 1 || p > totalPages) return
    setPage(p)
  }

  function handleLimit(l: number) {
    if (l < 1) return
    setLimit(l); setPage(1)
  }

  const totalPages = Math.ceil(total / limit) || 1

  return (
    <div className="p-6" style={{ backgroundColor: theme?.page_bg || '#f9fafb', minHeight: '100vh' }}>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <h1 className="text-xl md:text-2xl font-semibold" style={{ color: theme?.color_text_primary || '#111827' }}>Pincodes</h1>
        <div className="flex items-center justify-between md:justify-end gap-2 md:gap-3 w-full md:w-auto">
          <button onClick={() => router.push('/admin/table')} style={outlineBtn} className="flex-1 md:flex-none whitespace-nowrap text-xs md:text-sm font-medium px-3 md:px-5 py-2 md:py-2.5 transition hover:opacity-90">← Back</button>
          <button onClick={handleDownload} style={outlineBtn} className="flex-1 md:flex-none whitespace-nowrap text-xs md:text-sm font-medium px-3 md:px-5 py-2 md:py-2.5 transition hover:opacity-90">↓ Download</button>
          <button onClick={() => setPopup('new')} style={primaryBtn} className="flex-1 md:flex-none whitespace-nowrap text-xs md:text-sm font-medium px-3 md:px-5 py-2 md:py-2.5 transition hover:bg-blue-800">+ Add Pincodes</button>
        </div>
      </div>

      <OREV1046CToolbar filters={filters} countries={countries} onFilterChange={(f) => { setFilters(f); setPage(1) }} />

      {/* Pagination — exactly like Locations */}
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
        <input type="number" min={1} value={limit} onChange={e => handleLimit(Number(e.target.value))}
          className="w-16 text-center border border-gray-200 rounded-xl px-2 py-2 text-sm focus:outline-none focus:border-blue-400" />
        <span className="text-gray-400">{total} total</span>
      </div>

      {!searched && !loading && <p className="text-center py-12 text-sm italic" style={{ color: theme?.color_text_muted || '#9ca3af' }}>Select a filter or search by pincode to view records.</p>}
      {searched && !loading && rows.length === 0 && <p className="text-center py-12 text-sm" style={{ color: theme?.color_text_muted || '#9ca3af' }}>No pincodes found.</p>}
      {(loading || rows.length > 0) && <OREV1046ATable rows={rows} loading={loading} onEdit={(row) => setPopup(row)} onToggle={handleToggle} />}

     {popup && (
        <OREV1046BPopup
          editRow={popup === 'new' ? null : popup}
          countries={countries}
          onClose={() => setPopup(null)}
          onSaved={() => { setPopup(null); fetchData(); toast.success(popup === 'new' ? 'Pincode added successfully!' : 'Pincode updated successfully!') }}
        />
      )}
    </div>
  )
}
