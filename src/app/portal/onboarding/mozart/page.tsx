// src/app/portal/onboarding/mozart/page.tsx
import { Suspense } from "react";
import MozartClient from "./mozart-client";

export default function MozartPage() {
  return (
    <Suspense fallback={<div className="text-slate-200">Loading Mozart…</div>}>
      <MozartClient />
    </Suspense>
  );
}
