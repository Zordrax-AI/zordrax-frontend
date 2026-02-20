"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

type CheckResult = {
  name: string;
  url: string;
  ok: boolean;
  status?: number | string;
  ms?: number;
  bodyPreview?: string;
  error?: string;
  optional?: boolean;
};

function trimBody(text: string) {
  if (!text) return "";
  return text.length > 300 ? `${text.slice(0, 300)}...` : text;
}

// Shared helper for all checks.
async function runCheck(name: string, url: string): Promise<CheckResult> {
  const started = performance.now();

  try {
    const res = await fetch(url, { cache: "no-store" });
    const ms = Math.round(performance.now() - started);
    const raw = await res.text();
    const preview = trimBody(raw || "(empty body)");

    return {
      name,
      url,
      ok: res.ok,
      status: res.status,
      ms,
      bodyPreview: preview,
      error: res.ok ? undefined : `HTTP ${res.status}`,
    };
  } catch (err: any) {
    const ms = Math.round(performance.now() - started);
    return {
      name,
      url,
      ok: false,
      status: "error",
      ms,
      bodyPreview: "",
      error: err?.message || "Request failed",
    };
  }
}

export default function DiagnosticsPage() {
  const baseFromEnv = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ?? "";
  const apiBase = useMemo(() => (baseFromEnv.endsWith("/") ? baseFromEnv.slice(0, -1) : baseFromEnv), [baseFromEnv]);

  const [results, setResults] = useState<CheckResult[]>([]);
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  useEffect(() => {
    void executeChecks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBase]);

  async function executeChecks() {
    if (!apiBase) {
      setResults([
        {
          name: "Configuration",
          url: "-",
          ok: false,
          status: "missing-env",
          ms: 0,
          bodyPreview: "",
          error: "Set NEXT_PUBLIC_API_BASE_URL (no trailing slash).",
        },
      ]);
      return;
    }

    setRunning(true);
    const checks: CheckResult[] = [];

    // 1) OpenAPI contract
    checks.push(await runCheck("OpenAPI contract", `${apiBase}/openapi.json`));

    // 2) Docs
    checks.push(await runCheck("Docs", `${apiBase}/docs`));

    // 3) Build tag sanity
    checks.push(await runCheck("Build tag", `${apiBase}/api/deploy/_debug/build`));

    // 4) Health (try /api/health then /health)
    const healthPrimary = await runCheck("Health (/api/health)", `${apiBase}/api/health`);
    if (healthPrimary.ok) {
      checks.push({ ...healthPrimary, name: "Health" });
    } else {
      const healthFallback = await runCheck("Health (/health)", `${apiBase}/health`);
      if (healthFallback.ok) {
        checks.push({ ...healthFallback, name: "Health" });
      } else {
        checks.push({
          ...healthPrimary,
          name: "Health",
          error: [healthPrimary.error, `Fallback /health -> ${healthFallback.status ?? healthFallback.error}`]
            .filter(Boolean)
            .join(" | "),
          bodyPreview: healthPrimary.bodyPreview || healthFallback.bodyPreview,
        });
      }
    }

    // 5) Runs (try query, then fallback without query)
    const runsPrimary = await runCheck("Runs (?limit=1)", `${apiBase}/api/runs?limit=1`);
    if (runsPrimary.ok) {
      checks.push({ ...runsPrimary, name: "Runs" });
    } else {
      const runsFallback = await runCheck("Runs (/api/runs)", `${apiBase}/api/runs`);
      if (runsFallback.ok) {
        checks.push({ ...runsFallback, name: "Runs" });
      } else {
        checks.push({
          ...runsPrimary,
          name: "Runs",
          error: [runsPrimary.error, `Fallback /api/runs -> ${runsFallback.status ?? runsFallback.error}`]
            .filter(Boolean)
            .join(" | "),
          bodyPreview: runsPrimary.bodyPreview || runsFallback.bodyPreview,
        });
      }
    }

    // 6) Recommendations (optional)
    const recommendations = await runCheck("Recommendations (optional)", `${apiBase}/api/recommendations`);
    checks.push({ ...recommendations, optional: true });

    setResults(checks);
    setRunning(false);
    setLastRun(new Date());
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Portal Diagnostics</h1>
          <p className="text-sm text-slate-400">
            Verify backend reachability using NEXT_PUBLIC_API_BASE_URL. Checks use GET with cache <code>no-store</code>.
          </p>
        </div>
        <a
          href="/portal/diagnostics/checks"
          className="inline-flex items-center justify-center rounded-md border border-[color:var(--border)] px-4 py-2 text-sm font-medium text-[color:var(--fg)] hover:bg-[color:var(--card-2)]"
        >
          API Checks
        </a>
      </div>

      <Card>
        <div className="flex flex-col gap-2 text-sm">
          <div className="font-medium text-[color:var(--fg)]">API base URL</div>
          <div className="break-all text-slate-200">{apiBase || "Not set"}</div>
          <div className="text-xs text-slate-400">
            Make sure the env value has no trailing slash (e.g. <code>http://localhost:8000</code>).
          </div>
        </div>
      </Card>

      <Card className="flex items-center justify-between gap-3">
        <div className="text-sm text-slate-200">
          {lastRun ? (
            <>
              Last run:{" "}
              <span className="text-slate-100">
                {lastRun.toLocaleString()}
              </span>
            </>
          ) : (
            "Checks auto-run on load."
          )}
        </div>
        <Button onClick={executeChecks} disabled={running}>
          {running ? "Running..." : "Run checks"}
        </Button>
      </Card>

      <div className="grid gap-4">
        {results.map((res) => (
          <Card key={res.name} className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--fg)]">
                <span>{res.name}</span>
                {res.optional && (
                  <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-400">
                    Optional
                  </span>
                )}
              </div>
              <span
                className={res.ok ? "text-emerald-400 text-sm font-semibold" : "text-red-400 text-sm font-semibold"}
              >
                {res.ok ? "OK" : "FAIL"}
              </span>
            </div>

            <div className="text-xs text-slate-400">URL</div>
            <a
              href={res.url}
              target="_blank"
              rel="noreferrer"
              className="break-all text-sm text-sky-300 underline underline-offset-2 hover:text-sky-200"
            >
              {res.url}
            </a>

            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-200">
              <div className="rounded-md bg-slate-800 px-2 py-1 text-xs">
                Status: {res.status ?? "—"}
              </div>
              <div className="rounded-md bg-slate-800 px-2 py-1 text-xs">Time: {res.ms ?? 0} ms</div>
              {!res.ok && res.error && (
                <div className="rounded-md bg-red-900/50 px-2 py-1 text-xs text-red-100">Error: {res.error}</div>
              )}
            </div>

            {res.bodyPreview && (
              <pre className="overflow-auto rounded-md border border-slate-800 bg-slate-950/50 p-3 text-xs text-slate-200">
                {res.bodyPreview}
              </pre>
            )}
          </Card>
        ))}
      </div>

      <Card>
        <div className="text-sm text-slate-200 font-semibold">Common causes of failures</div>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
          <li>CORS blocked: ensure backend allows the browser origin or test from the same host.</li>
          <li>Wrong base URL: confirm NEXT_PUBLIC_API_BASE_URL points at the live API, no trailing slash.</li>
          <li>Auth/proxy differences: 200s from the browser may require the same headers your server expects.</li>
        </ul>
      </Card>
    </div>
  );
}
