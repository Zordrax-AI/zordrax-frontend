import { Suspense } from "react";
import ConnectDataClient from "./connect-data-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function Page() {
  return (
    <Suspense fallback={<div className="text-slate-600 p-6">Loading...</div>}>
      <ConnectDataClient />
    </Suspense>
  );
}
