from time import time
from typing import Annotated
from uuid import uuid4

import httpx
from fastapi import APIRouter, Depends, Request
from pydantic import ValidationError

from app.ai.client import ModelProvider
from app.ai.prompts import diet_messages, food_messages, workout_messages
from app.ai.schemas import (
    DietPayload,
    DietPlan,
    FoodItems,
    RecognizeFoodRequest,
    UserProfile,
    WorkoutPayload,
    WorkoutPlan,
)
from app.auth.rate_limit import SessionConcurrencyLimiter, SlidingWindowLimiter
from app.auth.session import SessionClaims, require_session
from app.core.errors import ApiProblem
from app.core.settings import Settings, get_settings


def get_model_provider(
    request: Request,
    settings: Annotated[Settings, Depends(get_settings)],
) -> ModelProvider:
    client = getattr(request.app.state, "model_client", None)
    if not isinstance(client, httpx.AsyncClient):
        raise ApiProblem(503, "MODEL_UNAVAILABLE", "AI 服务暂时不可用")
    return ModelProvider(settings, client)


def create_ai_router() -> APIRouter:
    router = APIRouter(prefix="/api/v1/ai", tags=["ai"])
    requests = SlidingWindowLimiter()
    concurrency = SessionConcurrencyLimiter()

    async def authorize(
        request: Request,
        claims: Annotated[SessionClaims, Depends(require_session)],
    ) -> SessionClaims:
        client_ip = request.client.host if request.client is not None else "unknown"
        await requests.check(f"ip:{client_ip}", limit=10, window_seconds=60)
        await requests.check(
            f"session:{claims.session_id}",
            limit=10,
            window_seconds=60,
        )
        return claims

    @router.post("/workout-plan")
    async def workout_plan(
        profile: UserProfile,
        claims: Annotated[SessionClaims, Depends(authorize)],
        provider: Annotated[ModelProvider, Depends(get_model_provider)],
    ) -> dict[str, object]:
        async with concurrency.slot(claims.session_id):
            raw = await provider.generate_json(workout_messages(profile))
        try:
            payload = WorkoutPayload.model_validate(raw)
        except ValidationError as exc:
            raise _invalid_model_response(exc) from exc
        plan = WorkoutPlan(
            id=str(uuid4()),
            created_at=int(time() * 1000),
            days=payload.days,
        )
        return plan.model_dump(by_alias=True)

    @router.post("/diet-plan")
    async def diet_plan(
        profile: UserProfile,
        claims: Annotated[SessionClaims, Depends(authorize)],
        provider: Annotated[ModelProvider, Depends(get_model_provider)],
    ) -> dict[str, object]:
        async with concurrency.slot(claims.session_id):
            raw = await provider.generate_json(diet_messages(profile))
        try:
            payload = DietPayload.model_validate(raw)
        except ValidationError as exc:
            raise _invalid_model_response(exc) from exc
        plan = DietPlan(
            id=str(uuid4()),
            created_at=int(time() * 1000),
            daily_calories=payload.daily_calories,
            meals=payload.meals,
        )
        return plan.model_dump(by_alias=True)

    @router.post("/recognize-food")
    async def recognize_food(
        payload: RecognizeFoodRequest,
        claims: Annotated[SessionClaims, Depends(authorize)],
        provider: Annotated[ModelProvider, Depends(get_model_provider)],
    ) -> list[dict[str, object]]:
        async with concurrency.slot(claims.session_id):
            raw = await provider.generate_json(
                food_messages(payload.image_data_url),
                vision=True,
            )
        try:
            items = FoodItems.model_validate(raw)
        except ValidationError as exc:
            raise _invalid_model_response(exc) from exc
        return [item.model_dump(by_alias=True) for item in items.root]

    return router


def _invalid_model_response(exc: Exception) -> ApiProblem:
    del exc
    return ApiProblem(502, "MODEL_INVALID_RESPONSE", "AI 返回内容无效")
