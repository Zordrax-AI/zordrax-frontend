export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-3xl bg-slate-950 p-8 text-white shadow-sm">
          <p className="text-sm font-semibold text-cyan-300">Zordrax-Analytica</p>
          <h1 className="mt-3 text-4xl font-bold">AI-first SaaS orchestration platform</h1>
          <p className="mt-3 max-w-3xl text-sm text-slate-300">
            Build, test, remediate, review, and deploy data-platform packages through the Zordrax AI Orchestrator.
          </p>
        </section>

        <section className="grid gap-5 md:grid-cols-2">
          <a
            href="/orchestrator"
            className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-purple-700">AI Control Plane</p>
                <h2 className="mt-2 text-2xl font-bold">Open Orchestrator Cockpit</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Prompt agents, create PRs, run QA validation, auto-fix failures, and approve deployment gates.
                </p>
              </div>
              <span className="rounded-2xl bg-purple-100 px-4 py-2 text-sm font-bold text-purple-800">
                Open
              </span>
            </div>
          </a>

          <a
            href="/onboarding/requirements"
            className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <p className="text-sm font-semibold text-blue-700">Onboarding</p>
            <h2 className="mt-2 text-2xl font-bold">Open Onboarding Wizard</h2>
            <p className="mt-2 text-sm text-slate-600">
              Capture requirements and convert them into infra, ETL, governance, and BI package plans.
            </p>
          </a>
        </section>
      </div>
    </main>
  );
}
