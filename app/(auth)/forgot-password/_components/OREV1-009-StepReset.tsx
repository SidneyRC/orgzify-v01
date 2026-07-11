"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

function validatePassword(pw: string): string[] {
  const e: string[] = [];
  if (pw.length < 8) e.push("At least 8 characters");
  if (!/[A-Z]/.test(pw)) e.push("One uppercase letter");
  if (!/[a-z]/.test(pw)) e.push("One lowercase letter");
  if (!/[^A-Za-z0-9]/.test(pw)) e.push("One special character");
  return e;
}

function strengthScore(pw: string) {
  if (!pw) return 0;
  return [pw.length >= 8, /[A-Z]/.test(pw), /[a-z]/.test(pw), /[^A-Za-z0-9]/.test(pw)].filter(Boolean).length;
}

const EyeIcon = ({ show }: { show: boolean }) => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    {show
      ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
      : <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
    }
  </svg>
);

interface Props {
  email: string;
}

export default function StepReset({ email }: Props) {
  const router = useRouter();
  const [password, setPassword]         = useState("");
  const [confirm, setConfirm]           = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [confirmError, setConfirmError] = useState("");
  const [loading, setLoading]           = useState(false);

  const strength = strengthScore(password);
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];
  const strengthColor = ["", "bg-red-400", "bg-yellow-400", "bg-blue-400", "bg-green-500"][strength];
  const strengthTextColor = ["", "text-red-500", "text-yellow-600", "text-blue-600", "text-green-600"][strength];

  const handleSubmit = async () => {
    const pwErrors = validatePassword(password);
    const confErr = password !== confirm ? "Passwords do not match." : "";
    setPasswordErrors(pwErrors); setConfirmError(confErr);
    if (pwErrors.length > 0 || confErr) return;
    setLoading(true);

    const res = await fetch("/forgot-password/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setLoading(false);

    if (!data.success) {
      toast.error(data.error || "Failed to update password. Please try again.");
      return;
    }

    toast.success("Password updated successfully!");
    router.push("/login");
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-blue-900">Set New Password</h1>
        <p className="text-sm text-gray-500 mt-1">Choose a strong password for your account.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={e => setPassword(e.target.value)}
            onBlur={() => { if (password) setPasswordErrors(validatePassword(password)); }}
            placeholder="Min. 8 characters"
            className={`w-full border rounded-xl px-4 py-3 pr-11 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 transition-colors ${passwordErrors.length > 0 ? "border-red-400" : "border-gray-200"}`}
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <EyeIcon show={showPassword} />
          </button>
        </div>
        {password && (
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 flex gap-1">{[1,2,3,4].map(i => <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= strength ? strengthColor : "bg-gray-200"}`} />)}</div>
            <span className={`text-xs font-medium ${strengthTextColor}`}>{strengthLabel}</span>
          </div>
        )}
        {passwordErrors.length > 0 && (
          <ul className="mt-2 space-y-1">
            {passwordErrors.map(err => (
              <li key={err} className="flex items-center gap-1.5 text-xs text-red-500">
                <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                {err}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
        <div className="relative">
          <input
            type={showConfirm ? "text" : "password"}
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            onBlur={() => { if (confirm) setConfirmError(password !== confirm ? "Passwords do not match." : ""); }}
            placeholder="Re-enter your password"
            className={`w-full border rounded-xl px-4 py-3 pr-11 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 transition-colors ${confirmError ? "border-red-400" : "border-gray-200"}`}
          />
          <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <EyeIcon show={showConfirm} />
          </button>
        </div>
        {confirmError && <p className="mt-2 text-xs text-red-500">{confirmError}</p>}
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-3.5 rounded-xl bg-blue-900 text-white font-semibold text-sm hover:bg-blue-800 transition-all disabled:opacity-50">
        {loading ? "Updating..." : "Update Password"}
      </button>

      <button onClick={() => router.push("/login")} className="w-full py-3.5 rounded-xl border-2 border-blue-900 text-blue-900 font-semibold text-sm text-center hover:bg-blue-50 transition-colors">
      Back to Sign In
      </button>
    </div>
  );
}
