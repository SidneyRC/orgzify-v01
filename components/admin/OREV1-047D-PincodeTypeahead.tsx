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
  const highlightBg = theme?.dropdown_hover_bg || '#f9fafb'

  const [query, setQuery] = useState(value || '')
  const [results, setResults] = useState<PincodeResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const search = async (q: string) => {
    setQuery(q); onChange(q); setActiveIndex(-1)
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
    setQuery(row.pincode); onChange(row.pincode); setOpen(false); setActiveIndex(-1)
    const matching = results.filter(r => r.pincode === row.pincode)
    if (matching.length > 1) { await resolveAndFill(matching[0], true); onMultipleAreas(matching) }
    else await resolveAndFill(row)
  }

  const addNewPincode = () => { setOpen(false); setActiveIndex(-1) }

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
  const listLength = uniquePincodes.length + (showAddPincode ? 1 : 0)

  // Keyboard navigation: Down/Up move a highlight through the list
  // (pincode rows, then the "+ Add" row last), Enter picks whatever is
  // highlighted, Escape closes the list without picking anything.
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || listLength === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => (i + 1) % listLength) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(i => (i - 1 + listLength) % listLength) }
    else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIndex < 0) return
      if (activeIndex < uniquePincodes.length) selectPincode(uniquePincodes[activeIndex])
      else addNewPincode()
    } else if (e.key === 'Escape') { setOpen(false); setActiveIndex(-1) }
  }

  return (
    <div className="flex flex-col gap-1" ref={ref}>
      <label className="text-xs text-gray-500">Pincode {required && <span className="text-red-500">*</span>}</label>
      <div className="relative">
        <input value={query} onChange={e => search(e.target.value)} onBlur={resolveOnBlur} onKeyDown={handleKeyDown}
          placeholder="e.g. 600001" className="w-full h-10 px-3 text-sm focus:outline-none" style={inputStyle} />
        {loading && <div className="absolute right-3 top-3 w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />}

        {open && (uniquePincodes.length > 0 || showAddPincode) && (
          <div className="absolute z-20 w-full mt-1 shadow-lg max-h-48 overflow-y-auto" style={dropStyle}>
            {uniquePincodes.map((r, i) => (
              <div key={r.id} onMouseDown={e => { e.preventDefault(); selectPincode(r) }} onMouseEnter={() => setActiveIndex(i)}
                className="px-3 py-2 text-sm cursor-pointer" style={{ backgroundColor: activeIndex === i ? highlightBg : undefined }}>
                {r.pincode}
              </div>
            ))}
            {showAddPincode && (
              <div onMouseDown={e => { e.preventDefault(); addNewPincode() }} onMouseEnter={() => setActiveIndex(uniquePincodes.length)}
                className="px-3 py-2.5 text-sm cursor-pointer text-blue-600 font-medium border-t border-gray-100"
                style={{ backgroundColor: activeIndex === uniquePincodes.length ? highlightBg : undefined }}>
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
