import Image from "next/image";
import Link from "next/link";

export default function LogoHeader() {
  return (
    <div className="flex justify-center">
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
    </div>
  );
}
