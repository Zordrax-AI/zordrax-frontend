import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchBuildStatus,
  postDeployment,
  DeploymentResponse,
} from "@/lib/api";

import { saveLastSessionId } from "@/hooks/useOnboardingSession";

type StatusVariant = "idle" | "info" | "success" | "error";

type StatusState = {
  variant: StatusVariant;
  message: string;
  linkHref?: string;
  linkLabel?: string;
};

const defaultStatus: StatusState = {
  variant: "idle",
  message: "Deployment not started.",
};

function extractRunId(data: DeploymentResponse): number | null {
  if (typeof data.pipeline_run?.run_id === "number") {
    return data.pipeline_run.run_id;
  }

  // Some mocked pipelines return `run_id` top-level in v5 mock mode
  if (typeof data.run_id === "number") {
    return data.run_id;
  }

  return null;
}

// Default payload used by Deploy Console
const defaultPayload = {
  requirements: {
    environment: "dev",
    region: "westeurope",
    description: "Triggered from frontend deploy console.",
  },
  onboarding: {
    project_name: "zordrax-frontend",
    owner: "deploy-console",
    description: "Triggered from frontend deploy console.",
  },
};

export function useDeploymentWorkflow(
  endpoint: string,
  payload: Record<string, unknown> = defaultPayload
) {
  const [status, setStatus] = useState<StatusState>(defaultStatus);
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<unknown | null>(null);
  const [runId, setRunId] = useState<number | null>(null);
  const [buildState, setBuildState] = useState<string | null>(null);
  const [pollWarning, setPollWarning] = useState<string | null>(null);

  const pollingActive = useRef(false);

  // ---------------------------------------------------------------------------
  //                              DEPLOY HANDLER
  // ---------------------------------------------------------------------------
  const handleDeploy = useCallback(async () => {
    setLoading(true);
    setStatus({ variant: "info", message: "Deploying..." });
    setRecommendations(null);
    setBuildState(null);
    setPollWarning(null);

    try {
      const data = await postDeployment(endpoint, payload);

      if (!data) {
        throw new Error("Invalid response from API");
      }

      const message = data.message || "Deployment triggered successfully.";
      const linkHref = data.pipeline_run?.web_url;

      setStatus({
        variant: "success",
        message,
        linkHref,
        linkLabel: linkHref ? "View build details" : undefined,
      });

      // AI mode returns recommendations; manual mode does not
      setRecommendations(data.recommendations ?? null);

      // run_id comes from Azure DevOps
      const newRunId = extractRunId(data);
      setRunId(newRunId);

      // ---------------------------------------------------------------------
      // ⭐⭐ 100% CORRECT V5 LOGIC: session_id ALWAYS top-level
      // ---------------------------------------------------------------------
      const sessionId = data.session_id;

      if (!sessionId || typeof sessionId !== "string") {
        throw new Error("Backend did not return a valid session_id");
      }

      // Save for downstream pages (merge / governance / history)
      saveLastSessionId(sessionId);

    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Unexpected deployment error.";

      setStatus({ variant: "error", message });
      setRunId(null);
    } finally {
      setLoading(false);
    }
  }, [endpoint, payload]);

  // ---------------------------------------------------------------------------
  //                                POLLING
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!runId) {
      pollingActive.current = false;
      return;
    }

    let cancelled = false;
    pollingActive.current = true;

    const poll = async () => {
      if (!pollingActive.current) return;

      try {
        const result = await fetchBuildStatus(runId);
        if (cancelled) return;

        if (!result?.status) {
          setPollWarning("Invalid response from API");
          return;
        }

        if (result.status === "completed") {
          const passed = result.result === "succeeded";

          setBuildState(
            passed
              ? "Build succeeded"
              : result.result
              ? `Build ${result.result}`
              : "Build completed"
          );

          pollingActive.current = false;
        } else if (result.status === "inProgress") {
          setBuildState("Build running...");
        } else {
          setBuildState(`Status: ${result.status}`);
        }

        setPollWarning(null);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to poll build status.";

        setPollWarning(message);
      }
    };

    poll();
    const interval = setInterval(poll, 20000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [runId]);

  // ---------------------------------------------------------------------------
  //                                  RETURN
  // ---------------------------------------------------------------------------
  return {
    status,
    loading,
    recommendations,
    runId,
    buildState,
    pollWarning,
    handleDeploy,
  };
}
