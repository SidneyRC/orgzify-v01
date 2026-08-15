'use client'
import { useState, useEffect } from 'react'
import { useTheme } from '@/lib/ThemeContext'
import OREV1047DPincodeTypeahead from '@/components/admin/OREV1-047D-PincodeTypeahead'
import OREV1047DLocationTypeahead from '@/components/admin/OREV1-047D-LocationTypeahead'

export type AddressData = {
  pincode: string; area: string; line1: string; line2: string
  city_id: string; city_name: string; district_id: string; district_name: string
  state_id: string; state_name: string; country_id: string; landmark: string
}

type AreaOption = { id: string; pincode: string; area: string }

type Props = {
  title: string
  values: AddressData
  onChange: (val: AddressData) => void
  errors: Record<string, string>
  prefix: string
  apiBase?: string
}

const EMPTY: AddressData = {
  pincode: '', area: '', line1: '', line2: '',
  city_id: '', city_name: '', district_id: '', district_name: '',
  state_id: '', state_name: '', country_id: '', landmark: ''
}
export const emptyAddress = (): AddressData => ({ ...EMPTY })

const DEFAULT_API = '/admin/shared/address/api'

export default function OREV1047DAddressBlock({ title, values, onChange, errors, prefix, apiBase }: Props) {
  const { theme } = useTheme()
  const API = apiBase || DEFAULT_API
  const radius = theme?.global_border_radius || '12px'
  const dropStyle = { backgroundColor: theme?.dropdown_bg || '#fff', border: `1px solid ${theme?.dropdown_border || '#e5e7eb'}`, borderRadius: radius }
  const highlightBg = theme?.dropdown_hover_bg || '#f9fafb'
  const inputStyle = (hasErr: boolean) => ({
    backgroundColor: theme?.input_bg || '#fff',
    border: `1px solid ${hasErr ? '#ef4444' : theme?.input_border || '#e5e7eb'}`,
    borderRadius: radius
  })
  const [countries, setCountries] = useState<{ id: string; name: string }[]>([])
  const [areaOptions, setAreaOptions] = useState<AreaOption[]>([])
  const [areaActiveIndex, setAreaActiveIndex] = useState(-1)

  useEffect(() => {
    fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'get_countries' }) })
      .then(r => r.json()).then(j => setCountries(j.data || []))
  }, [])

  const set = (patch: Partial<AddressData>) => onChange({ ...values, ...patch })

  const selectArea = (r: AreaOption) => { set({ area: r.area }); setAreaOptions([]); setAreaActiveIndex(-1) }
  const addNewArea = () => { set({ area: values.area }); setAreaOptions([]); setAreaActiveIndex(-1) }

  // Keyboard navigation for the Area dropdown: Down/Up highlight through the
  // area matches (then the "+ Add new area" row last), Enter picks the
  // highlighted one, Escape closes it. Mirrors PincodeTypeahead's fix.
  const areaListLength = areaOptions.length + 1
  const handleAreaKeyDown = (e: React.KeyboardEvent) => {
    if (areaOptions.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setAreaActiveIndex(i => (i + 1) % areaListLength) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setAreaActiveIndex(i => (i - 1 + areaListLength) % areaListLength) }
    else if (e.key === 'Enter') {
      e.preventDefault()
      if (areaActiveIndex < 0) return
      if (areaActiveIndex < areaOptions.length) selectArea(areaOptions[areaActiveIndex])
      else addNewArea()
    } else if (e.key === 'Escape') { setAreaOptions([]); setAreaActiveIndex(-1) }
  }

// Looks up District/State/Country above a picked City or District,
  // so directly selecting one auto-fills the rest — same behavior as Pincode.
  // When City changes, District/State must be re-derived from scratch (not
  // left over from before) — otherwise a stale District can stick around
  // if the new City's chain lookup doesn't return one.
  const fillParentChain = async (base: AddressData, source: 'city' | 'district') => {
    const startId = base.city_id || base.district_id
    if (!startId) { onChange(base); return }

    const cleared = source === 'city'
      ? { ...base, district_id: '', district_name: '', state_id: '', state_name: '' }
      : base
    onChange(cleared)

    const res = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'get_location_chain', id: startId }) })
    const json = await res.json()
    const chain = json.data
    if (!chain) return

    onChange({
      ...cleared,
      district_id: chain.district?.id || cleared.district_id,
      district_name: chain.district?.name || cleared.district_name,
      state_id: chain.state?.id || cleared.state_id,
      state_name: chain.state?.name || cleared.state_name,
      country_id: chain.country_id || cleared.country_id
    })
  }

  const field = (label: string, key: keyof AddressData, placeholder: string, required = false) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-500">{label} {required && <span className="text-red-500">*</span>}</label>
      <input value={values[key] as string} onChange={e => set({ [key]: e.target.value })}
        placeholder={placeholder} className="h-10 px-3 text-sm focus:outline-none w-full"
        style={inputStyle(!!errors[`${prefix}_${key}`])} />
      {errors[`${prefix}_${key}`] && <span className="text-xs text-red-500">{errors[`${prefix}_${key}`]}</span>}
    </div>
  )

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-semibold text-gray-700">{title}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        <OREV1047DPincodeTypeahead
          value={values.pincode} onChange={v => set({ pincode: v })} required
          error={errors[`${prefix}_pincode`]} apiBase={API}
          onAutoFill={d => set({
            pincode: d.pincode, area: d.area, city_id: d.city_id, city_name: d.city_name,
            district_id: d.district_id, district_name: d.district_name,
            state_id: d.state_id, state_name: d.state_name, country_id: d.country_id
          })}
          onMultipleAreas={rows => setAreaOptions(rows)}
        />

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Area <span className="text-red-500">*</span></label>
          <input value={values.area} onChange={e => { set({ area: e.target.value }); setAreaOptions([]); setAreaActiveIndex(-1) }}
            onKeyDown={handleAreaKeyDown}
            placeholder="e.g. Anna Nagar" className="h-10 px-3 text-sm focus:outline-none w-full"
            style={inputStyle(!!errors[`${prefix}_area`])} />
          {areaOptions.length > 0 && (
            <div className="relative">
              <div className="absolute z-20 w-full shadow-lg max-h-48 overflow-y-auto" style={dropStyle}>
                {areaOptions.map((r, i) => (
                  <div key={r.id} onMouseDown={e => { e.preventDefault(); selectArea(r) }}
                    onMouseEnter={() => setAreaActiveIndex(i)}
                    className="px-3 py-2 text-sm cursor-pointer"
                    style={{ backgroundColor: areaActiveIndex === i ? highlightBg : undefined }}>{r.area}</div>
                ))}
                <div onMouseDown={e => { e.preventDefault(); addNewArea() }}
                  onMouseEnter={() => setAreaActiveIndex(areaOptions.length)}
                  className="px-3 py-2 text-sm cursor-pointer text-blue-600 font-medium border-t border-gray-100"
                  style={{ backgroundColor: areaActiveIndex === areaOptions.length ? highlightBg : undefined }}>
                  + Add new area for {values.pincode}
                </div>
              </div>
            </div>
          )}
          {errors[`${prefix}_area`] && <span className="text-xs text-red-500">{errors[`${prefix}_area`]}</span>}
        </div>

        {field('Address Line 1', 'line1', 'Street, building, floor', true)}
        {field('Address Line 2', 'line2', 'Flat no, suite etc.')}

        <OREV1047DLocationTypeahead label="City" level="city" required apiBase={API}
          parent_id={values.district_id || null} country_id={values.country_id || null}
          value={values.city_id ? { id: values.city_id, name: values.city_name } : null}
          onChange={v => fillParentChain({ ...values, city_id: v?.id || '', city_name: v?.name || '' }, 'city')}
          error={errors[`${prefix}_city_id`]}
        />

          <OREV1047DLocationTypeahead label="District" level="district" apiBase={API}
          parent_id={values.state_id || null} country_id={values.country_id || null}
          value={values.district_id ? { id: values.district_id, name: values.district_name } : null}
          onChange={v => fillParentChain({ ...values, district_id: v?.id || '', district_name: v?.name || '' }, 'district')}
          error={errors[`${prefix}_district_id`]}
        />

        <OREV1047DLocationTypeahead label="State" level="state" required apiBase={API}
          country_id={values.country_id || null}
          value={values.state_id ? { id: values.state_id, name: values.state_name } : null}
          onChange={v => set({ state_id: v?.id || '', state_name: v?.name || '' })}
          error={errors[`${prefix}_state_id`]}
        />

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Country <span className="text-red-500">*</span></label>
          <select value={values.country_id} onChange={e => set({ country_id: e.target.value })}
            className="h-10 px-3 text-sm focus:outline-none w-full"
            style={inputStyle(!!errors[`${prefix}_country_id`])}>
            <option value="">Select country</option>
            {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {errors[`${prefix}_country_id`] && <span className="text-xs text-red-500">{errors[`${prefix}_country_id`]}</span>}
        </div>

        {field('Landmark', 'landmark', 'Near, opposite, beside…')}
      </div>
    </div>
  )
}
