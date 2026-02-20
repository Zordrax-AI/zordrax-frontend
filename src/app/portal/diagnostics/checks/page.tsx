"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api";

type ResultKind = "PASS" | "FAIL" | "SKIP";

type Row = {
  endpoint: string;
  method: string;
  status?: number | string;
  latency?: number;
  result: ResultKind;
  notes?: string;
};

const ENDPOINTS = {
  connectorsPost: "/api/za/api/connectors/",
  connectorsGet: "/api/za/api/connectors",
  requirementSets: "/api/za/api/brd/requirement-sets/",
  requirementSet: (id: string) => `/api/za/api/brd/requirement-sets/${id}`,
  recommendationsTop3: "/api/za/api/recommendations/top3",
  recommendationsSelect: "/api/za/api/recommendations/select",
  deployPlan: "/api/za/api/deploy/plan",
};

function preview(text: string, max = 200) {
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function describeError(err: unknown): { status?: number | string; note: string } {
  if (err instanceof ApiError) {
    const bodyText =
      typeof err.body === "string"
        ? err.body
        : err.body
        ? (() => {
            try {
              return JSON.stringify(err.body);
            } catch {
              return err.message;
            }
          })()
        : err.message;
    return { status: err.status, note: preview(bodyText) };
  }
  if (err instanceof Error) return { status: "error", note: err.message };
  return { status: "error", note: "Unknown error" };
}

const REQSET_STORAGE_KEY = "za_diagnostics_requirement_set_id";

export default function DiagnosticsChecksPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [running, setRunning] = useState(false);
  const [requirementSetId, setRequirementSetId] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem(REQSET_STORAGE_KEY) || "";
  });

  // Load saved requirement set id on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(REQSET_STORAGE_KEY);
    if (saved) setRequirementSetId(saved);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (requirementSetId) {
        window.localStorage.setItem(REQSET_STORAGE_KEY, requirementSetId);
      }
    } catch {
      /* ignore */
    }
  }, [requirementSetId]);

  async function createRequirementSetApi() {
    // create session first (backend expects it)
    await fetch("/api/za/api/brd/sessions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    });

    const res = await fetch("/api/za/api/brd/requirement-sets", {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: `diag-${Date.now()}`, description: "diagnostics" }),
    });
    const text = await res.text();
    const json = text ? JSON.parse(text) : {};
    const newId = json?.requirement_set_id || json?.id;
    if (!res.ok || !newId) {
      throw new Error(preview(text) || "Failed to create requirement set");
    }
    return newId as string;
  }

  async function createAndUseNewRequirementSet() {
    setRunning(true);
    try {
      const id = await createRequirementSetApi();
      setRequirementSetId(id);
      return id;
    } finally {
      setRunning(false);
    }
  }

  async function runChecks() {
    setRunning(true);
    setRows([]);

    try {
      const results: Row[] = [];
      const startRow = (endpoint: string, method: string) => performance.now();
      const addRow = (row: Row) => results.push(row);

      let connectorId: string | undefined;
      let currentReqSetId: string | undefined = requirementSetId || undefined;
      let recommendationId: string | undefined;

      // POST connectors (unique name each run, exact contract: name/type/config_json)
      {
        const t0 = startRow(ENDPOINTS.connectorsPost, "POST");
        const connectorName = `diag-${Date.now()}`;
        const payload = {
          name: connectorName,
          type: "postgres",
          config_json: { host: "localhost", port: 5432, database: "db", user: "user", password: "password" },
        };
        try {
          // Use fetch directly to hit the exact path (trailing slash) with minimal contract.
          const res = await fetch(ENDPOINTS.connectorsPost, {
            method: "POST",
            cache: "no-store",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const latency = Math.round(performance.now() - t0);
          const text = await res.text();

          if (res.ok) {
            const json = text ? JSON.parse(text) : {};
            connectorId = (json as any)?.id || (json as any)?.connector_id;
            addRow({
              endpoint: ENDPOINTS.connectorsPost,
              method: "POST",
              status: res.status,
              latency,
              result: "PASS",
              notes: connectorId ? `connector_id=${connectorId}` : "created/resolved",
            });
          } else if (res.status === 409) {
            // resolve via list
            try {
              const listRes = await fetch(ENDPOINTS.connectorsGet, { cache: "no-store" });
              const listText = await listRes.text();
              const connectors = listText ? JSON.parse(listText) : [];
              const match = Array.isArray(connectors)
                ? connectors.find(
                    (c: any) =>
                      (c.name ?? "").toLowerCase() === connectorName.toLowerCase() &&
                      (c.type ?? "").toLowerCase() === "postgres"
                  )
                : undefined;
              if (match) {
                connectorId = match.id || match.connector_id;
                addRow({
                  endpoint: ENDPOINTS.connectorsPost,
                  method: "POST",
                  status: res.status,
                  latency,
                  result: "PASS",
                  notes: `Conflict handled; reused connector_id=${connectorId}`,
                });
              } else {
                addRow({
                  endpoint: ENDPOINTS.connectorsPost,
                  method: "POST",
                  status: res.status,
                  latency,
                  result: "FAIL",
                  notes: `409 conflict; no matching existing connector found. Body: ${preview(text)}`,
                });
              }
            } catch (lookupErr) {
              addRow({
                endpoint: ENDPOINTS.connectorsPost,
                method: "POST",
                status: res.status,
                latency,
                result: "FAIL",
                notes: `409 conflict; lookup failed: ${preview(String(lookupErr))}`,
              });
            }
          } else {
            addRow({
              endpoint: ENDPOINTS.connectorsPost,
              method: "POST",
              status: res.status,
              latency,
              result: "FAIL",
              notes: preview(text),
            });
          }
        } catch (err) {
          const info = describeError(err);
          addRow({
            endpoint: ENDPOINTS.connectorsPost,
            method: "POST",
            status: info.status,
            latency: Math.round(performance.now() - t0),
            result: "FAIL",
            notes: info.note,
          });
        }
      }

      // GET requirement sets collection (expected 405 -> mark NOT_SUPPORTED and continue)
      {
        const t0 = startRow(ENDPOINTS.requirementSets, "GET");
        try {
          const res = await fetch(ENDPOINTS.requirementSets, { cache: "no-store" });
          const latency = Math.round(performance.now() - t0);
          const text = await res.text();
          if (res.status === 405) {
            addRow({
              endpoint: ENDPOINTS.requirementSets,
              method: "GET",
              status: res.status,
              latency,
              result: "SKIP",
              notes: "Backend returns 405 for collection list. Verified by GET /requirement-sets/{id} instead.",
            });
          } else {
            addRow({
              endpoint: ENDPOINTS.requirementSets,
              method: "GET",
              status: res.status,
              latency,
              result: res.ok ? "PASS" : "FAIL",
              notes: res.ok ? "Collection reachable" : preview(text),
            });
          }
        } catch (err) {
          const info = describeError(err);
          addRow({
            endpoint: ENDPOINTS.requirementSets,
            method: "GET",
            status: info.status,
            latency: Math.round(performance.now() - t0),
            result: "FAIL",
            notes: info.note,
          });
        }
      }

      // Ensure we have a requirement_set_id (prefer stored, else create)
      if (!currentReqSetId) {
        try {
          const id = await createRequirementSetApi();
          currentReqSetId = id;
          setRequirementSetId(id);
        } catch (createErr) {
          const info = describeError(createErr);
          addRow({
            endpoint: ENDPOINTS.requirementSets,
            method: "POST",
            status: info.status,
            latency: 0,
            result: "FAIL",
            notes: `Failed to create requirement set: ${info.note}`,
          });
        }
      }

      // GET requirement set by id (real verification)
      {
        const id = currentReqSetId;
        if (!id) {
          addRow({
            endpoint: ENDPOINTS.requirementSets,
            method: "GET",
            status: "n/a",
            latency: 0,
            result: "SKIP",
            notes: "Skipped: requirement_set_id unavailable",
          });
        } else {
          currentReqSetId = id;
          const t0 = startRow(ENDPOINTS.requirementSets, "GET");
          const url = ENDPOINTS.requirementSet(id);
          try {
            const res = await fetch(url, { cache: "no-store" });
            const latency = Math.round(performance.now() - t0);
            const text = await res.text();
            addRow({
              endpoint: url,
              method: "GET",
              status: res.status,
              latency,
              result: res.ok ? "PASS" : "FAIL",
              notes: res.ok ? `requirement_set_id=${id}` : preview(text),
            });
          } catch (err) {
            const info = describeError(err);
            addRow({
              endpoint: url,
              method: "GET",
              status: info.status,
              latency: Math.round(performance.now() - t0),
              result: "FAIL",
              notes: info.note,
            });
          }
        }
      }

      // GET top3 recommendations
      {
        const id = currentReqSetId;
        if (!id) {
          addRow({
            endpoint: `${ENDPOINTS.recommendationsTop3}?requirement_set_id=...`,
            method: "GET",
            status: "n/a",
            latency: 0,
            result: "SKIP",
            notes: "Skipped: no requirement_set_id",
          });
        } else {
          currentReqSetId = id;
          const t0 = startRow(ENDPOINTS.recommendationsTop3, "GET");
          const url = `${ENDPOINTS.recommendationsTop3}?requirement_set_id=${encodeURIComponent(id)}`;
          try {
            const res = await fetch(url, { cache: "no-store" });
            const latency = Math.round(performance.now() - t0);
            const text = await res.text();
            let data: any = null;
            try {
              data = text ? JSON.parse(text) : null;
            } catch {
              data = null;
            }
            const first = Array.isArray(data) && data.length ? data[0] : null;
            recommendationId =
              first?.id ||
              first?.option_key ||
              first?.option_id ||
              first?.recommendation_id ||
              first?.key;

            addRow({
              endpoint: url,
              method: "GET",
              status: res.status,
              latency,
              result: res.ok ? "PASS" : "FAIL",
              notes: res.ok
                ? recommendationId
                  ? `recommendation_id=${recommendationId}`
                  : "No recommendations returned"
                : preview(text),
            });
          } catch (err) {
            const info = describeError(err);
            addRow({
              endpoint: `${ENDPOINTS.recommendationsTop3}?requirement_set_id=${encodeURIComponent(id)}`,
              method: "GET",
              status: info.status,
              latency: Math.round(performance.now() - t0),
              result: "FAIL",
              notes: info.note,
            });
          }
        }
      }

      // POST select recommendation
      {
        const id = currentReqSetId;
        if (!id || !recommendationId) {
          addRow({
            endpoint: ENDPOINTS.recommendationsSelect,
            method: "POST",
            status: "n/a",
            latency: 0,
            result: "SKIP",
            notes: "Skipped: missing requirement_set_id or recommendation_id",
          });
        } else {
          currentReqSetId = id;
          setRequirementSetId(id);
          const t0 = startRow(ENDPOINTS.recommendationsSelect, "POST");
          try {
            const res = await fetch(ENDPOINTS.recommendationsSelect, {
              method: "POST",
              cache: "no-store",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ requirement_set_id: id, option_id: recommendationId }),
            });
            const latency = Math.round(performance.now() - t0);
            const text = await res.text();
            addRow({
              endpoint: ENDPOINTS.recommendationsSelect,
              method: "POST",
              status: res.status,
              latency,
              result: res.ok ? "PASS" : "FAIL",
              notes: res.ok ? "Selected first recommendation" : preview(text),
            });
          } catch (err) {
            const info = describeError(err);
            addRow({
              endpoint: ENDPOINTS.recommendationsSelect,
              method: "POST",
              status: info.status,
              latency: Math.round(performance.now() - t0),
              result: "FAIL",
              notes: info.note,
            });
          }
        }
      }

      // POST deploy plan
      {
        const id = currentReqSetId;
        if (!id) {
          addRow({
            endpoint: ENDPOINTS.deployPlan,
            method: "POST",
            status: "n/a",
            latency: 0,
            result: "SKIP",
            notes: "Skipped: no requirement_set_id",
          });
        } else {
          currentReqSetId = id;
          const payload: any = {
            requirement_set_id: id,
            name_prefix: "diag",
            region: "westeurope",
            environment: "dev",
          };
          if (connectorId) payload.connector_id = connectorId;

          const t0 = startRow(ENDPOINTS.deployPlan, "POST");
          try {
            const res = await fetch(ENDPOINTS.deployPlan, {
              method: "POST",
              cache: "no-store",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            const latency = Math.round(performance.now() - t0);
            const text = await res.text();
            let json: any = null;
            try {
              json = text ? JSON.parse(text) : null;
            } catch {
              json = null;
            }

            if (res.status === 200) {
              const runId = json?.run_id || json?.id;
              addRow({
                endpoint: ENDPOINTS.deployPlan,
                method: "POST",
                status: res.status,
                latency,
                result: "PASS",
                notes: runId ? `run_id=${runId}` : "OK",
              });
            } else if (res.status === 409) {
              const runId =
                json?.run_id ||
                json?.existing_run_id ||
                json?.detail?.run_id ||
                json?.detail?.existing_run_id;

              if (typeof runId === "string" && runId && runId !== "conflict") {
                addRow({
                  endpoint: ENDPOINTS.deployPlan,
                  method: "POST",
                  status: res.status,
                  latency,
                  result: "PASS",
                  notes: `409 conflict → existing run_id=${runId}`,
                });
              } else {
                addRow({
                  endpoint: ENDPOINTS.deployPlan,
                  method: "POST",
                  status: res.status,
                  latency,
                  result: "FAIL",
                  notes: `409 conflict but no run_id returned. Body: ${preview(text)}`,
                });
              }
            } else {
              addRow({
                endpoint: ENDPOINTS.deployPlan,
                method: "POST",
                status: res.status,
                latency,
                result: "FAIL",
                notes: preview(text),
              });
            }
          } catch (err) {
            const info = describeError(err);
            addRow({
              endpoint: ENDPOINTS.deployPlan,
              method: "POST",
              status: info.status,
              latency: Math.round(performance.now() - t0),
              result: "FAIL",
              notes: info.note,
            });
          }
        }
      }

      // GET connectors
      {
        const t0 = startRow(ENDPOINTS.connectorsGet, "GET");
        try {
          const res = await fetch(ENDPOINTS.connectorsGet, { cache: "no-store" });
          const latency = Math.round(performance.now() - t0);
          const text = await res.text();
          addRow({
            endpoint: ENDPOINTS.connectorsGet,
            method: "GET",
            status: res.status,
            latency,
            result: res.ok ? "PASS" : "FAIL",
            notes: res.ok ? "Connectors list reachable" : preview(text),
          });
        } catch (err) {
          const info = describeError(err);
          addRow({
            endpoint: ENDPOINTS.connectorsGet,
            method: "GET",
            status: info.status,
            latency: Math.round(performance.now() - t0),
            result: "FAIL",
            notes: info.note,
          });
        }
      }

      setRows(results);
    } finally {
      setRunning(false);
    }
  }

  const badgeColor = (result: ResultKind) => {
    if (result === "PASS") return "text-emerald-400";
    if (result === "SKIP") return "text-amber-300";
    return "text-red-400";
  };

  const rowBg = (result: ResultKind) => {
    if (result === "PASS") return "bg-emerald-500/5";
    if (result === "SKIP") return "bg-amber-500/5";
    return "bg-red-500/5";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">API Checks</h1>
          <p className="text-sm text-slate-400">
            Verifies required backend routes via the Next proxy at <code>/api/za</code>.
          </p>
        </div>
        <Button onClick={runChecks} disabled={running}>
          {running ? "Running..." : "Run checks"}
        </Button>
      </div>

      <Card className="space-y-3">
        <div className="text-sm font-semibold text-[color:var(--fg)]">Requirement Set</div>
        <label className="flex flex-col gap-2 text-sm text-slate-300">
          <span className="text-xs uppercase tracking-wide text-slate-500">Requirement Set ID</span>
          <input
            className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--fg)]"
            placeholder="Enter existing requirement_set_id"
            value={requirementSetId}
            onChange={(e) => {
              setRequirementSetId(e.target.value);
            }}
          />
        </label>
        <Button
          variant="outline"
          onClick={async () => {
            try {
              await createAndUseNewRequirementSet();
            } catch (err) {
              alert(describeError(err).note);
            }
          }}
          disabled={running}
        >
          Create & Use New Requirement Set
        </Button>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full table-auto text-sm">
            <thead className="text-xs uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-3 py-2 text-left">Endpoint</th>
                <th className="px-3 py-2 text-left">Method</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Latency (ms)</th>
                <th className="px-3 py-2 text-left">Result</th>
                <th className="px-3 py-2 text-left">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {rows.length === 0 ? (
                <tr>
                  <td className="px-3 py-3 text-slate-400 text-sm" colSpan={6}>
                    Click &quot;Run checks&quot; to start.
                  </td>
                </tr>
              ) : (
                rows.map((row, idx) => (
                  <tr key={idx} className={rowBg(row.result)}>
                    <td className="px-3 py-3 break-all font-mono text-xs">{row.endpoint}</td>
                    <td className="px-3 py-3">{row.method}</td>
                    <td className="px-3 py-3">{row.status ?? "--"}</td>
                    <td className="px-3 py-3">{row.latency ?? "--"}</td>
                    <td className="px-3 py-3 font-semibold">
                      <span className={badgeColor(row.result)}>{row.result}</span>
                    </td>
                    <td className="px-3 py-3 text-slate-200 whitespace-pre-wrap">{row.notes || "--"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

