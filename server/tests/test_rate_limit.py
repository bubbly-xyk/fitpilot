import pytest

from app.auth.rate_limit import SessionConcurrencyLimiter, SlidingWindowLimiter
from app.core.errors import ApiProblem


class FakeClock:
    def __init__(self) -> None:
        self.value = 0.0

    def __call__(self) -> float:
        return self.value


async def test_sliding_window_allows_limit_then_rejects_next() -> None:
    clock = FakeClock()
    limiter = SlidingWindowLimiter(clock=clock)

    for _ in range(5):
        await limiter.check("ip", limit=5, window_seconds=300)

    with pytest.raises(ApiProblem) as raised:
        await limiter.check("ip", limit=5, window_seconds=300)
    assert raised.value.code == "RATE_LIMITED"

    clock.value = 301
    await limiter.check("ip", limit=5, window_seconds=300)


async def test_third_concurrent_session_slot_is_rejected() -> None:
    limiter = SessionConcurrencyLimiter()

    async with limiter.slot("session"), limiter.slot("session"):
        with pytest.raises(ApiProblem) as raised:
            async with limiter.slot("session"):
                raise AssertionError("unreachable")

    assert raised.value.code == "RATE_LIMITED"
    assert limiter.active_count("session") == 0
