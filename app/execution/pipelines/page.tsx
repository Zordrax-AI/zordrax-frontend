"use client";
import Link from "next/link";
import { toExecutionTasks } from "../../../lib/zordrax-execution-store";

export default function PipelinesPage() {
  const tasks = toExecutionTasks();
  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl bg-slate-950 p-6 text-white"><h1 className="text-3xl font-bold">Live Pipeline Status</h1><p className="mt-2 text-sm text-slate-300">Validation, build, deploy and remediation state.</p><Link className="mt-4 inline-flex rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-950" href="/execution">Back</Link></header>
        <section className="grid gap-4 md:grid-cols-2">{tasks.map((task) => <div key={task.id} className="rounded-2xl bg-white p-5 shadow-sm"><p className="font-mono text-xs text-slate-500">{task.id}</p><h2 className="mt-1 text-lg font-bold">{task.title}</h2><div className="mt-4 h-3 rounded-full bg-slate-200"><div className="h-3 rounded-full bg-cyan-600" style={{ width: task.pipeline_status === "passed" ? "100%" : task.pipeline_status === "running" ? "60%" : task.pipeline_status === "blocked" ? "20%" : "5%" }} /></div><p className="mt-2 text-sm text-slate-600">Pipeline: {task.pipeline_status}</p></div>)}</section>
      </div>
    </main>
  );
}
