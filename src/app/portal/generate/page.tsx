import { Suspense } from "react";
import GenerateClient from "./generate-client";

export default function GeneratePage() {
  return (
    <Suspense fallback={<p className="text-slate-400">Starting generation…</p>}>
      <GenerateClient />
    </Suspense>
  );
}
