'use client'
import { useState, useRef, useEffect } from 'react'
import { useTheme } from '@/lib/ThemeContext'

type PincodeResult = { id: string; pincode: string; area: string; city_id: string; district_id: string; state_id: string; country_id: string }
type AutoFillData = { pincode: string; area: string; city_id: string; city_name: string; district_id: string; district_name: string; state_id: string; state_name: string; country_id: string }

type Props = {
  value: string
  onChange: (pincode: string) => void
  onAutoFill: (data: AutoFillData) => void
  error?: string
  required?: boolean
}

const API = '/admin/setup/companies/new/api'

async function getLocationName(id: string): Promise<string> {
  if (!id) return ''
  try {
    const res = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'get_location_by_id', id }) })
    const json = await res.json()
    return json.data?.name || ''
  } catch { return '' }
}

export default function OREV1047DPincodeTypeahead({ value, onChange, onAutoFill, error, required }: Props) {
  const { theme } = useTheme()
  const radius = theme?.global_border_radius || '12px'
  const inputStyle = { backgroundColor: theme?.input_bg || '#fff', border: `1px solid ${error ? '#ef4444' : theme?.input_border || '#e5e7eb'}`, borderRadius: radius }
  const dropStyle = { backgroundColor: theme?.dropdown_bg || '#fff', border: `1px solid ${theme?.dropdown_border || '#e5e7eb'}`, borderRadius: radius }

  const [query, setQuery] = useState(value || '')
  const [results, setResults] = useState<PincodeResult[]>([])
  const [open, setOpen] = useState(false)
  const [areas, setAreas] = useState<PincodeResult[]>([])
  const [showAreaDrop, setShowAreaDrop] = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setShowAreaDrop(false) }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const search = async (q: string) => {
    setQuery(q); onChange(q)
    if (q.length < 2) { setResults([]); setOpen(false); return }
    const res = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'search_pincodes', query: q }) })
    const json = await res.json()
    setResults(json.data || [])
    setOpen(true)
  }

  const resolveAndFill = async (row: PincodeResult) => {
    setLoading(true)
    const [city_name, district_name, state_name] = await Promise.all([
      getLocationName(row.city_id),
      getLocationName(row.district_id),
      getLocationName(row.state_id),
    ])
    onAutoFill({ pincode: row.pincode, area: row.area, city_id: row.city_id, city_name, district_id: row.district_id, district_name, state_id: row.state_id, state_name, country_id: row.country_id })
    setLoading(false)
  }

  const selectPincode = async (row: PincodeResult) => {
    setQuery(row.pincode); onChange(row.pincode); setOpen(false)
    const matching = results.filter(r => r.pincode === row.pincode)
    if (matching.length > 1) { setAreas(matching); setShowAreaDrop(true) }
    else { await resolveAndFill(row) }
  }

  const selectArea = async (row: PincodeResult) => {
    setShowAreaDrop(false)
    await resolveAndFill(row)
  }

  const uniquePincodes = results.filter((r, i, arr) => arr.findIndex(x => x.pincode === r.pincode) === i)

  return (
    <div className="flex flex-col gap-1" ref={ref}>
      <label className="text-xs text-gray-500">Pincode {required && <span className="text-red-500">*</span>}</label>
      <div className="relative">
        <input value={query} onChange={e => search(e.target.value)}
          placeholder="e.g. 600001" className="w-full h-10 px-3 text-sm focus:outline-none" style={inputStyle} />
        {loading && <div className="absolute right-3 top-3 w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />}

        {open && uniquePincodes.length > 0 && (
          <div className="absolute z-20 w-full mt-1 shadow-lg max-h-48 overflow-y-auto" style={dropStyle}>
            {uniquePincodes.map(r => (
              <div key={r.id} onMouseDown={e => { e.preventDefault(); selectPincode(r) }}
                className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-50">
                {r.pincode} — {r.area}
              </div>
            ))}
          </div>
        )}

        {showAreaDrop && (
          <div className="absolute z-20 w-full mt-1 shadow-lg max-h-48 overflow-y-auto" style={dropStyle}>
            <div className="px-3 py-1.5 text-xs text-gray-400 border-b">Select area for {query}</div>
            {areas.map(r => (
              <div key={r.id} onMouseDown={e => { e.preventDefault(); selectArea(r) }}
                className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-50">{r.area}</div>
            ))}
          </div>
        )}
      </div>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
}
