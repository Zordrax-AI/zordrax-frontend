import { Suspense } from "react";
import CostGovernanceClient from "./cost-governance-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function Page() {
  return (
    <Suspense fallback={<div className="text-slate-200">Loading…</div>}>
      <CostGovernanceClient />
    </Suspense>
  );
}
