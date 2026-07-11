"use client";

import { useState, useEffect, useRef } from "react";
import OtpLockScreen from "@/components/shared/OREV1-030-OtpLockScreen";
import toast from "react-hot-toast";

const OTP_EXPIRY = 180;
const RESEND_COOLDOWN = 60;
const MAX_RESEND = 3;
const MAX_WRONG = 5;
const LOCK_DURATION = 900;

const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

interface Props {
  email: string;
  onVerified: () => void;
  onBack: () => void;
}

export default function StepOtp({ email, onVerified, onBack }: Props) {
  const [otp, setOtp]               = useState(["", "", "", "", "", ""]);
  const [error, setError]           = useState("");
  const [loading, setLoading]       = useState(false);
  const [wrongAttempts, setWrong]   = useState(0);
  const [resendCount, setResendCount] = useState(0);
  const [otpExpiry, setOtpExpiry]   = useState(OTP_EXPIRY);
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN);
  const [lockReason, setLockReason] = useState<"wrong" | "resend" | null>(null);
  const [lockTimer, setLockTimer]   = useState(0);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (otpExpiry <= 0) return;
    const t = setInterval(() => setOtpExpiry(v => Math.max(0, v - 1)), 1000);
    return () => clearInterval(t);
  }, [otpExpiry]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown(v => Math.max(0, v - 1)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  useEffect(() => {
    if (lockTimer <= 0) return;
    const t = setInterval(() => setLockTimer(v => {
      if (v <= 1) { setLockReason(null); return 0; }
      return v - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [lockTimer]);

  const startLock = (reason: "wrong" | "resend") => {
    setLockReason(reason);
    setLockTimer(LOCK_DURATION);
    setError("");
  };

  const handleVerify = async (otpValue = otp) => {
    if (lockReason) return;
    if (otpExpiry === 0) { setError("OTP has expired. Please resend."); return; }
    if (otpValue.some(d => !d)) { setError("Please enter the complete 6-digit OTP."); return; }
    setError(""); setLoading(true);

    const res = await fetch("/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp: otpValue.join(""), purpose: "password-reset" }),
    });
    const data = await res.json();
    setLoading(false);

    if (!data.success) {
      const newCount = wrongAttempts + 1;
      setWrong(newCount);
      setOtp(["", "", "", "", "", ""]);
      refs.current[0]?.focus();
      if (newCount >= MAX_WRONG) { startLock("wrong"); return; }
      setError(`Incorrect OTP. ${MAX_WRONG - newCount} attempt(s) remaining.`);
      return;
    }

    toast.success("Email verified successfully!");
    onVerified();
  };

  const handleOtpChange = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp]; next[i] = val; setOtp(next);
    if (val && i < 5) refs.current[i + 1]?.focus();
    if (i === 5 && val && next.every(d => d)) handleVerify(next);
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || lockReason) return;
    const newCount = resendCount + 1;
    if (newCount > MAX_RESEND) { startLock("resend"); return; }
    setLoading(true);
    await fetch("/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name: "User", purpose: "password-reset" }),
    });
    setLoading(false);
    setResendCount(newCount);
    setOtp(["", "", "", "", "", ""]);
    setWrong(0); setOtpExpiry(OTP_EXPIRY);
    setResendCooldown(RESEND_COOLDOWN); setError("");
    refs.current[0]?.focus();
    if (newCount === MAX_RESEND) startLock("resend");
  };

  if (lockReason) return (
    <OtpLockScreen
      reason={lockReason}
      timer={lockTimer}
      onTryAgain={() => { onBack(); setWrong(0); setOtpExpiry(0); setResendCooldown(0); }}
    />
  );

  const masked = email.replace(/(.{2})(.+)(@.+)/, (_, a, b, c) =>
    a + "*".repeat(Math.min(b.length, 5)) + c
  );

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold text-blue-900">Check your email</h1>
        <p className="text-sm text-gray-500 mt-1">
          We sent a 6-digit code to <span className="font-medium text-gray-700">{masked}</span>
        </p>
      </div>

      <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-xs text-yellow-800">
        Can&apos;t find it? Check your <span className="font-semibold">Spam / Junk</span> folder.
      </div>

      <p className={`text-xs font-medium ${otpExpiry <= 30 ? "text-red-500" : "text-gray-400"}`}>
        {otpExpiry > 0 ? `OTP expires in ${fmt(otpExpiry)}` : "OTP has expired. Please resend."}
      </p>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">{error}</p>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Enter 6-digit OTP</label>
        <div className="flex gap-2 justify-between">
          {otp.map((digit, i) => (
            <input key={i}
              ref={el => { refs.current[i] = el; }}
              type="text" inputMode="numeric" maxLength={1} value={digit}
              onChange={e => handleOtpChange(i, e.target.value)}
              onKeyDown={e => { if (e.key === "Backspace" && !otp[i] && i > 0) refs.current[i - 1]?.focus(); }}
              onPaste={e => {
                e.preventDefault();
                const p = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
                if (p.length !== 6) return;
                const n = p.split("");
                setOtp(n); refs.current[5]?.focus();
                handleVerify(n);
              }}
              className="w-12 h-12 text-center text-lg font-bold border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-900 focus:ring-2 focus:ring-blue-900/20 transition-colors"
            />
          ))}
        </div>
      </div>

      <button
        onClick={() => handleVerify()}
        disabled={loading || otpExpiry === 0}
        className="w-full py-3.5 rounded-xl bg-blue-900 text-white font-semibold text-sm hover:bg-blue-800 transition-all disabled:opacity-50">
        {loading ? "Verifying..." : "Verify OTP"}
      </button>

      <div className="flex items-center justify-between text-sm">
        <button onClick={onBack} className="text-gray-500 hover:text-gray-700 text-xs">← Change email</button>
        <div className="flex items-center gap-2">
          {resendCount > 0 && <span className="text-xs text-gray-400">{resendCount}/{MAX_RESEND}</span>}
          {resendCooldown > 0
            ? <span className="text-xs text-gray-400">Resend in {fmt(resendCooldown)}</span>
            : <button onClick={handleResend} disabled={loading} className="text-blue-900 text-xs font-medium hover:underline disabled:opacity-50">Resend OTP</button>
          }
        </div>
      </div>
    </div>
  );
}
