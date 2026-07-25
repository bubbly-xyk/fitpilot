export const AUTH_REQUIRED_EVENT = 'fitpilot:auth-required';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(
    status: number,
    code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });
  if (response.status === 401 && typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTH_REQUIRED_EVENT));
  }
  if (!response.ok) {
    let code = 'REQUEST_FAILED';
    let message = '请求失败，请稍后再试';
    try {
      const body = (await response.json()) as {
        error?: { code?: unknown; message?: unknown };
      };
      if (typeof body.error?.code === 'string') code = body.error.code;
      if (typeof body.error?.message === 'string') message = body.error.message;
    } catch {
      // Keep the safe generic error.
    }
    throw new ApiError(response.status, code, message);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const login = (password: string) =>
  apiRequest<void>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ password }),
  });

export const logout = () =>
  apiRequest<void>('/api/v1/auth/logout', { method: 'POST' });

export const getSession = () =>
  apiRequest<{ authenticated: boolean }>('/api/v1/auth/session');
