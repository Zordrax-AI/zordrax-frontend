import StatusClient from "./status-client";

export const dynamic = "force-dynamic";

export default function StatusPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <StatusClient />
    </div>
  );
}
