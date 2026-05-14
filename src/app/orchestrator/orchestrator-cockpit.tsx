"use client";

import { useMemo, useState } from "react";
import {
  approveRun,
  buildPlan,
  BuildResponse,
  createPr,
  CreatePrResponse,
  deployDryRun,
  DeployDryRunResponse,
  getPrStatus,
  PrStatusResponse,
  RiskScoreResponse,
  scoreRisk,
} from "../../lib/zordrax-orchestrator-client";

type LogItem = {
  timestamp: string;
  level: "info" | "success" | "error";
  message: string;
};

function nowStamp() {
  return new Date().toLocaleTimeString();
}

export default function OrchestratorCockpit() {
  const [prompt, setPrompt] = useState("Build onboarding approval FastAPI endpoint");
  const [environment, setEnvironment] = useState("dev");
  const [requestedBy, setRequestedBy] = useState("founder");
  const [triggerPipeline, setTriggerPipeline] = useState(false);

  const [build, setBuild] = useState<BuildResponse | null>(null);
  const [approvalStatus, setApprovalStatus] = useState("");
  const [prResponse, setPrResponse] = useState<CreatePrResponse | null>(null);
  const [prStatus, setPrStatus] = useState<PrStatusResponse | null>(null);
  const [risk, setRisk] = useState<RiskScoreResponse | null>(null);
  const [deploy, setDeploy] = useState<DeployDryRunResponse | null>(null);
  const [loading, setLoading] = useState("");

  const [logs, setLogs] = useState<LogItem[]>([
    { timestamp: nowStamp(), level: "info", message: "Orchestrator cockpit ready." },
  ]);

  const runId = build?.run_id || "";
  const packageId = build?.package_contract?.package_id || "";
  const pipelineRunId = build?.azure_devops_pipeline_run_id || null;

  const canApprove = Boolean(runId);
  const canCreatePr = Boolean(runId && approvalStatus);
  const canPoll = Boolean(runId && pipelineRunId);
  const canDryRun = Boolean(runId);

  const primaryPrLinks = useMemo(() => {
    return prResponse?.proposals?.filter((proposal) => proposal.pr_url) || [];
  }, [prResponse]);

  function addLog(level: LogItem["level"], message: string) {
    setLogs((prev) => [{ timestamp: nowStamp(), level, message }, ...prev]);
  }

  async function onBuild(trigger: boolean) {
    try {
      setLoading(trigger ? "trigger-validation" : "build-plan");
      addLog("info", trigger ? "Creating build plan and triggering validation..." : "Creating build plan...");
      const response = await buildPlan({
        prompt,
        requested_by: requestedBy,
        environment,
        triggerPipeline: trigger,
      });
      setBuild(response);
      setPrResponse(null);
      setApprovalStatus("");
      setPrStatus(null);
      setDeploy(null);
      addLog("success", `Build created: ${response.run_id}, package: ${response.package_contract.package_id}`);
      if (response.azure_devops_pipeline_run_id) {
        addLog("success", `Validation pipeline triggered: ${response.azure_devops_pipeline_run_id}`);
      }
    } catch (error) {
      addLog("error", error instanceof Error ? error.message : "Build failed.");
    } finally {
      setLoading("");
    }
  }

  async function onApprove() {
    if (!runId) return;
    try {
      setLoading("approve");
      addLog("info", `Approving run ${runId}...`);
      const response = await approveRun({
        run_id: runId,
        approved_by: requestedBy,
        comment: "Approved from Orchestrator Cockpit UI.",
      });
      setApprovalStatus(response.status);
      addLog("success", `Approval recorded: ${response.status}`);
    } catch (error) {
      addLog("error", error instanceof Error ? error.message : "Approval failed.");
    } finally {
      setLoading("");
    }
  }

  async function onCreatePr() {
    if (!runId) return;
    try {
      setLoading("create-pr");
      addLog("info", `Creating PRs for run ${runId}...`);
      const response = await createPr({ run_id: runId, created_by: requestedBy });
      setPrResponse(response);
      addLog("success", `PR flow complete: ${response.status}`);
    } catch (error) {
      addLog("error", error instanceof Error ? error.message : "Create PR failed.");
    } finally {
      setLoading("");
    }
  }

  async function onPollStatus() {
    if (!runId || !pipelineRunId) return;
    try {
      setLoading("pr-status");
      addLog("info", `Polling validation pipeline ${pipelineRunId}...`);
      const response = await getPrStatus({ run_id: runId, pipeline_run_id: pipelineRunId });
      setPrStatus(response);
      addLog("success", `Validation status: ${response.state}`);
    } catch (error) {
      addLog("error", error instanceof Error ? error.message : "Status poll failed.");
    } finally {
      setLoading("");
    }
  }

  async function onRiskScore() {
    if (!runId) return;
    try {
      setLoading("risk-score");
      addLog("info", "Calculating risk score...");
      const response = await scoreRisk({
        run_id: runId,
        environment,
        terraform_add: 1,
        terraform_change: 0,
        terraform_destroy: 0,
      });
      setRisk(response);
      addLog("success", `Risk score: ${response.risk_score} (${response.risk_level})`);
    } catch (error) {
      addLog("error", error instanceof Error ? error.message : "Risk score failed.");
    } finally {
      setLoading("");
    }
  }

  async function onDeployDryRun() {
    if (!runId) return;
    try {
      setLoading("deploy-dry-run");
      addLog("info", "Planning deployment dry-run...");
      const response = await deployDryRun({ run_id: runId, environment, approved_by: requestedBy });
      setDeploy(response);
      addLog("success", `Deploy dry-run: ${response.status}`);
    } catch (error) {
      addLog("error", error instanceof Error ? error.message : "Deploy dry-run failed.");
    } finally {
      setLoading("");
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <header className="mb-8">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Zordrax-Analytica</p>
          <h1 className="mt-2 text-3xl font-semibold">AI Orchestrator Cockpit</h1>
          <p className="mt-2 max-w-3xl text-slate-300">
            Prompt the SaaS build system, trigger validation, approve work, create PRs,
            review risk, and run controlled deployment dry-runs.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
            <h2 className="text-xl font-semibold">1. Prompt</h2>
            <label className="mt-4 block text-sm text-slate-300">Build task</label>
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              className="mt-2 h-36 w-full rounded-xl border border-slate-700 bg-slate-950 p-4 text-slate-100 outline-none focus:border-cyan-400"
            />

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <label className="block text-sm text-slate-300">
                Requested by
                <input
                  value={requestedBy}
                  onChange={(event) => setRequestedBy(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-slate-100 outline-none focus:border-cyan-400"
                />
              </label>

              <label className="block text-sm text-slate-300">
                Environment
                <select
                  value={environment}
                  onChange={(event) => setEnvironment(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-slate-100 outline-none focus:border-cyan-400"
                >
                  <option value="dev">dev</option>
                  <option value="uat">uat</option>
                  <option value="prod">prod</option>
                </select>
              </label>

              <label className="flex items-end gap-3 rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={triggerPipeline}
                  onChange={(event) => setTriggerPipeline(event.target.checked)}
                />
                Trigger validation pipeline
              </label>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button onClick={() => onBuild(false)} disabled={Boolean(loading)} className="rounded-xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50">
                {loading === "build-plan" ? "Building..." : "Build Plan"}
              </button>
              <button onClick={() => onBuild(true)} disabled={Boolean(loading)} className="rounded-xl bg-indigo-500 px-4 py-3 font-semibold text-white hover:bg-indigo-400 disabled:opacity-50">
                {loading === "trigger-validation" ? "Triggering..." : "Trigger Validation"}
              </button>
              <button onClick={onApprove} disabled={!canApprove || Boolean(loading)} className="rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50">
                {loading === "approve" ? "Approving..." : "Approve"}
              </button>
              <button onClick={onCreatePr} disabled={!canCreatePr || Boolean(loading)} className="rounded-xl bg-amber-500 px-4 py-3 font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-50">
                {loading === "create-pr" ? "Creating..." : "Create PR"}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
            <h2 className="text-xl font-semibold">Run Summary</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div><dt className="text-slate-400">Run ID</dt><dd className="font-mono text-cyan-200">{runId || "Not created yet"}</dd></div>
              <div><dt className="text-slate-400">Package ID</dt><dd className="font-mono text-cyan-200">{packageId || "Not created yet"}</dd></div>
              <div><dt className="text-slate-400">Pipeline Run</dt><dd className="font-mono text-cyan-200">{pipelineRunId || "Not triggered"}</dd></div>
              <div><dt className="text-slate-400">Approval</dt><dd className="text-emerald-300">{approvalStatus || "Pending"}</dd></div>
            </dl>

            {build?.azure_devops_pipeline_url ? (
              <a href={build.azure_devops_pipeline_url} target="_blank" rel="noreferrer" className="mt-4 inline-block rounded-xl border border-cyan-500 px-4 py-2 text-cyan-200 hover:bg-cyan-500/10">
                Open Azure Pipeline
              </a>
            ) : null}
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          <Panel title="6. PR Status" button="Poll" onClick={onPollStatus} disabled={!canPoll || Boolean(loading)} data={prStatus || { state: "not polled" }} />
          <Panel title="7. Risk Score" button="Score" onClick={onRiskScore} disabled={!runId || Boolean(loading)} data={risk || { risk: "not calculated" }} />
          <Panel title="8. Deploy Dry-Run" button="Dry Run" onClick={onDeployDryRun} disabled={!canDryRun || Boolean(loading)} data={deploy || { deployment: "not planned" }} />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
            <h2 className="text-lg font-semibold">PR Proposals</h2>
            <div className="mt-4 space-y-3">
              {primaryPrLinks.length ? primaryPrLinks.map((proposal) => (
                <div key={`${proposal.repo}-${proposal.branch_name}`} className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <div className="font-semibold">{proposal.repo}</div>
                  <div className="mt-1 font-mono text-xs text-cyan-200">{proposal.branch_name}</div>
                  <a href={proposal.pr_url || "#"} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-cyan-300 underline">
                    Open PR #{proposal.pr_id}
                  </a>
                </div>
              )) : <p className="text-sm text-slate-400">No PRs created yet.</p>}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
            <h2 className="text-lg font-semibold">9. Activity Log</h2>
            <div className="mt-4 max-h-96 space-y-2 overflow-auto">
              {logs.map((log, index) => (
                <div key={`${log.timestamp}-${index}`} className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm">
                  <span className="font-mono text-xs text-slate-500">{log.timestamp}</span>
                  <span className={log.level === "success" ? "ml-3 text-emerald-300" : log.level === "error" ? "ml-3 text-red-300" : "ml-3 text-cyan-300"}>
                    {log.level.toUpperCase()}
                  </span>
                  <p className="mt-1 text-slate-300">{log.message}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Panel(props: {
  title: string;
  button: string;
  onClick: () => void;
  disabled: boolean;
  data: unknown;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{props.title}</h2>
        <button onClick={props.onClick} disabled={props.disabled} className="rounded-lg bg-slate-700 px-3 py-2 text-sm hover:bg-slate-600 disabled:opacity-50">
          {props.button}
        </button>
      </div>
      <pre className="mt-4 max-h-64 overflow-auto rounded-xl bg-slate-950 p-3 text-xs text-slate-300">
        {JSON.stringify(props.data, null, 2)}
      </pre>
    </div>
  );
}
