"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  brdReadRequirementSet,
  getConnector,
  getConstraints,
  getTop3Recommendations,
  selectRecommendation,
  Top3Option,
} from "@/lib/api";
import { getRequirementSetId, wizardHref } from "@/lib/wizard";

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; options: Top3Option[]; generated_at: string };

type InputsSummary = {
  connectorName?: string;
  connectorType?: string;
  tablesCount: number;
  refreshFrequency?: string;
  pii?: boolean;
  gdpr?: boolean;
  privateNet?: boolean;
  medallion?: string;
  star?: string;
  streaming?: string;
};

export default function RecommendationsClient() {
  const sp = useSearchParams();
  const router = useRouter();

  const requirementSetId = useMemo(() => getRequirementSetId(sp) ?? "", [sp]);

  const [state, setState] = useState<State>({ kind: "idle" });
  const [selecting, setSelecting] = useState<string>("");
  const [summary, setSummary] = useState<InputsSummary | null>(null);

  useEffect(() => {
    if (!requirementSetId) {
      setState({ kind: "error", message: "Missing requirement_set_id in URL." });
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setState({ kind: "loading" });
        const res = await getTop3Recommendations(requirementSetId);
        if (cancelled) return;
        const options = Array.isArray(res) ? res : (res as any)?.options ?? [];
        const generated_at = (res as any)?.generated_at ?? "";
        setState({ kind: "ready", options, generated_at });
      } catch (e: any) {
        if (cancelled) return;
        setState({ kind: "error", message: e?.message ?? "Failed to load recommendations." });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [requirementSetId]);

  useEffect(() => {
    if (!requirementSetId) return;
    let cancelled = false;

    (async () => {
      try {
        const [rs, constraints] = await Promise.all([
          brdReadRequirementSet(requirementSetId).catch(() => null),
          getConstraints(requirementSetId).catch(() => ({})),
        ]);

        let connectorName: string | undefined;
        let connectorType: string | undefined;
        if (rs?.connector_id) {
          const conn = await getConnector(rs.connector_id).catch(() => null);
          connectorName = conn?.name ?? rs.connector_id;
          connectorType = conn?.type;
        }

        const cj = (constraints as any)?.constraints_json || constraints || {};
        const dc = cj.data_checks || {};
        const selectedTables = cj.selected_tables || dc.selected_tables || [];

        if (cancelled) return;
        setSummary({
          connectorName,
          connectorType,
          tablesCount: selectedTables.length || 0,
          refreshFrequency: dc.refresh_frequency,
          pii: dc.pii_present,
          gdpr: dc.gdpr_required,
          privateNet: dc.private_networking,
          medallion: dc.architecture?.medallion,
          star: dc.architecture?.star_schema,
          streaming: dc.architecture?.streaming,
        });
      } catch {
        if (!cancelled) setSummary(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [requirementSetId]);

  async function onSelect(optionId: string) {
    if (!requirementSetId) return;
    try {
      setSelecting(optionId);
      await selectRecommendation(requirementSetId, optionId);
      router.push(wizardHref("deploy", requirementSetId));
    } catch (e: any) {
      setState({ kind: "error", message: e?.message ?? "Failed to select recommendation." });
    } finally {
      setSelecting("");
    }
  }

  function retry() {
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Top 3 Recommendations</h1>
          <p className="mt-1 text-sm text-slate-600">
            Deterministic (rules-based) ranking. No LLM costs. No Terraform apply.
          </p>
        </div>

        <Card className="p-4 bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="text-sm text-slate-700">
            Requirement Set:{" "}
            <span className="font-mono text-slate-900">{requirementSetId || "—"}</span>
          </div>
          <div className="text-xs text-slate-500">Inputs used</div>
          {summary ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
              <SummaryItem label="Connector">
                {summary.connectorName ? (
                  <>
                    {summary.connectorName}
                    {summary.connectorType ? (
                      <span className="ml-2 text-xs text-slate-500">{summary.connectorType}</span>
                    ) : null}
                  </>
                ) : (
                  "Not attached"
                )}
              </SummaryItem>
              <SummaryItem label="Selected tables">{summary.tablesCount || 0}</SummaryItem>
              <SummaryItem label="Refresh">{summary.refreshFrequency || "—"}</SummaryItem>
              <SummaryItem label="PII / GDPR">
                {summary.pii ? "PII" : "No PII"} / {summary.gdpr ? "GDPR" : "No GDPR"}
              </SummaryItem>
              <SummaryItem label="Private networking">
                {summary.privateNet ? "Required" : "Not required"}
              </SummaryItem>
              <SummaryItem label="Architecture">
                {[
                  summary.medallion ? `Medallion: ${summary.medallion}` : null,
                  summary.star ? `Star schema: ${summary.star}` : null,
                  summary.streaming ? `Streaming: ${summary.streaming}` : null,
                ]
                  .filter(Boolean)
                  .join(" • ") || "—"}
              </SummaryItem>
            </div>
          ) : (
            <div className="text-sm text-slate-500">Loading inputs…</div>
          )}
        </Card>

        {state.kind === "loading" && (
          <Card className="p-4 bg-white border border-slate-200 shadow-sm text-slate-700">
            Loading recommendations…
          </Card>
        )}

        {state.kind === "error" && (
          <Card className="p-4 bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="text-red-600 text-sm">{state.message}</div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={retry}>
                Retry
              </Button>
            </div>
          </Card>
        )}

        {state.kind === "ready" && (
          <>
            <div className="text-xs text-slate-500">Generated at: {state.generated_at}</div>

            <div className="space-y-4">
              {state.options.map((opt, idx) => {
                const key = (opt as any).id || (opt as any).key || String(idx);
                const tf = (opt as any).terraform || {};
                return (
                  <Card key={key} className="p-4 bg-white border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                      <div className="text-slate-900 text-sm">
                        <span className="text-slate-500">#{(opt as any).rank}</span>{" "}
                        <span className="font-semibold text-slate-900">{opt.title}</span>
                      </div>
                        <div className="text-slate-700 text-sm mt-1">{(opt as any).summary}</div>
                    </div>

                      <div className="text-right">
                        <div className="text-slate-500 text-sm">Est. monthly</div>
                        <div className="text-slate-900 font-semibold">
                          €{(opt as any).estimated_monthly_cost_eur?.toLocaleString?.() ?? "—"}
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-slate-600">
                      Terraform:{" "}
                      <span className="text-slate-800">
                        {tf.cloud}/{tf.warehouse}/{tf.etl}/{tf.governance}
                        {tf.enable_bi ? `/bi:${tf.bi_tool || "yes"}` : ""}
                        {tf.enable_apim ? `/apim:yes` : ""}
                      </span>
                    </div>

                    {(opt as any).risk_flags?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {(opt as any).risk_flags.map((r: any) => (
                          <span
                            key={r}
                            className="text-xs px-2 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200"
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button onClick={() => onSelect(key)} disabled={!!selecting}>
                        {selecting === key ? "Selecting..." : "Select"}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SummaryItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="text-sm text-slate-900">{children}</div>
    </div>
  );
}
