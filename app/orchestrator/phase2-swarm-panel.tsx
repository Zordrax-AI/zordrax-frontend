"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Phase2SwarmState,
  continuePhase2Swarm,
  getPhase2SwarmStatus,
  getPhase2SwarmStream,
  startPhase2Swarm,
} from "../../lib/zordrax-phase2-swarm-client";

const REPOS = ["onboarding-repo", "frontend-repo", "infra-repo", "etl-repo", "governance-repo", "bi-repo"];

function Badge({ value }: { value?: string | number | null }) {
  const text = String(value ?? "unknown");
  const lower = text.toLowerCase();
  const cls =
    lower.includes("complete") || lower.includes("success") || lower.includes("created") || lower.includes("safe")
      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
      : lower.includes("fail") || lower.includes("blocked") || lower.includes("not")
      ? "bg-red-100 text-red-800 border-red-300"
      : lower.includes("pending") || lower.includes("waiting")
      ? "bg-amber-100 text-amber-800 border-amber-300"
      : "bg-blue-100 text-blue-800 border-blue-300";
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${cls}`}>{text}</span>;
}

export default function Phase2SwarmPanel({ defaultGoal }: { defaultGoal: string }) {
  const [goal, setGoal] = useState(defaultGoal || "Build onboarding approval workflow");
  const [selectedRepos, setSelectedRepos] = useState<string[]>(["onboarding-repo", "frontend-repo"]);
  const [createRealPrs, setCreateRealPrs] = useState(false);
  const [runSandboxes, setRunSandboxes] = useState(true);
  const [failureLog, setFailureLog] = useState("next build failed cannot find module");
  const [state, setState] = useState<Phase2SwarmState | null>(null);
  const [stream, setStream] = useState<string[]>([]);
  const [busy, setBusy] = useState("");
  const [polling, setPolling] = useState(true);

  const confidence = useMemo(() => {
    return state?.merge_confidence?.score ?? "n/a";
  }, [state]);

  function toggleRepo(repo: string) {
    setSelectedRepos((items) => (items.includes(repo) ? items.filter((x) => x !== repo) : [...items, repo]));
  }

  async function start() {
    setBusy("start");
    try {
      const result = await startPhase2Swarm({
        goal,
        target_repos: selectedRepos,
        create_real_prs: createRealPrs,
        run_sandboxes: runSandboxes,
      });
      setState(result);
      setStream(result.live_stream || []);
    } finally {
      setBusy("");
    }
  }

  async function remediate() {
    if (!state?.swarm_id) return;
    setBusy("remediate");
    try {
      const result = await continuePhase2Swarm({
        swarm_id: state.swarm_id,
        failure_log: failureLog,
        rerun_sandboxes: false,
        create_fix_prs: false,
      });
      setState(result);
      setStream(result.live_stream || []);
    } finally {
      setBusy("");
    }
  }

  async function refresh() {
    if (!state?.swarm_id) return;
    try {
      const [latest, latestStream] = await Promise.all([
        getPhase2SwarmStatus(state.swarm_id),
        getPhase2SwarmStream(state.swarm_id),
      ]);
      setState(latest);
      setStream(latestStream.live_stream || latest.live_stream || []);
    } catch {
      // keep previous state
    }
  }

  useEffect(() => {
    if (!state?.swarm_id || !polling) return;
    const timer = setInterval(refresh, 5000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.swarm_id, polling]);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-fuchsia-700">Phase 2</p>
          <h3 className="text-xl font-bold">Autonomous Multi-Agent Coding Swarm</h3>
          <p className="mt-1 text-sm text-slate-500">
            Recursive planning, parallel repo workers, sandbox execution, memory graph, PR proposals, and merge confidence scoring.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge value={state?.status || "idle"} />
          <Badge value={`confidence ${confidence}`} />
          <button className="rounded-xl border px-3 py-1 text-xs font-bold" onClick={() => setPolling((v) => !v)}>
            Polling: {polling ? "On" : "Off"}
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_320px]">
        <textarea className="min-h-24 rounded-2xl border p-3 text-sm" value={goal} onChange={(event) => setGoal(event.target.value)} />
        <div className="rounded-2xl border p-3">
          <p className="text-sm font-bold">Target repos</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {REPOS.map((repo) => (
              <label key={repo} className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={selectedRepos.includes(repo)} onChange={() => toggleRepo(repo)} />
                {repo}
              </label>
            ))}
          </div>
          <div className="mt-3 space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={runSandboxes} onChange={(e) => setRunSandboxes(e.target.checked)} />
              Run sandboxes
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={createRealPrs} onChange={(e) => setCreateRealPrs(e.target.checked)} />
              Create real PRs
            </label>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white disabled:opacity-50" disabled={!!busy || selectedRepos.length === 0} onClick={start}>
          {busy === "start" ? "Starting..." : "Start Swarm"}
        </button>
        <button className="rounded-xl bg-purple-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50" disabled={!state?.swarm_id || !!busy} onClick={remediate}>
          Run Remediation
        </button>
        <button className="rounded-xl border px-4 py-2 text-sm font-bold disabled:opacity-50" disabled={!state?.swarm_id || !!busy} onClick={refresh}>
          Refresh
        </button>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 p-4 xl:col-span-2">
          <h4 className="font-bold">Parallel Repo Workers</h4>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {state?.work_items?.length ? (
              state.work_items.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{item.repo}</p>
                      <p className="mt-1 break-all font-mono text-xs text-slate-500">{item.branch_name}</p>
                    </div>
                    <Badge value={item.status} />
                  </div>
                  <p className="mt-3 text-sm text-slate-700">{item.task}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge value={item.agent} />
                    <Badge value={`sandbox ${item.sandbox_id ? "yes" : "no"}`} />
                    <Badge value={`score ${item.confidence_score ?? "n/a"}`} />
                  </div>
                  {item.pr_url ? (
                    <a className="mt-3 inline-flex rounded-xl bg-emerald-700 px-3 py-2 text-xs font-bold text-white" href={item.pr_url} target="_blank" rel="noreferrer">
                      Open PR #{item.pr_id}
                    </a>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No swarm started yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 p-4">
          <h4 className="font-bold">Self-Healing Memory Graph</h4>
          <p className="mt-1 text-sm text-slate-500">{state?.memory_nodes?.length || 0} memory nodes</p>
          <div className="mt-3 max-h-80 space-y-2 overflow-auto">
            {state?.memory_nodes?.slice(0, 12).map((node, index) => (
              <div key={`${node.id || index}`} className="rounded-xl bg-slate-50 p-3 text-xs">
                <p className="font-bold">{String(node.title || "memory")}</p>
                <p className="text-slate-500">{String(node.node_type || "")} {node.repo ? `• ${String(node.repo)}` : ""}</p>
              </div>
            )) || <p className="text-sm text-slate-500">No memory yet.</p>}
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-950 p-4 text-slate-100">
        <div className="flex items-center justify-between">
          <h4 className="font-bold">Streaming Agent Output</h4>
          <Badge value={state?.swarm_id ? "live" : "waiting"} />
        </div>
        <div className="mt-3 max-h-96 overflow-auto font-mono text-xs">
          {stream.length ? stream.map((line, index) => <div key={`${line}-${index}`}>{line}</div>) : <div className="text-slate-400">Waiting for swarm output...</div>}
        </div>
      </div>

      <details className="mt-4 rounded-2xl border p-4">
        <summary className="cursor-pointer text-sm font-bold">Failure Log Input</summary>
        <textarea className="mt-3 min-h-24 w-full rounded-xl border p-3 text-sm" value={failureLog} onChange={(e) => setFailureLog(e.target.value)} />
      </details>

      <details className="mt-4 rounded-2xl border p-4">
        <summary className="cursor-pointer text-sm font-bold">Raw Swarm State</summary>
        <pre className="mt-3 max-h-96 overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-100">{JSON.stringify(state || { status: "idle" }, null, 2)}</pre>
      </details>
    </section>
  );
}
