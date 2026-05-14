"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import OtpBoxes from "@/components/auth/OtpBoxes";
import LockScreen from "@/components/auth/LockScreen";

const OTP_EXPIRY = 180;
const RESEND_CD  = 15;
const MAX_RESEND = 3;
const MAX_WRONG  = 5;
const LOCK_MINS  = 1;

interface Props {
  email?: string;
  onVerified: () => void;
  onBack: () => void;
}

export default function StepOtp({ email, onVerified, onBack }: Props) {
  const [otp, setOtp]                         = useState("");
  const [error, setError]                     = useState("");
  const [loading, setLoading]                 = useState(false);
  const [wrongAttempts, setWrong]             = useState(0);
  const [resendCount, setResendCount]         = useState(1);
  const [isLocked, setIsLocked]               = useState(false);
  const [lockUntil, setLockUntil]             = useState<Date | null>(null);
  const [expired, setExpired]                 = useState(false);
  const [otpTimer, setOtpTimer]               = useState(OTP_EXPIRY);
  const [resendTimer, setResendTimer]         = useState(RESEND_CD);
  const [resendLocked, setResendLocked]       = useState(false);
  const [resendLockTimer, setResendLockTimer] = useState(0);

  // OTP expiry countdown
  useEffect(() => {
    if (expired || isLocked) return;
    if (otpTimer <= 0) { setExpired(true); setError("OTP expired. Please request a new one."); return; }
    const t = setTimeout(() => setOtpTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [otpTimer, expired, isLocked]);

  // Resend cooldown countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  // Resend lock countdown (15 min) — resets on complete
  useEffect(() => {
    if (!resendLocked) return;
    if (resendLockTimer <= 0) {
      setResendLocked(false);
      setResendCount(1);
      setResendTimer(0);
      onBack();
      return;
    }
    const t = setTimeout(() => setResendLockTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendLockTimer, resendLocked]);

  const fmtTimer = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const masked = (email ?? "").replace(/(.{2})(.+)(@.+)/, (_, a, b, c) =>
    a + "*".repeat(Math.min(b.length, 5)) + c
  );

  const cooldownActive = resendTimer > 0;

  async function handleVerify() {
    if (otp.length !== 6) { setError("Please enter the full 6-digit code."); return; }
    if (expired) { setError("OTP expired. Please request a new one."); return; }
    setLoading(true); setError("");
    try {
      // DB Connection Pending — replace with POST /api/auth/verify-otp
      await new Promise((r) => setTimeout(r, 800));
      throw new Error("DB_PENDING");
    } catch {
      const next = wrongAttempts + 1;
      setWrong(next);
      if (next >= MAX_WRONG) {
        setIsLocked(true);
        setLockUntil(new Date(Date.now() + LOCK_MINS * 60000));
      } else {
        setError("Incorrect OTP. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setLoading(true);
    try {
      // DB Connection Pending — replace with POST /api/auth/resend-otp
      await new Promise((r) => setTimeout(r, 600));
      if (resendCount >= MAX_RESEND - 1) {
        setResendLocked(true);
        setResendLockTimer(LOCK_MINS * 60);
      } else {
        setResendCount((c) => c + 1);
        setResendTimer(RESEND_CD);
        setOtp(""); setWrong(0); setExpired(false);
        setOtpTimer(OTP_EXPIRY); setError("");
      }
    } catch {
      setError("Failed to resend. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function simulateWrongOtp() {
    const next = wrongAttempts + 1;
    setWrong(next);
    if (next >= MAX_WRONG) {
      setIsLocked(true);
      setLockUntil(new Date(Date.now() + LOCK_MINS * 60000));
    } else {
      setError("Incorrect OTP. Please try again.");
    }
  }

  // Wrong OTP lock — full screen
  if (isLocked && lockUntil) {
    return (
      <LockScreen
        lockDuration={LOCK_MINS * 60}
        message="Too many incorrect OTP attempts. Please wait before trying again."
        onUnlocked={() => {
          setIsLocked(false); setLockUntil(null);
          setWrong(0); setOtp(""); setError("");
          onBack();
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">

      {/* ── Section 1 — Production (NEVER TOUCH) ── */}

      {/* 1. Logo */}
      <div className="flex justify-center">
        <Link href="/">
          <div className="h-10 w-32 relative cursor-pointer">
            <Image
              src="/images/logo.png"
              alt="Orgzify Logo"
              fill
              className="object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </div>
        </Link>
      </div>

      {/* 2. OTP Boxes */}
      <div className="flex justify-center">
        <OtpBoxes length={6} value={otp} onChange={(v) => { setOtp(v); setError(""); }} disabled={loading || expired} />
      </div>

      {/* 3. Check your email + masked email */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900">Check your email</h2>
        {masked && (
          <p className="text-sm text-gray-500 mt-1">
            We sent a 6-digit code to <span className="font-medium text-gray-700">{masked}</span>
          </p>
        )}
      </div>

      {/* 4. Spam warning */}
      <div className="rounded-xl border border-yellow-300 bg-yellow-50 px-4 py-3 text-center text-xs text-yellow-800">
        Can&apos;t find the email? Check your <span className="font-semibold">Spam / Junk</span> folder and mark it as Not Spam.
      </div>

      {/* 5. Resend lock block — inline, shown when max resends reached */}
      {resendLocked && (
        <div className="flex flex-col items-center gap-3 py-4 px-4 rounded-xl border border-blue-100 bg-blue-50 text-center">
          <div className="w-14 h-14 rounded-full bg-white border-2 border-blue-800 flex items-center justify-center">
            <svg className="w-7 h-7 text-blue-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-blue-800 text-sm">Max Attempts Reached</p>
            <p className="text-xs text-gray-500 mt-1">Please wait before requesting a new code.</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest">Try again in</p>
            <p className="text-3xl font-bold text-blue-800 tabular-nums">{fmtTimer(resendLockTimer)}</p>
          </div>
        </div>
      )}

      {/* 6. OTP Expires in timer */}
      {!expired && (
        <p className={`text-center text-xs ${otpTimer <= 30 ? "text-red-500 font-semibold" : "text-gray-400"}`}>
          OTP Expires in <span className="font-mono font-bold">{fmtTimer(otpTimer)}</span>
        </p>
      )}

      {error && (
        <p className="text-center text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
          {error}
        </p>
      )}

      {/* 7. Verify Code button */}
      <button
        onClick={handleVerify}
        disabled={loading || otp.length !== 6 || expired}
        className="w-full py-3.5 rounded-xl bg-blue-800 text-white font-semibold text-sm hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Verifying..." : "Verify Code"}
      </button>

      {/* 8. Sign In button */}
      <a
        href="/login"
        className="w-full py-3.5 rounded-xl border-2 border-blue-800 text-blue-800 font-semibold text-sm text-center hover:bg-blue-50 transition-colors"
      >
        Sign In
      </a>

      {/* 9. Back + Resend row — hidden when resend locked */}
      {!resendLocked && (
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            Back
          </button>
          {cooldownActive ? (
            <span className="text-xs text-gray-400">
              Attempt {resendCount}/{MAX_RESEND} &nbsp;·&nbsp; Resend in {resendTimer}s
            </span>
          ) : (
            <div className="flex items-center gap-1 text-xs">
              <span className="text-gray-400">Attempt {resendCount}/{MAX_RESEND} &nbsp;·&nbsp;</span>
              <button onClick={handleResend} disabled={loading} className="text-blue-800 font-semibold hover:underline disabled:opacity-50">
                Resend OTP
              </button>
            </div>
          )}
        </div>
      )}

      {/* 10. Wrong attempts — only after first wrong attempt, not shown when resend locked */}
      {!resendLocked && wrongAttempts > 0 && wrongAttempts < MAX_WRONG && (
        <p className="text-right text-xs text-amber-600">
          Wrong Attempt {wrongAttempts}/{MAX_WRONG} — Account locks at {MAX_WRONG}th incorrect attempt
        </p>
      )}

      {/* ── Section 2 — Simulation (DELETE ENTIRELY WHEN DB CONNECTED) ── */}
      <div className="border-t-2 border-dashed border-gray-300 pt-5 flex flex-col gap-2">
        <p className="text-center text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
          Simulation — For Testing Only. Remove in Production.
        </p>
        <button
          onClick={() => { setError(""); onVerified(); }}
          className="w-full py-3 rounded-xl bg-green-600 text-white font-semibold text-sm hover:bg-green-700 transition-colors"
        >
          Simulate Success — OTP Verified
        </button>
        <button
          onClick={simulateWrongOtp}
          className="w-full py-3 rounded-xl bg-orange-500 text-white font-semibold text-sm hover:bg-orange-600 transition-colors"
        >
          Simulate Wrong OTP (attempt {wrongAttempts + 1}/{MAX_WRONG})
        </button>
        <button
          onClick={() => setError("Incorrect OTP. Please try again.")}
          className="w-full py-3 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition-colors"
        >
          Simulate Failure — Incorrect OTP
        </button>
        <p className="text-center text-xs text-gray-400 italic">DB Connection Pending — remove when connected</p>
      </div>

      {/* 11. Footer */}
      <p className="text-center text-xs text-gray-400 pt-2">
        Powered by ORGZIFY © 2026 All rights reserved.
      </p>

    </div>
  );
}
