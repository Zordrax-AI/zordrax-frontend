import { Suspense } from "react";
import { Spinner } from "@/components/ui/Spinner";
import DeployClient from "./deploy-client";

export const dynamic = "force-dynamic";

export default function DeployPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 flex items-center gap-2 text-sm text-slate-400">
          <Spinner />
          Preparing deployment…
        </div>
      }
    >
      <DeployClient />
    </Suspense>
  );
}
