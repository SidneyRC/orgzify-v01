"use client";
// OREV1-015C — Profile Form Bottom
// City · Pincode · Anniversary · Spouse Invite · Interests · About · Referred By · Save

import InterestTagSelector from "@/components/shared/OREV1-024-InterestTagSelector";
import SpouseInviteSection from "@/components/shared/OREV1-015A-SpouseInviteSection";

interface Props {
  city: string; onCityChange: (v: string) => void;
  countryId: string; onCountryIdChange: (v: string) => void; countries: { id: string; name: string }[];
  pincode: string; onPincodeChange: (v: string) => void;
  anniversary: string; onAnniversaryChange: (v: string) => void;
  showSpouseInvite: boolean; onShowSpouseInvite: (v: boolean) => void;
  spouseName: string; onSpouseNameChange: (v: string) => void;
  spouseEmail: string; onSpouseEmailChange: (v: string) => void;
  onSpouseSend: () => void; onSpouseSkip: () => void; spouseLoading: boolean;
  interests: string[]; onInterestsChange: (v: string[]) => void;
  about: string; onAboutChange: (v: string) => void;
  referredBy: string;
  onSubmit: () => void; loading: boolean;
}

export default function ProfileFormBottom({
  city, onCityChange, countryId, onCountryIdChange, countries, pincode, onPincodeChange,
  anniversary, onAnniversaryChange, showSpouseInvite, onShowSpouseInvite,
  spouseName, onSpouseNameChange, spouseEmail, onSpouseEmailChange,
  onSpouseSend, onSpouseSkip, spouseLoading,
  interests, onInterestsChange, about, onAboutChange,
  referredBy, onSubmit, loading,
}: Props) {
  const input = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 bg-white";

  return (
    <div className="px-4">
      <div className="border-t border-gray-100 my-5" />

           {/* City + Pincode */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1.5">City <span className="text-red-500">*</span></label>
          <input type="text" value={city} onChange={(e) => onCityChange(e.target.value)} placeholder="e.g. Chennai" className={input} />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1.5">Pincode <span className="text-xs text-gray-400">opt.</span></label>
          <input type="text" value={pincode} onChange={(e) => onPincodeChange(e.target.value)} placeholder="600001" className={input} />
        </div>
      </div>

      {/* Country */}
      <div className="mb-4">
        <label className="block text-sm text-gray-600 mb-1.5">Country <span className="text-red-500">*</span></label>
        <select value={countryId} onChange={(e) => onCountryIdChange(e.target.value)} className={input}>
          <option value="">Select country</option>
          {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Anniversary */}
      <div className="mb-2">
        <label className="block text-sm text-gray-600 mb-1.5">Anniversary Date <span className="text-xs text-gray-400">optional</span></label>
        <input type="date" value={anniversary}
          onChange={(e) => { onAnniversaryChange(e.target.value); }}
          className={input} />
      </div>

      {/* Inline spouse invite */}
      <SpouseInviteSection
        show={showSpouseInvite}
        spouseName={spouseName} spouseEmail={spouseEmail}
        onSpouseNameChange={onSpouseNameChange}
        onSpouseEmailChange={onSpouseEmailChange}
        onSend={onSpouseSend} onSkip={onSpouseSkip}
        loading={spouseLoading}
      />

      <div className="mt-4">
        <InterestTagSelector selected={interests} onChange={onInterestsChange} />
      </div>

      {/* About */}
      <div className="mb-4">
        <label className="block text-sm text-gray-600 mb-1.5">About <span className="text-xs text-gray-400">optional</span></label>
        <textarea value={about} onChange={(e) => onAboutChange(e.target.value)}
          placeholder="Tell us a little about yourself..." rows={3}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 bg-white resize-none" />
      </div>

      <div className="border-t border-gray-100 my-5" />

      {/* Referred By */}
      <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 mb-5">
        <p className="text-[10px] text-gray-400 mb-0.5">Referred by</p>
        <p className="text-sm text-gray-400">{referredBy || "—"}</p>
      </div>

      {/* Save */}
      <button onClick={onSubmit} disabled={loading}
        className="w-full bg-[#1D3A8A] text-white rounded-xl py-3.5 text-sm font-medium
                   hover:bg-blue-800 transition-colors disabled:opacity-60 mb-6">
        {loading ? "Saving..." : "Save & Continue"}
      </button>
    </div>
  );
}
