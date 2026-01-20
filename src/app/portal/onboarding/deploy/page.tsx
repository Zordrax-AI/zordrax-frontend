// src/app/portal/onboarding/deploy/page.tsx
export const dynamic = "force-dynamic";

import { Suspense } from "react";
import DeployClient from "./deploy-client";

export default function DeployPage() {
  return (
    <Suspense fallback={<div>Loading deploy...</div>}>
      <DeployClient />
    </Suspense>
  );
}
