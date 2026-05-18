"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import LogoHeader from "@/components/shared/OREV1-012-LogoHeader";
import Footer from "@/components/shared/OREV1-011-Footer";
import ProfileCompletionBar from "@/components/shared/OREV1-025-ProfileCompletionBar";
import InterestTagSelector from "@/components/shared/OREV1-024-InterestTagSelector";
import TypeaheadInput from "@/components/shared/OREV1-023-TypeaheadInput";

// ── Dummy data — DB-pending ────────────────────────────────────────────────
const SCHOOLS   = ["DAV Public School, Chennai", "Chettinad Vidyashram", "Don Bosco School", "PSBB School", "Kendriya Vidyalaya"];
const COLLEGES  = ["IIT Madras", "Anna University", "Loyola College", "MOP Vaishnav College", "Madras Christian College"];
const COMPANIES = ["TCS", "Infosys", "Wipro", "HCL Technologies", "Cognizant"];
const ACADEMIES = ["Chennai Chess Academy", "Prime Sports Academy", "Excel Badminton Academy", "Rising Stars Football Club", "Inspire Yoga Studio"];

const STATUS_OPTIONS = [
  { value: "school_student",       label: "School Student",       followUpLabel: "School Name",    data: SCHOOLS   },
  { value: "college_student",      label: "College Student",      followUpLabel: "College Name",   data: COLLEGES  },
  { value: "working_professional", label: "Working Professional", followUpLabel: "Company Name",   data: COMPANIES },
  { value: "self_employed",        label: "Self Employed",        followUpLabel: "Company Name",   data: COMPANIES },
  { value: "retired",              label: "Retired",              followUpLabel: null,             data: []        },
  { value: "house_wife",           label: "House Wife",           followUpLabel: null,             data: []        },
  { value: "other",                label: "Other",                followUpLabel: "Please specify", data: []        },
];

const MOCK_PROFILE = { profileId: "ZY-000123", referredBy: "ZY-000045 · Rahul Sharma" };

export default function ProfileEditPage() {
  const router = useRouter();
  const [photo, setPhoto]             = useState<string | null>(null);
  const [fullName, setFullName]       = useState("");
  const [mobile, setMobile]           = useState("");
  const [whatsapp, setWhatsapp]       = useState(true);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [dob, setDob]                 = useState("");
  const [gender, setGender]           = useState("");
  const [status, setStatus]           = useState("");
  const [followUp, setFollowUp]       = useState("");
  const [academy, setAcademy]         = useState("");
  const [city, setCity]               = useState("");
  const [pincode, setPincode]         = useState("");
  const [anniversary, setAnniversary] = useState("");
  const [interests, setInterests]     = useState<string[]>([]);
  const [about, setAbout]             = useState("");
  const [showSpousePopup, setShowSpousePopup] = useState(false);  // FIX: anniversary popup
  const [spouseEmail, setSpouseEmail] = useState("");
  const [toast, setToast]             = useState<{ type: "success" | "error" | "info"; msg: string } | null>(null);
  const [loading, setLoading]         = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

useEffect(() => {
  fetch('/profile/api')
    .then(r => r.json())
    .then(({ profile }) => {
      if (!profile) return;
      setFullName(profile.full_name || '');
      setMobile(profile.mobile || '');
      setWhatsappNumber(profile.whatsapp_number || '');
      setDob(profile.dob || '');
      setGender(profile.gender || '');
      setStatus(profile.current_status || '');
      setFollowUp(profile.current_status_detail || '');
      setCity(profile.city || '');
      setPincode(profile.pincode || '');
      setAnniversary(profile.anniversary_date || '');
      setAbout(profile.about || '');
      setInterests(profile.area_of_interest ? JSON.parse(profile.area_of_interest) : []);
    })
    .catch(console.error);
}, []);

  const selectedStatus = STATUS_OPTIONS.find((s) => s.value === status);
  const completion = Math.round(
    ([photo, fullName, mobile, dob, gender, status, city, interests.length > 0 ? "y" : ""].filter(Boolean).length / 8) * 100
  );

  const showToast = (type: "success" | "error" | "info", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  // ── Main submit (Section 1 — production logic) ────────────────────────────
  const handleSubmit = async () => {
    if (!fullName.trim())       return showToast("error", "Full Name is required.");
    if (!mobile.trim())         return showToast("error", "Mobile Number is required.");
    if (!dob)                   return showToast("error", "Date of Birth is required.");
    if (!gender)                return showToast("error", "Gender is required.");
    if (!status)                return showToast("error", "Current Status is required.");
    if (interests.length === 0) return showToast("error", "Please select at least one Area of Interest.");
    if (!city.trim())           return showToast("error", "City is required.");
    setLoading(true);
    
const res = await fetch('/profile/api', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    full_name: fullName, mobile, whatsapp,
    whatsapp_number: whatsappNumber, dob, gender,
    current_status: status, current_status_detail: followUp,
    city, pincode, anniversary_date: anniversary,
    area_of_interest: interests, about,
  }),
});
const data = await res.json();
if (!res.ok) { setLoading(false); showToast("error", data.error || "Failed to save profile. Please try again."); return; }
setLoading(false);
showToast("success", "Profile saved successfully!");
setTimeout(() => router.push("/"), 1500);

  };

  // ── Simulation handlers — always call main functions (Section 2) ──────────
  const handleSuccess = () => handleSubmit();
  const handleFailure = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); showToast("error", "Failed to save profile. Please try again."); }, 800);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <LogoHeader />

      {/* Toast — floats top-right */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-md text-sm font-medium border ${
          toast.type === "success" ? "bg-green-50 text-green-800 border-green-200"
          : toast.type === "info"  ? "bg-blue-50 text-blue-800 border-blue-200"
          :                          "bg-red-50 text-red-800 border-red-200"
        }`}>
          {toast.type === "success" ? "✓ " : toast.type === "info" ? "ℹ " : "✕ "}{toast.msg}
        </div>
      )}

      {/* Spouse Popup — FIX: triggers when anniversary date is entered */}
      {showSpousePopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-base font-semibold text-gray-800 mb-1">Invite Your Spouse 💌</h3>
            <p className="text-sm text-gray-500 mb-4">Send them an invite to join Orgzify.</p>
            <label className="block text-sm text-gray-600 mb-1.5">
              Spouse Email <span className="text-xs text-gray-400">optional</span>
            </label>
            <input type="email" value={spouseEmail} onChange={(e) => setSpouseEmail(e.target.value)}
              placeholder="spouse@email.com"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 bg-white mb-4" />
            <div className="flex gap-3">
              <button
onClick={() => {
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(spouseEmail);
  if (spouseEmail && !valid) return showToast("error", "Please enter a valid email address.");
  showToast("success", "Email Sent to Spouse");
  setShowSpousePopup(false);
}}

                className="flex-1 bg-[#1D3A8A] text-white rounded-xl py-2.5 text-sm font-medium hover:bg-blue-800 transition-colors">
                Send Invite
              </button>
              <button
                onClick={() => { showToast("info", "Email not sent to Spouse"); setShowSpousePopup(false); }}
                className="flex-1 border border-gray-200 text-gray-600 rounded-xl py-2.5 text-sm hover:bg-gray-50 transition-colors">
                Skip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Section 1 — Production Form */}
      <main className="flex-1 w-full max-w-md mx-auto pb-10">
        <ProfileCompletionBar completion={completion} />

        {/* FIX: white card wrapping all content including Footer */}
        <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 pt-6">

            {/* Photo — FIX: border-b added as header separator */}
            <div className="flex flex-col items-center border-b border-gray-100 pb-6 mb-6">
              <button onClick={() => fileRef.current?.click()}
                className="w-20 h-20 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden mb-2 hover:border-blue-400 transition-colors">
                {photo
                  ? <img src={photo} alt="Profile" className="w-full h-full object-cover" />
                  : <span className="text-4xl text-gray-300">👤</span>}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
              <p className="text-xs text-gray-400 mb-1">Tap to upload photo</p>
              <p className="text-sm font-medium text-gray-700">Tell us a little about yourself.</p>
            </div>

            {/* Profile ID */}
            <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 mb-5">
              <p className="text-[10px] text-gray-400 mb-1">Profile ID</p>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-500 tracking-wide">{MOCK_PROFILE.profileId}</span>
                <button
                  onClick={() => { navigator.clipboard.writeText(`https://orgzify.com/ref/${MOCK_PROFILE.profileId}`); showToast("success", "Referral link copied!"); }}
                  className="flex items-center gap-1 text-sm text-blue-600 underline underline-offset-2">
                  📋 Referral Link
                </button>
              </div>
            </div>

            {/* Full Name */}
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1.5">Full Name <span className="text-red-500">*</span></label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 bg-white" />
            </div>

            {/* Mobile */}
            <div className="mb-2">
              <label className="block text-sm text-gray-600 mb-1.5">Mobile Number <span className="text-red-500">*</span></label>
              <div className="flex gap-2">
                <select className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none w-24">
                  <option>🇮🇳 +91</option>
                </select>
                <input type="tel" value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="Mobile number" maxLength={10}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 bg-white" />
              </div>
            </div>

            {/* WhatsApp Toggle — FIX: onChange now correctly toggles the checkbox state */}
            <label className="flex items-center gap-2 mb-4 mt-2 cursor-pointer">
              <input type="checkbox" checked={whatsapp} onChange={(e) => setWhatsapp(e.target.checked)} className="w-4 h-4 rounded accent-blue-600" />
              <span className="text-sm text-gray-600">WhatsApp number is same as mobile</span>
            </label>

            {/* WhatsApp Number — FIX: 10 digits only, no letters or special chars */}
            {!whatsapp && (
              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-1.5">WhatsApp Number</label>
                <div className="flex gap-2">
                  <select className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none w-24">
                    <option>🇮🇳 +91</option>
                  </select>
                  <input type="tel" value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="WhatsApp number" maxLength={10}
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 bg-white" />
                </div>
              </div>
            )}

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
                  <option value="">Select</option>
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>
            </div>

            {/* Current Status */}
            <div className="mb-3">
              <label className="block text-sm text-gray-600 mb-1.5">Current Status <span className="text-red-500">*</span></label>
              <select value={status} onChange={(e) => { setStatus(e.target.value); setFollowUp(""); }}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 bg-white">
                <option value="">Select status</option>
                {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>

            {/* Status follow-up */}
            {selectedStatus?.followUpLabel && (
              selectedStatus.data.length > 0
                ? <TypeaheadInput label={selectedStatus.followUpLabel} placeholder={`Search ${selectedStatus.followUpLabel.toLowerCase()}...`}
                    data={selectedStatus.data} value={followUp} onChange={setFollowUp}
                    onAddNew={(v) => showToast("success", `"${v}" added successfully.`)} indented />
                : selectedStatus.value === "other"
                  ? <div className="mb-4 ml-4 border-l-2 border-blue-100 pl-4">
                      <label className="block text-sm text-gray-500 mb-1.5">{selectedStatus.followUpLabel}</label>
                      <input type="text" value={followUp} onChange={(e) => setFollowUp(e.target.value)} placeholder="Please specify"
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 bg-white" />
                    </div>
                  : null
            )}

            {/* Academy */}
            <TypeaheadInput label="Academy" placeholder="Search academy name..." data={ACADEMIES}
              value={academy} onChange={setAcademy} onAddNew={(v) => showToast("success", `"${v}" added successfully.`)} optional />

            <div className="border-t border-gray-100 my-5" />

            {/* City + Pincode */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">City <span className="text-red-500">*</span></label>
                <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Chennai"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 bg-white" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">Pincode <span className="text-xs text-gray-400">opt.</span></label>
                <input type="text" value={pincode} onChange={(e) => setPincode(e.target.value)} placeholder="600001"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 bg-white" />
              </div>
            </div>

            {/* Anniversary — FIX: triggers spouse invite popup on date entry */}
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1.5">Anniversary Date <span className="text-xs text-gray-400">optional</span></label>
              <input type="date" value={anniversary}
                onChange={(e) => { setAnniversary(e.target.value); if (e.target.value) setShowSpousePopup(true); }}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 bg-white" />
            </div>

            {/* Area of Interest */}
            <InterestTagSelector selected={interests} onChange={setInterests} />

            {/* About */}
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1.5">About <span className="text-xs text-gray-400">optional</span></label>
              <textarea value={about} onChange={(e) => setAbout(e.target.value)} placeholder="Tell us a little about yourself..." rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 bg-white resize-none" />
            </div>

            <div className="border-t border-gray-100 my-5" />

            {/* Referred By */}
            <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 mb-5">
              <p className="text-[10px] text-gray-400 mb-0.5">Referred by</p>
              <p className="text-sm text-gray-400">{MOCK_PROFILE.referredBy}</p>
            </div>

            {/* Save */}
            <button onClick={handleSubmit} disabled={loading}
              className="w-full bg-[#1D3A8A] text-white rounded-xl py-3.5 text-sm font-medium hover:bg-blue-800 transition-colors disabled:opacity-60 mb-6">
              {loading ? "Saving..." : "Save & Continue"}
            </button>

            {/* ════════════════════════════════════════════════════════════════
                Section 2 — Simulation — For Testing Only. Remove in Production.
            ════════════════════════════════════════════════════════════════ */}
            <div className="border-t border-dashed border-gray-300 pt-6 mb-6">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-1">
                Simulation — For Testing Only. Remove in Production.
              </p>
              <p className="text-xs italic text-gray-400 mb-4">DB Connection Pending — remove when connected</p>
              <div className="flex gap-3">
                <button onClick={handleSuccess} className="flex-1 border border-green-300 text-green-700 rounded-xl py-2.5 text-sm hover:bg-green-50 transition-colors">
                  ✓ Simulate Success
                </button>
                <button onClick={handleFailure} className="flex-1 border border-red-300 text-red-700 rounded-xl py-2.5 text-sm hover:bg-red-50 transition-colors">
                  ✕ Simulate Failure
                </button>
              </div>
            </div>

          </div>

          {/* FIX: Footer now inside the card */}
          <Footer />
        </div>
      </main>
    </div>
  );
}
