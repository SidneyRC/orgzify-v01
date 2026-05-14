/**
 * ORGZIFY — Shared Constants
 * lib/constants.ts
 *
 * Import into any component:
 *   import { GENDER_OPTIONS, EVENT_TYPES } from "@/lib/constants"
 *
 * Rules:
 * - Fixed values (gender, status) → live here permanently
 * - Configurable values (event types, doc types) → will move to DB + Admin panel
 *   These are marked with: // TODO: move to DB — Super Admin managed
 * - Never hardcode dropdown options inside components
 */

// ─────────────────────────────────────────
// GENDER
// ─────────────────────────────────────────

export const GENDER_OPTIONS = [
  { value: "male",   label: "Male" },
  { value: "female", label: "Female" },
  { value: "other",  label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

// ─────────────────────────────────────────
// COUNTRY / REGION (expand as needed)
// ─────────────────────────────────────────

export const COUNTRY_OPTIONS = [
  { value: "IN", label: "India" },
  { value: "SG", label: "Singapore" },
  { value: "MY", label: "Malaysia" },
  { value: "AE", label: "UAE" },
  { value: "GB", label: "United Kingdom" },
  { value: "US", label: "United States" },
];

// ─────────────────────────────────────────
// USER / ACCOUNT STATUS
// ─────────────────────────────────────────

export const ACCOUNT_STATUS = {
  ACTIVE:   "active",
  INACTIVE: "inactive",
  PENDING:  "pending",
  LOCKED:   "locked",
  REJECTED: "rejected",
} as const;

export const ACCOUNT_STATUS_LABELS: Record<string, string> = {
  active:   "Active",
  inactive: "Inactive",
  pending:  "Pending",
  locked:   "Locked",
  rejected: "Rejected",
};

// ─────────────────────────────────────────
// KYC STATUS
// ─────────────────────────────────────────

export const KYC_STATUS = {
  NOT_SUBMITTED:       "not_submitted",
  PENDING_DOCUMENTS:   "pending_documents",
  UNDER_REVIEW:        "under_review",
  APPROVED:            "approved",
  REJECTED:            "rejected",
  ABANDONED:           "abandoned",
} as const;

export const KYC_STATUS_LABELS: Record<string, string> = {
  not_submitted:     "Not Submitted",
  pending_documents: "Pending Documents",
  under_review:      "Under Review",
  approved:          "Approved",
  rejected:          "Rejected",
  abandoned:         "Abandoned",
};

// ─────────────────────────────────────────
// ENTITY TYPE
// ─────────────────────────────────────────

export const ENTITY_TYPE = {
  INDIVIDUAL:   "individual",
  ACADEMY:      "academy",
  ORGANISER:    "organiser",
} as const;

// ─────────────────────────────────────────
// EVENT TYPES
// TODO: move to DB — Super Admin managed
// ─────────────────────────────────────────

export const EVENT_TYPES = [
  { value: "drawing",   label: "Drawing" },
  { value: "chess",     label: "Chess" },
  { value: "yoga",      label: "Yoga" },
  { value: "athletics", label: "Athletics" },
  { value: "badminton", label: "Badminton" },
];

// ─────────────────────────────────────────
// EVENT STATUS
// ─────────────────────────────────────────

export const EVENT_STATUS = {
  DRAFT:      "draft",
  PUBLISHED:  "published",
  ONGOING:    "ongoing",
  COMPLETED:  "completed",
  CANCELLED:  "cancelled",
} as const;

export const EVENT_STATUS_LABELS: Record<string, string> = {
  draft:     "Draft",
  published: "Published",
  ongoing:   "Ongoing",
  completed: "Completed",
  cancelled: "Cancelled",
};

// ─────────────────────────────────────────
// REGISTRATION / QR STATUS
// ─────────────────────────────────────────

export const REGISTRATION_STATUS = {
  PENDING:   "pending",
  CONFIRMED: "confirmed",
  CANCELLED: "cancelled",
  WAITLIST:  "waitlist",
} as const;

export const QR_STATUS = {
  ACTIVE:    "active",
  LOCKED:    "locked",
  CANCELLED: "cancelled",
} as const;

// ─────────────────────────────────────────
// PAYMENT METHOD
// ─────────────────────────────────────────

export const PAYMENT_METHOD = [
  { value: "cash",     label: "Cash" },
  { value: "gpay",     label: "GPay" },
  { value: "external", label: "External Platform" },
];

export const PAYMENT_STATUS = {
  PENDING:  "pending",
  CONFIRMED: "confirmed",
  FAILED:   "failed",
  REFUNDED: "refunded",
} as const;

// ─────────────────────────────────────────
// GOODIES TYPE
// TODO: move to DB — Super Admin managed
// ─────────────────────────────────────────

export const GOODIES_TYPE = [
  { value: "digital",   label: "Digital (e-certificate / results)" },
  { value: "pickup",    label: "Physical — collect at venue" },
  { value: "shipping",  label: "Physical — ship to address" },
];

export const GOODIES_STATUS = {
  PENDING:  "pending",
  ISSUED:   "issued",
  SHIPPED:  "shipped",
  DELIVERED:"delivered",
} as const;

// ─────────────────────────────────────────
// DOCUMENT TYPES
// TODO: move to DB — Super Admin managed
// ─────────────────────────────────────────

export const DOCUMENT_TYPES = [
  { value: "id_proof",       label: "ID Proof" },
  { value: "address_proof",  label: "Address Proof" },
  { value: "birth_cert",     label: "Birth Certificate" },
  { value: "school_id",      label: "School ID" },
  { value: "artwork",        label: "Artwork / Submission" },
];

// ─────────────────────────────────────────
// SCORING METHOD
// TODO: move to DB — Super Admin managed
// ─────────────────────────────────────────

export const SCORING_METHOD = [
  { value: "average",           label: "Average of all judges" },
  { value: "weighted",          label: "Weighted average" },
  { value: "drop_highest",      label: "Drop highest + average" },
  { value: "drop_lowest",       label: "Drop lowest + average" },
  { value: "drop_both",         label: "Drop highest & lowest + average" },
];

// ─────────────────────────────────────────
// TICKET TYPE
// ─────────────────────────────────────────

export const TICKET_TYPE = [
  { value: "single",    label: "Single event ticket (1 participant)" },
  { value: "group",     label: "Group ticket (multiple participants)" },
  { value: "multi_event", label: "Multi-event ticket" },
];

// ─────────────────────────────────────────
// NOTIFICATION TRIGGERS
// Reference list — used by notification system
// ─────────────────────────────────────────

export const NOTIFICATION_TRIGGERS = {
  // KYC
  KYC_SUBMITTED:        "kyc_submitted",
  KYC_PENDING_DOCS:     "kyc_pending_documents",
  KYC_APPROVED:         "kyc_approved",
  KYC_REJECTED:         "kyc_rejected",

  // Registration
  BOOKING_CONFIRMED:    "booking_confirmed",
  QR_GENERATED:         "qr_generated",
  SPOT_ENTRY_CONFIRMED: "spot_entry_confirmed",
  PAYMENT_CONFIRMED:    "payment_confirmed",
  PROFILE_TAG_REQUESTED:"profile_tag_requested",
  PROFILE_TAG_APPROVED: "profile_tag_approved",

  // Event
  EVENT_PUBLISHED:      "event_published",
  EVENT_REMINDER:       "event_reminder",
  RESULTS_PUBLISHED:    "results_published",
  CERTIFICATE_SENT:     "certificate_sent",

  // Admin
  DUPLICATE_DETECTED:   "duplicate_detected",
} as const;

// ─────────────────────────────────────────
// OTP CONFIG (matches page logic)
// ─────────────────────────────────────────

export const OTP_CONFIG = {
  EXPIRY_SECONDS:    180,  // 3 minutes
  RESEND_COOLDOWN:   60,   // 60 seconds
  MAX_RESEND:        3,
  MAX_WRONG:         5,
  LOCK_MINUTES:      15,
} as const;

// ─────────────────────────────────────────
// SESSION CONFIG
// ─────────────────────────────────────────

export const SESSION_CONFIG = {
  IDLE_WARNING_MINUTES:  25,
  AUTO_LOGOUT_MINUTES:   30,
  REMEMBER_ME_DAYS:      30,
  EMAIL_VERIFY_LOCK_DAYS:15,
} as const;
