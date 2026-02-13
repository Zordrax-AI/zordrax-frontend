import { ReactNode, Suspense } from "react";
import OnboardingStepper from "@/components/onboarding/OnboardingStepper";

export default function MozartLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Mozart Wizard</div>
            <div className="text-lg font-semibold text-slate-900">Zordrax Analytica Onboarding</div>
          </div>
          <div className="hidden lg:block">
            <Suspense fallback={null}>
              <OnboardingStepper compact />
            </Suspense>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 lg:py-8 flex gap-6">
        <aside className="w-56 hidden lg:block">
          <Suspense fallback={null}>
            <OnboardingStepper />
          </Suspense>
        </aside>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
