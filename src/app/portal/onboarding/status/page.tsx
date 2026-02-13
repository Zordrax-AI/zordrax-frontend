import { redirect } from "next/navigation";

export default function LegacyOnboardingStatusPage({ searchParams }: { searchParams: { run_id?: string } }) {
  const run = searchParams?.run_id;
  if (run) redirect(`/portal/runs/${run}`);
  redirect("/portal/runs");
}
