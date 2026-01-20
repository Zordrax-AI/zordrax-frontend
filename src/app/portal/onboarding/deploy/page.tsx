import { Suspense } from "react";
import DeployClient from "./deploy-client";

export default function DeployPage({
  searchParams,
}: {
  searchParams?: { rec?: string };
}) {
  const recommendationId = searchParams?.rec || "test-001"; // MVP fallback

  return (
    <Suspense fallback={<div>Loading deploy...</div>}>
      <DeployClient recommendationId={recommendationId} />
    </Suspense>
  );
}
