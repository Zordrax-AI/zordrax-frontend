// src/app/portal/onboarding/layout.tsx
import { ReactNode } from "react";
import Link from "next/link";

const navItems = [
  { label: "Overview", href: "/portal/onboarding" },
  { label: "Mozart", href: "/portal/onboarding/mozart" },
  { label: "Questions", href: "/portal/onboarding/questions" },
  { label: "Recommend", href: "/portal/onboarding/recommend" },
  { label: "Deploy", href: "/portal/onboarding/deploy" },
  { label: "Status", href: "/portal/onboarding/status" },
];

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-slate-900 border-r border-slate-800 p-4">
        <h2 className="text-lg font-semibold mb-4 text-white">Onboarding</h2>
        <nav className="space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-3 py-2 rounded text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-6 bg-slate-950 text-slate-100">{children}</main>
    </div>
  );
}
