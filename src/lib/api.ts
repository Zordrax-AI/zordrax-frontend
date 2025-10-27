"use client";
import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000",
});

export const fetchAiFlow = async () => (await api.get("/mock/ai_flow")).data;
export const fetchManualFlow = async () => (await api.get("/mock/manual_flow")).data;

export const triggerDeployment = async (mode: "ai" | "manual") => {
  const endpoint =
    mode === "ai" ? "/onboarding/ai-and-deploy" : "/onboarding/manual_flow";

  const payload =
    mode === "ai"
      ? {
          project: "Zordrax Analytica",
          environment: "dev",
          business_context: "Automate data onboarding with AI orchestration",
        }
      : {
          project_name: "Zordrax Manual",
          environment: "dev",
          trigger_pipeline: true,
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

  return await res.json();
};
