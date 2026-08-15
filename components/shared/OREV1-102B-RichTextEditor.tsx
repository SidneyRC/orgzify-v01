// THIS FILE GOES IN: components/shared/OREV1-102B-RichTextEditor.tsx (REPLACES existing file — Tiptap removed)
'use client'
import { useRef, useEffect } from 'react'
import { Theme } from '@/lib/ThemeContext'
import { Bold, Italic, Underline as UnderlineIcon, Link as LinkIcon } from 'lucide-react'

type Props = { value: string; onChange: (html: string) => void; theme: Theme | null; radius: string }

export default function OREV1102BRichTextEditor({ value, onChange, theme, radius }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const initialized = useRef(false)

  // Only set innerHTML once on mount — after that the DOM is the source of
  // truth (avoids cursor jumping to the start on every keystroke).
  useEffect(() => {
    if (ref.current && !initialized.current) {
      ref.current.innerHTML = value || ''
      initialized.current = true
    }
  }, [value])

  const exec = (cmd: string, arg?: string) => {
    document.execCommand(cmd, false, arg)
    onChange(ref.current?.innerHTML || '')
  }

  const addLink = () => {
    const url = window.prompt('Enter URL')
    if (url) exec('createLink', url)
  }

  const btnStyle = { color: theme?.color_text_muted || '#6b7280', borderRadius: radius }

  return (
    <div style={{ border: `1px solid ${theme?.input_border || '#e5e7eb'}`, borderRadius: radius }}>
      <div className="flex gap-1 px-2 py-1.5 border-b" style={{ borderColor: theme?.input_border || '#e5e7eb' }}>
        {/* onMouseDown preventDefault keeps the text selection alive so the
            toolbar button doesn't steal focus before the command runs. */}
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => exec('bold')} style={btnStyle} className="p-1.5 hover:bg-gray-100 rounded"><Bold size={14} /></button>
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => exec('italic')} style={btnStyle} className="p-1.5 hover:bg-gray-100 rounded"><Italic size={14} /></button>
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => exec('underline')} style={btnStyle} className="p-1.5 hover:bg-gray-100 rounded"><UnderlineIcon size={14} /></button>
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={addLink} style={btnStyle} className="p-1.5 hover:bg-gray-100 rounded"><LinkIcon size={14} /></button>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={() => onChange(ref.current?.innerHTML || '')}
        className="px-3 py-2 text-sm min-h-[140px] max-h-[300px] overflow-y-auto focus:outline-none"
      />
    </div>
  )
}
