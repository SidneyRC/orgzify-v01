// THIS FILE GOES IN: components/shared/OREV1-114D-TicketCard.tsx (NEW FILE)
'use client'

type Props = { ticket: any; locked: boolean; onToggleEnabled: () => void; onToggleFastSelling: () => void; onEdit: () => void; onDelete: () => void; theme: any }

const IconEdit = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
const IconDelete = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>

function Toggle({ on, onClick, label, locked, theme }: { on: boolean; onClick: () => void; label: string; locked: boolean; theme: any }) {
  return (
    <div className="text-center">
      <p className="text-[11px] mb-1" style={{ color: theme?.color_text_muted || '#9ca3af' }}>{label}</p>
      <button type="button" disabled={locked} onClick={onClick} className="relative inline-flex h-[18px] w-8 items-center rounded-full transition shrink-0" style={{ backgroundColor: on ? (theme?.toggle_on || '#22c55e') : (theme?.toggle_off || '#e5e7eb') }}>
        <span className={`inline-block h-[13px] w-[13px] transform rounded-full bg-white transition ${on ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </button>
    </div>
  )
}
function Actions({ canDelete, onEdit, onDelete }: { canDelete: boolean; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex gap-1 items-center">
      <button type="button" onClick={onEdit} title="Edit" className="text-blue-400 hover:text-blue-700 transition p-1 rounded-lg hover:bg-blue-50"><IconEdit /></button>
      <button type="button" disabled={!canDelete} onClick={onDelete} title={canDelete ? 'Delete' : 'Cannot delete — has sales'} style={{ opacity: canDelete ? 1 : 0.35 }} className="text-red-400 hover:text-red-700 transition p-1 rounded-lg hover:bg-red-50"><IconDelete /></button>
    </div>
  )
}

export default function OREV1114DTicketCard({ ticket, locked, onToggleEnabled, onToggleFastSelling, onEdit, onDelete, theme }: Props) {
  const canDelete = !locked && (ticket.sold_count || 0) === 0
  const priceLabel = ticket.ticket_type === 'free' ? 'Free' : `₹${ticket.price}`
  const headText = { color: theme?.color_text_primary || '#111827' }
  const mutedText = { color: theme?.color_text_muted || '#9ca3af' }

  return (
    <>
      {/* Desktop */}
      <div className="hidden sm:flex bg-white rounded-2xl border border-gray-100 px-4 py-3 items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold" style={headText}>{ticket.name} <span className="font-normal" style={mutedText}>&middot; {priceLabel} &middot; {ticket.sold_count || 0}/{ticket.quantity} sold</span></p>
          <p className="text-xs mt-1" style={mutedText}>{ticket.description || 'No description'}</p>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <Toggle on={ticket.is_enabled} onClick={onToggleEnabled} label="Status" locked={locked} theme={theme} />
          <Toggle on={ticket.fast_selling_forced} onClick={onToggleFastSelling} label="Fast selling" locked={locked} theme={theme} />
          <Actions canDelete={canDelete} onEdit={onEdit} onDelete={onDelete} />
        </div>
      </div>

      {/* Mobile */}
      <div className="sm:hidden bg-white rounded-2xl border border-gray-100 p-4 flex flex-col gap-3 shadow-sm">
        <div>
          <p className="text-sm font-semibold" style={headText}>{ticket.name}</p>
          <p className="text-xs mt-0.5" style={mutedText}>{priceLabel} &middot; {ticket.sold_count || 0}/{ticket.quantity} sold</p>
        </div>
        <p className="text-xs" style={mutedText}>{ticket.description || 'No description'}</p>
        <div className="flex items-center justify-between pt-2 border-t border-gray-50">
          <div className="flex gap-4">
            <Toggle on={ticket.is_enabled} onClick={onToggleEnabled} label="Status" locked={locked} theme={theme} />
            <Toggle on={ticket.fast_selling_forced} onClick={onToggleFastSelling} label="Fast selling" locked={locked} theme={theme} />
          </div>
          <Actions canDelete={canDelete} onEdit={onEdit} onDelete={onDelete} />
        </div>
      </div>
    </>
  )
}
