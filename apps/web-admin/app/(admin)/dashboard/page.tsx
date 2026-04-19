'use client';

import { useEffect, useState } from 'react';
import { getSystemInfo, pingAdmin, type SystemInfo } from '@/lib/api/system';
import { ApiError } from '@/lib/api/client';

type Status = 'idle' | 'loading' | 'ok' | 'error';

interface ApiState<T> {
  status: Status;
  data: T | null;
  error: string | null;
}

function initialState<T>(): ApiState<T> {
  return { status: 'idle', data: null, error: null };
}

export default function DashboardPage() {
  const [sysInfo, setSysInfo] = useState<ApiState<SystemInfo>>(initialState());
  const [ping, setPing] = useState<ApiState<{ message: string }>>(initialState());

  useEffect(() => {
    setSysInfo(s => ({ ...s, status: 'loading' }));
    getSystemInfo()
      .then(data => setSysInfo({ status: 'ok', data, error: null }))
      .catch(err => setSysInfo({ status: 'error', data: null, error: String(err) }));

    setPing(s => ({ ...s, status: 'loading' }));
    pingAdmin()
      .then(data => setPing({ status: 'ok', data, error: null }))
      .catch(err => {
        const msg = err instanceof ApiError
          ? `HTTP ${err.status} — ${err.message}`
          : String(err);
        setPing({ status: 'error', data: null, error: msg });
      });
  }, []);

  const appEnv = process.env.NEXT_PUBLIC_APP_ENV ?? 'local';
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

  return (
    <div className="page-dashboard">
      <section className="dash-section">
        <h3 className="section-title">Proyecto</h3>
        <div className="card-grid">
          <div className="info-card">
            <dt>Proyecto</dt>
            <dd>TiendaOnline Admin</dd>
          </div>
          <div className="info-card">
            <dt>Entorno local</dt>
            <dd>{appEnv}</dd>
          </div>
          <div className="info-card">
            <dt>API base</dt>
            <dd className="mono">{apiBase}</dd>
          </div>
        </div>
      </section>

      <section className="dash-section">
        <h3 className="section-title">API — /api/v1/system/info</h3>
        <StatusBlock status={sysInfo.status} error={sysInfo.error}>
          {sysInfo.data && (
            <div className="card-grid">
              <div className="info-card">
                <dt>Nombre</dt>
                <dd>{sysInfo.data.name}</dd>
              </div>
              <div className="info-card">
                <dt>Versión</dt>
                <dd>{sysInfo.data.version}</dd>
              </div>
              <div className="info-card">
                <dt>Entorno API</dt>
                <dd>{sysInfo.data.environment}</dd>
              </div>
              <div className="info-card">
                <dt>Timestamp</dt>
                <dd className="mono">{new Date(sysInfo.data.timestamp).toLocaleString('es-GT')}</dd>
              </div>
            </div>
          )}
        </StatusBlock>
      </section>

      <section className="dash-section">
        <h3 className="section-title">Auth — /api/v1/admin/ping</h3>
        <StatusBlock status={ping.status} error={ping.error}>
          {ping.data && (
            <div className="card-grid">
              <div className="info-card info-card--success">
                <dt>Resultado</dt>
                <dd>{ping.data.message}</dd>
              </div>
            </div>
          )}
        </StatusBlock>
      </section>
    </div>
  );
}

function StatusBlock({
  status,
  error,
  children,
}: {
  status: Status;
  error: string | null;
  children: React.ReactNode;
}) {
  if (status === 'loading' || status === 'idle') {
    return <div className="status-loading">Cargando…</div>;
  }
  if (status === 'error') {
    return <div className="status-error">{error}</div>;
  }
  return <>{children}</>;
}
