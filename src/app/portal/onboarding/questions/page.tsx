export const dynamic = "force-dynamic";

import { Suspense } from "react";
import QuestionsClient from "./questions-client";

export default function QuestionsPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading questions…</div>}>
      <QuestionsClient />
    </Suspense>
  );
}
