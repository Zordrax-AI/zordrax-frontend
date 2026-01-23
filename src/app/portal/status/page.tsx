import { Suspense } from "react";
import StatusClient from "./status-client";

export default function StatusPage() {

  function normalizeOutputs(resp: any): { found: boolean; outputs: Record<string, any> } {
    if (!resp) return { found: false, outputs: {} };
    // Backend shape: { run_id, found, status, outputs, updated_at }
    if (typeof resp === "object" && "found" in resp && "outputs" in resp) {
      return { found: !!resp.found, outputs: resp.outputs || {} };
    }
    // Fallback: some builds might return outputs directly as an object map
    if (typeof resp === "object") {
      return { found: true, outputs: resp };
    }
    return { found: false, outputs: {} };
  }
  return (
    <div className="p-6">
      <Suspense fallback={<div className="text-slate-200">Loading status...</div>}>
        <StatusClient />
      </Suspense>
    </div>
  );
}
