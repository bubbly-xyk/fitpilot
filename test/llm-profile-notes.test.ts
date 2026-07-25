import assert from 'node:assert/strict';
import test from 'node:test';
import {
  generateDietPlan,
  generateWorkoutPlan,
  recognizeFood,
} from '../src/lib/llm.ts';
import type { UserProfile } from '../src/types.ts';

const profile: UserProfile = {
  gender: 'male',
  heightCm: 175,
  weightKg: 75,
  age: 28,
  goal: 'fatloss',
  level: 'beginner',
  daysPerWeek: 4,
  equipment: 'dumbbell',
  dietPref: 'none',
  notes: '膝盖不适',
};

test('AI functions call only fixed same-origin business routes', async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input, init = {}) => {
    calls.push({ url: String(input), init });
    const url = String(input);
    const body = url.endsWith('recognize-food')
      ? []
      : url.endsWith('diet-plan')
        ? { id: 'd', createdAt: 1, dailyCalories: 1950, meals: [] }
        : { id: 'w', createdAt: 1, days: [] };
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;

  try {
    await generateWorkoutPlan(profile);
    await generateDietPlan(profile);
    await recognizeFood('data:image/png;base64,eA==');
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(
    calls.map((call) => call.url),
    [
      '/api/v1/ai/workout-plan',
      '/api/v1/ai/diet-plan',
      '/api/v1/ai/recognize-food',
    ],
  );
  for (const call of calls) {
    assert.equal(call.init.credentials, 'include');
    assert.doesNotMatch(
      String(call.init.body),
      /apiKey|baseURL|model|messages|system/i,
    );
  }
  assert.deepEqual(JSON.parse(String(calls[0].init.body)), profile);
});
