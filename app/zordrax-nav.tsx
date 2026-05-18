"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/orchestrator", label: "Orchestrator" },
  { href: "/tasks", label: "Task Loader" },
  { href: "/product-board", label: "Product Board" },
  { href: "/platform", label: "Platform" },
  { href: "/product-board/load", label: "Bulk Load" },
  { href: "/product-board/status", label: "Progress" },
  { href: "/product-board/approvals", label: "Approvals" },
];

export default function ZordraxNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 px-6 py-3 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-950">Zordrax-Analytica</p>
          <p className="text-xs text-slate-500">AI Product Delivery System</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-xl px-3 py-2 text-sm font-bold ${
                  active
                    ? "bg-slate-950 text-white"
                    : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => window.history.back()}
            className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100"
          >
            Back
          </button>
        </div>
      </div>
    </nav>
  );
}


