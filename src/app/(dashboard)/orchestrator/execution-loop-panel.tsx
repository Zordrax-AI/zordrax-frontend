"use client";

import { useState } from "react";
import {
  approveExecutionLoop,
  continueExecutionLoop,
  startExecutionLoop,
} from "@/lib/zordrax-execution-loop-client";

function JsonPanel({ value }: { value: unknown }) {
  return (
    <pre className="max-h-96 overflow-auto rounded-xl border border-slate-200 bg-slate-950 p-4 text-xs text-slate-100">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

export default function ExecutionLoopPanel({
  defaultGoal,
  defaultRepo = "onboarding-repo",
}: {
  defaultGoal: string;
  defaultRepo?: string;
}) {
  const [goal, setGoal] = useState(defaultGoal);
  const [repo, setRepo] = useState(defaultRepo);
  const [executionId, setExecutionId] = useState("");
  const [failureLog, setFailureLog] = useState("next build failed to compile cannot find module");
  const [result, setResult] = useState<unknown>({ state: "not started" });
  const [busy, setBusy] = useState("");

  async function run(label: string, fn: () => Promise<unknown>) {
    setBusy(label);
    try {
      const response: any = await fn();
      if (response?.execution_id) setExecutionId(response.execution_id);
      setResult(response);
    } catch (err) {
      setResult({ error: err instanceof Error ? err.message : "Request failed" });
    } finally {
      setBusy("");
    }
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-bold">Autonomous Execution Loop</h2>
      <p className="mt-1 text-sm text-slate-500">
        Prompt → agents → patch → PR → validation/remediation → approval → dev deploy dry-run.
      </p>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <label className="md:col-span-2">
          <span className="text-sm font-medium">Goal</span>
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
        <span className="text-sm font-medium">Failure log for remediation test</span>
        <textarea className="mt-1 min-h-20 w-full rounded-xl border border-slate-300 p-3" value={failureLog} onChange={(e) => setFailureLog(e.target.value)} />
      </label>

      <div className="mt-4 flex flex-wrap gap-3">
        <button disabled={!!busy} className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" onClick={() => run("start", () => startExecutionLoop({ goal, target_repo: repo, create_real_pr: true, trigger_validation: false }))}>
          Start Execution Loop
        </button>
        <button disabled={!executionId || !!busy} className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" onClick={() => run("continue", () => continueExecutionLoop({ execution_id: executionId, failure_log: failureLog }))}>
          Continue + Remediate
        </button>
        <button disabled={!executionId || !!busy} className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" onClick={() => run("approve", () => approveExecutionLoop({ execution_id: executionId }))}>
          Approve + Dev Dry-Run
        </button>
      </div>

      <div className="mt-4">
        <JsonPanel value={result} />
      </div>
    </section>
  );
}
