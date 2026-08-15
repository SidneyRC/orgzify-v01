// THIS FILE GOES IN: components/shared/OREV1-109E-MainBannerSection.tsx (NEW FILE)
'use client'

type Media = { id: string; media_type: string; file_url: string; is_default_banner: boolean }
type Props = { banners: Media[]; bannerError: string; theme: any; onSetDefault: (id: string) => void; onDelete: (id: string) => void; onFileSelect: (f: File) => void }

export default function OREV1109EMainBannerSection({ banners, bannerError, theme, onSetDefault, onDelete, onFileSelect }: Props) {
  return (
    <div>
      <h3 className="text-sm font-semibold mb-1" style={{ color: theme?.color_text_primary || '#111827' }}>Main Banner <span className="text-red-500">*</span></h3>
      <p className="text-xs mb-3" style={{ color: theme?.color_text_muted || '#9ca3af' }}>Up to 5, landscape 2:1 ratio, max 2MB. You'll be able to adjust the crop after upload. One must be set as Default (used in ticket emails — must be an image).</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
        {banners.map(b => (
          <div key={b.id} className="relative rounded-xl overflow-hidden border border-gray-100 aspect-[2/1] bg-gray-50">
            {b.media_type === 'image' ? <img src={b.file_url} className="w-full h-full object-cover" alt="Banner" /> : <video src={b.file_url} className="w-full h-full object-cover" />}
            {b.is_default_banner && <span className="absolute top-1.5 left-1.5 text-[10px] px-2 py-0.5 rounded-full bg-blue-600 text-white">Default</span>}
            <div className="absolute bottom-1.5 right-1.5 flex gap-1">
              {b.media_type === 'image' && !b.is_default_banner && <button onClick={() => onSetDefault(b.id)} className="text-[10px] px-2 py-0.5 rounded-full bg-white/90 hover:bg-white">Set Default</button>}
              <button onClick={() => onDelete(b.id)} className="text-[10px] px-2 py-0.5 rounded-full bg-white/90 hover:bg-white text-red-600">✕</button>
            </div>
          </div>
        ))}
        {banners.length < 5 && (
          <label className="aspect-[2/1] rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 cursor-pointer hover:opacity-80 transition" style={{ borderColor: theme?.input_border || '#e5e7eb' }}>
            <span className="text-2xl" style={{ color: theme?.btn_bg || '#1e3a8a' }}>+</span>
            <span className="text-xs" style={{ color: theme?.color_text_muted || '#9ca3af' }}>Add Banner</span>
            <input type="file" accept="image/*,video/*" className="hidden" onChange={e => {
              const f = e.target.files?.[0]
              if (f) onFileSelect(f)
              e.target.value = ''
            }} />
          </label>
        )}
      </div>
      {bannerError && <span className="text-xs text-red-500">{bannerError}</span>}
    </div>
  )
}
