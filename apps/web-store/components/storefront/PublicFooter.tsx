import Link from 'next/link';
import { StorefrontContainer } from './StorefrontContainer';

export function PublicFooter() {
  return (
    <footer className="site-footer">
      <StorefrontContainer className="site-footer-inner">
        <div>
          <strong>TiendaOnline</strong>
          <p>
            Base pública inicial del storefront. Sin branding definitivo ni lógica
            comercial real todavía.
          </p>
        </div>

        <div className="footer-links">
          <Link href="/catalog">Catálogo</Link>
          <Link href="/cart">Carrito</Link>
          <Link href="/account">Cuenta</Link>
        </div>
      </StorefrontContainer>
    </footer>
  );
}
