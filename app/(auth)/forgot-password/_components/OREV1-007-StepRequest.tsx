"use client";

import { useState } from "react";

interface Props {
  onNext: (value: string, method: "email" | "mobile") => void;
}

export default function StepRequest({ onNext }: Props) {
  const [method, setMethod]   = useState<"email" | "mobile">("email");
  const [value, setValue]     = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!value.trim()) return setError(method === "email" ? "Please enter your email." : "Please enter your mobile number.");
    if (method === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return setError("Please enter a valid email.");
    if (method === "mobile" && !/^\d{10}$/.test(value)) return setError("Please enter a valid 10-digit mobile number.");
    setLoading(true); setError("");
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    onNext(value, method);
  };

  const handleSuccess = () => onNext(value || "test@example.com", method);
  const handleFailure = () => { setLoading(false); setError("Unable to send OTP. Please try again."); };

  return (
    <div className="flex flex-col gap-4">

      <div>
        <h1 className="text-2xl font-bold text-blue-900">Forgot Password</h1>
        <p className="text-sm text-gray-500 mt-1">Enter your email or mobile to receive a reset code.</p>
      </div>

      <div className="flex bg-gray-100 rounded-xl p-1">
        <button onClick={() => { setMethod("email"); setValue(""); setError(""); }}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${method === "email" ? "bg-white text-blue-900 shadow-sm" : "text-gray-500"}`}>
          Email
        </button>
        <button onClick={() => { setMethod("mobile"); setValue(""); setError(""); }}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${method === "mobile" ? "bg-white text-blue-900 shadow-sm" : "text-gray-500"}`}>
          Mobile
        </button>
      </div>

      {method === "email" ? (
        <div>
          <label className="block text-sm text-gray-600 mb-1.5">Email Address</label>
          <input type="email" value={value} onChange={(e) => { setValue(e.target.value); setError(""); }}
            placeholder="you@example.com"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 bg-white" />
        </div>
      ) : (
        <div>
          <label className="block text-sm text-gray-600 mb-1.5">Mobile Number</label>
          <div className="flex gap-2">
            <select className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none w-24">
              <option>🇮🇳 +91</option>
            </select>
            <input type="tel" value={value} onChange={(e) => { setValue(e.target.value.replace(/\D/g, "").slice(0, 10)); setError(""); }}
              placeholder="10-digit number"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 bg-white" />
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">{error}</p>}

      <button onClick={handleSubmit} disabled={loading}
        className="w-full py-3.5 rounded-xl bg-blue-800 text-white font-semibold text-sm hover:bg-blue-700 transition-all disabled:opacity-50">
        {loading ? "Sending..." : "Send OTP"}
      </button>

      <a href="/login" className="w-full py-3.5 rounded-xl border-2 border-blue-800 text-blue-800 font-semibold text-sm text-center hover:bg-blue-50 transition-colors">
        Back to Sign In
      </a>

      <div className="border-t-2 border-dashed border-gray-300 pt-5 flex flex-col gap-2">
        <p className="text-center text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
          Simulation — For Testing Only. Remove in Production.
        </p>
        <button onClick={handleSuccess}
          className="w-full py-3 rounded-xl bg-green-600 text-white font-semibold text-sm hover:bg-green-700 transition-colors">
          ✓ Simulate Success — OTP Sent
        </button>
        <button onClick={handleFailure}
          className="w-full py-3 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition-colors">
          ✕ Simulate Failure — OTP Failed
        </button>
        <p className="text-center text-xs text-gray-400 italic">DB Connection Pending — remove when connected</p>
      </div>

    </div>
  );
}