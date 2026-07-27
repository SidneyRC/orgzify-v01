'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/lib/ThemeContext'
import type { WizardData } from '@/components/admin/OREV1-047A-CompanyWizard'

type Props = {
  data: WizardData
  onNext: (patch: Partial<WizardData>) => void
  onSaveDraft: (patch: Partial<WizardData>) => void
  onBack: () => void
  saving: boolean
}

type CheckState = 'idle' | 'checking' | 'found' | 'not_found'

export default function OREV1047CWizardStep2({ data, onNext, onSaveDraft, onBack, saving }: Props) {
  const { theme } = useTheme()
  const router = useRouter()
  const [email, setEmail] = useState(data.admin_email || data.admin_user_name || '')
  const [checkState, setCheckState] = useState<CheckState>(data.admin_user_id ? 'found' : data.admin_email ? 'not_found' : 'idle')
  const [foundUser, setFoundUser] = useState<{ id: string; full_name: string } | null>(
    data.admin_user_id ? { id: data.admin_user_id, full_name: data.admin_user_name } : null
  )
  const [inviteName, setInviteName] = useState(data.admin_invite_name || '')
 useEffect(() => {
  if (data.admin_email) { setEmail(data.admin_email); setCheckState(data.admin_user_id ? 'found' : 'not_found'); if (data.admin_user_id) setFoundUser({ id: data.admin_user_id, full_name: data.admin_user_name }); setError('') }
}, [data.admin_email, data.admin_user_id])
  const [error, setError] = useState('')

  const radius = theme?.global_border_radius || '12px'
  const inputStyle = { backgroundColor: theme?.input_bg || '#fff', border: `1px solid ${theme?.input_border || '#e5e7eb'}`, borderRadius: radius }
  const primaryBtn = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }
  const outlineBtn = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }

const handleBlur = async () => {
    const trimmed = email.trim()
    if (!trimmed || !trimmed.includes('@')) return
    if (checkState === 'found' && foundUser) return
    setCheckState('checking'); setError(''); setFoundUser(null)
    const res = await fetch('/admin/setup/companies/new/api', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'check_user_email', email: trimmed }) })
    const json = await res.json()
    if (json.data) { setFoundUser(json.data); setCheckState('found') } else { setCheckState('not_found') }
  }

  const buildPatch = (): Partial<WizardData> => {
    if (checkState === 'found' && foundUser) return { admin_user_id: foundUser.id, admin_user_name: foundUser.full_name, admin_email: email, admin_invite_name: '' }
    return { admin_user_id: '', admin_user_name: inviteName, admin_email: email, admin_invite_name: inviteName }
  }

  const handleNext = () => {
    if (!email.trim()) { setError('Please enter an email address'); return }
    if (checkState === 'idle' || checkState === 'checking') { setError('Please wait for the email check to complete'); return }
    if (checkState === 'not_found' && !inviteName.trim()) { setError('Please enter the person\'s name to send the invite'); return }
    onNext(buildPatch())
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 flex flex-col gap-5">
      <div>
        <p className="text-sm font-semibold text-gray-700">Account admin</p>
        <p className="text-xs text-gray-400 mt-1">This person will be the Company Admin (SPOC). They will receive an invite when the company goes active.</p>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500">Email address <span className="text-red-500">*</span></label>
        <input type="email" value={email} onChange={e => { setEmail(e.target.value); setCheckState('idle'); setFoundUser(null); setInviteName(''); setError('') }}
          onBlur={handleBlur} placeholder="Enter email address" className="h-10 px-3 text-sm focus:outline-none" style={inputStyle} />
        {checkState === 'checking' && (
          <div className="flex items-center gap-2 mt-1">
            <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-gray-400">Checking…</span>
          </div>
        )}
      </div>

      {checkState === 'found' && foundUser && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-green-600 text-lg">✓</span>
          <div>
            <p className="text-sm font-semibold text-green-800">{foundUser.full_name}</p>
            <p className="text-xs text-green-600">{email} · Registered user</p>
          </div>
        </div>
      )}

      {checkState === 'not_found' && (
        <div className="flex flex-col gap-3">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
            <p className="text-sm font-medium text-yellow-800">User not found</p>
            <p className="text-xs text-yellow-700 mt-0.5">An invite will be sent to this email when the company goes active. Please enter their name below.</p>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Full name <span className="text-red-500">*</span></label>
            <input value={inviteName} onChange={e => { setInviteName(e.target.value); setError('') }} placeholder="e.g. John Smith" className="h-10 px-3 text-sm focus:outline-none" style={inputStyle} />
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}

      {/* Desktop: one row right-aligned | Mobile: row1 justified, row2 full width */}
      <div className="pt-2">
        <div className="hidden sm:flex sm:justify-end sm:gap-2">
          <button onClick={() => router.push('/admin/setup/companies')} style={outlineBtn} className="text-sm font-medium px-4 py-2.5 hover:opacity-90 whitespace-nowrap">✕ Close</button>
          <button onClick={() => onSaveDraft(buildPatch())} disabled={saving} style={outlineBtn} className="text-sm font-medium px-4 py-2.5 hover:opacity-90 disabled:opacity-50 whitespace-nowrap">💾 Save Draft</button>
          <button onClick={onBack} style={outlineBtn} className="text-sm font-medium px-4 py-2.5 hover:opacity-90 whitespace-nowrap">← Back</button>
          <button onClick={handleNext} disabled={saving} style={primaryBtn} className="text-sm font-medium px-4 py-2.5 hover:opacity-90 disabled:opacity-50 whitespace-nowrap">{saving ? 'Saving…' : 'Next: Address →'}</button>
        </div>
        <div className="flex flex-col gap-2 sm:hidden">
          <div className="flex gap-2">
            <button onClick={() => router.push('/admin/setup/companies')} style={outlineBtn} className="flex-1 text-sm font-medium py-2.5 hover:opacity-90 whitespace-nowrap">✕ Close</button>
            <button onClick={() => onSaveDraft(buildPatch())} disabled={saving} style={outlineBtn} className="flex-1 text-sm font-medium py-2.5 hover:opacity-90 disabled:opacity-50 whitespace-nowrap">💾 Save Draft</button>
            <button onClick={onBack} style={outlineBtn} className="flex-1 text-sm font-medium py-2.5 hover:opacity-90 whitespace-nowrap">← Back</button>
          </div>
          <button onClick={handleNext} disabled={saving} style={primaryBtn} className="w-full text-sm font-medium py-2.5 hover:opacity-90 disabled:opacity-50">{saving ? 'Saving…' : 'Next: Address →'}</button>
        </div>
      </div>
    </div>
  )
}
