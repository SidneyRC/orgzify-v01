"use client";
// OREV1-015B — Profile Form Top
// Photo · Profile ID · Full Name · Email · Mobile · WhatsApp · DOB · Gender · Status · Academy
// Organisations pulled from DB via /organisations/api

import { useRef, useState, useEffect } from "react";
import TypeaheadInput from "@/components/shared/OREV1-023-TypeaheadInput";
import EmailChangeSection from "@/components/shared/OREV1-015D-EmailChangeSection";

export const STATUS_OPTIONS = [
  { value: "school_student",       label: "School Student",       followUpLabel: "School Name",    type: "school"   },
  { value: "college_student",      label: "College Student",      followUpLabel: "College Name",   type: "college"  },
  { value: "working_professional", label: "Working Professional", followUpLabel: "Company Name",   type: "company"  },
  { value: "self_employed",        label: "Self Employed",        followUpLabel: "Business Name",  type: "business" },
  { value: "retired",              label: "Retired",              followUpLabel: null,             type: null       },
  { value: "house_wife",           label: "House Wife",           followUpLabel: null,             type: null       },
  { value: "other",                label: "Other",                followUpLabel: "Please specify", type: null       },
];

interface Props {
  photo: string | null; onPhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  profileId: string; zyId: string;
  email: string; showEmailChange: boolean; onShowEmailChange: (v: boolean) => void;
  newEmail: string; onNewEmailChange: (v: string) => void;
  emailOtpSent: boolean; onSendEmailOtp: () => void;
  emailOtp: string; onEmailOtpChange: (v: string) => void;
  onVerifyEmailOtp: () => void; emailLoading: boolean;
  title: string; onTitleChange: (v: string) => void;
  fullName: string; onFullNameChange: (v: string) => void;
  mobile: string; onMobileChange: (v: string) => void;
  whatsapp: boolean; onWhatsappChange: (v: boolean) => void;
  whatsappNumber: string; onWhatsappNumberChange: (v: string) => void;
  dob: string; onDobChange: (v: string) => void;
  gender: string; onGenderChange: (v: string) => void;
  status: string; onStatusChange: (v: string) => void;
  followUp: string; onFollowUpChange: (v: string) => void;
  academy: string; onAcademyChange: (v: string) => void;
  newOrgEntry: { name: string; type: string } | null;
  onNewOrgEntry: (v: { name: string; type: string } | null) => void;
  showToast: (type: "success" | "error" | "info", msg: string) => void;
}

export default function ProfileFormTop({
  photo, onPhotoChange, profileId, zyId,
  email, showEmailChange, onShowEmailChange, newEmail, onNewEmailChange,
  emailOtpSent, onSendEmailOtp, emailOtp, onEmailOtpChange, onVerifyEmailOtp, emailLoading,
  fullName, onFullNameChange, mobile, onMobileChange,
  title, onTitleChange, whatsapp, onWhatsappChange,
  whatsappNumber, onWhatsappNumberChange, dob, onDobChange, gender, onGenderChange,
  status, onStatusChange, followUp, onFollowUpChange, academy, onAcademyChange,
  onNewOrgEntry, showToast,
}: Props) {

  const fileRef       = useRef<HTMLInputElement>(null);
  const selectedStatus = STATUS_OPTIONS.find((s) => s.value === status);
  const input         = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 bg-white";

  const [orgData,     setOrgData]     = useState<string[]>([]);
  const [academyData, setAcademyData] = useState<string[]>([]);

  // Fetch organisations by type when status changes
  useEffect(() => {
    if (!selectedStatus?.type) { setOrgData([]); return; }
    fetch(`/organisations/api?type=${selectedStatus.type}`)
      .then(r => r.json())
      .then(d => setOrgData((d.organisations ?? []).map((o: { name: string }) => o.name)))
      .catch(() => setOrgData([]));
  }, [selectedStatus?.type]);

  // Fetch academies on mount
  useEffect(() => {
    fetch('/organisations/api?type=academy')
      .then(r => r.json())
      .then(d => setAcademyData((d.organisations ?? []).map((o: { name: string }) => o.name)))
      .catch(() => setAcademyData([]));
  }, []);

  return (
    <div className="px-4 pt-6">
      {/* Photo */}
      <div className="flex flex-col items-center border-b border-gray-100 pb-6 mb-6">
        <button onClick={() => fileRef.current?.click()}
          className="w-20 h-20 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden mb-2 hover:border-blue-400 transition-colors">
          {photo
            ? <img src={photo} alt="Profile" className="w-full h-full object-cover" />
            : <span className="text-4xl text-gray-300">👤</span>}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPhotoChange} />
        <p className="text-xs text-gray-400 mb-1">Tap to upload photo</p>
        <p className="text-sm font-medium text-gray-700">Tell us a little about yourself.</p>
      </div>

      {/* Profile ID */}
      <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 mb-5">
        <p className="text-[10px] text-gray-400 mb-1">Profile ID</p>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-500 tracking-wide">{zyId}</span>
          <button onClick={() => { navigator.clipboard.writeText(`https://orgzify.com/ref/${zyId}`); showToast("success", "Referral link copied!"); }}
            className="text-sm text-blue-600 underline underline-offset-2">📋 Referral Link</button>
        </div>
      </div>

      {/* Full Name */}
      <div className="mb-4">
        <label className="block text-sm text-gray-600 mb-1.5">Full Name <span className="text-red-500">*</span></label>
        <div className="flex gap-2">
          <select value={title} onChange={(e) => onTitleChange(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-blue-400 w-24">
            {["Mr.", "Mrs.", "Ms.", "Dr.", "Prof."].map(t => <option key={t}>{t}</option>)}
          </select>
          <input type="text" value={fullName} onChange={(e) => onFullNameChange(e.target.value)}
            placeholder="Your full name" className={`${input} flex-1`} />
        </div>
      </div>

      {/* Email */}
      <EmailChangeSection email={email} show={showEmailChange} onShow={onShowEmailChange}
        newEmail={newEmail} onNewEmailChange={onNewEmailChange}
        otpSent={emailOtpSent} onSendOtp={onSendEmailOtp}
        otp={emailOtp} onOtpChange={onEmailOtpChange}
        onVerify={onVerifyEmailOtp} loading={emailLoading} />

      {/* Mobile */}
      <div className="mb-2">
        <label className="block text-sm text-gray-600 mb-1.5">Mobile Number <span className="text-red-500">*</span></label>
        <div className="flex gap-2">
          <select className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none w-24"><option>🇮🇳 +91</option></select>
          <input type="tel" value={mobile} onChange={(e) => onMobileChange(e.target.value.replace(/\D/g, "").slice(0, 10))}
            placeholder="Mobile number" maxLength={10}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 bg-white" />
        </div>
      </div>

      <label className="flex items-center gap-2 mb-4 mt-2 cursor-pointer">
        <input type="checkbox" checked={whatsapp} onChange={(e) => onWhatsappChange(e.target.checked)} className="w-4 h-4 rounded accent-blue-600" />
        <span className="text-sm text-gray-600">WhatsApp number is same as mobile</span>
      </label>
      {!whatsapp && (
        <div className="mb-4">
          <label className="block text-sm text-gray-600 mb-1.5">WhatsApp Number</label>
          <div className="flex gap-2">
            <select className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none w-24"><option>🇮🇳 +91</option></select>
            <input type="tel" value={whatsappNumber} onChange={(e) => onWhatsappNumberChange(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="WhatsApp number" maxLength={10}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 bg-white" />
          </div>
        </div>
      )}

      {/* DOB + Gender */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1.5">Date of Birth <span className="text-red-500">*</span></label>
          <input type="date" value={dob} onChange={(e) => onDobChange(e.target.value)} className={input} />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1.5">Gender <span className="text-red-500">*</span></label>
          <select value={gender} onChange={(e) => onGenderChange(e.target.value)} className={input}>
            <option value="">Select</option><option>Male</option><option>Female</option><option>Other</option>
          </select>
        </div>
      </div>

      {/* Status */}
      <div className="mb-3">
        <label className="block text-sm text-gray-600 mb-1.5">Current Status <span className="text-red-500">*</span></label>
        <select value={status} onChange={(e) => { onStatusChange(e.target.value); onFollowUpChange(""); }} className={input}>
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
          onChange={onFollowUpChange}
          onAddNew={(v) => { onFollowUpChange(v); onNewOrgEntry({ name: v, type: selectedStatus.type! }); }}
          indented />
      )}
      {selectedStatus?.value === "other" && (
        <div className="mb-4 ml-4 border-l-2 border-blue-100 pl-4">
          <label className="block text-sm text-gray-500 mb-1.5">{selectedStatus.followUpLabel}</label>
          <input type="text" value={followUp} onChange={(e) => onFollowUpChange(e.target.value)}
            placeholder="Please specify" className={input} />
        </div>
      )}

      {/* Academy — from DB */}
      <TypeaheadInput
        label="Academy"
        placeholder="Search academy name..."
        data={academyData}
        value={academy}
        onChange={onAcademyChange}
        onAddNew={(v) => { onAcademyChange(v); onNewOrgEntry({ name: v, type: "academy" }); }}
        optional />
    </div>
  );
}
