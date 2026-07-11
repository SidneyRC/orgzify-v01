'use client'
import { useState } from 'react'

interface Country { id: string; name: string }
interface Props {
  countries?: Country[]
  onSearch: (filters: { country_id: string; level: string; search: string }) => void
  theme?: any
}

export default function OREV1_045C_LocationsToolbar({ countries = [], onSearch, theme }: Props) {
  const [country_id, setCountryId] = useState('')
  const [level, setLevel] = useState('')
  const [search, setSearch] = useState('')

  const radius = theme?.global_border_radius || '12px'
  const primaryBtn = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }
  const outlineBtn = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }

  function handleSearch() {
    onSearch({ country_id, level, search })
  }

  function handleReset() {
    setCountryId(''); setLevel(''); setSearch('')
    onSearch({ country_id: '', level: '', search: '' })
  }

  return (
    <div className="mb-4">
      <div className="grid grid-cols-2 gap-3 mb-3">
        <select value={country_id} onChange={e => setCountryId(e.target.value)} style={outlineBtn}
          className="w-full text-xs md:text-sm px-3 md:px-4 py-2 md:py-2.5 transition">
          <option value="">All countries</option>
          {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <select value={level} onChange={e => setLevel(e.target.value)} style={outlineBtn}
          className="w-full text-xs md:text-sm px-3 md:px-4 py-2 md:py-2.5 transition">
          <option value="">All levels</option>
          <option value="state">State</option>
          <option value="district">District</option>
          <option value="city">City</option>
        </select>
      </div>

      <div className="flex items-center gap-1.5">
        <input value={search} onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder="Search name..."
          className="flex-1 min-w-0 border border-gray-200 rounded-xl px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm text-gray-700 focus:outline-none focus:border-blue-400" />

        <button onClick={handleReset} style={outlineBtn}
          className="shrink-0 text-xs md:text-sm font-medium px-3 md:px-5 py-2 md:py-2.5 transition">
          Reset
        </button>

        <button onClick={handleSearch} style={primaryBtn}
          className="shrink-0 text-xs md:text-sm font-medium px-3 md:px-5 py-2 md:py-2.5 transition">
          Search
        </button>
      </div>
    </div>
  )
}