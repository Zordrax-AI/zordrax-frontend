"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type HealthStatus = "unknown" | "ok" | "error";

interface ServiceHealth {
  name: string;
  url: string;
  status: HealthStatus;
  message?: string;
  latencyMs?: number;
}

function readableUrl(url?: string) {
  if (!url) return "not set";
  try {
    const u = new URL(url);
    return u.origin + u.pathname;
  } catch {
    return url;
  }
}

export default function RoutesDashboard() {
  const [services, setServices] = useState<ServiceHealth[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  // These are baked in at build time from NEXT_PUBLIC_* env vars
  const backend = process.env.NEXT_PUBLIC_BACKEND_URL;
  const onboarding = process.env.NEXT_PUBLIC_ONBOARDING_API_URL;
  const auth = process.env.NEXT_PUBLIC_AUTH_URL;

  useEffect(() => {
    void runHealthCheck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runHealthCheck() {
    const targets: { name: string; baseUrl?: string; healthPath: string }[] = [
      { name: "Onboarding", baseUrl: onboarding ?? backend, healthPath: "/health" },
      { name: "Backend", baseUrl: backend, healthPath: "/health" },
      { name: "Auth", baseUrl: auth, healthPath: "/health" },
    ];

    setIsChecking(true);

    const checks = await Promise.all(
      targets.map(async (t): Promise<ServiceHealth> => {
        if (!t.baseUrl) {
          return {
            name: t.name,
            url: "not configured",
            status: "unknown",
            message: "Environment variable not set",
          };
        }

        const url = `${t.baseUrl.replace(/\/$/, "")}${t.healthPath}`;
        const started = performance.now();

        try {
          const res = await fetch(url, { method: "GET" });
          const latencyMs = Math.round(performance.now() - started);

          if (!res.ok) {
            return {
              name: t.name,
              url,
              status: "error",
              latencyMs,
              message: `HTTP ${res.status}`,
            };
          }

          return {
            name: t.name,
            url,
            status: "ok",
            latencyMs,
            message: "Healthy",
          };
        } catch (error) {
          const latencyMs = Math.round(performance.now() - started);
          return {
            name: t.name,
            url,
            status: "error",
            latencyMs,
            message:
              error instanceof Error ? error.message : "Network error calling health endpoint",
          };
        }
      })
    );

    setServices(checks);
    setIsChecking(false);
  }

  return (
    <main className="mx-auto flex min-height-screen max-w-6xl flex-col gap-8 px-6 py-10">
      {/* Header */}
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
          Zordrax Analytica
        </p>
        <h1 className="text-3xl font-bold text-gray-900">
          Deployment & Connectivity Console
        </h1>
        <p className="text-sm text-gray-600">
          Live view of frontend ↔ backend connectivity, environment config, and deployment entry
          points.
        </p>
      </header>

      {/* Health + Env vars */}
      <section className="grid gap-6 md:grid-cols-3">
        {/* Health panel */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Backend health</h2>
            <button
              type="button"
              onClick={() => void runHealthCheck()}
              disabled={isChecking}
              className="rounded-full border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 disabled:opacity-50"
            >
              {isChecking ? "Checking..." : "Recheck"}
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {services.map((svc) => (
              <div
                key={svc.name}
                className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{svc.name}</span>
                  <span
                    className={
                      svc.status === "ok"
                        ? "inline-flex h-2 w-2 rounded-full bg-emerald-500"
                        : svc.status === "error"
                        ? "inline-flex h-2 w-2 rounded-full bg-red-500"
                        : "inline-flex h-2 w-2 rounded-full bg-yellow-400"
                    }
                  />
                </div>
                <p className="mt-2 break-all text-[11px] text-gray-500">
                  {svc.url === "not configured" ? "Not configured" : readableUrl(svc.url)}
                </p>
                <p className="mt-2 text-xs text-gray-700">
                  {svc.message ?? "No response yet"}
                  {svc.latencyMs != null && ` · ${svc.latencyMs}ms`}
                </p>
              </div>
            ))}

            {services.length === 0 && (
              <p className="text-sm text-gray-500">
                No checks yet. Click <span className="font-medium">Recheck</span> to run health
                checks.
              </p>
            )}
          </div>
        </div>

        {/* Env snapshot */}
        <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Environment snapshot</h2>
          <dl className="space-y-2 text-xs">
            <div>
              <dt className="font-medium text-gray-700">NEXT_PUBLIC_BACKEND_URL</dt>
              <dd className="truncate text-gray-500">{backend ?? "not set"}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-700">NEXT_PUBLIC_ONBOARDING_API_URL</dt>
              <dd className="truncate text-gray-500">{onboarding ?? "not set"}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-700">NEXT_PUBLIC_AUTH_URL</dt>
              <dd className="truncate text-gray-500">{auth ?? "not set"}</dd>
            </div>
          </dl>
          <p className="mt-2 text-[11px] text-gray-500">
            These values are baked in at build time. If they are wrong here, fix them in your Azure
            Static Web App config and redeploy.
          </p>
        </div>
      </section>

      {/* Entry points: wizard / manual / history */}
      <section className="grid gap-6 md:grid-cols-3">
        <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Run a test deployment</h2>
          <p className="text-xs text-gray-600">
            Trigger the AI onboarding + infra pipeline from the wizard. You&apos;ll be redirected to
            a live status page.
          </p>
          <Link
            href="/wizard"
            className="inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700"
          >
            Open AI Deploy Wizard
          </Link>
        </div>

        <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Manual deploy console</h2>
          <p className="text-xs text-gray-600">
            For curated, non-AI deployments, use the manual console when you want full control.
          </p>
          <Link
            href="/routes/manual"
            className="inline-flex items-center justify-center rounded-full bg-gray-900 px-4 py-2 text-xs font-medium text-white hover:bg-black"
          >
            Open Manual Console
          </Link>
        </div>

        <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">History & governance</h2>
          <p className="text-xs text-gray-600">
            Review previous runs, governance checks, and merged manifests when those endpoints are
            wired in.
          </p>
          <div className="flex gap-2">
            <Link
              href="/routes/deployments"
              className="flex-1 rounded-full border border-gray-200 px-3 py-2 text-center text-xs font-medium text-gray-800 hover:bg-gray-50"
            >
              Deployments
            </Link>
            <Link
              href="/routes/governance"
              className="flex-1 rounded-full border border-gray-200 px-3 py-2 text-center text-xs font-medium text-gray-800 hover:bg-gray-50"
            >
              Governance
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
