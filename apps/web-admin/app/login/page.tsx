'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { requestDevToken } from '@/lib/api/auth';
import { setToken, getToken } from '@/lib/session';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState('admin-dev');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (getToken()) router.replace('/dashboard');
  }, [router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await requestDevToken(username.trim() || 'admin-dev', 'Admin');
      setToken(result.token);
      const next = searchParams.get('next') ?? '/dashboard';
      router.push(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al conectar con la API.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-root">
      <div className="login-card">
        <div className="login-logo">
          <span className="login-eyebrow">Dev · Solo entorno local</span>
          <h1>TiendaOnline Admin</h1>
          <p>Panel administrativo — acceso de desarrollo</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="field">
            <label htmlFor="username">Usuario de desarrollo</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="admin-dev"
              autoComplete="off"
              disabled={loading}
            />
          </div>

          <div className="login-role-note">
            Rol asignado: <strong>Admin</strong>
            <br />
            Conecta con <code>POST /api/v1/auth/dev/token</code>
          </div>

          {error && <div className="login-error">{error}</div>}

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Ingresando…' : 'Ingresar como Admin'}
          </button>
        </form>

        <p className="login-footer">
          Este formulario solo funciona en <strong>Development</strong>.<br />
          No usar credenciales reales.
        </p>
      </div>
    </main>
  );
}
