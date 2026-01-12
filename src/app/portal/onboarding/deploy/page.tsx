import { Suspense } from "react";
import DeployClient from "./deploy-client";

/**
 * TEMP MVP:
 * - recommendationId is hardcoded
 * - later this will come from:
 *   - URL param
 *   - onboarding session
 *   - saved recommendation snapshot
 */
export default function DeployPage() {
  return (
    <Suspense fallback={<div>Loading deploy...</div>}>
      <DeployClient recommendationId="test-001" />
    </Suspense>
  );
}

