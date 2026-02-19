import { Suspense } from "react";
import DataChecksClient from "./data-checks-client";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-slate-600">Loading data checks...</div>}>
      <DataChecksClient />
    </Suspense>
  );
}