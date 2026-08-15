// GOES IN: components/admin/OREV1-086-HelpDeskAttachments.tsx
'use client'
import { useState } from 'react'
import { useTheme } from '@/lib/ThemeContext'
import toast from 'react-hot-toast'

type Attachment = { id: string; file_url: string; file_name: string; visibility: string; created_at: string }
type Props = { ticketId: string; attachments: Attachment[]; canEdit?: boolean; onChanged: () => void }

export default function OREV1086HelpDeskAttachments({ ticketId, attachments, canEdit = true, onChanged }: Props) {
  const { theme } = useTheme()
  const radius = theme?.global_border_radius || '12px'
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file); formData.append('ticket_id', ticketId); formData.append('visibility', 'external')
    const res = await fetch('/admin/ecosystem/helpdesk/api/attachments', { method: 'POST', body: formData })
    setUploading(false)
    if (!res.ok) { toast.error('Upload failed'); return }
    toast.success('Attached'); onChanged()
  }

  const handleRemove = async (attachmentId: string) => {
    if (!confirm('Remove this attachment? It stays visible in the Audit trail as removed.')) return
    const res = await fetch('/admin/ecosystem/helpdesk/api/attachments', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ attachment_id: attachmentId })
    })
    if (!res.ok) { toast.error('Failed to remove'); return }
    toast.success('Removed'); onChanged()
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <label className="text-xs text-gray-500">Attachments</label>
        {canEdit && (
          <label style={{ borderRadius: radius }} className="text-xs text-blue-700 border border-blue-200 px-3 py-1.5 cursor-pointer hover:bg-blue-50">
            {uploading ? 'Uploading…' : '+ Attach Image'}
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        )}
      </div>
      {attachments.length === 0 && <p className="text-xs text-gray-400">No attachments yet.</p>}
      <div className="grid grid-cols-3 gap-2">
        {attachments.map(a => (
          <div key={a.id} className="relative group">
            <a href={a.file_url} target="_blank" rel="noreferrer">
              <img src={a.file_url} alt={a.file_name} className="w-full h-20 object-cover rounded-xl border border-gray-100" />
            </a>
            {canEdit && (
              <button onClick={() => handleRemove(a.id)} title="Remove"
                className="absolute -top-1 -right-1 bg-white border border-gray-200 rounded-full w-5 h-5 text-xs text-red-500 opacity-0 group-hover:opacity-100">✕</button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
