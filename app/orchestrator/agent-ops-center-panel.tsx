"use client";

import { useEffect, useState } from "react";
import { autoFixOps, getAgentOpsRun, ingestValidationLog, rerunValidationOps, startAgentOps } from "../../lib/zordrax-agent-ops-client";

type Task = { task_id: string; agent: string; task_type: string; title: string; status: string; repo?: string; details?: Record<string, unknown> };

function badge(status: string) {
  if (status === "completed") return "bg-emerald-100 text-emerald-800 border-emerald-300";
  if (status === "running") return "bg-blue-100 text-blue-800 border-blue-300";
  if (status === "failed" || status === "blocked") return "bg-red-100 text-red-800 border-red-300";
  if (status === "waiting_for_human") return "bg-amber-100 text-amber-800 border-amber-300";
  return "bg-slate-100 text-slate-700 border-slate-300";
}

function JsonPanel({ value }: { value: unknown }) {
  return <pre className="max-h-96 overflow-auto rounded-xl border border-slate-200 bg-slate-950 p-4 text-xs text-slate-100">{JSON.stringify(value, null, 2)}</pre>;
}

export default function AgentOpsCenterPanel({ defaultGoal }: { defaultGoal: string }) {
  const [goal, setGoal] = useState(defaultGoal);
  const [repo, setRepo] = useState("onboarding-repo");
  const [opsRunId, setOpsRunId] = useState("");
  const [failureLog, setFailureLog] = useState("next build failed to compile cannot find module");
  const [state, setState] = useState<any>({ state: "not started" });
  const [busy, setBusy] = useState("");

  async function run(label: string, fn: () => Promise<any>) {
    setBusy(label);
    try {
      const response = await fn();
      if (response?.ops_run_id) setOpsRunId(response.ops_run_id);
      setState(response);
    } catch (err) {
      setState({ error: err instanceof Error ? err.message : "Request failed" });
    } finally {
      setBusy("");
    }
  }

  useEffect(() => {
    if (!opsRunId) return;
    const timer = setInterval(async () => {
      try { setState(await getAgentOpsRun(opsRunId)); } catch {}
    }, 8000);
    return () => clearInterval(timer);
  }, [opsRunId]);

  const tasks: Task[] = state?.tasks || [];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-bold">Agent Operations Center</h2>
      <p className="mt-1 text-sm text-slate-500">Watch agents plan, build, test, remediate, create PRs, and wait for your approval.</p>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <label className="md:col-span-2">
          <span className="text-sm font-medium">Build task</span>
          <input className="mt-1 w-full rounded-xl border border-slate-300 p-3" value={goal} onChange={(e) => setGoal(e.target.value)} />
        </label>
        <label>
          <span className="text-sm font-medium">Target repo</span>
          <select className="mt-1 w-full rounded-xl border border-slate-300 p-3" value={repo} onChange={(e) => setRepo(e.target.value)}>
            <option value="onboarding-repo">onboarding-repo</option>
            <option value="frontend-repo">frontend-repo</option>
            <option value="infra-repo">infra-repo</option>
            <option value="governance-repo">governance-repo</option>
          </select>
        </label>
      </div>

      <label className="mt-4 block">
        <span className="text-sm font-medium">Validation failure log</span>
        <textarea className="mt-1 min-h-20 w-full rounded-xl border border-slate-300 p-3" value={failureLog} onChange={(e) => setFailureLog(e.target.value)} />
      </label>

      <div className="mt-4 flex flex-wrap gap-3">
        <button disabled={!!busy} className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" onClick={() => run("start", () => startAgentOps({ goal, target_repo: repo, create_real_pr: true, trigger_validation: true }))}>Start Agents + Real PR + Validation</button>
        <button disabled={!opsRunId || !!busy} className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" onClick={() => run("ingest", () => ingestValidationLog({ ops_run_id: opsRunId, log_text: failureLog }))}>Read Failure Log</button>
        <button disabled={!opsRunId || !!busy} className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" onClick={() => run("fix", () => autoFixOps({ ops_run_id: opsRunId, create_pr: true, rerun_validation: false }))}>Auto-Fix + PR</button>
        <button disabled={!opsRunId || !!busy} className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" onClick={() => run("rerun", () => rerunValidationOps({ ops_run_id: opsRunId }))}>Rerun Validation</button>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {tasks.map((task) => (
          <div key={task.task_id} className="rounded-2xl border border-slate-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <div><p className="font-semibold">{task.agent}</p><p className="text-sm text-slate-500">{task.title}</p></div>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${badge(task.status)}`}>{task.status}</span>
            </div>
            <p className="mt-2 text-xs text-slate-400">{task.task_type} · {task.repo || "no repo"}</p>
          </div>
        ))}
      </div>

      {state?.pr_url && <a href={state.pr_url} target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Open PR #{state.pr_id}</a>}
      {state?.remediation_pr_url && <a href={state.remediation_pr_url} target="_blank" rel="noreferrer" className="ml-3 mt-4 inline-flex rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white">Open Remediation PR #{state.remediation_pr_id}</a>}

      <div className="mt-5"><JsonPanel value={state} /></div>
    </section>
  );
}
