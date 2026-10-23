// THIS FILE GOES IN: components/shared/OREV1-158-RegisterAttendanceLink.tsx (NEW FILE)
'use client'

// "Already paid? Register your Attendance" block. Used in the booking box (OREV1-126) and in the Book Now popup (OREV1-127).
// Coming soon: it becomes a link to the registration page when the attendance module is built.
export default function OREV1158RegisterAttendanceLink({ theme }: { theme: any }) {
  const muted = { color: theme?.color_text_muted || '#9ca3af' }
  return (
    <div className="pt-3" style={{ borderTop: '1px solid ' + (theme?.divider_color || '#e5e7eb') }}>
      <p className="text-sm" style={muted}>Already paid?</p>
      <p className="text-base font-semibold" style={{ color: theme?.color_text_primary || '#111827' }}>Register your Attendance</p>
      <p className="text-sm" style={muted}>(Coming Soon)</p>
    </div>
  )
}
