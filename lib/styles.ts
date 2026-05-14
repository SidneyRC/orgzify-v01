/**
 * ORGZIFY — Shared Style Tokens
 * lib/styles.ts
 *
 * Import into any component:
 *   import { btn, card, input } from "@/lib/styles"
 *
 * Rules:
 * - Change a class here → updates everywhere instantly
 * - Never hardcode repeated Tailwind strings in components
 * - Add new tokens here when a new pattern is used 2+ times
 */

// ─────────────────────────────────────────
// LAYOUT
// ─────────────────────────────────────────

export const layout = {
  /** Full page wrapper — always the outermost div */
  page: "min-h-screen bg-gray-50 flex flex-col",

  /** Centered content area — wraps the card */
  center: "flex-1 flex items-center justify-center px-4 py-10",

  /** Max-width content column */
  column: "w-full max-w-md",
};

// ─────────────────────────────────────────
// CARD
// ─────────────────────────────────────────

export const card = {
  /** Standard auth/form card */
  base: "bg-white rounded-2xl shadow-sm border border-gray-100 p-8",

  /** Card with tighter padding — for inner sections */
  compact: "bg-white rounded-2xl shadow-sm border border-gray-100 p-5",

  /** Header inside a card — has bottom border */
  header: "border-b border-gray-100 pb-4 mb-6",
};

// ─────────────────────────────────────────
// BUTTONS
// ─────────────────────────────────────────

export const btn = {
  /** Primary filled button — main CTA */
  primary:
    "w-full bg-blue-900 text-white rounded-xl py-3.5 text-sm font-semibold hover:bg-blue-800 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed",

  /** Outline button — secondary action */
  outline:
    "w-full border-2 border-blue-900 text-blue-900 rounded-xl py-3.5 text-sm font-semibold text-center hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",

  /** Ghost button — tertiary / back actions */
  ghost:
    "text-sm text-gray-400 hover:text-gray-600 transition-colors",

  /** Simulation success button */
  simSuccess:
    "w-full py-3 rounded-xl bg-green-600 text-white font-semibold text-sm hover:bg-green-700 transition-colors",

  /** Simulation failure button */
  simFailure:
    "w-full py-3 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition-colors",

  /** Simulation warning button (e.g. wrong OTP) */
  simWarning:
    "w-full py-3 rounded-xl bg-orange-500 text-white font-semibold text-sm hover:bg-orange-600 transition-colors",

  /** Social login — Google style */
  socialGoogle:
    "flex items-center justify-center gap-3 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors",

  /** Social login — Facebook style */
  socialFacebook:
    "flex items-center justify-center gap-3 bg-[#1877F2] rounded-xl px-4 py-3 text-sm font-medium text-white hover:bg-[#166fe5] transition-colors",
};

// ─────────────────────────────────────────
// FORM — INPUTS & LABELS
// ─────────────────────────────────────────

export const input = {
  /** Standard text input */
  base: "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 transition-colors",

  /** Input in error state */
  error: "w-full border border-red-400 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400/20 focus:border-red-400 transition-colors",

  /** Label above input */
  label: "block text-sm font-medium text-gray-700 mb-1.5",

  /** Inline error message below input */
  errorMsg: "text-xs text-red-500 mt-1",
};

// ─────────────────────────────────────────
// TOGGLE / TABS
// ─────────────────────────────────────────

export const toggle = {
  /** Wrapper — pill container */
  wrapper: "flex rounded-xl bg-gray-100 p-1",

  /** Active tab */
  active: "flex-1 py-2 rounded-lg text-sm font-medium transition-all bg-white text-blue-900 shadow-sm",

  /** Inactive tab */
  inactive: "flex-1 py-2 rounded-lg text-sm font-medium transition-all text-gray-500",
};

// ─────────────────────────────────────────
// ALERTS / FEEDBACK BANNERS
// ─────────────────────────────────────────

export const alert = {
  /** Error inline alert */
  error: "px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600",

  /** Success inline alert */
  success: "px-4 py-3 bg-green-50 border border-green-300 rounded-xl text-sm text-green-700",

  /** Warning inline alert */
  warning: "px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800",

  /** Info inline alert */
  info: "px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800",
};

// ─────────────────────────────────────────
// DIVIDERS
// ─────────────────────────────────────────

export const divider = {
  /** OR divider between sections */
  or: "flex items-center gap-3",
  orLine: "flex-1 h-px bg-gray-200",
  orText: "text-xs text-gray-400 font-medium",

  /** Simulation section divider */
  simulation: "border-t-2 border-dashed border-gray-300 pt-5 flex flex-col gap-2",
};

// ─────────────────────────────────────────
// TYPOGRAPHY
// ─────────────────────────────────────────

export const text = {
  /** Page / card heading */
  heading: "text-2xl font-bold text-blue-900",

  /** Subheading under heading */
  subheading: "text-sm text-gray-500 mt-1",

  /** Section label */
  label: "text-xs font-semibold text-gray-400 uppercase tracking-widest",

  /** Link */
  link: "text-blue-900 font-semibold hover:underline",

  /** Muted small text */
  muted: "text-xs text-gray-400",
};

// ─────────────────────────────────────────
// SIMULATION SECTION (Section 2 — every page)
// ─────────────────────────────────────────

export const sim = {
  wrapper: "border-t-2 border-dashed border-gray-300 mt-6 pt-5 flex flex-col gap-2",
  title: "text-center text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1",
  note: "text-center text-xs text-gray-400 italic",
};
