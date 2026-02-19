import { Suspense } from "react";
import RunClient from "./run-client";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-slate-600">Loading run...</div>}>
      <RunClient />
    </Suspense>
  );
}