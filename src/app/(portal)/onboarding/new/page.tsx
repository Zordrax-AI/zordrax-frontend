"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { zaFetch } from "@/lib/za";

export const dynamic = "force-dynamic";

export default function NewOnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setLoading(true);
    setError(null);
    try {
      const session = await zaFetch("/api/brd/sessions", {
        method: "POST",
        body: { created_by: "portal", persisted: false },
      });
      const requirementSet = await zaFetch("/api/brd/requirement-sets", {
        method: "POST",
        body: { session_id: session?.id ?? session?.session_id, title: "Portal Onboarding" },
      });
      const id = requirementSet?.id || requirementSet?.requirement_set_id;
      if (!id) throw new Error("Missing requirement_set_id");
      router.push(`/portal/onboarding/mozart/connect-data?requirement_set_id=${encodeURIComponent(id)}`);
    } catch (e: any) {
      setError(e?.message || "Failed to create requirement set");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-6 text-[color:var(--fg)]">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">New Onboarding</h1>
        <p className="text-sm text-[color:var(--muted)]">Create a BRD session and requirement set.</p>
      </header>

      <Card className="p-5 space-y-3">
        <p className="text-sm text-[color:var(--muted)]">
          We will create a BRD session and initial requirement set before collecting details.
        </p>
        {error && (
          <div className="rounded-md border border-[color:var(--danger)] bg-[color:var(--danger-bg,rgba(244,63,94,0.12))] px-3 py-2 text-sm text-[color:var(--danger)]">
            {error}
          </div>
        )}
        <Button variant="primary" onClick={create} disabled={loading}>
          {loading ? "Creating…" : "Create BRD Session + Requirement Set"}
        </Button>
      </Card>
    </div>
  );
}
