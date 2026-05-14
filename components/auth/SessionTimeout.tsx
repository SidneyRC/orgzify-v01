"use client";

import { useEffect, useRef, useState } from "react";

interface SessionTimeoutProps {
  warningAt?: number; // seconds idle before warning (default 25 min)
  logoutAt?: number;  // seconds idle before logout (default 30 min)
  onLogout: () => void;
}

export default function SessionTimeout({
  warningAt = 1500,
  logoutAt = 1800,
  onLogout,
}: SessionTimeoutProps) {
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(logoutAt - warningAt);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetTimers = () => {
    setShowWarning(false);
    setCountdown(logoutAt - warningAt);
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (countdownTimer.current) clearInterval(countdownTimer.current);

    idleTimer.current = setTimeout(() => {
      setShowWarning(true);
      countdownTimer.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownTimer.current!);
            onLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, warningAt * 1000);
  };

  useEffect(() => {
    const events = ["mousemove", "keydown", "mousedown", "touchstart", "scroll"];
    events.forEach((e) => window.addEventListener(e, resetTimers));
    resetTimers();
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimers));
      if (idleTimer.current) clearTimeout(idleTimer.current);
      if (countdownTimer.current) clearInterval(countdownTimer.current);
    };
  }, []);

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full flex flex-col items-center gap-5 text-center">
        {/* Icon */}
        <div className="w-16 h-16 rounded-full bg-yellow-50 border-2 border-[#facc15] flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-bold text-[#1e3a8a]">Session Expiring Soon</h2>
          <p className="text-sm text-gray-500">You have been idle. You will be logged out in</p>
          <p className="text-4xl font-bold text-[#1e3a8a] tabular-nums mt-1">{countdown}s</p>
        </div>

        <button
          onClick={resetTimers}
          className="w-full py-3 rounded-xl bg-[#1e3a8a] text-white font-semibold text-sm hover:bg-blue-800 transition-colors"
        >
          Stay Logged In
        </button>

        <button
          onClick={onLogout}
          className="text-sm text-gray-400 hover:text-red-500 transition-colors"
        >
          Logout Now
        </button>
      </div>
    </div>
  );
}
