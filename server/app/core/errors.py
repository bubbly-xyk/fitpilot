from typing import Any

from fastapi import Request
from fastapi.responses import JSONResponse


class ApiProblem(Exception):
    def __init__(self, status_code: int, code: str, message: str) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.message = message


def error_response(
    *,
    status_code: int,
    code: str,
    message: str,
    request_id: str,
) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "error": {
                "code": code,
                "message": message,
                "request_id": request_id,
            }
        },
    )


def _request_id(request: Request) -> str:
    request_id: Any = getattr(request.state, "request_id", "")
    return request_id if isinstance(request_id, str) else ""


async def api_problem_handler(
    request: Request,
    exc: Exception,
) -> JSONResponse:
    if not isinstance(exc, ApiProblem):
        return await unhandled_error_handler(request, exc)
    return error_response(
        status_code=exc.status_code,
        code=exc.code,
        message=exc.message,
        request_id=_request_id(request),
    )


async def validation_error_handler(
    request: Request,
    exc: Exception,
) -> JSONResponse:
    del exc
    return error_response(
        status_code=422,
        code="VALIDATION_ERROR",
        message="请求参数无效",
        request_id=_request_id(request),
    )


async def unhandled_error_handler(
    request: Request,
    exc: Exception,
) -> JSONResponse:
    del exc
    return error_response(
        status_code=500,
        code="INTERNAL_SERVER_ERROR",
        message="服务器内部错误",
        request_id=_request_id(request),
    )
