"use client";
// Profile Edit Page — shell
// Unsaved data protection · Photo upload · Email change · Spouse invite

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import Footer from "@/components/shared/OREV1-011-Footer";
import ProfileCompletionBar from "@/components/shared/OREV1-025-ProfileCompletionBar";
import ProfileFormTop from "@/components/shared/OREV1-015B-ProfileFormTop";
import ProfileFormBottom from "@/components/shared/OREV1-015C-ProfileFormBottom";

const DRAFT_KEY = "orgzify_profile_draft";

export default function ProfileEditPage() {
  const router = useRouter();

  // ── Core state ─────────────────────────────────────────────────────────────
  const [profileId, setProfileId]           = useState("");
  const [zyId, setZyId]                     = useState("");
  const [photo, setPhoto]                   = useState<string | null>(null);
  const [photoFile, setPhotoFile]           = useState<File | null>(null);
  const [fullName, setFullName]             = useState("");
  const [title, setTitle]                   = useState("");
  const [email, setEmail]                   = useState("");
  const [mobile, setMobile]                 = useState("");
  const [whatsapp, setWhatsapp]             = useState(true);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [dob, setDob]                       = useState("");
  const [gender, setGender]                 = useState("");
  const [status, setStatus]                 = useState("");
  const [followUp, setFollowUp]             = useState("");
  const [academy, setAcademy]               = useState("");
  const [newOrgEntry, setNewOrgEntry]       = useState<{ name: string; type: string } | null>(null);
  const [city, setCity]                     = useState("");
  const [countryId, setCountryId]           = useState("");
  const [countries, setCountries]           = useState<{ id: string; name: string }[]>([]);
  const [pincode, setPincode]               = useState("");
  const [anniversary, setAnniversary]       = useState("");
  const [interests, setInterests]           = useState<string[]>([]);
  const [about, setAbout]                   = useState("");
  const [referredBy, setReferredBy]         = useState("");
  const [loading, setLoading]               = useState(false);

  // ── Spouse linked state ────────────────────────────────────────────────────
  const [spouseProfileId, setSpouseProfileId] = useState<string | null>(null);

  // ── Email change state ─────────────────────────────────────────────────────
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [newEmail, setNewEmail]               = useState("");
  const [emailOtpSent, setEmailOtpSent]       = useState(false);
  const [emailOtp, setEmailOtp]               = useState("");
  const [emailLoading, setEmailLoading]       = useState(false);

  // ── Spouse invite state ────────────────────────────────────────────────────
  const [showSpouseInvite, setShowSpouseInvite] = useState(false);
  const [spouseName, setSpouseName]             = useState("");
  const [spouseEmail, setSpouseEmail]           = useState("");
  const [spouseLoading, setSpouseLoading]       = useState(false);

  // ── Unsaved data state ─────────────────────────────────────────────────────
  const [isDirty, setIsDirty]   = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [toast, setToast]       = useState<{ type: "success"|"error"|"info"; msg: string }|null>(null);

  const showToast = useCallback((type: "success"|"error"|"info", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ── Load profile from DB ───────────────────────────────────────────────────
  useEffect(() => {
    router.refresh();
      fetch("/profile/api").then(r => r.json()).then(({ profile, countries: countriesList }) => {
      if (!profile) return;
      setProfileId(profile.id || "");
      setZyId(profile.zy_id || "");
      setEmail(profile.email || "");
      setPhoto(profile.photo_url ? `${profile.photo_url}?v=${Date.now()}` : null);
      setSpouseProfileId(profile.spouse_profile_id || null);
      setCountries(countriesList || []);

      const draft = sessionStorage.getItem(DRAFT_KEY);
      if (draft) {
        const d = JSON.parse(draft);
        setFullName(d.fullName ?? profile.full_name ?? "");
        setTitle(d.title ?? profile.title ?? "");
        setMobile(d.mobile ?? profile.mobile ?? "");
        setWhatsapp(d.whatsapp ?? true);
        setWhatsappNumber(d.whatsappNumber ?? profile.whatsapp_number ?? "");
        setDob(d.dob ?? profile.dob ?? "");
        setGender(d.gender ?? profile.gender ?? "");
        setStatus(d.status ?? profile.current_status ?? "");
        setFollowUp(d.followUp ?? profile.current_status_detail ?? "");
        setAcademy(d.academy ?? "");
        setCity(d.city ?? profile.city ?? "");
        setCountryId(d.countryId ?? profile.country_id ?? "");
        setPincode(d.pincode ?? profile.pincode ?? "");
        setAnniversary(d.anniversary ?? profile.anniversary_date ?? "");
        setInterests(d.interests ?? (profile.area_of_interest ? JSON.parse(profile.area_of_interest) : []));
        setAbout(d.about ?? profile.about ?? "");
        setHasDraft(true);
      } else {
        setFullName(profile.full_name || "");
        setTitle(profile.title || "");
        setMobile(profile.mobile || "");
        setWhatsappNumber(profile.whatsapp_number || "");
        setDob(profile.dob || "");
        setGender(profile.gender || "");
        setStatus(profile.current_status || "");
        setFollowUp(profile.current_status_detail || "");
                setCity(profile.city || "");
        setCountryId(profile.country_id || "");
        setPincode(profile.pincode || "");
        setAnniversary(profile.anniversary_date || "");
        setAbout(profile.about || "");
        setInterests(profile.area_of_interest ? JSON.parse(profile.area_of_interest) : []);
      }
      setReferredBy(profile.referred_by || "");
    }).catch(console.error);
  }, []);

  // ── Save draft to sessionStorage on every change ───────────────────────────
  useEffect(() => {
    if (!isDirty) return;
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({
      title, fullName, mobile, whatsapp, whatsappNumber, dob, gender,
      status, followUp, academy, city, pincode, anniversary, interests, about,
    }));
  }, [title, fullName, mobile, whatsapp, whatsappNumber, dob, gender, status, followUp, academy, city, pincode, anniversary, interests, about, isDirty]);

  // ── Warn on browser refresh/close if dirty ────────────────────────────────
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (isDirty) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  const markDirty    = () => setIsDirty(true);
  const discardDraft = () => { sessionStorage.removeItem(DRAFT_KEY); setHasDraft(false); setIsDirty(false); router.refresh(); };

    const completion = Math.round(
    ([photo, fullName, mobile, dob, gender, status, city, countryId, interests.length > 0 ? "y" : ""].filter(Boolean).length / 9) * 100
  );

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setPhotoFile(file); markDirty();
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  // ── Save profile ───────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!fullName.trim()) return showToast("error", "Full Name is required.");
    if (newOrgEntry) {
      await fetch('/organisations/api', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(newOrgEntry),
      });
    }
    if (!mobile.trim()) return showToast("error", "Mobile Number is required.");
    if (!dob)                   return showToast("error", "Date of Birth is required.");
    if (!gender)                return showToast("error", "Gender is required.");
    if (!status)                return showToast("error", "Current Status is required.");
    const mandatory: Record<string,string> = { school_student:"School Name", college_student:"College Name", working_professional:"Company Name", self_employed:"Company Name" };
    if (mandatory[status] && !followUp.trim()) return showToast("error", `${mandatory[status]} is required.`);
    if (interests.length === 0) return showToast("error", "Please select at least one Area of Interest.");
        if (!city.trim())     return showToast("error", "City is required.");
    if (!countryId)       return showToast("error", "Country is required.");
    setLoading(true);
    try {
      let photoUrl: string | undefined;
      if (photoFile && profileId) {
        const fd = new FormData(); fd.append("photo", photoFile); fd.append("profile_id", profileId);
        const up = await fetch("/profiles/upload", { method: "POST", body: fd });
        const upData = await up.json();
        if (!up.ok) { setLoading(false); showToast("error", upData.error || "Photo upload failed."); return; }
        photoUrl = upData.url;
      }
      const res = await fetch("/profile/api", { method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, full_name: fullName, mobile, whatsapp, whatsapp_number: whatsappNumber,
          dob, gender, current_status: status, current_status_detail: followUp,
                    city, pincode, country_id: countryId, anniversary_date: anniversary, area_of_interest: interests, about,
          ...(photoUrl && { photo_url: photoUrl }) }) });
      const data = await res.json();
      if (!res.ok) { setLoading(false); showToast("error", data.error || "Failed to save profile. Please try again."); return; }
      sessionStorage.removeItem(DRAFT_KEY); setIsDirty(false); setHasDraft(false);
      setLoading(false); showToast("success", "Profile saved successfully!");
      setTimeout(() => window.location.href = "/profiles", 1500);
    } catch { setLoading(false); showToast("error", "Something went wrong. Please try again."); }
  };

  // ── Email change ───────────────────────────────────────────────────────────
  const handleSendEmailOtp = async () => {
    if (!newEmail.trim()) return showToast("error", "Please enter a new email address.");
    setEmailLoading(true);
    const res = await fetch("/profile/email/send-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ new_email: newEmail }) });
    const data = await res.json();
    if (!res.ok) showToast("error", data.error || "Failed to send OTP.");
    else { setEmailOtpSent(true); showToast("success", "OTP sent to your new email."); }
    setEmailLoading(false);
  };

  const handleVerifyEmailOtp = async () => {
    if (!emailOtp.trim()) return showToast("error", "Please enter the OTP.");
    setEmailLoading(true);
    const res = await fetch("/profile/email/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ otp: emailOtp }) });
    const data = await res.json();
    if (!res.ok) showToast("error", data.error || "Invalid or expired OTP.");
    else { setEmail(data.new_email); setShowEmailChange(false); setEmailOtpSent(false); setEmailOtp(""); setNewEmail(""); showToast("success", "Email updated successfully!"); }
    setEmailLoading(false);
  };

  // ── Spouse invite ──────────────────────────────────────────────────────────
  const handleSpouseSend = async () => {
    if (!spouseEmail.trim()) return showToast("error", "Spouse email is required.");

    // Client-side check — block if sender already has a linked spouse
    if (spouseProfileId) {
      return showToast("error", "You already have a spouse linked. Remove existing connection first.");
    }

    setSpouseLoading(true);
    try {
      const res = await fetch("/invite/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toEmail:  spouseEmail.trim(),
          toName:   spouseName.trim() || undefined,
          type:     "spouse",
          metadata: { anniversary_date: anniversary },
        }),
      });
      const data = await res.json();
      if (!res.ok) showToast("error", data.error || "Failed to send invite.");
      else { showToast("success", "Email Sent to Spouse"); setShowSpouseInvite(false); }
    } catch {
      showToast("error", "Failed to send invite. Please try again.");
    }
    setSpouseLoading(false);
  };

  const handleSpouseSkip = () => { showToast("info", "Email not sent to Spouse"); setShowSpouseInvite(false); };

  const wrap = (fn: (v: any) => void) => (v: any) => { fn(v); markDirty(); };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-md text-sm font-medium border ${
          toast.type === "success" ? "bg-green-50 text-green-800 border-green-200"
          : toast.type === "info"  ? "bg-blue-50 text-blue-800 border-blue-200"
          : "bg-red-50 text-red-800 border-red-200"}`}>
          {toast.type === "success" ? "✓ " : toast.type === "info" ? "ℹ " : "✕ "}{toast.msg}
        </div>
      )}
      {hasDraft && (
        <div className="w-full max-w-md mx-auto px-4 pt-3">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 flex items-center justify-between">
            <p className="text-sm text-yellow-800">⚠️ You have unsaved changes from your last session.</p>
            <button onClick={discardDraft} className="text-xs text-yellow-700 underline ml-3 whitespace-nowrap">Discard</button>
          </div>
        </div>
      )}
      <main className="flex-1 w-full max-w-md mx-auto pb-10">
        <ProfileCompletionBar completion={completion} />
        <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <ProfileFormTop
            photo={photo} onPhotoChange={handlePhoto} profileId={profileId} zyId={zyId}
            email={email} showEmailChange={showEmailChange} onShowEmailChange={setShowEmailChange}
            newEmail={newEmail} onNewEmailChange={setNewEmail}
            emailOtpSent={emailOtpSent} onSendEmailOtp={handleSendEmailOtp}
            emailOtp={emailOtp} onEmailOtpChange={setEmailOtp}
            onVerifyEmailOtp={handleVerifyEmailOtp} emailLoading={emailLoading}
            fullName={fullName} onFullNameChange={wrap(setFullName)}
            title={title} onTitleChange={wrap(setTitle)}
            mobile={mobile} onMobileChange={wrap(setMobile)}
            whatsapp={whatsapp} onWhatsappChange={wrap(setWhatsapp)}
            whatsappNumber={whatsappNumber} onWhatsappNumberChange={wrap(setWhatsappNumber)}
            dob={dob} onDobChange={wrap(setDob)} gender={gender} onGenderChange={wrap(setGender)}
            status={status} onStatusChange={wrap(setStatus)} followUp={followUp} onFollowUpChange={wrap(setFollowUp)}
            academy={academy} onAcademyChange={wrap(setAcademy)} showToast={showToast}
            newOrgEntry={newOrgEntry} onNewOrgEntry={setNewOrgEntry} />
                    <ProfileFormBottom
            city={city} onCityChange={wrap(setCity)} pincode={pincode} onPincodeChange={wrap(setPincode)}
            countryId={countryId} onCountryIdChange={wrap(setCountryId)} countries={countries}
            anniversary={anniversary} onAnniversaryChange={wrap(setAnniversary)}
            showSpouseInvite={showSpouseInvite} onShowSpouseInvite={setShowSpouseInvite}
            spouseName={spouseName} onSpouseNameChange={setSpouseName}
            spouseEmail={spouseEmail} onSpouseEmailChange={setSpouseEmail}
            onSpouseSend={handleSpouseSend} onSpouseSkip={handleSpouseSkip} spouseLoading={spouseLoading}
            interests={interests} onInterestsChange={wrap(setInterests)}
            about={about} onAboutChange={wrap(setAbout)} referredBy={referredBy}
            onSubmit={handleSubmit} loading={loading} />
          
          <div className="px-4 pb-4">
            <button onClick={() => router.push("/profiles")}
              className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors py-2 text-center">
              ← Back to Profiles
            </button>
          </div>
          
          <Footer />
        </div>
      </main>
    </div>
  );
}
