import PortalHomeClient from "./portal-home-client";

export const dynamic = "force-dynamic";

export default function PortalHomePage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      <PortalHomeClient />
    </div>
  );
}
