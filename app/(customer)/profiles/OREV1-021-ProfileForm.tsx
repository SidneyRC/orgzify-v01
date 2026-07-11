"use client";
// OREV1-021 — Add / Edit Profile Form (slide-up panel)
// Add mode: profileId = null → POST /profiles/add
// Edit mode: profileId = string → loads profile → POST /profiles/update
// Organisations pulled from DB via /organisations/api

import { useState, useEffect } from "react";
import ContactToggles from "./OREV1-021A-ContactToggles";
import TypeaheadInput from "@/components/shared/OREV1-023-TypeaheadInput";
import { STATUS_OPTIONS } from "@/components/shared/OREV1-015B-ProfileFormTop";

const ALL_RELATIONSHIPS = ["Spouse", "Son", "Daughter", "Father", "Mother", "Sibling", "Cousin", "Niece", "Nephew", "Other"];

interface Props {
  open:             boolean;
  onClose:          () => void;
  profileId:        string | null;
  onSave:           () => void;
  hasLinkedSpouse?: boolean;
}

export default function ProfileForm({ open, onClose, profileId, onSave, hasLinkedSpouse = false }: Props) {
  const isEdit = !!profileId;

  const [relation,         setRelation]         = useState("");
  const [originalRelation, setOriginalRelation] = useState("");
  const [isLinkedSpouse,   setIsLinkedSpouse]   = useState(false);
  const [fullName,         setFullName]         = useState("");
  const [dob,              setDob]              = useState("");
  const [gender,           setGender]           = useState("");
  const [status,           setStatus]           = useState("");
  const [followUp,         setFollowUp]         = useState("");
  const [academy,          setAcademy]          = useState("");
  const [city,             setCity]             = useState("");
  const [pincode,          setPincode]          = useState("");
  const [phoneMatch,       setPhoneMatch]       = useState(true); const [phone, setPhone] = useState("");
  const [wpMatch,          setWpMatch]          = useState(true); const [wp,    setWp]    = useState("");
  const [emailMatch,       setEmailMatch]       = useState(true); const [email, setEmail] = useState("");
  const [orgData,          setOrgData]          = useState<string[]>([]);
  const [academyData,      setAcademyData]      = useState<string[]>([]);
  const [newOrgEntry,      setNewOrgEntry]      = useState<{ name: string; type: string } | null>(null);
  const [loading,          setLoading]          = useState(false);
  const [fetching,         setFetching]         = useState(false);
  const [error,            setError]            = useState("");

  const showError      = (msg: string) => { setError(msg); setTimeout(() => setError(""), 3500); };
  const selectedStatus = STATUS_OPTIONS.find(s => s.value === status);

  // Fetch organisations by type when status changes
  useEffect(() => {
    if (!selectedStatus?.type) { setOrgData([]); return; }
    fetch(`/organisations/api?type=${selectedStatus.type}`)
      .then(r => r.json())
      .then(d => setOrgData((d.organisations ?? []).map((o: { name: string }) => o.name)))
      .catch(() => setOrgData([]));
  }, [selectedStatus?.type]);

  // Fetch academies on open
  useEffect(() => {
    if (!open) return;
    fetch('/organisations/api?type=academy')
      .then(r => r.json())
      .then(d => setAcademyData((d.organisations ?? []).map((o: { name: string }) => o.name)))
      .catch(() => setAcademyData([]));
  }, [open]);

  // Load profile data in edit mode
  useEffect(() => {
    if (!open || !profileId) return;
    setFetching(true);
    fetch(`/profiles/api?id=${profileId}`)
      .then(r => r.json())
      .then(({ profile }) => {
        if (!profile) return;
        setRelation(profile.relationship ?? "");
        setOriginalRelation(profile.relationship ?? "");
        setIsLinkedSpouse(!!profile.spouse_profile_id);
        setFullName(profile.full_name ?? "");
        setDob(profile.dob ?? "");
        setGender(profile.gender ?? "");
        setStatus(profile.current_status ?? "");
        setFollowUp(profile.current_status_detail ?? "");
        setAcademy(profile.academy ?? "");
        setCity(profile.city ?? "");
        setPincode(profile.pincode ?? "");
        setPhone(profile.mobile ?? "");
        setWp(profile.whatsapp_number ?? "");
        setEmail(profile.email ?? "");
        setPhoneMatch(!profile.mobile);
        setWpMatch(!profile.whatsapp_number);
        setEmailMatch(!profile.email);
      })
      .catch(() => showError("Failed to load profile."))
      .finally(() => setFetching(false));
  }, [open, profileId]);

  // Reset form when closed
  useEffect(() => {
    if (!open) {
      setRelation(""); setOriginalRelation(""); setIsLinkedSpouse(false);
      setFullName(""); setDob(""); setGender(""); setStatus(""); setFollowUp("");
      setAcademy(""); setCity(""); setPincode(""); setPhone(""); setWp(""); setEmail("");
      setPhoneMatch(true); setWpMatch(true); setEmailMatch(true);
      setNewOrgEntry(null); setError("");
    }
  }, [open]);

  const relationshipOptions = ALL_RELATIONSHIPS.filter(r => r !== "Self");
  const spouseLocked        = isEdit && originalRelation.toLowerCase() === "spouse" && isLinkedSpouse;
  const relationLocked      = spouseLocked;
  const input               = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 bg-white";

  // Submit
  const handleSubmit = async () => {
    if (!relation)        return showError("Please select a relationship.");
    if (!fullName.trim()) return showError("Full Name is required.");
    if (!dob)             return showError("Date of Birth is required.");
    if (!gender)          return showError("Gender is required.");
    if (!status)          return showError("Current Status is required.");
    if (!city.trim())     return showError("City is required.");

    setLoading(true);
    try {
      // Save new org entry to DB if user added one not in the list
      if (newOrgEntry) {
        await fetch('/organisations/api', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(newOrgEntry),
        });
      }

      const url  = isEdit ? "/profiles/update" : "/profiles/add";
      const body = {
        ...(isEdit && { profile_id: profileId }),
        relationship:          relation,
        full_name:             fullName,
        dob, gender,
        current_status:        status || null,
        current_status_detail: followUp || null,
        academy:               academy || null,
        city,
        pincode:               pincode || null,
        mobile:                phoneMatch ? null : phone,
        whatsapp_number:       wpMatch    ? null : wp,
        email:                 emailMatch ? null : email,
      };

      const res  = await fetch(url, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { showError(data.error || "Failed to save profile."); setLoading(false); return; }
      setLoading(false);
      onSave();
    } catch {
      showError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl w-full max-w-2xl mx-auto max-h-[90vh] overflow-y-auto z-10">

        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="px-5 pb-10">
          <div className="flex items-center justify-between py-4 border-b border-gray-100 mb-5">
            <h2 className="text-[17px] font-semibold text-gray-800">
              {isEdit ? "Edit Profile" : "Add Profile"}
            </h2>
            <button onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-sm hover:bg-gray-200">
              ✕
            </button>
          </div>

          {fetching ? (
            <p className="text-sm text-gray-400 text-center py-10">Loading...</p>
          ) : (
            <>
              {error && (
                <div className="mb-4 px-4 py-2.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
                  ✕ {error}
                </div>
              )}

              {/* Relationship */}
              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-1.5">
                  Relationship <span className="text-red-500">*</span>
                </label>
                {relationLocked ? (
                  <div className="w-full border border-gray-100 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-500 flex items-center justify-between">
                    <span>{relation}</span>
                    <span className="text-xs text-orange-500">Linked — remove connection to change</span>
                  </div>
                ) : (
                  <select value={relation} onChange={(e) => setRelation(e.target.value)} className={input}>
                    <option value="">Select relationship</option>
                    {relationshipOptions.map((r) => <option key={r}>{r}</option>)}
                  </select>
                )}
              </div>

              {/* Full Name */}
              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-1.5">Full Name <span className="text-red-500">*</span></label>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter full name" className={input} />
              </div>

              {/* DOB + Gender */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">Date of Birth <span className="text-red-500">*</span></label>
                  <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className={input} />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">Gender <span className="text-red-500">*</span></label>
                  <select value={gender} onChange={(e) => setGender(e.target.value)} className={input}>
                    <option value="">Select</option><option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
              </div>

              {/* Current Status */}
              <div className="mb-3">
                <label className="block text-sm text-gray-600 mb-1.5">Current Status <span className="text-xs text-gray-400">optional</span></label>
                <select value={status} onChange={(e) => { setStatus(e.target.value); setFollowUp(""); }} className={input}>
                  <option value="">Select status</option>
                  {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>

              {/* Status follow-up — from DB */}
              {selectedStatus?.followUpLabel && selectedStatus.type && (
                <TypeaheadInput
                  label={selectedStatus.followUpLabel}
                  placeholder={`Search ${selectedStatus.followUpLabel.toLowerCase()}...`}
                  data={orgData}
                  value={followUp}
                  onChange={setFollowUp}
                  onAddNew={(v) => { setFollowUp(v); setNewOrgEntry({ name: v, type: selectedStatus.type! }); }}
                  indented />
              )}
              {selectedStatus?.value === "other" && (
                <div className="mb-4 ml-4 border-l-2 border-blue-100 pl-4">
                  <label className="block text-sm text-gray-500 mb-1.5">{selectedStatus.followUpLabel}</label>
                  <input type="text" value={followUp} onChange={(e) => setFollowUp(e.target.value)}
                    placeholder="Please specify" className={input} />
                </div>
              )}

              {/* Academy — from DB */}
              <TypeaheadInput
                label="Academy"
                placeholder="Search academy name..."
                data={academyData}
                value={academy}
                onChange={setAcademy}
                onAddNew={(v) => { setAcademy(v); setNewOrgEntry({ name: v, type: "academy" }); }}
                optional />

              <div className="border-t border-gray-100 my-5" />

              <ContactToggles
                phoneMatch={phoneMatch} setPhoneMatch={setPhoneMatch} phone={phone} setPhone={setPhone}
                wpMatch={wpMatch}       setWpMatch={setWpMatch}       wp={wp}       setWp={setWp}
                emailMatch={emailMatch} setEmailMatch={setEmailMatch} email={email} setEmail={setEmail}
              />

              <div className="border-t border-gray-100 my-5" />

              {/* City + Pincode */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">City <span className="text-red-500">*</span></label>
                  <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Chennai" className={input} />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">Pincode <span className="text-xs text-gray-400">opt.</span></label>
                  <input type="text" value={pincode} onChange={(e) => setPincode(e.target.value)} placeholder="600001" className={input} />
                </div>
              </div>

              <button onClick={handleSubmit} disabled={loading}
                className="w-full bg-blue-900 text-white rounded-xl py-3.5 text-sm font-semibold hover:bg-blue-800 transition-colors disabled:opacity-60 mb-3">
                {loading ? "Saving..." : isEdit ? "Save Changes" : "Save Profile"}
              </button>
              <button onClick={onClose} disabled={loading}
                className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors py-2">
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
