"use client";

import GuidedWizard from "./wizard";

export default function GuidedPage() {
  return (
    <div className="max-w-3xl mx-auto py-10">
      <h1 className="text-2xl font-semibold mb-6">Guided Onboarding Wizard</h1>
      <GuidedWizard />
    </div>
  );
}
