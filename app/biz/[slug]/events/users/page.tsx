// THIS FILE GOES IN: app/biz/[slug]/events/users/page.tsx (NEW FILE)
'use client'
import { useTheme } from '@/lib/ThemeContext'

export default function UsersComingSoonPage() {
  const { theme } = useTheme()
  const radius = theme?.global_border_radius || '12px'

  return (
    <div className="bg-white p-10 text-center max-w-lg mx-auto mt-10" style={{ borderRadius: radius, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
      <p className="text-lg font-semibold mb-2" style={{ color: theme?.color_text_primary || '#111827' }}>Users — Coming Soon</p>
      <p className="text-sm" style={{ color: theme?.color_text_muted || '#9ca3af' }}>
        Invite your own staff/team members to help manage Events, with access limited to just this section.
      </p>
    </div>
  )
}
