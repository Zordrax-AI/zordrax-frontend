"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";

const base =
  (process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_AGENT_BASE_URL ||
    process.env.NEXT_PUBLIC_ONBOARDING_API_URL ||
    "").replace(/\/$/, "");

export default function DiagnosticsPage() {
  const [health, setHealth] = useState<any>(null);
  const [healthError, setHealthError] = useState<string | null>(null);

  const healthUrl = useMemo(() => {
    if (!base) return "";
    return `${base}/health`;
  }, []);

  useEffect(() => {
    if (!healthUrl) {
      setHealthError("Missing NEXT_PUBLIC_API_BASE_URL (or legacy fallback vars).");
      return;
    }

    (async () => {
      try {
        setHealthError(null);
        const res = await fetch(healthUrl, { method: "GET" });
        const text = await res.text();
        if (!res.ok) throw new Error(`HTTP ${res.status} → ${text}`);
        setHealth(text ? JSON.parse(text) : { ok: true });
      } catch (e: any) {
        setHealthError(e?.message || "Health check failed");
      }
    })();
  }, [healthUrl]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Diagnostics</h1>
        <p className="text-sm text-slate-400">
          Debug env + backend connectivity + CORS quickly.
        </p>
      </div>

      <Card>
        <h2 className="text-sm font-semibold">Frontend Environment</h2>
        <div className="mt-3 space-y-2 text-sm">
          <div>
            <div className="text-xs text-slate-500">NEXT_PUBLIC_API_BASE_URL (preferred)</div>
            <div className="break-all">{process.env.NEXT_PUBLIC_API_BASE_URL || "(not set)"}</div>
          </div>

          <div>
            <div className="text-xs text-slate-500">NEXT_PUBLIC_AGENT_BASE_URL (legacy)</div>
            <div className="break-all">{process.env.NEXT_PUBLIC_AGENT_BASE_URL || "(not set)"}</div>
          </div>

          <div>
            <div className="text-xs text-slate-500">NEXT_PUBLIC_ONBOARDING_API_URL (legacy)</div>
            <div className="break-all">{process.env.NEXT_PUBLIC_ONBOARDING_API_URL || "(not set)"}</div>
          </div>

          <div>
            <div className="text-xs text-slate-500">Resolved base URL used</div>
            <div className="break-all">{base || "(empty)"}</div>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold">Backend Health</h2>
        <div className="mt-3 text-sm">
          <div className="text-xs text-slate-500">GET</div>
          <div className="break-all">{healthUrl || "(no url)"}</div>

          {healthError ? (
            <div className="mt-3 rounded-md border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">
              {healthError}
              <div className="mt-2 text-xs text-red-200/80">
                If this fails in browser but works via curl, it’s almost always CORS_ALLOW_ORIGINS.
              </div>
            </div>
          ) : (
            <pre className="mt-3 rounded-md border border-slate-900 bg-slate-950/40 p-3 text-xs overflow-auto">
              {JSON.stringify(health, null, 2)}
            </pre>
          )}
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold">What to check if broken</h2>
        <ul className="mt-3 list-disc pl-5 text-sm text-slate-300 space-y-2">
          <li>Vercel env: set <code className="text-slate-100">NEXT_PUBLIC_API_BASE_URL</code> for Preview + Production.</li>
          <li>Backend env: set <code className="text-slate-100">CORS_ALLOW_ORIGINS</code> to your Vercel domain(s).</li>
          <li>Backend should respond <code className="text-slate-100">200</code> at <code className="text-slate-100">/health</code>.</li>
        </ul>
      </Card>
    </div>
  );
}
