"use client";
import Link from "next/link";
import { toExecutionTasks } from "../../../lib/zordrax-execution-store";

export default function PRLinksPage() {
  const tasks = toExecutionTasks();
  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl bg-slate-950 p-6 text-white"><h1 className="text-3xl font-bold">PR Links</h1><p className="mt-2 text-sm text-slate-300">GitHub PRs for frontend and Azure DevOps PRs for backend.</p><Link className="mt-4 inline-flex rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-950" href="/execution">Back</Link></header>
        <section className="grid gap-4">{tasks.map((task) => <div key={task.id} className="rounded-2xl bg-white p-5 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="font-mono text-xs text-slate-500">{task.id} • {task.pr_provider}</p><h2 className="text-xl font-bold">{task.title}</h2><p className="text-sm text-slate-500">PR status: {task.pr_status}</p></div><a className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white" href={task.pr_url || task.devops_url || "#"}>{task.pr_url || task.devops_url ? "Open PR" : "No PR yet"}</a></div></div>)}</section>
      </div>
    </main>
  );
}
