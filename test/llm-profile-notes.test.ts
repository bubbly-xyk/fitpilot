import assert from 'node:assert/strict';
import test from 'node:test';
import { generateDietPlan, generateWorkoutPlan } from '../src/lib/llm.ts';
import type { Settings, UserProfile } from '../src/types.ts';

const settings: Settings = {
  apiKey: 'test-key',
  baseURL: 'https://example.test',
  model: 'test-model',
};

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
  notes: '  膝盖不适，希望避免跳跃动作，并加强背部训练。  ',
};

function mockChatResponse(content: string, bodies: string[]) {
  return async (_input: string | URL | Request, init?: RequestInit) => {
    bodies.push(String(init?.body ?? ''));
    return new Response(
      JSON.stringify({
        choices: [{ message: { content } }],
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  };
}

function userPrompt(body: string): string {
  const request = JSON.parse(body) as {
    messages: Array<{ role: string; content: string }>;
  };
  return request.messages.find((message) => message.role === 'user')?.content ?? '';
}

test('workout generation includes trimmed profile notes', async () => {
  const bodies: string[] = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockChatResponse(
    JSON.stringify({
      days: [
        {
          day: 1,
          focus: '背部',
          exercises: [{ name: '哑铃划船', sets: 4, reps: '10', restSec: 60 }],
        },
      ],
    }),
    bodies,
  ) as typeof fetch;

  try {
    await generateWorkoutPlan(settings, profile);
    const prompt = userPrompt(bodies[0]);
    assert.match(prompt, /用户补充需求/);
    assert.match(prompt, /膝盖不适，希望避免跳跃动作，并加强背部训练。/);
    assert.doesNotMatch(prompt, /  膝盖不适/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('diet generation includes profile notes', async () => {
  const bodies: string[] = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockChatResponse(
    JSON.stringify({
      dailyCalories: 2000,
      meals: [{ name: '早餐', items: [] }],
    }),
    bodies,
  ) as typeof fetch;

  try {
    await generateDietPlan(settings, profile);
    const prompt = userPrompt(bodies[0]);
    assert.match(prompt, /用户补充需求/);
    assert.match(prompt, /膝盖不适，希望避免跳跃动作，并加强背部训练。/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('empty, whitespace-only, and absent notes keep the workout prompt unchanged', async () => {
  const bodies: string[] = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockChatResponse(
    JSON.stringify({
      days: [
        {
          day: 1,
          focus: '全身',
          exercises: [{ name: '深蹲', sets: 4, reps: '10', restSec: 60 }],
        },
      ],
    }),
    bodies,
  ) as typeof fetch;

  const profileWithoutNotes = { ...profile };
  delete profileWithoutNotes.notes;

  try {
    await generateWorkoutPlan(settings, profileWithoutNotes);
    await generateWorkoutPlan(settings, { ...profile, notes: '' });
    await generateWorkoutPlan(settings, { ...profile, notes: '   ' });

    const prompts = bodies.map(userPrompt);
    assert.equal(prompts[1], prompts[0]);
    assert.equal(prompts[2], prompts[0]);
    assert.doesNotMatch(prompts[0], /用户补充需求/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
