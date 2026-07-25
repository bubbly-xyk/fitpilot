import base64
from collections.abc import AsyncIterator

import httpx
import pytest
from conftest import TEST_ENV

from app.ai.router import get_model_provider
from app.main import create_app

ORIGIN = {"Origin": TEST_ENV["ALLOWED_ORIGIN"]}


class StubProvider:
    def __init__(self, result: object) -> None:
        self.result = result
        self.vision_calls: list[bool] = []

    async def generate_json(
        self,
        messages: list[dict[str, object]],
        *,
        vision: bool = False,
    ) -> object:
        del messages
        self.vision_calls.append(vision)
        return self.result


@pytest.fixture
async def routed_client() -> AsyncIterator[tuple[httpx.AsyncClient, StubProvider]]:
    app = create_app()
    provider = StubProvider(
        {
            "days": [
                {
                    "day": 1,
                    "focus": "全身",
                    "exercises": [
                        {
                            "name": "深蹲",
                            "sets": 4,
                            "reps": "10",
                            "restSec": 60,
                        }
                    ],
                }
            ]
        }
    )
    app.dependency_overrides[get_model_provider] = lambda: provider
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app),
        base_url="http://testserver",
    ) as client:
        await client.post(
            "/api/v1/auth/login",
            json={"password": TEST_ENV["DEMO_ACCESS_PASSWORD"]},
            headers=ORIGIN,
        )
        yield client, provider


def profile() -> dict[str, object]:
    return {
        "gender": "male",
        "heightCm": 175,
        "weightKg": 75,
        "age": 28,
        "goal": "fatloss",
        "level": "beginner",
        "daysPerWeek": 4,
        "equipment": "dumbbell",
        "dietPref": "none",
    }


async def test_workout_route_returns_server_metadata(
    routed_client: tuple[httpx.AsyncClient, StubProvider],
) -> None:
    client, _ = routed_client
    response = await client.post(
        "/api/v1/ai/workout-plan",
        json=profile(),
        headers=ORIGIN,
    )
    assert response.status_code == 200
    assert response.json()["id"]
    assert isinstance(response.json()["createdAt"], int)
    assert response.json()["days"][0]["exercises"][0]["restSec"] == 60


async def test_route_rejects_auth_and_provider_controls(
    routed_client: tuple[httpx.AsyncClient, StubProvider],
) -> None:
    client, _ = routed_client
    client.cookies.clear()
    unauthenticated = await client.post(
        "/api/v1/ai/workout-plan",
        json=profile(),
        headers=ORIGIN,
    )
    assert unauthenticated.status_code == 401

    await client.post(
        "/api/v1/auth/login",
        json={"password": TEST_ENV["DEMO_ACCESS_PASSWORD"]},
        headers=ORIGIN,
    )
    controlled = await client.post(
        "/api/v1/ai/workout-plan",
        json={**profile(), "model": "attacker-model"},
        headers=ORIGIN,
    )
    assert controlled.status_code == 422


async def test_recognize_food_uses_vision_and_allows_image_sized_body(
    routed_client: tuple[httpx.AsyncClient, StubProvider],
) -> None:
    client, provider = routed_client
    provider.result = []
    image = "data:image/png;base64," + base64.b64encode(b"x" * 70_000).decode()
    response = await client.post(
        "/api/v1/ai/recognize-food",
        json={"imageDataUrl": image},
        headers=ORIGIN,
    )
    assert response.status_code == 200
    assert response.json() == []
    assert provider.vision_calls[-1] is True


async def test_invalid_model_output_is_safely_mapped(
    routed_client: tuple[httpx.AsyncClient, StubProvider],
) -> None:
    client, provider = routed_client
    provider.result = {"days": "invalid"}
    response = await client.post(
        "/api/v1/ai/workout-plan",
        json=profile(),
        headers=ORIGIN,
    )
    assert response.status_code == 502
    assert response.json()["error"]["code"] == "MODEL_INVALID_RESPONSE"


async def test_eleventh_ai_request_for_session_is_limited(
    routed_client: tuple[httpx.AsyncClient, StubProvider],
) -> None:
    client, _ = routed_client
    for _ in range(10):
        response = await client.post(
            "/api/v1/ai/workout-plan",
            json=profile(),
            headers=ORIGIN,
        )
        assert response.status_code == 200
    limited = await client.post(
        "/api/v1/ai/workout-plan",
        json=profile(),
        headers=ORIGIN,
    )
    assert limited.status_code == 429
    assert limited.json()["error"]["code"] == "RATE_LIMITED"
