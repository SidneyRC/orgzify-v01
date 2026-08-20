// THIS FILE GOES IN: components/shared/OREV1-115C-ReviewMediaSection.tsx (REPLACES existing file)
'use client'
import { useState, useEffect } from 'react'
import OREV1115AReviewSectionHeader from '@/components/shared/OREV1-115A-ReviewSectionHeader'

type Props = { eventId: string; onEdit: () => void; theme: any }

export default function OREV1115CReviewMediaSection({ eventId, onEdit, theme }: Props) {
  const [media, setMedia] = useState<any[]>([])
  useEffect(() => { fetch(`/biz/events/media/api?event_id=${eventId}`).then(r => r.json()).then(j => setMedia(j.data || [])) }, [eventId])
  const banners = media.filter(m => m.section === 'banner')
  const gallery = media.filter(m => m.section === 'gallery')
  const defaultBanner = banners.find(m => m.is_default_banner) || banners[0]
  const otherBanners = banners.filter(m => m.id !== defaultBanner?.id)
  const captions = media.filter(m => m.caption).map(m => m.caption)
  const mutedText = { color: theme?.color_text_muted || '#9ca3af' }

  if (media.length === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <OREV1115AReviewSectionHeader title="Media" onEdit={onEdit} theme={theme} />
      <div className="p-3 flex flex-col gap-3">
        {defaultBanner && (
          <div>
            <p className="text-xs mb-1" style={mutedText}>Default banner</p>
            <img src={defaultBanner.file_url} alt="Default banner" className="w-full max-w-xs h-32 object-cover rounded-lg" />
          </div>
        )}
        {(otherBanners.length > 0 || gallery.length > 0) && (
          <div>
            <p className="text-xs mb-1" style={mutedText}>{otherBanners.length + gallery.length} more item{otherBanners.length + gallery.length !== 1 ? 's' : ''}</p>
            <div className="flex gap-2 flex-wrap">
              {[...otherBanners, ...gallery].map(m => m.media_type === 'video'
                ? <video key={m.id} src={m.file_url} className="w-16 h-16 object-cover rounded-lg" />
                : <img key={m.id} src={m.file_url} alt="" className="w-16 h-16 object-cover rounded-lg" />)}
            </div>
          </div>
        )}
        {captions.length > 0 && <p className="text-xs" style={mutedText}>Captions: {captions.join(' · ')}</p>}
      </div>
    </div>
  )
}