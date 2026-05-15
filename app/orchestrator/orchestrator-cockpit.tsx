"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ApprovalResponse,
  BuildResponse,
  CreatePRResponse,
  DeployDryRunResponse,
  FullRunStatus,
  PRProposal,
  RiskScoreResponse,
  approveRun,
  buildPlan,
  createPR,
  deployDryRun,
  getFullRunStatus,
  riskScore,
} from "../../lib/zordrax-orchestrator-client";

import AutonomousControlPanel from "./autonomous-control-panel";
import ExecutionLoopPanel from "./execution-loop-panel";
import AgentOpsCenterPanel from "./agent-ops-center-panel";
import PRValidationLoopPanel from "./pr-validation-loop-panel";
import AIPatchPanel from "./ai-patch-panel";
import AIBuildRunnerPanel from "./ai-build-runner-panel";
import ProductionAutonomyPanel from "./production-autonomy-panel";

type LogItem = {
  timestamp: string;
  level: "INFO" | "SUCCESS" | "ERROR";
  message: string;
};

type BuildTask = {
  id: string;
  prompt: string;
  repo: string;
  environment: string;
  status: "queued" | "planned" | "approved" | "pr_created" | "failed";
  runId?: string;
  packageId?: string;
  prCount?: number;
};

function now() {
  return new Date().toLocaleTimeString();
}

function statusClass(value?: string | null) {
  const text = (value || "unknown").toLowerCase();

  if (text.includes("succeeded") || text.includes("created") || text.includes("approved") || text.includes("success")) {
    return "bg-emerald-100 text-emerald-800 border-emerald-300";
  }

  if (text.includes("failed") || text.includes("blocked") || text.includes("rejected") || text.includes("error")) {
    return "bg-red-100 text-red-800 border-red-300";
  }

  if (text.includes("running") || text.includes("progress") || text.includes("trigger")) {
    return "bg-blue-100 text-blue-800 border-blue-300";
  }

  if (text.includes("waiting") || text.includes("pending") || text.includes("queued")) {
    return "bg-amber-100 text-amber-800 border-amber-300";
  }

  return "bg-slate-100 text-slate-700 border-slate-300";
}

function StatusBadge({ value }: { value?: string | null }) {
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusClass(value)}`}>
      {value || "unknown"}
    </span>
  );
}

function JsonDetails({ title, value }: { title: string; value: unknown }) {
  return (
    <details className="rounded-2xl border border-slate-200 bg-white p-4">
      <summary className="cursor-pointer text-sm font-semibold text-slate-700">{title}</summary>
      <pre className="mt-3 max-h-96 overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-100">
        {JSON.stringify(value, null, 2)}
      </pre>
    </details>
  );
}

function StatCard({
  label,
  value,
  hint,
  status,
}: {
  label: string;
  value: string;
  hint?: string;
  status?: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
          {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
        </div>
        {status ? <StatusBadge value={status} /> : null}
      </div>
    </div>
  );
}

function PRLinks({ proposals }: { proposals: PRProposal[] }) {
  if (!proposals.length) {
    return <p className="text-sm text-slate-500">No PRs created yet.</p>;
  }

  return (
    <div className="grid gap-3">
      {proposals.map((proposal) => (
        <div key={`${proposal.repo}-${proposal.branch_name}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-slate-900">{proposal.repo}</h3>
              <p className="mt-1 font-mono text-xs text-slate-500">{proposal.branch_name}</p>
            </div>
            <StatusBadge value={proposal.pr_url ? "PR created" : "proposal only"} />
          </div>

          <p className="mt-3 text-sm text-slate-700">{proposal.title}</p>

          {proposal.pr_url ? (
            <a
              href={proposal.pr_url}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Open PR #{proposal.pr_id || ""}
            </a>
          ) : (
            <p className="mt-3 text-sm text-slate-500">No PR URL returned yet.</p>
          )}
        </div>
      ))}
    </div>
  );
}

const starterTasks = [
  "Build onboarding approval FastAPI endpoint",
  "Add frontend status badges and PR links",
  "Create validation retry automation",
];

export default function OrchestratorCockpit() {
  const [prompt, setPrompt] = useState("Build onboarding approval FastAPI endpoint");
  const [bulkText, setBulkText] = useState(starterTasks.join("\n"));
  const [requestedBy, setRequestedBy] = useState("founder");
  const [environment, setEnvironment] = useState("dev");
  const [triggerPipeline, setTriggerPipeline] = useState(false);

  const [build, setBuild] = useState<BuildResponse | null>(null);
  const [approval, setApproval] = useState<ApprovalResponse | null>(null);
  const [pr, setPr] = useState<CreatePRResponse | null>(null);
  const [fullStatus, setFullStatus] = useState<FullRunStatus | null>(null);
  const [risk, setRisk] = useState<RiskScoreResponse | Record<string, string>>({ risk: "not calculated" });
  const [deploy, setDeploy] = useState<DeployDryRunResponse | Record<string, string>>({ deployment: "not planned" });
  const [busy, setBusy] = useState<string>("");
  const [polling, setPolling] = useState(true);
  const [tasks, setTasks] = useState<BuildTask[]>([]);
  const [logs, setLogs] = useState<LogItem[]>([
    { timestamp: now(), level: "INFO", message: "Orchestrator dashboard ready." },
  ]);

  const runId = build?.run_id;
  const packageId = build?.package_contract?.package_id;

  const proposals = useMemo(() => pr?.proposals || fullStatus?.pr?.proposals || [], [pr, fullStatus]);

  const stats = {
    tasks: tasks.length,
    planned: tasks.filter((task) => task.status === "planned").length,
    prs: proposals.filter((proposal) => proposal.pr_url).length,
    queue: tasks.filter((task) => task.status === "queued").length,
  };

  function log(level: LogItem["level"], message: string) {
    setLogs((items) => [{ timestamp: now(), level, message }, ...items].slice(0, 20));
  }

  function addBulkTasks() {
    const created = bulkText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, index) => ({
        id: `task-${Date.now()}-${index}`,
        prompt: line,
        repo: "onboarding-repo",
        environment,
        status: "queued" as const,
      }));

    setTasks((items) => [...created, ...items]);
    log("INFO", `Queued ${created.length} build tasks.`);
  }

  async function refreshStatus() {
    if (!runId) return;

    try {
      const latest = await getFullRunStatus(runId);
      setFullStatus(latest);
    } catch (err) {
      log("ERROR", err instanceof Error ? err.message : "Failed to refresh run status.");
    }
  }

  useEffect(() => {
    if (!runId || !polling) return;
    refreshStatus();
    const timer = setInterval(refreshStatus, 10000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId, polling]);

  async function onBuild(taskPrompt = prompt) {
    setBusy("build");
    log("INFO", triggerPipeline ? "Creating build plan and triggering validation..." : "Creating build plan...");

    try {
      const response = await buildPlan({
        prompt: taskPrompt,
        requested_by: requestedBy,
        environment,
        trigger_pipeline: triggerPipeline,
      });

      setBuild(response);
      setApproval(null);
      setPr(null);
      setFullStatus(null);
      setRisk({ risk: "not calculated" });
      setDeploy({ deployment: "not planned" });

      setTasks((items) => [
        {
          id: response.run_id,
          prompt: taskPrompt,
          repo: "onboarding-repo",
          environment,
          status: "planned",
          runId: response.run_id,
          packageId: response.package_contract.package_id,
        },
        ...items.filter((item) => item.prompt !== taskPrompt),
      ]);

      log("SUCCESS", `Build created: ${response.run_id}, package: ${response.package_contract.package_id}`);
    } catch (err) {
      log("ERROR", err instanceof Error ? err.message : "Failed to fetch");
    } finally {
      setBusy("");
    }
  }

  async function onApprove() {
    if (!runId) return;

    setBusy("approve");
    log("INFO", `Approving run ${runId}...`);

    try {
      const response = await approveRun({ run_id: runId, approved_by: requestedBy, decision: "approved" });
      setApproval(response);
      setTasks((items) => items.map((item) => item.runId === runId ? { ...item, status: "approved" } : item));
      log("SUCCESS", `Approval recorded: ${response.status}`);
      await refreshStatus();
    } catch (err) {
      log("ERROR", err instanceof Error ? err.message : "Approval failed");
    } finally {
      setBusy("");
    }
  }

  async function onCreatePR() {
    if (!runId) return;

    setBusy("pr");
    log("INFO", `Creating PRs for run ${runId}...`);

    try {
      const response = await createPR({ run_id: runId, created_by: requestedBy });
      setPr(response);
      setTasks((items) => items.map((item) => item.runId === runId ? { ...item, status: "pr_created", prCount: response.proposals?.length || 0 } : item));
      log("SUCCESS", `PR flow complete: ${response.status}`);
      await refreshStatus();
    } catch (err) {
      log("ERROR", err instanceof Error ? err.message : "PR creation failed");
    } finally {
      setBusy("");
    }
  }

  async function onRisk() {
    if (!runId) return;

    setBusy("risk");
    log("INFO", "Calculating risk score...");

    try {
      const response = await riskScore({ run_id: runId, environment });
      setRisk(response);
      log("SUCCESS", `Risk score: ${response.score ?? "n/a"} (${response.level ?? "unknown"})`);
    } catch (err) {
      log("ERROR", err instanceof Error ? err.message : "Risk score failed");
    } finally {
      setBusy("");
    }
  }

  async function onDeployDryRun() {
    if (!runId) return;

    setBusy("deploy");
    log("INFO", "Planning deployment dry-run...");

    try {
      const response = await deployDryRun({ run_id: runId, environment });
      setDeploy(response);
      log("SUCCESS", `Deploy dry-run: ${response.status}`);
    } catch (err) {
      log("ERROR", err instanceof Error ? err.message : "Deploy dry-run failed");
    } finally {
      setBusy("");
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="hidden border-r border-slate-800 bg-slate-950 p-6 text-white lg:block">
          <div className="text-2xl font-black">Z</div>
          <h1 className="mt-3 text-lg font-bold">Zordrax-Analytica</h1>
          <p className="mt-1 text-xs text-slate-400">AI Orchestrator</p>

          <nav className="mt-8 space-y-2 text-sm">
            <a className="block rounded-2xl bg-purple-600 px-4 py-3 font-semibold" href="/orchestrator">Dashboard</a>
            <a className="block rounded-2xl px-4 py-3 text-slate-300 hover:bg-slate-900" href="#tasks">Tasks</a>
            <a className="block rounded-2xl px-4 py-3 text-slate-300 hover:bg-slate-900" href="#agents">Agents</a>
            <a className="block rounded-2xl px-4 py-3 text-slate-300 hover:bg-slate-900" href="#prs">PRs</a>
            <a className="block rounded-2xl px-4 py-3 text-slate-300 hover:bg-slate-900" href="#activity">Activity</a>
          </nav>
        </aside>

        <div className="p-6">
          <div className="mx-auto max-w-7xl space-y-6">
            <header className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-purple-700">AI Orchestrator Cockpit</p>
                <h2 className="text-3xl font-bold">Autonomous build, PR, QA and remediation dashboard</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Create tasks, watch agents work, generate PRs, run validation, remediate failures, and approve deployment gates.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge value={busy ? `busy: ${busy}` : "operational"} />
                <button className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold" onClick={() => setPolling((value) => !value)}>
                  Polling: {polling ? "On" : "Off"}
                </button>
              </div>
            </header>

            <section className="grid gap-4 md:grid-cols-4">
              <StatCard label="Total Tasks" value={String(stats.tasks)} hint={`${stats.queue} queued`} status="active" />
              <StatCard label="Planned Runs" value={String(stats.planned)} hint="build plans created" status={build?.status || "pending"} />
              <StatCard label="PRs Created" value={String(stats.prs)} hint="from current run" status={proposals.length ? "PR created" : "none"} />
              <StatCard label="Risk" value={(risk as RiskScoreResponse).level || "n/a"} hint="latest score" status={(risk as RiskScoreResponse).level || "not calculated"} />
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold">Create New Build Task</h3>
                    <p className="mt-1 text-sm text-slate-500">Describe one task or add multiple tasks below.</p>
                  </div>
                  <StatusBadge value={triggerPipeline ? "validation enabled" : "validation manual"} />
                </div>

                <label className="mt-4 block">
                  <span className="text-sm font-medium">Build task</span>
                  <textarea className="mt-1 min-h-24 w-full rounded-2xl border border-slate-300 p-3" value={prompt} onChange={(event) => setPrompt(event.target.value)} />
                </label>

                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <label>
                    <span className="text-sm font-medium">Requested by</span>
                    <input className="mt-1 w-full rounded-xl border border-slate-300 p-3" value={requestedBy} onChange={(event) => setRequestedBy(event.target.value)} />
                  </label>

                  <label>
                    <span className="text-sm font-medium">Environment</span>
                    <select className="mt-1 w-full rounded-xl border border-slate-300 p-3" value={environment} onChange={(event) => setEnvironment(event.target.value)}>
                      <option value="dev">dev</option>
                      <option value="uat">uat</option>
                      <option value="prod">prod</option>
                    </select>
                  </label>

                  <label className="flex items-center gap-2 pt-8">
                    <input type="checkbox" checked={triggerPipeline} onChange={(event) => setTriggerPipeline(event.target.checked)} />
                    <span className="text-sm font-medium">Trigger validation pipeline</span>
                  </label>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" disabled={busy === "build"} onClick={() => onBuild()}>
                    {busy === "build" ? "Building..." : "Create Task"}
                  </button>
                  <button className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" disabled={!runId || busy === "approve"} onClick={onApprove}>Approve</button>
                  <button className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" disabled={!runId || !approval || busy === "pr"} onClick={onCreatePR}>Create PR</button>
                  <button className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" disabled={!runId || busy === "risk"} onClick={onRisk}>Risk</button>
                  <button className="rounded-xl bg-purple-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" disabled={!runId || busy === "deploy"} onClick={onDeployDryRun}>Deploy Dry-Run</button>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-xl font-bold">Create Multiple Tasks</h3>
                <p className="mt-1 text-sm text-slate-500">One task per line. These queue locally in the dashboard.</p>
                <textarea className="mt-4 min-h-48 w-full rounded-2xl border border-slate-300 p-3 text-sm" value={bulkText} onChange={(event) => setBulkText(event.target.value)} />
                <button className="mt-4 rounded-xl border border-purple-300 bg-purple-50 px-4 py-2 text-sm font-bold text-purple-800" onClick={addBulkTasks}>
                  Add Multiple Tasks
                </button>
              </div>
            </section>

            <section id="tasks" className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h3 className="text-xl font-bold">Task Dashboard</h3>
                <StatusBadge value={`${tasks.length} tasks`} />
              </div>

              <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="p-3">Task</th>
                      <th className="p-3">Run</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Environment</th>
                      <th className="p-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tasks.length === 0 ? (
                      <tr><td className="p-4 text-slate-500" colSpan={5}>No tasks yet. Create or queue tasks above.</td></tr>
                    ) : tasks.map((task) => (
                      <tr key={task.id}>
                        <td className="p-3">
                          <p className="font-semibold">{task.prompt}</p>
                          <p className="text-xs text-slate-500">{task.repo}</p>
                        </td>
                        <td className="p-3 font-mono text-xs">{task.runId || "not started"}</td>
                        <td className="p-3"><StatusBadge value={task.status} /></td>
                        <td className="p-3">{task.environment}</td>
                        <td className="p-3">
                          <button className="rounded-xl border border-slate-300 px-3 py-1 text-xs font-semibold" onClick={() => onBuild(task.prompt)}>
                            Run
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <div id="prs" className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-xl font-bold">PR Links</h3>
                <div className="mt-3"><PRLinks proposals={proposals} /></div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-xl font-bold">Run Summary</h3>
                <div className="mt-4 grid gap-3">
                  <div><p className="text-xs text-slate-500">Run ID</p><p className="break-all font-mono text-sm">{runId || "Not created yet"}</p></div>
                  <div><p className="text-xs text-slate-500">Package ID</p><p className="break-all font-mono text-sm">{packageId || "Not created yet"}</p></div>
                  <div><p className="text-xs text-slate-500">Pipeline</p><StatusBadge value={fullStatus?.azure_devops_result || fullStatus?.azure_devops_state || (build?.azure_devops_pipeline_run_id ? "triggered" : "not triggered")} /></div>
                  <div><p className="text-xs text-slate-500">Run Status</p><StatusBadge value={fullStatus?.status || build?.status || "pending"} /></div>
                </div>
              </div>
            </section>

            <section id="agents" className="space-y-6">
              <PRValidationLoopPanel defaultGoal={prompt} />
              <AgentOpsCenterPanel defaultGoal={prompt} />
              <ExecutionLoopPanel defaultGoal={prompt} defaultRepo="onboarding-repo" />
              <AutonomousControlPanel runId={runId || ""} defaultGoal={prompt} environment={environment} />
              <AIBuildRunnerPanel defaultTask={prompt} />
<ProductionAutonomyPanel defaultGoal={prompt} />
<AIPatchPanel runId={runId || ""} defaultGoal={prompt} defaultRepo="onboarding-repo" />
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <JsonDetails title="Live Run Status JSON" value={fullStatus || { state: "not polled" }} />
              <JsonDetails title="Risk JSON" value={risk} />
              <JsonDetails title="Deploy Dry-Run JSON" value={deploy} />
              <JsonDetails title="Build JSON" value={build || { state: "not created" }} />
            </section>

            <section id="activity" className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-xl font-bold">Activity Feed</h3>
              <div className="mt-4 space-y-3">
                {logs.map((item, index) => (
                  <div key={`${item.timestamp}-${index}`} className="rounded-xl border border-slate-200 p-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-slate-500">{item.timestamp}</span>
                      <StatusBadge value={item.level} />
                    </div>
                    <p className="mt-2 text-sm text-slate-700">{item.message}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}


