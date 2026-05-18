import Link from "next/link";

const cards = [
  {
    title: "Projects",
    href: "/platform/projects",
    desc: "Manage active delivery projects like Zordrax-Analytica.",
    status: "Active",
  },
  {
    title: "Project Templates",
    href: "/platform/templates",
    desc: "ERP, Data Platform, BI, Governance, AI Copilot templates.",
    status: "Draft",
  },
  {
    title: "Repo Templates",
    href: "/platform/repos",
    desc: "Define repo structures per project type.",
    status: "Draft",
  },
  {
    title: "Branch Rules",
    href: "/platform/branches",
    desc: "Control AI branch creation and PR policies.",
    status: "Required",
  },
  {
    title: "DevOps Automation",
    href: "/platform/devops",
    desc: "Create DevOps projects, repos, pipelines and boards.",
    status: "Next",
  },
  {
    title: "Security",
    href: "/platform/security",
    desc: "Approval gates, environment controls, secret rules.",
    status: "Next",
  },
  {
    title: "Roles",
    href: "/platform/roles",
    desc: "Founder, Admin, Reviewer, DevOps Lead, Customer roles.",
    status: "Next",
  },
  {
    title: "Dependencies",
    href: "/platform/dependencies",
    desc: "Task dependency engine and execution ordering.",
    status: "Next",
  },
  {
    title: "Status",
    href: "/platform/status",
    desc: "Platform readiness, completion and risk dashboard.",
    status: "Live",
  },
];

export default function PlatformPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl bg-slate-950 p-6 text-white">
          <p className="text-sm text-cyan-200">Zordrax-Analytica</p>
          <h1 className="mt-2 text-3xl font-bold">Platform Control Center</h1>
          <p className="mt-2 max-w-4xl text-sm text-slate-300">
            Manage project templates, repo templates, branch rules, DevOps automation,
            persistent storage, role controls, dependencies, and project status.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-bold text-slate-950" href="/product-board">
              Product Board
            </Link>
            <Link className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-950" href="/orchestrator">
              AI Orchestrator
            </Link>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {cards.map((card) => (
            <Link key={card.href} href={card.href} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md">
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-xl font-bold">{card.title}</h2>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                  {card.status}
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-600">{card.desc}</p>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
