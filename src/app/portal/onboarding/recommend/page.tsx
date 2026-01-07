import { Suspense } from "react";
import { Spinner } from "@/components/ui/Spinner";
import RecommendClient from "./recommend-client";

export const dynamic = "force-dynamic";

export default function RecommendPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 flex items-center gap-2 text-sm text-slate-400">
          <Spinner />
          Generating recommendation…
        </div>
      }
    >
      <RecommendClient />
    </Suspense>
  );
}
