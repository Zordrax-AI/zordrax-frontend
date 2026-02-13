import PortalHomeClient from "./portal-home-client";

export const dynamic = "force-dynamic";

export default function PortalHomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-100">Zordrax Analytica Console</h1>
        <p className="mt-1 text-sm text-slate-400">
          Launch, govern, and monitor your BRD-driven data stack with the Mozart wizard.
        </p>
      </div>

      <PortalHomeClient />
    </div>
  );
}
