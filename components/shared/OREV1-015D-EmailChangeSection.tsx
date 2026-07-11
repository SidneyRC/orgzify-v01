"use client";
// OREV1-015D — Email Change Section
// Full-width input · Equal buttons · Paste OTP support

interface Props {
  email: string;
  show: boolean; onShow: (v: boolean) => void;
  newEmail: string; onNewEmailChange: (v: string) => void;
  otpSent: boolean; onSendOtp: () => void;
  otp: string; onOtpChange: (v: string) => void;
  onVerify: () => void;
  loading: boolean;
}

export default function EmailChangeSection({
  email, show, onShow, newEmail, onNewEmailChange,
  otpSent, onSendOtp, otp, onOtpChange, onVerify, loading,
}: Props) {

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onOtpChange(pasted.padEnd(6, "").slice(0, 6));
  };

  const handleOtpInput = (index: number, val: string, el: HTMLInputElement) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const arr = (otp || "      ").split("");
    arr[index] = digit;
    onOtpChange(arr.join(""));
    if (digit && el.nextElementSibling) (el.nextElementSibling as HTMLInputElement).focus();
  };

  const btnBase = "flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors";
  const btnPrimary = `${btnBase} bg-[#1D3A8A] text-white hover:bg-blue-800 disabled:opacity-60`;
  const btnSecondary = `${btnBase} border border-gray-200 text-gray-600 hover:bg-gray-50`;

  return (
    <div className="mb-4">
      <label className="block text-sm text-gray-600 mb-1.5">Email Address</label>

      {/* ── Read-only display ── */}
      {!show && (
        <div className="flex items-center gap-3">
          <div className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-500">
            {email || "—"}
          </div>
          <button onClick={() => onShow(true)}
            className="text-xs text-gray-400 hover:text-blue-600 transition-colors flex items-center gap-1">
            ✏️
          </button>
        </div>
      )}

      {/* ── Enter new email ── */}
      {show && !otpSent && (
        <div className="border border-blue-100 rounded-xl p-4 bg-blue-50/30">
          <p className="text-xs text-gray-500 mb-3">Enter your new email address</p>
          <input type="email" value={newEmail} onChange={(e) => onNewEmailChange(e.target.value)}
            placeholder="new@email.com"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm
                       focus:outline-none focus:border-blue-400 bg-white mb-3" />
          <div className="flex gap-3">
            <button onClick={onSendOtp} disabled={loading} className={btnPrimary}>
              {loading ? "Sending..." : "Send OTP"}
            </button>
            <button onClick={() => onShow(false)} className={btnSecondary}>Cancel</button>
          </div>
        </div>
      )}

      {/* ── Enter OTP ── */}
      {show && otpSent && (
        <div className="border border-blue-100 rounded-xl p-4 bg-blue-50/30">
          <p className="text-xs text-gray-500 mb-3">
            Enter the OTP sent to <strong>{newEmail}</strong>
          </p>
          <div className="flex gap-2 justify-center mb-4">
            {[0,1,2,3,4,5].map((i) => (
              <input key={i} type="text" inputMode="numeric" maxLength={1}
                value={otp[i] || ""}
                onPaste={handlePaste}
                onChange={(e) => handleOtpInput(i, e.target.value, e.target as HTMLInputElement)}
                onKeyDown={(e) => {
                  if (e.key === "Backspace" && !otp[i]) {
                    const prev = (e.target as HTMLInputElement).previousElementSibling;
                    if (prev) (prev as HTMLInputElement).focus();
                  }
                }}
                className="w-10 h-12 border border-gray-300 rounded-lg text-center text-lg
                           font-bold text-[#1D3A8A] focus:outline-none focus:border-blue-400 bg-white" />
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={onVerify} disabled={loading} className={btnPrimary}>
              {loading ? "Verifying..." : "Verify & Update"}
            </button>
            <button onClick={() => { onShow(false); }} className={btnSecondary}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
