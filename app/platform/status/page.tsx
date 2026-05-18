import Link from "next/link";

export default function PlatformStatusPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl bg-slate-950 p-6 text-white">
          <h1 className="text-3xl font-bold">Platform Status</h1>
          <p className="mt-2 text-sm text-slate-300">Readiness view for the autonomous delivery platform.</p>
          <Link href="/platform" className="mt-4 inline-flex rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-950">Back to Platform</Link>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">AI Orchestrator</p><p className="text-2xl font-bold text-emerald-700">Built</p></div>
          <div className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Product Board</p><p className="text-2xl font-bold text-emerald-700">Built</p></div>
          <div className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Full SaaS Product</p><p className="text-2xl font-bold text-amber-700">In Build</p></div>
          <div className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Persistent DB</p><p className="text-2xl font-bold text-red-700">Pending</p></div>
          <div className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">RBAC</p><p className="text-2xl font-bold text-red-700">Pending</p></div>
          <div className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">DevOps Project Factory</p><p className="text-2xl font-bold text-amber-700">Next</p></div>
        </section>
      </div>
    </main>
  );
}
