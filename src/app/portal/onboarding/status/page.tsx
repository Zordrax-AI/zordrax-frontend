export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { Spinner } from "@/components/ui/Spinner";
import StatusClient from "./status-client";

export default function StatusPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <StatusClient />
    </Suspense>
  );
}
