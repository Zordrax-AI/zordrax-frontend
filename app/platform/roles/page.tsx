import Link from "next/link";

const roles = ["Founder", "Platform Admin", "AI Reviewer", "DevOps Lead", "Data Engineer", "BI Developer", "Governance Lead", "Customer", "Viewer"];

export default function PlatformRolesPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl bg-slate-950 p-6 text-white">
          <h1 className="text-3xl font-bold">Roles & Access</h1>
          <p className="mt-2 text-sm text-slate-300">Future RBAC model for Zordrax.</p>
          <Link href="/platform" className="mt-4 inline-flex rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-950">Back to Platform</Link>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {roles.map((role) => (
            <div key={role} className="rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="font-bold">{role}</h2>
              <p className="mt-2 text-sm text-slate-600">Access rules to be mapped to actions and approvals.</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
