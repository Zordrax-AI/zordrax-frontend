import { Suspense } from "react";
import { Spinner } from "@/components/ui/Spinner";
import OnboardingStepper from "@/components/onboarding/OnboardingStepper";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-6 md:grid-cols-[260px_1fr]">
          <aside className="rounded-lg border border-slate-800 bg-slate-950/40 p-4">
            {/* useSearchParams is inside stepper, so wrap it */}
            <Suspense
              fallback={
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Spinner /> Loading steps…
                </div>
              }
            >
              <OnboardingStepper />
            </Suspense>
          </aside>

          <main className="rounded-lg border border-slate-800 bg-slate-950/40 p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
