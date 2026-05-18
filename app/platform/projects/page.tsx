import Link from "next/link";

export default function PlatformProjectsPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl bg-slate-950 p-6 text-white">
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="mt-2 text-sm text-slate-300">Current active project: Zordrax-Analytica.</p>
          <Link href="/platform" className="mt-4 inline-flex rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-950">
            Back to Platform
          </Link>
        </header>

        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-cyan-700">Active Project</p>
              <h2 className="mt-1 text-2xl font-bold">Zordrax-Analytica</h2>
              <p className="mt-3 max-w-4xl text-sm text-slate-600">
                AI-driven, vendor-agnostic data platform onboarding and delivery SaaS that captures customer
                requirements, validates governance/security/compliance, recommends architectures, generates
                implementation packages, orchestrates Terraform/ETL/BI/Governance delivery, and uses AI agents
                with human approval checkpoints.
              </p>
            </div>
            <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-800">Active</span>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm text-slate-500">Repos</p><p className="text-2xl font-bold">6</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm text-slate-500">AI Build System</p><p className="text-2xl font-bold">Built</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm text-slate-500">SaaS Product</p><p className="text-2xl font-bold">In Build</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm text-slate-500">Approval Model</p><p className="text-2xl font-bold">Human Gate</p></div>
          </div>
        </section>
      </div>
    </main>
  );
}
