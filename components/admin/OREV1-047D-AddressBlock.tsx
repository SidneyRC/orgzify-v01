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

type Props = {
  title: string
  values: AddressData
  onChange: (val: AddressData) => void
  errors: Record<string, string>
  prefix: string
}

const EMPTY: AddressData = {
  pincode: '', area: '', line1: '', line2: '',
  city_id: '', city_name: '', district_id: '', district_name: '',
  state_id: '', state_name: '', country_id: '', landmark: ''
}
export const emptyAddress = (): AddressData => ({ ...EMPTY })

const API = '/admin/setup/companies/new/api'

export default function OREV1047DAddressBlock({ title, values, onChange, errors, prefix }: Props) {
  const { theme } = useTheme()
  const radius = theme?.global_border_radius || '12px'
  const inputStyle = (hasErr: boolean) => ({
    backgroundColor: theme?.input_bg || '#fff',
    border: `1px solid ${hasErr ? '#ef4444' : theme?.input_border || '#e5e7eb'}`,
    borderRadius: radius
  })
  const [countries, setCountries] = useState<{ id: string; name: string }[]>([])

  // Load countries on mount so autofill from pincode works immediately
  useEffect(() => {
    fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'get_countries' }) })
      .then(r => r.json()).then(j => setCountries(j.data || []))
  }, [])

  const set = (patch: Partial<AddressData>) => onChange({ ...values, ...patch })

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
          error={errors[`${prefix}_pincode`]}
          onAutoFill={d => set({
            pincode: d.pincode, area: d.area, city_id: d.city_id, city_name: d.city_name,
            district_id: d.district_id, district_name: d.district_name,
            state_id: d.state_id, state_name: d.state_name, country_id: d.country_id
          })}
        />

        {field('Area', 'area', 'e.g. Anna Nagar', true)}
        {field('Address Line 1', 'line1', 'Street, building, floor', true)}
        {field('Address Line 2', 'line2', 'Flat no, suite etc.')}

        <OREV1047DLocationTypeahead label="City" level="city" required
          parent_id={values.district_id || null} country_id={values.country_id || null}
          value={values.city_id ? { id: values.city_id, name: values.city_name } : null}
          onChange={v => set({ city_id: v?.id || '', city_name: v?.name || '' })}
          error={errors[`${prefix}_city_id`]}
        />

        <OREV1047DLocationTypeahead label="District" level="district"
          parent_id={values.state_id || null} country_id={values.country_id || null}
          value={values.district_id ? { id: values.district_id, name: values.district_name } : null}
          onChange={v => set({ district_id: v?.id || '', district_name: v?.name || '' })}
          error={errors[`${prefix}_district_id`]}
        />

        <OREV1047DLocationTypeahead label="State" level="state" required
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
