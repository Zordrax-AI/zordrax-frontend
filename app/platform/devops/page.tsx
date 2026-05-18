import Link from "next/link";

export default function PlatformDevOpsPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl bg-slate-950 p-6 text-white">
          <h1 className="text-3xl font-bold">DevOps Automation</h1>
          <p className="mt-2 text-sm text-slate-300">Future automation for projects, repos, boards, pipelines and environments.</p>
          <Link href="/platform" className="mt-4 inline-flex rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-950">Back to Platform</Link>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          {[
            "Create Azure DevOps Project",
            "Create GitHub Repo",
            "Create Azure DevOps Repo",
            "Create Build Pipelines",
            "Create Variable Groups",
            "Create Work Item Board",
            "Create Environments",
            "Create Branch Policies"
          ].map((item) => (
            <div key={item} className="rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="font-bold">{item}</h2>
              <p className="mt-2 text-sm text-slate-600">Planned automation capability.</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
