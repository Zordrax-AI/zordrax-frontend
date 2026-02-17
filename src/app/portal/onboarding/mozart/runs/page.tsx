import { Suspense } from "react";
import RunsClient from "./runs-client";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-slate-600">Loading runs...</div>}>
      <RunsClient />
    </Suspense>
  );
}
