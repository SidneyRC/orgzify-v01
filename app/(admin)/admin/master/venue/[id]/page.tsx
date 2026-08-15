// GOES IN: app/(admin)/admin/master/venue/[id]/page.tsx
import OREV1092VenueForm from '@/components/admin/OREV1-092-VenueForm'

export default async function VenueDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ mode?: string }> }) {
  const { id } = await params
  const { mode } = await searchParams
  return <OREV1092VenueForm venueId={id} mode={mode === 'edit' ? 'edit' : 'view'} />
}
