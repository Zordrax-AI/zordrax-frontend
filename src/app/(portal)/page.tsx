"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export const dynamic = "force-dynamic";

export default function PortalLanding() {
  const [runId, setRunId] = useState("");
  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-6 text-[color:var(--fg)]">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold">Zordrax-Analytica Portal</h1>
        <p className="text-sm text-[color:var(--muted)]">
          Start a new onboarding session or resume a deploy run.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-5 space-y-3">
          <div className="text-lg font-semibold">Start onboarding</div>
          <p className="text-sm text-[color:var(--muted)]">
            Create a BRD session and requirement set, then move through approval and deploy planning.
          </p>
          <Link href="/onboarding/new">
            <Button variant="primary">Start onboarding</Button>
          </Link>
        </Card>

        <Card className="p-5 space-y-3">
          <div className="text-lg font-semibold">Resume run</div>
          <p className="text-sm text-[color:var(--muted)]">Paste a RUN_ID to view deploy status and approve/apply.</p>
          <div className="flex gap-2">
            <input
              value={runId}
              onChange={(e) => setRunId(e.target.value)}
              placeholder="RUN_ID"
              className="flex-1 rounded-md border border-[color:var(--border)] bg-[color:var(--card-2)] px-3 py-2 text-sm text-[color:var(--fg)]"
            />
            <Link href={runId ? `/deploy/${encodeURIComponent(runId)}` : "#"} aria-disabled={!runId}>
              <Button variant="outline" disabled={!runId}>
                Open
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
