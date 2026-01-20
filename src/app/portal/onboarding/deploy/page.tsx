import { Suspense } from "react";
import DeployClient from "./deploy-client";

export default function DeployPage({
  searchParams,
}: {
  searchParams?: { rec?: string };
}) {
  // If you haven't implemented recommendation snapshots yet,
  // this will still work with a fallback value.
  const rec = searchParams?.rec ?? "test-001";

  return (
    <Suspense fallback={<div>Loading deploy...</div>}>
      <DeployClient recommendationId={rec} />
    </Suspense>
  );
}
