from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Annotated
from uuid import uuid4

import jwt
from fastapi import Depends, Request

from app.core.errors import ApiProblem
from app.core.settings import Settings, get_settings

SESSION_COOKIE_NAME = "fitpilot_session"
SESSION_ALGORITHM = "HS256"


@dataclass(frozen=True)
class SessionClaims:
    session_id: str
    expires_at: datetime


def create_session_token(
    settings: Settings,
    now: datetime | None = None,
) -> str:
    issued_at = now or datetime.now(UTC)
    expires_at = issued_at + timedelta(hours=settings.session_hours)
    return jwt.encode(
        {
            "sub": "demo",
            "sid": str(uuid4()),
            "iat": issued_at,
            "exp": expires_at,
        },
        settings.session_secret.get_secret_value(),
        algorithm=SESSION_ALGORITHM,
    )


def decode_session_token(
    token: str,
    settings: Settings,
) -> SessionClaims:
    try:
        payload = jwt.decode(
            token,
            settings.session_secret.get_secret_value(),
            algorithms=[SESSION_ALGORITHM],
            options={"require": ["sub", "sid", "iat", "exp"]},
        )
        if payload.get("sub") != "demo":
            raise jwt.InvalidTokenError
        session_id = payload["sid"]
        expires_at = datetime.fromtimestamp(payload["exp"], tz=UTC)
        if not isinstance(session_id, str) or not session_id:
            raise jwt.InvalidTokenError
    except (KeyError, TypeError, ValueError, jwt.PyJWTError) as exc:
        raise ApiProblem(401, "AUTH_REQUIRED", "请先登录") from exc
    return SessionClaims(session_id=session_id, expires_at=expires_at)


async def require_session(
    request: Request,
    settings: Annotated[Settings, Depends(get_settings)],
) -> SessionClaims:
    token = request.cookies.get(SESSION_COOKIE_NAME)
    if not token:
        raise ApiProblem(401, "AUTH_REQUIRED", "请先登录")
    return decode_session_token(token, settings)
