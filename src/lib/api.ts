"use client";
import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000",
});

export const fetchAiFlow = async () => (await api.get("/mock/ai_flow")).data;
export const fetchManualFlow = async () => (await api.get("/mock/manual_flow")).data;


export const triggerDeployment = async (mode: "ai" | "manual") => {
  const endpoint =
    mode === "ai" ? "/onboarding/ai-and-deploy" : "/onboarding/manual";
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project: "Zordrax Analytica",
        environment: "dev",
        trigger_pipeline: true,
      }),
    }
  );
  if (!res.ok) throw new Error("Pipeline trigger failed");
  return await res.json();
};
