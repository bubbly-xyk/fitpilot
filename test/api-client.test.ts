import assert from 'node:assert/strict';
import test from 'node:test';
import { ApiError, login } from '../src/lib/api.ts';

test('login sends only the password with cookie credentials', async () => {
  let captured: RequestInit | undefined;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (_input, init) => {
    captured = init;
    return new Response(null, { status: 204 });
  }) as typeof fetch;
  try {
    await login('demo-password');
  } finally {
    globalThis.fetch = originalFetch;
  }
  assert.equal(captured?.credentials, 'include');
  assert.deepEqual(JSON.parse(String(captured?.body)), {
    password: 'demo-password',
  });
});

test('stable server errors become ApiError without raw response leakage', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({
        error: { code: 'RATE_LIMITED', message: '请稍后再试', request_id: 'r' },
      }),
      { status: 429, headers: { 'Content-Type': 'application/json' } },
    )) as typeof fetch;
  try {
    await assert.rejects(
      () => login('secret'),
      (error: unknown) =>
        error instanceof ApiError &&
        error.status === 429 &&
        error.code === 'RATE_LIMITED' &&
        error.message === '请稍后再试',
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
