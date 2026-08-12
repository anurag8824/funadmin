import Image from "next/image";

export default function Footer() {
  return (
    <footer className="border-t border-white/5 px-6 py-10 sm:px-10 lg:px-20">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 sm:flex-row">
        <div className="flex items-center gap-3">
          <div className="relative h-8 w-8 overflow-hidden rounded-lg">
            <Image
              src="/logo.png"
              alt="FuntApp"
              fill
              className="object-cover"
            />
          </div>
          <span className="text-sm font-semibold">
            <span className="text-gradient">Funt</span>App
          </span>
        </div>

        <p className="text-xs text-[#B3B3B3]">
          © {new Date().getFullYear()} Infayou. All rights reserved.
        </p>

        <a
          href="https://play.google.com/store/apps/details?id=com.infayou.funtapp"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[#B3B3B3] transition-colors hover:text-white"
        >
          Google Play
        </a>
      </div>
    </footer>
  );
}
