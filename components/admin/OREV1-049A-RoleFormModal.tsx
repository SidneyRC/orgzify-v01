// GOES IN: components/admin/OREV1-049A-RoleFormModal.tsx
'use client'
import { useTheme } from '@/lib/ThemeContext'
import { ADMIN_MODULES as PAGES, ADMIN_MODULE_LABELS as PAGE_LABELS, ADMIN_MODULE_RIGHTS as PAGE_RIGHTS, ADMIN_MODULE_EXTRA_RIGHTS as EXTRA_RIGHTS } from '@/lib/adminModules'

const RIGHTS = [
  { key: 'can_view', label: 'View' }, { key: 'can_create', label: 'Create' },
  { key: 'can_edit', label: 'Edit' }, { key: 'can_delete', label: 'Delete' },
  { key: 'can_archive', label: 'Archive' }, { key: 'can_download_non_sensitive', label: 'Download' },
  { key: 'can_download_sensitive', label: 'Download Sensitive' },
  { key: 'can_overwrite_edit', label: 'Overwrite Edit' },
  { key: 'can_approve', label: 'Approval' },
  { key: 'can_restore', label: 'Restore' },
  { key: 'can_activate', label: 'Activate' },
  { key: 'can_hard_delete', label: 'Hard Delete' },
  { key: 'can_sync', label: 'Sync' },
]

const rightsForPage = (page: string) => {
  const standard = PAGE_RIGHTS[page] || ['can_view', 'can_create', 'can_edit', 'can_delete', 'can_archive', 'can_download_non_sensitive']
  const extra = EXTRA_RIGHTS[page] || []
  const allowed = [...standard, ...extra]
  return RIGHTS.filter(r => allowed.includes(r.key))
}

type Props = {
  isEdit: boolean
  readOnly?: boolean
  name: string; setName: (v: string) => void
  companyId: string; setCompanyId: (v: string) => void
  status: string; setStatus: (v: string) => void
  companies: { id: string; display_name: string }[]
  perms: Record<string, Record<string, boolean>>
  togglePerm: (page: string, key: string) => void
  saving: boolean
  onCancel: () => void
  onSave: () => void
  onSwitchToEdit?: () => void
}

export default function OREV1049ARoleFormModal({
  isEdit, readOnly, name, setName, companyId, setCompanyId, status, setStatus,
  companies, perms, togglePerm, saving, onCancel, onSave, onSwitchToEdit,
}: Props) {
  const { theme } = useTheme()
  const radius = theme?.global_border_radius || '12px'
  const primaryBtn = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }
  const outlineBtn = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }
  const inputClass = "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mb-4 bg-white focus:outline-none focus:border-blue-400 disabled:bg-gray-50 disabled:text-gray-500"

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto">
        <h2 className="text-base font-semibold mb-1" style={{ color: theme?.color_text_primary || '#111827' }}>
          {readOnly ? 'View Role' : isEdit ? 'Edit Role' : 'Create Role'}
        </h2>
        <p className="text-xs text-gray-400 mb-4">{readOnly ? 'Read-only view of this role.' : 'Set a name, pick a company, and choose rights per page.'}</p>

        <label className="text-xs text-gray-500 block mb-1">Role Name</label>
        <input value={name} onChange={e => setName(e.target.value)} disabled={readOnly} placeholder="e.g. Front Desk Staff" className={inputClass} />

        <label className="text-xs text-gray-500 block mb-1">Company</label>
        <select value={companyId} onChange={e => setCompanyId(e.target.value)} disabled={readOnly} className={inputClass}>
          <option value="">Select a company</option>
          {companies.map(c => <option key={c.id} value={c.id}>{c.display_name}</option>)}
        </select>

        {(isEdit || readOnly) && (
          <>
            <label className="text-xs text-gray-500 block mb-1">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} disabled={readOnly} className={inputClass}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </select>
          </>
        )}

        {PAGES.map(page => (
          <div key={page} className="mb-4">
            <p className="text-xs font-medium text-gray-600 mb-2">{PAGE_LABELS[page]} page permissions</p>
            <div className="grid grid-cols-2 gap-2">
              {rightsForPage(page).map(r => (
                <label key={r.key} className={`flex items-center gap-2 text-xs ${readOnly ? 'text-gray-400' : 'text-gray-600'}`}>
                  <input type="checkbox" checked={!!perms[page]?.[r.key]} disabled={readOnly} onChange={() => togglePerm(page, r.key)} />
                  {r.label}
                </label>
              ))}
            </div>
          </div>
        ))}

        <div className="flex justify-end gap-2 mt-2">
          <button onClick={onCancel} style={outlineBtn} className="text-sm font-medium px-4 py-2">Close</button>
          {readOnly ? (
            <button onClick={onSwitchToEdit} style={primaryBtn} className="text-sm font-medium px-4 py-2">Edit</button>
          ) : (
            <button onClick={onSave} disabled={saving} style={primaryBtn} className="text-sm font-medium px-4 py-2 disabled:opacity-50">
              {saving ? 'Saving…' : isEdit ? 'Update Role' : 'Save Role'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
