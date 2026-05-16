'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { StorefrontContainer } from '@/components/storefront/StorefrontContainer';
import { getCheckoutSession, CheckoutSessionDetailResponse } from '@/lib/api/commerce';

export default function CheckoutSuccessPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const [session, setSession] = useState<CheckoutSessionDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getCheckoutSession(sessionId);
        setSession(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [sessionId]);

  if (loading) {
    return (
      <StorefrontContainer className="section-stack" style={{ paddingTop: '2rem' }}>
        <div className="loading-screen">
          <div className="loading-card">
            <p>Cargando confirmación...</p>
          </div>
        </div>
      </StorefrontContainer>
    );
  }

  if (!session) {
    return (
      <StorefrontContainer className="section-stack" style={{ paddingTop: '2rem' }}>
        <div className="empty-state">
          <h2>No se pudo cargar la confirmación</h2>
          <p>Si realizaste la compra, revisa tu correo para los detalles del pedido.</p>
          <div className="hero-actions" style={{ justifyContent: 'center' }}>
            <Link href="/" className="btn-primary">Volver al inicio</Link>
          </div>
        </div>
      </StorefrontContainer>
    );
  }

  const order = session.order;
  const invoice = order.invoices?.[0];

  return (
    <StorefrontContainer className="section-stack" style={{ paddingTop: '2rem' }}>
      <section className="section-shell">
        <div className="success-section">
          <div className="success-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>

          <span className="eyebrow">Pedido confirmado</span>
          <h1 style={{ margin: '0.75rem 0 0.5rem', fontSize: 'clamp(1.8rem, 4vw, 2.4rem)' }}>
            ¡Gracias por tu compra!
          </h1>
          <p style={{ color: 'var(--muted)', maxWidth: '40ch', margin: '0 auto' }}>
            Tu pedido <strong style={{ color: 'var(--text)' }}>{order.orderNumber}</strong> fue confirmado.
            Te contactaremos pronto con los detalles de entrega.
          </p>

          <div className="success-details">
            <div className="success-detail-row">
              <span>Número de pedido</span>
              <strong>{order.orderNumber}</strong>
            </div>
            <div className="success-detail-row">
              <span>Estado</span>
              <strong>{order.status}</strong>
            </div>
            <div className="success-detail-row">
              <span>Total</span>
              <strong>{order.currency} {order.total.toFixed(2)}</strong>
            </div>
            <div className="success-detail-row">
              <span>Cliente</span>
              <strong>{order.customerName}</strong>
            </div>
            <div className="success-detail-row">
              <span>Correo</span>
              <strong>{order.customerEmail}</strong>
            </div>
            {order.address && (
              <div className="success-detail-row">
                <span>Dirección</span>
                <strong style={{ maxWidth: '55%', textAlign: 'right' }}>{order.address}</strong>
              </div>
            )}
            {invoice && (
              <div className="success-detail-row">
                <span>Documento fiscal</span>
                <strong style={{ color: invoice.status === 'Issued' ? 'var(--accent)' : 'var(--muted)' }}>
                  {invoice.status === 'Issued' ? 'Emitido' : invoice.status}
                </strong>
              </div>
            )}
          </div>

          <div className="hero-actions" style={{ justifyContent: 'center' }}>
            <Link href={`/track?numero=${encodeURIComponent(order.orderNumber)}`} className="btn-primary">
              Ver estado del pedido
            </Link>
            <Link href="/catalog" className="btn-secondary">
              Seguir comprando
            </Link>
          </div>
        </div>
      </section>
    </StorefrontContainer>
  );
}
