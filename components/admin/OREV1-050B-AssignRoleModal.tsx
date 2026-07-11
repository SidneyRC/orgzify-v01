'use client'
import { useState, useEffect } from 'react'
import { useTheme } from '@/lib/ThemeContext'
import toast from 'react-hot-toast'

type Person = { id: string; email: string; full_name: string }
type Existing = { id: string; person_name: string; email: string; company_id: string; role_id: string }
type Props = {
  companies: { id: string; display_name: string }[]
  mode: 'create' | 'view' | 'edit'
  existing?: Existing
  onClose: () => void
  onSaved: () => void
  onSwitchToEdit?: () => void
}

export default function OREV1050BAssignRoleModal({ companies, mode, existing, onClose, onSaved, onSwitchToEdit }: Props) {
  const { theme } = useTheme()
  const [query, setQuery] = useState('')
  const [checking, setChecking] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [people, setPeople] = useState<Person[]>([])
  const [companyId, setCompanyId] = useState(existing?.company_id || '')
  const [roleId, setRoleId] = useState(existing?.role_id || '')
  const [roles, setRoles] = useState<{ id: string; name: string }[]>([])
  const [saving, setSaving] = useState(false)
  const readOnly = mode === 'view'

  const radius = theme?.global_border_radius || '12px'
  const inputStyle = { backgroundColor: theme?.input_bg || '#fff', border: `1px solid ${theme?.input_border || '#e5e7eb'}`, borderRadius: radius }
  const primaryBtn = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }
  const outlineBtn = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }

  useEffect(() => {
    if (!companyId) { setRoles([]); return }
    fetch(`/admin/setup/assign-role/api?type=roles&company_id=${companyId}`).then(r => r.json()).then(j => {
      const list = j.data || []
      setRoles(list)
      if (list.length === 1) setRoleId(list[0].id)
      else if (mode === 'create' && !list.some((r: any) => r.id === roleId)) setRoleId('')
    })
  }, [companyId])

  const handleSearch = async () => {
    const q = query.trim()
    if (!q) return
    setChecking(true); setNotFound(false)
    const res = await fetch(`/admin/setup/assign-role/api?type=search_person&q=${encodeURIComponent(q)}`)
    const json = await res.json()
    setChecking(false)
    if (!json.data) { setNotFound(true); return }
    if (people.some(p => p.id === json.data.id)) { toast.error('Already added.'); return }
    setPeople(p => [...p, json.data]); setQuery('')
  }

  const handleSave = async () => {
    if (!companyId) { toast.error('Select a company.'); return }
    if (!roleId) { toast.error('No role available for this company.'); return }
    setSaving(true)
    if (mode === 'create') {
      if (!people.length) { toast.error('Add at least one person.'); setSaving(false); return }
      const res = await fetch('/admin/setup/assign-role/api', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_ids: people.map(p => p.id), company_id: companyId, role_id: roleId }) })
      const json = await res.json(); setSaving(false)
      if (json.error) { toast.error(json.error); return }
      toast.success('Role assigned.'); onSaved(); return
    }
    const res = await fetch('/admin/setup/assign-role/api', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: existing?.id, company_id: companyId, role_id: roleId }) })
    const json = await res.json(); setSaving(false)
    if (json.error) { toast.error(json.error); return }
    toast.success('Assignment updated.'); onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        <p className="text-sm font-semibold text-gray-700">{mode === 'view' ? 'Assignment Details' : mode === 'edit' ? 'Edit Assignment' : 'Assign Role to User'}</p>

        {mode === 'create' && (
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Search by Email / Phone / ZY ID</label>
            <div className="flex gap-2">
              <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleSearch() }}
                placeholder="Enter email, phone, or ZY ID" className="flex-1 h-10 px-3 text-sm focus:outline-none" style={inputStyle} />
              <button onClick={handleSearch} disabled={checking} style={outlineBtn} className="px-4 text-sm font-medium hover:opacity-90">{checking ? '…' : 'Add'}</button>
            </div>
            {notFound && <p className="text-xs text-red-500">No matching registered user found.</p>}
          </div>
        )}

        {mode === 'create' && people.length > 0 && (
          <div className="flex flex-col gap-2">
            {people.map(p => (
              <div key={p.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
                <div><p className="text-xs font-semibold text-gray-700">{p.full_name}</p><p className="text-xs text-gray-400">{p.email}</p></div>
                <button onClick={() => setPeople(ps => ps.filter(x => x.id !== p.id))} className="text-red-500 text-xs">Remove</button>
              </div>
            ))}
          </div>
        )}

        {mode !== 'create' && existing && (
          <div className="bg-gray-50 rounded-xl px-3 py-2">
            <p className="text-xs font-semibold text-gray-700">{existing.person_name}</p>
            <p className="text-xs text-gray-400">{existing.email}</p>
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Company</label>
          <select value={companyId} onChange={e => { setCompanyId(e.target.value); setRoleId('') }} disabled={readOnly} className="h-10 px-3 text-sm focus:outline-none disabled:bg-gray-50" style={inputStyle}>
            <option value="">Select…</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.display_name}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Role</label>
          {roles.length === 1 ? (
            <div className="h-10 px-3 flex items-center text-sm" style={inputStyle}>{roles[0].name}</div>
          ) : (
            <select value={roleId} onChange={e => setRoleId(e.target.value)} disabled={readOnly || !companyId} className="h-10 px-3 text-sm focus:outline-none disabled:bg-gray-50" style={inputStyle}>
              <option value="">Select…</option>
              {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          )}
          {companyId && roles.length === 0 && <p className="text-xs text-red-500">No role configured for this company yet.</p>}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          {mode === 'view' ? (
            <>
              <button onClick={onClose} style={outlineBtn} className="text-sm font-medium px-4 py-2.5 hover:opacity-90">Close</button>
              <button onClick={onSwitchToEdit} style={primaryBtn} className="text-sm font-medium px-4 py-2.5 hover:opacity-90">Edit</button>
            </>
          ) : (
            <>
              <button onClick={onClose} style={outlineBtn} className="text-sm font-medium px-4 py-2.5 hover:opacity-90">Cancel</button>
              <button onClick={handleSave} disabled={saving} style={primaryBtn} className="text-sm font-medium px-4 py-2.5 hover:opacity-90 disabled:opacity-50">{saving ? 'Saving…' : mode === 'edit' ? 'Save' : 'Assign'}</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}