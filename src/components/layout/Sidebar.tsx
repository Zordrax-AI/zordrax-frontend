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
    <aside className="w-64 bg-black border-r border-slate-800 flex flex-col">
      <div className="px-4 py-4 border-b border-slate-800">
        <div className="text-sm font-semibold text-slate-400">Zordrax-Analytica</div>
        <div className="text-lg font-semibold text-slate-100">Orchestrator</div>
      </div>
      <nav className="flex-1 py-4 space-y-1">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "block px-4 py-2 text-sm rounded-xl mx-2",
              pathname === item.href
                ? "bg-slate-800 text-sky-300"
                : "text-slate-300 hover:bg-slate-900 hover:text-sky-200"
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
