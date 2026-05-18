import Link from "next/link";
import { phaseBCards } from "../../lib/zordrax-execution-store";

export default function ExecutionPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl bg-slate-950 p-6 text-white">
          <p className="text-sm text-cyan-200">Zordrax-Analytica</p>
          <h1 className="mt-2 text-3xl font-bold">Phase B/C Execution Control</h1>
          <p className="mt-2 max-w-4xl text-sm text-slate-300">Control dependencies, queue execution, PRs, pipelines, swarm agents, sandboxes, remediation, confidence and merge automation.</p>
        </header>
        <section className="grid gap-4 md:grid-cols-3">
          {phaseBCards.map((card) => (
            <Link key={card.href} href={card.href} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md">
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-xl font-bold">{card.title}</h2>
                <span className={card.phase === "B" ? "rounded-full bg-cyan-100 px-3 py-1 text-xs font-bold text-cyan-800" : "rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-800"}>Phase {card.phase}</span>
              </div>
              <p className="mt-3 text-sm text-slate-600">{card.desc}</p>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
