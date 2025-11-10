from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Any, Dict, Optional

from ai_agent.container import infra_service


class AiDeploymentRequest(BaseModel):
    project: Optional[str] = Field(default=None, description="Project name")
    environment: Optional[str] = Field(default=None, description="Target environment")
    business_context: Optional[str] = None
    requirements: Optional[Dict[str, Any]] = None
    onboarding: Optional[Dict[str, Any]] = None


class ManualDeploymentRequest(BaseModel):
    project_name: Optional[str] = None
    environment: Optional[str] = None
    trigger_pipeline: bool = True
    requirements: Optional[Dict[str, Any]] = None
    onboarding: Optional[Dict[str, Any]] = None


router = APIRouter(tags=["onboarding"])


@router.post("/onboarding/ai-and-deploy")
def ai_and_deploy(request: AiDeploymentRequest) -> Dict[str, Any]:
    payload = request.model_dump(exclude_none=True)
    response = infra_service.trigger_pipeline(payload)
    return response


@router.post("/onboarding/manual_flow")
def manual_flow(request: ManualDeploymentRequest) -> Dict[str, Any]:
    payload = request.model_dump(exclude_none=True)
    if not request.trigger_pipeline:
        raise HTTPException(status_code=400, detail="Manual flow must trigger pipeline")
    response = infra_service.trigger_manual_pipeline(payload)
    return response


@router.get("/devops/status/{run_id}")
def devops_status(run_id: int) -> Dict[str, Any]:
    return infra_service.get_run_status(run_id)

