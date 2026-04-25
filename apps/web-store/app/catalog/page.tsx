import { ProductCard } from '@/components/storefront/ProductCard';
import { StorefrontContainer } from '@/components/storefront/StorefrontContainer';
import { getAllProducts } from '@/lib/catalog';

export const metadata = {
  title: 'Catálogo',
};

export default async function CatalogPage() {
  const products = await getAllProducts();
  return (
    <StorefrontContainer className="section-stack">
      <section className="section-shell">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Catálogo público</span>
            <h1>Catálogo base listo para conectar datos reales</h1>
            <p className="section-copy">
              Los productos mostrados aquí son placeholders tipados. La estructura
              ya está lista para reemplazarlos por catálogo real sin rehacer la UI.
            </p>
          </div>
        </div>

        <div className="product-grid">
          {products.map(product => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </section>
    </StorefrontContainer>
  );
}
