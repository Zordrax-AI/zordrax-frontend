export const dynamic = "force-dynamic";

import { Suspense } from "react";
import DeployClient from "./deploy-client";

export default function DeployPage() {
  return (
    <Suspense fallback={<div className="p-6">Preparing deployment…</div>}>
      <DeployClient />
    </Suspense>
  );
}
