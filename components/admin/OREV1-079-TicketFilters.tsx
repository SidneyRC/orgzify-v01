'use client'
import { useState, useEffect } from 'react'
import { useTheme } from '@/lib/ThemeContext'
import OREV1065SearchSelect from '@/components/admin/OREV1-065-SearchSelect'
import OREV1047DLocationTypeahead from '@/components/admin/OREV1-047D-LocationTypeahead'

export type TicketFilterValues = { search: string; sub_category: string; status: string; country_id: string; state_id: string; city_id: string; reporting_company_id: string }
const EMPTY: TicketFilterValues = { search: '', sub_category: '', status: '', country_id: '', state_id: '', city_id: '', reporting_company_id: '' }

type Props = { onSearch: (f: TicketFilterValues) => void; onReset: () => void }

export default function OREV1079TicketFilters({ onSearch, onReset }: Props) {
  const { theme } = useTheme()
  const radius = theme?.global_border_radius || '12px'
  const primaryBtn = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }
  const outlineBtn = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }
  const selectClass = "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white h-10"

  const [f, setF] = useState<TicketFilterValues>(EMPTY)
  const [stateVal, setStateVal] = useState<{ id: string; name: string } | null>(null)
  const [cityVal, setCityVal] = useState<{ id: string; name: string } | null>(null)
  const [statuses, setStatuses] = useState<{ code: string; label: string }[]>([])
  const [subCategories, setSubCategories] = useState<string[]>([])
  const [countries, setCountries] = useState<{ id: string; name: string }[]>([])
  const [companies, setCompanies] = useState<{ id: string; display_name: string }[]>([])

  useEffect(() => {
    fetch('/admin/ecosystem/support/api?type=meta').then(r => r.json()).then(j => { setStatuses(j.statuses || []); setSubCategories(j.subCategories || []) })
    fetch('/admin/shared/address/api', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'get_countries' }) })
      .then(r => r.json()).then(j => setCountries(j.data || []))
    fetch('/admin/setup/companies/api?type=active_companies').then(r => r.json()).then(j => setCompanies(j.data || []))
  }, [])

  const set = (patch: Partial<TicketFilterValues>) => setF(prev => ({ ...prev, ...patch }))
  const handleReset = () => { setF(EMPTY); onReset() }

  const countryOptions = countries.map(c => ({ id: c.id, label: c.name }))
  const companyOptions = companies.map(c => ({ id: c.id, label: c.display_name }))

  return (
    <div className="flex flex-col gap-3 mb-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        <select value={f.sub_category} onChange={e => set({ sub_category: e.target.value })} className={selectClass}>
          <option value="">All Sub-categories</option>
          {subCategories.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={f.status} onChange={e => set({ status: e.target.value })} className={selectClass}>
          <option value="">All Statuses</option>
          {statuses.map(s => <option key={s.code} value={s.code}>{s.label}</option>)}
        </select>
        <OREV1065SearchSelect options={companyOptions} value={f.reporting_company_id} onChange={v => set({ reporting_company_id: v })} placeholder="All Reporting Offices" />
        <OREV1065SearchSelect options={countryOptions} value={f.country_id} onChange={v => set({ country_id: v })} placeholder="All Countries" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <OREV1047DLocationTypeahead label="" level="state" placeholder="Search State" value={stateVal} onChange={v => { setStateVal(v); set({ state_id: v?.id || '' }) }} />
        <OREV1047DLocationTypeahead label="" level="city" placeholder="Search City" value={cityVal} onChange={v => { setCityVal(v); set({ city_id: v?.id || '' }) }} />
      </div>
      <div className="flex gap-2 items-center">
        <input value={f.search} onChange={e => set({ search: e.target.value })}
          onKeyDown={e => { if (e.key === 'Enter') onSearch(f) }}
          placeholder="Search by Entity Name or Process ID…"
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-400" />
        <button onClick={handleReset} style={outlineBtn} className="text-sm font-medium px-4 py-2 hover:opacity-90">Reset</button>
        <button onClick={() => onSearch(f)} style={primaryBtn} className="text-sm font-medium px-4 py-2 hover:opacity-90">Search</button>
      </div>
    </div>
  )
}