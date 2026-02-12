// src/app/portal/onboarding/page.tsx

import Link from "next/link";

export const dynamic = "force-dynamic";

export default function OnboardingOverviewPage() {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold text-white">Onboarding</h1>

      <p className="text-slate-300 text-sm">
        Choose an onboarding flow:
      </p>

      <div className="space-y-2">
        <Link
          className="inline-flex items-center rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-2 text-slate-200 hover:bg-slate-900/40"
          href="/portal/onboarding/mozart"
        >
          Mozart flow (BRD → Submit → Approve → Plan → Infra)
        </Link>

        <Link
          className="inline-flex items-center rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-2 text-slate-200 hover:bg-slate-900/40"
          href="/portal/onboarding/mozart/connect-data"
        >
          Connect Data (snapshot)
        </Link>
      </div>
    </div>
  );
}
