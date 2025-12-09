// src/app/wizard/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function WizardIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/wizard/questions");
  }, [router]);

  return <div className="p-6">Redirecting to onboarding wizard…</div>;
}
