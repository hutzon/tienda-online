'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { StorefrontContainer } from '@/components/storefront/StorefrontContainer';
import { getCheckoutSession, CheckoutSessionDetailResponse } from '@/lib/api/commerce';

export default function CheckoutSuccessPage({ params }: { params: { sessionId: string } }) {
  const sessionId = params.sessionId;
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
    return <StorefrontContainer><p style={{ padding: '2rem' }}>Cargando confirmación...</p></StorefrontContainer>;
  }

  if (!session) {
    return <StorefrontContainer><p style={{ padding: '2rem' }}>No se pudo cargar la confirmación.</p></StorefrontContainer>;
  }

  const order = session.order;
  const isPaid = order.status === 'Confirmed';

  return (
    <StorefrontContainer className="section-stack">
      <section className="section-shell">
        <div style={{ textAlign: 'center', padding: '4rem 1rem', background: '#f5f5f5', borderRadius: '8px' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
          <h1>¡Gracias por tu compra!</h1>
          <p style={{ fontSize: '1.25rem', marginTop: '1rem', color: '#666' }}>
            Tu pedido <strong>{order.orderNumber}</strong> ha sido confirmado.
          </p>
          
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '8px', maxWidth: '500px', margin: '2rem auto', textAlign: 'left', border: '1px solid #ddd' }}>
            <h3>Detalles del Pedido</h3>
            <p style={{ marginTop: '1rem' }}><strong>Estado:</strong> {order.status}</p>
            <p><strong>Total:</strong> {order.currency} {order.total.toFixed(2)}</p>
            <p><strong>Enviando a:</strong> {order.customerName}</p>
            <p><strong>Dirección:</strong> {order.address}</p>
            <p><strong>Contacto:</strong> {order.customerEmail} / {order.phone}</p>
            <hr style={{ border: 'none', borderTop: '1px solid #ddd', margin: '1rem 0' }} />
            <h4>Documento Fiscal</h4>
            {order.invoices && order.invoices.length > 0 ? (
              <div style={{ marginTop: '0.5rem' }}>
                <p><strong>Estado:</strong> {order.invoices[0].status}</p>
                {order.invoices[0].uuid && <p><strong>UUID:</strong> {order.invoices[0].uuid}</p>}
              </div>
            ) : (
              <p style={{ marginTop: '0.5rem', color: '#666' }}>Tu documento de facturación está pendiente de emisión.</p>
            )}
          </div>

          <div style={{ marginTop: '2rem' }}>
            <Link href="/" className="btn-primary">
              Volver al inicio
            </Link>
          </div>
        </div>
      </section>
    </StorefrontContainer>
  );
}
