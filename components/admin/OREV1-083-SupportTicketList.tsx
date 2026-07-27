'use client'
import { useTheme } from '@/lib/ThemeContext'

export type TicketRow = {
  id: string; category: string; sub_category: string; status: string; entity_id: string
  entity: { process_id: string; display_name: string; legal_name: string; country_name: string }
  reporting_company: { display_name: string } | null; created_at: string
}

const STATUS_COLORS: Record<string, string> = {
  New: 'bg-blue-100 text-blue-700', Pending: 'bg-yellow-100 text-yellow-700',
  Correction: 'bg-orange-100 text-orange-700', Resubmitted: 'bg-purple-100 text-purple-700',
  Escalate: 'bg-red-100 text-red-700', Closed: 'bg-gray-200 text-gray-600'
}

type Props = { rows: TicketRow[]; loading: boolean; page: number; totalPages: number; total: number; canEdit?: boolean; onView: (r: TicketRow) => void; onEdit: (r: TicketRow) => void; onPageChange: (p: number) => void }

export default function OREV1083SupportTicketList({ rows, loading, page, totalPages, total, canEdit = true, onView, onEdit, onPageChange }: Props) {
  const { theme } = useTheme()
  const badge = (s: string) => <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[s] || 'bg-gray-100 text-gray-500'}`}>{s}</span>

  return (
    <>
      <div className="hidden md:block bg-white rounded-2xl border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead style={{ backgroundColor: theme?.table_header_bg || '#f9fafb' }}>
            <tr>{['Process ID', 'Entity', 'Category', 'Sub-category', 'Country', 'Reporting Office', 'Status', 'Actions'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: theme?.table_header_text || '#6b7280' }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={8} className="text-center py-12 text-sm text-gray-400">Loading…</td></tr>}
            {!loading && rows.length === 0 && <tr><td colSpan={8} className="text-center py-12 text-sm text-gray-400">No tickets found.</td></tr>}
            {!loading && rows.map(r => (
              <tr key={r.id} className="border-t border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-400 text-xs font-mono">{r.entity.process_id || '—'}</td>
                <td className="px-4 py-3 font-medium" style={{ color: theme?.color_text_primary || '#111827' }}>{r.entity.display_name}</td>
                <td className="px-4 py-3 text-gray-500">{r.category}</td>
                <td className="px-4 py-3 text-gray-500">{r.sub_category}</td>
                <td className="px-4 py-3 text-gray-400">{r.entity.country_name || '—'}</td>
                <td className="px-4 py-3 text-gray-400">{r.reporting_company?.display_name || '—'}</td>
                <td className="px-4 py-3">{badge(r.status)}</td>
                <td className="px-4 py-3 flex gap-2">
                  <button onClick={() => onView(r)} title="View" className="text-gray-400 hover:text-gray-700 p-1">👁</button>
                  {canEdit && <button onClick={() => onEdit(r)} title="Edit" className="text-blue-500 hover:text-blue-700 p-1">✎</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden flex flex-col gap-3">
        {loading && <p className="text-center py-12 text-sm text-gray-400">Loading…</p>}
        {!loading && rows.length === 0 && <p className="text-center py-12 text-sm text-gray-400">No tickets found.</p>}
        {!loading && rows.map(r => (
          <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col gap-2 shadow-sm">
            <div className="flex justify-between items-start">
              <p className="font-semibold text-sm" style={{ color: theme?.color_text_primary || '#111827' }}>{r.entity.display_name}</p>
              {badge(r.status)}
            </div>
            <div className="flex justify-between text-xs text-gray-400"><span>{r.entity.process_id}</span><span>{r.sub_category}</span></div>
            <div className="flex justify-between text-xs text-gray-400"><span>{r.entity.country_name || '—'}</span><span>{r.reporting_company?.display_name || '—'}</span></div>
            <div className="flex justify-end gap-3 pt-1">
              <button onClick={() => onView(r)} className="text-xs text-gray-500">View</button>
              {canEdit && <button onClick={() => onEdit(r)} className="text-xs text-blue-600">Edit</button>}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-500 mt-4 flex-wrap">
        <button onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1} className="bg-white border border-gray-200 px-3 py-1.5 rounded-xl disabled:opacity-40">‹ Prev</button>
        <span>Page {page} of {totalPages}</span>
        <button onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="bg-white border border-gray-200 px-3 py-1.5 rounded-xl disabled:opacity-40">Next ›</button>
        <span className="text-gray-400">{total} total</span>
      </div>
    </>
  )
}
