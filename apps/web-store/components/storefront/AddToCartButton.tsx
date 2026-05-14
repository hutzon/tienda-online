'use client';

import { useState } from 'react';
import { useCart } from '@/lib/cart/CartContext';

interface AddToCartButtonProps {
  productId: string;
  slug: string;
  name: string;
  price: number;
  currency: string;
  primaryImageUrl?: string;
  inStock: boolean;
  variant?: 'card' | 'detail';
}

export function AddToCartButton({
  productId,
  slug,
  name,
  price,
  currency,
  primaryImageUrl,
  inStock,
  variant = 'card',
}: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [feedback, setFeedback] = useState(false);

  if (!inStock) {
    return (
      <span className={variant === 'detail' ? 'btn-secondary' : 'card-link'} style={{ opacity: 0.5, cursor: 'not-allowed' }}>
        Agotado
      </span>
    );
  }

  const handleAdd = () => {
    addItem({ productId, slug, name, price, currency, primaryImageUrl });
    setFeedback(true);
    setTimeout(() => setFeedback(false), 1400);
  };

  if (variant === 'detail') {
    return (
      <button
        onClick={handleAdd}
        className={feedback ? 'btn-secondary btn-added' : 'btn-primary'}
        style={{ width: '100%', cursor: 'pointer', border: 'none' }}
      >
        {feedback ? '✓ Agregado al carrito' : 'Agregar al carrito'}
      </button>
    );
  }

  return (
    <button
      onClick={handleAdd}
      className={feedback ? 'card-link-added' : 'card-link'}
      style={{ cursor: 'pointer', border: 'none', background: 'none' }}
    >
      {feedback ? '✓ Agregado' : '+ Agregar'}
    </button>
  );
}
