'use client'
import { useState, useEffect } from 'react'
import { useTheme } from '@/lib/ThemeContext'
import toast from 'react-hot-toast'
import type { PincodeRow } from '@/components/admin/OREV1-046-PincodesPage'

type Option = { id: string; name: string }
type Props = { editRow: PincodeRow | null; countries: Option[]; onClose: () => void; onSaved: () => void }

function LocationTypeahead({ label, value, options, onSelect, onAddNew, disabled, allowAdd = true }: {
  label: string; value: string; options: Option[]
  onSelect: (id: string, name: string) => void
  onAddNew?: (name: string) => void
  disabled?: boolean
  allowAdd?: boolean
}) {
  const [search, setSearch] = useState(value)
  const [open, setOpen] = useState(false)
  useEffect(() => { setSearch(value) }, [value])
  const filtered = options.filter(o => o.name.toLowerCase().includes(search.toLowerCase()))
  const exactMatch = options.some(o => o.name.toLowerCase() === search.toLowerCase())
  const showAdd = allowAdd && search.length > 0 && !exactMatch && !disabled

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</label>
      <div className="relative">
        <input type="text" value={search} disabled={disabled}
          placeholder={disabled ? 'Select previous field first' : `Search ${label}...`}
          onChange={e => { setSearch(e.target.value); setOpen(true) }}
          onFocus={() => { setOpen(true) }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none bg-white transition-colors ${open ? 'border-blue-400' : 'border-gray-200'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
        {open && !disabled && (filtered.length > 0 || showAdd) && (
          <div className="absolute z-30 w-full bg-white border border-gray-200 rounded-xl mt-1 shadow-md overflow-hidden max-h-48 overflow-y-auto">
            {filtered.slice(0, 8).map(o => (
              <button key={o.id} onMouseDown={() => { onSelect(o.id, o.name); setSearch(o.name); setOpen(false) }}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-50 last:border-0">
                {o.name}
              </button>
            ))}
            {showAdd && (
              <button onMouseDown={() => { onAddNew?.(search); setOpen(false) }}
                className="w-full text-left px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50 border-t border-gray-100">
                + Add &quot;{search}&quot;
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function OREV1046BPopup({ editRow, countries, onClose, onSaved }: Props) {
  const { theme } = useTheme()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [allCountries, setAllCountries] = useState<Option[]>([])
  const [states, setStates] = useState<Option[]>([])
  const [districts, setDistricts] = useState<Option[]>([])
  const [cities, setCities] = useState<Option[]>([])
  const [form, setForm] = useState({
    pincode: '', area: '',
    country_id: '', country_name: '',
    state_id: '', state_name: '',
    district_id: '', district_name: '',
    city_id: '', city_name: '',
    is_verified: false, is_active: true
  })

  const radius = theme?.global_border_radius || '12px'
  const inputStyle = { backgroundColor: theme?.input_bg || '#fff', border: `1px solid ${theme?.input_border || '#e5e7eb'}`, borderRadius: radius, color: theme?.color_text_primary || '#111827' }
  const outlineBtn = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }
  const primaryBtn = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }

  // Fetch ALL countries from country_master for popup
  useEffect(() => {
    fetch('/admin/setup/pincodes/api?type=all_countries')
      .then(r => r.json()).then(j => setAllCountries(j.data || []))
  }, [])

  useEffect(() => {
    if (editRow) {
      setForm({
        pincode: editRow.pincode, area: editRow.area || '',
        country_id: editRow.country?.id || '', country_name: editRow.country?.name || '',
        state_id: editRow.state?.id || '', state_name: editRow.state?.name || '',
        district_id: editRow.district?.id || '', district_name: editRow.district?.name || '',
        city_id: editRow.city?.id || '', city_name: editRow.city?.name || '',
        is_verified: editRow.is_verified, is_active: editRow.is_active
      })
    }
  }, [editRow])

  const fetchLocs = async (level: string, parent_id: string, country_id: string, setter: (d: Option[]) => void) => {
    const params = new URLSearchParams({ type: 'locations', level, country_id })
    if (parent_id) params.set('parent_id', parent_id)
    const res = await fetch(`/admin/setup/pincodes/api?${params}`)
    const json = await res.json()
    setter(json.data || [])
  }

  useEffect(() => {
    if (form.country_id) { fetchLocs('state', '', form.country_id, setStates); setDistricts([]); setCities([]) }
  }, [form.country_id])

  useEffect(() => {
    if (form.state_id) { fetchLocs('district', form.state_id, form.country_id, setDistricts); setCities([]) }
  }, [form.state_id])

  useEffect(() => {
    if (form.district_id) { fetchLocs('city', form.district_id, form.country_id, setCities) }
  }, [form.district_id])

  const handleAddLocation = async (name: string, level: string, parent_id: string) => {
    const res = await fetch('/admin/setup/pincodes/api', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'add_location', name, level, parent_id, country_id: form.country_id }) })
    const json = await res.json()
    if (json.error) { toast.error('Failed to add'); return null }
    toast.success(`${level} added!`)
    return json.data as Option
  }

  const handleSave = async () => {
    if (!form.pincode.trim() || !form.country_id) { setError('Pincode and Country are required'); return }
    setSaving(true); setError('')
    const body = { pincode: form.pincode, area: form.area, country_id: form.country_id, state_id: form.state_id || null, district_id: form.district_id || null, city_id: form.city_id || null, is_verified: form.is_verified, is_active: form.is_active }
    const method = editRow ? 'PATCH' : 'POST'
    const res = await fetch('/admin/setup/pincodes/api', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editRow ? { id: editRow.id, ...body } : body) })
    const json = await res.json()
    setSaving(false)
    if (json.error) { setError(json.error); return }
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl border border-gray-100 w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-center mb-6">
          <h2 className="text-lg font-semibold text-gray-800">{editRow ? 'Edit Pincode' : 'Add Pincode'}</h2>
        </div>
        {error && <p className="text-sm mb-4 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl">{error}</p>}

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-400">Pincode *</label>
            <input value={form.pincode} onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))} placeholder="e.g. 600001" style={inputStyle} className="px-4 py-2.5 text-sm focus:outline-none" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-400">Area / Locality</label>
            <input value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))} placeholder="e.g. George Town" style={inputStyle} className="px-4 py-2.5 text-sm focus:outline-none" />
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <LocationTypeahead label="Country *" value={form.country_name} options={allCountries} allowAdd={false}
            onSelect={(id, name) => setForm(f => ({ ...f, country_id: id, country_name: name, state_id: '', state_name: '', district_id: '', district_name: '', city_id: '', city_name: '' }))} />
          <LocationTypeahead label="State" value={form.state_name} options={states} disabled={!form.country_id}
            onSelect={(id, name) => setForm(f => ({ ...f, state_id: id, state_name: name, district_id: '', district_name: '', city_id: '', city_name: '' }))}
            onAddNew={async name => { const r = await handleAddLocation(name, 'state', ''); if (r) { setStates(s => [...s, r]); setForm(f => ({ ...f, state_id: r.id, state_name: r.name })) } }} />
          <LocationTypeahead label="District" value={form.district_name} options={districts} disabled={!form.state_id}
            onSelect={(id, name) => setForm(f => ({ ...f, district_id: id, district_name: name, city_id: '', city_name: '' }))}
            onAddNew={async name => { const r = await handleAddLocation(name, 'district', form.state_id); if (r) { setDistricts(s => [...s, r]); setForm(f => ({ ...f, district_id: r.id, district_name: r.name })) } }} />
          <LocationTypeahead label="City" value={form.city_name} options={cities} disabled={!form.district_id}
            onSelect={(id, name) => setForm(f => ({ ...f, city_id: id, city_name: name }))}
            onAddNew={async name => { const r = await handleAddLocation(name, 'city', form.district_id); if (r) { setCities(s => [...s, r]); setForm(f => ({ ...f, city_id: r.id, city_name: r.name })) } }} />
        </div>

        <div className="flex items-center gap-6 mb-6 text-sm text-gray-600">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_verified} onChange={e => setForm(f => ({ ...f, is_verified: e.target.checked }))} /> Verified
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} /> Active
          </label>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button onClick={onClose} style={outlineBtn} className="text-sm font-medium px-6 py-2.5 transition hover:opacity-90">← Back</button>
          <button onClick={handleSave} disabled={saving} style={primaryBtn} className="text-sm font-medium px-6 py-2.5 transition hover:opacity-90 disabled:opacity-60">
            {saving ? 'Saving...' : editRow ? 'Update Pincode' : 'Save Pincode'}
          </button>
        </div>
      </div>
    </div>
  )
}
