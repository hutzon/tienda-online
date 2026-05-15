import Link from 'next/link';
import { ProductCard } from '@/components/storefront/ProductCard';
import { StorefrontContainer } from '@/components/storefront/StorefrontContainer';
import { getAllProducts } from '@/lib/catalog';

export const metadata = {
  title: 'Catálogo',
};

export default async function CatalogPage() {
  const products = await getAllProducts();
  return (
    <StorefrontContainer className="section-stack" style={{ paddingTop: '2rem' }}>
      <section className="section-shell">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Catálogo</span>
            <h1>Todos los productos</h1>
          </div>
        </div>

        {products.length > 0 ? (
          <div className="product-grid">
            {products.map(product => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        ) : (
          <div className="empty-state" style={{ border: 'none', boxShadow: 'none', background: 'transparent' }}>
            <p>No hay productos disponibles en este momento. Vuelve pronto.</p>
            <div className="hero-actions" style={{ justifyContent: 'center' }}>
              <Link href="/" className="btn-secondary">Volver al inicio</Link>
            </div>
          </div>
        )}
      </section>
    </StorefrontContainer>
  );
}
