"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { brd, connections } from "@/lib/agent-proxy";

export default function ConnectDataClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const existingReq = sp.get("requirement_set_id") ?? "";
  const [requirementSetId, setRequirementSetId] = useState(existingReq);

  // Minimal intake (Level 1)
  const [title, setTitle] = useState("Level 1 Onboarding");
  const [createdBy, setCreatedBy] = useState("portal");

  // Connection snapshot inputs (no secrets)
  const [sourceType, setSourceType] = useState("postgres");
  const [host, setHost] = useState("");
  const [database, setDatabase] = useState("sales");
  const [schema, setSchema] = useState("public");
  const [freshness, setFreshness] = useState("daily");
  const [estimatedTables, setEstimatedTables] = useState(20);
  const [largestRows, setLargestRows] = useState(50000000);

  // Constraints
  const [region, setRegion] = useState("westeurope");
  const [environment, setEnvironment] = useState("dev");
  const [cloud, setCloud] = useState("azure");

  // Guardrails (THIS is what was missing)
  const [piiPresent, setPiiPresent] = useState(false);
  const [gdprRequired, setGdprRequired] = useState(false);
  const [privateNetworking, setPrivateNetworking] = useState(false);
  const [budgetEurMonth, setBudgetEurMonth] = useState(3000);

  const [notes, setNotes] = useState("Azure SQL (sales, customers, inventory) + daily refresh");

  const [status, setStatus] = useState<"idle" | "working" | "ok" | "error">("idle");
  const [error, setError] = useState("");
  const [snapshot, setSnapshot] = useState<any>(null);

  const canContinue = useMemo(() => {
    return !!requirementSetId && !!snapshot;
  }, [requirementSetId, snapshot]);

  async function ensureReqSet() {
    if (requirementSetId) return requirementSetId;

    setStatus("working");
    setError("");
    try {
      const s = await brd.createSession({ created_by: createdBy, title });
      const r = await brd.createRequirementSet({
        session_id: s.session_id,
        name: title,
        created_by: createdBy,
      });

      const reqId = (r as any).requirement_set_id || (r as any).id;
      if (!reqId) throw new Error(`Requirement set response missing id: ${JSON.stringify(r)}`);

      setRequirementSetId(reqId);
      router.replace(`/portal/onboarding/mozart/connect-data?requirement_set_id=${encodeURIComponent(reqId)}`);
      return reqId;
    } catch (e: any) {
      setStatus("error");
      setError(e?.message || String(e));
      throw e;
    }
  }

  async function testAndSave() {
    setStatus("working");
    setError("");

    try {
      const reqId = await ensureReqSet();

      // 1) Test connection snapshot
      const test = await connections.test({
        source_type: sourceType,
        host,
        database,
        schema,
        freshness,
        estimated_tables: estimatedTables,
        estimated_largest_table_rows: largestRows,
        compliance_flags: {},
      });

      const snap = test?.connection_snapshot ?? null;
      setSnapshot(snap);

      // 2) Save constraints (allowed in draft)
      await brd.upsertConstraints(reqId, {
        cloud,
        region,
        environment,
        connection_snapshot: snap,
        notes,
      });

      // 3) ✅ Save guardrails (allowed ONLY in draft; must be done BEFORE submit/approve)
      await brd.upsertGuardrails(reqId, {
        pii_present: piiPresent,
        gdpr_required: gdprRequired,
        private_networking_required: privateNetworking,
        budget_eur_month: budgetEurMonth,
      });

      setStatus("ok");
    } catch (e: any) {
      setStatus("error");
      setError(e?.message || String(e));
    }
  }

  function goNext() {
    if (!requirementSetId) return;
    router.push(`/portal/onboarding/mozart/recommendations?requirement_set_id=${encodeURIComponent(requirementSetId)}`);
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold text-white">Connect Data</h1>
        <p className="mt-1 text-sm text-slate-400">
          Capture a clean <span className="text-slate-200">connection snapshot</span> (no secrets) to feed the AI engine.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-900/60 bg-red-950/40 p-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <Card className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-slate-400 mb-1">Run title</div>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1">Created by</div>
            <Input value={createdBy} onChange={(e) => setCreatedBy(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-slate-400 mb-1">Source type</div>
            <Input value={sourceType} onChange={(e) => setSourceType(e.target.value)} />
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1">Host</div>
            <Input value={host} onChange={(e) => setHost(e.target.value)} />
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1">Database</div>
            <Input value={database} onChange={(e) => setDatabase(e.target.value)} />
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1">Schema</div>
            <Input value={schema} onChange={(e) => setSchema(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <div className="text-xs text-slate-400 mb-1">Freshness</div>
            <Input value={freshness} onChange={(e) => setFreshness(e.target.value)} />
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1">Est. tables</div>
            <Input
              type="number"
              value={estimatedTables}
              onChange={(e) => setEstimatedTables(Number(e.target.value || 0))}
            />
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1">Largest table rows</div>
            <Input
              type="number"
              value={largestRows}
              onChange={(e) => setLargestRows(Number(e.target.value || 0))}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <div className="text-xs text-slate-400 mb-1">Cloud</div>
            <Input value={cloud} onChange={(e) => setCloud(e.target.value)} />
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1">Region</div>
            <Input value={region} onChange={(e) => setRegion(e.target.value)} />
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1">Environment</div>
            <Input value={environment} onChange={(e) => setEnvironment(e.target.value)} />
          </div>
        </div>

        {/* ✅ Guardrails (budget fix) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="flex items-center gap-2 text-slate-200 text-sm">
            <input type="checkbox" checked={piiPresent} onChange={(e) => setPiiPresent(e.target.checked)} />
            PII present
          </label>
          <label className="flex items-center gap-2 text-slate-200 text-sm">
            <input type="checkbox" checked={gdprRequired} onChange={(e) => setGdprRequired(e.target.checked)} />
            GDPR required
          </label>
          <label className="flex items-center gap-2 text-slate-200 text-sm">
            <input
              type="checkbox"
              checked={privateNetworking}
              onChange={(e) => setPrivateNetworking(e.target.checked)}
            />
            Private networking required
          </label>
          <div>
            <div className="text-xs text-slate-400 mb-1">Budget EUR/month</div>
            <Input
              type="number"
              value={budgetEurMonth}
              onChange={(e) => setBudgetEurMonth(Number(e.target.value || 0))}
            />
          </div>
        </div>

        <div>
          <div className="text-xs text-slate-400 mb-1">Notes</div>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={testAndSave} disabled={status === "working"}>
            {status === "working" ? "Working…" : "Test + Save Snapshot"}
          </Button>
          <Button variant="outline" onClick={goNext} disabled={!canContinue}>
            Continue
          </Button>
          <div className="text-xs text-slate-400 self-center">reqset: {requirementSetId || "—"}</div>
        </div>
      </Card>

      {snapshot ? (
        <Card className="p-4">
          <div className="text-slate-200 font-semibold mb-2">Snapshot Preview</div>
          <pre className="text-xs text-slate-300 overflow-auto">{JSON.stringify(snapshot, null, 2)}</pre>
        </Card>
      ) : null}
    </div>
  );
}
