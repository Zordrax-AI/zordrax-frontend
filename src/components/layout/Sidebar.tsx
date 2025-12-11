"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const nav = [
  { label: "Dashboard", href: "/" },
  { label: "Onboarding", href: "/onboarding" },
  { label: "Sessions", href: "/sessions" },
  { label: "Runs", href: "/runs" }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
      {/* Branding */}
      <div className="p-5 border-b border-slate-800">
        <h1 className="text-lg font-semibold text-slate-100">Zordrax-Analytica</h1>
        <div className="text-xs text-slate-400 mt-1">Orchestration Console</div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 space-y-1">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "block px-4 py-2 mx-2 rounded-lg text-sm transition",
              pathname === item.href
                ? "bg-sky-600/20 text-sky-300 border border-sky-500/30"
                : "text-slate-300 hover:bg-slate-800 hover:text-sky-200"
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
