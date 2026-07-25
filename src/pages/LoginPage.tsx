import { useState } from 'react';
import { login } from '../lib/api';

export default function LoginPage({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(password);
      setPassword('');
      onSuccess();
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-dvh grid place-items-center bg-gray-50 px-4">
      <form
        onSubmit={(event) => void submit(event)}
        className="w-full max-w-sm rounded-2xl bg-white border border-gray-200 p-6 shadow-sm"
      >
        <h1 className="text-2xl font-bold text-gray-900">进入 FitPilot</h1>
        <p className="mt-2 text-sm text-gray-500">请输入演示访问密码</p>
        <input
          autoFocus
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="input mt-5"
          autoComplete="current-password"
          required
        />
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button className="btn-primary mt-5 w-full" disabled={loading}>
          {loading ? '验证中...' : '进入'}
        </button>
      </form>
    </main>
  );
}

