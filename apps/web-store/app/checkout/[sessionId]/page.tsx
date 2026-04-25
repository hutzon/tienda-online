'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { StorefrontContainer } from '@/components/storefront/StorefrontContainer';
import { 
  getCheckoutSession, 
  updateCheckoutCustomer, 
  selectPaymentMethod, 
  simulatePayment,
  CheckoutSessionDetailResponse 
} from '@/lib/api/commerce';

export default function CheckoutPage({ params }: { params: { sessionId: string } }) {
  const router = useRouter();
  const sessionId = params.sessionId;
  
  const [session, setSession] = useState<CheckoutSessionDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 Form
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // Step 2 Form
  const [paymentMethod, setPaymentMethod] = useState<'OnlineSimulated' | 'CashOnDelivery'>('OnlineSimulated');

  // Step 3 (Payment)
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
      } catch (err: any) {
        setError(err.message || 'Error loading checkout session');
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
    } catch (err: any) {
      setError(err.message || 'Error saving customer data');
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
        // Cash on delivery completes immediately
        router.push(`/checkout/${sessionId}/success`);
      } else {
        setPaymentAttemptId(res.paymentAttemptId);
        setStep(3);
      }
    } catch (err: any) {
      setError(err.message || 'Error selecting payment method');
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
        router.push(`/checkout/${sessionId}/success`);
      } else {
        alert('El pago fue rechazado. Por favor intenta de nuevo.');
        setStep(2);
      }
    } catch (err: any) {
      setError(err.message || 'Error processing payment');
    } finally {
      setProcessingPayment(false);
    }
  };

  if (loading && !session) {
    return <StorefrontContainer><p style={{ padding: '2rem' }}>Cargando checkout...</p></StorefrontContainer>;
  }

  if (error || !session) {
    return <StorefrontContainer><p style={{ padding: '2rem', color: 'red' }}>{error || 'Sesión no encontrada'}</p></StorefrontContainer>;
  }

  const order = session.order;

  return (
    <StorefrontContainer className="section-stack">
      <section className="section-shell">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Checkout Seguro</span>
            <h1>Completa tu compra</h1>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          
          <div style={{ flex: '1 1 60%', background: '#fff', padding: '2rem', borderRadius: '8px', border: '1px solid #ddd' }}>
            
            {step === 1 && (
              <div>
                <h2>1. Información de Envío y Contacto</h2>
                <form onSubmit={handleCustomerSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Nombre Completo</label>
                    <input required type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Correo Electrónico</label>
                    <input required type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Teléfono</label>
                    <input required type="tel" value={phone} onChange={e => setPhone(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Dirección Exacta</label>
                    <textarea required value={address} onChange={e => setAddress(e.target.value)} rows={3} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }} />
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary" style={{ alignSelf: 'flex-start', padding: '0.75rem 2rem' }}>
                    {loading ? 'Guardando...' : 'Continuar al Pago'}
                  </button>
                </form>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2>2. Método de Pago</h2>
                <form onSubmit={handlePaymentMethodSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="paymentMethod" 
                      value="OnlineSimulated" 
                      checked={paymentMethod === 'OnlineSimulated'} 
                      onChange={() => setPaymentMethod('OnlineSimulated')} 
                    />
                    Pago en Línea (Tarjeta / Simulado)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="paymentMethod" 
                      value="CashOnDelivery" 
                      checked={paymentMethod === 'CashOnDelivery'} 
                      onChange={() => setPaymentMethod('CashOnDelivery')} 
                    />
                    Pago contra entrega (Efectivo)
                  </label>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button type="button" onClick={() => setStep(1)} className="btn-secondary" style={{ padding: '0.75rem 2rem' }}>
                      Atrás
                    </button>
                    <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '0.75rem 2rem' }}>
                      {loading ? 'Procesando...' : 'Confirmar Método'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {step === 3 && (
              <div>
                <h2>3. Pasarela de Pago Simulada</h2>
                <p style={{ marginTop: '1rem', color: '#666' }}>Esta es una simulación de un PSP externo. Selecciona el resultado deseado para continuar.</p>
                
                <div style={{ padding: '2rem', background: '#f5f5f5', borderRadius: '8px', marginTop: '1.5rem', textAlign: 'center' }}>
                  <h3>Total a pagar: {order.currency} {order.total.toFixed(2)}</h3>
                  
                  {processingPayment ? (
                    <p style={{ marginTop: '2rem' }}>Procesando tarjeta...</p>
                  ) : (
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
                      <button onClick={() => handleSimulatePayment(true)} className="btn-primary" style={{ background: '#2e7d32', color: 'white' }}>
                        Simular Pago Exitoso
                      </button>
                      <button onClick={() => handleSimulatePayment(false)} className="btn-secondary" style={{ background: '#c62828', color: 'white' }}>
                        Simular Pago Fallido
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>

          <div style={{ flex: '1 1 30%', background: '#fafafa', padding: '2rem', borderRadius: '8px', border: '1px solid #ddd', height: 'fit-content' }}>
            <h2>Resumen del Pedido</h2>
            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {order.items.map((item: any) => (
                <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{item.quantity}x {item.productName}</span>
                  <span>{order.currency} {item.lineTotal.toFixed(2)}</span>
                </div>
              ))}
              <hr style={{ border: 'none', borderTop: '1px solid #ddd' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.25rem' }}>
                <span>Total</span>
                <span>{order.currency} {order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

        </div>
      </section>
    </StorefrontContainer>
  );
}
