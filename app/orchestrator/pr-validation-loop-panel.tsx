"use client";

import { useEffect, useState } from "react";
import {
  approvePRLoop,
  autoFixPRLoop,
  getPRLoop,
  ingestPRLoopLogs,
  rerunPRLoop,
  startPRValidationLoop,
} from "../../lib/zordrax-pr-validation-loop-client";

type Task = { task_id?: string; agent: string; title: string; status: string; task_type?: string; repo?: string };

function statusClass(status?: string) {
  const s = (status || "").toLowerCase();
  if (s.includes("completed") || s.includes("created") || s.includes("approved") || s.includes("success")) return "bg-emerald-100 text-emerald-800 border-emerald-300";
  if (s.includes("running") || s.includes("triggered")) return "bg-blue-100 text-blue-800 border-blue-300";
  if (s.includes("failed") || s.includes("blocked") || s.includes("error")) return "bg-red-100 text-red-800 border-red-300";
  if (s.includes("waiting") || s.includes("pending")) return "bg-amber-100 text-amber-800 border-amber-300";
  return "bg-slate-100 text-slate-700 border-slate-300";
}

function JsonPanel({ value }: { value: unknown }) {
  return <pre className="max-h-96 overflow-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">{JSON.stringify(value, null, 2)}</pre>;
}

export default function PRValidationLoopPanel({ defaultGoal }: { defaultGoal: string }) {
  const [goal, setGoal] = useState(defaultGoal);
  const [repo, setRepo] = useState("onboarding-repo");
  const [loopId, setLoopId] = useState("");
  const [logText, setLogText] = useState("next build failed to compile cannot find module");
  const [state, setState] = useState<any>({ state: "not started" });
  const [busy, setBusy] = useState("");

  async function action(label: string, fn: () => Promise<any>) {
    setBusy(label);
    try {
      const response = await fn();
      if (response?.loop_id) setLoopId(response.loop_id);
      setState(response);
    } catch (err) {
      setState({ error: err instanceof Error ? err.message : "Request failed" });
    } finally {
      setBusy("");
    }
  }

  useEffect(() => {
    if (!loopId) return;
    const timer = setInterval(async () => {
      try { setState(await getPRLoop(loopId)); } catch {}
    }, 8000);
    return () => clearInterval(timer);
  }, [loopId]);

  const tasks: Task[] = state?.tasks || [];

  return (
    <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-blue-700">Autonomous Build Loop</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-950">PR + Validation + Auto-Fix Control Center</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Give Zordrax a task, watch agents create a PR, trigger validation, read failures, create a fix PR, rerun validation, and wait for your approval.
          </p>
        </div>
        <span className={`rounded-full border px-4 py-2 text-sm font-bold ${statusClass(state?.status)}`}>{state?.status || "idle"}</span>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <label className="md:col-span-2">
          <span className="text-sm font-medium">Build task</span>
          <input className="mt-1 w-full rounded-2xl border border-slate-300 p-3" value={goal} onChange={(e) => setGoal(e.target.value)} />
        </label>
        <label>
          <span className="text-sm font-medium">Target repo</span>
          <select className="mt-1 w-full rounded-2xl border border-slate-300 p-3" value={repo} onChange={(e) => setRepo(e.target.value)}>
            <option value="onboarding-repo">onboarding-repo</option>
            <option value="frontend-repo">frontend-repo</option>
            <option value="infra-repo">infra-repo</option>
            <option value="governance-repo">governance-repo</option>
          </select>
        </label>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-5">
        <button disabled={!!busy} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white disabled:opacity-50" onClick={() => action("start", () => startPRValidationLoop({ goal, repo, create_real_pr: true, trigger_validation: true }))}>1. Start Real PR + Validation</button>
        <button disabled={!loopId || !!busy} className="rounded-2xl bg-amber-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-50" onClick={() => action("logs", () => ingestPRLoopLogs({ loop_id: loopId, log_text: logText }))}>2. Read Logs</button>
        <button disabled={!loopId || !!busy} className="rounded-2xl bg-blue-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-50" onClick={() => action("fix", () => autoFixPRLoop({ loop_id: loopId, create_real_fix_pr: true }))}>3. Auto-Fix PR</button>
        <button disabled={!loopId || !!busy} className="rounded-2xl bg-purple-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-50" onClick={() => action("rerun", () => rerunPRLoop({ loop_id: loopId }))}>4. Rerun Validation</button>
        <button disabled={!loopId || !!busy} className="rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-50" onClick={() => action("approve", () => approvePRLoop({ loop_id: loopId, comment: "Approved from cockpit." }))}>5. Approve</button>
      </div>

      <label className="mt-4 block">
        <span className="text-sm font-medium">Failure log input/manual fallback</span>
        <textarea className="mt-1 min-h-20 w-full rounded-2xl border border-slate-300 p-3" value={logText} onChange={(e) => setLogText(e.target.value)} />
      </label>

      <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border bg-white p-4"><p className="text-xs text-slate-500">Loop ID</p><p className="break-all font-mono text-xs">{state?.loop_id || "not started"}</p></div>
        <div className="rounded-2xl border bg-white p-4"><p className="text-xs text-slate-500">PR</p>{state?.pr_url ? <a className="font-bold text-blue-700" target="_blank" href={state.pr_url}>Open PR #{state.pr_id}</a> : <p className="text-sm">none</p>}</div>
        <div className="rounded-2xl border bg-white p-4"><p className="text-xs text-slate-500">Fix PR</p>{state?.fix_pr_url ? <a className="font-bold text-blue-700" target="_blank" href={state.fix_pr_url}>Open Fix PR #{state.fix_pr_id}</a> : <p className="text-sm">none</p>}</div>
        <div className="rounded-2xl border bg-white p-4"><p className="text-xs text-slate-500">Pipeline</p><p className="font-mono text-xs">{state?.pipeline_run_id || "not triggered"}</p></div>
      </div>

      <h3 className="mt-6 text-lg font-bold">Agent Task Board</h3>
      <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {tasks.map((task, idx) => (
          <div key={task.task_id || idx} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex justify-between gap-3">
              <div><p className="font-bold">{task.agent}</p><p className="text-sm text-slate-600">{task.title}</p></div>
              <span className={`h-fit rounded-full border px-3 py-1 text-xs font-bold ${statusClass(task.status)}`}>{task.status}</span>
            </div>
            <p className="mt-2 text-xs text-slate-400">{task.task_type} · {task.repo}</p>
          </div>
        ))}
      </div>

      <div className="mt-5"><JsonPanel value={state} /></div>
    </section>
  );
}
