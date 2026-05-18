import Link from "next/link";

export default function PlatformSecurityPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl bg-slate-950 p-6 text-white">
          <h1 className="text-3xl font-bold">Security & Approval Controls</h1>
          <p className="mt-2 text-sm text-slate-300">Governance rules for AI execution, PRs, secrets and deployment.</p>
          <Link href="/platform" className="mt-4 inline-flex rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-950">Back to Platform</Link>
        </header>

        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <ul className="space-y-3 text-sm text-slate-700">
            <li>Human approval required before merge.</li>
            <li>Secrets never exposed to AI-generated code.</li>
            <li>Production deploy requires explicit approval.</li>
            <li>Role-based controls required before multi-user launch.</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
