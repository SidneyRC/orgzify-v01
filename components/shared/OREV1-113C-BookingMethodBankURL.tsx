'use client'

type Props = { mode: 'bank' | 'url'; fields: any; setFields: (f: any) => void; venues: any[]; timeUrls: Record<string, string>; setTimeUrls: (u: Record<string, string>) => void; locked: boolean; onToggle: () => void; theme: any }

function formatDate(d: string) {
  const dt = new Date(d)
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
function formatTime(t: string) {
  const [h, m] = t.split(':')
  const hour = parseInt(h, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const h12 = hour % 12 === 0 ? 12 : hour % 12
  return `${h12}:${m} ${ampm}`
}

function Field({ label, children, theme }: { label: string; children: any; theme: any }) {
  return <div><label className="text-xs font-medium block mb-1" style={{ color: theme?.color_text_muted || '#9ca3af' }}>{label}</label>{children}</div>
}

export default function OREV1113CBookingBankURL({ mode, fields, setFields, venues, timeUrls, setTimeUrls, locked, onToggle, theme }: Props) {
  const enabled = mode === 'bank' ? fields.bank_enabled : fields.url_enabled
  const radius = theme?.global_border_radius || '12px'
  const inputStyle = { backgroundColor: theme?.input_bg || '#fff', border: `1px solid ${theme?.input_border || '#e5e7eb'}`, borderRadius: radius }
  const labelStyle = { color: theme?.color_text_muted || '#9ca3af' }
  const toggleBg = enabled ? (theme?.toggle_on || '#22c55e') : (theme?.toggle_off || '#e5e7eb')
  const set = (key: string, val: string) => setFields((f: any) => ({ ...f, [key]: val }))
  const urlMode = fields.url_mode || 'event'
  const perSlot = urlMode === 'per_slot'

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <button type="button" disabled={locked} onClick={onToggle} className="w-full flex items-center justify-between px-6 py-4 text-left">
        <p className="text-sm font-semibold text-gray-700">{mode === 'bank' ? 'Bank Details' : 'External URL'}</p>
        <span className="relative inline-flex h-6 w-11 items-center rounded-full transition shrink-0" style={{ backgroundColor: toggleBg }}>
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
        </span>
      </button>

      {enabled && mode === 'bank' && (
        <div className="px-6 pb-6 border-t border-gray-50 pt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Account name" theme={theme}><input placeholder="Account Name" disabled={locked} value={fields.bank_account_name || ''} onChange={e => set('bank_account_name', e.target.value)} className="h-10 px-3 text-sm focus:outline-none w-full" style={inputStyle} /></Field>
          <Field label="Account number" theme={theme}><input placeholder="Account Number" inputMode="numeric" disabled={locked} value={fields.bank_account_number || ''} onChange={e => set('bank_account_number', e.target.value.replace(/\D/g, ''))} className="h-10 px-3 text-sm focus:outline-none w-full" style={inputStyle} /></Field>
          <Field label="Bank name" theme={theme}><input placeholder="Bank Name" disabled={locked} value={fields.bank_name || ''} onChange={e => set('bank_name', e.target.value)} className="h-10 px-3 text-sm focus:outline-none w-full" style={inputStyle} /></Field>
          <Field label="Branch name" theme={theme}><input placeholder="Branch Name" disabled={locked} value={fields.bank_branch_name || ''} onChange={e => set('bank_branch_name', e.target.value)} className="h-10 px-3 text-sm focus:outline-none w-full" style={inputStyle} /></Field>
          <Field label="IFSC / SWIFT" theme={theme}><input placeholder="IFSC / SWIFT" disabled={locked} value={fields.bank_ifsc_swift || ''} onChange={e => set('bank_ifsc_swift', e.target.value)} className="h-10 px-3 text-sm focus:outline-none w-full" style={inputStyle} /></Field>
        </div>
      )}

      {enabled && mode === 'url' && (
        <div className="px-6 pb-6 border-t border-gray-50 pt-5">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-xs" style={{ color: perSlot ? (theme?.color_text_muted || '#9ca3af') : (theme?.color_text_primary || '#374151') }}>Same link for entire event</span>
            <button type="button" disabled={locked} onClick={() => set('url_mode', perSlot ? 'event' : 'per_slot')} className="relative inline-flex h-6 w-11 items-center rounded-full transition shrink-0" style={{ backgroundColor: perSlot ? (theme?.toggle_on || '#22c55e') : (theme?.toggle_off || '#e5e7eb') }}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${perSlot ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <span className="text-xs" style={{ color: perSlot ? (theme?.color_text_primary || '#374151') : (theme?.color_text_muted || '#9ca3af') }}>Different link per date &amp; time</span>
          </div>

          {!perSlot && (
            <Field label="Booking URL" theme={theme}><input placeholder="https://" disabled={locked} value={fields.external_url || ''} onChange={e => set('external_url', e.target.value)} className="h-10 px-3 text-sm focus:outline-none w-full" style={inputStyle} /></Field>
          )}

          {perSlot && (
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              {venues.map((v: any, vi: number) => (
                <div key={v.id}>
                  <div className="px-5 py-2.5 bg-gray-50" style={{ borderTop: vi > 0 ? '1px solid #f3f4f6' : undefined }}>
                    <span className="text-xs font-semibold text-gray-600">{v.venues?.external_name || 'Venue'}</span>
                  </div>
                  <div className="px-5 py-3.5 flex flex-col gap-2.5">
                    {v.event_venue_dates?.map((d: any) => d.event_venue_times?.map((t: any) => (
                      <div key={t.id} className="flex items-center gap-3.5 p-2.5 rounded-lg border border-gray-100">
                        <div className="min-w-[110px] shrink-0">
                          <p className="text-xs font-medium text-gray-700">{formatDate(d.event_date)}</p>
                          <p className="text-[11px] text-gray-400">{formatTime(t.start_time)}</p>
                        </div>
                        <input placeholder="https://" disabled={locked} value={timeUrls[t.id] || ''} onChange={e => setTimeUrls({ ...timeUrls, [t.id]: e.target.value })} className="h-9 px-3 text-sm focus:outline-none flex-1" style={inputStyle} />
                      </div>
                    )))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
