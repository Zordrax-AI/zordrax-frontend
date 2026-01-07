"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const steps = [
  { label: "Overview", href: "/portal/onboarding" },
  { label: "Questions", href: "/portal/onboarding/questions" },
  { label: "Recommendation", href: "/portal/onboarding/recommend" },
  { label: "Deploy", href: "/portal/onboarding/deploy" },
  { label: "Status", href: "/portal/status" },
];

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-200">
      {/* SIDEBAR */}
      <aside className="w-64 border-r border-slate-800 p-4">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Onboarding
        </h2>

        <nav className="space-y-1 text-sm">
          {steps.map((step) => {
            const active =
              pathname === step.href ||
              (step.href !== "/portal/onboarding" &&
                pathname.startsWith(step.href));

            return (
              <Link
                key={step.href}
                href={step.href}
                className={`block rounded-md px-3 py-2 transition ${
                  active
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:bg-slate-900 hover:text-white"
                }`}
              >
                {step.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* CONTENT */}
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
