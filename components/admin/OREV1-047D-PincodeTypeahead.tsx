'use client'
import { useState, useRef, useEffect } from 'react'
import { useTheme } from '@/lib/ThemeContext'

type PincodeResult = { id: string; pincode: string; area: string; city_id: string; district_id: string; state_id: string; country_id: string }
type AutoFillData = { pincode: string; area: string; city_id: string; city_name: string; district_id: string; district_name: string; state_id: string; state_name: string; country_id: string }

type Props = {
  value: string
  onChange: (pincode: string) => void
  onAutoFill: (data: AutoFillData) => void
  onMultipleAreas: (rows: PincodeResult[]) => void
  error?: string
  required?: boolean
  apiBase?: string
}

const DEFAULT_API = '/admin/shared/address/api'

async function getLocationName(id: string, API: string): Promise<string> {
  if (!id) return ''
  try {
    const res = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'get_location_by_id', id }) })
    const json = await res.json()
    return json.data?.name || ''
  } catch { return '' }
}

export default function OREV1047DPincodeTypeahead({ value, onChange, onAutoFill, onMultipleAreas, error, required, apiBase }: Props) {
  const { theme } = useTheme()
  const API = apiBase || DEFAULT_API
  const radius = theme?.global_border_radius || '12px'
  const inputStyle = { backgroundColor: theme?.input_bg || '#fff', border: `1px solid ${error ? '#ef4444' : theme?.input_border || '#e5e7eb'}`, borderRadius: radius }
  const dropStyle = { backgroundColor: theme?.dropdown_bg || '#fff', border: `1px solid ${theme?.dropdown_border || '#e5e7eb'}`, borderRadius: radius }

  const [query, setQuery] = useState(value || '')
  const [results, setResults] = useState<PincodeResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
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

  const resolveAndFill = async (row: PincodeResult, clearArea = false) => {
    setLoading(true)
    const [city_name, district_name, state_name] = await Promise.all([
      getLocationName(row.city_id, API),
      getLocationName(row.district_id, API),
      getLocationName(row.state_id, API),
    ])
    onAutoFill({ pincode: row.pincode, area: clearArea ? '' : row.area, city_id: row.city_id, city_name, district_id: row.district_id, district_name, state_id: row.state_id, state_name, country_id: row.country_id })
    setLoading(false)
  }

  const selectPincode = async (row: PincodeResult) => {
    setQuery(row.pincode); onChange(row.pincode); setOpen(false)
    const matching = results.filter(r => r.pincode === row.pincode)
    if (matching.length > 1) { await resolveAndFill(matching[0], true); onMultipleAreas(matching) }
    else await resolveAndFill(row)
  }

  const addNewPincode = () => setOpen(false)

  // Runs when the user leaves the Pincode field. Auto-fills everything if
  // there's exactly one match. If several areas share this pincode, City/
  // District/State/Country auto-fill right away (they're the same for all
  // of them), and the list of areas is handed up to AddressBlock so it can
  // show the picker right under its own Area field.
  const resolveOnBlur = async () => {
    const q = query.trim()
    if (q.length < 6) return
    const res = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'search_pincodes', query: q }) })
    const json = await res.json()
    const matching = (json.data || []).filter((r: PincodeResult) => r.pincode === q)
    if (matching.length === 1) await resolveAndFill(matching[0])
    else if (matching.length > 1) { await resolveAndFill(matching[0], true); onMultipleAreas(matching) }
  }

  const uniquePincodes = results.filter((r, i, arr) => arr.findIndex(x => x.pincode === r.pincode) === i)
  const showAddPincode = query.trim().length > 0 && !uniquePincodes.find(r => r.pincode === query.trim())

  return (
    <div className="flex flex-col gap-1" ref={ref}>
      <label className="text-xs text-gray-500">Pincode {required && <span className="text-red-500">*</span>}</label>
      <div className="relative">
        <input value={query} onChange={e => search(e.target.value)} onBlur={resolveOnBlur}
          placeholder="e.g. 600001" className="w-full h-10 px-3 text-sm focus:outline-none" style={inputStyle} />
        {loading && <div className="absolute right-3 top-3 w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />}

        {open && (uniquePincodes.length > 0 || showAddPincode) && (
          <div className="absolute z-20 w-full mt-1 shadow-lg max-h-48 overflow-y-auto" style={dropStyle}>
            {uniquePincodes.map(r => (
              <div key={r.id} onMouseDown={e => { e.preventDefault(); selectPincode(r) }}
                className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-50">
                {r.pincode}
              </div>
            ))}
            {showAddPincode && (
              <div onMouseDown={e => { e.preventDefault(); addNewPincode() }}
                className="px-3 py-2.5 text-sm cursor-pointer text-blue-600 hover:bg-blue-50 font-medium border-t border-gray-100">
                + Add "{query.trim()}"
              </div>
            )}
          </div>
        )}
      </div>

      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
}