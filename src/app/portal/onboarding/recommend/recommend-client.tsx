"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

type Recommendation = {
  cloud: string;
  warehouse: string;
  etl: string;
  bi: string;
  governance: string;
};

export default function RecommendClient() {
  const router = useRouter();
  const params = useSearchParams();

  const [rec, setRec] = useState<Recommendation | null>(null);

  useEffect(() => {
    setRec({
      cloud: params.get("cloud") ?? "azure",
      warehouse: "Databricks",
      etl: "dbt",
      bi: "Power BI",
      governance: "Purview",
    });
  }, [params]);

  if (!rec) return null;

  function handleDeploy() {
    router.push("/portal/onboarding/deploy");
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          AI Recommendation (Review & Edit)
        </h1>
        <p className="text-sm text-slate-400">
          Review and adjust before deployment.
        </p>
      </div>

      <Card className="space-y-4">
        <Editable label="Cloud" value={rec.cloud} onChange={(v) => setRec({ ...rec, cloud: v })} />
        <Editable label="Warehouse" value={rec.warehouse} onChange={(v) => setRec({ ...rec, warehouse: v })} />
        <Editable label="ETL" value={rec.etl} onChange={(v) => setRec({ ...rec, etl: v })} />
        <Editable label="BI" value={rec.bi} onChange={(v) => setRec({ ...rec, bi: v })} />
        <Editable label="Governance" value={rec.governance} onChange={(v) => setRec({ ...rec, governance: v })} />

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => router.back()}>
            Back
          </Button>

          <Button variant="primary" onClick={handleDeploy}>
            Approve & Deploy
          </Button>
        </div>
      </Card>
    </div>
  );
}

function Editable({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-3 items-center gap-4">
      <div className="text-sm text-slate-400">{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="col-span-2 rounded-md bg-slate-900 px-3 py-2 text-sm"
      />
    </div>
  );
}
