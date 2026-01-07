// src/app/portal/onboarding/recommend/page.tsx
export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { Spinner } from "@/components/ui/Spinner";
import RecommendClient from "./recommend-client";

export default function RecommendPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 flex items-center gap-2 text-sm text-slate-400">
          <Spinner />
          Loading recommendation…
        </div>
      }
    >
      <RecommendClient />
    </Suspense>
  );
}
