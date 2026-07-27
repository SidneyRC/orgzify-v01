'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/lib/ThemeContext'
import toast from 'react-hot-toast'
import OREV1059ConfirmModal from '@/components/admin/OREV1-059-ConfirmModal'
import type { EntityDraft, AuthorisedPerson } from '@/components/admin/OREV1-055-EntityRegistration'

const API = '/biz/register/api'
const OTP_SEND_API = '/otp/send'
const OTP_VERIFY_API = '/otp/verify'

type Policy = { id: string; display_name: string; policy_type: string; content: string }
type Address = { line1: string; line2: string; area: string; city: string; district: string; state: string; pincode: string; country: string }
type Contacts = { customer_care_email: string; customer_care_phone: string; escalation_email: string; escalation_phone: string; nodal_email: string; nodal_phone: string }
type AuthPerson = { name: string; designation: string; department: string }
type ReportingOffice = { not_mapped?: boolean; company_name: string; address: Address | null; authorised_person: AuthPerson | null; contacts: Contacts | null }

type Props = {
  entity: EntityDraft | null
  person: AuthorisedPerson | null
  open: boolean
  onToggle: () => void
  onSaved: () => void
  onBack: () => void
  readOnly?: boolean
  canEdit?: boolean
  onEnableEdit?: () => void
  closeUrl: string
}

export default function OREV1061EntitySection5({ entity, person, open, onToggle, onSaved, onBack, readOnly, canEdit, onEnableEdit, closeUrl }: Props) {
  const { theme } = useTheme()
  const router = useRouter()
  const radius = theme?.global_border_radius || '12px'
  const inputStyle = { backgroundColor: theme?.input_bg || '#fff', border: `1px solid ${theme?.input_border || '#e5e7eb'}`, borderRadius: radius }
  const primaryBtn = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }
  const outlineBtn = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }
  const cardStyle = { backgroundColor: theme?.input_bg || '#f9fafb', border: `1px solid ${theme?.input_border || '#e5e7eb'}`, borderRadius: radius }

  const [policies, setPolicies] = useState<Policy[]>([])
  const [countryCode, setCountryCode] = useState('')
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [office, setOffice] = useState<ReportingOffice | null>(null)
  const [loading, setLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState('')
  const [verified, setVerified] = useState(false)
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)
  const notMapped = !!office?.not_mapped

  const handleClose = () => router.push(closeUrl)

  useEffect(() => {
    if (!entity?.id) return
    setLoading(true)
    Promise.all([
      fetch(`${API}?type=policies&entity_id=${entity.id}`).then(r => r.json()),
      fetch(`${API}?type=reporting_office&entity_id=${entity.id}`).then(r => r.json())
    ]).then(([p, o]) => {
      setPolicies(p.data || [])
      setCountryCode(p.country_code || '')
      setOffice(o.data || null)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [entity?.id])

  const allChecked = policies.length > 0 && policies.every(p => checked[p.id])

  const handleSendOtp = async () => {
    if (!allChecked) { toast.error('Please accept all policies first'); return }
    if (!person?.email) { toast.error('No email found on your profile'); return }
    setSending(true)
    try {
      const res = await fetch(OTP_SEND_API, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: person.full_name, email: person.email, purpose: 'entity-verification' })
      })
      const json = await res.json()
      if (!json.success) { toast.error(json.error || 'Failed to send OTP'); return }
      setOtpSent(true)
      toast.success('OTP sent to your email')
    } catch {
      toast.error('Could not reach OTP service. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const handleVerifyOtp = async () => {
    setVerifying(true)
    try {
      const res = await fetch(OTP_VERIFY_API, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: person?.email, otp, purpose: 'entity-verification' })
      })
      const json = await res.json()
      if (!json.success) { toast.error(json.error || 'Invalid OTP'); return }
      setVerified(true)
      toast.success('Email verified successfully!')
    } catch {
      toast.error('Could not reach OTP service. Please try again.')
    } finally {
      setVerifying(false)
    }
  }

  const handleSubmit = async () => {
    if (!verified) return
    setSaving(true)
    const res = await fetch(API, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'accept_policies', entity_id: entity?.id, policy_ids: policies.map(p => p.id) })
    })
    const json = await res.json()
    setSaving(false)
    if (json.error) { toast.error('Failed to submit'); return }
    toast.success('Submitted for Admin Approval')
    onSaved()
  }

  const handleSubmitForReview = async () => {
    setSaving(true)
    const res = await fetch(API, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'submit_for_review', entity_id: entity?.id })
    })
    const json = await res.json()
    setSaving(false)
    if (json.error) { toast.error('Failed to submit'); return }
    toast.success('Submitted for Review')
    onSaved()
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between px-6 py-4 text-left">
        <div className="flex items-center gap-2">
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${(verified || readOnly) ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
            {(verified || readOnly) ? '✓' : '5'}
          </span>
          <p className="text-sm font-semibold text-gray-700">Terms &amp; Conditions</p>
        </div>
        <span className="text-gray-400 text-sm">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        loading ? (
          <div className="px-6 pb-6 pt-5 border-t border-gray-50"><p className="text-sm text-gray-400">Loading…</p></div>
        ) : (
        <div className={`px-6 pb-6 flex flex-col gap-5 border-t border-gray-50 pt-5 ${readOnly ? 'opacity-60 pointer-events-none' : ''}`}>

          {notMapped && (
            <div style={cardStyle} className="p-4">
              <p className="text-sm text-gray-600">
                We couldn't find your Reporting Office. Please contact{' '}
                <a href="mailto:support@orgzify.com" className="underline" style={{ color: theme?.link_color || '#1e3a8a' }}>support@orgzify.com</a>{' '}
                and we'll help you complete your registration.
              </p>
            </div>
          )}

          {office && !notMapped && (
            <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x" style={{ borderColor: theme?.input_border || '#e5e7eb' }}>
                <div className="p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: theme?.color_text_muted || '#9ca3af' }}>Reporting Office</p>
                  <p className="text-sm font-medium text-gray-700 mb-1">{office.company_name}</p>
                  {office.address && (
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {office.address.line1}{office.address.line2 ? `, ${office.address.line2}` : ''}<br />
                      {office.address.area}<br />
                      {office.address.district ? <>{office.address.district}<br /></> : null}
                      {office.address.city}, {office.address.state} - {office.address.pincode}<br />
                      {office.address.country}
                    </p>
                  )}
                </div>

                <div className="p-4">
                  {office.authorised_person && (
                    <div className="mb-4">
                      <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: theme?.color_text_muted || '#9ca3af' }}>Department Head</p>
                      <p className="text-sm font-medium text-gray-700">{office.authorised_person.name}</p>
                      {(office.authorised_person.designation || office.authorised_person.department) && (
                        <p className="text-xs text-gray-500">
                          {office.authorised_person.designation}
                          {office.authorised_person.designation && office.authorised_person.department ? ' · ' : ''}
                          {office.authorised_person.department}
                        </p>
                      )}
                    </div>
                  )}

                  {office.contacts && (
                    <div className="flex flex-col gap-3">
                      {[
                        { label: 'Customer Care', email: office.contacts.customer_care_email, phone: office.contacts.customer_care_phone },
                        { label: 'Escalation', email: office.contacts.escalation_email, phone: office.contacts.escalation_phone },
                        { label: 'Nodal Officer', email: office.contacts.nodal_email, phone: office.contacts.nodal_phone },
                      ].filter(c => c.email || c.phone).map(c => (
                        <div key={c.label}>
                          <p className="text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: theme?.color_text_muted || '#9ca3af' }}>{c.label}</p>
                          {c.email && (
                            <p className="text-xs text-gray-500 flex items-center gap-1.5">
                              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                              {c.email}
                            </p>
                          )}
                          {c.phone && (
                            <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                              {c.phone}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}


          {!notMapped && policies.length === 0 && <p className="text-sm text-gray-400">No policies configured for this country yet.</p>}

          {!notMapped && readOnly && policies.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {policies.map(p => (
                <p key={p.id} className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-green-600">✓</span> Accepted the{' '}
                  <a href={`/biz/policy/${countryCode}/entity-registration/${p.policy_type}?ref=${entity?.process_id || ''}`} target="_blank" rel="noopener noreferrer"
                    className="underline" style={{ color: theme?.link_color || '#1e3a8a' }}>{p.display_name}</a>
                </p>
              ))}
            </div>
          )}

          {!notMapped && !readOnly && (
            <div className="flex flex-col gap-2">
              {policies.map(p => (
                <label key={p.id} className="flex items-center gap-2 text-sm text-gray-600">
                  <input type="checkbox" checked={!!checked[p.id]} onChange={e => setChecked(prev => ({ ...prev, [p.id]: e.target.checked }))} />
                  I accept the{' '}
                  <a href={`/biz/policy/${countryCode}/entity-registration/${p.policy_type}?ref=${entity?.process_id || ''}`} target="_blank" rel="noopener noreferrer"
                    className="underline" style={{ color: theme?.link_color || '#1e3a8a' }}>{p.display_name}</a>
                </label>
              ))}
            </div>
          )}

          {!notMapped && readOnly && (
            <p className="text-sm text-green-600">✓ Email verified</p>
          )}

          {!notMapped && !readOnly && (
            <div className="flex flex-col gap-2">
              {!otpSent ? (
                <button onClick={handleSendOtp} disabled={sending || !allChecked} style={primaryBtn} className="text-sm font-medium px-4 py-2.5 w-fit hover:opacity-90 transition disabled:opacity-50">
                  {sending ? 'Sending…' : 'Send OTP to Email'}
                </button>
              ) : !verified ? (
                <div className="flex gap-2 items-center">
                  <input value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} maxLength={6}
                    placeholder="Enter 6-digit OTP" className="h-10 px-3 text-sm focus:outline-none w-40" style={inputStyle} />
                  <button onClick={handleVerifyOtp} disabled={verifying || otp.length !== 6} style={primaryBtn} className="text-sm font-medium px-4 py-2.5 hover:opacity-90 transition disabled:opacity-50">{verifying ? 'Verifying…' : 'Verify OTP'}</button>
                </div>
              ) : (
                <p className="text-sm text-green-600">✓ Email verified</p>
              )}
            </div>
          )}

          {readOnly ? (
            <div className="pt-2 flex justify-end gap-2" style={{ pointerEvents: 'auto' }}>
              {canEdit && (
                <button onClick={onEnableEdit} style={primaryBtn} className="text-sm font-medium px-4 py-2.5 hover:opacity-90 transition whitespace-nowrap">✎ Edit</button>
              )}
              <button onClick={handleClose} style={outlineBtn} className="text-sm font-medium px-4 py-2.5 hover:opacity-90 transition whitespace-nowrap">✕ Close</button>
            </div>
          ) : (
          <div className="pt-2">
            <div className="hidden sm:flex sm:justify-end sm:gap-2">
              <button onClick={onBack} style={outlineBtn} className="text-sm font-medium px-4 py-2.5 hover:opacity-90 transition whitespace-nowrap">← Back</button>
              <button onClick={() => setShowCloseConfirm(true)} style={outlineBtn} className="text-sm font-medium px-4 py-2.5 hover:opacity-90 transition whitespace-nowrap">✕ Close</button>
              {notMapped ? (
                <button onClick={handleSubmitForReview} disabled={saving} style={primaryBtn} className="text-sm font-medium px-4 py-2.5 hover:opacity-90 transition disabled:opacity-50 whitespace-nowrap">{saving ? 'Submitting…' : '⚠ Submit for Review'}</button>
              ) : (
                <button onClick={handleSubmit} disabled={saving || !verified} style={verified ? primaryBtn : { ...primaryBtn, opacity: 0.5, cursor: 'not-allowed' }} className="text-sm font-medium px-4 py-2.5 hover:opacity-90 transition whitespace-nowrap">{saving ? 'Submitting…' : '✅ Submit for Approval'}</button>
              )}
            </div>
            <div className="flex gap-1.5 sm:hidden">
              <button onClick={onBack} style={outlineBtn} className="flex-1 text-xs font-medium py-2 px-1 hover:opacity-90 transition whitespace-nowrap">← Back</button>
              <button onClick={() => setShowCloseConfirm(true)} style={outlineBtn} className="flex-1 text-xs font-medium py-2 px-1 hover:opacity-90 transition whitespace-nowrap">✕ Close</button>
              {notMapped ? (
                <button onClick={handleSubmitForReview} disabled={saving} style={primaryBtn} className="flex-1 text-xs font-medium py-2 px-1 hover:opacity-90 transition disabled:opacity-50 whitespace-nowrap">{saving ? '…' : 'Submit'}</button>
              ) : (
                <button onClick={handleSubmit} disabled={saving || !verified} style={verified ? primaryBtn : { ...primaryBtn, opacity: 0.5, cursor: 'not-allowed' }} className="flex-1 text-xs font-medium py-2 px-1 hover:opacity-90 transition whitespace-nowrap">{saving ? '…' : 'Submit'}</button>
              )}
            </div>
          </div>
          )}
        </div>
        )
      )}

      <OREV1059ConfirmModal
        open={showCloseConfirm}
        title="Leave without saving?"
        message="Any unsaved changes on this section will be lost."
        onCancel={() => setShowCloseConfirm(false)}
        onConfirm={handleClose}
      />
    </div>
  )
}
