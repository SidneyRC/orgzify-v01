'use client'
import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useTheme } from '@/lib/ThemeContext'
import OREV1056EntitySection1 from '@/components/admin/OREV1-056-EntitySection1'
import OREV1057EntitySection2 from '@/components/admin/OREV1-057-EntitySection2'
import OREV1058EntitySection3 from '@/components/admin/OREV1-058-EntitySection3'
import OREV1060EntitySection4 from '@/components/admin/OREV1-060-EntitySection4'
import OREV1068EntitySubmitOnly from '@/components/admin/OREV1-068-EntitySubmitOnly'
import OREV1061EntitySection5 from '@/components/admin/OREV1-061-EntitySection5'

const API = '/biz/register/api'

export type AuthorisedPerson = { full_name: string; mobile: string; whatsapp_number: string; email: string }
export type EntityDraft = {
  id: string; process_id: string; legal_name: string; display_name: string
  entity_type_id: string | null; status: string
  reporting_company_id: string | null; confirmed_country_id: string | null
  owner_notice: string | null
}

export default function OREV1055EntityRegistration() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { theme } = useTheme()
  const [entity, setEntity] = useState<EntityDraft | null>(null)
  const [person, setPerson] = useState<AuthorisedPerson | null>(null)
  const [entityTypeId, setEntityTypeId] = useState('')
  const [loading, setLoading] = useState(true)
  const [openSection, setOpenSection] = useState(1)
  const [readOnly, setReadOnly] = useState(searchParams.get('mode') === 'view')
  const [canEdit, setCanEdit] = useState(false)
  // Is the logged-in person the owner of this entity? Defaults to true
  // (a brand-new registration with no entity yet is always "your own").
  // This is the ONLY thing that decides where Close goes.
  const [isOwner, setIsOwner] = useState(true)

useEffect(() => {
    const ref = searchParams.get('ref')
    if (ref) {
      fetch(`${API}?process_id=${ref}`).then(r => r.json()).then(j => {
        if (j.data) {
          setEntity(j.data)
          setPerson(j.authorised_person)
          setEntityTypeId(j.data.entity_type_id || '')
          setCanEdit(!!j.can_edit)
          setIsOwner(j.is_owner !== false)
        }
        setLoading(false)
      })
    } else {
      fetch(`${API}?profile_only=true`).then(r => r.json()).then(j => {
        setPerson(j.authorised_person || null)
        setLoading(false)
      })
    }
  }, [searchParams.get('ref'), searchParams.get('mode')])

  // Owner can only ever submit/edit while status is genuinely 'draft'. Any
  // other status stays locked — re-checked whenever the URL's mode changes
  // (e.g. right after Submit navigates to mode=view) or the entity data
  // itself changes, not just once when the page first loads.
  useEffect(() => {
    const mode = searchParams.get('mode')
    if (mode === 'view') { setReadOnly(true); return }
    if (isOwner && entity && entity.status !== 'draft') { setReadOnly(true); return }
    setReadOnly(false)
  }, [searchParams, entity, isOwner])
  
  const handleEnableEdit = () => {
    setReadOnly(false)
    router.replace(`/biz/register?ref=${entity?.process_id}`)
  }

  const handleSection2Saved = (updated: EntityDraft) => {
    setEntity(updated)
    if (!searchParams.get('ref')) router.replace(`/biz/register?ref=${updated.process_id}`)
    setOpenSection(updated.reporting_company_id ? 3 : 99)
  }

  const goToViewAfterSubmit = () => {
    router.push(`/biz/register?ref=${entity?.process_id}&mode=view`)
  }

  // Single source of truth for where Close goes — computed once here,
  // handed down to every section instead of each one deciding separately.
  const origin = searchParams.get('origin')
  const closeUrl = origin === 'support' ? '/admin/ecosystem/support'
    : origin === 'entities' ? '/admin/ecosystem/entities'
    : isOwner ? '/' : '/admin/ecosystem/entities'

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: theme?.page_bg || '#f9fafb' }}>
      <p className="text-sm text-gray-400">Loading…</p>
    </div>
  )

  return (
    <div className="px-4 md:px-8 py-4 md:py-6 max-w-3xl mx-auto" style={{ backgroundColor: theme?.page_bg || '#f9fafb', minHeight: '100vh' }}>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: theme?.color_text_primary || '#111827' }}>Entity Registration</h1>
          <p className="text-xs mt-0.5" style={{ color: theme?.color_text_muted || '#9ca3af' }}>Company Details &amp; Address is saved first — earlier sections just collect info until then</p>
        </div>
        {entity && <span className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-600 font-medium">{entity.process_id}</span>}
      </div>

      {entity?.status === 'draft' && entity?.owner_notice && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800">
          {entity.owner_notice}
        </div>
      )}

      <div className="flex flex-col gap-3">

        <OREV1056EntitySection1
          person={person} entityTypeId={entityTypeId} onEntityTypeChange={setEntityTypeId}
          open={openSection === 1} onToggle={() => setOpenSection(openSection === 1 ? 0 : 1)}
          onNext={() => setOpenSection(2)}
          readOnly={readOnly} canEdit={canEdit} onEnableEdit={handleEnableEdit} closeUrl={closeUrl}
        />
        <OREV1057EntitySection2
          entity={entity} entityTypeId={entityTypeId}
          open={openSection === 2} onToggle={() => setOpenSection(openSection === 2 ? 0 : 2)}
          onSaved={handleSection2Saved}
          onBack={() => setOpenSection(1)}
          readOnly={readOnly} canEdit={canEdit} onEnableEdit={handleEnableEdit} closeUrl={closeUrl}
        />
        {entity?.reporting_company_id ? (
          <>
            <OREV1058EntitySection3
              entity={entity}
              open={openSection === 3} onToggle={() => setOpenSection(openSection === 3 ? 0 : 3)}
              onSaved={() => setOpenSection(4)}
              onBack={() => setOpenSection(2)}
              readOnly={readOnly} canEdit={canEdit} onEnableEdit={handleEnableEdit} closeUrl={closeUrl}
            />
            <OREV1060EntitySection4
              entity={entity}
              open={openSection === 4} onToggle={() => setOpenSection(openSection === 4 ? 0 : 4)}
              onSaved={() => setOpenSection(5)}
              onBack={() => setOpenSection(3)}
              readOnly={readOnly} canEdit={canEdit} onEnableEdit={handleEnableEdit} closeUrl={closeUrl}
            />
            <OREV1061EntitySection5
              entity={entity} person={person}
              open={openSection === 5} onToggle={() => setOpenSection(openSection === 5 ? 0 : 5)}
              onSaved={goToViewAfterSubmit}
              onBack={() => setOpenSection(4)}
              readOnly={readOnly} canEdit={canEdit} onEnableEdit={handleEnableEdit} closeUrl={closeUrl}
            />
          </>
        ) : entity && openSection === 99 ? (
          <OREV1068EntitySubmitOnly
            entity={entity}
            onSaved={goToViewAfterSubmit}
            onBack={() => setOpenSection(2)}
            readOnly={readOnly}
            closeUrl={closeUrl}
          />
        ) : null}

      </div>
    </div>
  )
}
