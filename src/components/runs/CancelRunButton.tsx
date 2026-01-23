"use client";

import { useState } from "react";
import { cancelRun } from "@/lib/api";

type Props = {
  runId: string;
  onDone?: () => void;
};

export function CancelRunButton({ runId, onDone }: Props) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleCancel() {
    setLoading(true);
    setErr(null);
    try {
      await cancelRun(runId);
      onDone?.();
    } catch (e: any) {
      setErr(e?.message ?? "Cancel failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleCancel}
        disabled={loading}
        className="rounded border border-red-800 bg-red-950/40 px-3 py-1 text-sm text-red-200 hover:bg-red-950/60 disabled:opacity-50"
      >
        {loading ? "Cancelling..." : "Cancel Run"}
      </button>
      {err && <div className="text-xs text-red-300">{err}</div>}
    </div>
  );
}

// Support both import styles:
export default CancelRunButton;
