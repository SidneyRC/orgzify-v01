"use client";
// Manage Profiles page — /profiles
// Lists all profiles for logged-in user. Primary first, family below, shared profiles last.

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import OREV1_020A_ProfileCard from "@/app/(customer)/profiles/OREV1-020A-ProfileCard";
import OREV1_021_ProfileForm from "@/app/(customer)/profiles/OREV1-021-ProfileForm";
import OREV1_037_AccessPanel from "@/components/shared/OREV1-037-AccessPanel";

interface Profile {
  id:                string;
  full_name:         string;
  title:             string | null;
  relationship:      string;
  photo_url:         string | null;
  city:              string | null;
  current_status:    string | null;
  is_shared:         boolean;
  parent_profile_id: string | null;
  spouse_profile_id: string | null;
}

interface SharedProfile {
  access_id:      string;
  profile_id:     string;
  full_name:      string;
  photo_url:      string | null;
  city:           string | null;
  current_status: string | null;
  relationship:   string;
  can_edit:       boolean;
  can_share:      boolean;
}

type ConfirmType = 'unlink' | 'delete' | 'remove_shared';

interface ConfirmState {
  type:      ConfirmType;
  profileId: string;
  name:      string;
  accessId?: string;
}

function ManageProfilesPageInner() {
  const router = useRouter();
  const [editProfileId,   setEditProfileId]   = useState<string | null>(null);
  const searchParams = useSearchParams();
  const [profiles,        setProfiles]        = useState<Profile[]>([]);
  const [sharedProfiles,  setSharedProfiles]  = useState<SharedProfile[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [formOpen,        setFormOpen]        = useState(false);
  const [accessProfileId, setAccessProfileId] = useState<string | null>(null);
  const [confirm,         setConfirm]         = useState<ConfirmState | null>(null);
  const [actionLoading,   setActionLoading]   = useState(false);
  const [toast,           setToast]           = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showToast = useCallback((type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const [ownRes, sharedRes] = await Promise.all([
        fetch("/profiles/api"),
        fetch("/profiles/shared"),
      ]);
      const ownData    = await ownRes.json();
      const sharedData = await sharedRes.json();
      if (ownRes.ok)    setProfiles(ownData.profiles ?? []);
      else showToast("error", "Failed to load profiles.");
      if (sharedRes.ok) setSharedProfiles(sharedData.profiles ?? []);
    } catch {
      showToast("error", "Something went wrong.");
    }
    setLoading(false);
  }, [showToast]);

useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  useEffect(() => {
    if (searchParams.get("error") === "unauthorised") {
      showToast("error", "You don't have access to this page.");
    }
  }, [searchParams, showToast]);

  const handleUnlinkConfirm = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/profile/unlink-spouse", { method: "POST" });
      if (res.ok) {
        showToast("success", "Spouse connection removed.");
        setConfirm(null); loadProfiles();
      } else {
        const data = await res.json();
        showToast("error", data.error || "Failed to remove connection.");
      }
    } catch { showToast("error", "Something went wrong."); }
    setActionLoading(false);
  };

  const handleDeleteConfirm = async () => {
    if (!confirm) return;
    setActionLoading(true);
    try {
      const res = await fetch("/profiles/delete", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile_id: confirm.profileId }),
      });
      if (res.ok) {
        showToast("success", "Profile deleted.");
        setConfirm(null); loadProfiles();
      } else {
        const data = await res.json();
        showToast("error", data.error || "Failed to delete profile.");
      }
    } catch { showToast("error", "Something went wrong."); }
    setActionLoading(false);
  };

  const handleRemoveSharedConfirm = async () => {
    if (!confirm?.accessId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/profiles/access?id=${confirm.accessId}`, { method: "DELETE" });
      if (res.ok) {
        showToast("success", "Shared profile removed.");
        setConfirm(null); loadProfiles();
      } else {
        const data = await res.json();
        showToast("error", data.error || "Failed to remove shared profile.");
      }
    } catch { showToast("error", "Something went wrong."); }
    setActionLoading(false);
  };

  const primary = profiles.find(p => p.relationship.toLowerCase() === "self");
  const family  = profiles.filter(p => p.relationship.toLowerCase() !== "self");

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-md text-sm font-medium border ${
          toast.type === "success" ? "bg-green-50 text-green-800 border-green-200" : "bg-red-50 text-red-800 border-red-200"}`}>
          {toast.type === "success" ? "✓ " : "✕ "}{toast.msg}
        </div>
      )}

      {/* Confirmation popup */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirm(null)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm z-10">
            {confirm.type === 'unlink' && (
              <>
                <p className="text-base font-semibold text-gray-800 mb-2">Remove Spouse Connection?</p>
                <p className="text-sm text-gray-500 mb-5">
                  This will unlink both profiles. Anniversary date will be cleared from your spouse's profile.
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setConfirm(null)} disabled={actionLoading}
                    className="flex-1 border border-gray-200 text-gray-600 rounded-xl py-2.5 text-sm hover:bg-gray-50 transition-colors">Cancel</button>
                  <button onClick={handleUnlinkConfirm} disabled={actionLoading}
                    className="flex-1 bg-orange-500 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-orange-600 transition-colors disabled:opacity-60">
                    {actionLoading ? "Removing..." : "Yes, Remove"}
                  </button>
                </div>
              </>
            )}
            {confirm.type === 'delete' && (
              <>
                <p className="text-base font-semibold text-gray-800 mb-2">Delete {confirm.name}?</p>
                <p className="text-sm text-gray-500 mb-2">
                  This profile will be permanently hidden. All event history and certificates will be preserved.
                </p>
                <p className="text-sm font-medium text-red-600 mb-5">Are you sure you want to continue?</p>
                <div className="flex gap-3">
                  <button onClick={() => setConfirm(null)} disabled={actionLoading}
                    className="flex-1 border border-gray-200 text-gray-600 rounded-xl py-2.5 text-sm hover:bg-gray-50 transition-colors">Cancel</button>
                  <button onClick={handleDeleteConfirm} disabled={actionLoading}
                    className="flex-1 bg-red-500 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-60">
                    {actionLoading ? "Deleting..." : "Yes, Delete"}
                  </button>
                </div>
              </>
            )}
            {confirm.type === 'remove_shared' && (
              <>
                <p className="text-base font-semibold text-gray-800 mb-2">Remove {confirm.name}?</p>
                <p className="text-sm text-gray-500 mb-5">
                  This profile was shared with you. Removing it will only unlink it from your account — the original profile will not be deleted.
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setConfirm(null)} disabled={actionLoading}
                    className="flex-1 border border-gray-200 text-gray-600 rounded-xl py-2.5 text-sm hover:bg-gray-50 transition-colors">Cancel</button>
                  <button onClick={handleRemoveSharedConfirm} disabled={actionLoading}
                    className="flex-1 bg-red-500 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-60">
                    {actionLoading ? "Removing..." : "Yes, Remove"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <main className="flex-1 w-full max-w-md mx-auto px-4 pb-24">

        <div className="pt-6 pb-4">
          <h1 className="text-xl font-semibold text-gray-800">Manage profiles</h1>
          <p className="text-sm text-gray-400 mt-1">Your profiles and family members</p>
        </div>

        {loading ? (
          <p className="text-sm text-gray-400 text-center py-10">Loading...</p>
        ) : (
          <div className="flex flex-col gap-3">

            {/* Primary profile */}
            {primary && (
              <OREV1_020A_ProfileCard
                key={primary.id}
                id={primary.id}
                name={`${primary.title ?? ""} ${primary.full_name ?? ""}`.trim()}
                relationship="self"
                photo={primary.photo_url}
                city={primary.city}
                status={primary.current_status ?? ""}
                isShared={primary.is_shared}
                isPrimary
                isLinkedSpouse={false}
                onEdit={() => router.push("/profile/edit")}
                onShare={() => setAccessProfileId(primary.id)}
              />
            )}

            {/* Family profiles */}
            {family.map(p => (
              <OREV1_020A_ProfileCard
                key={p.id}
                id={p.id}
                name={p.full_name ?? ""}
                relationship={p.relationship}
                photo={p.photo_url}
                city={p.city}
                status={p.current_status ?? ""}
                isShared={p.is_shared}
                isPrimary={false}
                isLinkedSpouse={p.relationship.toLowerCase() === 'spouse' && !!p.spouse_profile_id}
                onEdit={() => setEditProfileId(p.id)}
                onShare={() => setAccessProfileId(p.id)}
                onUnlink={() => setConfirm({ type: 'unlink', profileId: p.id, name: p.full_name })}
                onDelete={() => setConfirm({ type: 'delete', profileId: p.id, name: p.full_name })}
              />
            ))}

            {/* Shared profiles — from other users */}
            {sharedProfiles.length > 0 && (
              <>
                <div className="pt-2 pb-1">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Shared with me</p>
                </div>
                {sharedProfiles.map(p => (
                  <div key={p.access_id} className="bg-white border border-gray-100 rounded-2xl px-4 py-4 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {p.photo_url
                        ? <img src={p.photo_url} alt={p.full_name} className="w-full h-full object-cover" />
                        : <span className="text-lg font-medium text-gray-500">{(p.full_name ?? "?").charAt(0).toUpperCase()}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-gray-800 truncate">{p.full_name}</p>
                        <span className="text-[11px] rounded-full px-2 py-0.5 flex-shrink-0 bg-blue-50 text-blue-700">Shared</span>
                      </div>
                      {p.city && <p className="text-xs text-gray-400 mt-0.5">{p.city}</p>}
                    </div>
                    
                    {p.can_edit && (
  <button onClick={() => setEditProfileId(p.profile_id)} aria-label="Edit profile"
    className="text-gray-400 hover:text-blue-900 transition-colors flex-shrink-0">
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  </button>
)}
{p.can_share && (
  <button onClick={() => setAccessProfileId(p.profile_id)} aria-label="Share profile"
    className="text-gray-400 hover:text-green-600 transition-colors flex-shrink-0">
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
  </button>
)}
                    
                    {/* Delete icon — same as sub-profile delete */}
                    <button
                      onClick={() => setConfirm({ type: 'remove_shared', profileId: p.profile_id, name: p.full_name, accessId: p.access_id })}
                      aria-label="Remove shared profile"
                      className="text-red-400 hover:text-red-600 transition-colors flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </>
            )}

          </div>
        )}
      </main>

      {/* FAB — Add Profile */}
      <button onClick={() => setFormOpen(true)}
        className="fixed bottom-6 right-6 w-12 h-12 bg-blue-900 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-800 transition z-40"
        aria-label="Add profile">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      </button>

      {/* Profile Form */}
      <OREV1_021_ProfileForm
        open={formOpen || !!editProfileId}
        onClose={() => { setFormOpen(false); setEditProfileId(null); }}
        profileId={editProfileId}
        hasLinkedSpouse={!!primary?.spouse_profile_id}
        onSave={() => {
          setFormOpen(false); setEditProfileId(null);
          loadProfiles();
          showToast("success", editProfileId ? "Profile updated successfully!" : "Profile added successfully!");
        }}
      />

      {/* Access Panel */}
      {accessProfileId && (
        <OREV1_037_AccessPanel
          profileId={accessProfileId}
          onClose={() => setAccessProfileId(null)}
        />
      )}

    </div>
  );
}

export default function ManageProfilesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50"><p className="text-sm text-gray-400">Loading...</p></div>}>
      <ManageProfilesPageInner />
    </Suspense>
  );
}
