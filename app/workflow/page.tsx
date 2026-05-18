import Link from "next/link";

const steps = [
  {
    step: "01",
    phase: "Plan",
    title: "Select Project",
    href: "/platform/projects",
    action: "Confirm Zordrax-Analytica is the active project.",
    output: "Project scope, repos, rules, and delivery model confirmed.",
  },
  {
    step: "02",
    phase: "Plan",
    title: "Define Backlog",
    href: "/product-board",
    action: "Review Epics, Features, Stories, and Tasks.",
    output: "Clear product hierarchy and implementation breakdown.",
  },
  {
    step: "03",
    phase: "Plan",
    title: "Bulk Load Tasks",
    href: "/product-board/load",
    action: "Paste table, CSV, Excel, or JSON. Validate rows and remove duplicates.",
    output: "Clean backlog ready for DevOps and AI execution.",
  },
  {
    step: "04",
    phase: "Push",
    title: "Push to DevOps",
    href: "/product-board/load",
    action: "Select rows and click Push Selected to DevOps.",
    output: "Azure DevOps work items created for backlog tracking.",
  },
  {
    step: "05",
    phase: "Execute",
    title: "Check Execution Queue",
    href: "/execution/queue",
    action: "Check task order, dependencies, repo, agent, and sandbox state.",
    output: "You know what can run next and what is blocked.",
  },
  {
    step: "06",
    phase: "Execute",
    title: "Release Task to AI",
    href: "/product-board/load",
    action: "Select Task rows and click Release Selected Tasks to AI.",
    output: "AI build ID created and task moves to ReleasedToAI.",
  },
  {
    step: "07",
    phase: "Execute",
    title: "Watch Orchestrator",
    href: "/orchestrator",
    action: "Monitor Planner, Coder, QA, Remediation, and PR agents.",
    output: "Proposal or PR is created depending on task execution mode.",
  },
  {
    step: "08",
    phase: "Review",
    title: "Review PRs",
    href: "/execution/prs",
    action: "Open GitHub or Azure DevOps PRs.",
    output: "Human reviews generated code before merge.",
  },
  {
    step: "09",
    phase: "Review",
    title: "Approve / Merge",
    href: "/swarm/merge",
    action: "Check confidence, QA status, and approval gates.",
    output: "Approved PR can be merged and deployed.",
  },
  {
    step: "10",
    phase: "Track",
    title: "Track Progress",
    href: "/product-board/status",
    action: "Review done, blocked, released, PR pending, and overall completion.",
    output: "Project progress is visible.",
  },
];

function phaseClass(phase: string) {
  if (phase === "Plan") return "bg-cyan-100 text-cyan-800";
  if (phase === "Push") return "bg-blue-100 text-blue-800";
  if (phase === "Execute") return "bg-purple-100 text-purple-800";
  if (phase === "Review") return "bg-amber-100 text-amber-800";
  return "bg-emerald-100 text-emerald-800";
}

export default function WorkflowPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl bg-slate-950 p-6 text-white">
          <p className="text-sm text-cyan-200">Zordrax-Analytica</p>
          <h1 className="mt-2 text-3xl font-bold">AI Delivery Workflow</h1>
          <p className="mt-2 max-w-4xl text-sm text-slate-300">
            Follow this sequence every time: Plan the work, push it to DevOps, release selected tasks to AI,
            review PRs, approve merges, and track completion.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/workflow/run-through" className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950">
              Open Scenario Run-through
            </Link>
            <Link href="/product-board/load" className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-950">
              Start Bulk Load
            </Link>
          </div>
        </header>

        <section className="grid gap-4">
          {steps.map((item) => (
            <Link
              key={item.step}
              href={item.href}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-bold text-white">
                      {item.step}
                    </span>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${phaseClass(item.phase)}`}>
                      {item.phase}
                    </span>
                  </div>

                  <h2 className="mt-3 text-xl font-bold">{item.title}</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    <b>Action:</b> {item.action}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    <b>Output:</b> {item.output}
                  </p>
                </div>

                <span className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700">
                  Open
                </span>
              </div>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
