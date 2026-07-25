import asyncio
from collections import defaultdict, deque
from collections.abc import AsyncIterator, Callable
from contextlib import asynccontextmanager
from time import monotonic

from app.core.errors import ApiProblem


class SlidingWindowLimiter:
    def __init__(self, clock: Callable[[], float] = monotonic) -> None:
        self._clock = clock
        self._events: dict[str, deque[float]] = defaultdict(deque)
        self._lock = asyncio.Lock()

    async def check(
        self,
        key: str,
        *,
        limit: int,
        window_seconds: float,
    ) -> None:
        now = self._clock()
        cutoff = now - window_seconds
        async with self._lock:
            events = self._events[key]
            while events and events[0] <= cutoff:
                events.popleft()
            if len(events) >= limit:
                raise ApiProblem(429, "RATE_LIMITED", "请求过于频繁，请稍后再试")
            events.append(now)


class SessionConcurrencyLimiter:
    def __init__(self) -> None:
        self._active: dict[str, int] = {}
        self._lock = asyncio.Lock()

    @asynccontextmanager
    async def slot(
        self,
        session_id: str,
        limit: int = 2,
    ) -> AsyncIterator[None]:
        async with self._lock:
            active = self._active.get(session_id, 0)
            if active >= limit:
                raise ApiProblem(429, "RATE_LIMITED", "请求过于频繁，请稍后再试")
            self._active[session_id] = active + 1
        try:
            yield
        finally:
            async with self._lock:
                remaining = self._active.get(session_id, 1) - 1
                if remaining <= 0:
                    self._active.pop(session_id, None)
                else:
                    self._active[session_id] = remaining

    def active_count(self, session_id: str) -> int:
        return self._active.get(session_id, 0)

