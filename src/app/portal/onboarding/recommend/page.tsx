import { Suspense } from "react";
import RecommendationsClient from "./recommend-client";

export const dynamic = "force-dynamic";

export default function RecommendationsPage() {
  return (
    <Suspense fallback={<div className="text-slate-200">Loading…</div>}>
      <RecommendationsClient />
    </Suspense>
  );
}
