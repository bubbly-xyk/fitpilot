from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

from app.auth.router import create_auth_router
from app.core.errors import (
    ApiProblem,
    api_problem_handler,
    unhandled_error_handler,
    validation_error_handler,
)
from app.core.request_context import RequestContextMiddleware
from app.core.security_headers import SecurityHeadersMiddleware
from app.core.settings import get_settings


def create_app() -> FastAPI:
    settings = get_settings()
    allowed_origin = str(settings.allowed_origin).rstrip("/")
    app = FastAPI(title="FitPilot Secure Model Proxy", version="1.0.0")

    app.add_exception_handler(ApiProblem, api_problem_handler)
    app.add_exception_handler(RequestValidationError, validation_error_handler)
    app.add_exception_handler(Exception, unhandled_error_handler)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[allowed_origin],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(
        RequestContextMiddleware,
        allowed_origin=allowed_origin,
    )
    app.add_middleware(
        SecurityHeadersMiddleware,
        production=settings.app_env == "production",
    )

    @app.get("/health/live")
    async def liveness() -> dict[str, str]:
        return {"status": "ok"}

    app.include_router(create_auth_router())
    return app


app = create_app()
