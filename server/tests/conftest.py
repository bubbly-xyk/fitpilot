import os
from collections.abc import AsyncIterator

import httpx
import pytest

TEST_ENV = {
    "APP_ENV": "test",
    "ALLOWED_ORIGIN": "http://localhost:5173",
    "MODEL_API_KEY": "test-model-api-key",
    "MODEL_BASE_URL": "https://model.example/v1",
    "MODEL_NAME": "test-model",
    "DEMO_ACCESS_PASSWORD": "d" * 32,
    "SESSION_SECRET": "s" * 32,
}

os.environ.update(TEST_ENV)


@pytest.fixture
async def client(monkeypatch: pytest.MonkeyPatch) -> AsyncIterator[httpx.AsyncClient]:
    for name, value in TEST_ENV.items():
        monkeypatch.setenv(name, value)

    from app.core.settings import get_settings
    from app.main import create_app

    get_settings.cache_clear()
    transport = httpx.ASGITransport(app=create_app())
    async with httpx.AsyncClient(
        transport=transport,
        base_url="http://testserver",
    ) as test_client:
        yield test_client
    get_settings.cache_clear()
