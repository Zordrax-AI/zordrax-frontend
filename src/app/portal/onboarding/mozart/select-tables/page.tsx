import { Suspense } from "react";
import SelectTablesClient from "./select-tables-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-slate-600">Loading...</div>}>
      <SelectTablesClient />
    </Suspense>
  );
}
