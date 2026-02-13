"use client";

import Link from "next/link";
import { useTheme } from "@/components/theme/theme-provider";

const navItems = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Portal", href: "/portal" },
  { label: "Contact", href: "/contact" },
];

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();

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

          <button
            onClick={toggleTheme}
            className="rounded-md border border-[color:var(--border)] px-3 py-1 text-xs text-[color:var(--fg)] hover:bg-[color:var(--card-2)]"
          >
            {theme === "dark" ? "Light" : "Dark"}
          </button>
        </div>
      </nav>
    </header>
  );
}
