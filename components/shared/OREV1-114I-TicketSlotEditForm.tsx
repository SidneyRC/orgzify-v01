// THIS FILE GOES IN: components/shared/OREV1-114I-TicketSlotEditForm.tsx (NEW FILE)
'use client'
import { useState } from 'react'

type Props = { ticket: any; assignments: any[]; venues: any[]; clickedAssignmentId: string; locked: boolean; onSave: (payload: any) => void; onCancel: () => void; theme: any }
const GOODIE_SUGGESTIONS = ['Welcome Kit', 'Participant Kit', 'Winner Kit', 'Goodie Kit', 'BIB', 'Medal', 'Certificate', 'Digital Certificate', 'T-Shirt', 'Refreshments', 'Water Bottle', 'Trophy', 'Cap', 'Backpack', 'Wristband', 'Voucher', 'Gift Hamper', 'Sports Kit', 'Stationery Kit', 'Badge']

function formatDate(d: string) { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }
function formatTime(t: string) { const [h, m] = t.split(':'); const hr = parseInt(h, 10); const ap = hr >= 12 ? 'PM' : 'AM'; return `${hr % 12 === 0 ? 12 : hr % 12}:${m} ${ap}` }
function Field({ label, span2, children, theme }: { label: string; span2?: boolean; children: any; theme: any }) {
  return <div className={span2 ? 'sm:col-span-2' : ''}><label className="text-xs font-medium block mb-1" style={{ color: theme?.color_text_muted || '#9ca3af' }}>{label}</label>{children}</div>
}

export default function OREV1114ITicketSlotEditForm({ ticket, assignments, venues, clickedAssignmentId, locked, onSave, onCancel, theme }: Props) {
  const clicked = assignments.find(a => a.id === clickedAssignmentId)
  const [name, setName] = useState(ticket.name || '')
  const [peoplePerTicket, setPeoplePerTicket] = useState(ticket.people_per_ticket || 1)
  const [price, setPrice] = useState(clicked?.price ?? '')
  const [qty, setQty] = useState(clicked?.quantity ?? '')
  const [desc, setDesc] = useState(clicked?.description ?? '')
  const [goodies, setGoodies] = useState<string[]>(clicked?.goodies || [])
  const [goodieInput, setGoodieInput] = useState('')
  const [checked, setChecked] = useState<string[]>(clicked ? [clicked.event_venue_time_id] : [])
  const [errors, setErrors] = useState<any>({})

  const radius = theme?.global_border_radius || '12px'
  const inputStyle = { backgroundColor: theme?.input_bg || '#fff', border: `1px solid ${theme?.input_border || '#e5e7eb'}`, borderRadius: radius }
  const labelStyle = { color: theme?.color_text_muted || '#9ca3af' }
  const addGoodie = (v: string) => { if (GOODIE_SUGGESTIONS.includes(v) && !goodies.includes(v)) setGoodies([...goodies, v]); setGoodieInput('') }
  const matches = GOODIE_SUGGESTIONS.filter(g => !goodies.includes(g) && g.toLowerCase().includes(goodieInput.trim().toLowerCase()))

  const toggle = (timeId: string, sold: boolean) => { if (sold) return; setChecked(c => c.includes(timeId) ? c.filter(x => x !== timeId) : [...c, timeId]) }

  const validate = () => { const e: any = {}; if (!name.trim()) e.name = 'Required'; if (ticket.ticket_type === 'paid' && Number(price) < 1) e.price = 'Minimum price is ₹1'; if (!peoplePerTicket || Number(peoplePerTicket) < 1) e.peoplePerTicket = 'Required'; if (!qty || Number(qty) < 1) e.qty = 'Required'; setErrors(e); return Object.keys(e).length === 0 }
  const handleSave = () => {
    if (!validate()) return
    onSave({
      identity: { name, people_per_ticket: Number(peoplePerTicket) || 1, ticket_type: ticket.ticket_type },
      slot: { price: ticket.ticket_type === 'free' ? 0 : Math.max(1, Number(price) || 1), quantity: Math.max(0, Number(qty) || 0), description: desc, goodies },
      checkedTimeIds: checked,
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="px-6 py-4"><p className="text-sm font-semibold text-gray-700">Edit ticket</p></div>
      <div className="px-6 pb-6 border-t border-gray-50 pt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Ticket name" span2 theme={theme}><input disabled={locked} value={name} onChange={e => setName(e.target.value)} className="h-10 px-3 text-sm w-full focus:outline-none" style={inputStyle} />{errors.name && <span className="text-[10px] text-red-500 block mt-0.5">{errors.name}</span>}</Field>
        {ticket.ticket_type !== 'free' && <Field label="Price" theme={theme}><input type="number" min="1" disabled={locked} value={price} onChange={e => setPrice(e.target.value)} className="h-10 px-3 text-sm w-full focus:outline-none" style={inputStyle} />{errors.price && <span className="text-[10px] text-red-500 block mt-0.5">{errors.price}</span>}</Field>}
        <Field label="People per ticket" theme={theme}><input type="number" disabled={locked} value={peoplePerTicket} onChange={e => setPeoplePerTicket(e.target.value)} className="h-10 px-3 text-sm w-full focus:outline-none" style={inputStyle} />{errors.peoplePerTicket && <span className="text-[10px] text-red-500 block mt-0.5">{errors.peoplePerTicket}</span>}</Field>
        <Field label="Quantity for sale" theme={theme}><input type="number" disabled={locked} value={qty} onChange={e => setQty(e.target.value)} className="h-10 px-3 text-sm w-full focus:outline-none" style={inputStyle} />{errors.qty && <span className="text-[10px] text-red-500 block mt-0.5">{errors.qty}</span>}</Field>
        <Field label="Description" span2 theme={theme}><textarea disabled={locked} value={desc} onChange={e => setDesc(e.target.value)} className="px-3 py-2 text-sm w-full h-16 focus:outline-none" style={inputStyle} /></Field>
      </div>
      <div className="px-6 pb-4">
        <label className="text-xs font-medium block mb-1" style={labelStyle}>Goodies</label>
        <div className="relative">
          <input placeholder="Search a goodie" disabled={locked} value={goodieInput} onChange={e => setGoodieInput(e.target.value)} className="h-9 px-3 text-sm w-full focus:outline-none" style={inputStyle} />
          {goodieInput.trim() && <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-sm z-10 max-h-32 overflow-y-auto">
            {matches.map(g => <button key={g} type="button" onClick={() => addGoodie(g)} className="w-full text-left text-xs px-3 py-2 hover:bg-gray-50 border-b border-gray-50 last:border-0">{g}</button>)}
          </div>}
        </div>
        <div className="flex flex-wrap gap-2 mt-2">{goodies.map((g, i) => <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 flex items-center gap-1.5">{g}<button type="button" onClick={() => setGoodies(goodies.filter((_, idx) => idx !== i))}>✕</button></span>)}</div>
      </div>
      <div className="px-6 pb-6">
        <label className="text-xs font-medium block mb-2" style={labelStyle}>Apply to these dates &amp; times</label>
        <div className="rounded-xl border border-gray-100 overflow-hidden">
          {venues.map((v: any, vi: number) => (
            <div key={v.id}>
              <div className="px-4 py-2 bg-gray-50" style={{ borderTop: vi > 0 ? '1px solid #f3f4f6' : undefined }}><span className="text-xs font-semibold text-gray-600">{v.venues?.external_name || 'Venue'}</span></div>
              <div className="px-4 py-3 flex flex-col gap-2">
                {v.event_venue_dates?.map((d: any) => d.event_venue_times?.map((t: any) => {
                  const existing = assignments.find(a => a.event_venue_time_id === t.id)
                  const sold = (existing?.sold_count || 0) > 0
                  const priceNote = existing ? `currently ${ticket.ticket_type === 'free' ? 'Free' : '₹' + existing.price}` : 'not yet added'
                  return (
                    <label key={t.id} className="flex items-center justify-between p-2 rounded-lg border border-gray-100" style={{ opacity: sold ? 0.5 : 1, cursor: sold ? 'not-allowed' : 'pointer' }}>
                      <span className="text-xs text-gray-700">{formatDate(d.event_date)} &middot; {formatTime(t.start_time)} &middot; <span style={labelStyle}>{priceNote}</span> {sold && <span className="text-[10px] text-red-500 ml-1">Sold — locked</span>}</span>
                      <input type="checkbox" disabled={locked || sold} checked={checked.includes(t.id)} onChange={() => toggle(t.id, sold)} />
                    </label>
                  )
                }))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2 px-6 pb-6">
        <button onClick={onCancel} style={{ backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }} className="px-4 py-2 text-sm">✕ Cancel</button>
        {!locked && <button onClick={handleSave} style={{ backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }} className="px-4 py-2 text-sm">Save ticket</button>}
      </div>
    </div>
  )
}
