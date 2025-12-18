export const RUN_STAGES = [
  { key: "queued", label: "Queued" },
  { key: "infra_provisioning", label: "Provisioning Infrastructure" },
  { key: "etl_setup", label: "Setting up Data Pipelines" },
  { key: "governance_setup", label: "Applying Governance & Security" },
  { key: "bi_deployment", label: "Deploying BI & Reporting" },
  { key: "completed", label: "Completed" },
  { key: "failed", label: "Failed" },
] as const;

export function stageLabel(stage?: string) {
  return RUN_STAGES.find((s) => s.key === stage)?.label ?? "Unknown";
}

export function stageProgress(stage?: string) {
  const idx = RUN_STAGES.findIndex((s) => s.key === stage);
  if (idx < 0) return 0;
  // exclude failed from progress math
  const total = RUN_STAGES.length - 1;
  return Math.round(((idx + 1) / total) * 100);
}
