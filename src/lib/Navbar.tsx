import Image from "next/image";
import Link from "next/link";
import MobileMenu from "@/components/MobileMenu";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/70 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo -> Home */}
        <Link href="/" className="flex items-center gap-3">
          <div className="relative h-8 w-8 overflow-hidden rounded-full ring-1 ring-white/20">
            <Image src="/logo.png" alt="Zordrax Analytica" fill className="object-cover" />
          </div>
          <span className="font-semibold text-lg tracking-tight">Zordrax Analytica</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex gap-6 text-sm text-slate-300">
          <Link href="/" className="hover:text-white">Home</Link>
          <Link href="/about" className="hover:text-white">About Us</Link>
          <Link href="/portal" className="hover:text-white">Portal</Link>
          <Link href="/contact" className="hover:text-white">Contact</Link>
        </nav>

        {/* Desktop CTA + Mobile hamburger */}
        <div className="flex items-center gap-3">
          <Link
            href="/contact"
            className="hidden md:inline-flex items-center rounded-2xl bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 shadow-md shadow-fuchsia-500/20 hover:opacity-80 transition  "
          >
            Book a Consultation
          </Link>
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
