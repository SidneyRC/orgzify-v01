// THIS FILE GOES IN: app/(admin)/access-denied/page.tsx
// Shared "no access" page — reusable by any admin page going forward.
// Plain neutral styling, matching the existing Dashboard placeholder page pattern.

export const metadata = { title: 'Access Denied — Orgzify Admin' }

export default function AccessDeniedPage() {
  return (
    <div className="flex items-center justify-center h-full min-h-[60vh] p-6">
      <div className="text-center max-w-sm bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
        <h1 className="text-lg font-semibold text-gray-800 mb-2">Access Denied</h1>
        <p className="text-sm text-gray-400">
          You don't have access to this page. Please contact your admin team for assistance.
        </p>
      </div>
    </div>
  )
}
