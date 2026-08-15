// GOES IN: components/admin/OREV1-083-HelpDeskTicketList.tsx
'use client'
import { useTheme } from '@/lib/ThemeContext'

export type TicketRow = {
  id: string; ticket_number: string; reference_type: string; status_code: string
  next_followup_date: string | null; created_at: string
  entity_company_name?: string; category_name?: string; sub_category_name?: string
  reporting_office_name?: string; country_name?: string
}

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700', pending: 'bg-yellow-100 text-yellow-700',
  correction: 'bg-orange-100 text-orange-700', resubmitted: 'bg-purple-100 text-purple-700',
  escalate: 'bg-red-100 text-red-700', closed: 'bg-gray-200 text-gray-600'
}

const TYPE_LABELS: Record<string, string> = { entity: 'Entity', staff: 'Staff', customer: 'Customer' }

type Props = {
  rows: TicketRow[]; loading: boolean; page: number; totalPages: number; total: number; limit: number
  onPageChange: (p: number) => void; onLimitChange: (l: number) => void; onView: (r: TicketRow) => void; onEdit: (r: TicketRow) => void; onReopen: (r: TicketRow) => void
}

export default function OREV1083HelpDeskTicketList({ rows, loading, page, totalPages, total, limit, onPageChange, onLimitChange, onView, onEdit, onReopen }: Props) {
  const { theme } = useTheme()
  const badge = (s: string) => <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[s] || 'bg-gray-100 text-gray-500'}`}>{s}</span>
  const typeLabel = (t: string) => TYPE_LABELS[t] || t
  const isOverdue = (d: string | null) => d && new Date(d) < new Date()
  const cols = ['Ticket #', 'Type', 'Name', 'Category', 'Sub-category', 'Reporting Office', 'Country', 'Status', 'Follow-up', 'Created', 'Actions']

  return (
    <>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4 flex-wrap">
        <button onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1}
          className="bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-xl hover:bg-gray-50 disabled:opacity-40">‹ Prev</button>
        <input type="number" min={1} max={totalPages} value={page} onChange={e => onPageChange(Math.min(totalPages, Math.max(1, Number(e.target.value))))}
          className="w-12 text-center border border-gray-200 rounded-xl px-2 py-1.5 text-sm focus:outline-none" />
        <span>of {totalPages}</span>
        <button onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page === totalPages}
          className="bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-xl hover:bg-gray-50 disabled:opacity-40">Next ›</button>
        <span className="text-gray-300">|</span>
        <input type="number" min={1} value={limit} onChange={e => onLimitChange(Number(e.target.value))}
          className="w-14 text-center border border-gray-200 rounded-xl px-2 py-1.5 text-sm focus:outline-none" />
        <span className="text-gray-400">{total} total</span>
      </div>

      <div className="hidden md:block bg-white rounded-2xl border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead style={{ backgroundColor: theme?.table_header_bg || '#f9fafb' }}>
            <tr>{cols.map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold whitespace-nowrap" style={{ color: theme?.table_header_text || '#6b7280' }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={cols.length} className="text-center py-12 text-sm text-gray-400">Loading…</td></tr>}
            {!loading && rows.length === 0 && <tr><td colSpan={cols.length} className="text-center py-12 text-sm text-gray-400">No tickets found.</td></tr>}
            {!loading && rows.map(r => (
              <tr key={r.id} className="border-t border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs">{r.ticket_number}</td>
                <td className="px-4 py-3 text-gray-500">{typeLabel(r.reference_type)}</td>
                <td className="px-4 py-3 text-gray-700">{r.entity_company_name || '—'}</td>
                <td className="px-4 py-3 text-gray-500">{r.category_name}</td>
                <td className="px-4 py-3 text-gray-500">{r.sub_category_name}</td>
                <td className="px-4 py-3 text-gray-400">{r.reporting_office_name}</td>
                <td className="px-4 py-3 text-gray-400">{r.country_name}</td>
                <td className="px-4 py-3">{badge(r.status_code)}</td>
                <td className={`px-4 py-3 text-xs ${isOverdue(r.next_followup_date) ? 'text-red-600 font-semibold' : 'text-gray-400'}`}>
                  {r.next_followup_date || '—'}{isOverdue(r.next_followup_date) && ' ⚠'}
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">{new Date(r.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3 flex gap-2"><button onClick={() => onView(r)} title="View" className="text-gray-400 hover:text-gray-700 p-1">👁</button><button onClick={() => onEdit(r)} title="Edit" className="text-blue-500 hover:text-blue-700 p-1">✎</button>{r.status_code === 'closed' && <button onClick={() => onReopen(r)} title="Reopen" className="text-green-600 hover:text-green-800 p-1">↺</button>}</td>
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
              <p className="font-mono text-xs text-gray-400">{r.ticket_number}</p>{badge(r.status_code)}
            </div>
            {r.entity_company_name && <p className="text-sm font-semibold" style={{ color: theme?.color_text_primary || '#111827' }}>{r.entity_company_name}</p>}
            <div className="flex justify-between text-sm"><span className="text-gray-400">Type</span><span className="text-gray-700">{typeLabel(r.reference_type)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-400">Category</span><span className="text-gray-700">{r.category_name}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-400">Sub-category</span><span className="text-gray-700">{r.sub_category_name}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-400">Reporting Office</span><span className="text-gray-700">{r.reporting_office_name}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-400">Country</span><span className="text-gray-700">{r.country_name}</span></div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Follow-up</span>
              <span className={isOverdue(r.next_followup_date) ? 'text-red-600 font-semibold' : 'text-gray-700'}>{r.next_followup_date || '—'}{isOverdue(r.next_followup_date) && ' ⚠'}</span>
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-50 mt-1">
              <button onClick={() => onView(r)} title="View" className="text-gray-400 hover:text-gray-700 p-1">👁</button>
              <button onClick={() => onEdit(r)} title="Edit" className="text-blue-500 hover:text-blue-700 p-1">✎</button>
              {r.status_code === 'closed' && <button onClick={() => onReopen(r)} title="Reopen" className="text-green-600 hover:text-green-800 p-1">↺</button>}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
