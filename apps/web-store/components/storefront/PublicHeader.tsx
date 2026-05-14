import Link from 'next/link';
import { StorefrontContainer } from './StorefrontContainer';

import { UserIcon, ShoppingCartIcon } from './Icons';

const navigationItems = [
  { href: '/', label: 'Inicio', icon: null },
  { href: '/catalog', label: 'Catálogo', icon: null },
  { href: '/cart', label: 'Carrito', icon: <ShoppingCartIcon style={{ width: '1rem', height: '1rem', display: 'inline-block', marginRight: '4px' }} /> },
  { href: '/account', label: 'Cuenta', icon: <UserIcon style={{ width: '1rem', height: '1rem', display: 'inline-block', marginRight: '4px' }} /> },
];

export function PublicHeader() {
  return (
    <header className="site-header">
      <StorefrontContainer className="site-header-inner">
        <Link href="/" className="brand-mark">
          <span className="brand-kicker">TIENDA-ONLINE</span>
          <strong>Storefront</strong>
        </Link>

        <nav className="public-nav" aria-label="Navegación principal">
          {navigationItems.map(item => (
            <Link key={item.href} href={item.href} style={{ display: 'inline-flex', alignItems: 'center' }}>
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>
      </StorefrontContainer>
    </header>
  );
}
