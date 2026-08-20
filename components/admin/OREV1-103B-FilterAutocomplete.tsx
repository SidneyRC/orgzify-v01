// THIS FILE GOES IN: components/admin/OREV1-103B-FilterAutocomplete.tsx (NEW FILE)
'use client'
import { useState, useEffect, useRef } from 'react'

const API = '/biz/events/api'

type Props = {
  label: string; field: string; value: string; onChange: (v: string) => void; inputStyle: any
}

export default function OREV1103BFilterAutocomplete({ label, field, value, onChange, inputStyle }: Props) {
  const [query, setQuery] = useState(value)
  const [options, setOptions] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { setQuery(value) }, [value])

  const handleInput = (v: string) => {
    setQuery(v); onChange(v)
    if (timer.current) clearTimeout(timer.current)
    if (v.length < 2) { setOptions([]); setOpen(false); return }
    timer.current = setTimeout(async () => {
      const res = await fetch(`${API}?type=filter_suggestions&field=${field}&q=${encodeURIComponent(v)}`)
      const json = await res.json()
      setOptions(json.data || []); setOpen(true)
    }, 300)
  }

  const pick = (v: string) => { setQuery(v); onChange(v); setOptions([]); setOpen(false) }

  return (
    <div className="flex flex-col gap-1 relative">
      <label className="text-xs text-gray-500">{label}</label>
      <input value={query} onChange={e => handleInput(e.target.value)} onFocus={() => options.length && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Type to search…" className="h-9 px-3 text-sm focus:outline-none w-full" style={inputStyle} />
      {open && options.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 z-10 bg-white border border-gray-200 rounded-xl max-h-40 overflow-y-auto shadow-sm">
          {options.map(o => (
            <button key={o} type="button" onClick={() => pick(o)} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">{o}</button>
          ))}
        </div>
      )}
    </div>
  )
}
