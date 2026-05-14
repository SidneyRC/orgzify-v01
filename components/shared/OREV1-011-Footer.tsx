import Link from "next/link";

export default function Footer() {
  return (
    <div className="border-t border-gray-100 pt-4">
      <p className="text-center text-xs text-gray-400">
        Powered by{" "}
        <Link href="/" className="font-semibold hover:text-blue-800 transition-colors">
          ORGZIFY
        </Link>{" "}
        © 2026 All rights reserved.
      </p>
    </div>
  );
}