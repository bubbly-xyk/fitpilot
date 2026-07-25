import logging
from collections.abc import Awaitable, Callable
from time import perf_counter
from typing import Any, cast
from uuid import uuid4

from starlette.datastructures import Headers, MutableHeaders
from starlette.responses import JSONResponse
from starlette.types import ASGIApp, Message, Receive, Scope, Send

MAX_REQUEST_BYTES = 65_536
MAX_IMAGE_REQUEST_BYTES = 7 * 1024 * 1024
logger = logging.getLogger("fitpilot.requests")


class RequestContextMiddleware:
    def __init__(
        self,
        app: ASGIApp,
        *,
        allowed_origin: str,
        max_request_bytes: int = MAX_REQUEST_BYTES,
    ) -> None:
        self.app = app
        self.allowed_origin = allowed_origin
        self.max_request_bytes = max_request_bytes

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        headers = Headers(scope=scope)
        request_id = _accepted_request_id(headers.get("x-request-id")) or str(
            uuid4()
        )
        state = cast(dict[str, Any], scope.setdefault("state", {}))
        state["request_id"] = request_id
        response_started = False
        status_code = 500
        started = perf_counter()

        async def send_with_request_id(message: Message) -> None:
            nonlocal response_started, status_code
            if message["type"] == "http.response.start":
                response_started = True
                status_code = message["status"]
                MutableHeaders(scope=message)["X-Request-Id"] = request_id
            await send(message)

        if (
            scope["method"] == "POST"
            and scope["path"].startswith("/api/")
            and headers.get("origin") != self.allowed_origin
        ):
            await _send_problem(
                scope,
                receive,
                send_with_request_id,
                status_code=403,
                code="ORIGIN_NOT_ALLOWED",
                message="请求来源不被允许",
                request_id=request_id,
            )
            return

        request_limit = (
            MAX_IMAGE_REQUEST_BYTES
            if scope["path"] == "/api/v1/ai/recognize-food"
            else self.max_request_bytes
        )
        messages, too_large = await self._read_request(receive, request_limit)
        if too_large:
            await _send_problem(
                scope,
                receive,
                send_with_request_id,
                status_code=413,
                code="REQUEST_TOO_LARGE",
                message="请求内容过大",
                request_id=request_id,
            )
            return

        message_iterator = iter(messages)

        async def replay_receive() -> Message:
            try:
                return next(message_iterator)
            except StopIteration:
                return {"type": "http.disconnect"}

        try:
            await self.app(scope, replay_receive, send_with_request_id)
        except Exception:
            if response_started:
                raise
            await _send_problem(
                scope,
                receive,
                send_with_request_id,
                status_code=500,
                code="INTERNAL_SERVER_ERROR",
                message="服务器内部错误",
                request_id=request_id,
            )
        finally:
            logger.info(
                "request_complete",
                extra={
                    "request_id": request_id,
                    "method": scope["method"],
                    "path": scope["path"],
                    "status": status_code,
                    "duration_ms": round((perf_counter() - started) * 1000, 2),
                },
            )

    async def _read_request(
        self,
        receive: Receive,
        limit: int,
    ) -> tuple[list[Message], bool]:
        messages: list[Message] = []
        byte_count = 0
        while True:
            message = await receive()
            messages.append(message)
            if message["type"] != "http.request":
                return messages, False

            byte_count += len(message.get("body", b""))
            if byte_count > limit:
                return messages, True
            if not message.get("more_body", False):
                return messages, False


def _accepted_request_id(value: str | None) -> str | None:
    if value is None or not 1 <= len(value) <= 100:
        return None
    if any(not 0x21 <= ord(character) <= 0x7E for character in value):
        return None
    return value


async def _send_problem(
    scope: Scope,
    receive: Receive,
    send: Send,
    *,
    status_code: int,
    code: str,
    message: str,
    request_id: str,
) -> None:
    response = JSONResponse(
        status_code=status_code,
        content={
            "error": {
                "code": code,
                "message": message,
                "request_id": request_id,
            }
        },
    )
    response_app = cast(Callable[[Scope, Receive, Send], Awaitable[None]], response)
    await response_app(scope, receive, send)
