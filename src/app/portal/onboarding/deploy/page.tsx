"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const BASE = process.env.NEXT_PUBLIC_AGENT_BASE_URL!;

export default function DeployPage() {
  const router = useRouter();

  useEffect(() => {
    const manifest = JSON.parse(
      sessionStorage.getItem("onboarding_manifest") || "{}"
    );

    fetch(`${BASE}/deploy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(manifest),
    })
      .then((r) => r.json())
      .then((res) => {
        sessionStorage.setItem("run_id", res.run_id);
        router.push("/portal/onboarding/status");
      });
  }, []);

  return <div>Deploying infrastructure…</div>;
}
