"use client";
import Link from "next/link";
import { toExecutionTasks, summary } from "../../../lib/zordrax-execution-store";

export default function Page() {
  const tasks = toExecutionTasks();
  const stats = summary(tasks);
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl bg-purple-950 p-6 text-white">
          <h1 className="text-3xl font-bold">Merge Confidence Scoring</h1>
          <p className="mt-2 text-sm text-purple-100">Score based on tests, dependencies, PR state and remediation history.</p>
          <Link className="mt-4 inline-flex rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-950" href="/swarm">Back to Swarm</Link>
        </header>
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Average Confidence</p>
          <p className="text-5xl font-bold">{stats.avgConfidence}%</p>
        </section>
        <section className="grid gap-4 md:grid-cols-2">
          {tasks.map((task) => (
            <div key={task.id} className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="font-mono text-xs text-slate-500">{task.id} • {task.repo}</p>
              <h2 className="mt-1 text-lg font-bold">{task.title}</h2>
              <p className="mt-2 text-sm text-slate-600">Agent: {task.agent}</p>
              <p className="mt-1 text-sm text-slate-600">Sandbox: {task.sandbox}</p>
              <p className="mt-1 text-sm text-slate-600">Pipeline: {task.pipeline_status}</p>
              <div className="mt-4 h-3 rounded-full bg-slate-200">
                <div className="h-3 rounded-full bg-purple-600" style={{ width: `${task.confidence}%` }} />
              </div>
              <p className="mt-2 text-sm text-slate-600">{task.confidence}% confidence</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
