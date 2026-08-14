import Link from "next/link";
import Image from "next/image";

export default function VideoNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-6 text-center text-white">
      <div className="relative mb-6 h-16 w-16 overflow-hidden rounded-2xl">
        <Image src="/logo.png" alt="FuntApp" fill className="object-cover" />
      </div>
      <h1 className="text-2xl font-bold">Reel not found</h1>
      <p className="mt-3 max-w-md text-[#B3B3B3]">
        This reel may have been removed, or the link may be invalid.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-2xl bg-brand-gradient px-6 py-3 text-sm font-semibold"
      >
        Back to FuntApp
      </Link>
    </div>
  );
}
