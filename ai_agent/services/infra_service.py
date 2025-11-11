from __future__ import annotations

from dataclasses import dataclass, field
import time
from threading import Lock
from typing import Any, Dict, Optional


@dataclass
class PipelineRun:
    run_id: int
    web_url: str
    started_at: float
    completion_delay: float = 5.0
    status: str = "inProgress"
    result: Optional[str] = None

    def maybe_finalize(self) -> None:
        if self.status == "inProgress":
            elapsed = time.monotonic() - self.started_at
            if elapsed >= self.completion_delay:
                self.status = "completed"
                # Mark result as succeeded if not already set.
                self.result = self.result or "succeeded"


class InfraService:
    """Lightweight stateful service that simulates infra orchestration."""

    def __init__(self, completion_delay_seconds: float = 5.0) -> None:
        self._lock = Lock()
        self._completion_delay = completion_delay_seconds
        self._runs: Dict[int, PipelineRun] = {}
        self._next_run_id = 1

    # ------------------------------------------------------------------ #
    # Mock data builders
    # ------------------------------------------------------------------ #
    def recommendation_stack(self) -> Dict[str, str]:
        return {
            "infrastructure": "Azure Databricks Lakehouse with Delta Sharing",
            "etl": "Event-driven pipelines orchestrated via Azure Data Factory",
            "governance": "Unity Catalog with automated lineage via Purview",
            "reporting": "Power BI semantic model backed by Direct Lake",
        }

    def terraform_manifest(self) -> Dict[str, Any]:
        return {
            "module": {
                "lakehouse": {
                    "source": "git::https://example.com/zordrax/lakehouse-module",
                    "workspace_name": "zordrax-analytics-dev",
                    "enable_delta_sharing": True,
                }
            },
            "resource": {
                "azurerm_data_factory": {
                    "orchestrator": {
                        "name": "zordrax-adf-dev",
                        "location": "westeurope",
                    }
                }
            },
        }

    def ai_flow_template(self) -> Dict[str, Any]:
        return {
            "recommendation": self.recommendation_stack(),
            "requirements": {
                "description": "AI curated infra requirements",
                "required_stacks": ["lakehouse", "event-driven-etl", "governed-bi"],
                "controls": {"security": ["RBAC", "Key Vault"], "compliance": ["GDPR"]},
            },
            "onboarding": {
                "project_name": "Zordrax Analytica - AI Flow",
                "owner": "AI Orchestrator",
                "phases": [
                    {"name": "Assess environment", "status": "complete"},
                    {"name": "Provision landing zone", "status": "pending"},
                ],
            },
            "terraform_manifest": self.terraform_manifest(),
            "next_action": "Trigger automated deployment",
        }

    def manual_flow_template(self) -> Dict[str, Any]:
        return {
            "checklist": [
                "Collect architectural sign-off",
                "Upload security review",
                "Schedule onboarding workshop",
            ],
            "owner": "Manual Flow Coordinator",
            "documents": [
                "Architecture diagram",
                "Runbook",
                "Data classification matrix",
            ],
        }

    # ------------------------------------------------------------------ #
    # Pipeline orchestration helpers
    # ------------------------------------------------------------------ #
    def trigger_pipeline(self, payload: Dict[str, Any] | None = None) -> Dict[str, Any]:
        payload = payload or {}
        run = self._create_run()
        return {
            "status": "success",
            "recommendations": self.recommendation_stack(),
            "manifest": self.terraform_manifest(),
            "pipeline_run": {"run_id": run.run_id, "web_url": run.web_url},
            "received": payload,
        }

    def trigger_manual_pipeline(self, payload: Dict[str, Any] | None = None) -> Dict[str, Any]:
        payload = payload or {}
        run = self._create_run()
        return {
            "status": "success",
            "message": "Manual pipeline acknowledged",
            "pipeline_run": {"run_id": run.run_id, "web_url": run.web_url},
            "received": payload,
        }

    def get_run_status(self, run_id: int) -> Dict[str, Optional[str]]:
        with self._lock:
            run = self._runs.get(run_id)
            if not run:
                return {"status": "notFound", "result": None}
            run.maybe_finalize()
            return {"status": run.status, "result": run.result}

    def mark_run_failed(self, run_id: int, reason: str = "failed") -> None:
        with self._lock:
            run = self._runs.get(run_id)
            if run:
                run.status = "completed"
                run.result = reason

    # ------------------------------------------------------------------ #
    # Private helpers
    # ------------------------------------------------------------------ #
    def _create_run(self) -> PipelineRun:
        with self._lock:
            run_id = self._next_run_id
            self._next_run_id += 1
            record = PipelineRun(
                run_id=run_id,
                web_url=f"https://dev.azure.com/zordrax/build/{run_id}",
                started_at=time.monotonic(),
                completion_delay=self._completion_delay,
            )
            self._runs[run_id] = record
            return record

