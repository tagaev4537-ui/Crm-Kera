import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { Button, Input, Spinner } from "../components/ui.jsx";
import { extractErrorMessage } from "../api/client.js";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username.trim(), password);
      const dest = location.state?.from?.pathname || "/";
      navigate(dest, { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err, "Не удалось войти"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4">
      <div className="absolute inset-0 overflow-hidden opacity-[0.06]">
        <BuildingsPattern />
      </div>

      <div className="relative w-full max-w-sm rounded-xl bg-surface p-8 shadow-card">
        <div className="mb-8 flex items-center gap-3">
          <svg width="40" height="40" viewBox="0 0 34 34" fill="none">
            <rect width="34" height="34" rx="9" fill="#C98A3E" />
            <rect x="8" y="16" width="5" height="10" fill="white" />
            <rect x="14.5" y="11" width="5" height="15" fill="white" />
            <rect x="21" y="7" width="5" height="19" fill="white" />
          </svg>
          <div>
            <div className="font-display text-lg font-extrabold leading-none text-ink">КварталCRM</div>
            <div className="mt-1 text-xs text-ink-faint">Вход для сотрудников</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Логин"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="ivanov"
            required
          />
          <Input
            label="Пароль"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••"
            required
          />
          {error && (
            <div className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</div>
          )}
          <Button type="submit" variant="accent" className="w-full" disabled={loading}>
            {loading ? <Spinner className="h-4 w-4 text-white" /> : "Войти"}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-ink-faint">
          Доступ и пароли выдаёт администратор системы
        </p>
      </div>
    </div>
  );
}

function BuildingsPattern() {
  const bars = [40, 70, 55, 90, 45, 65, 80, 50, 75, 60, 95, 40, 70, 55, 85];
  return (
    <svg viewBox="0 0 900 200" preserveAspectRatio="none" className="h-full w-full">
      {bars.map((h, i) => (
        <rect key={i} x={i * 60} y={200 - h * 2} width={44} height={h * 2} fill="white" />
      ))}
    </svg>
  );
}
