'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCheckoutSession, PublicCatalogProductSummary } from '@/lib/api/commerce';

interface CartOrderBaseProps {
  products: PublicCatalogProductSummary[];
}

export function CartOrderBase({ products }: CartOrderBaseProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!selectedProductId) throw new Error('Debes seleccionar un producto.');
      const session = await createCheckoutSession([
        { productId: selectedProductId, quantity: 1 }
      ]);
      router.push(`/checkout/${session.id}`);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar checkout');
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#f5f5f5', borderRadius: '8px' }}>
      <h3>Simulación de pedido base</h3>
      <p>Selecciona un producto disponible para crear una orden simple (1 unidad).</p>
      <form onSubmit={handleCheckout} style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <select 
          value={selectedProductId} 
          onChange={e => setSelectedProductId(e.target.value)}
          style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
        >
          {products.filter(p => p.inStock).map(p => (
            <option key={p.id} value={p.id}>{p.name} - {p.currency} {p.price.toFixed(2)}</option>
          ))}
        </select>
        <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '0.5rem 1rem' }}>
          {loading ? 'Iniciando...' : 'Ir al Checkout'}
        </button>
      </form>
      
      {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}
    </div>
  );
}
