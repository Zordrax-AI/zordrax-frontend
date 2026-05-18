import Link from "next/link";

const repos = [
  "onboarding-repo",
  "zordrax-frontend",
  "infra-repo",
  "etl-repo",
  "governance-repo",
  "bi-repo",
];

export default function PlatformReposPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl bg-slate-950 p-6 text-white">
          <h1 className="text-3xl font-bold">Repo Templates</h1>
          <p className="mt-2 text-sm text-slate-300">Define repo structure per project type.</p>
          <Link href="/platform" className="mt-4 inline-flex rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-950">Back to Platform</Link>
        </header>
        <section className="grid gap-4 md:grid-cols-3">
          {repos.map((repo) => (
            <div key={repo} className="rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="text-xl font-bold">{repo}</h2>
              <p className="mt-2 text-sm text-slate-600">Mapped to Zordrax SaaS delivery architecture.</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
