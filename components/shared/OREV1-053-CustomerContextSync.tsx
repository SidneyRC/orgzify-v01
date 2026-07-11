'use client'
import { useEffect } from 'react'

// Silently tells the server "I'm on a personal/customer page now" so the
// active company context cookie clears — no visible UI, just a background ping.
export default function CustomerContextSync() {
  useEffect(() => {
    fetch('/customer/context', { method: 'POST' })
  }, [])
  return null
}
