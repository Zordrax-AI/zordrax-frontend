"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Stepper } from "@/components/Stepper";
import { StatusPill } from "@/components/StatusPill";
import { createRequirementSet, submitRequirementSet, approveRequirementSet } from "@/lib/api";
import { RequirementSet } from "@/lib/types";

const STEPS = [
  { key: "brd", label: "BRD Intake", href: "/onboarding/brd" },
  { key: "connectors", label: "Connectors", href: "/onboarding/connectors" },
  { key: "tables", label: "Tables", href: "/onboarding/tables" },
  { key: "profiling", label: "Profiling", href: "/onboarding/profiling" },
  { key: "approval", label: "Approval", href: "/onboarding/approval" },
  { key: "run", label: "Run" },
];

export default function BrdPage() {
  const router = useRouter();
  const [name, setName] = useState("Portal BRD");
  const [description, setDescription] = useState("Created from portal");
  const [status, setStatus] = useState<string>("draft");
  const [req, setReq] = useState<RequirementSet | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const existingId = typeof window !== "undefined" ? localStorage.getItem("za_requirement_set_id") : null;
    if (existingId) {
      setReq({ id: existingId, status: "draft" });
    }
  }, []);

  const handleCreate = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const created = await createRequirementSet({ name, description });
      setReq(created);
      setStatus(created.status || "draft");
      localStorage.setItem("za_requirement_set_id", created.id);
      setMessage(`Created requirement set ${created.id}`);
    } catch (err: any) {
      setMessage(err.message || "Failed to create requirement set");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!req) return;
    setLoading(true);
    setMessage(null);
    try {
      const updated = await submitRequirementSet(req.id);
      setStatus(updated.status);
      setReq(updated);
      setMessage("Submitted for approval");
    } catch (err: any) {
      setMessage(err.message || "Submit failed");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!req) return;
    setLoading(true);
    setMessage(null);
    try {
      const updated = await approveRequirementSet(req.id);
      setStatus(updated.status);
      setReq(updated);
      setMessage("Approved");
      router.push("/onboarding/connectors");
    } catch (err: any) {
      setMessage(err.message || "Approve failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-6">
      <Stepper steps={STEPS} current="brd" />

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">BRD Intake</h1>
        <p className="text-sm text-[color:var(--muted)]">Create a requirement set to start the flow.</p>
      </div>

      <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="font-medium">Requirement Set</div>
          {status && <StatusPill status={status} />}
          {req?.id && <span className="text-xs text-[color:var(--muted)]">ID: {req.id}</span>}
        </div>

        <label className="space-y-1 block">
          <span className="text-sm font-medium">Name</span>
          <input
            className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--card-2)] px-3 py-2 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <label className="space-y-1 block">
          <span className="text-sm font-medium">Description</span>
          <textarea
            className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--card-2)] px-3 py-2 text-sm"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>

        <div className="flex gap-2">
          <button
            onClick={handleCreate}
            disabled={loading}
            className="rounded-md bg-blue-600 text-white px-4 py-2 text-sm disabled:opacity-60"
          >
            {loading ? "Working..." : req ? "Re-create" : "Create"}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!req || loading}
            className="rounded-md border border-[color:var(--border)] px-4 py-2 text-sm disabled:opacity-50"
          >
            Submit
          </button>
          <button
            onClick={handleApprove}
            disabled={!req || loading}
            className="rounded-md bg-emerald-600 text-white px-4 py-2 text-sm disabled:opacity-50"
          >
            Approve
          </button>
        </div>

        {message && <div className="text-sm text-[color:var(--muted)]">{message}</div>}
      </div>
    </div>
  );
}
