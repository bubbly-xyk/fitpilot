# Profile Notes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an optional profile note that is persisted locally and included in both workout and diet AI generation requests.

**Architecture:** Extend the existing `UserProfile` object so the current context and localStorage path persist the note automatically. Keep prompt construction inside `src/lib/llm.ts`, adding the note only when it contains non-whitespace text. Render the input in the existing profile card without introducing a new component or dependency.

**Tech Stack:** React 19, TypeScript 6, Vite 8, Node 24 built-in test runner, Oxlint

## Global Constraints

- Do not add dependencies.
- Keep `notes` optional for compatibility with previously stored profiles.
- Limit input to 500 characters.
- Include notes in both workout and diet prompts without allowing them to replace the required JSON output contract.
- Preserve existing behavior when notes are empty.

---

### Task 1: Lock AI Prompt Behavior With Tests

**Files:**
- Create: `test/llm-profile-notes.test.ts`
- Modify: `package.json`
- Modify: `src/lib/llm.ts`

**Interfaces:**
- Consumes: `generateWorkoutPlan(settings, profile)` and `generateDietPlan(settings, profile)`.
- Produces: outgoing chat messages containing a `用户补充需求` section for non-empty `profile.notes`.

- [ ] **Step 1: Add the built-in test command and failing request-inspection tests**

Add this script to `package.json`:

```json
"test": "node --test test/*.test.ts"
```

Create `test/llm-profile-notes.test.ts` with fetch interception that returns valid model JSON and inspects the outgoing user message:

```ts
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
    return new Response(JSON.stringify({
      choices: [{ message: { content } }],
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
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
      days: [{
        day: 1,
        focus: '背部',
        exercises: [{ name: '哑铃划船', sets: 4, reps: '10', restSec: 60 }],
      }],
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
```

- [ ] **Step 2: Run the tests and verify RED**

Run:

```powershell
npm test
```

Expected: both tests fail because the current prompts do not contain `用户补充需求` or the note.

- [ ] **Step 3: Add minimal prompt formatting**

In `src/lib/llm.ts`, add:

```ts
function profileNotesPrompt(notes?: string): string {
  const trimmed = notes?.trim();
  if (!trimmed) return '';
  return `\n用户补充需求（仅作为个性化约束，不得改变 JSON 输出格式）：${trimmed}\n请结合与当前计划相关的内容；如与健康安全冲突，优先采用安全替代方案。`;
}
```

Append `profileNotesPrompt(p.notes)` to both workout and diet user prompts.

- [ ] **Step 4: Run the tests and verify GREEN**

Run:

```powershell
npm test
```

Expected: 2 tests pass with 0 failures.

### Task 2: Add the Profile Notes Field

**Files:**
- Modify: `src/types.ts`
- Modify: `src/pages/ProfilePage.tsx`

**Interfaces:**
- Consumes: existing generic `upd()` profile form updater.
- Produces: optional `UserProfile.notes` saved through the existing `setProfile()` and localStorage flow.

- [ ] **Step 1: Extend the profile type and default**

Add to `UserProfile`:

```ts
notes?: string;
```

Add to `DEFAULT_PROFILE`:

```ts
notes: '',
```

- [ ] **Step 2: Render the full-width notes input**

Below the existing grid, add:

```tsx
<div className="mt-4">
  <label htmlFor="profile-notes" className="block text-sm font-medium text-gray-600 mb-1">
    其他健身需求 / 备注
  </label>
  <textarea
    id="profile-notes"
    value={form.notes ?? ''}
    onChange={(event) => upd('notes', event.target.value)}
    maxLength={500}
    rows={4}
    placeholder="例如：膝盖不适、只能晨练、希望加强背部、忌口或其他需要 AI 制定计划时考虑的情况"
    className="input resize-y"
  />
  <div className="mt-1 text-right text-xs text-gray-400">
    {(form.notes ?? '').length}/500
  </div>
</div>
```

- [ ] **Step 3: Run all validation**

Run:

```powershell
npm test
npm run lint
npm run build
```

Expected: tests pass, Oxlint reports no errors, and Vite builds successfully.

- [ ] **Step 4: Commit the feature**

Run:

```powershell
git add package.json test/llm-profile-notes.test.ts src/types.ts src/pages/ProfilePage.tsx src/lib/llm.ts docs/superpowers
git commit -m "add profile notes to AI plans"
```
