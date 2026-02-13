"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Logo } from "./Logo";
import type { Connector } from "@/lib/api";

type Props = {
  connectors: Connector[];
  attachedId: string | null;
  loading: boolean;
  onAttach: (id: string) => void;
  onRefresh: () => void;
};

export function AlreadyConnectedPanel({ connectors, attachedId, loading, onAttach, onRefresh }: Props) {
  const skeletons = useMemo(() => Array.from({ length: 3 }), []);

  return (
    <Card className="p-4 space-y-3 border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-900">Already connected</div>
        <Button variant="ghost" onClick={onRefresh} className="text-xs px-2 py-1 text-slate-600">
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {skeletons.map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg border border-slate-200 bg-slate-100 h-16" />
          ))}
        </div>
      ) : connectors.length === 0 ? (
        <div className="text-sm text-slate-500 space-y-2">
          <div>No connectors yet.</div>
          <Button variant="ghost" onClick={onRefresh} className="px-0 text-cyan-700">
            Create your first connector
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {connectors.map((c) => {
            const isAttached = c.id === attachedId;
            const slug = normalizeSlug(c.type);
            return (
              <div
                key={c.id}
                className={[
                  "rounded-lg border p-3 text-sm transition shadow-sm",
                  isAttached ? "border-cyan-500 bg-cyan-50" : "border-slate-200 bg-white",
                ].join(" ")}
              >
                <div className="flex items-center gap-3">
                  <Logo slug={slug} alt={c.name} />
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900">{c.name}</div>
                    <div className="text-xs text-slate-500">{c.type}</div>
                    <div className="text-[11px] text-slate-500">
                      Status: <StatusBadge status={c.status} />
                    </div>
                  </div>
                  <Button variant="outline" disabled={isAttached || loading} onClick={() => onAttach(c.id)}>
                    {isAttached ? "Attached" : "Attach"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const cls =
    status === "tested_ok"
      ? "bg-emerald-100 text-emerald-800"
      : status === "tested_failed"
        ? "bg-red-100 text-red-800"
        : "bg-slate-100 text-slate-800";
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] ${cls}`}>{status || "unknown"}</span>;
}

function normalizeSlug(type?: string) {
  if (!type) return "default";
  if (type === "google_analytics_4") return "ga4";
  return type;
}
