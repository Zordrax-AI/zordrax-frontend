"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { recommendations } from "@/lib/agent-proxy";

export default function RecommendationsClient() {
  const sp = useSearchParams();
  const requirementSetId = sp.get("requirement_set_id") ?? "";

  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [error, setError] = useState("");
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!requirementSetId) return;

    (async () => {
      setStatus("loading");
      setError("");

      try {
        // Use top3 by default
        const res = await recommendations.top3(requirementSetId);
        setData(res);
        setStatus("ok");
      } catch (e: any) {
        setStatus("error");
        setError(e?.message || String(e));
      }
    })();
  }, [requirementSetId]);

  return (
    <div className="space-y-4 max-w-4xl">
      <Card className="p-4">
        <div className="text-white text-xl font-semibold">AI Top 3 Recommendations</div>
        <div className="text-slate-400 text-sm mt-1">
          Requirement Set: <span className="font-mono text-slate-200">{requirementSetId || "—"}</span>
        </div>

        {status === "loading" && <div className="text-slate-300 text-sm mt-3">Loading…</div>}

        {status === "error" && (
          <div className="mt-3 rounded-xl border border-red-900/60 bg-red-950/40 p-3 text-sm text-red-200">
            {error}
            <div className="text-xs text-slate-400 mt-2">
              If this says 404, your backend endpoint name differs — run the OpenAPI PS command I gave you and we’ll set the exact path.
            </div>
          </div>
        )}

        {status === "ok" && (
          <pre className="mt-3 text-xs text-slate-300 overflow-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        )}

        <div className="mt-4 flex gap-2">
          <Button variant="outline" onClick={() => window.location.reload()}>
            Refresh
          </Button>
        </div>
      </Card>
    </div>
  );
}
