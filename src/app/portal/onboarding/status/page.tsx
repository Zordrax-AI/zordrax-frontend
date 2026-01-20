import { redirect } from "next/navigation";

export default function OnboardingStatusRedirect({
  searchParams,
}: {
  searchParams?: { run?: string };
}) {
  const run = searchParams?.run;
  if (run) redirect(`/portal/status?run=${encodeURIComponent(run)}`);
  redirect(`/portal/status`);
}
