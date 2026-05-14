"use client";

import { useState } from "react";
import {
  approveProductionMerge,
  autoFixUntilGreen,
  deployProductionAutonomy,
  promoteProductionAutonomy,
  startProductionAutonomy,
  watchProductionValidation,
} from "../../lib/zordrax-production-autonomy-client";

function JsonPanel({ value }: { value: unknown }) {
  return (
    <pre className="max-h-96 overflow-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

export default function ProductionAutonomyPanel({ defaultGoal }: { defaultGoal: string }) {
  const [goal, setGoal] = useState(defaultGoal);
  const [repo, setRepo] = useState("onboarding-repo");
  const [autonomyId, setAutonomyId] = useState("");
  const [state, setState] = useState<unknown>({ status: "idle" });
  const [busy, setBusy] = useState("");

  async function run(label: string, fn: () => Promise<any>) {
    setBusy(label);
    try {
      const result = await fn();
      if (result?.autonomy_id) setAutonomyId(result.autonomy_id);
      setState(result);
    } catch (err) {
      setState({ error: err instanceof Error ? err.message : "Request failed" });
    } finally {
      setBusy("");
    }
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-xl font-bold">Production Autonomy Engine</h3>
      <p className="mt-1 text-sm text-slate-500">
        Repo-aware codegen, auto log pull, auto-fix, retry, merge approval, deploy, and promotion gates.
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <input className="rounded-xl border p-3 md:col-span-2" value={goal} onChange={(e) => setGoal(e.target.value)} />
        <select className="rounded-xl border p-3" value={repo} onChange={(e) => setRepo(e.target.value)}>
          <option value="onboarding-repo">onboarding-repo</option>
          <option value="frontend-repo">frontend-repo</option>
          <option value="infra-repo">infra-repo</option>
          <option value="governance-repo">governance-repo</option>
        </select>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white" disabled={!!busy} onClick={() => run("start", () => startProductionAutonomy({ goal, repo }))}>Start</button>
        <button className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50" disabled={!autonomyId || !!busy} onClick={() => run("watch", () => watchProductionValidation({ autonomy_id: autonomyId }))}>Watch Logs</button>
        <button className="rounded-xl bg-purple-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50" disabled={!autonomyId || !!busy} onClick={() => run("fix", () => autoFixUntilGreen({ autonomy_id: autonomyId }))}>Auto-Fix Until Green</button>
        <button className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50" disabled={!autonomyId || !!busy} onClick={() => run("merge", () => approveProductionMerge({ autonomy_id: autonomyId }))}>Approve Merge</button>
        <button className="rounded-xl bg-amber-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50" disabled={!autonomyId || !!busy} onClick={() => run("deploy", () => deployProductionAutonomy({ autonomy_id: autonomyId, environment: "dev" }))}>Deploy Dev</button>
        <button className="rounded-xl border px-4 py-2 text-sm font-bold disabled:opacity-50" disabled={!autonomyId || !!busy} onClick={() => run("staging", () => promoteProductionAutonomy({ autonomy_id: autonomyId, target_environment: "staging", approval: true }))}>Promote Staging</button>
        <button className="rounded-xl border px-4 py-2 text-sm font-bold disabled:opacity-50" disabled={!autonomyId || !!busy} onClick={() => run("prod", () => promoteProductionAutonomy({ autonomy_id: autonomyId, target_environment: "prod", approval: true }))}>Promote Prod</button>
      </div>

      <div className="mt-4">
        <JsonPanel value={state} />
      </div>
    </section>
  );
}
