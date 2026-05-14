"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LogoHeader from "@/components/shared/OREV1-012-LogoHeader";
import Footer from "@/components/shared/OREV1-011-Footer";
import RegisterStep1 from "./OREV1-014A-RegisterStep1";
import RegisterStep2 from "./OREV1-014B-RegisterStep2";
import RegisterStep3 from "./OREV1-014C-RegisterStep3";

type Step = "basic" | "otp" | "account";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("basic");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  const steps: Step[] = ["basic", "otp", "account"];
  const currentStepIndex = steps.indexOf(step);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-900 rounded-lg flex items-center justify-center">
            <span className="text-yellow-400 font-bold text-sm">O</span>
          </div>
          <span className="text-blue-900 font-bold text-lg tracking-tight">Orgzify</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">

          {/* Step indicator dots */}
          <div className="flex justify-center gap-2 mb-6">
            {steps.map((s, i) => (
              <div key={s} className={`h-1.5 rounded-full transition-all ${
                s === step ? "w-8 bg-blue-900" : currentStepIndex > i ? "w-4 bg-blue-900" : "w-4 bg-gray-200"
              }`} />
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="mb-5"><LogoHeader /></div>

            {/* ── SECTION 1 — Steps ── */}
            {step === "basic" && (
              <RegisterStep1 onNext={(name, mail) => { setFullName(name); setEmail(mail); setStep("otp"); }} />
            )}
            {step === "otp" && (
              <RegisterStep2 email={email} onNext={() => setStep("account")} onBack={() => setStep("basic")} />
            )}
            {step === "account" && (
              <RegisterStep3 fullName={fullName} email={email} />
            )}
          </div>

          <div className="mt-5"><Footer /></div>
        </div>
      </main>

      {/* ── SECTION 2 — Simulation. For Testing Only. Remove in Production. ── */}
      <div className="bg-gray-50 border-b border-dashed border-gray-300 px-6 py-2 flex flex-wrap items-center gap-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Simulation — For Testing Only. Remove in Production.</p>
        <button onClick={() => setStep("basic")} className="px-3 py-1 rounded-lg bg-blue-600 text-white text-xs font-semibold">Step 1</button>
        <button onClick={() => { setEmail("test@example.com"); setStep("otp"); }} className="px-3 py-1 rounded-lg bg-blue-600 text-white text-xs font-semibold">Step 2 — OTP</button>
        <button onClick={() => setStep("account")} className="px-3 py-1 rounded-lg bg-blue-600 text-white text-xs font-semibold">Step 3</button>
        <button onClick={() => router.replace("/profile/edit")} className="px-3 py-1 rounded-lg bg-green-600 text-white text-xs font-semibold">Simulate Success → Profile</button>
        <button onClick={() => setStep("basic")} className="px-3 py-1 rounded-lg bg-red-500 text-white text-xs font-semibold">Simulate Failure</button>
        <p className="text-xs text-gray-400 italic">DB Connection Pending — remove when connected</p>
      </div>
    </div>
  );
}
