import { redirect } from "next/navigation";

export default function LegacyDeployPage({ searchParams }: { searchParams?: Record<string, string> }) {
  const qs = new URLSearchParams(searchParams ?? {});
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  redirect(`/portal/onboarding/mozart/deploy${suffix}`);
}
