from fastapi import APIRouter

from ai_agent.container import infra_service

router = APIRouter(prefix="/mock", tags=["mock"])


@router.get("/ai_flow")
def get_ai_flow() -> dict:
    return infra_service.ai_flow_template()


@router.get("/manual_flow")
def get_manual_flow() -> dict:
    return infra_service.manual_flow_template()

