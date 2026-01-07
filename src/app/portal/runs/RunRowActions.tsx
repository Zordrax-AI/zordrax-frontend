"use client";

import { useRouter } from "next/navigation";
import { cancelRun, RunRow } from "@/lib/api";

export default function RunRowActions({ run }: { run: RunRow }) {
  const router = useRouter();

  async function handleCancel() {
    if (!confirm("Cancel this run?")) return;
    await cancelRun(run.run_id);
    location.reload();
  }

  return (
    <div className="flex gap-3 text-xs">
      <button
        onClick={() => router.push(`/portal/status?run=${run.run_id}`)}
        className="text-cyan-400 hover:underline"
      >
        View
      </button>

      {run.status === "running" && (
        <button
          onClick={handleCancel}
          className="text-red-400 hover:underline"
        >
          Cancel
        </button>
      )}
    </div>
  );
}
