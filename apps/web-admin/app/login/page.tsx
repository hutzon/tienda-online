import { Suspense } from 'react';
import { LoginView } from './LoginView';

function LoginFallback() {
  return (
    <div className="login-card">
      <div className="login-logo">
        <span className="login-eyebrow">Dev · Solo entorno local</span>
        <h1>TiendaOnline Admin</h1>
        <p>Cargando acceso de desarrollo…</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="login-root">
      <Suspense fallback={<LoginFallback />}>
        <LoginView />
      </Suspense>
    </main>
  );
}
