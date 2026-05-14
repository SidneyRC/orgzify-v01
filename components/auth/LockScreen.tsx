"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface LockScreenProps {
  lockDuration?: number; // in seconds (default 15 minutes)
  onUnlocked: () => void;
  message?: string;
}

export default function LockScreen({
  lockDuration = 900,
  onUnlocked,
  message = "Too many attempts. Please wait before trying again.",
}: LockScreenProps) {
  const [remaining, setRemaining] = useState(lockDuration);

  useEffect(() => {
    if (remaining <= 0) {
      onUnlocked();
      return;
    }
    const timer = setTimeout(() => setRemaining((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [remaining, onUnlocked]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const formatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-8 px-4 text-center">

      {/* Logo */}
      <Link href="/">
        <div className="h-10 w-32 relative cursor-pointer">
          <Image
            src="/images/logo.png"
            alt="Orgzify Logo"
            fill
            className="object-contain"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        </div>
      </Link>

      {/* Lock Icon */}
      <div className="w-20 h-20 rounded-full bg-blue-50 border-2 border-blue-800 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-blue-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>

      {/* Message */}
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-bold text-blue-800">Account Temporarily Locked</h2>
        <p className="text-sm text-gray-500 max-w-xs">{message}</p>
      </div>

      {/* Countdown */}
      <div className="flex flex-col items-center gap-1">
        <p className="text-xs text-gray-400 uppercase tracking-widest">Try again in</p>
        <p className="text-4xl font-bold text-blue-800 tabular-nums">{formatted}</p>
      </div>

      {/* Sign In Button */}
      <a
        href="/login"
        className="w-full py-3.5 rounded-xl border-2 border-blue-800 text-blue-800 font-semibold text-sm text-center hover:bg-blue-50 transition-colors"
      >
        Sign In
      </a>

      {/* Footer */}
      <p className="text-xs text-gray-400">
        Powered by ORGZIFY © 2026 All rights reserved.
      </p>

    </div>
  );
}
