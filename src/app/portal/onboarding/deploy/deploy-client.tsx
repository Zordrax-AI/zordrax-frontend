"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { onboard } from "@/lib/agent";

export default function DeployClient() {
  const params = useSearchParams();
  const router = useRouter();
  const sessionId = params.get("session");

  async function deploy() {
    if (!sessionId) {
      alert("Missing session");
      return;
    }

    const { run_id } = await onboard({
      mode: "ai",
      session_id: sessionId,
    });

    router.push(`/portal/status?run=${run_id}`);
  }

  return (
    <button onClick={deploy}>
      Deploy
    </button>
  );
}
