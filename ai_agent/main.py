from fastapi import FastAPI

from .routes import router


def create_app() -> FastAPI:
    """Application factory so tests can create isolated instances."""
    app = FastAPI(
        title="Zordrax Analytica AI Agent",
        description="Mock orchestration API for onboarding wizard flows.",
        version="1.0.0",
    )

    @app.get("/health", tags=["system"])
    def health_check() -> dict[str, str]:
        return {"status": "ok"}

    app.include_router(router)
    return app


app = create_app()

