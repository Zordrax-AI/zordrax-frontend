import Link from "next/link";

export default function PortalEntryPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-5xl px-6 py-24">

        <h1 className="text-3xl font-semibold">
          Start your analytics onboarding
        </h1>

        <p className="mt-4 max-w-2xl text-slate-400">
          Choose how you want to configure your analytics platform.
          You can let AI recommend an optimal setup, or configure everything manually.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-2">

          {/* AI MODE */}
          <Link
            href="/portal/onboarding"
            className="group rounded-xl border border-slate-800 bg-slate-900/40 p-8 hover:border-sky-400"
          >
            <h2 className="text-xl font-semibold group-hover:text-sky-400">
              AI-Recommended Setup
            </h2>

            <p className="mt-3 text-sm text-slate-400">
              Answer a few questions and let AI design the optimal
              infrastructure, pipelines, governance, and BI stack.
            </p>

            <p className="mt-6 text-xs text-slate-500">
              Best for fast onboarding and non-technical users
            </p>
          </Link>

          {/* MANUAL MODE */}
          <Link
            href="/portal/onboarding/manual"
            className="group rounded-xl border border-slate-800 bg-slate-900/40 p-8 hover:border-violet-400"
          >
            <h2 className="text-xl font-semibold group-hover:text-violet-400">
              Manual Configuration
            </h2>

            <p className="mt-3 text-sm text-slate-400">
              Manually select cloud, data sources, pipelines, governance
              rules, and reporting tools step by step.
            </p>

            <p className="mt-6 text-xs text-slate-500">
              Best for data engineers and consultants
            </p>
          </Link>

        </div>
      </div>
    </main>
  );
}
