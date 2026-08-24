// THIS FILE GOES IN: components/shared/OREV1-125-EventVenueSection.tsx (REPLACES existing file)
'use client'
import { useTheme } from '@/lib/ThemeContext'

export default function OREV1125EventVenueSection({ venue, compact }: { venue: any; compact?: boolean }) {
  const { theme } = useTheme()
  if (!venue) return null
  const address = `${venue.external_name}, ${venue.line1}, ${venue.area}, ${venue.city_name}, ${venue.state_name}, ${venue.country_name}`
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
  const wrapStyle = compact ? {} : { borderTop: `1px solid ${theme?.divider_color || '#e5e7eb'}` }

  return (
    <div className={compact ? 'pt-1' : 'pt-4'} style={wrapStyle}>
      {!compact && <p className="text-sm font-semibold mb-2" style={{ color: theme?.color_text_primary || '#111827' }}>Venue</p>}
      <p className="text-sm" style={{ color: theme?.color_text_secondary || '#4b5563' }}>{venue.external_name} · {venue.city_name}</p>
      <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="text-xs mt-1 inline-block" style={{ color: theme?.link_color || '#2563eb' }}>View on map →</a>
    </div>
  )
}