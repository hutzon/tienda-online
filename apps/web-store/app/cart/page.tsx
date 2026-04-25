import Link from 'next/link';
import { StorefrontContainer } from '@/components/storefront/StorefrontContainer';

export const metadata = {
  title: 'Carrito',
};

export default function CartPage() {
  return (
    <StorefrontContainer className="section-stack">
      <section className="section-shell">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Carrito placeholder</span>
            <h1>Carrito vacío por diseño en esta fase</h1>
            <p className="section-copy">
              Aquí irá el resumen real de artículos, cálculo de totales, promos y
              validaciones previas al checkout.
            </p>
          </div>
        </div>

        <div className="empty-state">
          <h2>Base lista para el flujo real</h2>
          <p>
            El carrito todavía no persiste estado ni llama a inventario. Esta vista
            existe para validar navegación pública y continuidad del storefront.
          </p>
          <div className="hero-actions">
            <Link href="/catalog" className="btn-primary">
              Ir al catálogo
            </Link>
            <Link href="/account" className="btn-secondary">
              Ver cuenta placeholder
            </Link>
          </div>
        </div>
      </section>
    </StorefrontContainer>
  );
}
