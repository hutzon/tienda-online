'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { StorefrontContainer } from '@/components/storefront/StorefrontContainer';
import { trackOrder, OrderTrackingResponse } from '@/lib/api/commerce';
import { StorefrontApiError } from '@/lib/api/client';

const ORDER_STATUS_LABELS: Record<string, string> = {
  Confirmed:      'Confirmado',
  PendingPayment: 'Pago pendiente',
  Cancelled:      'Cancelado',
};

const ORDER_STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  Confirmed:      { bg: 'var(--accent-soft)', color: 'var(--accent)' },
  PendingPayment: { bg: '#fff3e0', color: '#e65100' },
  Cancelled:      { bg: '#ffebee', color: '#c62828' },
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CashOnDelivery:   'Contra entrega',
  OnlineSimulated:  'Pago en línea',
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  Paid:    'Pagado',
  Pending: 'Pendiente',
  Failed:  'Rechazado',
};

function TrackPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [inputValue, setInputValue] = useState(searchParams.get('numero') ?? '');
  const [result, setResult] = useState<OrderTrackingResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  // Auto-search if numero param is present in URL
  useEffect(() => {
    const numero = searchParams.get('numero');
    if (numero && numero.trim()) {
      handleSearch(numero.trim());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = async (numero?: string) => {
    const query = (numero ?? inputValue).trim().toUpperCase();
    if (!query) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setSearched(true);
    try {
      const data = await trackOrder(query);
      setResult(data);
      router.replace(`/track?numero=${encodeURIComponent(query)}`, { scroll: false });
    } catch (err) {
      if (err instanceof StorefrontApiError && err.status === 404) {
        setError('No encontramos un pedido con ese número. Verifica que lo escribiste correctamente.');
      } else {
        setError('Ocurrió un error al consultar el pedido. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const statusStyle = result ? (ORDER_STATUS_COLORS[result.status] ?? { bg: '#eee', color: '#555' }) : null;
  const statusLabel = result ? (ORDER_STATUS_LABELS[result.status] ?? result.status) : null;

  return (
    <StorefrontContainer className="section-stack" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <section className="section-shell">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Tienda Online</span>
            <h1>Seguimiento de pedido</h1>
            <p style={{ color: 'var(--muted)', marginTop: '0.25rem' }}>
              Ingresa el número de pedido que recibiste en tu confirmación de compra.
            </p>
          </div>
        </div>

        <div className="track-search-box">
          <div className="track-search-row">
            <input
              type="text"
              className="form-input track-search-input"
              placeholder="Ej. ORD-20260515021719-A5022F"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
              disabled={loading}
              aria-label="Número de pedido"
            />
            <button
              onClick={() => handleSearch()}
              disabled={loading || !inputValue.trim()}
              className="btn-primary track-search-btn"
              style={{ border: 'none', cursor: loading ? 'wait' : 'pointer' }}
            >
              {loading ? 'Buscando…' : 'Consultar'}
            </button>
          </div>
        </div>

        {error && (
          <div className="track-error">
            <p>{error}</p>
          </div>
        )}

        {result && (
          <div className="track-result">
            <div className="track-result-header">
              <div>
                <p className="track-order-number">{result.orderNumber}</p>
                <p className="track-order-date">
                  Pedido realizado el {new Date(result.createdAt).toLocaleDateString('es-GT', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </p>
              </div>
              {statusStyle && (
                <span className="track-status-badge" style={{ background: statusStyle.bg, color: statusStyle.color }}>
                  {statusLabel}
                </span>
              )}
            </div>

            <div className="track-timeline">
              <div className={`track-step ${['Confirmed', 'PendingPayment', 'Cancelled'].includes(result.status) ? 'track-step--done' : ''}`}>
                <span className="track-step-dot" />
                <div>
                  <strong>Pedido recibido</strong>
                  <p>Tu pedido fue registrado en nuestro sistema.</p>
                </div>
              </div>
              <div className={`track-step ${result.status === 'Confirmed' ? 'track-step--done' : result.status === 'PendingPayment' ? 'track-step--active' : ''}`}>
                <span className="track-step-dot" />
                <div>
                  <strong>Pago confirmado</strong>
                  <p>
                    {result.status === 'Confirmed'
                      ? `Método: ${PAYMENT_METHOD_LABELS[result.paymentMethod ?? ''] ?? result.paymentMethod ?? '—'} · Estado: ${PAYMENT_STATUS_LABELS[result.paymentStatus ?? ''] ?? result.paymentStatus ?? '—'}`
                      : result.status === 'PendingPayment'
                      ? 'En espera de confirmación de pago.'
                      : '—'}
                  </p>
                </div>
              </div>
              <div className={`track-step ${result.status === 'Confirmed' ? 'track-step--active' : ''}`}>
                <span className="track-step-dot" />
                <div>
                  <strong>En preparación</strong>
                  <p>{result.status === 'Confirmed' ? 'Tu pedido está siendo preparado para envío.' : '—'}</p>
                </div>
              </div>
              <div className="track-step">
                <span className="track-step-dot" />
                <div>
                  <strong>En camino</strong>
                  <p>Tu pedido está en camino a tu dirección.</p>
                </div>
              </div>
              <div className="track-step">
                <span className="track-step-dot" />
                <div>
                  <strong>Entregado</strong>
                  <p>El pedido fue entregado.</p>
                </div>
              </div>
            </div>

            <div className="track-items">
              <h3>Productos</h3>
              <table className="track-items-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th style={{ textAlign: 'center' }}>Cant.</th>
                    <th style={{ textAlign: 'right' }}>Precio u.</th>
                    <th style={{ textAlign: 'right' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {result.items.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.productName}</td>
                      <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ textAlign: 'right' }}>{result.currency} {item.unitPrice.toFixed(2)}</td>
                      <td style={{ textAlign: 'right' }}>{result.currency} {item.lineTotal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'right', fontWeight: 700 }}>Total</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>{result.currency} {result.total.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="hero-actions" style={{ justifyContent: 'center', marginTop: '2rem' }}>
              <Link href="/catalog" className="btn-primary">Seguir comprando</Link>
              <Link href="/" className="btn-secondary">Volver al inicio</Link>
            </div>
          </div>
        )}

        {!result && !error && !loading && !searched && (
          <div className="track-hint">
            <p>El número de pedido aparece en la pantalla de confirmación de compra, con el formato <strong>ORD-XXXXXXXXXXXXXXXX</strong>.</p>
          </div>
        )}
      </section>
    </StorefrontContainer>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={
      <StorefrontContainer className="section-stack" style={{ paddingTop: '2rem' }}>
        <div className="loading-screen"><div className="loading-card"><p>Cargando…</p></div></div>
      </StorefrontContainer>
    }>
      <TrackPageInner />
    </Suspense>
  );
}
