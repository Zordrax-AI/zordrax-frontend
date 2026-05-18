import Link from "next/link";

export default function PlatformDependenciesPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl bg-slate-950 p-6 text-white">
          <h1 className="text-3xl font-bold">Task Dependency Engine</h1>
          <p className="mt-2 text-sm text-slate-300">Control task sequencing before AI execution.</p>
          <Link href="/platform" className="mt-4 inline-flex rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-950">Back to Platform</Link>
        </header>

        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">Execution Rules</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-700">
            <li>Task B cannot start until Task A is done.</li>
            <li>Frontend tasks can wait for backend API tasks.</li>
            <li>Deploy tasks wait for PR approval.</li>
            <li>Blocked tasks require human intervention or remediation agent.</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
