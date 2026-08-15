// GOES IN: components/admin/OREV1-099-VenueActionIcons.tsx
'use client'
import { useRouter } from 'next/navigation'

type VenueRow = { id: string; status: string }

const IconView = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
const IconEdit = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
const IconDelete = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
const IconRestore = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
const IconApprove = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
const IconReject = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
const IconSuspend = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
const IconBlock = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 105.636 5.636a9 9 0 0012.728 12.728zM5.636 5.636l12.728 12.728" /></svg>

type Props = {
  r: VenueRow
  canEdit?: boolean; canDelete?: boolean; canRestore?: boolean; canHardDelete?: boolean; canApprove?: boolean
  onApprove: (r: any) => void
  onOpenReview: (id: string, action: 'reject' | 'suspend' | 'block') => void
  onDeleteOrRestore: (r: any, action: 'delete' | 'restore' | 'hard_delete') => void
}

export default function OREV1099VenueActionIcons({ r, canEdit = true, canDelete = true, canRestore = true, canHardDelete = true, canApprove = true, onApprove, onOpenReview, onDeleteOrRestore }: Props) {
  const router = useRouter()
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <button title="View" onClick={() => router.push(`/admin/master/venue/${r.id}?mode=view`)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"><IconView /></button>
      {canEdit && <button title="Edit" onClick={() => router.push(`/admin/master/venue/${r.id}?mode=edit`)} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50"><IconEdit /></button>}
      {canApprove && r.status === 'pending' && (
        <>
          <button title="Approve" onClick={() => onApprove(r)} className="p-1.5 rounded-lg text-green-500 hover:bg-green-50"><IconApprove /></button>
          <button title="Reject" onClick={() => onOpenReview(r.id, 'reject')} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"><IconReject /></button>
        </>
      )}
      {canApprove && (r.status === 'active' || r.status === 'inactive') && (
        <>
          <button title="Suspend" onClick={() => onOpenReview(r.id, 'suspend')} className="p-1.5 rounded-lg text-orange-500 hover:bg-orange-50"><IconSuspend /></button>
          <button title="Block" onClick={() => onOpenReview(r.id, 'block')} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"><IconBlock /></button>
        </>
      )}
      {r.status === 'archived' ? (
        <>
          {canRestore && <button title="Restore" onClick={() => onDeleteOrRestore(r, 'restore')} className="p-1.5 rounded-lg text-green-500 hover:bg-green-50"><IconRestore /></button>}
          {canHardDelete && <button title="Delete permanently" onClick={() => onDeleteOrRestore(r, 'hard_delete')} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"><IconDelete /></button>}
        </>
      ) : (
        canDelete && <button title="Delete" onClick={() => onDeleteOrRestore(r, 'delete')} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"><IconDelete /></button>
      )}
    </div>
  )
}
