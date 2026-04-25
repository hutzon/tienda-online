import Link from 'next/link';
import { StorefrontContainer } from '@/components/storefront/StorefrontContainer';
import { CartOrderBase } from '@/components/storefront/CartOrderBase';
import { getAllProducts } from '@/lib/catalog';

export const metadata = {
  title: 'Carrito',
};

export default async function CartPage() {
  const products = await getAllProducts();

  return (
    <StorefrontContainer className="section-stack">
      <section className="section-shell">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Carrito base</span>
            <h1>Simulación de carrito en esta fase</h1>
            <p className="section-copy">
              Aquí puedes crear un pedido inicial conectando el catálogo real con el módulo de pedidos del backend.
            </p>
          </div>
        </div>

        <div className="empty-state">
          <h2>Base lista para el flujo real</h2>
          <p>
            El carrito todavía no persiste estado múltiple. Utiliza el formulario abajo para crear un pedido de prueba.
          </p>

          <CartOrderBase products={products} />

          <div className="hero-actions" style={{ marginTop: '2rem' }}>
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
