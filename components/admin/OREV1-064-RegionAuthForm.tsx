'use client'
import { useState } from 'react'
import { useTheme } from '@/lib/ThemeContext'
import toast from 'react-hot-toast'
import OREV1065SearchSelect from '@/components/admin/OREV1-065-SearchSelect'
import OREV1067MultiSearchSelect from '@/components/admin/OREV1-067-MultiSearchSelect'

const API = '/admin/setup/company-auth/api'

type Props = {
  editRow: any
  companyOptions: any[]
  moduleOptions: any[]
  onClose: () => void
  onSaved: () => void
  readOnly?: boolean
}

export default function OREV1064RegionAuthForm({ editRow, companyOptions, moduleOptions, onClose, onSaved, readOnly }: Props) {

  const { theme } = useTheme()
  const radius = theme?.global_border_radius || '12px'
  const inputStyle = { backgroundColor: theme?.input_bg || '#fff', border: `1px solid ${theme?.input_border || '#e5e7eb'}`, borderRadius: radius }
  const primaryBtn = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }
  const outlineBtn = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }

  const [companyId, setCompanyId] = useState(editRow?.company_id || '')
  const [moduleCodes, setModuleCodes] = useState<string[]>(editRow ? [editRow.module_code] : [])
  const [staffId, setStaffId] = useState(editRow?.staff_id || '')
  const [staffTerm, setStaffTerm] = useState(editRow?.staff_name || '')
  const [staffResults, setStaffResults] = useState<any[]>([])
  const [selectedUnlinked, setSelectedUnlinked] = useState(false)
  const [searching, setSearching] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const companyOpts = companyOptions.map(c => ({ id: c.id, label: c.display_name }))
  const moduleOpts = moduleOptions.map(m => ({ id: m.code, label: m.display_name }))

  const runStaffSearch = async () => {
    if (!staffTerm.trim()) { setStaffResults([]); return }
    if (staffId && staffTerm === editRow?.staff_name) { setStaffResults([]); return } // unchanged from what was loaded, skip
    setSearching(true)
    const res = await fetch(`${API}?type=staff_search&term=${encodeURIComponent(staffTerm.trim())}`)
    const json = await res.json()
    setSearching(false)
    setStaffResults(json.data || [])
    if (!json.data?.length) toast.error('No matching staff found for that exact email / mobile / ZY ID / Enrollment No.')
  }

  const pickStaff = (s: any) => { setStaffId(s.staff_id); setStaffTerm(s.name); setSelectedUnlinked(s.unlinked); setStaffResults([]) }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!companyId) e.company_id = 'Required'
    if (!moduleCodes.length) e.module_codes = 'Pick at least one module'
    if (!staffId) e.staff_id = 'Required'
    setErrors(e); return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    if (editRow) {
      const res = await fetch(API, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editRow.id, company_id: companyId, module_code: moduleCodes[0], staff_id: staffId }) })
      const json = await res.json()
      setSaving(false)
      if (json.error) { toast.error(json.error); return }
      toast.success('Assignment updated'); onSaved(); return
    }
    const res = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ company_id: companyId, module_codes: moduleCodes, staff_id: staffId }) })
    const json = await res.json()
    setSaving(false)
    if (json.error) { toast.error(json.error); if (!json.data?.length) return }
    toast.success('Assignment created'); onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4 overflow-y-auto py-8" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md flex flex-col gap-4 my-auto" onClick={e => e.stopPropagation()}>
      <h2 className="text-lg font-semibold" style={{ color: theme?.color_text_primary || '#111827' }}>
          {readOnly ? 'View Assignment' : editRow ? 'Edit Assignment' : 'New Assignment'}
        </h2>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Company <span className="text-red-500">*</span></label>
          <OREV1065SearchSelect options={companyOpts} value={companyId} onChange={setCompanyId} placeholder="Search company…" disabled={!!editRow || readOnly} />
          {errors.company_id && <span className="text-xs text-red-500">{errors.company_id}</span>}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Module{!editRow && 's'} <span className="text-red-500">*</span></label>
          <OREV1067MultiSearchSelect options={moduleOpts} values={moduleCodes} onChange={setModuleCodes} placeholder="Search module…" disabled={!!editRow || readOnly} />
          {errors.module_codes && <span className="text-xs text-red-500">{errors.module_codes}</span>}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Authorized Person <span className="text-red-500">*</span></label>
          <input
            value={staffTerm}
            onChange={e => { setStaffTerm(e.target.value); setStaffId(''); setSelectedUnlinked(false); setStaffResults([]) }}
            onBlur={runStaffSearch}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); runStaffSearch() } }}
            placeholder="Enter exact email, mobile, ZY ID, or Enrollment No."
            className="h-10 px-3 text-sm focus:outline-none disabled:opacity-70"
            style={inputStyle}
            disabled={readOnly}
          />
          {searching && <span className="text-xs text-gray-400">Searching…</span>}
          {staffId && selectedUnlinked && (
            <span className="text-xs text-amber-600">⚠ Not linked to a login yet — ask them to register on Orgzify first.</span>
          )}
{staffResults.length > 0 && (
            <div className="w-full bg-white rounded-xl border border-gray-100 max-h-48 overflow-y-auto">
              {staffResults.map(s => (
                <button key={s.staff_id} type="button" onClick={() => pickStaff(s)} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-50 last:border-0">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{s.name}</span>
                    {s.unlinked && <span className="text-xs text-amber-500">no login</span>}
                  </div>
<div className="text-xs text-gray-400 flex gap-2 flex-wrap">
                    {s.enrollment && <span>Emp: {s.enrollment}</span>}
                    {s.org_id && <span>Org ID: {s.org_id}</span>}
                    {s.email && <span>{s.email}</span>}
                    {s.mobile && <span>{s.mobile}</span>}
                  </div>
                </button>
              ))}
            </div>
          )}
          {errors.staff_id && <span className="text-xs text-red-500">{errors.staff_id}</span>}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} style={outlineBtn} className="text-sm font-medium px-4 py-2 hover:opacity-90 transition">{readOnly ? 'Close' : 'Cancel'}</button>
          {!readOnly && <button onClick={handleSave} disabled={saving} style={primaryBtn} className="text-sm font-medium px-4 py-2 hover:opacity-90 transition disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>}
        </div>
      </div>
    </div>
  )
}