"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AiOnboardingPage() {
  const router = useRouter();
  const [industry, setIndustry] = useState("");
  const [cloud, setCloud] = useState("");

  function goGenerate() {
    // For now, keep the end-to-end MVP stable by routing directly into the
    // deploy flow (Plan -> Approve -> Apply -> Status). AI recommendation wiring
    // is not the critical path until the backend endpoint is live.
    const qs = new URLSearchParams({
      rec: "test-001",
      mode: "ai",
      industry,
      cloud: cloud.toLowerCase(),
    });
    router.push(`/portal/onboarding/deploy?${qs.toString()}`);
  }

  return (
    <>
      <h1 className="text-2xl font-semibold">AI-Recommended Onboarding</h1>
      <p className="mt-2 text-slate-400">
        Answer a few questions. AI will generate a recommended analytics stack.
      </p>

      <div className="mt-8 space-y-6 max-w-xl">
        <div>
          <label className="text-sm">Industry</label>
          <select
            className="mt-2 w-full rounded bg-slate-900 border border-slate-700 p-2"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
          >
            <option value="">Select</option>
            <option>Government</option>
            <option>Health</option>
            <option>Agriculture</option>
            <option>Retail</option>
          </select>
        </div>

        <div>
          <label className="text-sm">Preferred Cloud</label>
          <select
            className="mt-2 w-full rounded bg-slate-900 border border-slate-700 p-2"
            value={cloud}
            onChange={(e) => setCloud(e.target.value)}
          >
            <option value="">Select</option>
            <option>Azure</option>
            <option>AWS</option>
            <option>GCP</option>
          </select>
        </div>

        <button
          disabled={!industry || !cloud}
          onClick={goGenerate}
          className="rounded bg-gradient-to-r from-sky-400 to-violet-500 px-6 py-3 text-sm font-medium text-slate-900 disabled:opacity-40"
        >
          Generate Architecture
        </button>
      </div>
    </>
  );
}
