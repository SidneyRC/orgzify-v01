"use client";

import { useState } from "react";
import { Toaster } from "react-hot-toast";
import StepRequest from "./_components/OREV1-007-StepRequest";
import StepOtp from "./_components/OREV1-008-StepOtp";
import StepReset from "./_components/OREV1-009-StepReset";


type Step = "request" | "otp" | "reset";

export default function ForgotPasswordPage() {
  const [step, setStep]   = useState<Step>("request");
  const [email, setEmail] = useState("");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
  <Toaster position="top-right" />
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {(["request", "otp", "reset"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                ${step === s ? "bg-blue-900 text-white" :
                  (["request", "otp", "reset"].indexOf(step) > i ? "bg-yellow-400 text-blue-900" : "bg-gray-200 text-gray-400")
                }`}>
                {i + 1}
              </div>
              {i < 2 && <div className={`w-8 h-0.5 ${["request", "otp", "reset"].indexOf(step) > i ? "bg-yellow-400" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>

        {step === "request" && (
          <StepRequest
            onNext={(value) => {
              setEmail(value);
              setStep("otp");
            }}
          />
        )}

        {step === "otp" && (
          <StepOtp
            email={email}
            onVerified={() => setStep("reset")}
            onBack={() => setStep("request")}
          />
        )}

        {step === "reset" && (
          <StepReset email={email} />
        )}

      </div>
    </div>
  );
}
