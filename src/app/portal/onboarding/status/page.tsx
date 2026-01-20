"use client";

import { useEffect } from "react";

export default function OnboardingStatusPage() {
  useEffect(() => {
    try {
      const last = localStorage.getItem("zordrax:last_run_id");
      if (last) {
        window.location.href = `/portal/status?run=${encodeURIComponent(last)}`;
      }
    } catch {}
  }, []);

  return (
    <div className="rounded-lg border border-slate-800 p-4 text-sm text-slate-200">
      No run id provided. Open a status page like:
      <div className="mt-2 font-mono text-cyan-300">/portal/status?run=&lt;uuid&gt;</div>
    </div>
  );
}
