'use client'
import { useTheme } from '@/lib/ThemeContext'
import OREV1084TicketActivityList from '@/components/admin/OREV1-084-TicketActivityList'

type Props = { ticket: { id: string; entity_id: string; category: string; sub_category: string; entity: { process_id: string; display_name: string } }; canEdit?: boolean; onClose: () => void; onEdit: () => void }

export default function OREV1080TicketViewModal({ ticket, canEdit = true, onClose, onEdit }: Props) {
  const { theme } = useTheme()
  const radius = theme?.global_border_radius || '12px'
  const outlineBtn = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-sm font-semibold text-gray-700">{ticket.entity.display_name}</p>
            <p className="text-xs text-gray-400 font-mono">{ticket.entity.process_id}</p>
            <p className="text-xs text-gray-500 mt-1">{ticket.category} • {ticket.sub_category}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div className="flex gap-2 pb-4 border-b border-gray-100">
          <button onClick={() => window.open(`/biz/register?ref=${ticket.entity.process_id}&mode=view&origin=support`, '_blank')} style={outlineBtn} className="text-sm font-medium px-4 py-2 hover:opacity-90">Open Entity</button>
          {canEdit && <button onClick={onEdit} style={outlineBtn} className="text-sm font-medium px-4 py-2 hover:opacity-90">Edit</button>}
          <button onClick={onClose} style={outlineBtn} className="text-sm font-medium px-4 py-2 hover:opacity-90">Close</button>
        </div>

        <div className="pt-4">
          <OREV1084TicketActivityList ticketId={ticket.id} refreshKey={0} />
        </div>
      </div>
    </div>
  )
}
