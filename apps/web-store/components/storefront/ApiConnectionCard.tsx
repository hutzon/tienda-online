import { getSystemInfoSafe } from '@/lib/api/system';

export async function ApiConnectionCard() {
  const result = await getSystemInfoSafe();

  return (
    <aside className="api-card">
      <span className="eyebrow">Estado de API</span>
      <h2>{result.status === 'online' ? 'Conexión disponible' : 'Conexión pendiente'}</h2>
      <p>{result.message}</p>

      <dl className="status-list">
        <div>
          <dt>Base URL</dt>
          <dd>{result.baseUrl}</dd>
        </div>
        <div>
          <dt>Estado</dt>
          <dd>{result.status}</dd>
        </div>
        {result.info && (
          <>
            <div>
              <dt>Servicio</dt>
              <dd>{result.info.name}</dd>
            </div>
            <div>
              <dt>Entorno</dt>
              <dd>{result.info.environment}</dd>
            </div>
            <div>
              <dt>Versión</dt>
              <dd>{result.info.version}</dd>
            </div>
            <div>
              <dt>Timestamp</dt>
              <dd>{new Date(result.info.timestamp).toLocaleString('es-GT')}</dd>
            </div>
          </>
        )}
      </dl>
    </aside>
  );
}
