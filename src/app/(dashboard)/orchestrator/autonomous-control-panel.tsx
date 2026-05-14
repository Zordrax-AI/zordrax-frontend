"use client";

import { useState } from "react";
import {
  autoRemediate,
  coordinateAgents,
  getLiveLLMStatus,
  getPipelineStream,
  planProductionRollout,
  recordDeploymentApproval,
  retryValidation,
} from "@/lib/zordrax-autonomous-client";

function JsonPanel({ value }: { value: unknown }) {
  return (
    <pre className="max-h-72 overflow-auto rounded-xl border border-slate-200 bg-slate-950 p-4 text-xs text-slate-100">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

export default function AutonomousControlPanel({
  runId,
  defaultGoal,
  environment,
}: {
  runId: string;
  defaultGoal: string;
  environment: string;
}) {
  const [failureLog, setFailureLog] = useState("next build failed to compile cannot find module");
  const [result, setResult] = useState<unknown>({ state: "idle" });
  const [busy, setBusy] = useState("");

  async function execute(label: string, fn: () => Promise<unknown>) {
    setBusy(label);
    try {
      setResult(await fn());
    } catch (err) {
      setResult({ error: err instanceof Error ? err.message : "Request failed" });
    } finally {
      setBusy("");
    }
  }

  const effectiveRunId = runId || "zxrun-ui-autonomous";

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-bold">Autonomous Controls</h2>

      <label className="mt-4 block">
        <span className="text-sm font-medium">Failure log for auto-remediation</span>
        <textarea className="mt-1 min-h-24 w-full rounded-xl border border-slate-300 p-3" value={failureLog} onChange={(event) => setFailureLog(event.target.value)} />
      </label>

      <div className="mt-4 flex flex-wrap gap-3">
        <button className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" disabled={!!busy} onClick={() => execute("stream", () => getPipelineStream(effectiveRunId))}>Pipeline Stream</button>
        <button className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" disabled={!!busy} onClick={() => execute("retry", () => retryValidation({ run_id: effectiveRunId }))}>Retry Validation</button>
        <button className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" disabled={!!busy} onClick={() => execute("remediate", () => autoRemediate({ run_id: effectiveRunId, repo: "frontend-repo", failure_log: failureLog }))}>Auto-Remediate</button>
        <button className="rounded-xl bg-purple-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" disabled={!!busy} onClick={() => execute("llm", () => getLiveLLMStatus())}>LLM Status</button>
        <button className="rounded-xl bg-cyan-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" disabled={!!busy} onClick={() => execute("agents", () => coordinateAgents({ run_id: effectiveRunId, goal: defaultGoal, target_repos: ["frontend-repo", "onboarding-repo"] }))}>Coordinate Agents</button>
        <button className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" disabled={!!busy} onClick={() => execute("approval", () => recordDeploymentApproval({ run_id: effectiveRunId, environment }))}>Deployment Approval</button>
        <button className="rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" disabled={!!busy} onClick={() => execute("rollout", () => planProductionRollout({ run_id: effectiveRunId, environment: "prod", validation_status: "succeeded", risk_level: "low", merge_approval: true, deployment_approval: true, dry_run: true }))}>Prod Rollout Dry-Run</button>
      </div>

      <div className="mt-4"><JsonPanel value={result} /></div>
    </section>
  );
}
