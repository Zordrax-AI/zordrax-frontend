import Link from "next/link";

const flow = [
  {
    step: "01",
    title: "Select Task",
    desc: "Choose one approved Product Board task.",
    href: "/product-board/load",
    status: "User action",
  },
  {
    step: "02",
    title: "Release to AI",
    desc: "Send task to backend execution runtime.",
    href: "/product-board/load",
    status: "Starts run",
  },
  {
    step: "03",
    title: "AI Plans Build",
    desc: "Planner decides repo, branch, files, and validation.",
    href: "/execution/queue",
    status: "AI stage",
  },
  {
    step: "04",
    title: "Repo Patch",
    desc: "Agent creates branch and modifies repo files.",
    href: "/execution/prs",
    status: "Code stage",
  },
  {
    step: "05",
    title: "Run Tests",
    desc: "Backend runs pytest, npm build, or repo validation.",
    href: "/execution/pipelines",
    status: "QA stage",
  },
  {
    step: "06",
    title: "Create PR",
    desc: "GitHub PR for frontend or Azure DevOps PR for backend.",
    href: "/execution/prs",
    status: "Review stage",
  },
  {
    step: "07",
    title: "Human Approval",
    desc: "You review, approve, and merge the PR.",
    href: "/product-board/approvals",
    status: "Founder gate",
  },
  {
    step: "08",
    title: "Deploy + Track",
    desc: "Pipeline/Vercel deploys and task status is updated.",
    href: "/product-board/status",
    status: "Done",
  },
];

export default function OrchestratorPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">

        <header className="rounded-3xl bg-slate-950 p-6 text-white">
          <p className="text-sm font-bold text-cyan-300">
            Zordrax-Analytica AI Orchestrator
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Autonomous Build Control Centre
          </h1>

          <p className="mt-3 max-w-4xl text-sm text-slate-300">
            This page shows the simple execution sequence: select a task, release it to AI,
            let the backend create a branch/patch/test/PR, then you approve and merge.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/product-board/load"
              className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950"
            >
              Start: Select Task
            </Link>

            <Link
              href="/execution/queue"
              className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-950"
            >
              View Execution Queue
            </Link>

            <Link
              href="/execution/prs"
              className="rounded-xl border border-white/30 px-5 py-3 text-sm font-bold text-white"
            >
              View PRs
            </Link>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Current Mode</p>
            <p className="mt-1 text-2xl font-bold">Task → PR</p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Human Gate</p>
            <p className="mt-1 text-2xl font-bold">Required</p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Frontend PRs</p>
            <p className="mt-1 text-2xl font-bold">GitHub</p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Backend PRs</p>
            <p className="mt-1 text-2xl font-bold">Azure DevOps</p>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-cyan-700">
                Visual Build Sequence
              </p>
              <h2 className="mt-1 text-2xl font-bold">
                How one task becomes code
              </h2>
            </div>

            <Link
              href="/workflow/run-through"
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700"
            >
              Open Full Run-through
            </Link>
          </div>

          <div className="grid gap-4">
            {flow.map((item, index) => (
              <Link
                key={item.step}
                href={item.href}
                className="group grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 hover:bg-white hover:shadow-md md:grid-cols-[90px_1fr_180px]"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-white">
                    {item.step}
                  </span>

                  {index < flow.length - 1 && (
                    <span className="hidden text-2xl font-bold text-slate-300 md:block">
                      →
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-950">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {item.desc}
                  </p>
                </div>

                <div className="flex items-center md:justify-end">
                  <span className="rounded-full bg-white px-3 py-2 text-xs font-bold text-slate-700 ring-1 ring-slate-200">
                    {item.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Link href="/product-board/load" className="rounded-2xl bg-white p-5 shadow-sm hover:shadow-md">
            <h3 className="text-lg font-bold">1. Load / Select Task</h3>
            <p className="mt-2 text-sm text-slate-600">
              Use this to choose the exact task to execute.
            </p>
          </Link>

          <Link href="/execution/queue" className="rounded-2xl bg-white p-5 shadow-sm hover:shadow-md">
            <h3 className="text-lg font-bold">2. Watch Execution</h3>
            <p className="mt-2 text-sm text-slate-600">
              See task order, agent, repo, status, and validation state.
            </p>
          </Link>

          <Link href="/execution/prs" className="rounded-2xl bg-white p-5 shadow-sm hover:shadow-md">
            <h3 className="text-lg font-bold">3. Review PR</h3>
            <p className="mt-2 text-sm text-slate-600">
              Open the PR, review code, approve, merge, and deploy.
            </p>
          </Link>
        </section>

      </div>
    </main>
  );
}
