"use client";
import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000",
});

export type RecommendationStack = {
  infrastructure: string;
  etl: string;
  governance: string;
  reporting: string;
};

export type RequirementsPayload = Record<string, unknown>;
export type OnboardingPayload = Record<string, unknown>;

export type AiFlowResponse = {
  recommendation: RecommendationStack;
  requirements?: RequirementsPayload;
  onboarding?: OnboardingPayload;
};

export type ManualFlowResponse = Record<string, unknown>;

type DeploymentResponse = {
  message: string;
};

type TriggerDeploymentExtras = {
  requirements?: RequirementsPayload;
  onboarding?: OnboardingPayload;
};

const defaultAiRequirements: RequirementsPayload = {
  stack: ["managed lakehouse", "event-driven ETL", "governed semantic layer"],
  controls: {
    security: ["RBAC", "audit logging"],
    compliance: ["GDPR", "SOC2"],
  },
};

const defaultAiOnboarding: OnboardingPayload = {
  owner: "AI Orchestrator",
  phases: [
    { name: "Assess current stack", status: "complete" },
    { name: "Provision infrastructure", status: "pending" },
    { name: "Configure governance", status: "pending" },
  ],
};

const defaultManualRequirements: RequirementsPayload = {
  documents: ["Architecture diagram", "Runbook", "Security checklist"],
  approvals: ["Security", "Data Governance"],
};

const defaultManualOnboarding: OnboardingPayload = {
  owner: "Manual Flow Coordinator",
  steps: [
    { name: "Collect requirements", status: "pending" },
    { name: "Kick-off workshop", status: "pending" },
  ],
};

export const fetchAiFlow = async (): Promise<AiFlowResponse> =>
  (await api.get<AiFlowResponse>("/mock/ai_flow")).data;

export const fetchManualFlow = async (): Promise<ManualFlowResponse> =>
  (await api.get<ManualFlowResponse>("/mock/manual_flow")).data;

export const triggerDeployment = async (
  mode: "ai" | "manual",
  extras: TriggerDeploymentExtras = {},
): Promise<DeploymentResponse> => {
  const endpoint =
    mode === "ai" ? "/onboarding/ai-and-deploy" : "/onboarding/manual_flow";

  const payload =
    mode === "ai"
      ? {
          project: "Zordrax Analytica",
          environment: "dev",
          business_context: "Automate data onboarding with AI orchestration",
          requirements: extras.requirements ?? defaultAiRequirements,
          onboarding: extras.onboarding ?? defaultAiOnboarding,
        }
      : {
          project_name: "Zordrax Manual",
          environment: "dev",
          trigger_pipeline: true,
          requirements: extras.requirements ?? defaultManualRequirements,
          onboarding: extras.onboarding ?? defaultManualOnboarding,
        };

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Pipeline trigger failed: ${err}`);
  }

  return (await res.json()) as DeploymentResponse;
};
