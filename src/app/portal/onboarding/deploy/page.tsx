import { Suspense } from "react";
import DeployClient from "./deploy-client";

export const dynamic = "force-dynamic";

export default function DeployPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const recRaw = searchParams?.rec;
  const rec =
    (Array.isArray(recRaw) ? recRaw[0] : recRaw) ||
    "test-001";

  return (
    <Suspense fallback={<div>Loading deploy...</div>}>
      <DeployClient recommendationId={rec} />
    </Suspense>
  );
}
