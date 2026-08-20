// THIS FILE GOES IN: components/shared/OREV1-114F-TicketSlotRow.tsx (NEW FILE)
'use client'

type Props = { ticket: any; assignment: any; locked: boolean; onEdit: () => void; onDelete: () => void; onToggleEnabled: () => void; onToggleFastSelling: () => void; theme: any }

const IconEdit = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
const IconDelete = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>

function Toggle({ on, onClick, label, locked, theme }: { on: boolean; onClick: () => void; label: string; locked: boolean; theme: any }) {
  return (
    <div className="text-center">
      <p className="text-[10px] mb-0.5" style={{ color: theme?.color_text_muted || '#9ca3af' }}>{label}</p>
      <button type="button" disabled={locked} onClick={onClick} className="relative inline-flex h-[16px] w-7 items-center rounded-full transition shrink-0" style={{ backgroundColor: on ? (theme?.toggle_on || '#22c55e') : (theme?.toggle_off || '#e5e7eb') }}>
        <span className={`inline-block h-[11px] w-[11px] transform rounded-full bg-white transition ${on ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  )
}

export default function OREV1114FTicketSlotRow({ ticket, assignment, locked, onEdit, onDelete, onToggleEnabled, onToggleFastSelling, theme }: Props) {
  const canDelete = !locked && (assignment.sold_count || 0) === 0
  const priceLabel = ticket.ticket_type === 'free' ? 'Free' : `₹${assignment.price}`
  const headText = { color: theme?.color_text_primary || '#111827' }
  const mutedText = { color: theme?.color_text_muted || '#9ca3af' }

  return (
    <div className="py-3 px-3 border-b border-gray-50 last:border-0">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold" style={headText}>{ticket.name} <span className="font-normal" style={mutedText}>&middot; {priceLabel} &middot; {assignment.sold_count || 0}/{assignment.quantity} sold</span></p>
          {ticket.description && <p className="text-xs mt-0.5" style={mutedText}>{ticket.description}</p>}
          {assignment.goodies?.length > 0 && <p className="text-xs mt-0.5" style={mutedText}>Goodies: {assignment.goodies.join(', ')}</p>}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Toggle on={assignment.is_enabled} onClick={onToggleEnabled} label="Status" locked={locked} theme={theme} />
          <Toggle on={assignment.fast_selling_forced} onClick={onToggleFastSelling} label="Fast selling" locked={locked} theme={theme} />
          <button type="button" disabled={locked} onClick={onEdit} title="Edit price/seats/goodies" className="text-blue-400 hover:text-blue-700 transition p-1 rounded-lg hover:bg-blue-50"><IconEdit /></button>
          <button type="button" disabled={!canDelete} onClick={onDelete} title={canDelete ? 'Delete' : 'Cannot delete — has sales'} style={{ opacity: canDelete ? 1 : 0.35 }} className="text-red-400 hover:text-red-700 transition p-1 rounded-lg hover:bg-red-50"><IconDelete /></button>
        </div>
      </div>
    </div>
  )
}