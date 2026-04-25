import Link from 'next/link';
import { StorefrontContainer } from '@/components/storefront/StorefrontContainer';

export default function NotFound() {
  return (
    <StorefrontContainer className="section-stack">
      <section className="empty-state">
        <span className="eyebrow">404</span>
        <h1>Esta ruta pública todavía no existe</h1>
        <p>
          La base del storefront solo expone las rutas necesarias para esta fase:
          inicio, catálogo, detalle placeholder, carrito y cuenta placeholder.
        </p>
        <div className="hero-actions">
          <Link href="/" className="btn-primary">
            Volver al inicio
          </Link>
          <Link href="/catalog" className="btn-secondary">
            Ver catálogo
          </Link>
        </div>
      </section>
    </StorefrontContainer>
  );
}
