"use client";
import { useEffect, useState } from "react";
import { fetchManualFlow } from "../lib/api";

export default function Review() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchManualFlow().then(setData).catch(console.error);
  }, []);

  if (!data) return <div className="p-8">Loading manual flow template...</div>;

  return (
    <main className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Manual Onboarding Template</h1>
      <pre className="bg-gray-100 p-4 rounded-lg text-sm">
        {JSON.stringify(data, null, 2)}
      </pre>
    </main>
  );
}
