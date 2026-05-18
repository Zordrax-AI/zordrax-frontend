import Link from "next/link";

const templates = [
  "Zordrax-Analytica SaaS",
  "ERP Implementation",
  "Data Warehouse Migration",
  "Governance Framework",
  "BI Reporting Platform",
  "AI Copilot Platform",
];

export default function PlatformTemplatesPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl bg-slate-950 p-6 text-white">
          <h1 className="text-3xl font-bold">Project Templates</h1>
          <p className="mt-2 text-sm text-slate-300">Reusable project blueprints for future delivery programs.</p>
          <Link href="/platform" className="mt-4 inline-flex rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-950">
            Back to Platform
          </Link>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {templates.map((template) => (
            <div key={template} className="rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="text-xl font-bold">{template}</h2>
              <p className="mt-2 text-sm text-slate-600">
                Includes default epics, features, stories, repos, branch rules, approval gates and AI task structure.
              </p>
              <span className="mt-4 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                Template Draft
              </span>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
