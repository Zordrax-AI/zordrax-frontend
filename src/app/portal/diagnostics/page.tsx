// C:\Users\Zordr\Desktop\frontend-repo\src\app\portal\diagnostics\page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { API_BASE, health as healthCheck } from "@/lib/api";

export default function DiagnosticsPage() {
  const [health, setHealth] = useState<any>(null);
  const [healthError, setHealthError] = useState<string | null>(null);

  // Important: this is the proxy health URL (same-origin), not the ACA URL
  const healthUrl = useMemo(() => `${API_BASE}/health`, []);

  useEffect(() => {
    (async () => {
      try {
        setHealthError(null);
        const r = await healthCheck();
        setHealth(r);
      } catch (e: any) {
        setHealthError(e?.message || "Health check failed");
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Diagnostics</h1>
        <p className="text-sm text-slate-400">Debug frontend proxy + backend connectivity quickly.</p>
      </div>

      <Card>
        <h2 className="text-sm font-semibold">Frontend Environment</h2>
        <div className="mt-3 space-y-2 text-sm">
          <div>
            <div className="text-xs text-slate-500">Resolved proxy base used</div>
            <div className="break-all">{API_BASE}</div>
          </div>

          <div>
            <div className="text-xs text-slate-500">
              Note
            </div>
            <div className="text-slate-300">
              Browser never calls the onboarding service directly. It calls <code>/api/agent</code> and Next.js proxies.
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold">Backend Health (via proxy)</h2>
        <div className="mt-3 text-sm">
          <div className="text-xs text-slate-500">GET</div>
          <div className="break-all">{healthUrl}</div>

          {healthError ? (
            <div className="mt-3 rounded-md border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">
              {healthError}
              <div className="mt-2 text-xs text-red-200/80">
                If this fails locally, your proxy route <code>/api/agent</code> is misconfigured or the backend is down.
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
          <li>
            Your Next.js proxy route <code className="text-slate-100">/api/agent/[...path]</code> must exist and must forward to the ACA.
          </li>
          <li>
            If you use Vercel, only the server-side proxy needs the ACA URL (not the browser).
          </li>
          <li>
            Backend should respond 200 on <code className="text-slate-100">/health</code>.
          </li>
        </ul>
      </Card>
    </div>
  );
}
