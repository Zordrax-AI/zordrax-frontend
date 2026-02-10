import { Suspense } from "react";
import MozartClient from "./mozart-client";

export const dynamic = "force-dynamic";

export default function MozartPage() {
  return (
    <Suspense fallback={<div className="p-6 text-slate-200">Loading Mozart…</div>}>
      <MozartClient />
    </Suspense>
  );
}
