"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PasswordInput from "@/components/auth/PasswordInput";
import LogoHeader from "@/components/shared/OREV1-012-LogoHeader";
import Footer from "@/components/shared/OREV1-011-Footer";
import { validatePassword, validateConfirmPassword } from "@/lib/validations";
import toast from "react-hot-toast";

export default function StepReset() {
  const router = useRouter();
  const [password, setPassword]           = useState("");
  const [confirm, setConfirm]             = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError]   = useState<string | null>(null);

  const handleSubmit = () => {
    const pErr = validatePassword(password);
    const cErr = validateConfirmPassword(password, confirm);
    setPasswordError(pErr);
    setConfirmError(cErr);
    if (pErr || cErr) return;

    // DB Connection Pending — replace with POST /api/auth/reset-password
    // Success — password reset
    toast.success("Password updated successfully!");
    setTimeout(() => router.push("/login"), 4000);
  };

const handleSuccess = () => {
  toast.success("Password updated successfully!");
  setTimeout(() => router.push("/login"), 4000);
};

  const handleSimulateFailure = () => {
    // Failure — reset failed
    toast.error("Failed to update password. Try again.");
  };

  return (
    <div className="flex flex-col gap-5">

      {/* ── Section 1 — Production (NEVER TOUCH) ── */}

      <LogoHeader />

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-blue-900">Set New Password</h1>
        <p className="text-sm text-gray-500">Choose a strong password for your account.</p>
      </div>

      <PasswordInput
        label="New Password"
        value={password}
        onChange={setPassword}
        onBlur={() => setPasswordError(validatePassword(password))}
        error={passwordError ?? undefined}
      />

      <PasswordInput
        label="Confirm Password"
        value={confirm}
        onChange={setConfirm}
        onBlur={() => setConfirmError(validateConfirmPassword(password, confirm))}
        error={confirmError ?? undefined}
        placeholder="Re-enter your password"
      />

      <div className="flex flex-col gap-3">
        <button
          onClick={handleSubmit}
          className="w-full py-3.5 rounded-xl bg-blue-800 text-white font-semibold text-sm hover:bg-blue-700 active:scale-[0.98] transition-all"
        >
          Update Password
        </button>

        <a
          href="/login"
          className="w-full py-3.5 rounded-xl border-2 border-blue-800 text-blue-800 font-semibold text-sm text-center hover:bg-blue-50 transition-colors"
        >
          Sign In
        </a>
      </div>

      {/* ── Section 2 — Simulation (DELETE ENTIRELY WHEN DB CONNECTED) ── */}
      <div className="border-t-2 border-dashed border-gray-300 pt-5 flex flex-col gap-2">
        <p className="text-center text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
          Simulation — For Testing Only. Remove in Production.
        </p>
        <button
          onClick={handleSuccess}
          className="w-full py-3 rounded-xl bg-green-600 text-white font-semibold text-sm hover:bg-green-700 transition-colors"
        >
          Simulate Success — Password Reset
        </button>
        <button
          onClick={handleSimulateFailure}
          className="w-full py-3 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition-colors"
        >
          Simulate Failure — Reset Failed
        </button>
        <p className="text-center text-xs text-gray-400 italic">DB Connection Pending — remove when connected</p>
      </div>

      <Footer />

    </div>
  );
}
