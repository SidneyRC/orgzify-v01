"use client";
// OREV1-037 — Access Panel
// Send invite with permissions on top, access list with edit + remove below
// Pending invites section with revoke + resend icons
// GET/PATCH/DELETE → /profiles/access | Invite → /invite/send | Pending → /invite/pending

import { useState, useEffect, useCallback } from "react";

interface AccessEntry {
  id:            string;
  granted_to_id: string | null;
  can_view:      boolean;
  can_edit:      boolean;
  can_enroll:    boolean;
  can_share:     boolean;
  name?:         string | null;
  email?:        string | null;
}

interface PendingInvite {
  id:         string;
  to_email:   string;
  type:       string;
  created_at: string;
}

interface Props {
  profileId: string;
  onClose:   () => void;
}

function getInitial(name: string): string {
  return (name ?? "?").charAt(0).toUpperCase();
}

function PermToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-1.5 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        className="w-3.5 h-3.5 accent-blue-600 rounded" />
      <span className="text-xs text-gray-500">{label}</span>
    </label>
  );
}

export default function AccessPanel({ profileId, onClose }: Props) {
  const [entries,        setEntries]        = useState<AccessEntry[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [inviteEmail,    setInviteEmail]    = useState("");
  const [inviting,       setInviting]       = useState(false);
  const [error,          setError]          = useState("");
  const [success,        setSuccess]        = useState("");
  const [editingId,      setEditingId]      = useState<string | null>(null);

  const [pView,   setPView]   = useState(true);
  const [pEnroll, setPEnroll] = useState(false);
  const [pEdit,   setPEdit]   = useState(false);
  const [pShare,  setPShare]  = useState(false);

  const loadAccess = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [accessRes, pendingRes] = await Promise.all([
        fetch(`/profiles/access?profile_id=${profileId}`),
        fetch(`/invite/pending?profile_id=${profileId}`),
      ]);
      const accessData  = await accessRes.json();
      const pendingData = await pendingRes.json();
      if (accessRes.ok)  setEntries(accessData.access ?? []);
      if (pendingRes.ok) setPendingInvites(pendingData.invites ?? []);
    } catch { setError("Failed to load access list."); }
    setLoading(false);
  }, [profileId]);

  useEffect(() => { loadAccess(); }, [loadAccess]);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) { setError("Please enter an email address."); return; }
    setInviting(true); setError(""); setSuccess("");
    try {
      const res = await fetch("/invite/send", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          toEmail:  inviteEmail.trim(),
          type:     "profile_share",
          metadata: { profile_id: profileId, can_view: pView, can_edit: pEdit, can_enroll: pEnroll, can_share: pShare },
        }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Failed to send invite.");
      else {
        setSuccess("Invite sent!");
        setInviteEmail("");
        setPView(true); setPEnroll(false); setPEdit(false); setPShare(false);
        loadAccess();
      }
    } catch { setError("Something went wrong."); }
    setInviting(false);
  };

  const handleRemove = async (id: string) => {
    setError("");
    try {
      const res = await fetch(`/profiles/access?id=${id}`, { method: "DELETE" });
      if (res.ok) setEntries(prev => prev.filter(e => e.id !== id));
      else setError("Failed to remove access.");
    } catch { setError("Failed to remove access."); }
  };

  const handleRevoke = async (id: string) => {
    setError("");
    try {
      const res = await fetch(`/invite/pending?id=${id}`, { method: "DELETE" });
      if (res.ok) setPendingInvites(prev => prev.filter(i => i.id !== id));
      else setError("Failed to revoke invite.");
    } catch { setError("Failed to revoke invite."); }
  };

  const handleResend = async (id: string) => {
    setError(""); setSuccess("");
    try {
      const res = await fetch("/invite/pending", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ inviteId: id }),
      });
      if (res.ok) { setSuccess("Invite resent!"); loadAccess(); }
      else setError("Failed to resend invite.");
    } catch { setError("Failed to resend invite."); }
  };

  const handlePermUpdate = async (entry: AccessEntry) => {
    setError("");
    try {
      const res = await fetch("/profiles/access", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          id:         entry.id,
          can_view:   entry.can_view,
          can_edit:   entry.can_edit,
          can_enroll: entry.can_enroll,
          can_share:  entry.can_share,
        }),
      });
      if (!res.ok) setError("Failed to update permissions.");
      else setEditingId(null);
    } catch { setError("Failed to update permissions."); }
  };

  const updateEntry = (id: string, field: keyof AccessEntry, value: boolean) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl w-full z-10 pb-10 max-h-[85vh] overflow-y-auto">

        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="px-5 pt-3">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
            <h2 className="text-base font-semibold text-gray-800">Who has access</h2>
            <button onClick={onClose}
              className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-sm hover:bg-gray-200">✕</button>
          </div>

          {error   && <p className="text-xs text-red-500 mb-2">✕ {error}</p>}
          {success && <p className="text-xs text-green-600 mb-2">✓ {success}</p>}

          {/* Invite section */}
          <div className="mb-5">
            <div className="flex gap-2 mb-3">
              <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleInvite()}
                placeholder="Invite by email address"
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 bg-white" />
              <button onClick={handleInvite} disabled={inviting}
                className="bg-blue-900 text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-blue-800 transition disabled:opacity-50 flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                {inviting ? "..." : "Send"}
              </button>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-2 px-1">
              <PermToggle label="View"   checked={pView}   onChange={setPView} />
              <PermToggle label="Enroll" checked={pEnroll} onChange={setPEnroll} />
              <PermToggle label="Edit"   checked={pEdit}   onChange={setPEdit} />
              <PermToggle label="Share"  checked={pShare}  onChange={setPShare} />
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-gray-400 text-center py-4">Loading...</p>
          ) : (
            <>
              {/* Pending Invites */}
              {pendingInvites.length > 0 && (
                <div className="border-t border-gray-100 pt-4 mb-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Pending</p>
                  <div className="flex flex-col gap-3">
                    {pendingInvites.map(inv => (
                      <div key={inv.id} className="border border-amber-100 bg-amber-50 rounded-xl px-4 py-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-800">{inv.to_email}</p>
                          <p className="text-xs text-gray-400">Sent {new Date(inv.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {/* Resend */}
                          <button onClick={() => handleResend(inv.id)} aria-label="Resend invite"
                            className="text-blue-400 hover:text-blue-600 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </button>
                          {/* Revoke */}
                          <button onClick={() => handleRevoke(inv.id)} aria-label="Revoke invite"
                            className="text-red-400 hover:text-red-600 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Access list */}
              <div className="border-t border-gray-100 pt-4">
                {entries.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No one has access yet.</p>
                ) : (
                  <>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Has Access</p>
                    <div className="flex flex-col gap-4">
                      {entries.map(e => (
                        <div key={e.id} className="border border-gray-100 rounded-xl px-4 py-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-xs font-medium text-blue-900">
                                {getInitial(e.name ?? "?")}
                              </div>
                              <div>
                                <p className="text-sm text-gray-800">{e.name ?? "Invited user"}</p>
                                {e.email && <p className="text-xs text-gray-400">{e.email}</p>}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <button onClick={() => setEditingId(editingId === e.id ? null : e.id)}
                                className="text-gray-300 hover:text-blue-600 transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button onClick={() => handleRemove(e.id)}
                                className="text-gray-300 hover:text-red-400 transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                          {editingId === e.id ? (
                            <div className="mt-2 pt-2 border-t border-gray-100">
                              <div className="flex flex-wrap gap-x-4 gap-y-2 mb-3">
                                <PermToggle label="View"   checked={e.can_view}   onChange={v => updateEntry(e.id, "can_view", v)} />
                                <PermToggle label="Enroll" checked={e.can_enroll} onChange={v => updateEntry(e.id, "can_enroll", v)} />
                                <PermToggle label="Edit"   checked={e.can_edit}   onChange={v => updateEntry(e.id, "can_edit", v)} />
                                <PermToggle label="Share"  checked={e.can_share}  onChange={v => updateEntry(e.id, "can_share", v)} />
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => setEditingId(null)}
                                  className="flex-1 border border-gray-200 text-gray-500 rounded-xl py-1.5 text-xs hover:bg-gray-50 transition">
                                  Cancel
                                </button>
                                <button onClick={() => handlePermUpdate(e)}
                                  className="flex-1 bg-blue-900 text-white rounded-xl py-1.5 text-xs font-medium hover:bg-blue-800 transition">
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400">
                              {[e.can_view && "View", e.can_enroll && "Enroll", e.can_edit && "Edit", e.can_share && "Share"]
                                .filter(Boolean).join(" · ") || "No permissions"}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
