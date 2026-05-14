'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useCart } from '@/lib/cart/CartContext';
import { createCheckoutSession } from '@/lib/api/commerce';

export function CartView() {
  const { items, totalItems, subtotal, currency, removeItem, updateQuantity, clearCart } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);
    try {
      const session = await createCheckoutSession(
        items.map(i => ({ productId: i.productId, quantity: i.quantity }))
      );
      router.push(`/checkout/${session.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al iniciar checkout';
      setError(msg);
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="8" cy="21" r="1" />
            <circle cx="19" cy="21" r="1" />
            <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
          </svg>
        </div>
        <h2>Tu carrito está vacío</h2>
        <p>Agrega productos desde el catálogo para comenzar tu compra.</p>
        <div className="hero-actions" style={{ justifyContent: 'center', marginTop: '1.5rem' }}>
          <Link href="/catalog" className="btn-primary">
            Ir al catálogo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-layout">
      <div className="cart-items">
        <div className="cart-header-row">
          <h2>Tu carrito ({totalItems} {totalItems === 1 ? 'producto' : 'productos'})</h2>
          <button onClick={clearCart} className="cart-clear-btn">
            Vaciar carrito
          </button>
        </div>

        <div className="cart-items-list">
          {items.map(item => (
            <div key={item.productId} className="cart-item">
              <div className="cart-item-image">
                {item.primaryImageUrl ? (
                  <img src={item.primaryImageUrl} alt={item.name} />
                ) : (
                  <div className="cart-item-placeholder">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                      <circle cx="9" cy="9" r="2" />
                      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                    </svg>
                  </div>
                )}
              </div>

              <div className="cart-item-info">
                <Link href={`/product/${item.slug}`} className="cart-item-name">
                  {item.name}
                </Link>
                <p className="cart-item-unit-price">{item.currency} {item.price.toFixed(2)} c/u</p>
              </div>

              <div className="cart-item-qty">
                <button
                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                  className="qty-btn"
                  aria-label="Disminuir cantidad"
                >
                  −
                </button>
                <span className="qty-value">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                  className="qty-btn"
                  aria-label="Aumentar cantidad"
                >
                  +
                </button>
              </div>

              <div className="cart-item-subtotal">
                <strong>{item.currency} {(item.price * item.quantity).toFixed(2)}</strong>
              </div>

              <button
                onClick={() => removeItem(item.productId)}
                className="cart-item-remove"
                aria-label={`Eliminar ${item.name}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      <aside className="cart-summary">
        <h3>Resumen del pedido</h3>

        <div className="cart-summary-rows">
          {items.map(item => (
            <div key={item.productId} className="cart-summary-row">
              <span>{item.name} × {item.quantity}</span>
              <span>{item.currency} {(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="cart-summary-divider" />

        <div className="cart-total-row">
          <strong>Total</strong>
          <strong className="cart-total-amount">{currency} {subtotal.toFixed(2)}</strong>
        </div>

        {error && (
          <p className="cart-error">{error}</p>
        )}

        <button
          onClick={handleCheckout}
          disabled={loading}
          className="btn-primary"
          style={{ width: '100%', marginTop: '1.25rem', cursor: loading ? 'wait' : 'pointer', border: 'none' }}
        >
          {loading ? 'Procesando...' : 'Proceder al checkout'}
        </button>

        <Link href="/catalog" className="btn-secondary" style={{ width: '100%', marginTop: '0.75rem', textAlign: 'center', display: 'block' }}>
          Seguir comprando
        </Link>
      </aside>
    </div>
  );
}
