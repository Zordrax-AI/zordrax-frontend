import { redirect } from "next/navigation";

// Canonical Level 1 path: Mozart builder
export default function OnboardingEntryPage() {
  redirect("/portal/onboarding/mozart/connect-data");
}
