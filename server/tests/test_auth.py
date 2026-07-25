from http.cookies import SimpleCookie

import httpx
from conftest import TEST_ENV

ORIGIN_HEADERS = {"Origin": TEST_ENV["ALLOWED_ORIGIN"]}


async def test_login_sets_hardened_cookie(client: httpx.AsyncClient) -> None:
    response = await client.post(
        "/api/v1/auth/login",
        json={"password": TEST_ENV["DEMO_ACCESS_PASSWORD"]},
        headers=ORIGIN_HEADERS,
    )

    assert response.status_code == 204
    cookie = response.headers["set-cookie"]
    assert "fitpilot_session=" in cookie
    assert "HttpOnly" in cookie
    assert "SameSite=strict" in cookie
    assert "Path=/api" in cookie
    assert "Secure" not in cookie


async def test_bad_password_uses_uniform_error(client: httpx.AsyncClient) -> None:
    response = await client.post(
        "/api/v1/auth/login",
        json={"password": "wrong-password"},
        headers=ORIGIN_HEADERS,
    )

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "INVALID_CREDENTIALS"
    assert "password" not in response.text.lower()


async def test_sixth_failed_login_from_same_ip_is_rate_limited(
    client: httpx.AsyncClient,
) -> None:
    for _ in range(5):
        response = await client.post(
            "/api/v1/auth/login",
            json={"password": "wrong-password"},
            headers=ORIGIN_HEADERS,
        )
        assert response.status_code == 401

    response = await client.post(
        "/api/v1/auth/login",
        json={"password": "wrong-password"},
        headers=ORIGIN_HEADERS,
    )
    assert response.status_code == 429
    assert response.json()["error"]["code"] == "RATE_LIMITED"


async def test_session_rejects_missing_and_tampered_cookie(
    client: httpx.AsyncClient,
) -> None:
    missing = await client.get("/api/v1/auth/session")
    assert missing.status_code == 401
    assert missing.json()["error"]["code"] == "AUTH_REQUIRED"

    client.cookies.set("fitpilot_session", "tampered", path="/api")
    tampered = await client.get("/api/v1/auth/session")
    assert tampered.status_code == 401
    assert tampered.json()["error"]["code"] == "AUTH_REQUIRED"


async def test_login_session_and_logout_round_trip(client: httpx.AsyncClient) -> None:
    login = await client.post(
        "/api/v1/auth/login",
        json={"password": TEST_ENV["DEMO_ACCESS_PASSWORD"]},
        headers=ORIGIN_HEADERS,
    )
    assert login.status_code == 204

    session = await client.get("/api/v1/auth/session")
    assert session.status_code == 200
    assert session.json() == {"authenticated": True}

    logout = await client.post("/api/v1/auth/logout", headers=ORIGIN_HEADERS)
    assert logout.status_code == 204
    parsed = SimpleCookie()
    parsed.load(logout.headers["set-cookie"])
    assert parsed["fitpilot_session"]["max-age"] == "0"

    after_logout = await client.get("/api/v1/auth/session")
    assert after_logout.status_code == 401
