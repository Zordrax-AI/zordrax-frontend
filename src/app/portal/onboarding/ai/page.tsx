import { Suspense } from "react";
import RedirectClient from "./redirect-client";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <RedirectClient />
    </Suspense>
  );
}
