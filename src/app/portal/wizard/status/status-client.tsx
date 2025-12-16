"use client";

import { Card } from "@/components/ui/Card";

export default function WizardStatusClient() {
  return (
    <Card>
      <div className="space-y-2">
        <h1 className="text-lg font-semibold">Wizard Status</h1>
        <p className="text-sm text-slate-400">
          This legacy wizard status page is deprecated.
        </p>
        <p className="text-xs text-slate-500">
          Use <code>/portal/status</code> instead.
        </p>
      </div>
    </Card>
  );
}
