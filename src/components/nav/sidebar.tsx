"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const pages = [
  { href: "/wizard/questions", label: "AI Questions" },
  { href: "/wizard/review", label: "Review" },
  { href: "/wizard/manifest", label: "Manifest" },
  { href: "/wizard/deploy", label: "Deploy" },
  { href: "/wizard/status", label: "Status" },
  { href: "/wizard/history", label: "History" },
];

export default function Sidebar() {
  const path = usePathname();

  return (
    <aside className="w-64 min-h-screen bg-white dark:bg-gray-900 border-r p-4">
      <h3 className="text-xs uppercase text-gray-500 mb-4">Onboarding Wizard</h3>

      <nav className="space-y-1">
        {pages.map((p) => {
          const active = path.startsWith(p.href);
          return (
            <Link
              key={p.href}
              href={p.href}
              className={`block px-3 py-2 rounded text-sm ${
                active
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800"
              }`}
            >
              {p.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
