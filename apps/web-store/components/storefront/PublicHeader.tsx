import Link from 'next/link';
import { StorefrontContainer } from './StorefrontContainer';

const navigationItems = [
  { href: '/', label: 'Inicio' },
  { href: '/catalog', label: 'Catálogo' },
  { href: '/cart', label: 'Carrito' },
  { href: '/account', label: 'Cuenta' },
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
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
      </StorefrontContainer>
    </header>
  );
}
