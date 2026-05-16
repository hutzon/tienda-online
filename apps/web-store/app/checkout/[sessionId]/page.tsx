'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { StorefrontContainer } from '@/components/storefront/StorefrontContainer';
import {
  getCheckoutSession,
  updateCheckoutCustomer,
  selectPaymentMethod,
  simulatePayment,
  CheckoutSessionDetailResponse
} from '@/lib/api/commerce';
import { useCart } from '@/lib/cart/CartContext';

export default function CheckoutPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const router = useRouter();
  const { sessionId } = use(params);
  const { clearCart } = useCart();

  const [session, setSession] = useState<CheckoutSessionDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'OnlineSimulated' | 'CashOnDelivery'>('OnlineSimulated');
  const [paymentAttemptId, setPaymentAttemptId] = useState<string | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await getCheckoutSession(sessionId);
        setSession(data);
        if (data.status === 'Completed') {
          router.push(`/checkout/${sessionId}/success`);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error al cargar la sesión de checkout';
        setError(msg);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [sessionId, router]);

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await updateCheckoutCustomer(sessionId, { customerName, customerEmail, phone, address });
      setStep(2);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar los datos';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentMethodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await selectPaymentMethod(sessionId, { paymentMethod });
      if (paymentMethod === 'CashOnDelivery') {
        clearCart();
        router.push(`/checkout/${sessionId}/success`);
      } else {
        setPaymentAttemptId(res.paymentAttemptId);
        setStep(3);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al seleccionar método de pago';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatePayment = async (success: boolean) => {
    if (!paymentAttemptId) return;
    try {
      setProcessingPayment(true);
      const res = await simulatePayment({ paymentAttemptId, success });
      if (res.paymentStatus === 'Paid') {
        clearCart();
        router.push(`/checkout/${sessionId}/success`);
      } else {
        setError('El pago fue rechazado. Por favor elige otro método o intenta de nuevo.');
        setStep(2);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al procesar el pago';
      setError(msg);
    } finally {
      setProcessingPayment(false);
    }
  };

  if (loading && !session) {
    return (
      <StorefrontContainer className="section-stack" style={{ paddingTop: '2rem' }}>
        <div className="loading-screen">
          <div className="loading-card">
            <p>Cargando checkout...</p>
          </div>
        </div>
      </StorefrontContainer>
    );
  }

  if (error && !session) {
    return (
      <StorefrontContainer className="section-stack" style={{ paddingTop: '2rem' }}>
        <div className="empty-state">
          <h2>Error al cargar el checkout</h2>
          <p>{error}</p>
        </div>
      </StorefrontContainer>
    );
  }

  if (!session) return null;

  const order = session.order;

  return (
    <StorefrontContainer className="section-stack" style={{ paddingTop: '2rem' }}>
      <section className="section-shell">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Checkout seguro</span>
            <h1>Completa tu compra</h1>
          </div>
        </div>

        <div className="checkout-layout">
          <div className="checkout-form-panel">
            {error && (
              <p className="cart-error" style={{ marginBottom: '1rem' }}>{error}</p>
            )}

            {step === 1 && (
              <form onSubmit={handleCustomerSubmit}>
                <h2 className="checkout-step-title">1. Datos de contacto y envío</h2>

                <div className="form-group">
                  <label className="form-label" htmlFor="customerName">Nombre completo</label>
                  <input
                    id="customerName"
                    className="form-input"
                    required
                    type="text"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="Ej. María García López"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="customerEmail">Correo electrónico</label>
                  <input
                    id="customerEmail"
                    className="form-input"
                    required
                    type="email"
                    value={customerEmail}
                    onChange={e => setCustomerEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="phone">Teléfono</label>
                  <input
                    id="phone"
                    className="form-input"
                    required
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="Ej. 5555-1234"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="address">Dirección exacta</label>
                  <textarea
                    id="address"
                    className="form-textarea"
                    required
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Calle, número, colonia, municipio, departamento..."
                    rows={3}
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" disabled={loading} className="btn-primary" style={{ cursor: loading ? 'wait' : 'pointer', border: 'none' }}>
                    {loading ? 'Guardando...' : 'Continuar al pago'}
                  </button>
                </div>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handlePaymentMethodSubmit}>
                <h2 className="checkout-step-title">2. Método de pago</h2>

                <label className="payment-option">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="OnlineSimulated"
                    checked={paymentMethod === 'OnlineSimulated'}
                    onChange={() => setPaymentMethod('OnlineSimulated')}
                  />
                  <div>
                    <strong>Pago en línea</strong>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)' }}>Tarjeta de crédito o débito (simulado)</p>
                  </div>
                </label>

                <label className="payment-option">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="CashOnDelivery"
                    checked={paymentMethod === 'CashOnDelivery'}
                    onChange={() => setPaymentMethod('CashOnDelivery')}
                  />
                  <div>
                    <strong>Contra entrega</strong>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)' }}>Paga en efectivo al recibir tu pedido</p>
                  </div>
                </label>

                <div className="form-actions">
                  <button type="button" onClick={() => setStep(1)} className="btn-secondary" style={{ cursor: 'pointer' }}>
                    Atrás
                  </button>
                  <button type="submit" disabled={loading} className="btn-primary" style={{ cursor: loading ? 'wait' : 'pointer', border: 'none' }}>
                    {loading ? 'Procesando...' : 'Confirmar método'}
                  </button>
                </div>
              </form>
            )}

            {step === 3 && (
              <div>
                <h2 className="checkout-step-title">3. Pasarela de pago</h2>
                <p style={{ color: 'var(--muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                  Simulación de pago en línea. Selecciona el resultado para continuar.
                </p>

                <div className="payment-simulate-box">
                  <p style={{ margin: '0 0 0.5rem', color: 'var(--muted)', fontSize: '0.88rem' }}>Total a pagar</p>
                  <p style={{ margin: '0 0 1.5rem', fontSize: '1.8rem', fontWeight: 800, color: 'var(--text)' }}>
                    {order.currency} {order.total.toFixed(2)}
                  </p>

                  {processingPayment ? (
                    <p style={{ color: 'var(--muted)' }}>Procesando pago...</p>
                  ) : (
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handleSimulatePayment(true)}
                        className="btn-primary"
                        style={{ background: 'linear-gradient(135deg, #15803d 0%, #052e16 100%)', border: 'none', cursor: 'pointer' }}
                      >
                        Simular pago exitoso
                      </button>
                      <button
                        onClick={() => handleSimulatePayment(false)}
                        className="btn-secondary"
                        style={{ borderColor: '#fca5a5', color: '#b91c1c', cursor: 'pointer' }}
                      >
                        Simular pago fallido
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <aside className="checkout-summary-panel">
            <h3 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>Resumen del pedido</h3>

            <div className="checkout-summary-items">
              {order.items.map((item: any) => (
                <div key={item.productId} className="checkout-summary-item">
                  <span>{item.quantity}× {item.productName}</span>
                  <span>{order.currency} {item.lineTotal.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="checkout-total-row">
              <strong>Total</strong>
              <strong className="checkout-total-amount">{order.currency} {order.total.toFixed(2)}</strong>
            </div>
          </aside>
        </div>
      </section>
    </StorefrontContainer>
  );
}
