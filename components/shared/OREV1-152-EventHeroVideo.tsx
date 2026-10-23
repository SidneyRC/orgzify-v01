// THIS FILE GOES IN: components/shared/OREV1-152-EventHeroVideo.tsx (REPLACES existing file)
// First card of the event banner: plays a YouTube video muted, by itself.
// The speaker button turns sound on or off. Calls onEnded when the video finishes
// and onSkip when YouTube cannot play it (private link, embedding switched off).
// youtubeId() now lives in lib/youtubeId.ts and is re-exported here so other files keep working.
'use client'
import { useEffect, useRef, useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'

declare global { interface Window { YT?: any; onYouTubeIframeAPIReady?: () => void } }

export { youtubeId } from '@/lib/youtubeId'

function loadApi(): Promise<any> {
  return new Promise(resolve => {
    if (window.YT?.Player) return resolve(window.YT)
    const prev = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => { prev?.(); resolve(window.YT) }
    if (document.getElementById('yt-iframe-api')) return
    const s = document.createElement('script')
    s.id = 'yt-iframe-api'
    s.src = 'https://www.youtube.com/iframe_api'
    document.body.appendChild(s)
  })
}

export default function OREV1152EventHeroVideo({ videoId, onEnded, onSkip }: { videoId: string; onEnded: () => void; onSkip: () => void }) {
  const holder = useRef<HTMLDivElement>(null)
  const player = useRef<any>(null)
  const calls = useRef({ onEnded, onSkip })
  calls.current = { onEnded, onSkip }
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(true)

  useEffect(() => {
    let dead = false
    loadApi().then(YT => {
      if (dead || !holder.current) return
      const box = document.createElement('div')
      holder.current.appendChild(box)
      player.current = new YT.Player(box, {
        videoId, width: '100%', height: '100%',
        playerVars: { autoplay: 1, mute: 1, controls: 0, rel: 0, playsinline: 1, modestbranding: 1, iv_load_policy: 3, disablekb: 1 },
        events: {
          onReady: (e: any) => { e.target.mute(); e.target.playVideo() },
          onStateChange: (e: any) => { if (e.data === 1) setPlaying(true); if (e.data === 0) calls.current.onEnded() },
          onError: () => calls.current.onSkip(),
        },
      })
    })
    return () => { dead = true; try { player.current?.destroy() } catch {} }
  }, [videoId])

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation()
    const p = player.current
    if (!p) return
    if (muted) { p.unMute(); p.setVolume(100) } else p.mute()
    setMuted(!muted)
  }

  return (
    <div className="absolute inset-0 bg-black" onClick={() => { if (!playing) player.current?.playVideo?.() }}>
      <img src={'https://i.ytimg.com/vi/' + videoId + '/hqdefault.jpg'} alt="Event video" className="absolute inset-0 w-full h-full object-contain" />
      <div ref={holder} className="absolute inset-0 [&_iframe]:w-full [&_iframe]:h-full" style={{ opacity: playing ? 1 : 0 }} />
      <button onClick={toggleSound} aria-label={muted ? 'Turn sound on' : 'Turn sound off'} className="absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.4)', color: '#fff' }}>
        {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>
    </div>
  )
}
