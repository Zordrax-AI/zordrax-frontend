"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

type Step = {
  label: string;
  href: string;
};

const STEPS: Step[] = [
  { label: "Connect Data", href: "/portal/onboarding/mozart/connect" },
  { label: "Select Tables", href: "/portal/onboarding/mozart/tables" },
  { label: "Data Checks", href: "/portal/onboarding/mozart/data-checks" },
  { label: "Metrics Intent", href: "/portal/onboarding/mozart/metrics-intent" },
  { label: "Recommendations", href: "/portal/onboarding/mozart/recommendations" },
  { label: "Deploy", href: "/portal/onboarding/mozart/deploy" },
  { label: "Run", href: "/portal/onboarding/mozart/run" },
];

function isActive(pathname: string, stepHref: string) {
  return pathname === stepHref || pathname.startsWith(stepHref + "/");
}

export default function OnboardingStepper({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname();
  const params = useSearchParams();

  const requirementSetId = params.get("requirement_set_id") ?? "";

  return (
    <div className={compact ? "space-y-2" : "space-y-4"}>
      {!compact && (
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Onboarding
        </div>
      )}

      <nav className={compact ? "flex gap-2" : "space-y-1"}>
        {STEPS.map((s) => {
          const active = isActive(pathname, s.href);
          const qs = requirementSetId ? `?requirement_set_id=${encodeURIComponent(requirementSetId)}` : "";
          const href = s.href.startsWith("/portal/onboarding") ? `${s.href}${qs}` : s.href;

          return (
            <Link
              key={s.href}
              href={href}
              className={[
                compact
                  ? "rounded-full border px-3 py-1 text-xs transition"
                  : "block rounded-md px-3 py-2 text-sm transition",
                active
                  ? "bg-cyan-600 text-white border-cyan-600"
                  : "text-slate-600 border-slate-200 hover:border-cyan-300 hover:text-cyan-700",
              ].join(" ")}
            >
              {s.label}
            </Link>
          );
        })}
      </nav>

      {!compact && (
        <div className="rounded-md border border-slate-200 bg-white p-3 text-xs text-slate-600 shadow-sm">
          <div className="font-semibold text-slate-800">Tip</div>
          <div className="mt-1">Use the steps to move around without losing your answers.</div>
        </div>
      )}
    </div>
  );
}
