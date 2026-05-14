"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

const OTP_EXPIRY = 180, RESEND_COOLDOWN = 60, MAX_RESEND = 3, MAX_WRONG = 5, LOCK_DURATION = 900;
const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

interface Props { email: string; onNext: () => void; onBack: () => void }

export default function RegisterStep2({ email, onNext, onBack }: Props) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [resendCount, setResendCount] = useState(0);
  const [otpExpiry, setOtpExpiry] = useState(OTP_EXPIRY);
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN);
  const [lockTimer, setLockTimer] = useState(0);
  const [lockReason, setLockReason] = useState<"wrong" | "resend" | null>(null);
  const [otpError, setOtpError] = useState("");
  const [loading, setLoading] = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => { if (otpExpiry <= 0) return; const t = setInterval(() => setOtpExpiry(v => Math.max(0, v - 1)), 1000); return () => clearInterval(t); }, [otpExpiry]);
  useEffect(() => { if (resendCooldown <= 0) return; const t = setInterval(() => setResendCooldown(v => Math.max(0, v - 1)), 1000); return () => clearInterval(t); }, [resendCooldown]);
  useEffect(() => {
    if (lockTimer <= 0) return;
    const t = setInterval(() => setLockTimer(v => { if (v <= 1) { setLockReason(null); return 0; } return v - 1; }), 1000);
    return () => clearInterval(t);
  }, [lockTimer]);

  const startLock = useCallback((reason: "wrong" | "resend") => { setLockReason(reason); setLockTimer(LOCK_DURATION); setOtpError(""); }, []);

  const handleVerifyOtp = async (otpValue = otp) => {
    if (lockReason) return;
    if (otpExpiry === 0) { setOtpError("OTP has expired. Please resend."); return; }
    if (otpValue.some(d => !d)) { setOtpError("Please enter the complete 6-digit OTP."); return; }
    setOtpError(""); setLoading(true);
    // TODO: Call API to verify OTP
    await new Promise(r => setTimeout(r, 1000));
    const isValid = true; // TODO: replace with real API response
    setLoading(false);
    if (!isValid) {
      const newCount = wrongAttempts + 1; setWrongAttempts(newCount);
      setOtp(["", "", "", "", "", ""]); refs.current[0]?.focus();
      if (newCount >= MAX_WRONG) startLock("wrong");
      else { toast.error("Incorrect OTP."); setOtpError(`Incorrect OTP. ${MAX_WRONG - newCount} attempt(s) remaining.`); }
      return;
    }
    toast.success("Email verified successfully!");
    onNext(); // ✅ Advance to Step 3
  };

  const handleOtpChange = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp]; next[i] = val; setOtp(next);
    if (val && i < 5) refs.current[i + 1]?.focus();
    if (i === 5 && val && next.every(d => d)) handleVerifyOtp(next);
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || lockReason) return;
    const newCount = resendCount + 1;
    if (newCount > MAX_RESEND) { startLock("resend"); return; }
    setResendCount(newCount); setOtp(["", "", "", "", "", ""]); setWrongAttempts(0); setLoading(true);
    // TODO: Call API to resend OTP via Resend.com
    await new Promise(r => setTimeout(r, 1000));
    setLoading(false); setOtpExpiry(OTP_EXPIRY); setResendCooldown(RESEND_COOLDOWN); setOtpError("");
    refs.current[0]?.focus();
    if (newCount === MAX_RESEND) startLock("resend");
  };

  if (lockReason) return (
    <div className="text-center space-y-5 py-4">
      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <h2 className="text-lg font-bold text-blue-900">{lockReason === "wrong" ? "Too many incorrect attempts" : "Too many resend attempts"}</h2>
      <p className="text-gray-500 text-sm">Please try again in</p>
      <p className="text-3xl font-bold text-blue-900">{fmt(lockTimer)}</p>
      {lockTimer === 0 && (
        <button onClick={() => { onBack(); setWrongAttempts(0); setOtpExpiry(0); setResendCooldown(0); }}
          className="w-full bg-blue-900 text-white rounded-xl py-3.5 text-sm font-semibold hover:bg-blue-800">Try Again</button>
      )}
      <Link href="/login" className="block w-full border border-blue-900 text-blue-900 rounded-xl py-3.5 text-sm font-semibold hover:bg-blue-50 text-center">Sign In</Link>
    </div>
  );

  return (
    <>
      <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-6">
        <svg className="w-7 h-7 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-blue-900 mb-1">Verify your email</h1>
      <p className="text-gray-500 text-sm mb-4">Step 2 of 3 — Email verification</p>
      <div className="mb-4 px-4 py-3 bg-yellow-50 border border-yellow-100 rounded-xl text-sm text-yellow-800">
        <p className="font-semibold mb-0.5">OTP sent to {email}</p>
        <p>Can't find it? Check your <span className="font-bold">Spam or Junk</span> folder and mark as <span className="font-bold">"Not Spam"</span>.</p>
      </div>
      <p className={`text-xs mb-4 font-medium ${otpExpiry <= 30 ? "text-red-500" : "text-gray-400"}`}>
        {otpExpiry > 0 ? `OTP expires in ${fmt(otpExpiry)}` : "OTP has expired. Please resend."}
      </p>
      {otpError && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">{otpError}</div>}
      {resendCount === 2 && <div className="mb-4 px-4 py-3 bg-orange-50 border border-orange-100 rounded-xl text-sm text-orange-700">⚠️ Still not received? Check spam. 1 resend remaining.</div>}
      <p className="text-sm font-medium text-gray-700 mb-3">Enter 6-digit OTP</p>
      <div className="flex gap-2 justify-between mb-5">
        {otp.map((digit, i) => (
          <input key={i} ref={el => { refs.current[i] = el; }} type="text" inputMode="numeric" maxLength={1} value={digit}
            onChange={e => handleOtpChange(i, e.target.value)}
            onKeyDown={e => { if (e.key === "Backspace" && !otp[i] && i > 0) refs.current[i - 1]?.focus(); }}
            onPaste={e => { e.preventDefault(); const p = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6); if (!p) return; const n = ["","","","","",""]; p.split("").forEach((c, j) => { n[j] = c; }); setOtp(n); refs.current[Math.min(p.length, 5)]?.focus(); if (p.length === 6) handleVerifyOtp(n); }}
            className="w-12 h-12 text-center text-lg font-bold border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-900 focus:ring-2 focus:ring-blue-900/20 transition-colors" />
        ))}
      </div>
      <button onClick={() => handleVerifyOtp()} disabled={loading || otpExpiry === 0}
        className="w-full bg-blue-900 text-white rounded-xl py-3.5 text-sm font-semibold hover:bg-blue-800 transition-colors disabled:opacity-50 mb-4">
        {loading ? "Verifying..." : "Verify OTP"}
      </button>
      <div className="flex items-center justify-between text-sm">
        <button onClick={onBack} className="text-gray-500 hover:text-gray-700">← Change email</button>
        <div className="flex items-center gap-2">
          {resendCount > 0 && <span className="text-xs text-gray-400">{resendCount}/{MAX_RESEND}</span>}
          {resendCooldown > 0
            ? <span className="text-gray-400 text-xs">Resend in {fmt(resendCooldown)}</span>
            : <button onClick={handleResend} disabled={loading} className="text-blue-900 font-medium hover:underline disabled:opacity-50">Resend OTP</button>
          }
        </div>
      </div>
      <p className="text-center text-sm text-gray-500 mt-4">Already have an account?{" "}
        <Link href="/login" className="text-blue-900 font-semibold hover:underline">Sign In</Link>
      </p>
    </>
  );
}
