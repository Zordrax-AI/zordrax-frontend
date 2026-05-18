"use client";

import { useEffect, useMemo, useState } from "react";
import { getLiveTaskStatus, startLiveTask } from "@/lib/zordrax-live-status-client";

type QueueTask = {
  id: string;
  title: string;
  description: string;
  repo: string;
  status: string;
  run_id?: string;
  pr_url?: string;
  branch?: string;
  validation_status?: string;
  logs?: string[];
};

const terminal = new Set(["pr_created", "completed", "failed"]);
const stages = ["queued", "running", "cloning", "branching", "patching", "committing", "creating_pr", "pr_created"];

function boardItems(): any[] {
  if (typeof window === "undefined") return [];
  const keys = ["zordrax.product.board.items", "zordrax-product-board-items", "productBoardItems"];
  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }
  return [];
}

function saveBack(tasks: QueueTask[]) {
  try {
    const raw = localStorage.getItem("zordrax.product.board.items");
    if (!raw) return;
    const items = JSON.parse(raw);
    if (!Array.isArray(items)) return;

    const updated = items.map((item: any) => {
      const task = tasks.find((x) => x.id === item.id);
      if (!task) return item;
      return {
        ...item,
        status: task.status === "pr_created" ? "PRPending" : task.status === "failed" ? "Blocked" : "ReleasedToAI",
        ai_run_id: task.run_id,
        ai_build_id: task.run_id,
        pr_url: task.pr_url || undefined,
        message: `${task.status} | branch: ${task.branch || "pending"} | validation: ${task.validation_status || "pending"}`,
      };
    });

    localStorage.setItem("zordrax.product.board.items", JSON.stringify(updated));
  } catch {}
}

function norm(item: any): QueueTask {
  return {
    id: item.id || item.task_id || "unknown-task",
    title: item.title || "Untitled task",
    description: item.description || item.deliverables || item.acceptance_criteria || item.title || "",
    repo: item.repo || "onboarding-repo",
    status: item.status === "Ready" || item.status === "Draft" ? "not_started" : item.status || "not_started",
    run_id: item.ai_run_id || item.run_id || item.ai_build_id || undefined,
    pr_url: item.pr_url || undefined,
    branch: item.branch || undefined,
    validation_status: item.validation_status || undefined,
    logs: item.logs || [],
  };
}

function badge(status: string) {
  if (status === "pr_created" || status === "completed") return "bg-emerald-100 text-emerald-800 ring-emerald-200";
  if (status === "failed" || status === "Blocked") return "bg-red-100 text-red-800 ring-red-200";
  if (["queued", "running", "cloning", "branching", "patching", "committing", "creating_pr"].includes(status)) return "bg-blue-100 text-blue-800 ring-blue-200";
  return "bg-slate-100 text-slate-700 ring-slate-200";
}

function stageDone(status: string, stage: string) {
  if (status === "pr_created" || status === "completed") return true;
  const c = stages.indexOf(status);
  const s = stages.indexOf(stage);
  return c >= s && s >= 0;
}

export default function ExecutionQueuePage() {
  const [tasks, setTasks] = useState<QueueTask[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [message, setMessage] = useState("Load queued tasks, execute, then refresh live status.");
  const [busy, setBusy] = useState("");
  const [auto, setAuto] = useState(false);

  useEffect(() => {
    const loaded = boardItems().filter((x: any) => x.type === "Task").map(norm);
    setTasks(loaded);
    if (loaded[0]) setSelectedId(loaded[0].id);
  }, []);

  useEffect(() => {
    if (!auto) return;
    const timer = window.setInterval(() => refreshAll(false), 5000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, tasks]);

  const selected = useMemo(() => tasks.find((x) => x.id === selectedId) || tasks[0], [tasks, selectedId]);
  const stats = useMemo(() => ({
    total: tasks.length,
    running: tasks.filter((x) => x.run_id && !terminal.has(x.status)).length,
    prs: tasks.filter((x) => x.pr_url || x.status === "pr_created").length,
    failed: tasks.filter((x) => x.status === "failed" || x.status === "Blocked").length,
  }), [tasks]);

  async function execute(task: QueueTask) {
    setBusy(task.id);
    setMessage(`Starting ${task.id}...`);
    try {
      const start = await startLiveTask({
        task_id: task.id,
        title: task.title,
        description: task.description,
        repo: task.repo,
        mode: "autonomous_pr",
        requested_by: "founder",
      });
      const next = tasks.map((x) => x.id === task.id ? {
        ...x,
        status: start.status,
        run_id: start.run_id,
        branch: start.branch,
        validation_status: start.validation_status,
        pr_url: start.pr_url || undefined,
        logs: start.logs,
      } : x);
      setTasks(next);
      saveBack(next);
      setSelectedId(task.id);
      setMessage(`Started ${task.id}: ${start.run_id}`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Execution failed.");
    } finally {
      setBusy("");
    }
  }

  async function refresh(task: QueueTask, show = true) {
    if (!task.run_id) {
      if (show) setMessage(`${task.id} has no run id yet.`);
      return;
    }
    try {
      const s = await getLiveTaskStatus(task.run_id);
      const next = tasks.map((x) => x.id === task.id ? {
        ...x,
        status: s.status,
        branch: s.branch,
        validation_status: s.validation_status,
        pr_url: s.pr_url || undefined,
        logs: s.logs,
      } : x);
      setTasks(next);
      saveBack(next);
      if (show) setMessage(`Refreshed ${task.id}: ${s.status}`);
    } catch (e) {
      if (show) setMessage(e instanceof Error ? e.message : "Refresh failed.");
    }
  }

  async function refreshAll(show = true) {
    const active = tasks.filter((x) => x.run_id && !terminal.has(x.status));
    if (!active.length) {
      if (show) setMessage("No active runs to refresh.");
      return;
    }

    let next = [...tasks];
    for (const task of active) {
      try {
        const s = await getLiveTaskStatus(task.run_id!);
        next = next.map((x) => x.id === task.id ? {
          ...x,
          status: s.status,
          branch: s.branch,
          validation_status: s.validation_status,
          pr_url: s.pr_url || undefined,
          logs: s.logs,
        } : x);
      } catch {
        next = next.map((x) => x.id === task.id ? { ...x, status: "status_error" } : x);
      }
    }
    setTasks(next);
    saveBack(next);
    if (show) setMessage("Live statuses refreshed.");
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl bg-slate-950 p-6 text-white">
          <p className="text-sm font-bold text-cyan-300">Zordrax Live Runtime</p>
          <h1 className="mt-2 text-3xl font-bold">Execution Queue</h1>
          <p className="mt-2 text-sm text-slate-300">Watch clone, branch, patch, commit, PR creation, and approval.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button onClick={() => refreshAll()} className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950">Refresh Active Runs</button>
            <button onClick={() => setAuto((x) => !x)} className={`rounded-xl px-5 py-3 text-sm font-bold ${auto ? "bg-emerald-400 text-slate-950" : "bg-white text-slate-950"}`}>Auto Refresh: {auto ? "On" : "Off"}</button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Total</p><p className="mt-1 text-3xl font-bold">{stats.total}</p></div>
          <div className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Running</p><p className="mt-1 text-3xl font-bold">{stats.running}</p></div>
          <div className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">PRs</p><p className="mt-1 text-3xl font-bold">{stats.prs}</p></div>
          <div className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Failed</p><p className="mt-1 text-3xl font-bold">{stats.failed}</p></div>
        </section>

        <section className="rounded-2xl bg-white p-4 text-sm text-slate-700 shadow-sm">{message}</section>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase">Task</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase">Repo</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase">Run</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase">PR</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} className={`border-t border-slate-200 ${selectedId === task.id ? "bg-cyan-50" : ""}`}>
                  <td className="px-4 py-4">
                    <button onClick={() => setSelectedId(task.id)} className="text-left">
                      <p className="font-bold">{task.title}</p>
                      <p className="font-mono text-xs text-slate-500">{task.id}</p>
                    </button>
                  </td>
                  <td className="px-4 py-4">{task.repo}</td>
                  <td className="px-4 py-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${badge(task.status)}`}>{task.status}</span></td>
                  <td className="px-4 py-4"><p className="font-mono text-xs">{task.run_id || "-"}</p><p className="font-mono text-xs text-slate-500">{task.branch || "branch pending"}</p></td>
                  <td className="px-4 py-4">{task.pr_url ? <a href={task.pr_url} target="_blank" className="font-bold text-blue-700">Open PR</a> : <span className="text-slate-400">No PR yet</span>}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => execute(task)} disabled={busy === task.id} className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{task.run_id ? "Restart" : "Execute"}</button>
                      <button onClick={() => refresh(task)} className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-bold text-white">Refresh</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!tasks.length && <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">No task rows found. Load tasks in Product Board first.</td></tr>}
            </tbody>
          </table>
        </section>

        {selected && (
          <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <h2 className="text-xl font-bold">Live Build Sequence</h2>
              <div className="mt-5 space-y-3">
                {stages.map((stage) => (
                  <div key={stage} className="flex items-center gap-3">
                    <div className={`h-4 w-4 rounded-full ${stageDone(selected.status, stage) ? "bg-emerald-500" : "bg-slate-300"}`} />
                    <div className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-sm font-bold capitalize">{stage.replace("_", " ")}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl bg-slate-950 p-5 text-white shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Runtime Logs</h2>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${badge(selected.status)}`}>{selected.status}</span>
              </div>
              <pre className="mt-4 max-h-[520px] overflow-auto whitespace-pre-wrap rounded-2xl bg-black/30 p-4 text-xs">{(selected.logs || ["No logs yet. Click Execute or Refresh."]).join("\n")}</pre>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
