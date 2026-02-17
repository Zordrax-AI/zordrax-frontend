"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Stepper } from "@/components/Stepper";

const STEPS = [
  { key: "brd", label: "BRD Intake", href: "/onboarding/brd" },
  { key: "connectors", label: "Connectors", href: "/onboarding/connectors" },
  { key: "tables", label: "Tables", href: "/onboarding/tables" },
  { key: "profiling", label: "Profiling", href: "/onboarding/profiling" },
  { key: "approval", label: "Approval", href: "/onboarding/approval" },
  { key: "run", label: "Run", href: "/onboarding/run" },
];

export default function OnboardingLanding() {
  const [existingReq, setExistingReq] = useState<string | null>(null);

  useEffect(() => {
    setExistingReq(localStorage.getItem("za_requirement_set_id"));
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold">Mozart Onboarding</h1>
        <p className="text-[color:var(--muted)]">
          Draft your BRD, connect data, pick tables, profile, and generate an infra plan in one guided flow.
        </p>
      </div>

      <Stepper steps={STEPS} current="brd" />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-5 space-y-3">
          <h2 className="text-xl font-semibold">Start new</h2>
          <p className="text-sm text-[color:var(--muted)]">Create a fresh requirement set and move through all steps.</p>
          <Link className="inline-flex items-center gap-2 rounded-md bg-blue-600 text-white px-4 py-2 text-sm" href="/onboarding/brd">
            Begin BRD
          </Link>
        </div>
        <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-5 space-y-3">
          <h2 className="text-xl font-semibold">Resume</h2>
          <p className="text-sm text-[color:var(--muted)]">Pick up where you left off.</p>
          {existingReq ? (
            <Link className="text-blue-600 underline" href="/onboarding/connectors">
              Continue with requirement set {existingReq}
            </Link>
          ) : (
            <div className="text-sm text-[color:var(--muted)]">No saved requirement set yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
