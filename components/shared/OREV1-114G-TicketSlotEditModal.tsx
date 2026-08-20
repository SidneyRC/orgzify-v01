// THIS FILE GOES IN: components/shared/OREV1-114G-TicketSlotEditModal.tsx (NEW FILE)
'use client'
import { useState } from 'react'

type Props = { ticket: any; assignment: any; onSave: (fields: { price: number; quantity: number; goodies: string[] }) => void; onCancel: () => void; theme: any }
const GOODIE_SUGGESTIONS = ['Welcome Kit', 'Participant Kit', 'Winner Kit', 'Goodie Kit', 'BIB', 'Medal', 'Certificate', 'Digital Certificate', 'T-Shirt', 'Refreshments', 'Water Bottle', 'Trophy', 'Cap', 'Backpack', 'Wristband', 'Voucher', 'Gift Hamper', 'Sports Kit', 'Stationery Kit', 'Badge']

export default function OREV1114GTicketSlotEditModal({ ticket, assignment, onSave, onCancel, theme }: Props) {
  const [price, setPrice] = useState(assignment.price)
  const [qty, setQty] = useState(assignment.quantity)
  const [goodies, setGoodies] = useState<string[]>(assignment.goodies || [])
  const [goodieInput, setGoodieInput] = useState('')
  const radius = theme?.global_border_radius || '12px'
  const inputStyle = { backgroundColor: theme?.input_bg || '#fff', border: `1px solid ${theme?.input_border || '#e5e7eb'}`, borderRadius: radius }
  const labelStyle = { color: theme?.color_text_muted || '#9ca3af' }
  const addGoodie = (val: string) => { if (GOODIE_SUGGESTIONS.includes(val) && !goodies.includes(val)) setGoodies([...goodies, val]); setGoodieInput('') }
  const removeGoodie = (i: number) => setGoodies(goodies.filter((_, idx) => idx !== i))
  const matches = GOODIE_SUGGESTIONS.filter(g => !goodies.includes(g) && g.toLowerCase().includes(goodieInput.trim().toLowerCase()))
  const handleSave = () => onSave({ price: ticket.ticket_type === 'free' ? 0 : Math.max(1, Number(price) || 1), quantity: Math.max(0, Number(qty) || 0), goodies })

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-5">
        <p className="text-sm font-semibold mb-4" style={{ color: theme?.color_text_primary || '#111827' }}>{ticket.name}</p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          {ticket.ticket_type !== 'free' && (
            <div><label className="text-xs font-medium block mb-1" style={labelStyle}>Price</label>
              <input type="number" value={price} onChange={e => setPrice(e.target.value as any)} className="h-10 px-3 text-sm w-full focus:outline-none" style={inputStyle} /></div>
          )}
          <div><label className="text-xs font-medium block mb-1" style={labelStyle}>Seats</label>
            <input type="number" value={qty} onChange={e => setQty(e.target.value as any)} className="h-10 px-3 text-sm w-full focus:outline-none" style={inputStyle} /></div>
        </div>
        <label className="text-xs font-medium block mb-1" style={labelStyle}>Goodies</label>
        <div className="relative">
          <input placeholder="Search a goodie" value={goodieInput} onChange={e => setGoodieInput(e.target.value)} className="h-9 px-3 text-sm w-full focus:outline-none" style={inputStyle} />
          {goodieInput.trim() && (
            <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-sm z-10 max-h-32 overflow-y-auto">
              {matches.map(g => <button key={g} type="button" onClick={() => addGoodie(g)} className="w-full text-left text-xs px-3 py-2 hover:bg-gray-50 border-b border-gray-50 last:border-0">{g}</button>)}
              {matches.length === 0 && <p className="text-xs px-3 py-2" style={labelStyle}>No matching goodie</p>}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {goodies.map((g, i) => <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 flex items-center gap-1.5">{g}<button type="button" onClick={() => removeGoodie(i)}>✕</button></span>)}
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onCancel} style={{ backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }} className="px-4 py-2 text-sm">Cancel</button>
          <button onClick={handleSave} style={{ backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }} className="px-4 py-2 text-sm">Save</button>
        </div>
      </div>
    </div>
  )
}