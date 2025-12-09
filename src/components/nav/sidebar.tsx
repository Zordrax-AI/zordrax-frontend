"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const steps = [
  { label: "AI Questions", href: "/wizard/questions" },
  { label: "Review", href: "/wizard/review" },
  { label: "Manifest", href: "/wizard/manifest" },
  { label: "Deploy", href: "/wizard/deploy" },
  { label: "Status", href: "/wizard/status" },
  { label: "History", href: "/wizard/history" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 min-h-screen bg-white dark:bg-gray-900 border-r p-4">
      <h3 className="text-xs uppercase text-gray-500 mb-3 tracking-wide">
        Onboarding Wizard
      </h3>

      <nav className="space-y-1">
        {steps.map((step) => {
          const active = pathname.startsWith(step.href);
          return (
            <Link
              key={step.href}
              href={step.href}
              className={`block px-3 py-2 rounded text-sm ${
                active
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800"
              }`}
            >
              {step.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
