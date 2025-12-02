from fastapi import APIRouter

from .mock_routes import router as mock_router
from .onboarding_routes import router as onboarding_router

router = APIRouter()
router.include_router(mock_router)
router.include_router(onboarding_router)

__all__ = ["router"]
