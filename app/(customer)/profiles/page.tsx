"use client";

import { useState } from "react";
import ProfileCard from "./OREV1-020A-ProfileCard";
import ProfileForm from "./OREV1-021-ProfileForm";

// DB-pending — replace with API call when connected
const MOCK_PROFILES = [
  { id: "ZY-000124", name: "Priya Sharma", relationship: "Spouse",  dob: "1992-05-14", photo: null, status: "Active",  canEdit: true  },
  { id: "ZY-000125", name: "Arjun Sharma", relationship: "Kid",     dob: "2015-08-20", photo: null, status: "Active",  canEdit: true  },
  { id: "ZY-000126", name: "Meena Devi",   relationship: "Mother",  dob: "1965-03-10", photo: null, status: "Pending", canEdit: false },
];

export default function ManageProfilesPage() {
  const [profiles]    = useState(MOCK_PROFILES);
  const [showPanel,   setShowPanel]   = useState(false);
  const [editingId,   setEditingId]   = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const handleAdd  = ()           => { setEditingId(null);  setShowPanel(true); };
  const handleEdit = (id: string) => { setEditingId(id);    setShowPanel(true); };
  const handleSave = ()           => { setShowPanel(false); showToast("success", "Profile saved successfully!"); };

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-md text-sm font-medium border ${
          toast.type === "success" ? "bg-green-50 text-green-800 border-green-200" : "bg-red-50 text-red-800 border-red-200"
        }`}>
          {toast.type === "success" ? "✓ " : "✕ "}{toast.msg}
        </div>
      )}

      {/* Responsive container */}
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 pt-6 pb-12">

        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Manage Profiles</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {profiles.length} profile{profiles.length !== 1 ? "s" : ""} added
            </p>
          </div>
          <button onClick={handleAdd}
            className="bg-[#1D3A8A] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-800 transition-colors">
            + Add Profile
          </button>
        </div>

        {/* Profile Cards */}
        <div className="flex flex-col gap-3">
          {profiles.length === 0
            ? <p className="text-sm text-gray-400 text-center py-16">No profiles added yet.</p>
            : profiles.map((p) => (
                <ProfileCard key={p.id} {...p} onEdit={() => handleEdit(p.id)} />
              ))
          }
        </div>

        {/* ════════════════════════════════════════════════════════════════
            Section 2 — Simulation — For Testing Only. Remove in Production.
        ════════════════════════════════════════════════════════════════ */}
        <div className="mt-10 border-t border-dashed border-gray-300 pt-6">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-1">
            Simulation — For Testing Only. Remove in Production.
          </p>
          <p className="text-xs italic text-gray-400 mb-4">DB Connection Pending — remove when connected</p>
          <div className="flex gap-3">
            <button onClick={() => showToast("success", "Profiles loaded successfully!")}
              className="flex-1 border border-green-400 text-green-700 rounded-xl py-2.5 text-sm font-medium hover:bg-green-50 transition-colors">
              ✓ Simulate Success
            </button>
            <button onClick={() => showToast("error", "Failed to load profiles. Please try again.")}
              className="flex-1 border border-red-400 text-red-700 rounded-xl py-2.5 text-sm font-medium hover:bg-red-50 transition-colors">
              ✕ Simulate Failure
            </button>
          </div>
        </div>

      </div>

      {/* Slide-up Profile Form Panel */}
      <ProfileForm
        open={showPanel}
        onClose={() => setShowPanel(false)}
        profileId={editingId}
        onSave={handleSave}
      />

    </div>
  );
}
