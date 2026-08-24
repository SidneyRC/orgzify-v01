// THIS FILE GOES IN: components/shared/OREV1-133-EventOrganiserSponsors.tsx (REPLACES existing file)
'use client'
import { useTheme } from '@/lib/ThemeContext'

type Item = { id: string; name: string; logo_url?: string; role_label: string }

export default function OREV1133EventOrganiserSponsors({ organiser, sponsors }: { organiser: { name: string; logo_url?: string }; sponsors: any[] }) {
  const { theme } = useTheme()
  const items: Item[] = [
    { id: 'org', name: organiser.name, logo_url: organiser.logo_url, role_label: 'Host' },
    ...sponsors.map((s: any) => ({ id: s.id, name: s.name, logo_url: s.logo_url, role_label: s.role_label || 'Sponsor' })),
  ]
  const radius = theme?.global_border_radius || '12px'

  return (
    <div className="pt-4" style={{ borderTop: '1px solid ' + (theme?.divider_color || '#e5e7eb') }}>
      <p className="text-base font-semibold mb-3" style={{ color: theme?.color_text_primary || '#111827' }}>Organiser & Sponsors</p>
      <div className="flex gap-3 flex-wrap">
        {items.map(i => (
          <div key={i.id} className="shrink-0 w-40 overflow-hidden" style={{ borderRadius: radius, backgroundColor: theme?.color_surface || '#f3f4f6' }}>
            <p className="text-xs font-bold uppercase tracking-wide text-center py-2" style={{ color: theme?.link_color || '#2563eb' }}>{i.role_label}</p>
            <div className="w-40 h-40" style={{ backgroundColor: theme?.avatar_bg || '#e5e7eb' }}>
              {i.logo_url && <img src={i.logo_url} alt={i.name} className="w-full h-full object-cover" />}
            </div>
            <div className="px-2 py-3 flex items-center justify-center">
              <p className="text-xs font-semibold text-center overflow-hidden text-ellipsis whitespace-nowrap" style={{ color: theme?.color_text_primary || '#111827' }}>{i.name}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}