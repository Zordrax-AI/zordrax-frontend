import { Suspense } from "react";
import StatusClient from "./status-client";

export default function StatusPage() {
  return (
    <Suspense fallback={<p className="text-slate-400">Loading status…</p>}>
      <StatusClient />
    </Suspense>
  );
}
