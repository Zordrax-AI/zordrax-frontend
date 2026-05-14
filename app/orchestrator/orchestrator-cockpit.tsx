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
import AIPatchPanel from "./ai-patch-panel";
import AgentOpsCenterPanel from "./agent-ops-center-panel";
import PRValidationLoopPanel from "./pr-validation-loop-panel";
import ExecutionLoopPanel from "./execution-loop-panel";
type LogItem = {
  timestamp: string;
  level: "INFO" | "SUCCESS" | "ERROR";
  message: string;
};

function now() {
  return new Date().toLocaleTimeString();
}

function StatusBadge({ value }: { value?: string | null }) {
  const text = value || "unknown";

  const cls =
    text.toLowerCase().includes("succeeded") || text.toLowerCase().includes("created") || text.toLowerCase().includes("approved")
      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
      : text.toLowerCase().includes("failed") || text.toLowerCase().includes("blocked") || text.toLowerCase().includes("rejected")
      ? "bg-red-100 text-red-800 border-red-300"
      : text.toLowerCase().includes("running") || text.toLowerCase().includes("progress") || text.toLowerCase().includes("trigger")
      ? "bg-blue-100 text-blue-800 border-blue-300"
      : "bg-slate-100 text-slate-700 border-slate-300";

  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${cls}`}>{text}</span>;
}

function JsonPanel({ value }: { value: unknown }) {
  return (
    <pre className="max-h-72 overflow-auto rounded-xl border border-slate-200 bg-slate-950 p-4 text-xs text-slate-100">
      {JSON.stringify(value, null, 2)}
    </pre>
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

          {!!proposal.proposed_files?.length && (
            <details className="mt-3">
              <summary className="cursor-pointer text-sm font-medium text-slate-700">Proposed files</summary>
              <ul className="mt-2 list-inside list-disc text-xs text-slate-500">
                {proposal.proposed_files.map((file) => (
                  <li key={file}>{file}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      ))}
    </div>
  );
}

export default function OrchestratorCockpit() {
  const [prompt, setPrompt] = useState("Build onboarding approval FastAPI endpoint");
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
  const [logs, setLogs] = useState<LogItem[]>([
    { timestamp: now(), level: "INFO", message: "Orchestrator cockpit ready." },
  ]);

  const runId = build?.run_id;
  const packageId = build?.package_contract?.package_id;

  const proposals = useMemo(() => {
    return pr?.proposals || fullStatus?.pr?.proposals || [];
  }, [pr, fullStatus]);

  function log(level: LogItem["level"], message: string) {
    setLogs((items) => [{ timestamp: now(), level, message }, ...items]);
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

  async function onBuild() {
    setBusy("build");
    log("INFO", triggerPipeline ? "Creating build plan and triggering validation..." : "Creating build plan...");

    try {
      const response = await buildPlan({
        prompt,
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
      const response = await approveRun({
        run_id: runId,
        approved_by: requestedBy,
        decision: "approved",
      });

      setApproval(response);
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
      const response = await createPR({
        run_id: runId,
        created_by: requestedBy,
      });

      setPr(response);
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
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-3xl bg-slate-950 p-6 text-white shadow-sm">
          <p className="text-sm text-cyan-200">Zordrax-Analytica</p>
          <h1 className="mt-2 text-3xl font-bold">AI Orchestrator Cockpit</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-300">
            Prompt the SaaS build system, trigger validation, approve work, create PRs, review risk, and monitor live orchestration status.
          </p>
        </header>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold">1. Prompt</h2>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <label className="md:col-span-3">
              <span className="text-sm font-medium">Build task</span>
              <textarea
                className="mt-1 min-h-24 w-full rounded-xl border border-slate-300 p-3"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
              />
            </label>

            <label>
              <span className="text-sm font-medium">Requested by</span>
              <input
                className="mt-1 w-full rounded-xl border border-slate-300 p-3"
                value={requestedBy}
                onChange={(event) => setRequestedBy(event.target.value)}
              />
            </label>

            <label>
              <span className="text-sm font-medium">Environment</span>
              <select
                className="mt-1 w-full rounded-xl border border-slate-300 p-3"
                value={environment}
                onChange={(event) => setEnvironment(event.target.value)}
              >
                <option value="dev">dev</option>
                <option value="uat">uat</option>
                <option value="prod">prod</option>
              </select>
            </label>

            <label className="flex items-center gap-2 pt-7">
              <input
                type="checkbox"
                checked={triggerPipeline}
                onChange={(event) => setTriggerPipeline(event.target.checked)}
              />
              <span className="text-sm font-medium">Trigger validation pipeline</span>
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              disabled={busy === "build"}
              onClick={onBuild}
            >
              {busy === "build" ? "Building..." : "Build Plan"}
            </button>

            <button
              className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              disabled={!runId || busy === "approve"}
              onClick={onApprove}
            >
              Approve
            </button>

            <button
              className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              disabled={!runId || !approval || busy === "pr"}
              onClick={onCreatePR}
            >
              Create PR
            </button>

            <button
              className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              disabled={!runId || busy === "risk"}
              onClick={onRisk}
            >
              Risk Score
            </button>

            <button
              className="rounded-xl bg-purple-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              disabled={!runId || busy === "deploy"}
              onClick={onDeployDryRun}
            >
              Deploy Dry-Run
            </button>

            <button
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold disabled:opacity-50"
              disabled={!runId}
              onClick={refreshStatus}
            >
              Refresh Status
            </button>

            <button
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold"
              onClick={() => setPolling((value) => !value)}
            >
              Polling: {polling ? "On" : "Off"}
            </button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">Run ID</p>
            <p className="mt-1 break-all font-mono text-sm">{runId || "Not created yet"}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">Package ID</p>
            <p className="mt-1 break-all font-mono text-sm">{packageId || "Not created yet"}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">Pipeline</p>
            <div className="mt-2">
              <StatusBadge value={fullStatus?.azure_devops_result || fullStatus?.azure_devops_state || (build?.azure_devops_pipeline_run_id ? "triggered" : "not triggered")} />
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">Run Status</p>
            <div className="mt-2">
              <StatusBadge value={fullStatus?.status || build?.status || "pending"} />
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold">Live Run Status</h2>
            <div className="mt-3">
              <JsonPanel value={fullStatus || { state: "not polled" }} />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold">PR Links</h2>
            <div className="mt-3">
              <PRLinks proposals={proposals} />
            </div>
          </div>

          <AIPatchPanel
  runId={runId || ""}
  defaultGoal={prompt}
  defaultRepo="onboarding-repo"
/>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold">Risk Score</h2>
            <div className="mt-3">
              <JsonPanel value={risk} />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold">Deploy Dry-Run</h2>
            <div className="mt-3">
              <JsonPanel value={deploy} />
            </div>
          </div>
        </section>

        <section className="space-y-6">
  <PRValidationLoopPanel defaultGoal={prompt} />
  <AgentOpsCenterPanel defaultGoal={prompt} />
  <ExecutionLoopPanel defaultGoal={prompt} defaultRepo="onboarding-repo" />
</section>

<section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
  <h2 className="text-xl font-bold">Activity Log</h2>
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
    </main>
  );
}

