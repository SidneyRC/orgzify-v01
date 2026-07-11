'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/lib/ThemeContext'
import type { WizardData } from '@/components/admin/OREV1-047A-CompanyWizard'

type Props = {
  data: WizardData
  onBack: () => void
  onSaveDraft: (patch: Partial<WizardData>) => void
  onSubmit: () => void
  saving: boolean
  viewOnly?: boolean
  onEdit?: () => void
}

type AddressRow = {
  address_type: string; line1: string; line2: string; area: string
  pincode: string; city_name: string; district_name: string
  state_name: string; country_name: string; landmark: string
}

const API = '/admin/setup/companies/new/api'

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-0.5 sm:gap-4 py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400 sm:w-40 shrink-0">{label}</span>
      <span className="text-sm text-gray-700 font-medium">{value || '—'}</span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{title}</p>
      {children}
    </div>
  )
}

function formatAddress(a: AddressRow): string {
  return [a.line1, a.line2, a.area, a.city_name, a.district_name, a.state_name, a.pincode, a.country_name].filter(Boolean).join(', ')
}

export default function OREV1047EWizardReview({ data, onBack, onSaveDraft, onSubmit, saving, viewOnly, onEdit }: Props) {
  const { theme } = useTheme()
  const router = useRouter()
  const radius = theme?.global_border_radius || '12px'
  const primaryBtn = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }
  const outlineBtn = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }

  const [addresses, setAddresses] = useState<AddressRow[]>([])
  const [addrLoading, setAddrLoading] = useState(false)
  const [adminName, setAdminName] = useState(data.admin_user_name || '')
  const [adminMobile, setAdminMobile] = useState('')

  useEffect(() => {
    if (!data.draft_id) return
    fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get_admin_details', user_id: data.admin_user_id || null, company_id: data.draft_id })
    }).then(r => r.json()).then(j => {
      if (j.data?.full_name) setAdminName(j.data.full_name)
      if (j.data?.mobile) setAdminMobile(j.data.mobile)
    })
  }, [data.draft_id])

  useEffect(() => {
    if (!data.draft_id) return
    setAddrLoading(true)
    fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get_address', company_id: data.draft_id })
    }).then(r => r.json()).then(j => { setAddresses(j.data || []); setAddrLoading(false) })
    .catch(() => setAddrLoading(false))
  }, [data.draft_id])

  const reg = addresses.find(a => a.address_type === 'registered')
  const op = addresses.find(a => a.address_type === 'operating')

  return (
    <div className="flex flex-col gap-4">
      <Section title="Basic details">
        <Row label="Legal name" value={data.legal_name} />
        <Row label="Display name" value={data.display_name} />
        <Row label="Slug" value={data.slug} />
        <Row label="Company type" value={data.company_type} />
        <Row label="Branch type" value={data.branch_type} />
      </Section>

      <Section title="Account admin">
        <Row label="Name" value={adminName} />
        <Row label="Mobile" value={adminMobile || '—'} />
        <Row label="Email" value={data.admin_email} />
      </Section>

      <Section title="Address">
        {addrLoading
          ? <p className="text-sm text-gray-400">Loading address…</p>
          : <>
              <Row label="Registered address" value={reg ? formatAddress(reg) : '—'} />
              <Row label="Operating address" value={op ? formatAddress(op) : reg ? 'Same as registered' : '—'} />
            </>
        }
      </Section>

      {!viewOnly && data.company_status === 'draft' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-800">
          After submission, the company status will be <strong>Pending</strong>. A Super Admin must activate it before the Account Admin receives access.
        </div>
      )}

      <div className="pt-2">
{viewOnly ? (
          <div className="flex justify-end gap-2">
            <button onClick={() => router.push('/admin/setup/companies')} style={outlineBtn} className="text-sm font-medium px-4 py-2.5 hover:opacity-90 transition whitespace-nowrap">✕ Close</button>
            <button onClick={onEdit} style={primaryBtn} className="text-sm font-medium px-4 py-2.5 hover:opacity-90 transition whitespace-nowrap">✏️ Edit company</button>
          </div>
        ) : (

        <>
        <div className="hidden sm:flex sm:justify-end sm:gap-2">
          <button onClick={() => router.push('/admin/setup/companies')} style={outlineBtn} className="text-sm font-medium px-4 py-2.5 hover:opacity-90 transition whitespace-nowrap">✕ Close</button>
          <button onClick={() => onSaveDraft({})} disabled={saving} style={outlineBtn} className="text-sm font-medium px-4 py-2.5 hover:opacity-90 transition disabled:opacity-50 whitespace-nowrap">{saving ? 'Saving…' : '💾 Save Draft'}</button>
          <button onClick={onBack} style={outlineBtn} className="text-sm font-medium px-4 py-2.5 hover:opacity-90 transition whitespace-nowrap">← Back</button>
          <button onClick={onSubmit} disabled={saving} style={primaryBtn} className="text-sm font-medium px-4 py-2.5 hover:opacity-90 transition disabled:opacity-50 whitespace-nowrap">{saving ? 'Submitting…' : 'Submit company'}</button>
        </div>
        <div className="flex flex-col gap-2 sm:hidden">
          <div className="flex gap-2">
            <button onClick={() => router.push('/admin/setup/companies')} style={outlineBtn} className="flex-1 text-sm font-medium py-2.5 hover:opacity-90 transition whitespace-nowrap">✕ Close</button>
            <button onClick={() => onSaveDraft({})} disabled={saving} style={outlineBtn} className="flex-1 text-sm font-medium py-2.5 hover:opacity-90 transition disabled:opacity-50 whitespace-nowrap">💾 Save Draft</button>
            <button onClick={onBack} style={outlineBtn} className="flex-1 text-sm font-medium py-2.5 hover:opacity-90 transition whitespace-nowrap">← Back</button>
          </div>
          <button onClick={onSubmit} disabled={saving} style={primaryBtn} className="w-full text-sm font-medium py-2.5 hover:opacity-90 transition disabled:opacity-50">{saving ? 'Submitting…' : 'Submit company'}</button>
        </div>
        </>
        )}
      </div>
    </div>
  )
}
