"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  onNext: (email: string) => void;
}

export default function StepRequest({ onNext }: Props) {
  const router = useRouter();
  const [email, setEmail]     = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) return setError("Please enter your email address.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Please enter a valid email address.");
    setLoading(true); setError("");

    const res = await fetch("/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.toLowerCase().trim(), name: "User", purpose: "password-reset" }),
    });

    const data = await res.json();
    setLoading(false);

    if (!data.success) {
      setError(data.error || "Unable to send OTP. Please try again.");
      return;
    }

    onNext(email.toLowerCase().trim());
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold text-blue-900">Forgot Password</h1>
        <p className="text-sm text-gray-500 mt-1">Enter your email to receive a reset code.</p>
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1.5">Email Address</label>
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(""); }}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="you@example.com"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 transition-colors"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-3.5 rounded-xl bg-blue-900 text-white font-semibold text-sm hover:bg-blue-800 transition-all disabled:opacity-50">
        {loading ? "Sending OTP..." : "Send OTP"}
      </button>

      <button onClick={() => router.push("/login")} className="w-full py-3.5 rounded-xl border-2 border-blue-900 text-blue-900 font-semibold text-sm text-center hover:bg-blue-50 transition-colors">
      Back to Sign In
      </button>
    </div>
  );
}
