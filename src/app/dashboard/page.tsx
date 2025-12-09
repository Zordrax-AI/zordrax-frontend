"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface PipelineRun {
  id: number;
  state?: string;
  result?: string;
  created?: string;
  url?: string;
}

interface HistoryResponse {
  count: number;
  items: PipelineRun[];
}

interface RetryResponse {
  status?: string;
  new_run_id?: number;
  url?: string;
}

type ManifestData = Record<string, unknown> | unknown[] | null;


export default function DashboardPage() {
  const [runs, setRuns] = useState<PipelineRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedRun, setSelectedRun] = useState<PipelineRun | null>(null);
  const [retryLoading, setRetryLoading] = useState(false);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);

  const [manifest, setManifest] = useState<ManifestData>(null);
  const [manifestLoading, setManifestLoading] = useState(false);
  const [manifestError, setManifestError] = useState<string | null>(null);

  const router = useRouter();

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  const pipelineBase = backendUrl
    ? `${backendUrl}/pipeline/pipeline`
    : undefined;

  // --------- LOAD HISTORY ----------
  const loadHistory = useCallback(async () => {
    if (!pipelineBase) {
      setError("NEXT_PUBLIC_BACKEND_URL is not configured.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${pipelineBase}/history?limit=20`);
      if (!res.ok) {
        setError(`History request failed (HTTP ${res.status})`);
        setRuns([]);
        return;
      }

      const data = (await res.json()) as HistoryResponse;
      setRuns(data.items ?? []);
    } catch {
      setError("Failed to load pipeline history.");
      setRuns([]);
    } finally {
      setLoading(false);
    }
  }, [pipelineBase]);  // ✅ FIXED DEPENDENCY

  useEffect(() => {
    loadHistory();     // ✅ OK because of useCallback()
  }, [loadHistory]);

  // --------- VIEW STATUS ----------
  function handleViewStatus(runId: number) {
    router.push(`/wizard/status?run=${runId.toString()}`);
  }

  // --------- RETRY RUN ----------
  async function handleRetry(runId: number) {
    if (!pipelineBase) {
      setRetryMessage("Backend URL is not configured.");
      return;
    }

    setRetryLoading(true);
    setRetryMessage(null);

    try {
      const res = await fetch(`${pipelineBase}/retry/${runId}`, {
        method: "POST",
      });

      if (!res.ok) {
        setRetryMessage(`Retry failed (HTTP ${res.status})`);
        return;
      }

      const data = (await res.json()) as RetryResponse;
      const newId = data.new_run_id;

      if (newId) {
        setRetryMessage(`Run retriggered as #${newId}`);
        router.push(`/wizard/status?run=${newId.toString()}`);
      } else {
        setRetryMessage("Retry completed, but no new_run_id was returned.");
      }

      await loadHistory();
    } catch {
      setRetryMessage("Retry request failed.");
    } finally {
      setRetryLoading(false);
    }
  }

  // --------- LOAD MANIFEST FOR SELECTED RUN ----------
  async function handleSelectRun(run: PipelineRun) {
    setSelectedRun(run);
    setManifest(null);
    setManifestError(null);

    if (!backendUrl) {
      setManifestError("Backend URL is not configured.");
      return;
    }

    const manifestUrl = `${backendUrl}/timeline/${run.id.toString()}`;
    setManifestLoading(true);

    try {
      const res = await fetch(manifestUrl);

      if (!res.ok) {
        setManifestError(`Manifest not available (HTTP ${res.status})`);
        setManifest(null);
        return;
      }

      const data = (await res.json()) as ManifestData;
      setManifest(data);
    } catch {
      setManifestError("Failed to load manifest for this run.");
      setManifest(null);
    } finally {
      setManifestLoading(false);
    }
  }

  // ---------- RENDER ----------
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold">Zordrax Deploy Console</h1>
          <p className="text-gray-400 mt-1">
            Full pipeline monitoring & control dashboard
          </p>
        </div>

        <button
          onClick={() => loadHistory()}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-900/50 border border-red-500 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* GRID: HISTORY + DETAILS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT: HISTORY TABLE */}
        <div className="lg:col-span-2 rounded-2xl bg-gray-900 p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent Pipeline Runs</h2>
            <span className="text-xs text-gray-400">
              Source: {backendUrl ?? "NEXT_PUBLIC_BACKEND_URL not set"}
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-800">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-800/60">
                <tr>
                  <th className="px-4 py-2 text-left">Run ID</th>
                  <th className="px-4 py-2 text-left">State</th>
                  <th className="px-4 py-2 text-left">Result</th>
                  <th className="px-4 py-2 text-left">Created</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>

              <tbody>
                {runs.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                      No runs found. Trigger a deployment from the wizard.
                    </td>
                  </tr>
                )}

                {runs.map((run) => {
                  const stateColor =
                    run.state?.toLowerCase() === "completed"
                      ? "text-green-400"
                      : run.state?.toLowerCase() === "running"
                      ? "text-yellow-300"
                      : "text-gray-300";

                  const resultColor =
                    run.result?.toLowerCase() === "succeeded"
                      ? "text-green-400"
                      : run.result?.toLowerCase() === "failed"
                      ? "text-red-400"
                      : "text-gray-300";

                  return (
                    <tr
                      key={run.id}
                      className="border-t border-gray-800 hover:bg-gray-800/40 cursor-pointer"
                      onClick={() => handleSelectRun(run)}
                    >
                      <td className="px-4 py-2 font-mono text-blue-300">
                        #{run.id}
                      </td>
                      <td className={`px-4 py-2 capitalize ${stateColor}`}>
                        {run.state ?? "—"}
                      </td>
                      <td className={`px-4 py-2 capitalize ${resultColor}`}>
                        {run.result ?? "—"}
                      </td>
                      <td className="px-4 py-2 text-gray-400">
                        {run.created
                          ? new Date(run.created).toLocaleString()
                          : "—"}
                      </td>

                      <td className="px-4 py-2 space-x-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewStatus(run.id);
                          }}
                          className="px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 text-xs"
                        >
                          Status
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRetry(run.id);
                          }}
                          disabled={retryLoading}
                          className="px-3 py-1 rounded bg-amber-600 hover:bg-amber-500 text-xs disabled:opacity-50"
                        >
                          {retryLoading ? "Retrying…" : "Retry"}
                        </button>

                        {run.url && (
                          <a
                            href={run.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-xs"
                          >
                            Logs
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {loading && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                      Loading history…
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {retryMessage && (
            <div className="mt-3 text-xs text-gray-300">
              {retryMessage}
            </div>
          )}
        </div>

        {/* RIGHT: Selected Run + Manifest */}
        <div className="rounded-2xl bg-gray-900 p-6 shadow-xl space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Selected Run</h2>

            {!selectedRun && (
              <p className="text-gray-500 text-sm">
                Click a row in the history table to see details & manifest.
              </p>
            )}

            {selectedRun && (
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-400">Run ID: </span>
                  <span className="font-mono text-blue-300">
                    #{selectedRun.id}
                  </span>
                </div>

                <div>
                  <span className="text-gray-400">State: </span>
                  <span>{selectedRun.state ?? "—"}</span>
                </div>

                <div>
                  <span className="text-gray-400">Result: </span>
                  <span>{selectedRun.result ?? "—"}</span>
                </div>

                <div>
                  <span className="text-gray-400">Created: </span>
                  <span>
                    {selectedRun.created
                      ? new Date(selectedRun.created).toLocaleString()
                      : "—"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Manifest Viewer */}
          <div className="border-t border-gray-800 pt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Terraform Manifest</h3>

              {selectedRun && (
                <button
                  type="button"
                  onClick={() => handleSelectRun(selectedRun)}
                  disabled={manifestLoading}
                  className="px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 text-xs disabled:opacity-50"
                >
                  {manifestLoading ? "Loading…" : "Reload"}
                </button>
              )}
            </div>

            {manifestError && (
              <div className="mb-2 text-xs text-red-400">
                {manifestError}
              </div>
            )}

            {manifest && (
              <pre className="bg-black text-green-400 rounded-lg p-3 text-xs max-h-80 overflow-auto">
                {JSON.stringify(manifest, null, 2)}
              </pre>
            )}

            {!manifest && selectedRun && !manifestLoading && !manifestError && (
              <p className="text-gray-500 text-xs">
                No manifest loaded yet. Click “Reload” to fetch from the backend.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
