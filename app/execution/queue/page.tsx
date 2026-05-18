"use client";
import Link from "next/link";
import { toExecutionTasks, summary } from "../../../lib/zordrax-execution-store";

export default function ExecutionQueuePage() {
  const tasks = toExecutionTasks();
  const stats = summary(tasks);
  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl bg-slate-950 p-6 text-white"><h1 className="text-3xl font-bold">Execution Queue</h1><p className="mt-2 text-sm text-slate-300">Ordered AI implementation queue.</p><Link className="mt-4 inline-flex rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-950" href="/execution">Back</Link></header>
        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">Total</p><p className="text-3xl font-bold">{stats.total}</p></div>
          <div className="rounded-2xl bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">Running</p><p className="text-3xl font-bold">{stats.running}</p></div>
          <div className="rounded-2xl bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">Blocked</p><p className="text-3xl font-bold">{stats.blocked}</p></div>
          <div className="rounded-2xl bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">Avg Confidence</p><p className="text-3xl font-bold">{stats.avgConfidence}%</p></div>
        </section>
        <section className="overflow-x-auto rounded-2xl bg-white shadow-sm">
          <table className="min-w-full text-sm"><thead className="bg-slate-100"><tr><th className="px-4 py-3 text-left">Queue</th><th className="px-4 py-3 text-left">Task</th><th className="px-4 py-3 text-left">Repo</th><th className="px-4 py-3 text-left">Agent</th><th className="px-4 py-3 text-left">Sandbox</th><th className="px-4 py-3 text-left">Status</th></tr></thead>
            <tbody className="divide-y">{tasks.map((task) => <tr key={task.id}><td className="px-4 py-3 font-bold">{task.queue_position}</td><td className="px-4 py-3"><b>{task.title}</b><br/><span className="font-mono text-xs text-slate-500">{task.id}</span></td><td className="px-4 py-3">{task.repo}</td><td className="px-4 py-3">{task.agent}</td><td className="px-4 py-3 font-mono text-xs">{task.sandbox}</td><td className="px-4 py-3">{task.pipeline_status}</td></tr>)}</tbody>
          </table>
        </section>
      </div>
    </main>
  );
}
