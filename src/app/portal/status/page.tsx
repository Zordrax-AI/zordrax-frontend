import { redirect } from "next/navigation";

export default function LegacyStatusPage({ searchParams }: { searchParams: { run?: string } }) {
  const run = searchParams?.run;
  if (run) redirect(`/portal/runs/${run}`);
  redirect("/portal/runs");
}
