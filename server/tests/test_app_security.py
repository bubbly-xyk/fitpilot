import httpx

from app.core.settings import Settings
from app.main import create_app


async def test_live_response_has_request_id_and_security_headers(
    client: httpx.AsyncClient,
) -> None:
    response = await client.get(
        "/health/live",
        headers={"X-Request-Id": "test-request"},
    )

    assert response.status_code == 200
    assert response.headers["X-Request-Id"] == "test-request"
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["Referrer-Policy"] == "no-referrer"
    assert response.headers["X-Frame-Options"] == "DENY"


async def test_oversize_json_is_rejected_before_route(
    client: httpx.AsyncClient,
) -> None:
    response = await client.post(
        "/api/v1/auth/login",
        content=b'{"password":"' + (b"x" * 65536) + b'"}',
        headers={
            "Content-Type": "application/json",
            "Origin": "http://localhost:5173",
        },
    )

    assert response.status_code == 413
    assert response.json()["error"]["code"] == "REQUEST_TOO_LARGE"


async def test_mutating_request_requires_exact_origin(
    client: httpx.AsyncClient,
) -> None:
    response = await client.post(
        "/api/v1/auth/login",
        json={"password": "x" * 32},
        headers={"Origin": "https://evil.example"},
    )

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "ORIGIN_NOT_ALLOWED"


async def test_vercel_runtime_url_is_accepted_as_an_origin() -> None:
    settings = Settings(
        _env_file=None,
        app_env="production",
        vercel_url="fitpilot-preview.vercel.app",
        model_api_key="test-model-api-key",
        model_base_url="https://model.example/v1",
        model_name="test-model",
        demo_access_password="d" * 32,
        session_secret="s" * 32,
    )
    transport = httpx.ASGITransport(app=create_app(settings))

    async with httpx.AsyncClient(
        transport=transport,
        base_url="https://fitpilot-preview.vercel.app",
    ) as vercel_client:
        accepted = await vercel_client.post(
            "/api/v1/auth/login",
            json={"password": "d" * 32},
            headers={"Origin": "https://fitpilot-preview.vercel.app"},
        )
        rejected = await vercel_client.post(
            "/api/v1/auth/login",
            json={"password": "d" * 32},
            headers={"Origin": "https://evil.example"},
        )

    assert accepted.status_code == 204
    assert rejected.status_code == 403
    assert rejected.json()["error"]["code"] == "ORIGIN_NOT_ALLOWED"
