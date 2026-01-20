// src/components/runs/CancelRunButton.tsx
"use client";

import { useState } from "react";
import { cancelRun } from "@/lib/api";

export function CancelRunButton({ runId }: { runId: string }) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onCancel() {
    setLoading(true);
    setMsg(null);
    try {
      await cancelRun(runId);
      setMsg("Cancel requested.");
    } catch (e: any) {
      setMsg(e?.message ?? "Cancel failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onCancel}
        disabled={loading}
        className="px-3 py-2 rounded border border-red-400/40 text-red-200 hover:bg-red-500/10 disabled:opacity-60"
      >
        {loading ? "Cancelling..." : "Cancel"}
      </button>
      {msg && <div className="text-sm opacity-80">{msg}</div>}
    </div>
  );
}

export default CancelRunButton;
