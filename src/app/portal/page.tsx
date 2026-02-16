export const dynamic = "force-dynamic";

export default function PortalHomePage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <header className="space-y-3">
            <p className="text-sm uppercase tracking-wide text-[color:var(--muted)]">Portal</p>
            <h1 className="text-3xl font-semibold text-[color:var(--fg)]">Zordrax-Analytica Console</h1>
            <p className="text-sm text-[color:var(--muted)]">
              {"AI-augmented onboarding -> deterministic plans -> Terraform deploys."}
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="/portal/onboarding"
                className="rounded-md bg-[color:var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition"
              >
                Start Onboarding
              </a>
              <a
                href="/portal/runs"
                className="rounded-md border border-[color:var(--border)] px-4 py-2 text-sm font-medium text-[color:var(--fg)] hover:bg-[color:var(--card-2)] transition"
              >
                View Runs
              </a>
              <a
                href="/portal/diagnostics"
                className="rounded-md border border-[color:var(--border)] px-4 py-2 text-sm font-medium text-[color:var(--fg)] hover:bg-[color:var(--card-2)] transition"
              >
                Diagnostics
              </a>
            </div>
          </header>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-4 shadow-sm">
              <div className="text-sm font-semibold text-[color:var(--fg)]">Start Onboarding</div>
              <p className="mt-1 text-xs text-[color:var(--muted)]">Kick off the guided flow to capture requirements.</p>
              <a
                href="/portal/onboarding"
                className="mt-3 inline-flex w-full justify-center rounded-md bg-[color:var(--accent)] px-3 py-2 text-xs font-medium text-white hover:opacity-90 transition"
              >
                Open Wizard
              </a>
            </div>

            <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-4 shadow-sm">
              <div className="text-sm font-semibold text-[color:var(--fg)]">Runs</div>
              <p className="mt-1 text-xs text-[color:var(--muted)]">Inspect automation history and deployment plans.</p>
              <a
                href="/portal/runs"
                className="mt-3 inline-flex w-full justify-center rounded-md border border-[color:var(--border)] px-3 py-2 text-xs font-medium text-[color:var(--fg)] hover:bg-[color:var(--card-2)] transition"
              >
                View Runs
              </a>
            </div>

            <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-4 shadow-sm">
              <div className="text-sm font-semibold text-[color:var(--fg)]">Diagnostics</div>
              <p className="mt-1 text-xs text-[color:var(--muted)]">Health, connectivity, and environment checks.</p>
              <a
                href="/portal/diagnostics"
                className="mt-3 inline-flex w-full justify-center rounded-md border border-[color:var(--border)] px-3 py-2 text-xs font-medium text-[color:var(--fg)] hover:bg-[color:var(--card-2)] transition"
              >
                Open Diagnostics
              </a>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-[color:var(--fg)]">Recent Runs</h2>
                <p className="text-xs text-[color:var(--muted)]">Latest executions and deploy previews.</p>
              </div>
              <a
                href="/portal/runs"
                className="rounded-md border border-[color:var(--border)] px-3 py-1 text-xs font-medium text-[color:var(--fg)] hover:bg-[color:var(--card-2)] transition"
              >
                View all
              </a>
            </div>
            <div className="mt-4 rounded-lg border border-dashed border-[color:var(--border)] bg-[color:var(--card-2)] px-3 py-6 text-center text-xs text-[color:var(--muted)]">
              No runs yet. Kick off onboarding to generate your first plan.
            </div>
          </div>

          <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-[color:var(--fg)]">System Status</h2>
                <p className="text-xs text-[color:var(--muted)]">Static snapshot</p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-[color:var(--success-bg,rgba(16,185,129,0.12))] px-3 py-1 text-xs font-medium text-[color:var(--success)]">
                <span className="h-2 w-2 rounded-full bg-[color:var(--success)]" />
                Operational
              </span>
            </div>
            <ul className="space-y-2 text-xs text-[color:var(--fg)]">
              <li className="flex items-center justify-between">
                <span className="text-[color:var(--muted)]">Agent API</span>
                <span className="rounded-md bg-[color:var(--card-2)] px-2 py-1 text-[color:var(--success)]">Healthy</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-[color:var(--muted)]">Database</span>
                <span className="rounded-md bg-[color:var(--card-2)] px-2 py-1 text-[color:var(--success)]">Online</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-[color:var(--muted)]">Pipeline</span>
                <span className="rounded-md bg-[color:var(--card-2)] px-2 py-1 text-[color:var(--muted)]">Idle</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
