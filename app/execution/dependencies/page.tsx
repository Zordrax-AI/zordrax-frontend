"use client";

import Link from "next/link";
import { toExecutionTasks } from "../../../lib/zordrax-execution-store";

export default function DependenciesPage() {
  const tasks = toExecutionTasks();

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl bg-slate-950 p-6 text-white">
          <h1 className="text-3xl font-bold">Dependency Graph</h1>
          <p className="mt-2 text-sm text-slate-300">
            Blocked tasks and upstream dependencies.
          </p>
          <Link
            href="/execution"
            className="mt-4 inline-flex rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-950"
          >
            Back
          </Link>
        </header>

        <section className="grid gap-4">
          {tasks.map((task) => (
            <div key={task.id} className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-xs text-slate-500">
                    {task.id} to {task.repo}
                  </p>

                  <h2 className="mt-1 text-xl font-bold">{task.title}</h2>

                  <p className="mt-1 text-sm text-slate-600">
                    {task.description}
                  </p>
                </div>

                <span
                  className={
                    task.blocked_by.length > 0
                      ? "rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700"
                      : "rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700"
                  }
                >
                  {task.blocked_by.length > 0 ? "Blocked" : "Unblocked"}
                </span>
              </div>

              <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm">
                <b>Depends on:</b>{" "}
                {task.blocked_by.length > 0
                  ? task.blocked_by.join(", ")
                  : "None"}
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
