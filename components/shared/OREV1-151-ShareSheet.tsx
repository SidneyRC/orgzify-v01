// THIS FILE GOES IN: components/shared/OREV1-151-ShareSheet.tsx (NEW FILE)
// Share popup. Step 1 (not logged in): "Log in & share" or "Skip login".
// Step 2: phone = panel at the bottom; desktop = centred list. Colours come from the theme.
'use client'
import { useState } from 'react'
import { useTheme } from '@/lib/ThemeContext'
import { copyText, openWhatsApp, openFacebook, canNativeShare, nativeShare } from '@/lib/shareActions'

const ICONS = {
  wa: 'M21 11.5a8.4 8.4 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.4 8.4 0 01-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.4 8.4 0 013.8-.9h.5a8.5 8.5 0 018 8v.5z',
  more: 'M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13',
  fb: 'M14 8h3V4h-3a4 4 0 00-4 4v2H7v4h3v8h4v-8h3l1-4h-4V8z',
  link: 'M10 13a5 5 0 007 0l3-3a5 5 0 00-7-7l-1 1M14 11a5 5 0 00-7 0l-3 3a5 5 0 007 7l1-1',
}
const Icon = ({ d, color }: { d: string; color: string }) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>

type Props = { title: string; text: string; plainText: string; link: string; isLoggedIn: boolean; startAtShare: boolean; onClose: () => void; onLogin: () => void }

export default function OREV1151ShareSheet({ title, text, plainText, link, isLoggedIn, startAtShare, onClose, onLogin }: Props) {
  const { theme } = useTheme()
  const [step, setStep] = useState<'login' | 'share'>(isLoggedIn || startAtShare ? 'share' : 'login')
  const [copied, setCopied] = useState(false)
  const radius = theme?.global_border_radius || '12px'
  const strong = { color: theme?.color_text_primary || '#111827' }
  const iconColor = theme?.color_text_secondary || '#4b5563'
  const line = '1px solid ' + (theme?.divider_color || '#e5e7eb')
  const primaryBtn = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: theme?.btn_border_radius || radius }
  const outlineBtn = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: '1px solid ' + (theme?.btn_outline_border || '#e5e7eb'), borderRadius: theme?.btn_border_radius || radius }

  const copy = async () => { if (await copyText(plainText)) { setCopied(true); setTimeout(() => setCopied(false), 1500) } }
  const items = [
    { key: 'wa', label: 'WhatsApp', icon: ICONS.wa, run: () => openWhatsApp(text), desktop: true, phone: true },
    { key: 'more', label: 'More', icon: ICONS.more, run: () => nativeShare(title, plainText), desktop: false, phone: canNativeShare() },
    { key: 'fb', label: 'Facebook', icon: ICONS.fb, run: () => openFacebook(link), desktop: true, phone: false },
    { key: 'copy', label: copied ? 'Copied ✓' : 'Copy link', icon: ICONS.link, run: copy, desktop: true, phone: true },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ backgroundColor: theme?.modal_overlay || 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="w-full sm:max-w-sm p-5 rounded-b-none sm:rounded-b-xl" style={{ backgroundColor: theme?.modal_bg || '#fff', borderTopLeftRadius: radius, borderTopRightRadius: radius }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold" style={strong}>Share this event</h2>
          <button onClick={onClose} aria-label="Close" className="text-lg px-2" style={strong}>✕</button>
        </div>

        {step === 'login' ? (
          <div className="flex flex-col gap-3">
            <button onClick={onLogin} className="text-base font-semibold py-3" style={primaryBtn}>Log in &amp; share</button>
            <button onClick={() => setStep('share')} className="text-base font-semibold py-3" style={outlineBtn}>Skip login</button>
          </div>
        ) : (
          <>
            <div className="sm:hidden flex justify-around">
              {items.filter(i => i.phone).map(i => (
                <button key={i.key} onClick={i.run} className="flex flex-col items-center gap-1.5">
                  <span className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: theme?.input_bg || '#f3f4f6', border: '1px solid ' + (theme?.input_border || '#e5e7eb') }}><Icon d={i.icon} color={iconColor} /></span>
                  <span className="text-sm" style={strong}>{i.label}</span>
                </button>
              ))}
            </div>
            <div className="hidden sm:block">
              {items.filter(i => i.desktop).map((i, n) => (
                <button key={i.key} onClick={i.run} className="w-full flex items-center justify-between py-3 text-base hover:opacity-70" style={{ ...strong, borderTop: n === 0 ? 'none' : line }}>
                  <span>{i.label}</span><Icon d={i.icon} color={iconColor} />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
