"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const PROJECT_KEY = "zordrax.active.project";

export default function PlatformProjectsPage() {
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    setConfirmed(localStorage.getItem(PROJECT_KEY) === "Zordrax-Analytica");
  }, []);

  function confirmProject() {
    localStorage.setItem(PROJECT_KEY, "Zordrax-Analytica");
    setConfirmed(true);
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl bg-slate-950 p-6 text-white">
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="mt-2 text-sm text-slate-300">
            Confirm the active project before loading backlog or releasing AI tasks.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/workflow"
              className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-950"
            >
              Back to Workflow
            </Link>

            <Link
              href="/product-board/load"
              className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950"
            >
              Continue to Bulk Load
            </Link>
          </div>
        </header>

        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-cyan-700">Active Project</p>
              <h2 className="mt-1 text-3xl font-bold">Zordrax-Analytica</h2>

              <p className="mt-3 max-w-4xl text-sm text-slate-600">
                Zordrax-Analytica is an AI-driven, vendor-agnostic data platform
                onboarding and delivery SaaS that captures customer requirements,
                validates governance/security/compliance, recommends architectures,
                generates implementation packages, orchestrates Terraform/ETL/BI/Governance
                delivery, and uses AI agents with human approval checkpoints.
              </p>
            </div>

            <span
              className={
                confirmed
                  ? "rounded-full bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-800"
                  : "rounded-full bg-amber-100 px-4 py-2 text-sm font-bold text-amber-800"
              }
            >
              {confirmed ? "Confirmed" : "Not Confirmed"}
            </span>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Repos</p>
              <p className="text-2xl font-bold">6</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">AI Build System</p>
              <p className="text-2xl font-bold">Built</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">SaaS Product</p>
              <p className="text-2xl font-bold">In Build</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Approval Model</p>
              <p className="text-2xl font-bold">Human Gate</p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-bold text-slate-700">
              Step 1 confirmation
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Click confirm before moving into Product Board, Bulk Load, DevOps push,
              Execution Queue, and AI Orchestrator.
            </p>

            <button
              onClick={confirmProject}
              className={
                confirmed
                  ? "mt-4 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white"
                  : "mt-4 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white"
              }
            >
              {confirmed ? "Project Confirmed: Zordrax-Analytica" : "Confirm Zordrax-Analytica Project"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
