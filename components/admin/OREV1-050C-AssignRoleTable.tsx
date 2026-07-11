'use client'
type Row = { id: string; person_name: string; email: string; company_id: string; company_name: string; role_id: string; role_name: string; status: string }
type Props = { rows: Row[]; loading: boolean; theme: any; onToggle: (r: Row) => void; onView: (r: Row) => void; onEdit: (r: Row) => void; ownCompanyId?: string | null; canEdit?: boolean }

const IconView = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
const IconEdit = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
const IconPause = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
const IconPlay = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>

export default function OREV1050CAssignRoleTable({ rows, loading, theme, onToggle, onView, onEdit, ownCompanyId = null, canEdit = true }: Props) {
  const badge = (s: string) => `text-xs px-2 py-1 rounded-full font-medium ${s === 'active' ? 'bg-green-100 text-green-700' : s === 'archived' ? 'bg-gray-100 text-gray-500' : 'bg-red-100 text-red-600'}`
  const Actions = ({ r }: { r: Row }) => {
    const isOwn = r.company_id === ownCompanyId
    const editable = !isOwn && canEdit && r.status !== 'archived'
    return (
      <div className="flex items-center gap-3">
        <button onClick={() => onView(r)} title="View" className="text-gray-500 hover:text-gray-700"><IconView /></button>
        {editable && <button onClick={() => onEdit(r)} title="Edit" className="text-blue-600 hover:text-blue-800"><IconEdit /></button>}
        {editable && (
          <button onClick={() => onToggle(r)} title={r.status === 'active' ? 'Deactivate' : 'Reactivate'} className={r.status === 'active' ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}>
            {r.status === 'active' ? <IconPause /> : <IconPlay />}
          </button>
        )}
      </div>
    )
  }
  return (
    <>
      <div className="hidden md:block bg-white rounded-2xl border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead style={{ backgroundColor: theme?.table_header_bg || '#f9fafb' }}>
            <tr>{['Person', 'Email', 'Company', 'Role', 'Status', 'Actions'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: theme?.table_header_text || '#6b7280' }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="text-center py-12 text-sm text-gray-400">Loading…</td></tr>}
            {!loading && rows.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-sm text-gray-400">No assignments found.</td></tr>}
            {!loading && rows.map(r => (
              <tr key={r.id} className="border-t border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium" style={{ color: theme?.color_text_primary || '#111827' }}>{r.person_name}</td>
                <td className="px-4 py-3 text-gray-500">{r.email}</td>
                <td className="px-4 py-3 text-gray-500">{r.company_name}</td>
                <td className="px-4 py-3 text-gray-500">{r.role_name}</td>
                <td className="px-4 py-3"><span className={`${badge(r.status)} capitalize`}>{r.status}</span></td>
                <td className="px-4 py-3"><Actions r={r} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="md:hidden flex flex-col gap-3">
        {loading && <p className="text-center py-12 text-sm text-gray-400">Loading…</p>}
        {!loading && rows.length === 0 && <p className="text-center py-12 text-sm text-gray-400">No assignments found.</p>}
        {!loading && rows.map(r => (
          <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col gap-3 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate" style={{ color: theme?.color_text_primary || '#111827' }}>{r.person_name}</p>
                <p className="text-xs text-gray-400 mt-0.5 truncate">{r.email}</p>
              </div>
              <span className={`${badge(r.status)} shrink-0 capitalize`}>{r.status}</span>
            </div>
<div className="rounded-xl bg-gray-50 px-3 py-2 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">Company</p>
                <p className="text-xs text-gray-700 font-medium">{r.company_name}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">Role</p>
                <p className="text-xs text-gray-700 font-medium">{r.role_name}</p>
              </div>
            </div>
            <div className="flex justify-end pt-1"><Actions r={r} /></div>
          </div>
        ))}
      </div>
    </>
  )
}