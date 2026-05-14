"use client";

import OtpBoxes from "@/components/auth/OtpBoxes";

export default function TestPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <p className="text-lg font-bold">OTP Box Test</p>
      <OtpBoxes onComplete={(otp) => console.log("OTP entered:", otp)} />
    </div>
  );
}