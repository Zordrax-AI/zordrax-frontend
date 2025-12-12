"use client";

import { Suspense } from "react";
import StatusPageInner from "./status-client";

export default function Page() {
  return (
    <Suspense fallback={<p className="text-slate-400 text-sm">Loading...</p>}>
      <StatusPageInner />
    </Suspense>
  );
}
