"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/shared/OREV1-026-Navbar";
import RegisterStep1 from "./OREV1-014A-RegisterStep1";
import RegisterStep2 from "./OREV1-014B-RegisterStep2";
import RegisterStep3 from "./OREV1-014C-RegisterStep3";

type Step = "basic" | "otp" | "account";

export default function RegisterPage() {
  const [step, setStep] = useState<Step>("basic");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  const steps: Step[] = ["basic", "otp", "account"];
  const currentStepIndex = steps.indexOf(step);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      <Navbar />

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

            {step === "basic" && (
              <RegisterStep1 onNext={(name, mail) => { setFullName(name); setEmail(mail); setStep("otp"); }} />
            )}
            {step === "otp" && (
              <RegisterStep2 name={fullName} email={email} onNext={() => setStep("account")} onBack={() => setStep("basic")} />
            )}
            {step === "account" && (
              <RegisterStep3 fullName={fullName} email={email} />
            )}

          </div>
        </div>
      </main>

    </div>
  );
}
