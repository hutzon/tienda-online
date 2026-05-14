'use client';

import Link from 'next/link';
import { useCart } from '@/lib/cart/CartContext';
import { StorefrontContainer } from './StorefrontContainer';
import { ShoppingCartIcon, UserIcon } from './Icons';

export function PublicHeader() {
  const { totalItems } = useCart();

  return (
    <header className="site-header">
      <StorefrontContainer className="site-header-inner">
        <Link href="/" className="brand-mark">
          <span className="brand-kicker">TIENDA-ONLINE</span>
          <strong>Mi Tienda</strong>
        </Link>

        <nav className="public-nav" aria-label="Navegación principal">
          <Link href="/">Inicio</Link>
          <Link href="/catalog">Catálogo</Link>
          <Link href="/cart" className="nav-cart-link">
            <ShoppingCartIcon style={{ width: '1rem', height: '1rem' }} />
            <span>Carrito</span>
            {totalItems > 0 && (
              <span className="cart-badge">{totalItems > 99 ? '99+' : totalItems}</span>
            )}
          </Link>
          <Link href="/account" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <UserIcon style={{ width: '1rem', height: '1rem' }} />
            <span>Cuenta</span>
          </Link>
        </nav>
      </StorefrontContainer>
    </header>
  );
}
