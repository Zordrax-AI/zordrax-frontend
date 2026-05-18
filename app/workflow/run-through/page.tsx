import Link from "next/link";

const scenario = [
  {
    title: "Create or confirm project",
    where: "/platform/projects",
    details: "Use Zordrax-Analytica as the active project. This project defines the SaaS scope and repo set.",
  },
  {
    title: "Create backlog structure",
    where: "/product-board/load",
    details: "Load Epic, Feature, Story, and Task rows. Validate the rows and ensure every Task has a Story parent.",
  },
  {
    title: "Push backlog to DevOps",
    where: "/product-board/load",
    details: "Select all rows and click Push Selected to DevOps. This creates DevOps work items only; it does not build code.",
  },
  {
    title: "Check task order",
    where: "/execution/queue",
    details: "Confirm backend tasks run before frontend tasks if the frontend depends on the API.",
  },
  {
    title: "Dry-run first",
    where: "/product-board/load",
    details: "Set ai_execution_mode to proposal_only and release one small Task. This proves the AI route works safely.",
  },
  {
    title: "Real implementation",
    where: "/product-board/load",
    details: "Set ai_execution_mode to autonomous_pr and release the Task again. The orchestrator should create a real PR.",
  },
  {
    title: "Watch AI build",
    where: "/orchestrator",
    details: "Watch planner, coder, QA, remediation and PR steps. Failed tests should feed remediation.",
  },
  {
    title: "Review PR",
    where: "/execution/prs",
    details: "Open the PR. Frontend tasks should create GitHub PRs. Backend tasks should create Azure DevOps PRs.",
  },
  {
    title: "Approve and merge",
    where: "/swarm/merge",
    details: "Only merge after human approval, green tests, and acceptable confidence.",
  },
  {
    title: "Track completion",
    where: "/product-board/status",
    details: "The item should move through ReleasedToAI, PRPending, Done, or Blocked.",
  },
];

export default function RunThroughPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl bg-slate-950 p-6 text-white">
          <p className="text-sm text-cyan-200">Example Scenario</p>
          <h1 className="mt-2 text-3xl font-bold">Build a Zordrax SaaS Feature</h1>
          <p className="mt-2 max-w-4xl text-sm text-slate-300">
            Scenario: build the Customer Onboarding Requirements Capture capability using the product board,
            DevOps backlog, AI Orchestrator, QA, PR approval, and deployment flow.
          </p>
          <Link href="/workflow" className="mt-4 inline-flex rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-950">
            Back to Workflow
          </Link>
        </header>

        <section className="grid gap-4">
          {scenario.map((step, index) => (
            <div key={step.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-bold text-white">
                    Step {index + 1}
                  </span>
                  <h2 className="mt-3 text-xl font-bold">{step.title}</h2>
                  <p className="mt-2 text-sm text-slate-600">{step.details}</p>
                  <p className="mt-2 font-mono text-xs text-slate-500">{step.where}</p>
                </div>

                <Link href={step.where} className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-bold text-white">
                  Open Page
                </Link>
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
