import secrets
from typing import Annotated

from fastapi import APIRouter, Depends, Request, Response
from pydantic import BaseModel, ConfigDict

from app.auth.rate_limit import SlidingWindowLimiter
from app.auth.session import (
    SESSION_COOKIE_NAME,
    SessionClaims,
    create_session_token,
    require_session,
)
from app.core.errors import ApiProblem
from app.core.settings import Settings, get_settings


class LoginRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    password: str


def create_auth_router() -> APIRouter:
    router = APIRouter(prefix="/api/v1/auth", tags=["auth"])
    failed_logins = SlidingWindowLimiter()

    @router.post("/login", status_code=204)
    async def login(
        payload: LoginRequest,
        request: Request,
        response: Response,
        settings: Annotated[Settings, Depends(get_settings)],
    ) -> None:
        expected = settings.demo_access_password.get_secret_value()
        if not secrets.compare_digest(payload.password, expected):
            await failed_logins.check(
                _client_ip(request),
                limit=5,
                window_seconds=300,
            )
            raise ApiProblem(401, "INVALID_CREDENTIALS", "访问密码不正确")

        max_age = settings.session_hours * 60 * 60
        response.set_cookie(
            SESSION_COOKIE_NAME,
            create_session_token(settings),
            max_age=max_age,
            path="/api",
            secure=settings.app_env == "production",
            httponly=True,
            samesite="strict",
        )

    @router.get("/session")
    async def session(
        claims: Annotated[SessionClaims, Depends(require_session)],
    ) -> dict[str, bool]:
        del claims
        return {"authenticated": True}

    @router.post("/logout", status_code=204)
    async def logout(
        response: Response,
        claims: Annotated[SessionClaims, Depends(require_session)],
    ) -> None:
        del claims
        response.delete_cookie(
            SESSION_COOKIE_NAME,
            path="/api",
            secure=False,
            httponly=True,
            samesite="strict",
        )

    return router


def _client_ip(request: Request) -> str:
    return request.client.host if request.client is not None else "unknown"
