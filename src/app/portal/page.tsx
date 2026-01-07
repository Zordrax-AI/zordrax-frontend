import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";

export default function PortalHomePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Zordrax Console</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <LinkButton href="/portal/onboarding" variant="primary">
            Start Onboarding
          </LinkButton>
        </Card>

        <Card>
          <LinkButton href="/portal/runs" variant="outline">
            View Runs
          </LinkButton>
        </Card>
      </div>
    </div>
  );
}
