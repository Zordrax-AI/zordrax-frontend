"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

type Step = {
  label: string;
  href: string;
};

const STEPS: Step[] = [
  { label: "Connect Data", href: "/portal/onboarding/mozart/connect-data" },
  { label: "Recommendations", href: "/portal/onboarding/mozart/recommendations" },
  { label: "Deploy", href: "/portal/onboarding/mozart/deploy" },
  { label: "Run", href: "/portal/runs" },
];

function isActive(pathname: string, stepHref: string) {
  return pathname === stepHref || pathname.startsWith(stepHref + "/");
}

export default function OnboardingStepper() {
  const pathname = usePathname();
  const params = useSearchParams();

  // carry forward key params so links don’t “lose context”
  const mode = params.get("mode") ?? "manual";
  const industry = params.get("industry") ?? "";
  const scale = params.get("scale") ?? "small";
  const cloud = params.get("cloud") ?? "azure";

  const carry = new URLSearchParams({ mode, industry, scale, cloud }).toString();

  return (
    <div className="space-y-4">
      <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        Onboarding
      </div>

      <nav className="space-y-1">
        {STEPS.map((s) => {
          const active = isActive(pathname, s.href);

          const href =
            s.href.startsWith("/portal/onboarding") && carry
              ? `${s.href}?${carry}`
              : s.href;

          return (
            <Link
              key={s.href}
              href={href}
              className={[
                "block rounded-md px-3 py-2 text-sm transition",
                active
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white",
              ].join(" ")}
            >
              {s.label}
            </Link>
          );
        })}
      </nav>

      <div className="rounded-md border border-slate-800 bg-slate-950/40 p-3 text-xs text-slate-400">
        <div className="font-semibold text-slate-300">Tip</div>
        <div className="mt-1">
          Use the steps to move around without losing your answers.
        </div>
      </div>
    </div>
  );
}
