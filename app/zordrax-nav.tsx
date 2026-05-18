"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navGroups = [
  {
    name: "Plan",
    links: [
      { href: "/workflow", label: "Workflow" },
      { href: "/platform", label: "Platform" },
      { href: "/product-board", label: "Product Board" },
      { href: "/product-board/load", label: "Bulk Load" },
    ],
  },
  {
    name: "Execute",
    links: [
      { href: "/execution/queue", label: "Execution Queue" },
      { href: "/orchestrator", label: "Orchestrator" },
      { href: "/swarm", label: "Swarm" },
    ],
  },
  {
    name: "Review",
    links: [
      { href: "/execution/prs", label: "PRs" },
      { href: "/product-board/approvals", label: "Approvals" },
      { href: "/swarm/merge", label: "Merge" },
      { href: "/product-board/status", label: "Progress" },
    ],
  },
];

export default function ZordraxNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-4">
        <Link href="/workflow" className="shrink-0">
          <p className="text-sm font-bold text-slate-950">Zordrax-Analytica</p>
          <p className="text-xs text-slate-500">AI Product Delivery System</p>
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          {navGroups.map((group) => (
            <div key={group.name} className="flex flex-wrap items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50 px-2 py-2">
              <span className="px-2 text-[11px] font-black uppercase tracking-wide text-slate-500">
                {group.name}
              </span>

              {group.links.map((link) => {
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={
                      active
                        ? "rounded-xl bg-slate-950 px-3 py-2 text-sm font-bold text-white"
                        : "rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100"
                    }
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          ))}

          <button
            type="button"
            onClick={() => window.history.back()}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100"
          >
            Back
          </button>
        </div>
      </div>
    </nav>
  );
}
