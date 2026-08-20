// THIS FILE GOES IN: components/shared/OREV1-115A-ReviewSectionHeader.tsx (NEW FILE)
'use client'

type Props = { title: string; onEdit?: () => void; theme: any }

const IconEdit = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>

export default function OREV1115AReviewSectionHeader({ title, onEdit, theme }: Props) {
  const headText = { color: theme?.color_text_primary || '#111827' }
  return (
    <div className="px-4 py-2 bg-gray-50 flex items-center justify-between">
      <span className="text-xs font-semibold" style={headText}>{title}</span>
      {onEdit && <button type="button" onClick={onEdit} title="Edit" className="text-blue-400 hover:text-blue-700 transition p-1 rounded-lg hover:bg-blue-50"><IconEdit /></button>}
    </div>
  )
}