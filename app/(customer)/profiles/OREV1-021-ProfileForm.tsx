"use client";

import { useState } from "react";
import ContactToggles from "./OREV1-021A-ContactToggles";

const RELATIONSHIPS   = ["Spouse", "Kid", "Father", "Mother", "Sibling", "Cousin", "Niece", "Nephew", "Other"];
const STATUS_OPTIONS  = ["School Student", "College Student", "Working Professional", "Self Employed", "Retired", "House Wife", "Other"];

interface Props {
  open:      boolean;
  onClose:   () => void;
  profileId: string | null;
  onSave:    () => void;
}

export default function ProfileForm({ open, onClose, profileId, onSave }: Props) {
  const isEdit = !!profileId;

  const [relation, setRelation] = useState("");
  const [fullName, setFullName] = useState("");
  const [dob,      setDob]      = useState("");
  const [gender,   setGender]   = useState("");
  const [status,   setStatus]   = useState("");
  const [city,     setCity]     = useState("");
  const [pincode,  setPincode]  = useState("");
  const [phoneMatch, setPhoneMatch] = useState(true);  const [phone, setPhone] = useState("");
  const [wpMatch,    setWpMatch]    = useState(true);  const [wp,    setWp]    = useState("");
  const [emailMatch, setEmailMatch] = useState(true);  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const showError = (msg: string) => { setError(msg); setTimeout(() => setError(""), 3500); };

  const handleSubmit = async () => {
    if (!relation)        return showError("Please select a relationship.");
    if (!fullName.trim()) return showError("Full Name is required.");
    if (!dob)             return showError("Date of Birth is required.");
    if (!gender)          return showError("Gender is required.");
    if (!city.trim())     return showError("City is required.");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000)); // DB-pending — replace with API call
    setLoading(false);
    onSave();
  };

const handleSuccess = async () => {
  setLoading(true);
  await new Promise((r) => setTimeout(r, 1000));
  setLoading(false);
  onSave();
};
  const handleFailure = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); showError("Failed to save profile. Please try again."); }, 800);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">

      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Slide-up Panel */}
      <div className="relative bg-white rounded-t-2xl w-full max-w-2xl mx-auto max-h-[90vh] overflow-y-auto z-10">

        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="px-5 pb-10">

          {/* Header */}
          <div className="flex items-center justify-between py-4 border-b border-gray-100 mb-5">
            <h2 className="text-[17px] font-semibold text-gray-800">
              {isEdit ? "Edit Profile" : "Add Profile"}
            </h2>
            <button onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-sm hover:bg-gray-200">
              ✕
            </button>
          </div>

          {/* Inline error */}
          {error && (
            <div className="mb-4 px-4 py-2.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
              ✕ {error}
            </div>
          )}

          {/* Relationship */}
          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-1.5">Relationship <span className="text-red-500">*</span></label>
            <select value={relation} onChange={(e) => setRelation(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 bg-white">
              <option value="">Select relationship</option>
              {RELATIONSHIPS.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>

          {/* Full Name */}
          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-1.5">Full Name <span className="text-red-500">*</span></label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter full name"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 bg-white" />
          </div>

          {/* DOB + Gender */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1.5">Date of Birth <span className="text-red-500">*</span></label>
              <input type="date" value={dob} onChange={(e) => setDob(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 bg-white" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1.5">Gender <span className="text-red-500">*</span></label>
              <select value={gender} onChange={(e) => setGender(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 bg-white">
                <option value="">Select</option><option>Male</option><option>Female</option><option>Other</option>
              </select>
            </div>
          </div>

          {/* Current Status */}
          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-1.5">Current Status <span className="text-xs text-gray-400">optional</span></label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 bg-white">
              <option value="">Select status</option>
              {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>

          <div className="border-t border-gray-100 my-5" />

          {/* Contact Toggles */}
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
              <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Chennai"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 bg-white" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1.5">Pincode <span className="text-xs text-gray-400">opt.</span></label>
              <input type="text" value={pincode} onChange={(e) => setPincode(e.target.value)} placeholder="600001"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 bg-white" />
            </div>
          </div>

          {/* Save */}
          <button onClick={handleSuccess} disabled={loading}
            className="w-full bg-[#1D3A8A] text-white rounded-xl py-3.5 text-sm font-semibold hover:bg-blue-800 transition-colors disabled:opacity-60 mb-8">
            {loading ? "Saving..." : "Save Profile"}
          </button>

          {/* ════════════════════════════════════════════════════════════════
              Section 2 — Simulation — For Testing Only. Remove in Production.
          ════════════════════════════════════════════════════════════════ */}
          <div className="border-t border-dashed border-gray-300 pt-5">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-1">
              Simulation — For Testing Only. Remove in Production.
            </p>
            <p className="text-xs italic text-gray-400 mb-4">DB Connection Pending — remove when connected</p>
            <div className="flex gap-3">
              <button onClick={handleSubmit}
                className="flex-1 border border-green-300 text-green-700 rounded-xl py-2.5 text-sm hover:bg-green-50 transition-colors">
                ✓ Simulate Success
              </button>
              <button onClick={handleFailure}
                className="flex-1 border border-red-300 text-red-700 rounded-xl py-2.5 text-sm hover:bg-red-50 transition-colors">
                ✕ Simulate Failure
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
