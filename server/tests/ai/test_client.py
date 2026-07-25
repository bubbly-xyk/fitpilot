import httpx
import pytest

from app.ai.client import ModelProvider
from app.core.errors import ApiProblem
from app.core.settings import Settings


def settings(**overrides: object) -> Settings:
    values: dict[str, object] = {
        "allowed_origin": "http://localhost:5173",
        "model_api_key": "server-only-key",
        "model_base_url": "https://provider.example/v1",
        "model_name": "server-model",
        "demo_access_password": "d" * 32,
        "session_secret": "s" * 32,
    }
    values.update(overrides)
    return Settings.model_validate(values)


async def test_provider_uses_only_server_configuration() -> None:
    captured: dict[str, object] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["url"] = str(request.url)
        captured["authorization"] = request.headers["Authorization"]
        captured["body"] = request.read().decode()
        return httpx.Response(
            200,
            json={"choices": [{"message": {"content": '{"days":[]}'}}]},
        )

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        result = await ModelProvider(settings(), client).generate_json(
            [{"role": "user", "content": "safe"}]
        )

    assert result == {"days": []}
    assert captured["url"] == "https://provider.example/v1/chat/completions"
    assert captured["authorization"] == "Bearer server-only-key"
    assert '"model":"server-model"' in str(captured["body"])


async def test_missing_vision_configuration_does_not_fallback() -> None:
    async with httpx.AsyncClient() as client:
        with pytest.raises(ApiProblem) as raised:
            await ModelProvider(settings(), client).generate_json([], vision=True)
    assert raised.value.code == "VISION_MODEL_NOT_CONFIGURED"


@pytest.mark.parametrize(
    ("status", "code"),
    [(401, "MODEL_CONFIGURATION_ERROR"), (429, "MODEL_RATE_LIMITED")],
)
async def test_provider_statuses_are_safely_mapped(status: int, code: str) -> None:
    transport = httpx.MockTransport(lambda request: httpx.Response(status))
    async with httpx.AsyncClient(transport=transport) as client:
        with pytest.raises(ApiProblem) as raised:
            await ModelProvider(settings(), client).generate_json([])
    assert raised.value.code == code


async def test_oversized_and_invalid_responses_are_rejected() -> None:
    responses = [
        httpx.Response(200, content=b"x" * (2 * 1024 * 1024 + 1)),
        httpx.Response(200, json={"choices": []}),
    ]

    def handler(request: httpx.Request) -> httpx.Response:
        del request
        return responses.pop(0)

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        provider = ModelProvider(settings(), client)
        with pytest.raises(ApiProblem) as oversized:
            await provider.generate_json([])
        with pytest.raises(ApiProblem) as invalid:
            await provider.generate_json([])
    assert oversized.value.code == "MODEL_RESPONSE_TOO_LARGE"
    assert invalid.value.code == "MODEL_INVALID_RESPONSE"
