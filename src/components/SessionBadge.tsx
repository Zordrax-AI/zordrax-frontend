"use client";

import { SessionStatus } from "@/lib/onboardingConsoleApi";

export function SessionBadge({ status }: { status: SessionStatus }) {
  const label = status.toUpperCase();
  let classes =
    "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ";

  switch (status) {
    case "succeeded":
      classes += "bg-emerald-100 text-emerald-700";
      break;
    case "failed":
      classes += "bg-red-100 text-red-700";
      break;
    case "running":
      classes += "bg-blue-100 text-blue-700";
      break;
    default:
      classes += "bg-gray-100 text-gray-700";
  }

  return <span className={classes}>{label}</span>;
}
