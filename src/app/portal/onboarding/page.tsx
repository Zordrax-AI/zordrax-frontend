import Link from "next/link";

export default function OnboardingEntry() {
  return (
    <section className="px-6 py-16">
      <h1 className="text-2xl font-semibold">Choose Onboarding Mode</h1>

      <div className="mt-6 flex gap-6">
        <Link href="/portal/onboarding/guided" className="border p-4 rounded">
          Guided (Wizard)
        </Link>

        <Link href="/portal/onboarding/visual" className="border p-4 rounded">
          Visual (Low-Code)
        </Link>
      </div>
    </section>
  );
}
