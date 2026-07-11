'use client'
import { useState, useEffect } from 'react'
import { useTheme } from '@/lib/ThemeContext'

type Filters = { country_id: string; state_id: string; district_id: string; city_id: string; search: string }
type Option = { id: string; name: string }
type Props = { filters: Filters; countries: Option[]; onFilterChange: (f: Filters) => void }

export default function OREV1046CToolbar({ filters, countries, onFilterChange }: Props) {
  const { theme } = useTheme()
  const [pending, setPending] = useState<Filters>(filters)
  const [states, setStates] = useState<Option[]>([])
  const [districts, setDistricts] = useState<Option[]>([])
  const [cities, setCities] = useState<Option[]>([])

  const radius = theme?.global_border_radius || '12px'
  const dropdownStyle = { backgroundColor: theme?.dropdown_bg || '#fff', border: `1px solid ${theme?.dropdown_border || '#e5e7eb'}`, borderRadius: radius, color: theme?.color_text_secondary || '#4b5563' }
  const inputStyle = { backgroundColor: theme?.input_bg || '#fff', border: `1px solid ${theme?.input_border || '#e5e7eb'}`, borderRadius: radius, color: theme?.color_text_primary || '#111827' }
  const outlineBtn = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }
  const primaryBtn = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }

  const fetchLocs = async (level: string, parent_id: string, country_id: string, setter: (d: Option[]) => void) => {
    const params = new URLSearchParams({ type: 'locations', level, country_id })
    if (parent_id) params.set('parent_id', parent_id)
    const res = await fetch(`/admin/setup/pincodes/api?${params}`)
    const json = await res.json()
    setter(json.data || [])
  }

  const handleCountry = (country_id: string) => {
    setStates([]); setDistricts([]); setCities([])
    setPending(p => ({ ...p, country_id, state_id: '', district_id: '', city_id: '' }))
    if (country_id) fetchLocs('state', '', country_id, setStates)
  }

  const handleState = (state_id: string) => {
    setDistricts([]); setCities([])
    setPending(p => ({ ...p, state_id, district_id: '', city_id: '' }))
    if (state_id) fetchLocs('district', state_id, pending.country_id, setDistricts)
  }

  const handleDistrict = (district_id: string) => {
    setCities([])
    setPending(p => ({ ...p, district_id, city_id: '' }))
    if (district_id) fetchLocs('city', district_id, pending.country_id, setCities)
  }

  const handleSearch = () => onFilterChange(pending)

  const handleReset = () => {
    setStates([]); setDistricts([]); setCities([])
    const empty = { country_id: '', state_id: '', district_id: '', city_id: '', search: '' }
    setPending(empty)
    onFilterChange(empty)
  }

  return (
    <div className="space-y-3 mb-4">
      <div className="flex md:grid md:grid-cols-4 gap-2 md:gap-3 overflow-x-auto">
        <select value={pending.country_id} onChange={e => handleCountry(e.target.value)} style={dropdownStyle} className="shrink-0 md:w-full w-36 text-xs md:text-sm px-3 md:px-4 py-2 md:py-2.5 transition hover:opacity-90">
          <option value="">All Countries</option>
          {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={pending.state_id} onChange={e => handleState(e.target.value)} style={dropdownStyle} className="shrink-0 md:w-full w-36 text-xs md:text-sm px-3 md:px-4 py-2 md:py-2.5 transition hover:opacity-90" disabled={!states.length}>
          <option value="">All States</option>
          {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={pending.district_id} onChange={e => handleDistrict(e.target.value)} style={dropdownStyle} className="shrink-0 md:w-full w-36 text-xs md:text-sm px-3 md:px-4 py-2 md:py-2.5 transition hover:opacity-90" disabled={!districts.length}>
          <option value="">All Districts</option>
          {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select value={pending.city_id} onChange={e => setPending(p => ({ ...p, city_id: e.target.value }))} style={dropdownStyle} className="shrink-0 md:w-full w-36 text-xs md:text-sm px-3 md:px-4 py-2 md:py-2.5 transition hover:opacity-90" disabled={!cities.length}>
          <option value="">All Cities</option>
          {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div className="flex items-center gap-1.5">
        <input value={pending.search} onChange={e => setPending(p => ({ ...p, search: e.target.value }))}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder="Search by pincode..." style={inputStyle}
          className="flex-1 min-w-0 text-xs md:text-sm px-3 md:px-4 py-2 md:py-2.5 focus:outline-none" />
        <button onClick={handleReset} style={outlineBtn} className="shrink-0 text-xs md:text-sm font-medium px-3 md:px-5 py-2 md:py-2.5 transition hover:opacity-90">Reset</button>
        <button onClick={handleSearch} style={primaryBtn} className="shrink-0 text-xs md:text-sm font-medium px-3 md:px-5 py-2 md:py-2.5 transition hover:opacity-90">Search</button>
      </div>
    </div>
  )
}