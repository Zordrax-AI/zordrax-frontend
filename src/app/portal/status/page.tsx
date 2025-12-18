export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { Spinner } from "@/components/ui/Spinner";
import StatusClient from "./status-client";

export default function StatusPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 flex items-center gap-2">
          <Spinner /> Loading run status…
        </div>
      }
    >
      <StatusClient />
    </Suspense>
  );
}
