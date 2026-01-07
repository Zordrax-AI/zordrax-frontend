import { Suspense } from "react";
import { Spinner } from "@/components/ui/Spinner";
import QuestionsClient from "./questions-client";

export const dynamic = "force-dynamic";

export default function QuestionsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 flex items-center gap-2 text-sm text-slate-400">
          <Spinner />
          Loading onboarding questions…
        </div>
      }
    >
      <QuestionsClient />
    </Suspense>
  );
}
