'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/lib/ThemeContext'
import toast from 'react-hot-toast'

const MODULES = ['Site', 'EntityRegistration', 'Events', 'Academy']
const FONTS = ['Arial', 'Georgia', 'Times New Roman', 'Courier New', 'Verdana']
const SIZES = [{ label: 'Small', v: '2' }, { label: 'Normal', v: '3' }, { label: 'Large', v: '5' }, { label: 'X-Large', v: '6' }]

type Props = { policyId: string | null; viewOnly?: boolean }

function RichTextEditor({ value, onChange, readOnly, disabled, borderColor }: { value: string; onChange: (v: string) => void; readOnly?: boolean; disabled?: boolean; borderColor: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => { if (ref.current && ref.current.innerHTML !== value) ref.current.innerHTML = value || '' }, [value])
  const exec = (cmd: string, arg?: string) => { ref.current?.focus(); document.execCommand(cmd, false, arg); ref.current && onChange(ref.current.innerHTML) }
  const insertLink = () => {
    const url = prompt('Enter link URL (https://...)')
    if (url) exec('createLink', url)
  }
  const locked = readOnly || disabled
  const btn = "px-2 py-1 text-sm border border-gray-200 rounded-lg bg-white hover:bg-gray-100"
  return (
    <div>
      {!readOnly && (
        <div className={`flex flex-wrap gap-2 mb-2 border border-gray-200 rounded-t-xl p-2 bg-gray-50 ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
          <button type="button" onClick={() => exec('bold')} className={`${btn} font-bold`}>B</button>
          <button type="button" onClick={() => exec('italic')} className={`${btn} italic`}>I</button>
          <button type="button" onClick={() => exec('underline')} className={`${btn} underline`}>U</button>
          <button type="button" onClick={() => exec('formatBlock', 'H3')} className={`${btn} font-semibold`}>H</button>
          <button type="button" onClick={() => exec('insertUnorderedList')} className={btn}>• List</button>
          <button type="button" onClick={() => exec('insertOrderedList')} className={btn}>1. List</button>
          <button type="button" onClick={() => exec('undo')} className={btn}>↶</button>
          <button type="button" onClick={() => exec('redo')} className={btn}>↷</button>
          <button type="button" onClick={insertLink} className={btn}>🔗 Link</button>
          <select onChange={e => exec('fontName', e.target.value)} className={btn} defaultValue="">
            <option value="" disabled>Font</option>
            {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          <select onChange={e => exec('fontSize', e.target.value)} className={btn} defaultValue="">
            <option value="" disabled>Size</option>
            {SIZES.map(s => <option key={s.v} value={s.v}>{s.label}</option>)}
          </select>
        </div>
      )}
      <div
        ref={ref}
        contentEditable={!locked}
        onInput={() => ref.current && onChange(ref.current.innerHTML)}
        className={`w-full min-h-[220px] border ${!readOnly ? 'rounded-b-xl' : 'rounded-xl'} px-3 py-2 text-sm focus:outline-none ${disabled ? 'bg-gray-50 text-gray-400' : ''}`}
        style={{ borderColor }}
      />
    </div>
  )
}

export default function OREV1062PolicyForm({ policyId, viewOnly = false }: Props) {
  const router = useRouter()
  const { theme } = useTheme()
  const [countries, setCountries] = useState<{ id: string; name: string }[]>([])
  const [policyTypeSuggestions, setPolicyTypeSuggestions] = useState<string[]>([])
  const [internalName, setInternalName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [policyType, setPolicyType] = useState('')
  const [newPolicyType, setNewPolicyType] = useState('')
  const [modules, setModules] = useState<string[]>([])
  const [countryId, setCountryId] = useState('')
  const [scope, setScope] = useState('global')
  const [content, setContent] = useState('')
  const [docUrl, setDocUrl] = useState('')
  const [status, setStatus] = useState('active')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const radius = theme?.global_border_radius || '12px'
  const primaryBtn = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }
  const outlineBtn = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }
  const inputClass = "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"

  useEffect(() => {
    fetch('/admin/setup/policies/api?type=all_countries').then(r => r.json()).then(j => setCountries(j.data || []))
    fetch('/admin/setup/policies/api?type=policy_types').then(r => r.json()).then(j => setPolicyTypeSuggestions(j.data || []))
  }, [])

  useEffect(() => {
    if (!policyId) return
    fetch(`/admin/setup/policies/api?id=${policyId}`).then(async r => {
      if (!r.ok) return
      const j = await r.json()
      const d = j.data
      if (!d) return
      setInternalName(d.internal_name); setDisplayName(d.display_name); setPolicyType(d.policy_type)
      setModules(d.modules || []); setCountryId(d.country_id || ''); setScope(d.scope || 'country'); setContent(d.content || '')
      setDocUrl(d.document_url || ''); setStatus(d.status)
    })
  }, [policyId])

  const toggleModule = (m: string) => setModules(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])

  const handleUpload = async (file: File) => {
    setUploading(true)
    const fd = new FormData(); fd.append('file', file); fd.append('internal_name', internalName || 'policy')
    const res = await fetch('/admin/setup/policies/upload', { method: 'POST', body: fd })
    const j = await res.json()
    setUploading(false)
    if (!res.ok) { toast.error(j.error || 'Upload failed'); return }
    setDocUrl(j.url); toast.success('Document uploaded')
  }

  const handleSave = async () => {
    const finalPolicyType = policyType === '__new__' ? newPolicyType.trim() : policyType
    if (!internalName || !displayName || !finalPolicyType || !modules.length) { toast.error('Please fill all required fields'); return }
    setSaving(true)
    const payload: any = { internal_name: internalName, display_name: displayName, policy_type: finalPolicyType, modules, country_id: countryId || null, scope, content, document_url: docUrl || null }
    if (policyId) payload.status = status
    const res = await fetch('/admin/setup/policies/api', {
      method: policyId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(policyId ? { id: policyId, ...payload } : payload)
    })
    const j = await res.json()
    setSaving(false)
    if (!res.ok) { toast.error(j.error || 'Save failed'); return }
    toast.success('Policy saved'); router.push('/admin/setup/policies')
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto" style={{ backgroundColor: theme?.page_bg || '#f9fafb', minHeight: '100vh' }}>
      <h1 className="text-2xl font-semibold mb-5" style={{ color: theme?.color_text_primary || '#111827' }}>
        {viewOnly ? 'View Policy' : policyId ? 'Edit Policy' : 'New Policy'}
      </h1>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Internal Name *</label>
            <input disabled={viewOnly} value={internalName} onChange={e => setInternalName(e.target.value)} className={inputClass} placeholder="e.g. TC_ENTITY_IN" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Display Name *</label>
            <input disabled={viewOnly} value={displayName} onChange={e => setDisplayName(e.target.value)} className={inputClass} placeholder="e.g. Terms & Conditions" />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Policy Type *</label>
            {policyType === '__new__' ? (
              <div className="flex gap-2">
                <input disabled={viewOnly} value={newPolicyType} onChange={e => setNewPolicyType(e.target.value)}
                  className={inputClass} placeholder="Type new Policy Type" autoFocus />
                <button type="button" onClick={() => { setPolicyType(''); setNewPolicyType('') }}
                  className="text-xs text-gray-400 hover:text-gray-600 px-2">Cancel</button>
              </div>
            ) : (
              <select disabled={viewOnly} value={policyType} onChange={e => setPolicyType(e.target.value)} className={inputClass}>
                <option value="">Select type</option>
                {policyTypeSuggestions.map(t => <option key={t} value={t}>{t}</option>)}
                <option value="__new__">+ Add New Type</option>
              </select>
            )}
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Country</label>
            <select disabled={viewOnly} value={scope === 'country' ? countryId : scope}
              onChange={e => {
                const v = e.target.value
                if (v === 'global') { setScope('global'); setCountryId('') }
                else if (v === 'unlisted') { setScope('unlisted'); setCountryId('') }
                else { setScope('country'); setCountryId(v) }
              }} className={inputClass}>
              <option value="global">Global</option>
              {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              <option value="unlisted">Not Listed (for deletion only)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Modules *</label>
          <div className="flex flex-wrap gap-3">
            {MODULES.map(m => (
              <label key={m} className="flex items-center gap-1.5 text-sm">
                <input type="checkbox" disabled={viewOnly} checked={modules.includes(m)} onChange={() => toggleModule(m)} />
                {m}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Content {docUrl && '(disabled — a document is uploaded below)'}</label>
          <RichTextEditor value={content} onChange={setContent} readOnly={viewOnly} disabled={!!docUrl} borderColor={theme?.input_border || '#e5e7eb'} />
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Document Upload — PDF or Word (optional, replaces the Content above)</label>
          {!viewOnly && !docUrl && (
            <label style={outlineBtn} className="inline-block text-sm font-medium px-4 py-2 cursor-pointer hover:opacity-90">
              {uploading ? 'Uploading…' : '📄 Choose File'}
              <input type="file" accept=".pdf,.doc,.docx" className="hidden"
                onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0])} />
            </label>
          )}
          {docUrl && (
            <div className="flex items-center gap-3">
              <a href={docUrl} target="_blank" className="text-sm" style={{ color: theme?.link_color || '#2563eb' }}>📄 View uploaded document</a>
              {!viewOnly && (
                <button type="button" onClick={() => setDocUrl('')} className="text-xs text-red-500 hover:underline">Remove document</button>
              )}
            </div>
          )}
        </div>

        {policyId && (
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Status</label>
            <select disabled={viewOnly || status === 'archived'} value={status} onChange={e => setStatus(e.target.value)} className={inputClass}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              {status === 'archived' && <option value="archived">Archived</option>}
            </select>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={() => router.push('/admin/setup/policies')} style={outlineBtn} className="text-sm font-medium px-4 py-2 hover:opacity-90">Close</button>
          {!viewOnly && (
            <button onClick={handleSave} disabled={saving} style={primaryBtn} className="text-sm font-medium px-4 py-2 hover:opacity-90 disabled:opacity-50">
              {saving ? 'Saving…' : 'Save'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
