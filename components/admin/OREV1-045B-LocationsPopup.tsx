'use client'
import { useState, useEffect } from 'react'

interface Location { id?: string; name: string; level: string; code: string; timezone: string; parent_id?: string; district_id?: string; country_id: string; is_active: boolean }
interface Country { id: string; name: string; timezones?: string[] }
interface ParentOption { id: string; name: string }
interface Props { location?: Location | null; countries: Country[]; onClose: () => void; onSaved: () => void }

interface Props { location?: Location | null; countries: Country[]; onClose: () => void; onSaved: () => void; theme?: any }

export default function OREV1_045B_LocationsPopup({ location, countries = [], onClose, onSaved, theme }: Props) {
  const isEdit = !!location?.id
  const radius = theme?.global_border_radius || '12px'
  const textPrimary = theme?.color_text_primary || '#111827'
  const primaryBtn = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }
  const outlineBtn = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }
  const [form, setForm] = useState<Location>({
  name: location?.name ?? '',
  level: location?.level ?? 'state',
  code: location?.code ?? '',
  timezone: location?.timezone ?? '',
  country_id: location?.country_id ?? '',
  parent_id: location?.parent_id ?? '',
  is_active: location?.is_active ?? true,
})
  const [parents, setParents] = useState<ParentOption[]>([])
  const [districts, setDistricts] = useState<ParentOption[]>([])
  const [timezones, setTimezones] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

useEffect(() => {
  fetch('/admin/setup/countries/api')
    .then(r => r.json())
    .then(j => {
      const allTz = [...new Set((j.countries || []).flatMap((c: any) => c.timezones || []))]
      setTimezones((allTz as string[]).sort())
    })
}, [])

  useEffect(() => {
    if (form.country_id && (form.level === 'district' || form.level === 'city')) {
      fetch(`/admin/setup/locations/api?country_id=${form.country_id}&level=state&limit=200`)
        .then(r => r.json()).then(j => setParents(j.data || []))
    } else { setParents([]) }
  }, [form.country_id, form.level])

  useEffect(() => {
    if (form.level === 'city' && form.parent_id && form.country_id) {
      fetch(`/admin/setup/locations/api?country_id=${form.country_id}&level=district&limit=200`)
        .then(r => r.json()).then(j => setDistricts(j.data || []))
    } else { setDistricts([]) }
  }, [form.parent_id, form.level, form.country_id])

  function set(field: string, val: string | boolean) {
    setForm(f => ({ ...f, [field]: val }))
  }

  async function handleSave() {
    if (!form.name || !form.country_id) { setError('Name and country are required'); return }
    setSaving(true); setError('')
    const method = isEdit ? 'PATCH' : 'POST'
    const { district_id, ...formData } = form as any
    const cleanedForm = Object.fromEntries(
      Object.entries(formData).map(([k, v]) => [k, v === '' ? null : v])
    )
    const body = isEdit ? { id: location!.id, ...cleanedForm } : cleanedForm
    const res = await fetch('/admin/setup/locations/api', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const json = await res.json()
    setSaving(false)
    if (json.error) { setError(json.error); return }
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl border border-gray-100 w-full max-w-lg mx-4 p-6">

        <div className="flex justify-center mb-6">
          <h2 style={{ color: textPrimary }} className="text-lg font-semibold">{isEdit ? 'Edit Location' : 'Add Location'}</h2>
        </div>

        {error && <p className="text-sm text-red-600 mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-2">{error}</p>}

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Country</label>
            <select value={form.country_id} onChange={e => set('country_id', e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-blue-400">
              <option value="">Select country</option>
              {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Level</label>
            <select value={form.level} onChange={e => set('level', e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-blue-400">
              <option value="state">State</option>
              <option value="district">District</option>
              <option value="city">City</option>
            </select>
          </div>
        </div>

        {(form.level === 'district' || form.level === 'city') && (
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">State (required)</label>
              <select value={form.parent_id || ''} onChange={e => set('parent_id', e.target.value)}
                className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-blue-400">
                <option value="">Select state</option>
                {parents.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            {form.level === 'city' && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">District (optional)</label>
                <select value={form.district_id || ''} onChange={e => set('district_id', e.target.value)}
                  className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-blue-400">
                  <option value="">— if applicable —</option>
                  {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Location Name</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Tamil Nadu"
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-blue-400" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Code</label>
            <input value={form.code} onChange={e => set('code', e.target.value)} placeholder="e.g. TN"
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-blue-400" />
          </div>
        </div>

        <div className="flex flex-col gap-1 mb-4">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Timezone</label>
          <select value={form.timezone} onChange={e => set('timezone', e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-blue-400">
            <option value="">Select timezone</option>
            {timezones.map(tz => <option key={tz} value={tz}>{tz}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2 mb-6 text-sm text-gray-600">
          <input type="checkbox" checked={!!form.is_active} onChange={e => set('is_active', e.target.checked)} id="loc-active" />
          <label htmlFor="loc-active">Active</label>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button onClick={onClose} style={outlineBtn}
            className="text-sm font-medium px-6 py-2.5 transition">
            ← Back
          </button>
          <button onClick={handleSave} disabled={saving} style={primaryBtn}
            className="text-sm font-medium px-6 py-2.5 transition disabled:opacity-60">
            {saving ? 'Saving...' : isEdit ? 'Update Location' : 'Save Location'}
          </button>
        </div>

      </div>
    </div>
  )
}
