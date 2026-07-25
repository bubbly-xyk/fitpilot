import asyncio
import json
from typing import Any

import httpx

from app.ai.prompts import Message
from app.core.errors import ApiProblem
from app.core.settings import Settings

MAX_RESPONSE_BYTES = 2 * 1024 * 1024


class ModelProvider:
    def __init__(self, settings: Settings, client: httpx.AsyncClient) -> None:
        self._settings = settings
        self._client = client

    async def generate_json(
        self,
        messages: list[Message],
        *,
        vision: bool = False,
    ) -> object:
        base_url, api_key, model = self._configuration(vision)
        body: dict[str, Any] = {
            "model": model,
            "messages": messages,
            "temperature": 0.6,
        }
        if not vision:
            body["response_format"] = {"type": "json_object"}

        try:
            async with asyncio.timeout(45):
                async with self._client.stream(
                    "POST",
                    f"{base_url.rstrip('/')}/chat/completions",
                    headers={"Authorization": f"Bearer {api_key}"},
                    json=body,
                    timeout=httpx.Timeout(45.0),
                    follow_redirects=False,
                ) as response:
                    self._raise_for_status(response.status_code)
                    content = await self._bounded_body(response)
        except ApiProblem:
            raise
        except (TimeoutError, httpx.TimeoutException, httpx.NetworkError) as exc:
            raise ApiProblem(503, "MODEL_UNAVAILABLE", "AI 服务暂时不可用") from exc

        try:
            envelope = json.loads(content)
            text = envelope["choices"][0]["message"]["content"]
            if not isinstance(text, str) or not text.strip():
                raise ValueError
            cleaned = text.replace("```json", "").replace("```", "").strip()
            return json.loads(cleaned)
        except (
            KeyError,
            IndexError,
            TypeError,
            ValueError,
            json.JSONDecodeError,
        ) as exc:
            raise ApiProblem(502, "MODEL_INVALID_RESPONSE", "AI 返回内容无效") from exc

    def _configuration(self, vision: bool) -> tuple[str, str, str]:
        if vision:
            if (
                self._settings.vision_model_base_url is None
                or self._settings.vision_model_api_key is None
                or self._settings.vision_model_name is None
            ):
                raise ApiProblem(
                    503,
                    "VISION_MODEL_NOT_CONFIGURED",
                    "未配置视觉模型",
                )
            return (
                str(self._settings.vision_model_base_url),
                self._settings.vision_model_api_key.get_secret_value(),
                self._settings.vision_model_name,
            )
        return (
            str(self._settings.model_base_url),
            self._settings.model_api_key.get_secret_value(),
            self._settings.model_name,
        )

    @staticmethod
    def _raise_for_status(status_code: int) -> None:
        if status_code < 400:
            return
        if status_code in {401, 403}:
            raise ApiProblem(
                503,
                "MODEL_CONFIGURATION_ERROR",
                "AI 服务配置错误",
            )
        if status_code == 429:
            raise ApiProblem(503, "MODEL_RATE_LIMITED", "AI 服务繁忙，请稍后再试")
        raise ApiProblem(503, "MODEL_UNAVAILABLE", "AI 服务暂时不可用")

    @staticmethod
    async def _bounded_body(response: httpx.Response) -> bytes:
        body = bytearray()
        async for chunk in response.aiter_bytes():
            body.extend(chunk)
            if len(body) > MAX_RESPONSE_BYTES:
                raise ApiProblem(
                    502,
                    "MODEL_RESPONSE_TOO_LARGE",
                    "AI 返回内容过大",
                )
        return bytes(body)
