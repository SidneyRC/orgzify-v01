// THIS FILE GOES IN: components/shared/OREV1-114B-TicketCategoryForm.tsx (NEW FILE)
'use client'
import { useState } from 'react'
type Props = { ticket: any | null; locked: boolean; onSave: (fields: any) => void; onCancel: () => void; theme: any; defaultSaleEnd?: string }
const GOODIE_SUGGESTIONS = ['Welcome Kit', 'Participant Kit', 'Winner Kit', 'Goodie Kit', 'BIB', 'Medal', 'Certificate', 'Digital Certificate', 'T-Shirt', 'Refreshments', 'Water Bottle', 'Trophy', 'Cap', 'Backpack', 'Wristband', 'Voucher', 'Gift Hamper', 'Sports Kit', 'Stationery Kit', 'Badge']
function Field({ label, span2, children, theme }: { label: string; span2?: boolean; children: any; theme: any }) {
  return (
    <div className={span2 ? 'sm:col-span-2' : ''}>
      <label className="text-xs font-medium block mb-1" style={{ color: theme?.color_text_muted || '#9ca3af' }}>{label}</label>
      {children}
    </div>
  )
}
function TypeBtn({ val, label, active, locked, onClick, theme }: { val: string; label: string; active: boolean; locked: boolean; onClick: () => void; theme: any }) {
  return (
    <button type="button" disabled={locked} onClick={onClick} className="text-sm px-4 py-1.5 rounded-full"
      style={active ? { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff' } : { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#374151', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}` }}>
      {label}
    </button>
  )
}
export default function OREV1114BTicketCategoryForm({ ticket, locked, onSave, onCancel, theme, defaultSaleEnd }: Props) {
  const isEditing = !!ticket?.id
  const [f, setF] = useState({
    name: ticket?.name || '', ticket_type: ticket?.ticket_type || 'paid', price: ticket?.price || '',
    people_per_ticket: ticket?.people_per_ticket || '', quantity: ticket?.quantity || '',
    description: ticket?.description || '', goodies: ticket?.goodies || [] as string[],
    sale_window_enabled: ticket?.sale_window_enabled || false, sale_start: ticket?.sale_start || '', sale_end: ticket?.sale_end || '',
  })
  const [goodieInput, setGoodieInput] = useState('')
  const radius = theme?.global_border_radius || '12px'
  const inputStyle = { backgroundColor: theme?.input_bg || '#fff', border: `1px solid ${theme?.input_border || '#e5e7eb'}`, borderRadius: radius }
  const labelStyle = { color: theme?.color_text_muted || '#9ca3af' }
  const set = (k: string, v: any) => setF(p => ({ ...p, [k]: v }))
  const handleSave = () => onSave({ ...f, price: f.ticket_type === 'free' ? 0 : (f.price || 0), quantity: f.quantity || 0, people_per_ticket: f.people_per_ticket || 1 })
  const addGoodie = (val: string) => { if (GOODIE_SUGGESTIONS.includes(val) && !f.goodies.includes(val)) set('goodies', [...f.goodies, val]); setGoodieInput('') }
  const removeGoodie = (i: number) => set('goodies', f.goodies.filter((_: string, idx: number) => idx !== i))
  const matches = GOODIE_SUGGESTIONS.filter(g => !f.goodies.includes(g) && g.toLowerCase().includes(goodieInput.trim().toLowerCase()))
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="px-6 py-4"><p className="text-sm font-semibold text-gray-700">{isEditing ? 'Edit ticket' : 'Add ticket'}</p></div>
      <div className="px-6 pb-6 border-t border-gray-50 pt-5">
        <div className="flex gap-2 mb-4">
          <TypeBtn val="paid" label="Paid" active={f.ticket_type === 'paid'} locked={locked} onClick={() => set('ticket_type', 'paid')} theme={theme} />
          <TypeBtn val="free" label="Free" active={f.ticket_type === 'free'} locked={locked} onClick={() => set('ticket_type', 'free')} theme={theme} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Ticket name" span2 theme={theme}><input placeholder="e.g. VIP" disabled={locked} value={f.name} onChange={e => set('name', e.target.value)} className="h-10 px-3 text-sm focus:outline-none w-full" style={inputStyle} /></Field>
          {f.ticket_type === 'paid' && <Field label="Price" theme={theme}><input placeholder="₹0" type="number" disabled={locked} value={f.price} onChange={e => set('price', e.target.value)} className="h-10 px-3 text-sm focus:outline-none w-full" style={inputStyle} /></Field>}
          <Field label="People per ticket" theme={theme}><input placeholder="1" type="number" disabled={locked} value={f.people_per_ticket} onChange={e => set('people_per_ticket', e.target.value)} className="h-10 px-3 text-sm focus:outline-none w-full" style={inputStyle} /></Field>
          <Field label="Quantity for sale" span2 theme={theme}><input placeholder="100" type="number" disabled={locked} value={f.quantity} onChange={e => set('quantity', e.target.value)} className="h-10 px-3 text-sm focus:outline-none w-full" style={inputStyle} /></Field>
          <Field label="Description" span2 theme={theme}><textarea placeholder="What's included with this ticket" disabled={locked} value={f.description} onChange={e => set('description', e.target.value)} className="px-3 py-2 text-sm focus:outline-none w-full h-16" style={inputStyle} /></Field>
        </div>
        <label className="text-xs font-medium block mt-4 mb-1" style={labelStyle}>Goodies (optional)</label>
        <div className="relative">
          <input placeholder="Search a goodie" disabled={locked} value={goodieInput} onChange={e => setGoodieInput(e.target.value)} className="h-9 px-3 text-sm w-full focus:outline-none" style={inputStyle} />
          {goodieInput.trim() && (
            <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-sm z-10 max-h-40 overflow-y-auto">
              {matches.map(g => <button key={g} type="button" onClick={() => addGoodie(g)} className="w-full text-left text-xs px-3 py-2 hover:bg-gray-50 border-b border-gray-50 last:border-0">{g}</button>)}
              {matches.length === 0 && <p className="text-xs px-3 py-2" style={labelStyle}>No matching goodie</p>}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {f.goodies.map((g: string, i: number) => (
            <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 flex items-center gap-1.5">{g}{!locked && <button type="button" onClick={() => removeGoodie(i)}>✕</button>}</span>
          ))}
        </div>
        {isEditing && (
          <div className="mt-5 pt-4 border-t border-gray-50">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs font-medium" style={{ color: theme?.color_text_primary || '#374151' }}>Limit sale window</span>
              <button type="button" disabled={locked} onClick={() => {
                const turningOn = !f.sale_window_enabled
                setF(p => ({ ...p, sale_window_enabled: turningOn, sale_start: turningOn && !p.sale_start ? new Date().toISOString().slice(0, 16) : p.sale_start, sale_end: turningOn && !p.sale_end ? (defaultSaleEnd || '') : p.sale_end }))
              }} className="relative inline-flex h-6 w-11 items-center rounded-full transition shrink-0" style={{ backgroundColor: f.sale_window_enabled ? (theme?.toggle_on || '#22c55e') : (theme?.toggle_off || '#e5e7eb') }}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${f.sale_window_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            {f.sale_window_enabled && (
              <div className="grid grid-cols-2 gap-4">
                <Field label="Sale start" theme={theme}><input type="datetime-local" disabled={locked} value={f.sale_start} onChange={e => set('sale_start', e.target.value)} className="h-10 px-3 text-sm focus:outline-none w-full" style={inputStyle} /></Field>
                <Field label="Sale end" theme={theme}><input type="datetime-local" disabled={locked} value={f.sale_end} onChange={e => set('sale_end', e.target.value)} className="h-10 px-3 text-sm focus:outline-none w-full" style={inputStyle} /></Field>
              </div>
            )}
          </div>
        )}
        <div className="hidden sm:flex sm:justify-end sm:gap-2 mt-5">
          <button onClick={onCancel} style={{ backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }} className="px-4 py-2 text-sm">✕ Close</button>
          {!locked && <button onClick={handleSave} style={{ backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }} className="px-4 py-2 text-sm">Save ticket</button>}
        </div>
        <div className="flex gap-1.5 sm:hidden mt-5">
          <button onClick={onCancel} style={{ backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }} className="flex-1 py-2 text-sm">✕ Close</button>
          {!locked && <button onClick={handleSave} style={{ backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }} className="flex-1 py-2 text-sm">Save</button>}
        </div>
      </div>
    </div>
  )
}
