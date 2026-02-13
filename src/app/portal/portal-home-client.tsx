"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { health } from "@/lib/api";

type HealthState =
  | { kind: "idle" }
  | { kind: "ok"; message: string }
  | { kind: "error"; message: string };

const quickStart = [
  {
    title: "Run Diagnostics",
    desc: "Verify backend connectivity and env vars.",
    href: "/portal/diagnostics",
    variant: "outline" as const,
  },
  {
    title: "Start Onboarding",
    desc: "Kick off the Mozart wizard to collect requirements.",
    href: "/portal/onboarding",
    variant: "primary" as const,
  },
  {
    title: "Connect Data",
    desc: "Attach your first connector and discover schemas.",
    href: "/portal/onboarding/mozart/connect-data",
    variant: "outline" as const,
  },
  {
    title: "View Recommendations",
    desc: "See the deterministic Top-3 stack options.",
    href: "/portal/onboarding/mozart/recommendations",
    variant: "outline" as const,
  },
];

const quickActions = [
  {
    title: "Start onboarding",
    desc: "Guided BRD → plan → deploy flow.",
    href: "/portal/onboarding",
    variant: "primary" as const,
  },
  {
    title: "View runs",
    desc: "Inspect deploy plans and timelines.",
    href: "/portal/runs",
    variant: "outline" as const,
  },
  {
    title: "Open diagnostics",
    desc: "Health, env, and connectivity checks.",
    href: "/portal/diagnostics",
    variant: "outline" as const,
  },
];

const learnLinks = [
  { title: "How onboarding works", href: "/portal/onboarding" },
  { title: "What gets deployed", href: "/portal/onboarding/mozart/recommendations" },
  { title: "Security & governance", href: "/portal/diagnostics" },
];

export default function PortalHomeClient() {
  const [status, setStatus] = useState<HealthState>({ kind: "idle" });
  const [checking, setChecking] = useState(false);

  async function check() {
    setChecking(true);
    try {
      const res = await health();
      const ok = (res as any)?.ok ?? true;
      if (ok) setStatus({ kind: "ok", message: "Agent reachable" });
      else setStatus({ kind: "error", message: "Agent unreachable" });
    } catch (e: any) {
      setStatus({ kind: "error", message: e?.message || "Agent unreachable" });
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    check();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top section */}
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card className="p-5 border border-slate-800 bg-slate-900/70">
          <div className="space-y-3">
            <div className="text-lg font-semibold text-white">Welcome back</div>
            <p className="text-sm text-slate-300">
              Move from BRD to deploy-ready plans in minutes. The Mozart wizard keeps your requirement_set_id
              consistent across steps.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/portal/onboarding">
                <Button variant="primary">Start Onboarding</Button>
              </Link>
              <Link href="/portal/onboarding/mozart/connect-data">
                <Button variant="outline">Connect Data</Button>
              </Link>
            </div>
          </div>
        </Card>

        <Card className="p-4 border border-slate-800 bg-slate-900/70 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-white">System status</div>
              <div className="text-xs text-slate-400">Onboarding agent health</div>
            </div>
            <Button variant="outline" onClick={check} disabled={checking}>
              {checking ? "Checking..." : "Recheck"}
            </Button>
          </div>
          <Status state={status} />
        </Card>
      </div>

      {/* Quick start checklist */}
      <Card className="p-4 border border-slate-800 bg-slate-900/70 space-y-3">
        <div className="text-sm font-semibold text-white">Quick start</div>
        <div className="divide-y divide-slate-800">
          {quickStart.map((item) => (
            <div key={item.title} className="py-3 flex items-center justify-between gap-4">
              <div>
                <div className="text-sm text-slate-100">{item.title}</div>
                <div className="text-xs text-slate-400">{item.desc}</div>
              </div>
              <Link href={item.href}>
                <Button variant={item.variant}>{item.variant === "primary" ? "Start" : "Open"}</Button>
              </Link>
            </div>
          ))}
        </div>
      </Card>

      {/* Quick actions */}
      <div className="grid gap-4 md:grid-cols-3">
        {quickActions.map((item) => (
          <Card key={item.title} className="p-4 border border-slate-800 bg-slate-900/70 space-y-2">
            <div className="text-sm font-semibold text-white">{item.title}</div>
            <div className="text-xs text-slate-400">{item.desc}</div>
            <Link href={item.href}>
              <Button variant={item.variant} className="mt-2 w-full">
                {item.title}
              </Button>
            </Link>
          </Card>
        ))}
      </div>

      {/* Learn / docs */}
      <Card className="p-4 border border-slate-800 bg-slate-900/70 space-y-2">
        <div className="text-sm font-semibold text-white">Learn & Docs</div>
        <div className="grid gap-2 md:grid-cols-3">
          {learnLinks.map((l) => (
            <Link
              key={l.title}
              href={l.href}
              className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm text-slate-200 hover:border-cyan-500 hover:text-cyan-200 transition"
            >
              <span>{l.title}</span>
              <span className="text-xs text-slate-500">↗</span>
            </Link>
          ))}
        </div>
      </Card>

      {/* Runs empty state */}
      <Card className="p-4 border border-slate-800 bg-slate-900/70 space-y-2">
        <div className="text-sm font-semibold text-white">Deployments</div>
        <div className="text-sm text-slate-300">No deployments yet.</div>
        <div className="text-xs text-slate-500">
          Start onboarding to generate a deploy plan, then approve to run Terraform.
        </div>
        <Link href="/portal/onboarding">
          <Button variant="primary" className="mt-2 w-fit">
            Start onboarding
          </Button>
        </Link>
      </Card>
    </div>
  );
}

function Status({ state }: { state: HealthState }) {
  if (state.kind === "ok") {
    return <div className="text-sm text-emerald-300">Agent reachable</div>;
  }
  if (state.kind === "error") {
    return (
      <div className="text-sm text-red-300">
        Agent unreachable{state.message ? `: ${state.message}` : ""}
      </div>
    );
  }
  return <div className="text-sm text-slate-400">Checking...</div>;
}
