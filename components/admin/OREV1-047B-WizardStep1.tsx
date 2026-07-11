'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/lib/ThemeContext'
import type { WizardData } from '@/components/admin/OREV1-047A-CompanyWizard'

const ROOT_ID = '11111111-1111-1111-1111-111111111111'
const COMPANY_TYPES = ['Owned', 'Franchise']
const BRANCH_TYPES = ['Registered Office', 'Country Office', 'Regional Office', 'Branch', 'Franchise Office']

type Props = {
  data: WizardData
  onNext: (patch: Partial<WizardData>) => void
  onSaveDraft: (patch: Partial<WizardData>) => void
  saving: boolean
}

export default function OREV1047BWizardStep1({ data, onNext, onSaveDraft, saving }: Props) {
  const { theme } = useTheme()
  const router = useRouter()
  const [form, setForm] = useState({
    legal_name: data.legal_name, display_name: data.display_name,
    slug: data.slug, company_code: (data as any).company_code || '',
    company_type: data.company_type, branch_type: data.branch_type,
    parent_company_id: data.parent_company_id || 'root',
    reporting_company_id: data.reporting_company_id || 'root',
  })
  const [companies, setCompanies] = useState<{ id: string; display_name: string }[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const radius = theme?.global_border_radius || '12px'
  const inputStyle = { backgroundColor: theme?.input_bg || '#fff', border: `1px solid ${theme?.input_border || '#e5e7eb'}`, borderRadius: radius }
  const primaryBtn = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }
  const outlineBtn = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }

  useEffect(() => {
    fetch('/admin/setup/companies/api?type=active_companies')
      .then(r => r.json()).then(j => {
        const filtered = (j.data || []).filter((c: any) => c.id !== ROOT_ID)
        setCompanies(filtered)
      })
  }, [])

  useEffect(() => {
    if (!form.display_name) return
    const slug = form.display_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    setForm(f => ({ ...f, slug }))
  }, [form.display_name])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.legal_name.trim()) e.legal_name = 'Required'
    if (!form.display_name.trim()) e.display_name = 'Required'
    if (!form.company_code.trim()) e.company_code = 'Required'
    if (!form.company_type) e.company_type = 'Required'
    if (!form.branch_type) e.branch_type = 'Required'
    if (!form.parent_company_id) e.parent_company_id = 'Required'
    if (!form.reporting_company_id) e.reporting_company_id = 'Required'
    setErrors(e); return Object.keys(e).length === 0
  }

  const f = (label: string, key: keyof typeof form, placeholder?: string) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-500">{label} <span className="text-red-500">*</span></label>
      <input value={form[key] as string} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder} className="h-10 px-3 text-sm focus:outline-none" style={inputStyle} />
      {errors[key] && <span className="text-xs text-red-500">{errors[key]}</span>}
    </div>
  )

  const sel = (label: string, key: keyof typeof form, options: string[] | { id: string; display_name: string }[], withRoot?: boolean) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-500">{label} <span className="text-red-500">*</span></label>
      <select value={form[key] as string} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        className="h-10 px-3 text-sm focus:outline-none" style={inputStyle}>
        <option value="">Select…</option>
        {withRoot && <option value="root">Root (Orgzify HQ)</option>}
        {typeof options[0] === 'string'
          ? (options as string[]).map(o => <option key={o} value={o}>{o}</option>)
          : (options as { id: string; display_name: string }[]).map(o => <option key={o.id} value={o.id}>{o.display_name}</option>)}
      </select>
      {errors[key] && <span className="text-xs text-red-500">{errors[key]}</span>}
    </div>
  )

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-4">
      <p className="text-sm font-semibold text-gray-700">Basic details</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {f('Legal name', 'legal_name', 'e.g. ORGZify')}
        {f('Display name', 'display_name', 'e.g. ORGZify - Display Name')}
        {f('Company code', 'company_code', 'e.g. QZIN01')}
        {sel('Company type', 'company_type', COMPANY_TYPES)}
        {sel('Branch type', 'branch_type', BRANCH_TYPES)}
        {sel('Parent company', 'parent_company_id', companies, true)}
        {sel('Reporting company', 'reporting_company_id', companies, true)}
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500">Slug <span className="text-red-500">*</span></label>
        <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
          className="h-10 px-3 text-sm focus:outline-none" style={inputStyle} />
        <span className="text-xs text-gray-400 italic">Auto-generated from display name. Editable.</span>
      </div>

      {/* Desktop: one row right-aligned | Mobile: row1 justified, row2 full width */}
      <div className="pt-2">
        <div className="hidden sm:flex sm:justify-end sm:gap-2">
          <button onClick={() => router.push('/admin/setup/companies')} style={outlineBtn} className="text-sm font-medium px-4 py-2.5 hover:opacity-90 transition whitespace-nowrap">✕ Close</button>
          <button onClick={() => { if (validate()) onSaveDraft(form) }} disabled={saving} style={outlineBtn} className="text-sm font-medium px-4 py-2.5 hover:opacity-90 transition disabled:opacity-50 whitespace-nowrap">{saving ? 'Saving…' : '💾 Save Draft'}</button>
          <button onClick={() => { if (validate()) onNext(form) }} disabled={saving} style={primaryBtn} className="text-sm font-medium px-4 py-2.5 hover:opacity-90 transition disabled:opacity-50 whitespace-nowrap">{saving ? 'Saving…' : 'Next: Account admin →'}</button>
        </div>
        <div className="flex flex-col gap-2 sm:hidden">
          <div className="flex gap-2">
            <button onClick={() => router.push('/admin/setup/companies')} style={outlineBtn} className="flex-1 text-sm font-medium py-2.5 hover:opacity-90 transition whitespace-nowrap">✕ Close</button>
            <button onClick={() => { if (validate()) onSaveDraft(form) }} disabled={saving} style={outlineBtn} className="flex-1 text-sm font-medium py-2.5 hover:opacity-90 transition disabled:opacity-50 whitespace-nowrap">{saving ? 'Saving…' : '💾 Save Draft'}</button>
          </div>
          <button onClick={() => { if (validate()) onNext(form) }} disabled={saving} style={primaryBtn} className="w-full text-sm font-medium py-2.5 hover:opacity-90 transition disabled:opacity-50">{saving ? 'Saving…' : 'Next: Account admin →'}</button>
        </div>
      </div>
    </div>
  )
}
