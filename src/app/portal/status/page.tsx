import { Suspense } from "react";
import StatusClient from "./status-client";

export default function StatusPage() {
  return (
    <div className="p-6">
      <Suspense fallback={<div className="text-slate-200">Loading status...</div>}>
        <StatusClient />
      </Suspense>
    </div>
  );
}
