"use client";
import axios from "axios";

/**
 * Base API configuration
 */
const api = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_URL ||
    "https://zordrax-onboarding-agent-zordrax-analytica-dev.azurewebsites.net",
  headers: { "Content-Type": "application/json" },
});

/**
 * Types
 */
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
  terraform_manifest?: Record<string, unknown>;
  next_action?: string;
};

export type ManualFlowResponse = Record<string, unknown>;

type DeploymentResponse = { message: string };

type TriggerDeploymentExtras = {
  requirements?: RequirementsPayload;
  onboarding?: OnboardingPayload;
};

/**
 * Mock endpoint wrappers
 */
export const fetchAiFlow = async (): Promise<AiFlowResponse> => {
  const res = await api.get<AiFlowResponse>("/mock/ai_flow");
  return res.data;
};

export const fetchManualFlow = async (): Promise<ManualFlowResponse> => {
  const res = await api.get<ManualFlowResponse>("/mock/manual_flow");
  return res.data;
};

/**
 * Trigger deployment pipeline (AI / Manual)
 */
export const triggerDeployment = async (
  mode: "ai" | "manual",
  extras: TriggerDeploymentExtras = {}
): Promise<DeploymentResponse> => {
  const endpoint =
    mode === "ai" ? "/onboarding/ai-and-deploy" : "/onboarding/manual_flow";

  const payload =
    mode === "ai"
      ? {
          project: "Zordrax Analytica",
          environment: "dev",
          business_context: "Automate data onboarding with AI orchestration",
          ...extras,
        }
      : {
          project_name: "Zordrax Manual",
          environment: "dev",
          trigger_pipeline: true,
          ...extras,
        };

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    throw new Error(`Pipeline trigger failed: ${await res.text()}`);
  }
  return (await res.json()) as DeploymentResponse;
};
