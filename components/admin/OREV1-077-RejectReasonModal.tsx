// THIS FILE GOES IN: components/admin/OREV1-077-RejectReasonModal.tsx (REPLACES existing file)
"use client";
import { useState, useEffect } from "react";

type Reason = { id: string; reason_label: string };
type StatusCode = "rejected" | "suspended" | "blocked";

const LABELS: Record<StatusCode, { action: string; confirmClass: string }> = {
  rejected: { action: "Reject", confirmClass: "bg-red-600 hover:bg-red-700" },
  suspended: { action: "Suspend", confirmClass: "bg-yellow-600 hover:bg-yellow-700" },
  blocked: { action: "Block", confirmClass: "bg-gray-800 hover:bg-black" },
};

export default function RejectReasonModal({ entityName, statusCode, apiBase = "/admin/ecosystem/entities/api", onCancel, onConfirm }: {
  entityName: string; statusCode: StatusCode; apiBase?: string; onCancel: () => void; onConfirm: (reasonId: string | null, note: string) => void;
}) {
  const [reasons, setReasons] = useState<Reason[]>([]);
  const [reasonId, setReasonId] = useState("");
  const [note, setNote] = useState("");
  const { action, confirmClass } = LABELS[statusCode];

  useEffect(() => {
    fetch(`${apiBase}?type=status_reasons&status_code=${statusCode}`)
      .then(r => r.json()).then(j => setReasons(j.data || []));
  }, [statusCode, apiBase]);

  const canConfirm = !!reasonId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-5">
        <p className="font-semibold text-gray-800 mb-1">{action} "{entityName}"</p>
        <p className="text-xs text-gray-400 mb-4">This will be shown to the applicant. Please select a reason.</p>

        <label className="text-xs font-medium text-gray-600 mb-1 block">Reason <span className="text-red-500">*</span></label>
        <select value={reasonId} onChange={e => setReasonId(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mb-3 focus:outline-none focus:border-blue-400">
          <option value="">Select a reason</option>
          {reasons.map(r => <option key={r.id} value={r.id}>{r.reason_label}</option>)}
        </select>

        <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
          placeholder="Additional note (optional)"
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mb-4 focus:outline-none focus:border-blue-400" />

        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="text-sm font-medium px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={() => onConfirm(reasonId || null, note.trim())} disabled={!canConfirm}
            className={`text-sm font-medium px-4 py-2 rounded-xl text-white disabled:opacity-40 ${confirmClass}`}>Confirm {action}</button>
        </div>
      </div>
    </div>
  );
}
