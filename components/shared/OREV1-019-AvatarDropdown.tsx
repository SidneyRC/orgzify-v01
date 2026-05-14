'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import OREV1017StatusBadge from '@/components/shared/OREV1-017-StatusBadge'

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — DUMMY DATA — DB Connection Pending — remove when connected
// Replace DUMMY_USER, DUMMY_ACADEMIES, DUMMY_ORGS with real session data
// ─────────────────────────────────────────────────────────────────────────────

const DUMMY_USER = {
  name: 'Sidney Nair',
  email: 'sidney@example.com',
  initials: 'SN',
  photo: null as string | null,
}

const DUMMY_ACADEMIES = [
  { id: 'ac1', name: 'Spark Chess Academy', status: 'Approved' },
  { id: 'ac2', name: 'Tiny Tots Drawing', status: 'Pending' },
]

const DUMMY_ORGS = [
  { id: 'or1', name: 'Kiddos Events Co.', status: 'Under Review' },
]

// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  isMobile?: boolean
}

export default function OREV1019AvatarDropdown({ isMobile = false }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click — desktop only
  useEffect(() => {
    if (isMobile || !isOpen) return
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen, isMobile])

  // Lock body scroll when mobile panel is open
  useEffect(() => {
    if (!isMobile) return
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen, isMobile])

  const go = (href: string) => {
    setIsOpen(false)
    router.push(href)
  }

  const handleLogout = () => {
    setIsOpen(false)
    // TODO: clear auth session when connected
    router.push('/login')
  }

  // ── Trigger Button ──────────────────────────────────────────────────────────
  const Trigger = (
    <button
      onClick={() => setIsOpen(v => !v)}
      className="flex items-center gap-2 focus:outline-none"
      aria-label="Open account menu"
    >
      {/* Avatar circle — show photo when available, else initials */}
      {DUMMY_USER.photo ? (
        <img
          src={DUMMY_USER.photo}
          alt={DUMMY_USER.name}
          className="w-8 h-8 rounded-full object-cover border-2 border-yellow-400"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-xs font-semibold text-blue-900 flex-shrink-0">
          {DUMMY_USER.initials}
        </div>
      )}
      {/* Name — hidden on small screens */}
      <span className="hidden sm:block text-sm text-white">
        {DUMMY_USER.name.split(' ')[0]}
      </span>
      <svg
        className="hidden sm:block w-3 h-3 text-white/50"
        fill="none" stroke="currentColor" viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  )

  // ── Panel Content — shared between desktop & mobile ─────────────────────────
  const PanelContent = (
    <>
      {/* User header */}
      <div
        className={`flex items-center gap-3 p-4 border-b border-gray-100 ${
          isMobile ? 'bg-blue-900' : ''
        }`}
      >
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${
            isMobile ? 'bg-yellow-400 text-blue-900' : 'bg-blue-900 text-yellow-400'
          }`}
        >
          {DUMMY_USER.initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold truncate ${isMobile ? 'text-white' : 'text-gray-900'}`}>
            {DUMMY_USER.name}
          </p>
          <p className={`text-xs truncate ${isMobile ? 'text-white/60' : 'text-gray-400'}`}>
            {DUMMY_USER.email}
          </p>
        </div>
        {/* Close button — mobile only */}
        {isMobile && (
          <button
            onClick={() => setIsOpen(false)}
            className="text-white/60 hover:text-white p-1 flex-shrink-0"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Scrollable body */}
      <div className={isMobile ? 'overflow-y-auto flex-1' : ''}>

        {/* Profile */}
        <div className="border-b border-gray-100 py-1">
          <button
            onClick={() => go('/profile/edit')}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 text-left transition-colors"
          >
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Profile
          </button>
        </div>

        {/* My Academies */}
        <div className="border-b border-gray-100 py-1">
          <p className="px-4 pt-2 pb-1 text-[10px] text-gray-400 uppercase tracking-widest font-medium">
            My academies
          </p>
          {DUMMY_ACADEMIES.map(a => (
            <button
              key={a.id}
              onClick={() => go('/academy/dashboard')}
              className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-50 text-left transition-colors"
            >
              <div className="w-7 h-7 rounded-md bg-blue-50 flex items-center justify-center text-[9px] font-semibold text-blue-700 flex-shrink-0">
                AC
              </div>
              <span className="text-xs text-gray-800 flex-1 truncate">{a.name}</span>
              <OREV1017StatusBadge status={a.status} />
            </button>
          ))}
          <button
            onClick={() => go('/kyc?type=academy')}
            className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-50 text-left transition-colors"
          >
            <svg className="w-4 h-4 text-blue-900 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-xs text-blue-900 font-medium">Add academy</span>
          </button>
        </div>

        {/* My Organisations */}
        <div className="border-b border-gray-100 py-1">
          <p className="px-4 pt-2 pb-1 text-[10px] text-gray-400 uppercase tracking-widest font-medium">
            My organisations
          </p>
          {DUMMY_ORGS.map(o => (
            <button
              key={o.id}
              onClick={() => go('/organiser/dashboard')}
              className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-50 text-left transition-colors"
            >
              <div className="w-7 h-7 rounded-md bg-green-50 flex items-center justify-center text-[9px] font-semibold text-green-700 flex-shrink-0">
                OR
              </div>
              <span className="text-xs text-gray-800 flex-1 truncate">{o.name}</span>
              <OREV1017StatusBadge status={o.status} />
            </button>
          ))}
          <button
            onClick={() => go('/kyc?type=organiser')}
            className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-50 text-left transition-colors"
          >
            <svg className="w-4 h-4 text-blue-900 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-xs text-blue-900 font-medium">Add organisation</span>
          </button>
        </div>

        {/* Change Password */}
        <div className="border-b border-gray-100 py-1">
          <button
            onClick={() => go('/forgot-password')}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 text-left transition-colors"
          >
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Change password
          </button>
        </div>

        {/* Logout */}
        <div className="py-1">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 text-left transition-colors"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>

      </div>
    </>
  )

  // ── Mobile Layout — full right-side panel ───────────────────────────────────
  if (isMobile) {
    return (
      <>
        {Trigger}
        {isOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/40"
            onClick={() => setIsOpen(false)}
          >
            <div
              className="absolute top-0 right-0 h-full w-80 max-w-full bg-white shadow-2xl flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              {PanelContent}
            </div>
          </div>
        )}
      </>
    )
  }

  // ── Desktop Layout — dropdown panel ────────────────────────────────────────
  return (
    <div className="relative" ref={wrapperRef}>
      {Trigger}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl border border-gray-100 shadow-lg z-50 overflow-hidden">
          {PanelContent}
        </div>
      )}
    </div>
  )
}
