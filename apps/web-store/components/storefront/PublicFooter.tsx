import Link from 'next/link';
import { StorefrontContainer } from './StorefrontContainer';

export function PublicFooter() {
  return (
    <footer className="site-footer">
      <StorefrontContainer className="site-footer-inner">
        <div>
          <strong>TiendaOnline</strong>
          <p>Tu tienda en línea. Catálogo, carrito y checkout.</p>
        </div>

        <div className="footer-links">
          <Link href="/catalog">Catálogo</Link>
          <Link href="/cart">Carrito</Link>
          <Link href="/account">Mi cuenta</Link>
        </div>
      </StorefrontContainer>
    </footer>
  );
}
