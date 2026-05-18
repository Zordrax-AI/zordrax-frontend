import Link from "next/link";

export default function PlatformBranchesPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl bg-slate-950 p-6 text-white">
          <h1 className="text-3xl font-bold">Branch Creation Rules</h1>
          <p className="mt-2 text-sm text-slate-300">AI safety rules for GitHub and Azure DevOps branches.</p>
          <Link href="/platform" className="mt-4 inline-flex rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-950">Back to Platform</Link>
        </header>

        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">Rules</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-700">
            <li>AI can never push directly to main.</li>
            <li>AI must create ai/* or zx/ai-* branches.</li>
            <li>Every AI branch requires a PR.</li>
            <li>Human approval is required before merge.</li>
            <li>Frontend PRs go to GitHub for Vercel deployment.</li>
            <li>Backend/onboarding PRs go through Azure DevOps.</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
