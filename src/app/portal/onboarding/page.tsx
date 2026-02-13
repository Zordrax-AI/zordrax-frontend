import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function Page({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const rs =
    Array.isArray(searchParams.requirement_set_id) && searchParams.requirement_set_id.length
      ? searchParams.requirement_set_id[0]
      : (searchParams.requirement_set_id as string | undefined);

  const target = rs
    ? `/portal/onboarding/mozart/connect-data?requirement_set_id=${encodeURIComponent(rs)}`
    : "/portal/onboarding/mozart/connect-data";

  redirect(target);
}
