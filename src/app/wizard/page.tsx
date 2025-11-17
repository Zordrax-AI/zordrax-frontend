"use client";

import { DeployButton } from "@/components/DeployButton";
import { StatusBanner } from "@/components/StatusBanner";
import { BuildStatus } from "@/components/BuildStatus";
import { RecommendationsCard } from "@/components/RecommendationsCard";
import { useDeploymentWorkflow } from "@/hooks/useDeploymentWorkflow";

export default function WizardPage() {
  const { status, loading, recommendations, runId, buildState, pollWarning, handleDeploy } =
    useDeploymentWorkflow("/onboarding/ai-and-deploy");

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-6 py-12">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">AI orchestration</p>
        <h1 className="text-3xl font-bold text-gray-900">AI Deploy Architecture</h1>
        <p className="text-gray-600">
          This path calls <code className="rounded bg-gray-100 px-2 py-0.5 text-xs">POST /onboarding/ai-and-deploy</code>{" "}
          and polls the DevOps run until completion.
        </p>
      </header>

      <section className="space-y-6 rounded-3xl bg-white p-8 shadow">
        <div className="flex flex-wrap items-center gap-4">
          <DeployButton
            label={loading ? "Deploying..." : "Deploy Architecture"}
            onClick={handleDeploy}
            disabled={loading}
          />
          {runId ? (
            <p className="text-sm text-gray-600">
              Tracking run <span className="font-semibold text-gray-900">#{runId}</span>
            </p>
          ) : null}
        </div>

        <StatusBanner
          title="Deployment status"
          variant={status.variant}
          message={status.message}
          linkHref={status.linkHref}
          linkLabel={status.linkLabel}
        />

        <BuildStatus statusText={buildState} warning={pollWarning} />

        {recommendations ? <RecommendationsCard data={recommendations} /> : null}
      </section>
    </main>
  );
}
