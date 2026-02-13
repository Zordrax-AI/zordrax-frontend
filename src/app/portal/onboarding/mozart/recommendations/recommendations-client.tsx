"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getTop3Recommendations, selectRecommendation, Top3Option } from "@/lib/api";

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; options: Top3Option[]; generated_at: string };

export default function RecommendationsClient() {
  const sp = useSearchParams();
  const router = useRouter();

  const requirementSetId = useMemo(() => sp.get("requirement_set_id") ?? "", [sp]);

  const [state, setState] = useState<State>({ kind: "idle" });
  const [selecting, setSelecting] = useState<string>("");

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
        setState({ kind: "ready", options: res.options ?? [], generated_at: res.generated_at });
      } catch (e: any) {
        if (cancelled) return;
        setState({ kind: "error", message: e?.message ?? "Failed to load recommendations." });
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

      // next step in Mozart
      router.push(
        `/portal/onboarding/mozart/model-kpis?requirement_set_id=${encodeURIComponent(requirementSetId)}`
      );
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
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold text-white">Top 3 Recommendations</h1>
        <p className="mt-1 text-sm text-slate-400">
          Deterministic (rules-based) ranking. No LLM costs. No Terraform apply.
        </p>
      </div>

      <Card className="p-4 space-y-2">
        <div className="text-sm text-slate-200">
          Requirement Set: <span className="text-slate-400">{requirementSetId || "—"}</span>
        </div>
      </Card>

      {state.kind === "loading" && (
        <Card className="p-4 text-slate-200">Loading recommendations…</Card>
      )}

      {state.kind === "error" && (
        <Card className="p-4 space-y-3">
          <div className="text-red-300 text-sm">{state.message}</div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={retry}>
              Retry
            </Button>
          </div>
        </Card>
      )}

      {state.kind === "ready" && (
        <>
          <div className="text-xs text-slate-500">
            Generated at: {state.generated_at}
          </div>

          <div className="space-y-4">
            {state.options.map((opt) => (
              <Card key={opt.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-slate-200 text-sm">
                      <span className="text-slate-400">#{opt.rank}</span>{" "}
                      <span className="font-semibold text-white">{opt.title}</span>
                    </div>
                    <div className="text-slate-400 text-sm mt-1">{opt.summary}</div>
                  </div>

                  <div className="text-right">
                    <div className="text-slate-300 text-sm">Est. monthly</div>
                    <div className="text-white font-semibold">
                      €{opt.estimated_monthly_cost_eur.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-400">
                  Terraform:{" "}
                  <span className="text-slate-300">
                    {opt.terraform.cloud}/{opt.terraform.warehouse}/{opt.terraform.etl}/
                    {opt.terraform.governance}
                    {opt.terraform.enable_bi ? `/bi:${opt.terraform.bi_tool || "yes"}` : ""}
                    {opt.terraform.enable_apim ? `/apim:yes` : ""}
                  </span>
                </div>

                {opt.risk_flags?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {opt.risk_flags.map((r) => (
                      <span
                        key={r}
                        className="text-xs px-2 py-1 rounded bg-slate-800 text-amber-200 border border-slate-700"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={() => onSelect(opt.id)}
                    disabled={!!selecting}
                  >
                    {selecting === opt.id ? "Selecting…" : "Select"}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
