import { Suspense } from "react";
import ConnectDataClient from "./connect-data-client";

export default function ConnectDataPage() {
  return (
    <Suspense fallback={<div className="text-slate-200">Loading…</div>}>
      <ConnectDataClient />
    </Suspense>
  );
}
