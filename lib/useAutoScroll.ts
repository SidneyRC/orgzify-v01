// THIS FILE GOES IN: lib/useAutoScroll.ts (NEW file)
// Slowly scrolls a row by itself. Pauses while touched or hovered. Used by OREV1-133.
import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'

export function useAutoScroll(ref: RefObject<HTMLDivElement | null>, count: number, desktopMin: number, hold: boolean) {
  const paused = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || hold) return
    if (window.matchMedia('(min-width: 1024px)').matches && count <= desktopMin) return
    let wait = 0
    const tick = setInterval(() => {
      if (paused.current || el.scrollWidth <= el.clientWidth + 4) return
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 2) {
        wait += 1
        if (wait > 50) { el.scrollLeft = 0; wait = 0 }
        return
      }
      el.scrollLeft += 1
    }, 30)
    return () => clearInterval(tick)
  }, [ref, count, desktopMin, hold])
  const pause = () => { if (timer.current) clearTimeout(timer.current); paused.current = true }
  const resume = (ms: number) => { if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => { paused.current = false }, ms) }
  return { onMouseEnter: pause, onMouseLeave: () => resume(0), onTouchStart: pause, onTouchEnd: () => resume(3000) }
}
