// OREV1-017-StatusBadge.tsx
// Shared master status badge — used across all panels
// To add new statuses: add to STATUS_STYLES only

type BadgeSize = 'sm' | 'md';

interface StatusBadgeProps {
  status: string;
  size?: BadgeSize;
}

const STATUS_STYLES: Record<string, string> = {
  // ── Registration / KYC ──────────────────────────────
  Draft:           'bg-gray-100 text-gray-600 border-gray-200',
  Pending:         'bg-yellow-50 text-yellow-700 border-yellow-200',
  Processing:      'bg-slate-100 text-slate-600 border-slate-200',
  'Under Review':  'bg-blue-50 text-blue-700 border-blue-200',
  Resubmit:        'bg-orange-50 text-orange-600 border-orange-200',
  Approved:        'bg-green-50 text-green-700 border-green-200',
  Rejected:        'bg-red-50 text-red-700 border-red-200',

  // ── Account / User ───────────────────────────────────
  Active:          'bg-emerald-50 text-emerald-700 border-emerald-200',
  Inactive:        'bg-gray-100 text-gray-500 border-gray-200',
  Suspended:       'bg-orange-50 text-orange-700 border-orange-200',
  Blocked:         'bg-red-100 text-red-800 border-red-300',
  Deactivated:     'bg-gray-200 text-gray-700 border-gray-300',

  // ── Booking / Events ─────────────────────────────────
  'Pre-booked':    'bg-violet-50 text-violet-700 border-violet-200',
  Waitlisted:      'bg-indigo-50 text-indigo-700 border-indigo-200',
  Registered:      'bg-cyan-50 text-cyan-700 border-cyan-200',
  Booked:          'bg-sky-50 text-sky-700 border-sky-200',
  Withdrawn:       'bg-rose-50 text-rose-600 border-rose-200',
  Abandoned:       'bg-slate-100 text-slate-700 border-slate-300',
  Disqualified:    'bg-amber-100 text-amber-800 border-amber-300',

  // ── Payments ─────────────────────────────────────────
  'Partially Paid':'bg-amber-50 text-amber-700 border-amber-200',
  Refunded:        'bg-purple-50 text-purple-700 border-purple-200',
  Overdue:         'bg-red-50 text-red-600 border-red-200',
  Failed:          'bg-red-100 text-red-700 border-red-300',

  // ── Process outcomes ─────────────────────────────────
  Success:         'bg-emerald-50 text-emerald-700 border-emerald-300',
  Cancelled:       'bg-slate-50 text-slate-600 border-slate-200',
  Expired:         'bg-amber-50 text-amber-600 border-amber-200',

  // ── Publishing ───────────────────────────────────────
  Published:       'bg-teal-50 text-teal-700 border-teal-200',
  Unpublished:     'bg-blue-50 text-blue-500 border-blue-100',

  // ── Judging / Scoring ────────────────────────────────
  Submitted:       'bg-indigo-50 text-indigo-600 border-indigo-200',
  'Under Judging': 'bg-violet-50 text-violet-600 border-violet-200',
  Scored:          'bg-teal-50 text-teal-600 border-teal-200',

  // ── Certificates ─────────────────────────────────────
  Issued:          'bg-green-50 text-green-600 border-green-200',

  // ── Attendance ───────────────────────────────────────
  Present:         'bg-green-50 text-green-700 border-green-200',
  Absent:          'bg-red-50 text-red-500 border-red-200',
  Late:            'bg-orange-50 text-orange-600 border-orange-200',

  // ── Student linking ──────────────────────────────────
  Linked:          'bg-cyan-50 text-cyan-700 border-cyan-200',
  Unlinked:        'bg-gray-100 text-gray-500 border-gray-200',
};

const SIZE_STYLES: Record<BadgeSize, string> = {
  sm: 'text-[10px] px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
};

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const colours = STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-500 border-gray-200';
  return (
    <span className={`inline-flex items-center font-medium rounded-full border whitespace-nowrap ${colours} ${SIZE_STYLES[size]}`}>
      {status}
    </span>
  );
}
