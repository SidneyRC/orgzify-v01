"use client";
// OREV1-015A — Spouse Invite Section
// Renders inline below Anniversary Date field when date is entered

interface Props {
  show: boolean;
  spouseName: string;
  spouseEmail: string;
  onSpouseNameChange: (v: string) => void;
  onSpouseEmailChange: (v: string) => void;
  onSend: () => void;
  onSkip: () => void;
  loading: boolean;
}

export default function SpouseInviteSection({
  show, spouseName, spouseEmail,
  onSpouseNameChange, onSpouseEmailChange,
  onSend, onSkip, loading,
}: Props) {
  if (!show) return null;

  return (
    <div className="mt-3 ml-4 border-l-2 border-blue-100 pl-4 pb-2">
      <p className="text-sm font-medium text-gray-700 mb-3">Invite Your Spouse 💌</p>
      <p className="text-xs text-gray-400 mb-3">Send them an invite to join Orgzify.</p>

      <div className="mb-3">
        <label className="block text-sm text-gray-600 mb-1.5">
          Spouse Name <span className="text-xs text-gray-400">optional</span>
        </label>
        <input
          type="text"
          value={spouseName}
          onChange={(e) => onSpouseNameChange(e.target.value)}
          placeholder="Spouse full name"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm
                     focus:outline-none focus:border-blue-400 bg-white"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm text-gray-600 mb-1.5">
          Spouse Email <span className="text-xs text-gray-400">optional</span>
        </label>
        <input
          type="email"
          value={spouseEmail}
          onChange={(e) => onSpouseEmailChange(e.target.value)}
          placeholder="spouse@email.com"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm
                     focus:outline-none focus:border-blue-400 bg-white"
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={onSend}
          disabled={loading}
          className="flex-1 bg-[#1D3A8A] text-white rounded-xl py-2.5 text-sm
                     font-medium hover:bg-blue-800 transition-colors disabled:opacity-60"
        >
          {loading ? "Sending..." : "Send Invite"}
        </button>
        <button
          onClick={onSkip}
          className="flex-1 border border-gray-200 text-gray-600 rounded-xl py-2.5
                     text-sm hover:bg-gray-50 transition-colors"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
