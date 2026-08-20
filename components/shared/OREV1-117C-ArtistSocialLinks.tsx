// THIS FILE GOES IN: components/shared/OREV1-117C-ArtistSocialLinks.tsx (NEW FILE)
'use client'

const FIELDS = [
  { key: 'social_facebook_url', label: 'Facebook' },
  { key: 'social_instagram_url', label: 'Instagram' },
  { key: 'social_x_url', label: 'X (Twitter)' },
  { key: 'social_youtube_url', label: 'YouTube' },
  { key: 'social_website_url', label: 'Website' },
]

type Props = { values: Record<string, string>; onChange: (key: string, val: string) => void; theme: any }

export default function OREV1117CArtistSocialLinks({ values, onChange, theme }: Props) {
  const radius = theme?.global_border_radius || '12px'
  const inputStyle = { backgroundColor: theme?.input_bg || '#fff', border: `1px solid ${theme?.input_border || '#e5e7eb'}`, borderRadius: radius }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium" style={{ color: theme?.color_text_muted || '#9ca3af' }}>Social Links (optional)</label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {FIELDS.map(f => (
          <input key={f.key} value={values[f.key] || ''} onChange={e => onChange(f.key, e.target.value)}
            placeholder={f.label} className="h-9 px-3 text-sm focus:outline-none" style={inputStyle} />
        ))}
      </div>
    </div>
  )
}
