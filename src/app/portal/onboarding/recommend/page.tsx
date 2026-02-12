import { Suspense } from "react";
import RecommendationsClient from "./recommendations-client";

export default function RecommendationsPage() {
  return (
    <Suspense fallback={<div className="text-slate-200">Loading…</div>}>
      <RecommendationsClient />
    </Suspense>
  );
}
