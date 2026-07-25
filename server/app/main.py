from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

from app.ai.router import create_ai_router
from app.auth.router import create_auth_router
from app.core.errors import (
    ApiProblem,
    api_problem_handler,
    unhandled_error_handler,
    validation_error_handler,
)
from app.core.request_context import RequestContextMiddleware
from app.core.security_headers import SecurityHeadersMiddleware
from app.core.settings import Settings, get_settings


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    async with httpx.AsyncClient(follow_redirects=False) as client:
        app.state.model_client = client
        yield


def create_app(settings: Settings | None = None) -> FastAPI:
    resolved_settings = settings or get_settings()
    allowed_origins = resolved_settings.allowed_origins
    app = FastAPI(
        title="FitPilot Secure Model Proxy",
        version="1.0.0",
        lifespan=lifespan,
    )

    app.add_exception_handler(ApiProblem, api_problem_handler)
    app.add_exception_handler(RequestValidationError, validation_error_handler)
    app.add_exception_handler(Exception, unhandled_error_handler)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(
        RequestContextMiddleware,
        allowed_origins=allowed_origins,
    )
    app.add_middleware(
        SecurityHeadersMiddleware,
        production=resolved_settings.app_env == "production",
    )

    def supplied_settings() -> Settings:
        return resolved_settings

    app.dependency_overrides[get_settings] = supplied_settings

    @app.get("/health/live")
    async def liveness() -> dict[str, str]:
        return {"status": "ok"}

    app.include_router(create_auth_router())
    app.include_router(create_ai_router())
    return app


app = create_app()
