"use client";

import { useEffect, useState } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_ONBOARDING_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://zordrax-onboarding-agent.greenground-d9556cdb.uksouth.azurecontainerapps.io";

type QueueTask = {
  id: string;
  title: string;
  repo: string;
  status: string;
  run_id?: string;
  pr_url?: string;
  logs?: string[];
};

export default function ExecutionQueuePage() {
  const [tasks, setTasks] = useState<QueueTask[]>([]);
  const [message, setMessage] = useState("Execution queue loaded.");

  useEffect(() => {
    const raw = localStorage.getItem("zordrax.product.board.items");
    const items = raw ? JSON.parse(raw) : [];

    const released = items
      .filter((x: any) => x.type === "Task" && ["ReleasedToAI", "Ready", "Draft"].includes(x.status || "Draft"))
      .map((x: any) => ({
        id: x.id,
        title: x.title,
        repo: x.repo || "onboarding-repo",
        status: x.ai_run_id ? "running" : "not_started",
        run_id: x.ai_run_id,
        pr_url: x.pr_url,
        logs: [],
      }));

    setTasks(released);
  }, []);

  async function executeTask(task: QueueTask) {
    setMessage(`Starting ${task.id}...`);

    const response = await fetch(`${API_BASE}/orchestrate/live-task/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        task_id: task.id,
        title: task.title,
        description: `Execute task ${task.id}: ${task.title}`,
        repo: task.repo,
        mode: "autonomous_pr",
        requested_by: "founder",
      }),
    });

    const start = await response.json();

    if (!response.ok) {
      setMessage(start.detail || "Execution start failed.");
      return;
    }

    setTasks((current) =>
      current.map((x) =>
        x.id === task.id
          ? { ...x, status: "running", run_id: start.run_id, logs: start.logs }
          : x
      )
    );

    setMessage(`Started ${task.id}: ${start.run_id}`);
  }

  async function refreshTask(task: QueueTask) {
    if (!task.run_id) {
      setMessage("No run id yet.");
      return;
    }

    const response = await fetch(`${API_BASE}/orchestrate/live-task/status/${task.run_id}`);
    const status = await response.json();

    if (!response.ok) {
      setMessage(status.detail || "Status refresh failed.");
      return;
    }

    setTasks((current) =>
      current.map((x) =>
        x.id === task.id
          ? {
              ...x,
              status: status.status,
              pr_url: status.pr_url,
              logs: status.logs,
            }
          : x
      )
    );

    setMessage(`Refreshed ${task.id}: ${status.status}`);
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl bg-slate-950 p-6 text-white">
          <h1 className="text-3xl font-bold">Execution Queue</h1>
          <p className="mt-2 text-sm text-slate-300">
            Start live AI task execution and poll backend runtime status.
          </p>
        </header>

        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-600">{message}</p>
        </section>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase">Task</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase">Repo</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase">Run ID</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase">PR</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase">Actions</th>
              </tr>
            </thead>

            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} className="border-t border-slate-200">
                  <td className="px-4 py-4">
                    <p className="font-bold">{task.title}</p>
                    <p className="font-mono text-xs text-slate-500">{task.id}</p>
                  </td>

                  <td className="px-4 py-4">{task.repo}</td>
                  <td className="px-4 py-4 font-bold">{task.status}</td>
                  <td className="px-4 py-4 font-mono text-xs">{task.run_id || "-"}</td>

                  <td className="px-4 py-4">
                    {task.pr_url ? (
                      <a href={task.pr_url} target="_blank" className="font-bold text-blue-700">
                        Open PR
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => executeTask(task)}
                        className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white"
                      >
                        Execute
                      </button>

                      <button
                        onClick={() => refreshTask(task)}
                        className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-bold text-white"
                      >
                        Refresh
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {tasks.map((task) =>
          task.logs?.length ? (
            <section key={`${task.id}-logs`} className="rounded-3xl bg-slate-950 p-5 text-white">
              <h2 className="font-bold">{task.id} logs</h2>
              <pre className="mt-3 whitespace-pre-wrap text-xs">{task.logs.join("\n")}</pre>
            </section>
          ) : null
        )}
      </div>
    </main>
  );
}
