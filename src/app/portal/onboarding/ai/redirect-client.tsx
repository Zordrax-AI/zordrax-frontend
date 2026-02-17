"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function RedirectClient() {
  const router = useRouter();
  const sp = useSearchParams();

  useEffect(() => {
    const qs = sp.toString();
    router.replace(`/portal/onboarding/mozart/connect${qs ? `?${qs}` : ""}`);
  }, [router, sp]);

  return null;
}
