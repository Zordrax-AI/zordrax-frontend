"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const steps = ["Cloud", "Pipelines", "Governance", "BI"];

export default function ManualWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  // minimal config placeholders
  const [cloud, setCloud] = useState("Azure");
  const [etl, setEtl] = useState("Databricks");
  const [governance, setGovernance] = useState("Great Expectations");
  const [bi, setBi] = useState("Power BI");

  function goGenerate() {
    const qs = new URLSearchParams({
      mode: "manual",
      cloud,
      etl,
      governance,
      bi,
    });
    router.push(`/portal/generate?${qs.toString()}`);
  }

  return (
    <>
      <h1 className="text-2xl font-semibold">Manual Configuration</h1>
      <p className="mt-2 text-slate-400">
        Configure your stack step by step. You stay in full control.
      </p>

      <div className="mt-8 max-w-xl rounded border border-slate-800 bg-slate-900/40 p-6">
        <p className="text-sm text-slate-400">
          Step {step + 1} of {steps.length}: <strong>{steps[step]}</strong>
        </p>

        <div className="mt-6 space-y-4">
          {steps[step] === "Cloud" && (
            <div>
              <label className="text-sm">Cloud</label>
              <select
                className="mt-2 w-full rounded bg-slate-900 border border-slate-700 p-2"
                value={cloud}
                onChange={(e) => setCloud(e.target.value)}
              >
                <option>Azure</option>
                <option>AWS</option>
                <option>GCP</option>
              </select>
            </div>
          )}

          {steps[step] === "Pipelines" && (
            <div>
              <label className="text-sm">ETL / ELT</label>
              <select
                className="mt-2 w-full rounded bg-slate-900 border border-slate-700 p-2"
                value={etl}
                onChange={(e) => setEtl(e.target.value)}
              >
                <option>Databricks</option>
                <option>ADF</option>
                <option>dbt</option>
              </select>
            </div>
          )}

          {steps[step] === "Governance" && (
            <div>
              <label className="text-sm">Governance</label>
              <select
                className="mt-2 w-full rounded bg-slate-900 border border-slate-700 p-2"
                value={governance}
                onChange={(e) => setGovernance(e.target.value)}
              >
                <option>Great Expectations</option>
                <option>Purview</option>
              </select>
            </div>
          )}

          {steps[step] === "BI" && (
            <div>
              <label className="text-sm">BI</label>
              <select
                className="mt-2 w-full rounded bg-slate-900 border border-slate-700 p-2"
                value={bi}
                onChange={(e) => setBi(e.target.value)}
              >
                <option>Power BI</option>
                <option>Tableau</option>
                <option>Looker</option>
              </select>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-between">
          <button
            disabled={step === 0}
            onClick={() => setStep(step - 1)}
            className="text-sm text-slate-400 disabled:opacity-40"
          >
            Back
          </button>

          {step < steps.length - 1 ? (
            <button onClick={() => setStep(step + 1)} className="text-sm text-sky-400">
              Next
            </button>
          ) : (
            <button onClick={goGenerate} className="text-sm text-violet-400">
              Generate
            </button>
          )}
        </div>
      </div>
    </>
  );
}
