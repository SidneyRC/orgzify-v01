// GOES IN: components/admin/OREV1-093-FacilitiesMultiSelect.tsx
'use client'
import { useState, useRef, useEffect } from 'react'
import { useTheme } from '@/lib/ThemeContext'

export const FACILITIES_LIST = [
  { id: 'parking', label: 'Parking', icon: '🚗' },
  { id: 'ac', label: 'Air Conditioning', icon: '❄️' },
  { id: 'wifi', label: 'WiFi', icon: '📶' },
  { id: 'toilets', label: 'Toilets', icon: '🚻' },
  { id: 'baby_feeding_room', label: 'Baby Feeding Room', icon: '🍼' },
  { id: 'kids_play_area', label: 'Kids Play Area', icon: '🧸' },
  { id: 'wheelchair_accessible', label: 'Wheelchair Accessible', icon: '♿' },
  { id: 'gym', label: 'Gym', icon: '🏋️' },
  { id: 'locker_facility', label: 'Locker Facility', icon: '🔒' },
  { id: 'atm', label: 'ATM', icon: '🏦' },
  { id: 'stage', label: 'Stage', icon: '🎤' },
  { id: 'catering', label: 'Catering', icon: '🍽️' },
  { id: 'power_backup', label: 'Power Backup', icon: '🔌' },
  { id: 'security_cctv', label: 'Security / CCTV', icon: '🛡️' },
  { id: 'seating', label: 'Seating', icon: '💺' },
  { id: 'changing_room', label: 'Changing Room', icon: '🚪' },
  { id: 'sound_system', label: 'Sound System', icon: '🔊' },
  { id: 'lift', label: 'Lift/Elevator', icon: '🛗' },
  { id: 'first_aid_room', label: 'First Aid Room', icon: '⛑️' },
  { id: 'drinking_water', label: 'Drinking Water', icon: '🚰' },
] as const

type Props = { value: string[]; onChange: (ids: string[]) => void; label?: string }

export default function OREV1093FacilitiesMultiSelect({ value, onChange, label = 'Facilities / Amenities' }: Props) {
  const { theme } = useTheme()
  const radius = theme?.global_border_radius || '12px'
  const inputStyle = { backgroundColor: theme?.input_bg || '#fff', border: `1px solid ${theme?.input_border || '#e5e7eb'}`, borderRadius: radius }
  const dropStyle = { backgroundColor: theme?.dropdown_bg || '#fff', border: `1px solid ${theme?.dropdown_border || '#e5e7eb'}`, borderRadius: radius }
  const highlightBg = theme?.dropdown_hover_bg || '#f9fafb'
  const chipStyle = { backgroundColor: theme?.color_selected || '#eff6ff', color: theme?.color_text_primary || '#1e3a8a', borderRadius: radius }

  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const available = FACILITIES_LIST.filter(f => !value.includes(f.id) && f.label.toLowerCase().includes(query.toLowerCase()))

  const add = (id: string) => { onChange([...value, id]); setQuery(''); setActiveIndex(-1); setOpen(false) }
  const remove = (id: string) => onChange(value.filter(v => v !== id))

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || available.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => (i + 1) % available.length) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(i => (i - 1 + available.length) % available.length) }
    else if (e.key === 'Enter') { e.preventDefault(); if (activeIndex >= 0) add(available[activeIndex].id) }
    else if (e.key === 'Escape') { setOpen(false); setActiveIndex(-1) }
  }

  return (
    <div className="flex flex-col gap-1" ref={ref}>
      <label className="text-xs text-gray-500">{label}</label>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-1">
          {value.map(id => {
            const f = FACILITIES_LIST.find(x => x.id === id)
            if (!f) return null
            return (
              <span key={id} style={chipStyle} className="text-xs px-2.5 py-1 flex items-center gap-1.5">
                <span>{f.icon}</span>{f.label}
                <button onClick={() => remove(id)} className="ml-0.5 hover:opacity-70">✕</button>
              </span>
            )
          })}
        </div>
      )}

      <div className="relative">
        <input value={query} onChange={e => { setQuery(e.target.value); setOpen(true); setActiveIndex(-1) }}
          onFocus={() => setOpen(true)} onKeyDown={handleKeyDown}
          placeholder="Type to search facilities…" className="w-full h-10 px-3 text-sm focus:outline-none" style={inputStyle} />

        {open && available.length > 0 && (
          <div className="absolute z-20 w-full mt-1 shadow-lg max-h-48 overflow-y-auto" style={dropStyle}>
            {available.map((f, i) => (
              <div key={f.id} onMouseDown={e => { e.preventDefault(); add(f.id) }} onMouseEnter={() => setActiveIndex(i)}
                className="px-3 py-2.5 text-sm cursor-pointer flex items-center gap-2"
                style={{ backgroundColor: activeIndex === i ? highlightBg : undefined }}>
                <span>{f.icon}</span>{f.label}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
