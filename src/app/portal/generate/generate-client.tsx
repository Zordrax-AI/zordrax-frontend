"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { startOnboarding } from "@/lib/agent";
import { upsertSession } from "@/lib/sessions";

export default function GenerateClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const mode = (sp.get("mode") as "ai" | "manual" | null) ?? "ai";

  const payload = useMemo(() => {
    const all: Record<string, any> = {};
    sp.forEach((v, k) => (all[k] = v));

    if (mode === "ai") {
      return { mode, answers: { industry: all.industry, cloud: all.cloud } };
    }
    return {
      mode,
      config: {
        cloud: all.cloud,
        etl: all.etl,
        governance: all.governance,
        bi: all.bi,
      },
    };
  }, [sp, mode]);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await startOnboarding(payload);

        if (cancelled) return;

        upsertSession({
          id: res.run_id,
          created_at: new Date().toISOString(),
          mode,
          title: mode === "ai" ? "AI onboarding" : "Manual onboarding",
          status: res.status ?? "queued",
        });

        router.push(`/portal/status?run=${encodeURIComponent(res.run_id)}`);
      } catch (e: any) {
        setError(e?.message || "Failed to start onboarding");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [payload, router, mode]);

  return (
    <>
      <h1 className="text-xl font-semibold">Generating Platform</h1>
      <p className="mt-3 text-slate-400">
        Starting orchestration via FastAPI…
      </p>

      {error && (
        <div className="mt-6 rounded border border-red-800 bg-red-900/20 p-4 text-sm text-red-200">
          {error}
        </div>
      )}
    </>
  );
}
