"use client";

import { useEffect, useState } from "react";

interface ResendTimerProps {
  cooldown?: number; // seconds between resends (default 60)
  maxAttempts?: number; // max resend attempts (default 3)
  onResend: () => void;
  onLocked: () => void; // called when max attempts reached
}

export default function ResendTimer({
  cooldown = 60,
  maxAttempts = 3,
  onResend,
  onLocked,
}: ResendTimerProps) {
  const [seconds, setSeconds] = useState(cooldown);
  const [attempts, setAttempts] = useState(0);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (canResend) return;
    if (seconds <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds, canResend]);

  const handleResend = () => {
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (newAttempts >= maxAttempts) {
      onLocked();
      return;
    }

    onResend();
    setCanResend(false);
    setSeconds(cooldown);
  };

  const getMessage = () => {
    if (attempts === 1) {
      return "Can't find the email? Please check your Spam/Junk folder and mark it as 'Not Spam'.";
    }
    if (attempts === 2) {
      return "Can't find the email? Please check your Spam/Junk folder and mark it as 'Not Spam'. 1 resend remaining.";
    }
    return null;
  };

  const message = getMessage();

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      {message && (
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-center">
          {message}
        </p>
      )}
      {canResend ? (
        <button
          onClick={handleResend}
          className="text-sm font-semibold text-[#1e3a8a] hover:underline transition-all"
        >
          Resend OTP
        </button>
      ) : (
        <p className="text-sm text-gray-500">
          Resend in <span className="font-bold text-[#1e3a8a]">{seconds}s</span>
        </p>
      )}
    </div>
  );
}
