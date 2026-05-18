import Link from "next/link";

const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

interface Props {
  reason: "wrong" | "resend";
  timer: number;
  onTryAgain: () => void;
}

export default function OtpLockScreen({ reason, timer, onTryAgain }: Props) {
  return (
    <div className="text-center space-y-5 py-4">
      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>

      <h2 className="text-lg font-bold text-blue-900">
        {reason === "wrong" ? "Too many incorrect attempts" : "Too many resend attempts"}
      </h2>

      <p className="text-gray-500 text-sm">
        Please try again in
        <span className="text-2xl font-bold text-blue-900 block mt-1">{fmt(timer)}</span>
      </p>

      {timer === 0 && (
        <button onClick={onTryAgain}
          className="w-full bg-blue-900 text-white rounded-xl py-3.5 text-sm font-semibold hover:bg-blue-800">
          Try Again
        </button>
      )}

      <Link href="/login"
        className="block w-full border border-blue-900 text-blue-900 rounded-xl py-3.5 text-sm font-semibold hover:bg-blue-50 text-center">
        Sign In
      </Link>

      <p className="text-center text-xs text-gray-400 pt-3 border-t border-gray-100">
        Powered by <a href="https://orgzify.com" className="text-blue-900 font-semibold hover:underline">ORGZIFY</a> © 2026 All rights reserved.
      </p>
    </div>
  );
}
