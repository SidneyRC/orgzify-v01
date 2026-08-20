"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

type LoginMethod = "password" | "otp";

function ResendTimer({ onResend }: { onResend: () => void }) {
  const [seconds, setSeconds] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (seconds <= 0) { setCanResend(true); return; }
    const t = setTimeout(() => setSeconds(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const handleResend = () => {
    setSeconds(60);
    setCanResend(false);
    onResend();
  };

  return canResend ? (
    <button type="button" onClick={handleResend} className="text-xs text-blue-900 hover:underline font-medium">
      Resend OTP
    </button>
  ) : (
    <p className="text-xs text-gray-400">Resend OTP in <span className="font-semibold text-gray-600">{seconds}s</span></p>
  );
}

export default function LoginPage() {
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("password");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpSent, setOtpSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0)
      inputRefs.current[index - 1]?.focus();
  };

  const submitOtp = async (otpCode: string) => {
    if (!identifier) { setError("Please enter your email."); return; }
    setError(""); setLoading(true);
    const res = await fetch('/otp/login-otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: identifier, otp: otpCode }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || 'Invalid OTP. Please try again.'); return; }
    const next = new URLSearchParams(window.location.search).get('next');
    window.location.href = next ? decodeURIComponent(next) : (data.is_complete ? '/' : '/profile/edit');
  };

  const handleOtpPaste = async (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length !== 6) return;
    const newOtp = pasted.split('');
    setOtp(newOtp);
    inputRefs.current[5]?.focus();
    await submitOtp(pasted);
  };

  const handleSendOtp = async () => {
    if (!identifier) { setError("Please enter your email."); return; }
    setError(""); setLoading(true);
    const res = await fetch('/otp/login-otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: identifier }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || 'Failed to send OTP. Please try again.'); return; }
    setOtp(["", "", "", "", "", ""]);
    setOtpSent(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    if (loginMethod === 'password') {
      const res = await fetch('/login/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      setLoading(false);
      if (!res.ok) { setError(data.error || 'Something went wrong. Please try again.'); return; }
      const next = new URLSearchParams(window.location.search).get('next');
      window.location.href = next ? decodeURIComponent(next) : (data.is_complete ? '/' : '/profile/edit');
    } else {
      await submitOtp(otp.join(''));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="mb-7">
              <h1 className="text-2xl font-bold text-blue-900">Welcome</h1>
              <p className="text-gray-500 text-sm mt-1">Sign in to your Orgzify account</p>
            </div>

            {/* Social Login */}
            <div className="flex flex-col gap-3 mb-6">
              <button type="button" onClick={() => window.location.href = '/google/api'} className="flex items-center justify-center gap-3 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
              <button type="button" className="flex items-center justify-center gap-3 bg-[#1877F2] rounded-xl px-4 py-3 text-sm font-medium text-white hover:bg-[#166fe5] transition-colors">
                <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Continue with Facebook
              </button>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-medium">OR</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
              <button type="button" onClick={() => { setLoginMethod("password"); setError(""); setOtpSent(false); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${loginMethod === "password" ? "bg-white text-blue-900 shadow-sm" : "text-gray-500"}`}>
                Password
              </button>
              <button type="button" onClick={() => { setLoginMethod("otp"); setError(""); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${loginMethod === "otp" ? "bg-white text-blue-900 shadow-sm" : "text-gray-500"}`}>
                OTP
              </button>
            </div>

            {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Enter your email" required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 transition-colors" />
              </div>

              {loginMethod === "password" && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-medium text-gray-700">Password</label>
                    <Link href="/forgot-password" className="text-xs text-blue-900 hover:underline font-medium">Forgot password?</Link>
                  </div>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password" required
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-11 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 transition-colors" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {showPassword
                          ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          : <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>}
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {loginMethod === "otp" && (
                <>
                  {!otpSent ? (
                    <button type="button" onClick={handleSendOtp} disabled={loading}
                      className="w-full border-2 border-blue-900 text-blue-900 rounded-xl py-3 text-sm font-semibold hover:bg-blue-900 hover:text-white transition-colors disabled:opacity-50">
                      {loading ? "Sending OTP..." : "Send OTP"}
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <p className="text-sm font-semibold text-amber-800">OTP sent to {identifier}</p>
                        <p className="text-xs text-amber-700 mt-1">Can&apos;t find it? Check your <span className="font-semibold">Spam / Junk</span> folder.</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">Enter 6-digit OTP</label>
                        <div className="flex gap-2 justify-between">
                          {otp.map((digit, i) => (
                            <input key={i}
                              ref={el => { inputRefs.current[i] = el; }}
                              type="text" inputMode="numeric" maxLength={1} value={digit}
                              onChange={(e) => handleOtpChange(i, e.target.value)}
                              onKeyDown={(e) => handleOtpKeyDown(i, e)}
                              onPaste={handleOtpPaste}
                              className="w-12 h-12 text-center text-lg font-bold border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-900 focus:ring-2 focus:ring-blue-900/20 transition-colors" />
                          ))}
                        </div>
                        <div className="mt-3">
                          <ResendTimer onResend={handleSendOtp} />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {(loginMethod === "password" || otpSent) && (
                <button type="submit" disabled={loading}
                  className="w-full bg-blue-900 text-white rounded-xl py-3.5 text-sm font-semibold hover:bg-blue-800 transition-colors disabled:opacity-50 mt-2">
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              )}
            </form>

            <p className="text-center text-xs text-gray-400 mt-4">
              By signing in, you agree to our{" "}
              <Link href="/terms" className="hover:underline">Terms</Link>{" "}&{" "}
              <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
            </p>
            <p className="text-center text-sm text-gray-500 mt-4">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-blue-900 font-semibold hover:underline">Register</Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
