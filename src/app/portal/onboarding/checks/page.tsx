"use client";

import { useEffect } from "react";
import { redirect } from "next/navigation";

export default function ChecksRedirect() {
  useEffect(() => {
    redirect("/portal/onboarding/mozart/data-checks");
  }, []);
  return null;
}
