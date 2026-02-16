"use client";

import Link from "next/link";
import ThemeToggle from "@/components/theme/ThemeToggle";

const navItems = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Portal", href: "/portal" },
  { label: "Contact", href: "/contact" },
];

export default function Navbar() {
  return (
    <header className="border-b border-[color:var(--border)] bg-[color:var(--card)]">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold text-[color:var(--fg)]">
          Zordrax-Analytica
        </Link>

        <div className="flex items-center gap-4 text-sm">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-[color:var(--muted)] hover:text-[color:var(--fg)]"
            >
              {item.label}
            </Link>
          ))}

          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
