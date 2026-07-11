'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTheme } from '@/lib/ThemeContext'
import toast from 'react-hot-toast'
import OREV1047BWizardStep1 from '@/components/admin/OREV1-047B-WizardStep1'
import OREV1047CWizardStep2 from '@/components/admin/OREV1-047C-WizardStep2'
import OREV1047DWizardStep3 from '@/components/admin/OREV1-047D-WizardStep3'
import OREV1047EWizardReview from '@/components/admin/OREV1-047E-WizardReview'

export type WizardData = {
  draft_id: string | null
  process_id: string | null
  legal_name: string; display_name: string; slug: string
  company_type: string; branch_type: string; company_code: string
  parent_company_id: string; reporting_company_id: string
  admin_user_id: string; admin_user_name: string
  admin_email: string; admin_invite_name: string; company_status: string
  same_address: boolean
  reg_pincode: string; reg_area: string; reg_line1: string; reg_line2: string
  reg_city_id: string; reg_city_name: string; reg_district_id: string; reg_district_name: string
  reg_state_id: string; reg_state_name: string; reg_country_id: string; reg_landmark: string
  op_pincode: string; op_area: string; op_line1: string; op_line2: string
  op_city_id: string; op_city_name: string; op_district_id: string; op_district_name: string
  op_state_id: string; op_state_name: string; op_country_id: string; op_landmark: string
}

const EMPTY: WizardData = {
  draft_id: null, process_id: null,
  legal_name: '', display_name: '', slug: '',
  company_type: '', branch_type: '', company_code: '', parent_company_id: '', reporting_company_id: '',
  admin_user_id: '', admin_user_name: '', admin_email: '', admin_invite_name: '', company_status: 'draft',
  same_address: true,
  reg_pincode: '', reg_area: '', reg_line1: '', reg_line2: '',
  reg_city_id: '', reg_city_name: '', reg_district_id: '', reg_district_name: '',
  reg_state_id: '', reg_state_name: '', reg_country_id: '', reg_landmark: '',
  op_pincode: '', op_area: '', op_line1: '', op_line2: '',
  op_city_id: '', op_city_name: '', op_district_id: '', op_district_name: '',
  op_state_id: '', op_state_name: '', op_country_id: '', op_landmark: '',
}

const STEPS = ['Basic details', 'Account admin', 'Address', 'Review & submit']

export default function OREV1047ACompanyWizard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { theme } = useTheme()
  const [step, setStep] = useState(0)
  const [data, setData] = useState<WizardData>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const viewOnly = searchParams.get('mode') === 'view'

  useEffect(() => {
    const ref = searchParams.get('ref')
    if (!ref || ref === 'undefined') return
    setLoading(true)
    fetch(`/admin/setup/companies/new/api?process_id=${ref}`)
      .then(r => r.ok ? r.json() : null)
      .then(json => {
        if (json?.data) {
          const d = json.data
setData({
            draft_id: d.id, process_id: d.process_id,
            legal_name: d.legal_name || '', display_name: d.display_name || '', slug: d.slug || '',
            company_type: d.company_type || '', branch_type: d.branch_type || '',
            company_code: d.company_code || '',
            parent_company_id: d.parent_company_id || '', reporting_company_id: d.reporting_company_id || '',
            admin_user_id: d.admin_user_id || '', admin_user_name: d.admin_user_name || '',
            admin_email: d.admin_email || '', admin_invite_name: d.admin_invite_name || '', company_status: d.company_status || 'draft',
            same_address: d.same_address ?? true,
            reg_pincode: d.reg_pincode || '', reg_area: d.reg_area || '',
            reg_line1: d.reg_line1 || '', reg_line2: d.reg_line2 || '',
            reg_city_id: d.reg_city_id || '', reg_city_name: d.reg_city_name || '',
            reg_district_id: d.reg_district_id || '', reg_district_name: d.reg_district_name || '',
            reg_state_id: d.reg_state_id || '', reg_state_name: d.reg_state_name || '',
            reg_country_id: d.reg_country_id || '', reg_landmark: d.reg_landmark || '',
            op_pincode: d.op_pincode || '', op_area: d.op_area || '',
            op_line1: d.op_line1 || '', op_line2: d.op_line2 || '',
            op_city_id: d.op_city_id || '', op_city_name: d.op_city_name || '',
            op_district_id: d.op_district_id || '', op_district_name: d.op_district_name || '',
            op_state_id: d.op_state_id || '', op_state_name: d.op_state_name || '',
            op_country_id: d.op_country_id || '', op_landmark: d.op_landmark || '',
          })
          if (d.company_status === 'draft' && d.wizard_step) setStep(d.wizard_step)
        }
        setLoading(false)
      })
      .catch(() => { toast.error('Failed to load draft'); setLoading(false) })
  }, [searchParams])

  const saveDraft = async (patch: Partial<WizardData>, currentStep: number) => {
    setSaving(true)
    const merged = { ...data, ...patch }
    const res = await fetch('/admin/setup/companies/new/api', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'save_draft', draft_id: merged.draft_id, wizard_step: currentStep, step_data: patch })
    })
    const json = await res.json()
    setSaving(false)
    if (json.error) { toast.error(json.error); return false }
    setData({ ...merged, draft_id: json.data.id, process_id: json.data.process_id, slug: json.data.slug })
    return true
  }

  const handleNext = async (patch: Partial<WizardData>) => {
    const ok = await saveDraft(patch, step + 1)
    if (ok) setStep(s => s + 1)
  }

  const handleSaveToDraft = async (patch: Partial<WizardData>) => {
    const ok = await saveDraft(patch, step)
    if (ok) { toast.success('Draft saved'); router.push('/admin/setup/companies') }
  }

  const handleSubmit = async () => {
    setSaving(true)
    const res = await fetch('/admin/setup/companies/new/api', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'submit', draft_id: data.draft_id, admin_user_id: data.admin_user_id, admin_email: data.admin_email, admin_invite_name: data.admin_invite_name })
    })
    setSaving(false)
    const json = await res.json()
    if (json.error) { toast.error('Submission failed'); return }
    const statusLabel = json.data?.company_status ? json.data.company_status.charAt(0).toUpperCase() + json.data.company_status.slice(1) : 'Pending'
    toast.success(`Company saved! Status: ${statusLabel}.`)
    router.push('/admin/setup/companies')
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: theme?.page_bg || '#f9fafb' }}>
      <p className="text-sm text-gray-400">Loading draft…</p>
    </div>
  )

  if (viewOnly) {
    return (
      <div className="px-4 md:px-8 py-4 md:py-6 max-w-3xl mx-auto" style={{ backgroundColor: theme?.page_bg || '#f9fafb', minHeight: '100vh' }}>
        <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
          <div>
            <h1 className="text-xl font-semibold" style={{ color: theme?.color_text_primary || '#111827' }}>Company details</h1>
            <p className="text-xs mt-0.5" style={{ color: theme?.color_text_muted || '#9ca3af' }}>View mode — read only</p>
          </div>
          {data.process_id && <span className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-600 font-medium">{data.process_id}</span>}
        </div>
        <OREV1047EWizardReview data={data} onBack={() => {}} onSaveDraft={() => {}} onSubmit={() => {}} saving={false} viewOnly
          onEdit={() => router.push(`/admin/setup/companies/new?ref=${data.process_id}`)} />
      </div>
    )
  }

  return (
    <div className="px-4 md:px-8 py-4 md:py-6 max-w-3xl mx-auto" style={{ backgroundColor: theme?.page_bg || '#f9fafb', minHeight: '100vh' }}>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: theme?.color_text_primary || '#111827' }}>Create company</h1>
          <p className="text-xs mt-0.5" style={{ color: theme?.color_text_muted || '#9ca3af' }}>Incomplete drafts are permanently deleted after 15 days</p>
        </div>
        {data.process_id && <span className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-600 font-medium">{data.process_id}</span>}
      </div>

      <div className="flex items-center mb-8 gap-0">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium border transition-all ${
                i < step ? 'bg-green-500 border-green-500 text-white' : i === step ? 'border-blue-900 bg-blue-900 text-white' : 'border-gray-300 bg-white text-gray-400'
              }`}>{i < step ? '✓' : i + 1}</div>
              <span className={`text-[10px] mt-1 text-center hidden sm:block ${i === step ? 'text-blue-900 font-medium' : 'text-gray-400'}`}>{label}</span>
            </div>
            {i < STEPS.length - 1 && <div className="h-px flex-1 bg-gray-200 mx-1 mb-4" />}
          </div>
        ))}
      </div>

      {step === 0 && <OREV1047BWizardStep1 data={data} onNext={handleNext} onSaveDraft={handleSaveToDraft} saving={saving} />}
      {step === 1 && <OREV1047CWizardStep2 data={data} onNext={handleNext} onSaveDraft={handleSaveToDraft} onBack={() => setStep(0)} saving={saving} />}
      {step === 2 && <OREV1047DWizardStep3 data={data} draftId={data.draft_id || ''} onNext={handleNext} onSaveDraft={handleSaveToDraft} onBack={() => setStep(1)} saving={saving} />}
      {step === 3 && <OREV1047EWizardReview data={data} onBack={() => setStep(2)} onSaveDraft={handleSaveToDraft} onSubmit={handleSubmit} saving={saving} />}
    </div>
  )
}
