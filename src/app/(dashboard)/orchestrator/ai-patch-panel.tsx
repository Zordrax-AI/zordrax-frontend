"use client";

import { useMemo, useState } from "react";
import {
  AIPatchResponse,
  AIPatchValidationResponse,
  AIPRAutomationResponse,
  createAIPR,
  generateAIPatch,
  validateAIPatch,
} from "@/lib/zordrax-orchestrator-client";

function JsonPanel({ value }: { value: unknown }) {
  return (
    <pre className="max-h-80 overflow-auto rounded-xl border border-slate-200 bg-slate-950 p-4 text-xs text-slate-100">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function StatusBadge({ value }: { value?: string | null }) {
  const text = value || "unknown";

  const cls =
    text.toLowerCase().includes("created") || text.toLowerCase().includes("generated") || text.toLowerCase().includes("valid")
      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
      : text.toLowerCase().includes("blocked") || text.toLowerCase().includes("failed")
      ? "bg-red-100 text-red-800 border-red-300"
      : "bg-slate-100 text-slate-700 border-slate-300";

  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${cls}`}>{text}</span>;
}

export default function AIPatchPanel({
  runId,
  defaultGoal,
  defaultRepo = "onboarding-repo",
}: {
  runId: string;
  defaultGoal: string;
  defaultRepo?: string;
}) {
  const [repo, setRepo] = useState(defaultRepo);
  const [goal, setGoal] = useState(defaultGoal);
  const [patch, setPatch] = useState<AIPatchResponse | null>(null);
  const [validation, setValidation] = useState<AIPatchValidationResponse | null>(null);
  const [pr, setPr] = useState<AIPRAutomationResponse | null>(null);
  const [busy, setBusy] = useState<string>("");
  const [error, setError] = useState("");

  const effectiveRunId = useMemo(() => runId || `zxrun-ui-${Date.now()}`, [runId]);

  async function onGeneratePatch() {
    setBusy("generate");
    setError("");
    setValidation(null);
    setPr(null);

    try {
      const response = await generateAIPatch({
        run_id: effectiveRunId,
        repo,
        goal,
        requested_by: "founder",
      });
      setPatch(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI patch generation failed.");
    } finally {
      setBusy("");
    }
  }

  async function onValidatePatch() {
    if (!patch) return;

    setBusy("validate");
    setError("");

    try {
      const response = await validateAIPatch({
        run_id: patch.run_id,
        repo: patch.repo,
        files: patch.files,
      });
      setValidation(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI patch validation failed.");
    } finally {
      setBusy("");
    }
  }

  async function onCreateRealPr() {
    if (!patch) return;

    setBusy("create-pr");
    setError("");

    try {
      const response = await createAIPR({
        run_id: patch.run_id,
        repo: patch.repo,
        mode: "create_pr",
        files: patch.files,
        tests: patch.tests,
        created_by: "founder",
      });
      setPr(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI PR creation failed.");
    } finally {
      setBusy("");
    }
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">AI Patch → Real PR</h2>
          <p className="mt-1 text-sm text-slate-500">
            Generate a safe patch, validate policy, then create an Azure DevOps PR.
          </p>
        </div>

        <StatusBadge value={pr?.status || (validation?.valid ? "policy valid" : patch?.status || "idle")} />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <label>
          <span className="text-sm font-medium">Target repo</span>
          <select
            className="mt-1 w-full rounded-xl border border-slate-300 p-3"
            value={repo}
            onChange={(event) => setRepo(event.target.value)}
          >
            <option value="onboarding-repo">onboarding-repo</option>
            <option value="frontend-repo">frontend-repo</option>
            <option value="infra-repo">infra-repo</option>
            <option value="zordrax_config_orchestrator_mvp">zordrax_config_orchestrator_mvp</option>
          </select>
        </label>

        <label className="md:col-span-2">
          <span className="text-sm font-medium">Patch goal</span>
          <input
            className="mt-1 w-full rounded-xl border border-slate-300 p-3"
            value={goal}
            onChange={(event) => setGoal(event.target.value)}
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          disabled={!goal || busy === "generate"}
          onClick={onGeneratePatch}
        >
          {busy === "generate" ? "Generating..." : "Generate AI Patch"}
        </button>

        <button
          className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          disabled={!patch || busy === "validate"}
          onClick={onValidatePatch}
        >
          Validate Policy
        </button>

        <button
          className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          disabled={!patch || validation?.blocked || busy === "create-pr"}
          onClick={onCreateRealPr}
        >
          Create Real PR
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {pr?.pr_url && (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="font-semibold text-emerald-900">PR created successfully</p>
          <a
            href={pr.pr_url}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
          >
            Open PR #{pr.pr_id}
          </a>
        </div>
      )}

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <div>
          <h3 className="mb-2 font-semibold">Generated Patch</h3>
          <JsonPanel value={patch || { state: "not generated" }} />
        </div>

        <div>
          <h3 className="mb-2 font-semibold">Policy Validation</h3>
          <JsonPanel value={validation || { state: "not validated" }} />
        </div>

        <div>
          <h3 className="mb-2 font-semibold">Real PR Result</h3>
          <JsonPanel value={pr || { state: "not created" }} />
        </div>
      </div>
    </section>
  );
}
